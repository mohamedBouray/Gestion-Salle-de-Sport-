import { CalendarDays, RefreshCw, TicketCheck } from "lucide-react";

export default function MemberReservationsHeader({
  activeTab,
  onTabChange,
  onRefresh,
  refreshing = false,
  sessionsCount = null,
  reservationsCount = null,
}) {
  const tabs = [
    { id: "available", label: "Séances disponibles", Icon: CalendarDays, count: sessionsCount },
    { id: "mine", label: "Mes réservations", Icon: TicketCheck, count: reservationsCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
            Mes réservations
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Trouvez votre prochaine séance et gérez vos inscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Réservations du membre"
        className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-slate-100 p-0.5"
      >
        {tabs.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => onTabChange(id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              activeTab === id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon size={15} />
            {label}
            {count !== null && count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  activeTab === id
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}