import api from "./api";

const ROLES = new Set(["admin", "coach", "member"]);
const PERIODS = new Set(["7d", "30d", "90d", "12m"]);

export const dashboardApi = {
  async overview(role, period = "30d", signal) {
    if (!ROLES.has(role)) throw new Error("Rôle invalide.");
    if (!PERIODS.has(period)) throw new Error("Période invalide.");

    const { data } = await api.get(`/api/${role}/dashboard`, {
      params: { period },
      signal,
    });

    return data;
  },
};