import api from "./api";
import { getCsrfCookie } from "./api";

const unwrap = (response) => response.data;

export const memberPaymentsApi = {
  list: (params = {}, signal) => api.get("/api/member/payments", { params, signal }).then(unwrap),

  // Le serveur détermine le solde, vérifie l'identité et crée le paiement.
  async checkout(subscriptionId) {
    if (!Number.isSafeInteger(Number(subscriptionId)) || Number(subscriptionId) < 1)
      throw new Error("Abonnement invalide.");
    await getCsrfCookie();
    return api.post(`/api/member/memberships/${Number(subscriptionId)}/checkout`, { method: "demo" }).then(unwrap);
  },
};

export function readPaymentsPage(response) {
  const collection = response?.payments || {};

  return {
    items: Array.isArray(collection.data)
      ? collection.data
      : [],
    current_page: Math.max(
      1,
      Number(collection.current_page) || 1
    ),
    last_page: Math.max(
      1,
      Number(collection.last_page) || 1
    ),
    total: Number(collection.total) || 0,
  };
}

export function formatMoney(value) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;
}