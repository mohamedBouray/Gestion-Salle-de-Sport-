
import api, { getCsrfCookie } from "./api";

const unwrap = ({ data }) => data;

export const membershipsApi = {
  list: (params = {}, signal) =>
    api.get("/api/admin/memberships", { params, signal }).then(unwrap),

  options: (memberSearch = "", signal) =>
    api.get("/api/admin/memberships/options", {
      params: { member_search: memberSearch },
      signal,
    }).then(unwrap),

  async create(payload) {
    await getCsrfCookie();
    return api.post("/api/admin/memberships", payload).then(unwrap);
  },

  async activate(id) {
    await getCsrfCookie();
    return api.patch(`/api/admin/memberships/${id}/activate`).then(unwrap);
  },

  async renew(id) {
    await getCsrfCookie();
    return api.post(`/api/admin/memberships/${id}/renew`, {}).then(unwrap);
  },

  async cancel(id) {
    await getCsrfCookie();
    return api.patch(`/api/admin/memberships/${id}/cancel`).then(unwrap);
  },
};
