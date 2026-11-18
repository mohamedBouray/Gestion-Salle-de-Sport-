export const ROLE_CONFIG = {
  members: { singular: "membre", plural: "Membres" },
  coaches: { singular: "coach", plural: "Coachs" },
};

export const STATUS_META = {
  present: { label: "Présent", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  left: { label: "Sorti", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  absent: { label: "Absent", className: "bg-rose-50 text-rose-700 ring-rose-100" },
};

export function dateKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localDateTime(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (v) => String(v).padStart(2, "0");
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function displayDate(value) {
  if (!value) return "Date inconnue";
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("fr-MA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(d);
}

export function displayTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export function getPerson(record) {
  const person = record?.person || record?.member || record?.coach || record?.user || {};
  return {
    id: person.id ?? record?.person_id ?? record?.member_id ?? record?.coach_id,
    name: person.name || record?.name || "Nom indisponible",
    email: person.email || record?.email || "",
  };
}

export function getRows(payload) {
  const raw = payload?.records ?? payload?.attendances ?? payload?.data ?? payload;
  const items = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  const meta = payload?.meta || {};
  const currentPage = Number(raw?.current_page ?? meta.current_page ?? 1) || 1;
  const lastPage = Number(raw?.last_page ?? meta.last_page ?? 1) || 1;
  const total = raw?.total ?? meta.total ?? (Array.isArray(raw) ? items.length : null);
  return { items, currentPage, lastPage, total };
}

export function getPeople(payload, role) {
  const raw = payload?.[role] ?? payload?.data ?? payload;
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
}
