import { RotateCcw, Search, X } from "lucide-react";

const controlClass =
  "h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none transition " +
  "hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60";

export default function ReservationsFilters({
  filters = { search: "", status: "all", courseId: "all", date: "" },
  onChange,
  onReset,
  courses = [],
  loading = false,
  total = null,
}) {
  const activeCount = [
    Boolean(filters.search?.trim()),
    filters.status !== "all",
    filters.courseId !== "all",
    Boolean(filters.date),
  ].filter(Boolean).length;

  return (
    <div
      className="flex flex-wrap items-center gap-2.5"
      role="search"
      aria-label="Filtres des réservations"
    >
      {/* SEARCH */}

      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Membre, email, cours..."
          aria-label="Rechercher une réservation"
          className={`${controlClass} w-full pl-9 pr-9 placeholder:text-slate-400`}
        />

        {filters.search && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => onChange({ search: "" })}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* STATUS */}

      <select
        value={filters.status ?? "all"}
        onChange={(event) => onChange({ status: event.target.value })}
        aria-label="Statut"
        title="Statut"
        className={controlClass}
      >
        <option value="all">Tous les statuts</option>
        <option value="pending">En attente</option>
        <option value="confirmed">Confirmée</option>
        <option value="attended">Présence enregistrée</option>
        <option value="cancelled">Annulée</option>
      </select>

      {/* COURSE */}

      <select
        value={filters.courseId ?? "all"}
        onChange={(event) => onChange({ courseId: event.target.value })}
        disabled={loading}
        aria-label="Cours sportif"
        title="Cours sportif"
        className={`${controlClass} max-w-[220px]`}
      >
        <option value="all">Tous les cours</option>
        {courses.map((course) => (
          <option key={course.id} value={String(course.id)}>
            {course.name || `Cours #${course.id}`}
          </option>
        ))}
      </select>

      {/* DATE */}

      <input
        type="date"
        value={filters.date ?? ""}
        onChange={(event) => onChange({ date: event.target.value })}
        aria-label="Date de séance"
        title="Date de séance"
        className={controlClass}
      />

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
        >
          <RotateCcw size={14} />
          Réinitialiser
        </button>
      )}

      <span className="ml-auto text-xs text-slate-500">
        {total === null || total === undefined
          ? "Total indisponible"
          : `${total} réservation(s)`}
      </span>
    </div>
  );
}