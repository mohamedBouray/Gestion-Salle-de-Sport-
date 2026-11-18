import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

const cards = [
  { key: "total", title: "Total des réservations", icon: CalendarCheck2 },
  { key: "confirmed", title: "Confirmées", icon: CheckCircle2 },
  { key: "pending", title: "En attente", icon: Clock3 },
  { key: "cancelled", title: "Annulées", icon: XCircle },
];

function getCount(stats, key) {
  if (!stats) return null;

  const value =
    stats[key] ??
    stats[`${key}_count`] ??
    stats.counts?.[key] ??
    (key === "total" ? stats.total_reservations : undefined);

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

export default function ReservationsStats({ stats = null, loading = false }) {
  return (
    <section
      aria-label="Statistiques des réservations"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {cards.map(({ key, title, icon: Icon }) => {
        const count = getCount(stats, key);

        return (
          <article
            key={key}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={18} />
            </span>

            <div className="min-w-0">
              {loading ? (
                <div className="h-6 w-10 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="text-2xl font-bold leading-none">
                  {count === null ? "—" : count.toLocaleString("fr-MA")}
                </p>
              )}

              <p className="mt-1 truncate text-xs text-slate-500">{title}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}