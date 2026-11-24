import { useState } from "react";
import {
    CalendarDays, Dumbbell, Eye, ImageOff, LoaderCircle,
    Lock, LockOpen, Pencil, Trash2, UserRound,
} from "lucide-react";

const statuses = {
    active: { label: "Actif", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
    inactive: { label: "Inactif", badge: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
    pending: { label: "En attente", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
};



const coachName = (course) =>
    course.coach?.name || (typeof course.coach === "string" ? course.coach : "") || course.coach_name || "Non assigné";

function CourseCover({ course }) {
    const [failed, setFailed] = useState(false);
    const rawImage = course.image_url || course.image;
    const image = typeof rawImage === "string" && /^(https?:\/\/|\/)/i.test(rawImage) ? rawImage : "";
    const status = statuses[course.status] || { label: course.status || "—", badge: "bg-slate-50 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" };

    return (
        <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
            {image && !failed ? (
                <img
                    src={image}
                    alt={course.name || "Cours sportif"}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                    {failed ? <ImageOff size={34} strokeWidth={1.5} /> : <Dumbbell size={38} strokeWidth={1.5} />}
                </div>
            )}

            <span className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset backdrop-blur ${status.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
            </span>
        </div>
    );
}

function IconAction({ label, onClick, disabled, danger = false, children }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 ${
                danger
                    ? "border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    : "border-slate-200 text-slate-400 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
            {children}
        </button>
    );
}

function CourseCard({ course, busy, disabled, onView, onEdit, onToggleStatus, onDelete }) {
    const coach = coachName(course);
    const canToggle = ["active", "inactive", "pending"].includes(course.status);
    const sessionCount = course.sessions_count;

    return (
        <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:border-blue-200 hover:shadow-md">
            <CourseCover key={course.image_url || course.image || "none"} course={course} />

            <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate text-[15px] font-bold text-[#0f1b33]" title={course.name}>
                    {course.name || "Sans titre"}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-slate-500">
                    {course.description || "Un cours collectif pour progresser à votre rythme."}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                        <UserRound size={15} className="shrink-0 text-slate-400" />
                        <span className="truncate" title={coach}>{coach}</span>
                    </span>

                    {sessionCount !== null && sessionCount !== undefined && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-slate-500" title="Nombre de séances">
                            <CalendarDays size={15} />
                            {sessionCount}
                        </span>
                    )}
                </div>

                <p className="mt-3 text-xl font-extrabold tracking-tight text-blue-600">
                    Par abonnement
                </p>

                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                    {busy ? (
                        <div className="flex h-9 w-full items-center justify-center gap-2 text-[13px] text-blue-600">
                            <LoaderCircle size={17} className="animate-spin" /> Traitement...
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => onView(course)}
                                disabled={disabled}
                                className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Eye size={15} /> Voir détails
                            </button>

                            <IconAction label="Modifier le cours" disabled={disabled} onClick={() => onEdit(course)}>
                                <Pencil size={16} />
                            </IconAction>

                            {canToggle && (
                                <IconAction
                                    label={course.status === "active" ? "Désactiver le cours" : "Activer le cours"}
                                    disabled={disabled}
                                    onClick={() => onToggleStatus(course)}
                                >
                                    {course.status === "active" ? <Lock size={16} /> : <LockOpen size={16} />}
                                </IconAction>
                            )}

                            <IconAction label="Archiver le cours" danger disabled={disabled} onClick={() => onDelete(course)}>
                                <Trash2 size={16} />
                            </IconAction>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function CoursesTable({ courses = [], loading, busyId, onView, onEdit, onToggleStatus, onDelete }) {
    const disabled = busyId !== null && busyId !== undefined;

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="aspect-[16/8] animate-pulse bg-slate-100" />
                        <div className="space-y-3 p-4">
                            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="py-16 text-center text-slate-400">
                <Dumbbell size={30} className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Aucun cours trouvé</p>
                <p className="mt-1 text-sm">Ajoutez votre premier cours ou modifiez la recherche.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {courses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                    busy={busyId === course.id}
                    disabled={disabled}
                    onView={onView}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}