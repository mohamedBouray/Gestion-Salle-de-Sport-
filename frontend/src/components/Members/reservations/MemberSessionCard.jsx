import {
  CalendarDays, CheckCircle2, Clock3, LockKeyhole,
  MapPin, TicketCheck, UserRound, Users,
} from "lucide-react";

function displayDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "short", day: "numeric", month: "short",
  }).format(date);
}

function displayHour(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function MemberSessionCard({ session, onReserve, busy = false }) {
  const remaining = session.remaining_places == null
    ? null : Math.max(0, Number(session.remaining_places));
  const reserved = Boolean(session.already_reserved);
  const eligible = session.eligible === true;
  const bookable = session.can_book === true && !reserved && eligible && (remaining === null || remaining > 0);
  const courseName = session.course?.name || "Cours sportif";

  let label = "Réserver ma place";
  let message = "";
  if (reserved) {
    label = "Déjà réservée";
    message = "Cette séance figure dans vos réservations.";
  } else if (remaining === 0) {
    label = "Séance complète";
    message = "Il n'y a plus de places disponibles.";
  } else if (!eligible) {
    label = "Abonnement requis";
    message = "Un abonnement valide couvrant cette séance est nécessaire.";
  } else if (!bookable) {
    label = "Indisponible";
    message = "Cette séance n'est pas réservable actuellement.";
  }

  const badge = reserved
    ? { text: "Inscrit(e)", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" }
    : remaining === 0
      ? { text: "Complet", className: "bg-red-50 text-red-700 ring-red-600/20" }
      : remaining === null
        ? { text: "Places à confirmer", className: "bg-slate-100 text-slate-600 ring-slate-500/20" }
        : { text: `${remaining} place(s)`, className: "bg-blue-50 text-blue-700 ring-blue-600/20" };

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-500">
          <CalendarDays size={14} className="text-blue-600" />
          {displayDate(session.start_at)}
        </span>

        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <h3 className="mt-3 break-words text-[15px] font-bold text-[#0f1b33]">
        {courseName}
      </h3>

      <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold tabular-nums text-slate-700">
        <Clock3 size={14} className="text-blue-600" />
        {displayHour(session.start_at)} – {displayHour(session.end_at)}
      </p>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <UserRound size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.coach?.name || "Coach à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.location || "Salle à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2">
          <Users size={13} className="shrink-0 text-slate-400" />
          {session.capacity != null ? `${session.capacity} places au total` : "Capacité indisponible"}
        </p>
      </div>

      <div className="mt-auto pt-4">
        {message && <p className="mb-2 text-xs leading-5 text-slate-500">{message}</p>}

        <button
          type="button"
          onClick={() => onReserve(session)}
          disabled={!bookable || busy}
          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition ${
            bookable && !busy
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : reserved
                ? "cursor-not-allowed bg-emerald-50 text-emerald-700"
                : "cursor-not-allowed bg-slate-100 text-slate-500"
          }`}
        >
          {reserved ? <CheckCircle2 size={15} /> : bookable ? <TicketCheck size={15} /> : <LockKeyhole size={15} />}
          {label}
        </button>
      </div>
    </article>
  );
}