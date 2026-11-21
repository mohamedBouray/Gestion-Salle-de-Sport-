
import api from "./api";

const unwrap = (response) => response.data;

export const memberAccountApi = {
  // GET /api/member/membership
  memberships: (params = {}, signal) =>
    api.get("/api/member/membership", {
      params,
      signal,
    }).then(unwrap),

  // GET /api/member/attendance
  attendance: (params = {}, signal) =>
    api.get("/api/member/attendance", {
      params,
      signal,
    }).then(unwrap),
};

export function readPage(response, key) {
  const source = response?.[key] ?? {};

  const items = Array.isArray(source)
    ? source
    : Array.isArray(source.data)
      ? source.data
      : [];

  return {
    items,
    current_page: Math.max(
      1,
      Number(source.current_page) || 1
    ),
    last_page: Math.max(
      1,
      Number(source.last_page) || 1
    ),
    total: Number(source.total ?? items.length),
  };
}
