import api, { getCsrfCookie } from "./api";

const data = (res) => res.data;
const csrf = () => getCsrfCookie();

// Members
const members = {
    list: (params = {}) =>
        api.get("/api/admin/members", { params }).then(data),

    show: (id) =>
        api.get(`/api/admin/members/${id}`).then(data),

    async create(payload) {
        await csrf();
        return api.post("/api/admin/members", payload).then(data);
    },

    async update(id, payload) {
        await csrf();
        return api.put(`/api/admin/members/${id}`, payload).then(data);
    },

    async changeStatus(id, status) {
        if (!["active", "inactive"].includes(status)) {
            throw new Error("Statut invalide.");
        }

        await csrf();
        return api.put(`/api/admin/members/${id}`, { status }).then(data);
    },

    async remove(id) {
        await csrf();
        return api.delete(`/api/admin/members/${id}`).then(data);
    },

    async resendInvitation(id) {
        await csrf();
        return api.post(`/api/admin/members/${id}/resend-invitation`).then(data);
    },
};

// Coaches
const coaches = {
    list: (params = {}) =>
        api.get("/api/admin/coaches", { params }).then(data),

    show: (id) =>
        api.get(`/api/admin/coaches/${id}`).then(data),

    async create(payload) {
        await csrf();

        const config = payload instanceof FormData
            ? { headers: { "Content-Type": undefined } }
            : {};

        return api.post("/api/admin/coaches", payload, config).then(data);
    },

    async update(id, payload) {
        await csrf();

        if (payload instanceof FormData) {
            const form = new FormData();

            for (const [key, value] of payload.entries()) {
                form.append(key, value);
            }

            form.set("_method", "PUT");

            return api.post(`/api/admin/coaches/${id}`, form, {
                headers: { "Content-Type": undefined },
            }).then(data);
        }

        return api.put(`/api/admin/coaches/${id}`, payload).then(data);
    },
    
    async changeStatus(id, status) {
        if (!["active", "inactive"].includes(status)) {
            throw new Error("Statut invalide.");
        }

        await csrf();
        return api.put(`/api/admin/coaches/${id}`, { status }).then(data);
    },

    async remove(id) {
        await csrf();
        return api.delete(`/api/admin/coaches/${id}`).then(data);
    },

    async resendInvitation(id) {
        await csrf();
        return api.post(`/api/admin/coaches/${id}/resend-invitation`).then(data);
    },
};



// Dashboard
const dashboard = {
    get: () => api.get("/api/admin/dashboard").then(data),
};



 // Landing Page Settings
const siteSettings = {
    get: () =>
        api.get("/api/admin/site-settings").then(data),

    async update(settings) {
        await csrf();

        return api.put("/api/admin/site-settings", {
            settings,
        }).then(data);
    },

    async uploadImage(key, image) {
        await csrf();

        const form = new FormData();
        form.append("key", key);
        form.append("image", image);

        return api.post(
            "/api/admin/site-settings/image",
            form
        ).then(data);
    },
};



export const adminApi = { dashboard, members, coaches ,siteSettings};

export { apiError } from "./api";
export default adminApi;
