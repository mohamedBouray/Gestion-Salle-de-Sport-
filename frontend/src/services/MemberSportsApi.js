
import api from "./api";
import { reservationsApi } from "./ReservationsApi";

const unwrap = (response) => response.data;

export const memberSportsApi = {
  // Catalogue des cours - Backend a creer
  courses: (params = {}, signal) =>
    api
      .get("/api/member/courses", { params, signal })
      .then(unwrap),

  // Seances disponibles - Backend existant
  sessions: (params = {}, signal) =>
    api
      .get("/api/member/course-sessions", {
        params,
        signal,
      })
      .then(unwrap),

  // Meme logique de reservation existante
  book: (sessionId) =>
    reservationsApi.member.create(sessionId),
};

// Normaliser une reponse paginee Laravel
export function readPage(response, key) {
  const collection = response?.[key] ?? {};
  const data = Array.isArray(collection)
    ? collection
    : Array.isArray(collection.data)
      ? collection.data
      : [];

  return {
    data,
    current_page: Number(collection.current_page) || 1,
    last_page: Math.max(1, Number(collection.last_page) || 1),
    total: Number(collection.total ?? data.length),
  };
}
