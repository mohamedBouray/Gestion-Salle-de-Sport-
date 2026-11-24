import { useEffect } from "react";
import { Ban, Pencil, X } from "lucide-react";

// =====================================
// STATUS CONFIG
// =====================================

const statuses = {
  scheduled: {
    label: "Programmée",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  completed: {
    label: "Terminée",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  cancelled: {
    label: "Annulée",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

// =====================================
// HELPERS
// =====================================

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = validDate(value);
  if (!date) return "Non renseignée";

  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatHour(value) {
  const date = validDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function durationLabel(start, end) {
  const startDate = validDate(start);
  const endDate = validDate(end);

  if (!startDate || !endDate) return "—";

  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  if (minutes <= 0) return "—";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} h`;

  return `${hours} h ${remaining} min`;
}

function capacityInfo(session) {
  const capacity = Number(session.capacity);

  if (session.capacity == null || !Number.isFinite(capacity) || capacity <= 0) {
    return { capacity: null, enrolled: null, remaining: null, percentage: null };
  }

  let enrolled = null;
  let remaining = null;

  if (session.enrolled_count != null) {
    const count = Number(session.enrolled_count);

    if (Number.isFinite(count)) {
      enrolled = Math.max(0, count);
    }
  }

  if (session.remaining_places != null) {
    const count = Number(session.remaining_places);

    if (Number.isFinite(count)) {
      remaining = Math.max(0, Math.min(capacity, count));
    }
  }

  if (remaining === null && enrolled !== null) {
    remaining = Math.max(0, capacity - enrolled);
  }

  if (enrolled === null && remaining !== null) {
    enrolled = capacity - remaining;
  }

  const percentage =
    enrolled === null
      ? null
      : Math.min(100, Math.max(0, (enrolled / capacity) * 100));

  return { capacity, enrolled, remaining, percentage };
}

// =====================================
// ROW
// =====================================

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5 text-[13px]">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words text-right font-medium text-slate-800">
        {value ?? "—"}
      </dd>
    </div>
  );
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function SessionDetails({
  session,
  onClose,
  onEdit,
  onCancel,
  busy = false,
}) {
  const status = statuses[session?.status] || {
    label: session?.status || "Inconnu",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  const courseName =
    session?.course?.name || session?.course_name || "Cours sportif";

  const coachName =
    session?.coach?.name || session?.coach_name || "Coach non assigné";

  const capacity = capacityInfo(session || {});

  const canCancel = session?.status === "scheduled" && new Date(session.start_at).getTime() > Date.now();

  // =====================================
  // CLOSE ON ESCAPE
  // =====================================

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose]);

  if (!session) return null;

  // =====================================
  // RENDER
  // =====================================

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-details-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl"
      >
        {/* HEADER */}

        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2
            id="session-details-title"
            className="text-base font-bold text-[#0f1b33]"
          >
            Détails de la séance
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fermer les détails"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        {/* CONTENT */}

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {/* Title + status */}

          <section className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Séance #{session.id}</p>

              <h3 className="mt-0.5 break-words text-lg font-bold text-[#0f1b33]">
                {courseName}
              </h3>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.badge}`}
            >
              {status.label}
            </span>
          </section>

          {/* Info list */}

          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            <Row label="Date" value={<span className="capitalize">{formatDate(session.start_at)}</span>} />
            <Row
              label="Horaire"
              value={`${formatHour(session.start_at)} – ${formatHour(session.end_at)}`}
            />
            <Row
              label="Durée"
              value={durationLabel(session.start_at, session.end_at)}
            />
            <Row label="Coach responsable" value={coachName} />
            <Row label="Salle / lieu" value={session.location || "Non définie"} />
          </dl>

          {/* Capacity */}

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-[13px] font-bold text-slate-800">
              Capacité et réservations
            </h3>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] text-slate-500">Capacité</p>
                <p className="mt-1 text-lg font-bold">
                  {capacity.capacity ?? "—"}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2.5">
                <p className="text-[11px] text-blue-600">Réservées</p>
                <p className="mt-1 text-lg font-bold text-blue-700">
                  {capacity.enrolled ?? "—"}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-2.5">
                <p className="text-[11px] text-emerald-600">Libres</p>
                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {capacity.remaining ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-600">
                  Taux de remplissage
                </span>

                <span className="font-bold text-blue-700">
                  {capacity.percentage === null
                    ? "Indisponible"
                    : `${Math.round(capacity.percentage)}%`}
                </span>
              </div>

              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                role={capacity.percentage !== null ? "progressbar" : undefined}
                aria-label="Remplissage de la séance"
                aria-valuenow={capacity.percentage ?? undefined}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {capacity.percentage !== null && (
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacity.percentage >= 100 ? "bg-red-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${capacity.percentage}%` }}
                  />
                )}
              </div>

              {capacity.remaining === null && (
                <p className="mt-2 text-xs text-amber-700">
                  Les données de réservation ne sont pas disponibles.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* FOOTER */}

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Fermer
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(session)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Ban size={14} />
              Annuler la séance
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(session)}
            disabled={busy || !canCancel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Pencil size={14} />
            Modifier
          </button>
        </footer>
      </aside>
    </div>
  );
}