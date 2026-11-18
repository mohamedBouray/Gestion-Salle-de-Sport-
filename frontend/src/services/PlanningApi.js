
/**
 * BOURAY GYM
 * Planning API Service
 *
 * Laravel + Axios + Sanctum
 */

import api, {
  getCsrfCookie,
} from "./api";

// ========================================
// HELPERS
// ========================================

const responseData = (response) => response.data;

// ========================================
// ADMIN PLANNING API
// ========================================

export const planningApi = {
  admin: {
    // ------------------------------------
    // LIST SESSIONS
    // GET /api/admin/course-sessions
    // ------------------------------------

    sessions(params = {}) {
      return api
        .get("/api/admin/course-sessions", {
          params,
        })
        .then(responseData);
    },

    // ------------------------------------
    // COACH AVAILABILITIES
    // GET /api/admin/coaches/:id/availabilities
    // ------------------------------------

    coachAvailabilities(coachId) {
      return api
        .get(
          `/api/admin/coaches/${coachId}/availabilities`
        )
        .then(responseData);
    },

    // ------------------------------------
    // CREATE SESSION
    // POST /api/admin/course-sessions
    // ------------------------------------

    async create(payload) {
      await getCsrfCookie();

      const response = await api.post(
        "/api/admin/course-sessions",
        payload
      );

      return responseData(response);
    },

    // ------------------------------------
    // UPDATE SESSION
    // PUT /api/admin/course-sessions/:id
    // ------------------------------------

    async update(id, payload) {
      await getCsrfCookie();

      const response = await api.put(
        `/api/admin/course-sessions/${id}`,
        payload
      );

      return responseData(response);
    },

    // ------------------------------------
    // CANCEL SESSION
    // ------------------------------------

    async cancel(id) {
      await getCsrfCookie();

      const response = await api.put(
        `/api/admin/course-sessions/${id}`,
        {
          status: "cancelled",
        }
      );

      return responseData(response);
    },
  },

  // ======================================
  // COACH PLANNING API
  // Retained for Coach pages
  // ======================================

  coach: {
    sessions(params = {}) {
      return api
        .get("/api/coach/course-sessions", {
          params,
        })
        .then(responseData);
    },

    availabilities() {
      return api
        .get("/api/coach/availabilities")
        .then(responseData);
    },

    async addAvailability(payload) {
      await getCsrfCookie();

      const response = await api.post(
        "/api/coach/availabilities",
        payload
      );

      return responseData(response);
    },

    async updateAvailability(id, payload) {
      await getCsrfCookie();

      const response = await api.put(
        `/api/coach/availabilities/${id}`,
        payload
      );

      return responseData(response);
    },

    async deleteAvailability(id) {
      await getCsrfCookie();

      const response = await api.delete(
        `/api/coach/availabilities/${id}`
      );

      return responseData(response);
    },
  },

  // ======================================
  // MEMBER PLANNING API
  // Retained for Member pages
  // ======================================

  member: {
    sessions(params = {}) {
      return api
        .get("/api/member/course-sessions", {
          params,
        })
        .then(responseData);
    },

    access() {
      return api
        .get("/api/member/membership")
        .then(responseData);
    },
  },
};

export default planningApi;
