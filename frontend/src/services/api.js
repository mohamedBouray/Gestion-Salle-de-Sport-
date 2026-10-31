import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000",
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// Get CSRF Cookie before authentication requests
export const getCsrfCookie = async () => {
    await api.get("/sanctum/csrf-cookie");
};

api.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;

        const path = (error.config?.url || "")
            .split("?")[0];

        const publicRoutes = [ "/api/login", "/api/register",
            "/api/forgot-password",
            "/api/reset-password",
            "/api/setup-status",
            "/sanctum/csrf-cookie",
        ];

        const isPublic = publicRoutes.includes(path);
        if (
            !isPublic &&
            (status === 401 || status === 419)
        ) {
            window.dispatchEvent(
                new Event("auth:unauthorized")
            );
        }
        return Promise.reject(error);
    }
);

export default api;
