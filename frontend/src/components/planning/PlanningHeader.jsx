import { CalendarPlus2, RefreshCw } from "lucide-react";

export default function PlanningHeader({
  onCreate,
  onRefresh,
  refreshing = false,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
          Gestion du planning
        </h1>

        <p className="mt-1 text-[13px] text-slate-500">
          Organisez les séances, les coachs, les horaires et les places
          disponibles.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Actualiser les séances"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700"
        >
          <CalendarPlus2 size={16} />
          Programmer une séance
        </button>
      </div>
    </header>
  );
}