
import api, { getCsrfCookie } from "./api";
import { coachCoursesPlanningApi } from "./CoachCoursesPlanningApi";

const unwrap = ({ data }) => data;

function validId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Identifiant invalide.");
  }

  return id;
}

export const coachAttendanceApi = {
  // Reutiliser les seances de Mon planning
  sessions: () => coachCoursesPlanningApi.sessions(),

  // Liste des participants d'une seance
  participants: (sessionId, signal) =>
    api
      .get(
        `/api/coach/attendance/sessions/${validId(sessionId)}/participants`,
        { signal }
      )
      .then(unwrap),

  // Enregistrer la presence ou l'absence
  async mark(sessionId, enrollmentId, status) {
    if (!["present", "absent"].includes(status)) {
      throw new Error("Statut de présence invalide.");
    }

    await getCsrfCookie();

    return api
      .patch(
        `/api/coach/attendance/sessions/${validId(sessionId)}/enrollments/${validId(enrollmentId)}`,
        { status }
      )
      .then(unwrap);
  },
};
