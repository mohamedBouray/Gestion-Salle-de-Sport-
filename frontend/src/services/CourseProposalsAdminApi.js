import api, { getCsrfCookie } from "./api";
const unwrap = ({ data }) => data;
export const courseProposalsAdminApi = {
  list: (params = {}) => api.get("/api/admin/course-proposals", { params }).then(unwrap),
  async approve(id, note = "") { await getCsrfCookie(); return api.post(`/api/admin/course-proposals/${id}/approve`, { note }).then(unwrap); },
  async reject(id, note) { await getCsrfCookie(); return api.post(`/api/admin/course-proposals/${id}/reject`, { note }).then(unwrap); },
};
