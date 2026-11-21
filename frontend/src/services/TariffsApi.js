
import api, { getCsrfCookie } from "./api";

const unwrap = ({ data }) => data;

export const tariffsApi = {
  list: (params = {}) =>
    api.get("/api/admin/tariffs", { params }).then(unwrap),

  async create(payload) {
    await getCsrfCookie();
    return api.post("/api/admin/tariffs", payload).then(unwrap);
  },

  async update(id, payload) {
    await getCsrfCookie();
    return api.put(`/api/admin/tariffs/${id}`, payload).then(unwrap);
  },

  async changeStatus(id, status) {
    if (!["active", "inactive"].includes(status)) {
      throw new Error("Statut invalide.");
    }

    await getCsrfCookie();
    return api
      .patch(`/api/admin/tariffs/${id}/status`, { status })
      .then(unwrap);
  },
};
