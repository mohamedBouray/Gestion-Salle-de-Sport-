/**
 * BOURAY GYM
 * Reservations API
 *
 * Admin: consultation et réservation à l'accueil
 * Member: réservation personnelle
 *
 * Laravel Sanctum + Axios
 */

import api, { getCsrfCookie } from "./api";

// ========================================
// HELPERS
// ========================================

const responseData = (response) => response.data;

function validId(value, label = "Identifiant") {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`${label} invalide.`);
  }

  return id;
}

// ========================================
// ADMIN RESERVATIONS
// ========================================

const adminReservations = {
  // GET /api/admin/reservations
  // Liste + filtres + pagination + statistiques
  list(params = {}) {
    return api
      .get("/api/admin/reservations", { params })
      .then(responseData);
  },

  // GET /api/admin/reservations/:id
  // Détails d'une réservation
  show(reservationId) {
    const id = validId(reservationId, "Réservation");

    return api
      .get(`/api/admin/reservations/${id}`)
      .then(responseData);
  },

  // GET /api/admin/course-sessions/:id/reservations
  // Réservations d'une séance précise
  bySession(sessionId, params = {}) {
    const id = validId(sessionId, "Séance");

    return api
      .get(
        `/api/admin/course-sessions/${id}/reservations`,
        { params }
      )
      .then(responseData);
  },

  // POST /api/admin/course-sessions/:id/reservations
  // Admin réserve pour un membre à l'accueil
  async createForMember(sessionId, memberId) {
    const session = validId(sessionId, "Séance");
    const member = validId(memberId, "Membre");

    await getCsrfCookie();

    const response = await api.post(
      `/api/admin/course-sessions/${session}/reservations`,
      {
        member_id: member,
      }
    );

    return responseData(response);
  },
};

// ========================================
// MEMBER RESERVATIONS
// ========================================

const memberReservations = {
  // GET /api/member/reservations
  // Le membre voit uniquement ses réservations
  list(params = {}) {
    return api
      .get("/api/member/reservations", { params })
      .then(responseData);
  },

  // GET /api/member/course-sessions
  // Séances accessibles au membre
  sessions(params = {}) {
    return api
      .get("/api/member/course-sessions", { params })
      .then(responseData);
  },

  // POST /api/member/course-sessions/:id/reservations
  // Le membre réserve pour lui-même
  async create(sessionId) {
    const id = validId(sessionId, "Séance");

    await getCsrfCookie();

    const response = await api.post(
      `/api/member/course-sessions/${id}/reservations`
    );

    return responseData(response);
  },

  // DELETE /api/member/reservations/:id
  // Le membre annule sa propre réservation
  async cancel(reservationId) {
    const id = validId(reservationId, "Réservation");

    await getCsrfCookie();

    const response = await api.delete(
      `/api/member/reservations/${id}`
    );

    return responseData(response);
  },
};

// ========================================
// EXPORT
// ========================================

export const reservationsApi = {
  admin: adminReservations,
  member: memberReservations,
};

export default reservationsApi;
