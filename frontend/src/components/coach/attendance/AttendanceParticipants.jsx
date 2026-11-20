
import { useMemo, useState } from "react";

import {
  Check,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  Empty,
  monogram,
} from "../CoachUI";

const FILTERS = [
  ["all", "Tous"],
  ["unmarked", "Non pointés"],
  ["present", "Présents"],
  ["absent", "Absents"],
];

function normalizeStatus(value) {
  return value === "present" || value === "absent"
    ? value
    : "unmarked";
}

function StatusBadge({ status }) {
  const styles = {
    present: [
      "Présent",
      "bg-emerald-50 text-emerald-700",
    ],
    absent: [
      "Absent",
      "bg-rose-50 text-rose-700",
    ],
    unmarked: [
      "Non pointé",
      "bg-amber-50 text-amber-700",
    ],
  };

  const [label, className] = styles[normalizeStatus(status)];

  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${className}`}
    >
      {label}
    </span>
  );
}

export default function AttendanceParticipants({
  participants = [],
  canMark = false,
  savingId = null,
  onMark,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const summary = {
      total: participants.length,
      present: 0,
      absent: 0,
      unmarked: 0,
    };

    participants.forEach((person) => {
      summary[normalizeStatus(person.attendance_status)] += 1;
    });

    return summary;
  }, [participants]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");

    return participants.filter((person) => {
      const name = person.member?.name || "";
      const email = person.member?.email || "";

      const matchesSearch = `${name} ${email}`
        .toLocaleLowerCase("fr")
        .includes(term);

      return (
        matchesSearch &&
        (filter === "all" ||
          normalizeStatus(person.attendance_status) === filter)
      );
    });
  }, [participants, search, filter]);

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Présents", counts.present, "text-emerald-700"],
          ["Absents", counts.absent, "text-rose-700"],
          ["Non pointés", counts.unmarked, "text-amber-700"],
        ].map(([label, count, color]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <p className={`text-lg font-extrabold ${color}`}>
              {count}
            </p>

            <p className="text-[11px] text-slate-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[170px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un membre..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-400"
          />
        </label>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filtrer les présences"
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700"
        >
          {FILTERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Cards des membres */}
      {visible.length ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {visible.map((person) => {
            const current = normalizeStatus(
              person.attendance_status
            );

            const busy =
              savingId === person.enrollment_id;

            const disabled =
              !canMark || savingId !== null;

            return (
              <article
                key={person.enrollment_id}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                    {person.member?.name ? (
                      monogram(person.member.name)
                    ) : (
                      <UserRound size={16} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {person.member?.name || "Membre"}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {person.member?.email || "—"}
                    </p>
                  </div>

                  <StatusBadge status={current} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {/* Bouton Present */}
                  <button
                    type="button"
                    disabled={disabled || current === "present"}
                    onClick={() =>
                      onMark(person.enrollment_id, "present")
                    }
                    aria-label={`Marquer ${
                      person.member?.name || "le membre"
                    } présent`}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition disabled:cursor-not-allowed ${
                      current === "present"
                        ? "bg-emerald-100 text-emerald-800"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                    }`}
                  >
                    <Check size={14} />

                    {busy ? "Enregistrement..." : "Présent"}
                  </button>

                  {/* Bouton Absent */}
                  <button
                    type="button"
                    disabled={disabled || current === "absent"}
                    onClick={() =>
                      onMark(person.enrollment_id, "absent")
                    }
                    aria-label={`Marquer ${
                      person.member?.name || "le membre"
                    } absent`}
                    className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition disabled:cursor-not-allowed ${
                      current === "absent"
                        ? "bg-rose-100 text-rose-800"
                        : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    }`}
                  >
                    <X size={14} />
                    Absent
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title={
            participants.length
              ? "Aucun membre correspondant"
              : "Aucun membre inscrit"
          }
          detail={
            participants.length
              ? "Changez la recherche ou le filtre."
              : "Les réservations confirmées apparaîtront ici."
          }
        />
      )}
    </div>
  );
}
