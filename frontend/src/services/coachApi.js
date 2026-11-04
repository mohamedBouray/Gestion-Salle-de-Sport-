import api, { getCsrfCookie } from "./api";

const data = (response) => response.data;
const uploadConfig = { headers: { "Content-Type": undefined } };

export const coachApi = {
    list: (params = {}) => api.get("/api/admin/coaches", { params }).then(data),
    show: (id) => api.get(`/api/admin/coaches/${id}`).then(data),

    async create(payload) {
        await getCsrfCookie();
        return api.post("/api/admin/coaches", payload, uploadConfig).then(data);
    },

    async update(id, payload) {
        await getCsrfCookie();
        payload.set("_method", "PUT"); // Multipart form: Laravel recognizes method spoofing.
        return api.post(`/api/admin/coaches/${id}`, payload, uploadConfig).then(data);
    },

    async remove(id) {
        await getCsrfCookie();
        return api.delete(`/api/admin/coaches/${id}`).then(data);
    },

    async resendInvitation(id) {
        await getCsrfCookie();
        return api.post(`/api/admin/coaches/${id}/resend-invitation`).then(data);
    },
};
