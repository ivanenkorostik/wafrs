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
type Vehicle struct {
	ID       int64   `json:"id"`
	UserID   int64   `json:"user_id"`
	Model    string  `json:"model"`
	FuelAvg  float64 `json:"fuel_avg"`
	FuelCity float64 `json:"fuel_city"`
	FuelType string  `json:"fuel_type"`
}
type VehicleRequest struct {
	Model    string  `json:"model"`
	FuelAvg  float64 `json:"fuel_avg"`
	FuelCity float64 `json:"fuel_city"`
	FuelType string  `json:"fuel_type"`
}
type SavedRoute struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	StartLocation  string    `json:"start_location"`
	FinishLocation string    `json:"finish_location"`
	Distance       string    `json:"distance"`
	Duration       string    `json:"duration"`
	Fuel           string    `json:"fuel"`
	SavedAt        time.Time `json:"saved_at"`
}

type SavedRouteRequest struct {
	StartLocation  string `json:"start_location"`
	FinishLocation string `json:"finish_location"`
	Distance       string `json:"distance"`
	Duration       string `json:"duration"`
	Fuel           string `json:"fuel"`
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

	savedRoutesHandlerWithAuth := authMiddleware(jwtSecret, savedRoutesHandler(db))
	vehiclesHandlerWithAuth := authMiddleware(jwtSecret, saveVehiclesHandler(db))
	meHandlerWithAuth := authMiddleware(jwtSecret, meHandler())

	http.HandleFunc("/auth/register", registerHandler(db))
	http.HandleFunc("/auth/login", loginHandler(db, jwtSecret))
	http.HandleFunc("/my-vehicles", vehiclesHandlerWithAuth)
	http.HandleFunc("/api/saved-routes", savedRoutesHandlerWithAuth)
	http.HandleFunc("/api/saved-routes/", savedRoutesHandlerWithAuth)
	http.HandleFunc("/saved-routes", savedRoutesHandlerWithAuth)
	http.HandleFunc("/saved-routes/", savedRoutesHandlerWithAuth)
	http.HandleFunc("/me", meHandlerWithAuth)

	fmt.Println("server started on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, corsMiddleware(http.DefaultServeMux)))
}

func initSchema(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS vehicles (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			model TEXT NOT NULL,
			fuel_avg DOUBLE PRECISION NOT NULL,
			fuel_city DOUBLE PRECISION NOT NULL,
			fuel_type TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS saved_routes (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			start_location TEXT NOT NULL,
			finish_location TEXT NOT NULL,
			distance TEXT NOT NULL DEFAULT '',
			duration TEXT NOT NULL DEFAULT '',
			fuel TEXT NOT NULL DEFAULT '',
			saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(user_id, start_location, finish_location)
		);
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

func corsMiddleware(next http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"http://206.81.23.12:8081": true,
		"http://localhost:5173":    true,
		"http://127.0.0.1:5173":    true,
	}

	if origins := os.Getenv("CORS_ALLOWED_ORIGINS"); origins != "" {
		allowedOrigins = map[string]bool{}
		for _, origin := range strings.Split(origins, ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				allowedOrigins[origin] = true
			}
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
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

// HANDLER FOR SAVING VEHICLE DATA
func saveVehiclesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(userContextKey).(User)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		if r.Method == http.MethodGet {
			rows, err := db.Query(
				`SELECT id, user_id, model, fuel_avg, fuel_city, fuel_type
				FROM vehicles
				WHERE user_id = $1
				ORDER BY id DESC`,
				user.ID,
			)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to get vehicles")
				return
			}
			defer rows.Close()

			vehicles := []Vehicle{}

			for rows.Next() {
				var vehicle Vehicle
				err := rows.Scan(
					&vehicle.ID,
					&vehicle.UserID,
					&vehicle.Model,
					&vehicle.FuelAvg,
					&vehicle.FuelCity,
					&vehicle.FuelType,
				)
				if err != nil {
					writeError(w, http.StatusInternalServerError, "failed to read vehicle")
					return
				}

				vehicles = append(vehicles, vehicle)
			}

			writeJSON(w, http.StatusOK, vehicles)
			return
		}

		if r.Method != http.MethodPost {
			writeError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}

		var req VehicleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}

		req.Model = strings.TrimSpace(req.Model)
		req.FuelType = strings.TrimSpace(req.FuelType)

		if req.Model == "" {
			writeError(w, http.StatusBadRequest, "model is required")
			return
		}

		if req.FuelType == "" {
			writeError(w, http.StatusBadRequest, "fuel type is required")
			return
		}

		if req.FuelAvg <= 0 || req.FuelCity <= 0 {
			writeError(w, http.StatusBadRequest, "fuel values must be greater than zero")
			return
		}

		var vehicle Vehicle
		err := db.QueryRow(
			`INSERT INTO vehicles (user_id, model, fuel_avg, fuel_city, fuel_type)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id, user_id, model, fuel_avg, fuel_city, fuel_type`,
			user.ID,
			req.Model,
			req.FuelAvg,
			req.FuelCity,
			req.FuelType,
		).Scan(
			&vehicle.ID,
			&vehicle.UserID,
			&vehicle.Model,
			&vehicle.FuelAvg,
			&vehicle.FuelCity,
			&vehicle.FuelType,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to save vehicle")
			return
		}

		writeJSON(w, http.StatusCreated, vehicle)
	}
}

func savedRoutesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(userContextKey).(User)
		if !ok {
			writeError(w, http.StatusUnauthorized, "unauthorized")
			return
		}

		if r.Method == http.MethodGet {
			rows, err := db.Query(
				`SELECT id, user_id, start_location, finish_location, distance, duration, fuel, saved_at
				 FROM saved_routes
				 WHERE user_id = $1
				 ORDER BY saved_at DESC`,
				user.ID,
			)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to get saved routes")
				return
			}
			defer rows.Close()

			savedRoutes := []SavedRoute{}

			for rows.Next() {
				var route SavedRoute
				err := rows.Scan(
					&route.ID,
					&route.UserID,
					&route.StartLocation,
					&route.FinishLocation,
					&route.Distance,
					&route.Duration,
					&route.Fuel,
					&route.SavedAt,
				)
				if err != nil {
					writeError(w, http.StatusInternalServerError, "failed to read saved route")
					return
				}

				savedRoutes = append(savedRoutes, route)
			}

			writeJSON(w, http.StatusOK, savedRoutes)
			return
		}

		if r.Method == http.MethodPost {
			var req SavedRouteRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				writeError(w, http.StatusBadRequest, "invalid json")
				return
			}

			req.StartLocation = strings.TrimSpace(req.StartLocation)
			req.FinishLocation = strings.TrimSpace(req.FinishLocation)
			req.Distance = strings.TrimSpace(req.Distance)
			req.Duration = strings.TrimSpace(req.Duration)
			req.Fuel = strings.TrimSpace(req.Fuel)

			if req.StartLocation == "" {
				writeError(w, http.StatusBadRequest, "start location is required")
				return
			}

			if req.FinishLocation == "" {
				writeError(w, http.StatusBadRequest, "finish location is required")
				return
			}

			var route SavedRoute
			err := db.QueryRow(
				`INSERT INTO saved_routes
				 (user_id, start_location, finish_location, distance, duration, fuel)
				 VALUES ($1, $2, $3, $4, $5, $6)
				 RETURNING id, user_id, start_location, finish_location, distance, duration, fuel, saved_at`,
				user.ID,
				req.StartLocation,
				req.FinishLocation,
				req.Distance,
				req.Duration,
				req.Fuel,
			).Scan(
				&route.ID,
				&route.UserID,
				&route.StartLocation,
				&route.FinishLocation,
				&route.Distance,
				&route.Duration,
				&route.Fuel,
				&route.SavedAt,
			)
			if err != nil {
				if strings.Contains(err.Error(), "duplicate key") {
					writeError(w, http.StatusConflict, "route already saved")
					return
				}

				writeError(w, http.StatusInternalServerError, "failed to save route")
				return
			}

			writeJSON(w, http.StatusCreated, route)
			return
		}

		if r.Method == http.MethodDelete {
			idPart := strings.TrimPrefix(r.URL.Path, "/api/saved-routes/")
			if idPart == r.URL.Path {
				idPart = strings.TrimPrefix(r.URL.Path, "/saved-routes/")
			}
			if idPart == "" || idPart == r.URL.Path {
				writeError(w, http.StatusBadRequest, "route id is required")
				return
			}

			var routeID int64
			_, err := fmt.Sscanf(idPart, "%d", &routeID)
			if err != nil || routeID <= 0 {
				writeError(w, http.StatusBadRequest, "invalid route id")
				return
			}

			result, err := db.Exec(
				`DELETE FROM saved_routes
				 WHERE id = $1 AND user_id = $2`,
				routeID,
				user.ID,
			)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to delete route")
				return
			}

			rowsAffected, err := result.RowsAffected()
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to delete route")
				return
			}

			if rowsAffected == 0 {
				writeError(w, http.StatusNotFound, "saved route not found")
				return
			}

			writeJSON(w, http.StatusOK, map[string]bool{"success": true})
			return
		}

		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
