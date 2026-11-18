
import api, { getCsrfCookie } from "./api";

const data = (response) => response.data;
const csrf = () => getCsrfCookie();

export const coursesApi = {
    // Liste + recherche + pagination + statistiques
    list: (params = {}) =>
        api.get("/api/admin/courses", { params }).then(data),

    // Détails du cours
    show: (id) =>
        api.get(`/api/admin/courses/${id}`).then(data),

    // Création avec image optionnelle
    async create(payload) {
        await csrf();

        return api.post(
            "/api/admin/courses",
            payload
        ).then(data);
    },

    // Modification du cours
    async update(id, payload) {
        await csrf();

        if (payload instanceof FormData) {
            const form = new FormData();

            for (const [key, value] of payload.entries()) {
                form.append(key, value);
            }

            // Laravel : upload multipart + PUT
            form.set("_method", "PUT");

            return api.post(
                `/api/admin/courses/${id}`,
                form
            ).then(data);
        }

        return api.put(
            `/api/admin/courses/${id}`,
            payload
        ).then(data);
    },

    // Activer / Désactiver
    async changeStatus(id, status) {
        if (!["active", "inactive"].includes(status)) {
            throw new Error("Statut du cours invalide.");
        }

        await csrf();

        return api.put(
            `/api/admin/courses/${id}`,
            { status }
        ).then(data);
    },

    // Archivage (Soft Delete)
    async remove(id) {
        await csrf();

        return api.delete(
            `/api/admin/courses/${id}`
        ).then(data);
    },

    // Export Excel géré par Laravel
    exportExcel: (params = {}) =>
        api.get("/api/admin/courses/export", {
            params,
            responseType: "blob",
        }).then(data),
};

export default coursesApi;
