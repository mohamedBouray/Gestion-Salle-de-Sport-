import api, { getCsrfCookie } from "./api";

const data = (response) => response.data;

export const memberApi = {
    list: (params = {}) => api.get("/api/admin/members", { params }).then(data),
    show: (id) => api.get(`/api/admin/members/${id}`).then(data),

    async create(payload) {
        await getCsrfCookie();
        return api.post("/api/admin/members", payload).then(data);
    },

    async update(id, payload) {
        await getCsrfCookie();
        return api.put(`/api/admin/members/${id}`, payload).then(data);
    },

    async remove(id) {
        await getCsrfCookie();
        return api.delete(`/api/admin/members/${id}`).then(data);
    },

    async resendInvitation(id) {
        await getCsrfCookie();
        return api.post(`/api/admin/members/${id}/resend-invitation`).then(data);
    },
};

export function apiError(error) {
    const status = error.response?.status;
    if (status === 401 || status === 419) return "Session expirée. Reconnectez-vous.";
    if (status === 403) return "Accès refusé : rôle administrateur requis.";
    if (status === 422) {
        const errors = error.response?.data?.errors;
        if (errors) return Object.values(errors).flat().join(" ");
    }
    return error.response?.data?.message || "Une erreur est survenue. Réessayez.";
}
