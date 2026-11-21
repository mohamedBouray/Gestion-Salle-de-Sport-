
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  UserRound,
} from "lucide-react";

export default function CourseCard({ course }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BookOpen size={19} />
        </span>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          Disponible
        </span>
      </div>

      <h3 className="mt-3 text-sm font-extrabold text-slate-900">
        {course.name || "Cours sportif"}
      </h3>

      <p className="mt-1 line-clamp-3 min-h-12 text-xs leading-5 text-slate-500">
        {course.description || "Découvrez ce cours sportif et les séances proposées."}
      </p>

      <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <p className="flex items-center gap-2">
          <UserRound size={14} className="text-blue-500" />
          <span className="truncate">
            {course.coach?.name || "Coach à confirmer"}
          </span>
        </p>

        <p className="flex items-center gap-2">
          <CalendarDays size={14} className="text-blue-500" />
          {course.upcoming_sessions_count == null
            ? "Planning à consulter"
            : `${course.upcoming_sessions_count} séance(s) à venir`}
        </p>
      </div>

      <Link
        to={`/member/schedule?course=${course.id}`}
        className="mt-auto flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 pt-0 text-xs font-bold text-white transition hover:bg-blue-700"
      >
        Voir les séances
        <ArrowUpRight size={14} />
      </Link>
    </article>
  );
}
