import { Ban, CheckCircle2, Clock3, MapPin, Pencil, UserRound } from "lucide-react";

// ========================================
// STATUS CONFIGURATION
// ========================================

const STATUS_CONFIG = {
  scheduled: {
    label: "Programmée",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    accent: "bg-blue-500",
    progress: "bg-blue-500",
    Icon: Clock3,
  },
  completed: {
    label: "Terminée",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    accent: "bg-emerald-500",
    progress: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Annulée",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    accent: "bg-red-500",
    progress: "bg-red-500",
    Icon: Ban,
  },
};

const DEFAULT_STATUS = {
  label: "Inconnu",
  badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
  accent: "bg-slate-400",
  progress: "bg-slate-400",
  Icon: Clock3,
};

// ========================================
// HELPERS
// ========================================

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-MA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCourseName(session) {
  return session.course?.name || session.course_name || "Cours sportif";
}

function getCoachName(session) {
  return session.coach?.name || session.coach_name || "Coach non assigné";
}

function getCapacityInfo(session) {
  const capacity = Number(session.capacity);

  const validCapacity =
    session.capacity != null && Number.isFinite(capacity) && capacity > 0;

  if (!validCapacity) {
    return { capacity: null, remaining: null, occupied: null, percentage: null };
  }

  let remaining = null;

  if (session.remaining_places != null) {
    const value = Number(session.remaining_places);

    if (Number.isFinite(value)) {
      remaining = Math.max(0, Math.min(capacity, value));
    }
  } else if (session.enrolled_count != null) {
    const count = Number(session.enrolled_count);

    if (Number.isFinite(count)) {
      remaining = Math.max(0, capacity - count);
    }
  }

  if (remaining === null) {
    return { capacity, remaining: null, occupied: null, percentage: null };
  }

  const occupied = capacity - remaining;

  return {
    capacity,
    remaining,
    occupied,
    percentage: Math.min(100, Math.max(0, (occupied / capacity) * 100)),
  };
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function SessionCard({
  session,
  onView,
  onEdit,
  busy = false,
}) {
  if (!session) return null;

  const status = STATUS_CONFIG[session.status] || DEFAULT_STATUS;

  const courseName = getCourseName(session);
  const coachName = getCoachName(session);

  const startTime = formatTime(session.start_at);
  const endTime = formatTime(session.end_at);

  const capacity = getCapacityInfo(session);

  const isCancelled = session.status === "cancelled";
  const isFull = capacity.remaining !== null && capacity.remaining === 0;

  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-lg border bg-white transition hover:border-blue-200 hover:shadow-sm ${
        isCancelled ? "border-red-100" : "border-slate-200"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${status.accent}`} />

      <div className="space-y-2 p-2.5 pl-3.5">
        {/* TIME + STATUS */}

        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-bold tabular-nums text-slate-800">
            {startTime} – {endTime}
          </span>

          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${status.badge}`}
          >
            {status.label}
          </span>
        </div>

        {/* TITLE */}

        <h3
          title={courseName}
          className={`break-words text-[13px] font-bold leading-snug text-[#0f1b33] ${
            isCancelled ? "text-slate-400 line-through" : ""
          }`}
        >
          {courseName}
        </h3>

        {/* INFO */}

        <div className="space-y-1 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <UserRound size={12} className="shrink-0 text-slate-400" />
            <span className="truncate" title={coachName}>
              {coachName}
            </span>
          </p>

          <p className="flex items-center gap-1.5">
            <MapPin size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {session.location || "Salle non définie"}
            </span>
          </p>
        </div>

        {/* CAPACITY */}

        {capacity.capacity !== null && (
          <div>
            {capacity.percentage !== null && (
              <div
                className="h-1.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Taux de remplissage"
                aria-valuenow={capacity.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? "bg-red-500" : status.progress
                  }`}
                  style={{ width: `${capacity.percentage}%` }}
                />
              </div>
            )}

            <p
              className={`mt-1 text-[11px] font-medium ${
                isFull ? "text-red-600" : "text-slate-500"
              }`}
            >
              {capacity.occupied !== null
                ? isFull
                  ? `Complète · ${capacity.occupied}/${capacity.capacity}`
                  : `${capacity.occupied}/${capacity.capacity} · ${capacity.remaining} libre(s)`
                : `${capacity.capacity} places`}
            </p>
          </div>
        )}

        {/* ACTIONS */}

        <div className="flex gap-1.5 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={onView}
            disabled={busy}
            aria-label={`Voir les détails de ${courseName}`}
            className="h-8 min-w-0 flex-1 rounded-md bg-blue-600 px-2 text-xs font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Détails
          </button>

          <button
            type="button"
            onClick={onEdit}
            disabled={busy || session.status !== "scheduled" || new Date(session.start_at).getTime() <= Date.now()}
            aria-label={`Modifier ${courseName}`}
            title="Modifier la séance"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}