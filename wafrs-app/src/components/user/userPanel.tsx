import { useEffect, useState, type FormEvent } from "react";
import { FaCircleUser, FaRightFromBracket, FaXmark } from "react-icons/fa6";
import { getCurrentUser, loginUser, registerUser, type User } from "../../api/auth-api";
import "./userPanel.css";

type AuthMode = "login" | "register";

const AUTH_TOKEN_KEY = "wafrs_auth_token";

function UserPanel() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
            return;
        }

        getCurrentUser(token)
            .then(setUser)
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
            });
    }, []);

    function openAuth(mode: AuthMode) {
        setAuthMode(mode);
        setError(null);
        setPassword("");
        setIsAuthOpen(true);
    }

    function closeAuth() {
        setIsAuthOpen(false);
        setError(null);
        setPassword("");
    }

    function logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (authMode === "register") {
                await registerUser(email, password);
            }

            const { token } = await loginUser(email, password);
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            const currentUser = await getCurrentUser(token);
            setUser(currentUser);
            closeAuth();
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Помилка авторизації");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <section className="userPanel">
            <button
                className="userPanel_iconButton"
                type="button"
                onClick={() => {
                    if (!user) {
                        openAuth("login");
                    }
                }}
                aria-label={user ? "Профіль користувача" : "Увійти"}
                title={user ? user.email : "Увійти"}
            >
                <FaCircleUser className="user-icon" />
            </button>

            {user && (
                <div className="userPanel_menu">
                    <span className="userPanel_email">{user.email}</span>
                    <button
                        className="userPanel_logout"
                        type="button"
                        onClick={logout}
                        aria-label="Вийти"
                        title="Вийти"
                    >
                        <FaRightFromBracket />
                    </button>
                </div>
            )}

            {isAuthOpen && (
                <div className="authModal_overlay" role="presentation" onMouseDown={closeAuth}>
                    <div
                        className="authModal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-modal-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="authModal_header">
                            <h2 id="auth-modal-title">
                                {authMode === "login" ? "Вхід" : "Реєстрація"}
                            </h2>
                            <button
                                className="authModal_close"
                                type="button"
                                onClick={closeAuth}
                                aria-label="Закрити"
                                title="Закрити"
                            >
                                <FaXmark />
                            </button>
                        </div>

                        <div className="authModal_tabs" role="tablist" aria-label="Авторизація">
                            <button
                                className={authMode === "login" ? "authModal_tab authModal_tab--active" : "authModal_tab"}
                                type="button"
                                onClick={() => {
                                    setAuthMode("login");
                                    setError(null);
                                }}
                            >
                                Увійти
                            </button>
                            <button
                                className={authMode === "register" ? "authModal_tab authModal_tab--active" : "authModal_tab"}
                                type="button"
                                onClick={() => {
                                    setAuthMode("register");
                                    setError(null);
                                }}
                            >
                                Зареєструватися
                            </button>
                        </div>

                        <form className="authModal_form" onSubmit={handleSubmit}>
                            <label className="authModal_field">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </label>

                            <label className="authModal_field">
                                <span>Пароль</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                                    required
                                />
                            </label>

                            {error && <p className="authModal_error">{error}</p>}

                            <button className="authModal_submit" type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "Зачекайте..."
                                    : authMode === "login"
                                        ? "Увійти"
                                        : "Зареєструватися"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
export default UserPanel;
