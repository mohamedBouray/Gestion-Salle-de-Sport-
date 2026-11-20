import api, { getCsrfCookie } from "./api";
const unwrap = ({ data }) => data;
export const coachCoursesPlanningApi = {
  courses: () => api.get("/api/coach/workspace/courses").then(unwrap),
  sessions: (params = {}) => api.get("/api/coach/workspace/sessions", { params }).then(unwrap),
  availabilities: () => api.get("/api/coach/workspace/availabilities").then(unwrap),
  proposals: () => api.get("/api/coach/course-proposals").then(unwrap),
  async proposeCourse(payload) {
    await getCsrfCookie();
    return api.post("/api/coach/course-proposals", payload).then(unwrap);
  },
  async saveAvailabilities(slots) {
    await getCsrfCookie();
    return api.put("/api/coach/workspace/availabilities", { slots }).then(unwrap);
  },
};
