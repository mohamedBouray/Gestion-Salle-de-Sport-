import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell, UserRoundCheck, X } from "lucide-react";
import { adminApi } from "../../../services/AdminApi";
import { apiError } from "../../../services/api";

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const labels = { active: "Actif", pending: "En attente", inactive: "Bloqué" };
const colors = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
    inactive: "bg-red-50 text-red-700 ring-red-600/15",
};

function Counter({ title, value, icon: Icon }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <Icon size={17} className="mx-auto mb-1.5 text-blue-600" />
            <strong className="block text-lg leading-none">{value ?? 0}</strong>
            <span className="mt-1 block text-[11px] text-slate-500">{title}</span>
        </div>
    );
}

export default function CoachDetails({ coachId, onClose }) {
    const [coach, setCoach] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setCoach(null);
        setError("");

        adminApi.coaches.show(coachId)
            .then(({ coach }) => active && setCoach(coach))
            .catch((e) => active && setError(apiError(e)));

        return () => { active = false; };
    }, [coachId]);

    useEffect(() => {
        const close = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-950/50"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Détails du coach"
                className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-xl"
            >
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
                    <h2 className="text-base font-bold">Détails du coach</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="space-y-4 p-5">
                    {error && (
                        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">
                            {error}
                        </p>
                    )}

                    {!coach && !error && (
                        <p className="text-sm text-slate-500">Chargement...</p>
                    )}

                    {coach && (
                        <>
                            {/* Profile */}
                            <section>
                                <div className="flex items-center gap-3">
                                    {coach.profile?.photo_url ? (
                                        <img
                                            src={coach.profile.photo_url}
                                            alt={coach.name}
                                            className="h-14 w-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                                            {coach.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h3 className="truncate font-bold text-slate-900">
                                            {coach.name}
                                        </h3>
                                        <p className="break-all text-xs text-slate-500">
                                            {coach.email}
                                        </p>
                                        <span
                                            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                                                colors[coach.status] || "bg-slate-100 text-slate-600 ring-slate-500/15"
                                            }`}
                                        >
                                            {labels[coach.status] || coach.status}
                                        </span>
                                    </div>
                                </div>

                                <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 text-[13px]">
                                    <div className="flex justify-between gap-3 px-3 py-2">
                                        <dt className="text-slate-500">Spécialité</dt>
                                        <dd className="text-right font-medium text-slate-800">
                                            {coach.profile?.specialty || "Non définie"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3 px-3 py-2">
                                        <dt className="text-slate-500">Expérience</dt>
                                        <dd className="font-medium text-slate-800">
                                            {coach.profile?.experience_years ?? 0} ans
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3 px-3 py-2">
                                        <dt className="text-slate-500">Téléphone</dt>
                                        <dd className="font-medium text-slate-800">
                                            {coach.phone || "—"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-3 px-3 py-2">
                                        <dt className="text-slate-500">Landing Page</dt>
                                        <dd className="font-medium text-slate-800">
                                            {coach.profile?.is_featured ? "Oui" : "Non"}
                                        </dd>
                                    </div>
                                </dl>

                                <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-slate-600">
                                    {coach.profile?.bio || "Aucune biographie."}
                                </p>
                            </section>

                            {/* Counters */}
                            <div className="grid grid-cols-3 gap-2">
                                <Counter title="Cours" value={coach.coached_courses_count} icon={Dumbbell} />
                                <Counter title="Séances" value={coach.coached_sessions_count} icon={CalendarDays} />
                                <Counter title="Demandes" value={coach.received_requests_count} icon={UserRoundCheck} />
                            </div>

                            {/* Availabilities */}
                            <section className="rounded-lg border border-slate-200">
                                <h3 className="border-b border-slate-200 px-3 py-2.5 text-[13px] font-bold">
                                    Disponibilités hebdomadaires
                                </h3>

                                {coach.coach_availabilities?.length ? (
                                    <div className="divide-y divide-slate-100 px-3">
                                        {coach.coach_availabilities.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="flex justify-between gap-3 py-2 text-[13px]"
                                            >
                                                <span>{days[slot.day_of_week] ?? `Jour ${slot.day_of_week}`}</span>
                                                <span className="tabular-nums text-slate-500">
                                                    {slot.start_time} – {slot.end_time}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-3 text-[13px] text-slate-500">
                                        Aucune disponibilité enregistrée.
                                    </p>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}