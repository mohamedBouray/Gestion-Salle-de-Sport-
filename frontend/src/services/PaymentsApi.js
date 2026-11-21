
import api, { getCsrfCookie } from "./api";

const unwrap = ({ data }) => data;

export const paymentsApi = {
  list: (params = {}, signal) =>
    api.get("/api/admin/payments", {
      params,
      signal,
    }).then(unwrap),

  options: (params = {}, signal) =>
    api.get("/api/admin/payments/options", {
      params,
      signal,
    }).then(unwrap),

  async create(payload) {
    await getCsrfCookie();

    return api.post(
      "/api/admin/payments",
      payload
    ).then(unwrap);
  },

  async refund(id) {
    await getCsrfCookie();

    return api.patch(
      `/api/admin/payments/${id}/refund`,
      {}
    ).then(unwrap);
  },
};
