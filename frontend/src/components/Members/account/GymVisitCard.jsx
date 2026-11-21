
import {
  CalendarDays,
  Clock3,
  LogIn,
  LogOut,
} from "lucide-react";

const TIMEZONE = "Africa/Casablanca";

function displayDay(value) {
  if (!value) return "—";

  const day = String(value).slice(0, 10);
  const date = new Date(`${day}T12:00:00Z`);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-MA", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function displayTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-MA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TIMEZONE,
      }).format(date);
}

function duration(start, end) {
  if (!start || !end) return "—";

  const minutes = Math.floor(
    (new Date(end).getTime() -
      new Date(start).getTime()) / 60000
  );

  if (!Number.isFinite(minutes) || minutes < 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return hours > 0
    ? `${hours}h ${String(rest).padStart(2, "0")}`
    : `${rest} min`;
}

export default function GymVisitCard({ visit }) {
  const inside =
    visit.status === "present" &&
    !visit.check_out_at;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <CalendarDays
            size={16}
            className="text-blue-600"
          />
          {displayDay(visit.date)}
        </p>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            inside
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {inside ? "En salle" : "Sortie enregistrée"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <LogIn size={13} />
            Entrée
          </p>

          <p className="mt-1 text-sm font-extrabold text-slate-800">
            {displayTime(visit.check_in_at)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <LogOut size={13} />
            Sortie
          </p>

          <p className="mt-1 text-sm font-extrabold text-slate-800">
            {displayTime(visit.check_out_at)}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <Clock3 size={14} className="text-blue-500" />
        Durée :
        <strong className="text-slate-800">
          {duration(
            visit.check_in_at,
            visit.check_out_at
          )}
        </strong>
      </p>

      {visit.note && (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
          {visit.note}
        </p>
      )}
    </article>
  );
}
