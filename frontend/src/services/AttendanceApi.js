/** Bouray Gym — pointage quotidien des membres et coachs.
 * Tous les endpoints ci-dessous sont à créer côté Laravel.
 * Ces pointages de salle sont DISTINCTS des présences à un cours réservé.
 */
import api, { getCsrfCookie } from "./api";

const unwrap = (response) => response.data;

const assertRole = (role) => {
  if (role !== "members" && role !== "coaches") {
    throw new Error("Type de présence invalide.");
  }
  return role;
};

const validId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Identifiant invalide.");
  return id;
};

export const attendanceApi = {
  // GET /api/admin/attendance/summary?date=YYYY-MM-DD
  summary(date) {
    return api.get("/api/admin/attendance/summary", { params: { date } }).then(unwrap);
  },

  // GET /api/admin/attendance/members|coaches?date=&search=&status=&page=
  list(role, params = {}) {
    return api.get(`/api/admin/attendance/${assertRole(role)}`, { params }).then(unwrap);
  },

  // Reuses the existing, protected Admin CRUD lists for people picker.
  searchPeople(role, search = "") {
    const type = assertRole(role);
    const url = type === "members" ? "/api/admin/members" : "/api/admin/coaches";
    return api.get(url, {
      params: { page: 1, per_page: 20, status: "active", search },
    }).then(unwrap);
  },

  // POST /api/admin/attendance/members|coaches/check-in
  // { person_id, occurred_at, note }
  async checkIn(role, payload) {
    await getCsrfCookie();
    return api.post(`/api/admin/attendance/${assertRole(role)}/check-in`, {
      person_id: validId(payload.person_id),
      occurred_at: payload.occurred_at,
      note: payload.note || null,
    }).then(unwrap);
  },

  // PATCH /api/admin/attendance/members|coaches/{attendance}/check-out
  // { occurred_at, note }
  async checkOut(role, id, payload) {
    await getCsrfCookie();
    return api.patch(`/api/admin/attendance/${assertRole(role)}/${validId(id)}/check-out`, {
      occurred_at: payload.occurred_at,
      note: payload.note || null,
    }).then(unwrap);
  },

  // POST /api/admin/attendance/coaches/absences
  // { person_id, date, note } — absence enregistrée par l'Admin
  async markCoachAbsent(payload) {
    await getCsrfCookie();
    return api.post("/api/admin/attendance/coaches/absences", {
      person_id: validId(payload.person_id),
      date: payload.date,
      note: payload.note || null,
    }).then(unwrap);
  },
};

export default attendanceApi;
