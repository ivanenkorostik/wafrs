package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authClaims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

type contextKey string

const userContextKey contextKey = "user"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatal("failed to open database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("failed to connect to database:", err)
	}

	fmt.Println("database connected")

	if err := initSchema(db); err != nil {
		log.Fatal("failed to initialize database schema:", err)
	}

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	http.HandleFunc("/api/db-check", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			http.Error(w, `{"database":"error"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"database":"ok"}`)
	})

	http.HandleFunc("/auth/register", registerHandler(db))
	http.HandleFunc("/auth/login", loginHandler(db, jwtSecret))
	http.HandleFunc("/me", authMiddleware(jwtSecret, meHandler()))

	fmt.Println("server started on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func initSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	return err
}

func registerHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		req, ok := decodeAuthRequest(w, r)
		if !ok {
			return
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to hash password")
			return
		}

		var user User
		err = db.QueryRow(
			`INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
			req.Email,
			string(passwordHash),
		).Scan(&user.ID, &user.Email, &user.CreatedAt)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") {
				writeError(w, http.StatusConflict, "user with this email already exists")
				return
			}

			writeError(w, http.StatusInternalServerError, "failed to create user")
			return
		}

		writeJSON(w, http.StatusCreated, user)
	}
}

func loginHandler(db *sql.DB, jwtSecret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		req, ok := decodeAuthRequest(w, r)
		if !ok {
			return
		}

		var user User
		err := db.QueryRow(
			`SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
			req.Email,
		).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusUnauthorized, "invalid email or password")
				return
			}

			writeError(w, http.StatusInternalServerError, "failed to find user")
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			writeError(w, http.StatusUnauthorized, "invalid email or password")
			return
		}

		token, err := createToken(user, jwtSecret)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create token")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"token": token})
	}
}

func meHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		user, ok := r.Context().Value(userContextKey).(User)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		writeJSON(w, http.StatusOK, map[string]any{
			"id":    user.ID,
			"email": user.Email,
		})
	}
}

func authMiddleware(jwtSecret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		tokenString, ok := strings.CutPrefix(authHeader, "Bearer ")
		if !ok || tokenString == "" {
			writeError(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}

		claims := &authClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}

			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		user := User{
			ID:    claims.UserID,
			Email: claims.Email,
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func createToken(user User, jwtSecret string) (string, error) {
	claims := authClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func decodeAuthRequest(w http.ResponseWriter, r *http.Request) (authRequest, bool) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json")
		return req, false
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return req, false
	}

	if req.Password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return req, false
	}

	return req, true
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Println("failed to write json response:", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
