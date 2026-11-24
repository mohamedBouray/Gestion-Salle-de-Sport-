import { gymDateKey } from "../../utils/gymDates.js";
import { Plus } from "lucide-react";

import SessionCard from "./SessionCard";

// ========================================
// DATE HELPERS
// ========================================

const dateKey = gymDateKey;

function getDayName(value) {
  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca", weekday: "long" }).format(value);
}

// ========================================
// DAY COLUMN
// ========================================

function DayColumn({
  day,
  sessions,
  isToday,
  isPast,
  onViewSession,
  onEditSession,
  onCreateSession,
  busy,
}) {
  const count = sessions.length;

  return (
    <section
      className={`flex min-w-0 flex-col overflow-hidden rounded-lg border bg-white ${
        isToday ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
      }`}
    >
      {/* DAY HEADER */}

      <header
        className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 ${
          isToday
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`truncate text-xs font-semibold capitalize ${
              isToday ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {getDayName(day)}
          </p>

          <p className="mt-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold tabular-nums leading-none">
              {new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Casablanca", day: "2-digit", month: "2-digit", year: "numeric" }).format(day)}
            </span>
          </p>
        </div>

        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            isToday
              ? "bg-white/20 text-white"
              : count > 0
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {count}
        </span>
      </header>

      {/* DAY CONTENT */}

      <div className="flex flex-1 flex-col gap-2 p-2">
        {count === 0 ? (
          <p className="py-5 text-center text-xs text-slate-400">
            Aucune séance
          </p>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onView={() => onViewSession(session)}
              onEdit={() => onEditSession(session)}
              busy={busy}
            />
          ))
        )}

        {!isPast && <button
          type="button"
          onClick={() => onCreateSession(day)}
          disabled={busy}
          className="mt-auto flex h-8 items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 text-xs font-semibold text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        >
          <Plus size={14} />
          Ajouter
        </button>}
      </div>
    </section>
  );
}

// ========================================
// MAIN CALENDAR
// ========================================

export default function PlanningCalendar({
  days = [],
  sessionsByDay = {},
  onViewSession,
  onEditSession,
  onCreateSession,
  busy = false,
  now = Date.now(),
}) {
  const todayKey = dateKey(new Date(now));

  return (
    <div className="overflow-x-auto p-3">
      <div className="grid grid-cols-1 items-stretch gap-2.5 md:grid-flow-col md:grid-cols-none md:auto-cols-[minmax(170px,1fr)]">
        {days.map((day) => {
          const key = dateKey(day);

          return (
            <DayColumn
              key={key}
              day={day}
              sessions={sessionsByDay[key] ?? []}
              isToday={key === todayKey}
              isPast={key < todayKey}
              onViewSession={onViewSession}
              onEditSession={onEditSession}
              onCreateSession={onCreateSession}
              busy={busy}
            />
          );
        })}
      </div>
    </div>
  );
}