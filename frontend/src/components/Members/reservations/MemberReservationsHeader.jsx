import { CalendarCheck2, CalendarDays, RefreshCw, TicketCheck } from "lucide-react";

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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white sm:h-14 sm:w-14">
            <CalendarCheck2 size={25} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Bouray Gym · Espace membre
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Mes réservations
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Trouvez votre prochaine séance et gérez vos inscriptions en toute simplicité.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" role="tablist" aria-label="Réservations du membre">
          {tabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => onTabChange(id)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} />
              {label}
              {count !== null && count !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  activeTab === id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
