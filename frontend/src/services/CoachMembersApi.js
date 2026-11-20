
import api from "./api";

const unwrap = ({ data }) => data;

export const coachMembersApi = {
  list: (params = {}, signal) =>
    api.get("/api/coach/members", { params, signal }).then(unwrap),

  show: (memberId, signal) =>
    api.get(`/api/coach/members/${memberId}`, { signal }).then(unwrap),
};
