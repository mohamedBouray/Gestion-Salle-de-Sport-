import {
  Ban, CalendarCheck2, CalendarDays, ChevronLeft,
  ChevronRight, Clock3, MapPin, UserRound,
} from "lucide-react";

const STATUS = {
  confirmed: { label: "Confirmée", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  attended: { label: "Présence validée", className: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500" },
  cancelled: { label: "Annulée", className: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

const gridClass = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

function dateLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  }).format(date);
}

function timeLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function MyReservationCard({ reservation, onCancel, busy }) {
  const session = reservation.session || {};
  const status = STATUS[reservation.status] || {
    label: "Statut inconnu", className: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400",
  };
  const starts = session.start_at ? new Date(session.start_at) : null;
  const isFuture = starts && !Number.isNaN(starts.getTime()) && starts.getTime() > Date.now();
  const canCancel = ["confirmed", "pending"].includes(reservation.status) && isFuture;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className="text-[11px] text-slate-400">#{reservation.id}</span>
      </div>

      <h3 className="mt-3 break-words text-[15px] font-bold text-[#0f1b33]">
        {session.course?.name || "Cours sportif"}
      </h3>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <CalendarDays size={13} className="shrink-0 text-blue-600" />
          <span className="capitalize">{dateLabel(session.start_at)}</span>
        </p>
        <p className="flex items-center gap-2 tabular-nums">
          <Clock3 size={13} className="shrink-0 text-blue-600" />
          {timeLabel(session.start_at)} – {timeLabel(session.end_at)}
        </p>
        <p className="flex items-center gap-2">
          <UserRound size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.coach?.name || "Coach à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.location || "Salle à confirmer"}</span>
        </p>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-3">
        {Number(reservation.price_at_booking) === 0 && (
          <p className="mb-2 text-xs font-medium text-slate-500">
            Inclus dans votre abonnement
          </p>
        )}

        {canCancel ? (
          <button
            type="button"
            onClick={() => onCancel(reservation)}
            disabled={busy}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Ban size={15} /> Annuler la réservation
          </button>
        ) : (
          <p className="text-center text-xs text-slate-500">
            {reservation.status === "cancelled"
              ? "Réservation annulée"
              : reservation.status === "attended"
                ? "Présence déjà enregistrée"
                : "Annulation indisponible après le début de la séance"}
          </p>
        )}
      </div>
    </article>
  );
}

export default function MyReservations({
  reservations = [], loading = false, error = "", pagination,
  page = 1, onPageChange, status = "all", onStatusChange,
  onCancel, busy = false,
}) {
  const lastPage = Math.max(1, Number(pagination?.last_page) || 1);

  return (
    <section className="space-y-3" aria-label="Mes réservations">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <select
          aria-label="Filtrer mes réservations par statut"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
        >
          <option value="all">Tous les statuts</option>
          <option value="confirmed">Confirmées</option>
          <option value="pending">En attente</option>
          <option value="attended">Présences validées</option>
          <option value="cancelled">Annulées</option>
        </select>

        <p className="text-xs text-slate-500">
          Retrouvez vos séances réservées et leur statut.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-4 h-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <CalendarCheck2 size={28} className="text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-700">Aucune réservation</h3>
          <p className="mt-1 max-w-md text-[13px] text-slate-500">
            {status === "all"
              ? "Vous n'avez pas encore réservé de séance."
              : "Aucune réservation ne correspond à ce statut."}
          </p>
        </div>
      ) : !error && (
        <div className={gridClass}>
          {reservations.map((reservation) => (
            <MyReservationCard key={reservation.id} reservation={reservation} onCancel={onCancel} busy={busy} />
          ))}
        </div>
      )}

      {!loading && !error && lastPage > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <span>
            Page {page} / {lastPage} · {pagination?.total ?? "—"} réservation(s)
          </span>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Précédent
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}