import FrenchDateInput from "../../shared/FrenchDateInput";
import { Search, RotateCcw } from "lucide-react";

const inputStyle = "h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default function AttendanceFilters({ filters, onChange, onReset, today }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
      <label className="relative min-w-0 flex-1 sm:min-w-52">
        <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
        <span className="sr-only">Rechercher</span>
        <input className={inputStyle} type="search" placeholder="Rechercher un nom ou email..." value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })} />
      </label>
      <label className="relative w-full sm:w-44">
        <span className="sr-only">Date du pointage</span>
        <FrenchDateInput type="date" value={filters.date} max={today} onChange={(e) => onChange({ date: e.target.value })}
          className={inputStyle.replace("pl-10", "pl-3")} />
      </label>
      <label className="w-full sm:w-40">
        <span className="sr-only">Filtrer par statut</span>
        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          <option value="all">Tous les statuts</option>
          <option value="present">Présents</option>
          <option value="left">Sortis</option>
          <option value="absent">Absents</option>
        </select>
      </label>
      <button type="button" onClick={onReset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
        <RotateCcw size={15} /> Réinitialiser
      </button>
    </div>
  );
}
