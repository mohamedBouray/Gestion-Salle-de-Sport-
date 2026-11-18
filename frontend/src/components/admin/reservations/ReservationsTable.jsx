import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  SearchX,
} from "lucide-react";

const statusStyles = {
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmée",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  attended: {
    label: "Présent(e)",
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
};

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

const initials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : words[0].slice(0, 2).toUpperCase();
};

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function priceLabel(value) {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
}

function StatusBadge({ status }) {
  const config = statusStyles[status] || {
    label: status || "Inconnu",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function ReservationsTable({
  reservations = [],
  loading = false,
  pagination = { current_page: 1, last_page: 1, total: null },
  onPageChange,
  onView,
}) {
  const currentPage = Math.max(1, Number(pagination.current_page) || 1);
  const lastPage = Math.max(1, Number(pagination.last_page) || 1);

  return (
    <div className="relative">
      {loading && reservations.length > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"
        >
          <LoaderCircle size={14} className="animate-spin" />
          Actualisation des réservations...
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th scope="col" className={`${thClass} pl-5`}>Membre</th>
              <th scope="col" className={thClass}>Cours / Coach</th>
              <th scope="col" className={thClass}>Date de séance</th>
              <th scope="col" className={thClass}>Statut</th>
              <th scope="col" className={thClass}>Montant</th>
              <th scope="col" className={`${thClass} pr-5 text-right`}>Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-1.5 text-slate-400">
                    <SearchX size={28} strokeWidth={1.6} />
                    <p className="text-sm font-semibold text-slate-600">
                      Aucune réservation trouvée
                    </p>
                    <p className="text-xs">Essayez de modifier les filtres.</p>
                  </div>
                </td>
              </tr>
            ) : (
              reservations.map((reservation, index) => {
                const member = reservation.member ?? {};
                const session = reservation.session ?? reservation.course_session ?? {};
                const course = session.course ?? reservation.course ?? {};
                const coach = session.coach ?? reservation.coach ?? {};

                const memberName =
                  member.name ||
                  reservation.member_name ||
                  (reservation.member_id ? `Membre #${reservation.member_id}` : "Membre inconnu");

                const courseName =
                  course.name ||
                  session.course_name ||
                  reservation.course_name ||
                  (session.course_id ? `Cours #${session.course_id}` : "Cours non renseigné");

                const coachName =
                  coach.name ||
                  session.coach_name ||
                  reservation.coach_name ||
                  "Coach non renseigné";

                return (
                  <tr
                    key={reservation.id ?? index}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="py-2.5 pl-5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                          {initials(memberName)}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="max-w-52 truncate text-[13px] font-semibold text-slate-900"
                            title={memberName}
                          >
                            {memberName}
                          </p>
                          <p className="max-w-52 truncate text-xs text-slate-400">
                            {member.email || reservation.member_email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5">
                      <p
                        className="max-w-48 truncate text-[13px] font-semibold text-slate-800"
                        title={courseName}
                      >
                        {courseName}
                      </p>
                      <p className="max-w-48 truncate text-xs text-slate-400">
                        {coachName}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-2.5 text-[13px] tabular-nums text-slate-600">
                      {dateLabel(session.start_at || reservation.start_at)}
                    </td>

                    <td className="px-4 py-2.5">
                      <StatusBadge status={reservation.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-2.5 text-[13px] font-medium text-slate-700">
                      {priceLabel(reservation.price_at_booking)}
                    </td>

                    <td className="py-2.5 pl-4 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => onView(reservation)}
                        aria-label={`Voir la réservation ${reservation.id ?? ""} de ${memberName}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        <Eye size={14} />
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
        <p>
          Page <span className="font-bold text-slate-800">{currentPage}</span> / {lastPage}
          {pagination.total !== null && pagination.total !== undefined && (
            <> · {pagination.total} réservation(s)</>
          )}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={loading || currentPage <= 1}
            aria-label="Page précédente"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Précédent
          </button>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={loading || currentPage >= lastPage}
            aria-label="Page suivante"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}