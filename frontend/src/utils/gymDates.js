// Gym business time, independent of the device timezone. Instants are UTC in the API.
export const GYM_TIMEZONE = "Africa/Casablanca";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: GYM_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
export function gymLocalDateTime(value = new Date()) {
  if (value == null || value === "") return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const p = Object.fromEntries(formatter.formatToParts(date).map(({type, value}) => [type, value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function gymDateKey(value = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return gymLocalDateTime(value).slice(0, 10);
}
// Noon UTC represents a calendar day (not an appointment). UTC calendar arithmetic avoids browser DST.
export function gymCalendarDay(value = new Date()) {
  return new Date(`${gymDateKey(value)}T12:00:00Z`);
}
export function addCalendarDays(value, count) {
  const date = gymCalendarDay(value);
  date.setUTCDate(date.getUTCDate() + count);
  return date;
}
// Resolve a Moroccan wall-clock input to an instant. Reject ambiguous/nonexistent DST minutes.
export function gymInstant(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || "")) return new Date(NaN);
  const nominal = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(nominal)) return new Date(NaN);
  const offsets = new Set([-36, -12, 0, 12, 36].map(hours => {
    const sample = nominal + hours * 3600000;
    return Date.parse(`${gymLocalDateTime(sample)}:00Z`) - sample;
  }));
  const matches = [...offsets].map(offset => nominal - offset)
    .filter(instant => gymLocalDateTime(instant) === value);
  return new Date(matches.length === 1 ? matches[0] : NaN);
}
