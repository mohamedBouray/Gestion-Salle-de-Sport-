import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, CalendarDays, UserRound } from "lucide-react";

export default function CourseCard({ course }) {
    const count = Math.max(0, Number(course.upcoming_sessions_count) || 0);
    const hasSessions = count > 0;

    return (
        <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BookOpen size={19} /></span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${hasSessions ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                    {hasSessions ? "Séances programmées" : "À planifier"}
                </span>
            </div>
            <h3 className="mt-3 text-sm font-extrabold text-slate-900">{course.name || "Cours sportif"}</h3>
            <p className="mt-1 line-clamp-3 min-h-12 text-xs leading-5 text-slate-500">
                {course.description || "Découvrez ce cours sportif et les séances proposées."}
            </p>
            <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p className="flex items-center gap-2"><UserRound size={14} className="text-blue-500" /><span className="truncate">{course.coach?.name || "Coach à confirmer"}</span></p>
                <p className="flex items-center gap-2"><CalendarDays size={14} className="text-blue-500" />{hasSessions ? `${count} séance(s) à venir` : "Aucune séance future programmée"}</p>
                {course.subscription_plans?.map((plan) => (
                    <p key={plan.id} className="text-xs text-slate-600">
                        {plan.name} · {Number(plan.price).toLocaleString("fr-MA")} MAD / {plan.duration_value} {plan.duration_unit === "day" ? "j" : plan.duration_unit === "month" ? "mois" : "an(s)"}
                    </p>
                ))}
                <p className="text-xs text-slate-600">Séances incluses si couvertes par votre abonnement.</p>
            </div>
            {hasSessions ? (
                <Link to={`/member/schedule?course=${course.id}`} className="mt-auto flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700">
                    Voir les séances <ArrowUpRight size={14} />
                </Link>
            ) : (
                <span className="mt-auto flex h-9 cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500" aria-label="Aucune séance à venir">
                    Planning non disponible
                </span>
            )}
            {hasSessions && <p className="mt-2 text-[10px] text-slate-400">La disponibilité des places dépend de chaque séance.</p>}
        </article>
    );
}