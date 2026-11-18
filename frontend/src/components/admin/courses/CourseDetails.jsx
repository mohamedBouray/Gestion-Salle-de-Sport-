import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, Dumbbell, LoaderCircle, MapPin, Users, X } from "lucide-react";
import { coursesApi } from "../../../services/CoursesApi";
import { apiError } from "../../../services/api";

const statuses = {
    active: { label: "Actif", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    inactive: { label: "Inactif", className: "bg-red-50 text-red-700 ring-red-600/20" },
    pending: { label: "En attente", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
};
const sessionLabels = { scheduled: "Programmée", completed: "Terminée", cancelled: "Annulée" };

const date = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" });
};
const time = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
};
const money = (value) => value == null || !Number.isFinite(Number(value)) ? "—"
    : `${Number(value).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;

function Row({ label, value }) {
    return (
        <div className="flex justify-between gap-4 px-4 py-2.5 text-[13px]">
            <dt className="text-slate-500">{label}</dt>
            <dd className="break-words text-right font-medium text-slate-800">{value ?? "—"}</dd>
        </div>
    );
}

export default function CourseDetails({ courseId, onClose }) {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setCourse(null);
        setError("");
        coursesApi.show(courseId)
            .then((result) => { if (mounted) setCourse(result.course ?? result.data ?? result); })
            .catch((err) => { if (mounted) setError(apiError(err)); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [courseId]);

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previous;
        };
    }, [onClose]);

    const imageValue = course?.image_url || course?.image;
    const image = typeof imageValue === "string" && /^(https?:\/\/|\/|blob:|data:image\/)/i.test(imageValue) ? imageValue : "";
    const status = statuses[course?.status];
    const sessions = Array.isArray(course?.sessions) ? course.sessions : null;
    const sessionsCount = course?.sessions_count ?? sessions?.length;

    return createPortal(
        <div
            className="fixed inset-0 z-[150] bg-slate-950/50"
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-details-title"
                className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5">
                    <h2 id="course-details-title" className="text-base font-bold text-[#0f1b33]">
                        Détails du cours
                    </h2>
                    <button
                        type="button"
                        title="Fermer"
                        aria-label="Fermer"
                        onClick={onClose}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                            <LoaderCircle className="animate-spin text-blue-600" size={20} />
                            Chargement...
                        </div>
                    )}

                    {error && (
                        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">
                            {error}
                        </p>
                    )}

                    {!loading && !error && !course && (
                        <p className="py-14 text-center text-sm text-slate-500">Cours introuvable.</p>
                    )}

                    {course && (
                        <>
                            {/* Cover + title */}
                            <section>
                                <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                                    {image
                                        ? <img src={image} alt={course.name || "Cours"} className="h-full w-full object-cover" />
                                        : <Dumbbell size={40} strokeWidth={1.5} />}
                                </div>

                                <div className="mt-4 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400">Cours #{course.id}</p>
                                        <h3 className="mt-0.5 break-words text-lg font-bold text-[#0f1b33]">
                                            {course.name}
                                        </h3>
                                    </div>

                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status?.className || "bg-slate-50 text-slate-600 ring-slate-500/20"}`}>
                                        {status?.label || course.status || "—"}
                                    </span>
                                </div>

                                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
                                    {course.description || "Aucune description renseignée."}
                                </p>
                            </section>

                            {/* Info list */}
                            <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                                <Row label="Coach principal" value={course.coach?.name || course.coach_name || "Non assigné"} />
                                <Row label="Prix par séance" value={money(course.price)} />
                                <Row label="Séances associées" value={sessionsCount ?? "Non renseigné"} />
                                <Row label="Création" value={date(course.created_at)} />
                                <Row label="Dernière modification" value={date(course.updated_at)} />
                            </dl>

                            {/* Sessions */}
                            {sessions && (
                                <section className="rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                                        <h3 className="text-[13px] font-bold">Séances programmées</h3>
                                        {sessionsCount != null && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                                                {sessionsCount}
                                            </span>
                                        )}
                                    </div>

                                    {!sessions.length ? (
                                        <p className="p-5 text-center text-[13px] text-slate-400">
                                            Aucune séance pour le moment.
                                        </p>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {sessions.map((session) => (
                                                <div key={session.id} className="px-4 py-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-slate-800">
                                                                {date(session.start_at)}
                                                            </p>
                                                            <p className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-slate-500">
                                                                <Clock3 size={12} />
                                                                {time(session.start_at)} – {time(session.end_at)}
                                                            </p>
                                                        </div>

                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                                            {sessionLabels[session.status] || session.status || "—"}
                                                        </span>
                                                    </div>

                                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {session.location || "Salle non définie"}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Users size={12} />
                                                            {session.capacity ?? "—"} places
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {sessionsCount > sessions.length && (
                                        <p className="border-t border-slate-100 p-3 text-center text-[11px] text-slate-400">
                                            Seules les premières séances sont affichées.
                                        </p>
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </div>

                <footer className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Fermer
                    </button>
                </footer>
            </aside>
        </div>, document.body
    );
}