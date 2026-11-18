import {
  CalendarDays, CheckCircle2, Clock3, LockKeyhole,
  MapPin, TicketCheck, UserRound, Users,
} from "lucide-react";

function displayDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
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

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <CalendarDays size={15} /> {displayDate(session.start_at)}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          reserved ? "bg-emerald-50 text-emerald-700" :
          remaining === 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"
        }`}>
          {reserved ? "Inscrit(e)" : remaining === 0 ? "Complet" : remaining === null ? "Places à confirmer" : `${remaining} place(s) libre(s)`}
        </span>
      </div>

      <h3 className="mt-5 break-words text-xl font-extrabold tracking-tight text-slate-900">{courseName}</h3>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Clock3 size={16} className="text-blue-600" />
        {displayHour(session.start_at)} – {displayHour(session.end_at)}
      </p>

      <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
        <p className="flex items-center gap-2.5 text-sm text-slate-600">
          <UserRound size={16} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.coach?.name || "Coach à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2.5 text-sm text-slate-600">
          <MapPin size={16} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.location || "Salle à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2.5 text-sm text-slate-600">
          <Users size={16} className="shrink-0 text-slate-400" />
          {session.capacity != null ? `${session.capacity} places au total` : "Capacité indisponible"}
        </p>
      </div>

      <div className="mt-auto pt-5">
        {message && <p className="mb-3 text-xs leading-5 text-slate-500">{message}</p>}
        <button
          type="button"
          onClick={() => onReserve(session)}
          disabled={!bookable || busy}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
            bookable && !busy
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : reserved
                ? "cursor-not-allowed bg-emerald-50 text-emerald-700"
                : "cursor-not-allowed bg-slate-100 text-slate-500"
          }`}
        >
          {reserved ? <CheckCircle2 size={17} /> : bookable ? <TicketCheck size={17} /> : <LockKeyhole size={17} />}
          {label}
        </button>
      </div>
    </article>
  );
}
