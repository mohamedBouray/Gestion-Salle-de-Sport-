import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  Users,
} from "lucide-react";

// ========================================
// STAT CARD
// ========================================

function StatCard({ title, value, hint, icon: Icon, loading }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={18} />
      </span>

      <div className="min-w-0">
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="text-2xl font-bold leading-none">{value}</p>
        )}

        <p className="mt-1 truncate text-xs text-slate-500" title={hint}>
          {title}
        </p>
      </div>
    </article>
  );
}

// ========================================
// HELPERS
// ========================================

function getRemainingPlaces(session) {
  if (session.remaining_places != null) {
    const value = Number(session.remaining_places);

    return Number.isFinite(value) ? Math.max(0, value) : null;
  }

  if (session.capacity != null && session.enrolled_count != null) {
    const capacity = Number(session.capacity);
    const enrolled = Number(session.enrolled_count);

    if (Number.isFinite(capacity) && Number.isFinite(enrolled)) {
      return Math.max(0, capacity - enrolled);
    }
  }

  return null;
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function PlanningStats({
  sessions = [],
  filteredSessions = [],
  loading = false,
}) {
  const items = Array.isArray(filteredSessions) ? filteredSessions : sessions;

  const scheduledSessions = items.filter(
    (session) => session.status === "scheduled"
  );

  const completedSessions = items.filter(
    (session) => session.status === "completed"
  );

  // Places disponibles : uniquement si Laravel fournit les vraies données.
  const remainingValues = scheduledSessions.map(getRemainingPlaces);

  const placesKnown = remainingValues.every((value) => value !== null);

  const availablePlaces = placesKnown
    ? remainingValues.reduce((total, value) => total + value, 0)
    : "—";

  const stats = [
    {
      title: "Total des séances",
      value: items.length,
      hint: "Séances de la période affichée",
      icon: CalendarDays,
    },
    {
      title: "Programmées",
      value: scheduledSessions.length,
      hint: "Séances planifiées",
      icon: CalendarCheck2,
    },
    {
      title: "Terminées",
      value: completedSessions.length,
      hint: "Séances déjà terminées",
      icon: CheckCircle2,
    },
    {
      title: "Places disponibles",
      value: availablePlaces,
      hint: placesKnown
        ? "Places restantes sur les séances programmées"
        : "Données de réservation indisponibles",
      icon: Users,
    },
  ];

  return (
    <section
      aria-label="Statistiques du planning"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} loading={loading} />
      ))}
    </section>
  );
}