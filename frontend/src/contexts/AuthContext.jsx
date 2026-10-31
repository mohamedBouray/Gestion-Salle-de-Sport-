import {createContext, useContext, useEffect, useState, } from "react";
import { checkSetup, getMe, loginUser, registerUser, logoutUser,} from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isSetup, setIsSetup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // INITIAL AUTH CHECK
    useEffect(() => {
        let active = true;

        const initialize = async () => {
            try {
                const setup = await checkSetup();
                let currentUser = null;
                if (setup.is_setup) {
                    try {
                        const data = await getMe();
                        currentUser = data.user;
                    } catch (err) {
                        if (![401, 403].includes(err.response?.status)) {
                            throw err;
                        }
                    }
                }
                if (!active) return;

                setIsSetup(setup.is_setup);
                setUser(currentUser);
                setError("");

            } catch (err) {
                if (active) {
                    setError("Cannot connect to the server.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        initialize();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
        };

        window.addEventListener(
            "auth:unauthorized",
            handleUnauthorized
        );

        return () => {
            window.removeEventListener(
                "auth:unauthorized",
                handleUnauthorized
            );
        };
    }, []);

    // LOGIN
    const login = async (formData) => {
        const data = await loginUser(formData);
        setUser(data.user);
        return data.user;
    };

    // REGISTER
    const register = async (formData) => {
        const data = await registerUser(formData);
        setUser(data.user);
        if (data.user.role === "admin") {
            setIsSetup(true);
        }
        return data.user;
    };

    // LOGOUT
    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    // REFRESH AUTHENTICATED USER
    const refreshUser = async () => {
        try {
            const data = await getMe();
            setUser(data.user);

            return data.user;
        } catch (err) {
            if ([401, 403].includes(err.response?.status)) {
                setUser(null);
            }
            throw err;
        }
    };

    // COMPATIBILITY WITH EXISTING COMPONENTS
    const signIn = (authenticatedUser) => {
        setUser(authenticatedUser);
    };

    const completeSetup = (admin) => {
        setIsSetup(true);
        setUser(admin);
    };

    const signOut = () => {
        setUser(null);
    };

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-red-500">{error}</p>

                <button onClick={() => window.location.reload()}
                    className="rounded bg-blue-600 px-4 py-2 text-white">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isSetup,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
                signIn,
                signOut,
                completeSetup,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}
