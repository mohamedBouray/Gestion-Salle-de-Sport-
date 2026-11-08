import api, { getCsrfCookie } from "./api";

const data = (response) => response.data;

// ========================================
// SETUP & AUTHENTICATION
// ========================================

export const checkSetup = () =>
    api.get("/api/setup-status").then(data);

export const getMe = () =>
    api.get("/api/me").then(data);

export async function registerUser(payload) {
    await getCsrfCookie();

    return api.post("/api/register", payload).then(data);
}

export async function loginUser(payload) {
    await getCsrfCookie();

    return api.post("/api/login", payload).then(data);
}

export async function logoutUser() {
    await getCsrfCookie();

    return api.post("/api/logout").then(data);
}

// ========================================
// PASSWORD
// ========================================

export async function forgotPassword(email) {
    await getCsrfCookie();

    return api.post("/api/forgot-password", {
        email,
    }).then(data);
}

export async function resetPassword(payload) {
    await getCsrfCookie();

    return api.post("/api/reset-password", payload).then(data);
}

// ========================================
// INVITATIONS
// ========================================

export async function acceptInvitation(payload) {
    await getCsrfCookie();

    return api.post("/api/accept-invitation", payload).then(data);
}

// Compatibility with existing ActivateAccount
export const invitationApi = {
    accept: acceptInvitation,
};

// ========================================
// PROFILE
// ========================================

export async function updateProfile(payload) {
    await getCsrfCookie();

    return api.put("/api/profile", payload).then(data);
}

export async function changePassword(payload) {
    await getCsrfCookie();

    return api.put("/api/change-password", payload).then(data);
}

export { apiError } from "./api";
