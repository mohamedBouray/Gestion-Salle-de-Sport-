import {
  Ban, CalendarCheck2, CalendarDays, CheckCircle2,
  ChevronLeft, ChevronRight, Clock3, MapPin, UserRound,
} from "lucide-react";

const STATUS = {
  confirmed: { label: "Confirmée", className: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  pending: { label: "En attente", className: "bg-amber-50 text-amber-700", Icon: Clock3 },
  attended: { label: "Présence validée", className: "bg-blue-50 text-blue-700", Icon: CalendarCheck2 },
  cancelled: { label: "Annulée", className: "bg-rose-50 text-rose-700", Icon: Ban },
};

function dateLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
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
    label: "Statut inconnu", className: "bg-slate-100 text-slate-600", Icon: Clock3,
  };
  const StatusIcon = status.Icon;
  const starts = session.start_at ? new Date(session.start_at) : null;
  const isFuture = starts && !Number.isNaN(starts.getTime()) && starts.getTime() > Date.now();
  const canCancel = ["confirmed", "pending"].includes(reservation.status) && isFuture;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}>
          <StatusIcon size={14} /> {status.label}
        </span>
        <span className="text-xs font-semibold text-slate-400">Réservation #{reservation.id}</span>
      </div>

      <h3 className="mt-5 break-words text-xl font-extrabold tracking-tight text-slate-900">
        {session.course?.name || "Cours sportif"}
      </h3>
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <p className="flex items-start gap-2.5">
          <CalendarDays size={17} className="mt-0.5 shrink-0 text-blue-600" />
          <span className="capitalize">{dateLabel(session.start_at)}</span>
        </p>
        <p className="flex items-center gap-2.5"><Clock3 size={17} className="shrink-0 text-blue-600" />
          {timeLabel(session.start_at)} – {timeLabel(session.end_at)}
        </p>
        <p className="flex items-center gap-2.5"><UserRound size={17} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.coach?.name || "Coach à confirmer"}</span>
        </p>
        <p className="flex items-center gap-2.5"><MapPin size={17} className="shrink-0 text-slate-400" />
          <span className="truncate">{session.location || "Salle à confirmer"}</span>
        </p>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-5">
        {Number(reservation.price_at_booking) === 0 && (
          <p className="mb-3 text-xs font-semibold text-slate-500">Inclus dans votre abonnement</p>
        )}
        {canCancel ? (
          <button
            type="button" onClick={() => onCancel(reservation)} disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          ><Ban size={17} /> Annuler la réservation</button>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
            {reservation.status === "cancelled" ? "Réservation annulée" :
              reservation.status === "attended" ? "Présence déjà enregistrée" :
              "Annulation indisponible après le début de la séance"}
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
    <section className="space-y-4" aria-label="Mes réservations">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Mon historique de réservations</h2>
          <p className="mt-1 text-xs text-slate-500">Retrouvez vos séances réservées et leur statut.</p>
        </div>
        <select
          aria-label="Filtrer mes réservations par statut"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">Tous les statuts</option>
          <option value="confirmed">Confirmées</option>
          <option value="pending">En attente</option>
          <option value="attended">Présences validées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-6 w-2/5 rounded-lg bg-slate-100" />
              <div className="mt-8 h-7 w-2/3 rounded-lg bg-slate-100" />
              <div className="mt-5 h-24 rounded-xl bg-slate-100" />
              <div className="mt-6 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><CalendarCheck2 size={27} /></div>
          <h3 className="mt-4 font-bold text-slate-900">Aucune réservation</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {status === "all" ? "Vous n'avez pas encore réservé de séance." : "Aucune réservation ne correspond à ce statut."}
          </p>
        </div>
      ) : !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reservations.map((reservation) => (
            <MyReservationCard key={reservation.id} reservation={reservation} onCancel={onCancel} busy={busy} />
          ))}
        </div>
      )}

      {!loading && !error && lastPage > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">
            Page {page} / {lastPage} · {pagination?.total ?? "—"} réservation(s) au total
          </span>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">
              <ChevronLeft size={15} /> Précédent
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
