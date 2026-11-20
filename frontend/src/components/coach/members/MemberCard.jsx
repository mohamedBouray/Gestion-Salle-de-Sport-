
import { ArrowUpRight, CalendarClock, Mail, UsersRound } from "lucide-react";
import { monogram } from "../CoachUI";

const statusStyle = {
  active: ["Actif", "bg-emerald-50 text-emerald-700"],
  pending: ["En attente", "bg-amber-50 text-amber-700"],
  suspended: ["Suspendu", "bg-rose-50 text-rose-700"],
  inactive: ["Inactif", "bg-slate-100 text-slate-600"],
};

export default function MemberCard({ member, onView }) {
  const [statusLabel, statusClass] = statusStyle[member.status] || [
    "—",
    "bg-slate-100 text-slate-600",
  ];

  const courses = Array.isArray(member.courses) ? member.courses : [];

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-700">
          {monogram(member.name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {member.name || "Membre"}
          </h3>

          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <Mail size={13} className="shrink-0" />
            <span className="truncate">
              {member.email || "Email non disponible"}
            </span>
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {courses.length ? (
          courses.slice(0, 2).map((course) => (
            <span
              key={course.id}
              className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
            >
              {course.name}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">
            Aucun cours indiqué
          </span>
        )}

        {courses.length > 2 && (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
            +{courses.length - 2}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <UsersRound size={14} className="text-blue-500" />
          <strong className="text-slate-900">
            {member.reservations_count ?? 0}
          </strong>
          inscriptions
        </p>

        <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <CalendarClock size={14} className="text-blue-500" />
          <strong className="text-slate-900">
            {member.upcoming_sessions_count ?? 0}
          </strong>
          à venir
        </p>
      </div>

      <button
        type="button"
        onClick={() => onView(member.id)}
        className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        Voir détails
        <ArrowUpRight size={14} />
      </button>
    </article>
  );
}
