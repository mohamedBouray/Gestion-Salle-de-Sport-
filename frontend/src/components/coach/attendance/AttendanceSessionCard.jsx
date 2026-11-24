
import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { Badge } from "../CoachUI";

const formatDay = (value) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(date);
};

const formatTime = (value) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
};

export default function AttendanceSessionCard({
  session,
  selected,
  onSelect,
}) {
  const started =
    new Date(session.start_at).getTime() <= Date.now();

  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-3 text-left
        transition-colors focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-blue-500
        ${
          selected
            ? "border-blue-400 bg-blue-50/70"
            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <CalendarDays size={13} />
          {formatDay(session.start_at)}
        </span>

        <Badge status={session.status} />
      </div>

      <p className="mt-2 truncate text-sm font-bold text-slate-900">
        {session.course?.name || "Cours sportif"}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <Clock3 size={13} className="text-blue-500" />

          {formatTime(session.start_at)} –{" "}
          {formatTime(session.end_at)}
        </span>

        <span className="inline-flex items-center gap-1">
          <UsersRound size={13} className="text-blue-500" />

          {session.booked_count ?? 0} inscrit(s)
        </span>

        {session.location && (
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin size={13} className="text-blue-500" />

            {session.location}
          </span>
        )}
      </div>

      <p
        className={`mt-2 text-[11px] font-medium ${
          started ? "text-emerald-700" : "text-slate-400"
        }`}
      >
        {session.status === "cancelled"
          ? "Séance annulée"
          : started
            ? "Pointage possible selon les règles du cours"
            : "Pointage à partir du début de la séance"}
      </p>
    </button>
  );
}
