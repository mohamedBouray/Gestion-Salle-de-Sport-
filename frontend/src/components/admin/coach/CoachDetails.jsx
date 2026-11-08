import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell, UserRoundCheck, X } from "lucide-react";
import { adminApi } from "../../../services/AdminApi";
import { apiError } from "../../../services/api";

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const labels = { active: "Actif", pending: "En attente", inactive: "Inactif" };

function Counter({ title, value, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 p-3 text-center">
            <Icon size={20} className="mx-auto mb-2 text-blue-600" />
            <strong className="block text-xl">{value ?? 0}</strong>
            <span className="text-xs text-slate-500">{title}</span>
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
        <div className="fixed inset-0 z-[100] bg-slate-950/50"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside role="dialog" aria-modal="true" aria-label="Détails du coach"
                className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-xl">

                <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
                    <h2 className="text-lg font-bold">Détails du coach</h2>
                    <button type="button" onClick={onClose} aria-label="Fermer"
                        className="rounded-lg p-2 hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </header>

                <div className="space-y-4 p-5">
                    {error && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                    )}
                    {!coach && !error && (
                        <p className="text-sm text-slate-500">Chargement...</p>
                    )}

                    {coach && (
                        <>
                            <section className="rounded-xl bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    {coach.profile?.photo_url ? (
                                        <img src={coach.profile.photo_url} alt={coach.name}
                                            className="h-16 w-16 rounded-xl object-cover" />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">
                                            {coach.name?.[0]}
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900">{coach.name}</h3>
                                        <p className="break-all text-sm text-slate-500">{coach.email}</p>
                                        <span className="text-xs font-medium text-blue-600">
                                            {labels[coach.status] || coach.status}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm text-slate-700">
                                    {coach.profile?.specialty || "Spécialité non définie"} · {coach.profile?.experience_years ?? 0} ans d'expérience
                                </p>
                                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                                    {coach.profile?.bio || "Aucune biographie."}
                                </p>
                                <p className="mt-3 text-xs text-slate-500">
                                    Téléphone : {coach.phone || "—"} · Landing Page : {coach.profile?.is_featured ? "Oui" : "Non"}
                                </p>
                            </section>

                            <div className="grid grid-cols-3 gap-2">
                                <Counter title="Cours" value={coach.coached_courses_count} icon={Dumbbell} />
                                <Counter title="Séances" value={coach.coached_sessions_count} icon={CalendarDays} />
                                <Counter title="Demandes privées" value={coach.received_requests_count} icon={UserRoundCheck} />
                            </div>

                            <section className="rounded-xl border border-slate-200 p-4">
                                <h3 className="mb-3 text-sm font-semibold">Disponibilités hebdomadaires</h3>

                                {coach.coach_availabilities?.length ? (
                                    coach.coach_availabilities.map((slot) => (
                                        <div key={slot.id} className="flex justify-between gap-3 border-b py-2 text-sm last:border-0">
                                            <span>{days[slot.day_of_week] ?? `Jour ${slot.day_of_week}`}</span>
                                            <span className="text-slate-500">{slot.start_time} – {slot.end_time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">Aucune disponibilité enregistrée.</p>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}
