
import api, { getCsrfCookie, resetCsrfCookie } from "./api";

// ========================================
// HELPERS
// ========================================

const data = (response) => response.data;

const post = async (url, payload = {}) => {
    await getCsrfCookie(true);
    try {
        return await api.post(url, payload).then(data);
    } finally {
        resetCsrfCookie();
    }
};

const put = async (url, payload = {}) => {
    await getCsrfCookie();
    return api.put(url, payload).then(data);
};

// ========================================
// SETUP & AUTHENTICATION
// ========================================

export const checkSetup = () =>
    api.get("/api/setup-status").then(data);

export const getMe = () =>
    api.get("/api/me").then(data);

export const registerUser = (payload) =>
    post("/api/register", payload);

export const loginUser = (payload) =>
    post("/api/login", payload);

export const logoutUser = () =>
    post("/api/logout");

// ========================================
// PASSWORD RECOVERY
// ========================================

export const forgotPassword = (email) =>
    post("/api/forgot-password", { email });

export const resetPassword = (payload) =>
    post("/api/reset-password", payload);

// ========================================
// INVITATIONS
// ========================================

export const acceptInvitation = (payload) =>
    post("/api/accept-invitation", payload);

export const invitationApi = {
    accept: acceptInvitation,
};

// ========================================
// PROFILE
// ========================================

export const updateProfile = (payload) =>
    put("/api/profile", payload);

export const changePassword = (payload) =>
    put("/api/change-password", payload);

// ========================================
// ERROR HANDLING
// ========================================

export { apiError } from "./api";
