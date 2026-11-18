import { Search, RotateCcw, X } from "lucide-react";

// ========================================
// SELECT FIELD
// ========================================

const selectClass =
  "h-10 min-w-[150px] flex-1 rounded-lg border border-slate-200 bg-white px-3 " +
  "text-[13px] text-slate-700 outline-none transition sm:flex-none " +
  "hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

function FilterSelect({ label, value, onChange, options, disabled = false }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={selectClass}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function PlanningFilters({
  filters,
  onChange,
  onReset,
  courses = [],
  coaches = [],
  loading = false,
  totalCount = 0,
  filteredCount = 0,
}) {
  const search = filters.search ?? "";
  const status = filters.status ?? "all";
  const courseId = filters.courseId ?? "all";
  const coachId = filters.coachId ?? "all";

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "scheduled", label: "Programmées" },
    { value: "completed", label: "Terminées" },
    { value: "cancelled", label: "Annulées" },
  ];

  const courseOptions = [
    { value: "all", label: "Tous les cours" },
    ...courses.map((course) => ({
      value: String(course.id),
      label: course.name || `Cours #${course.id}`,
    })),
  ];

  const coachOptions = [
    { value: "all", label: "Tous les coachs" },
    ...coaches.map((coach) => ({
      value: String(coach.id),
      label: coach.name || `Coach #${coach.id}`,
    })),
  ];

  const activeCount = [
    search.trim() !== "",
    status !== "all",
    courseId !== "all",
    coachId !== "all",
  ].filter(Boolean).length;

  function update(key, value) {
    onChange({ [key]: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* SEARCH */}

      <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id="planning-search"
          type="search"
          value={search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Rechercher un cours, un coach, une salle..."
          aria-label="Rechercher une séance"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />

        {search !== "" && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => update("search", "")}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:text-slate-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* SELECTS */}

      <FilterSelect
        label="Cours sportif"
        value={courseId}
        disabled={loading}
        onChange={(value) => update("courseId", value)}
        options={courseOptions}
      />

      <FilterSelect
        label="Coach"
        value={coachId}
        disabled={loading}
        onChange={(value) => update("coachId", value)}
        options={coachOptions}
      />

      <FilterSelect
        label="Statut de la séance"
        value={status}
        onChange={(value) => update("status", value)}
        options={statusOptions}
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
        <strong className="font-bold text-slate-800">{filteredCount}</strong>
        {" / "}
        {totalCount} séance(s)
      </span>
    </div>
  );
}