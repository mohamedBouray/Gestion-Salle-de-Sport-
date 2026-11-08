import axios from "axios";

// ========================================
// AXIOS CONFIGURATION
// ========================================

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
    withCredentials: true,
    withXSRFToken: true,

    headers: {
        Accept: "application/json",
    },
});

// ========================================
// CSRF COOKIE (LARAVEL SANCTUM)
// ========================================

export async function getCsrfCookie() {
    await api.get("/sanctum/csrf-cookie");
}

// ========================================
// API ERROR HANDLING
// ========================================

export function apiError(error) {
    const status = error.response?.status;
    const response = error.response?.data;

    if (response?.code === "ACCOUNT_INACTIVE") {
        return "Votre compte a été désactivé.";
    }

    if (status === 401 || status === 419) {
        return "Session expirée. Reconnectez-vous.";
    }

    if (status === 403) {
        return "Vous n'avez pas la permission d'effectuer cette action.";
    }

    if (status === 422) {
        const errors = response?.errors;

        if (errors) {
            return Object.values(errors)
                .flat()
                .join(" ");
        }
    }

    return response?.message ||
        "Une erreur est survenue. Réessayez.";
}

// ========================================
// RESPONSE INTERCEPTOR
// ========================================

api.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        const path = (error.config?.url || "").split("?")[0];

        const publicRoutes = [
            "/api/login",
            "/api/register",
            "/api/forgot-password",
            "/api/reset-password",
            "/api/accept-invitation",
            "/api/setup-status",
            "/sanctum/csrf-cookie",
        ];

        const isPublicRoute = publicRoutes.includes(path);

        if (
            !isPublicRoute &&
            (
                status === 401 ||
                status === 419 ||
                code === "ACCOUNT_INACTIVE"
            )
        ) {
            window.dispatchEvent(
                new Event("auth:unauthorized")
            );
        }

        return Promise.reject(error);
    }
);

// ========================================
// EXPORT
// ========================================

export default api;
