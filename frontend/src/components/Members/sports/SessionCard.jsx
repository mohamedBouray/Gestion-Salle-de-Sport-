
import {
  CalendarDays,
  Clock3,
  MapPin,
  TicketCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "Date indisponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatHour(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function SessionCard({
  session,
  onBook,
  busy = false,
}) {
  const reserved = Boolean(session.already_reserved);
  const remaining = Math.max(
    0,
    Number(session.remaining_places) || 0
  );

  const bookable =
    session.can_book === true && !reserved && remaining > 0;

  let buttonLabel = "Réserver ma place";

  if (reserved) {
    buttonLabel = "Déjà réservé";
  } else if (remaining === 0) {
    buttonLabel = "Complet";
  } else if (!session.eligible) {
    buttonLabel = "Abonnement requis";
  } else if (!bookable) {
    buttonLabel = "Indisponible";
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-slate-900">
            {session.course?.name || "Cours sportif"}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <CalendarDays size={13} />
            {formatDate(session.start_at)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
            reserved
              ? "bg-emerald-50 text-emerald-700"
              : remaining === 0
                ? "bg-rose-50 text-rose-700"
                : "bg-blue-50 text-blue-700"
          }`}
        >
          {reserved
            ? "Inscrit"
            : remaining === 0
              ? "Complet"
              : `${remaining} place(s)`}
        </span>
      </div>

      <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <Clock3 size={14} className="text-blue-500" />
          {formatHour(session.start_at)} –{" "}
          {formatHour(session.end_at)}
        </span>

        <span className="flex min-w-0 items-center gap-2">
          <UserRound size={14} className="shrink-0 text-blue-500" />
          <span className="truncate">
            {session.coach?.name || "Coach à confirmer"}
          </span>
        </span>

        <span className="flex min-w-0 items-center gap-2">
          <MapPin size={14} className="shrink-0 text-blue-500" />
          <span className="truncate">
            {session.location || "Salle à confirmer"}
          </span>
        </span>

        <span className="flex items-center gap-2">
          <UsersRound size={14} className="text-blue-500" />
          {session.enrolled_count ?? 0} /{" "}
          {session.capacity ?? "—"} inscrits
        </span>
      </div>

      <button
        type="button"
        onClick={() => onBook(session)}
        disabled={!bookable || busy}
        className={`mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${
          bookable && !busy
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "cursor-not-allowed bg-slate-100 text-slate-500"
        }`}
      >
        <TicketCheck size={15} />
        {busy ? "Enregistrement..." : buttonLabel}
      </button>
    </article>
  );
}
