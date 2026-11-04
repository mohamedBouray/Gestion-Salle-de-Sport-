import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell, UserRoundCheck, X } from "lucide-react";
import { coachApi } from "../../../services/coachApi";
import { apiError } from "../../../services/memberApi";

export default function CoachDetails({ coachId, onClose }) {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        coachApi.show(coachId).then(({ coach }) => { if (alive) setCoach(coach); })
            .catch((err) => { if (alive) setError(apiError(err)); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [coachId]);

    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const counters = [
        { title: "Cours assignés", value: coach?.coached_courses_count, icon: Dumbbell },
        { title: "Séances", value: coach?.coached_sessions_count, icon: CalendarDays },
        { title: "Demandes privées", value: coach?.received_requests_count, icon: UserRoundCheck },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <aside role="dialog" aria-modal="true" aria-label="Détails du coach" className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white text-slate-900 shadow-2xl">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5"><h2 className="text-lg font-bold">Détails du coach</h2><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
                <div className="space-y-5 p-6">
                    {loading && <p className="text-sm text-slate-500">Chargement...</p>}
                    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    {coach && <>
                        <section className="rounded-2xl bg-slate-50 p-5">
                            <div className="flex items-center gap-4">{coach.profile?.photo_url ? <img src={coach.profile.photo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">{coach.name?.[0]}</div>}
                                <div><h3 className="text-lg font-bold">{coach.name}</h3><p className="break-all text-sm text-slate-500">{coach.email}</p><span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{coach.status}</span></div>
                            </div>
                            <p className="mt-4 text-sm text-slate-700">{coach.profile?.specialty || "Spécialité non définie"} · {coach.profile?.experience_years ?? 0} ans d'expérience</p>
                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{coach.profile?.bio || "Aucune biographie."}</p>
                            <p className="mt-3 text-xs text-slate-500">Téléphone : {coach.phone || "—"} · Landing Page : {coach.profile?.is_featured ? "En vedette" : "Non"}</p>
                        </section>
                        <div className="grid grid-cols-3 gap-2">{counters.map(({ title, value, icon: Icon }) => <div key={title} className="rounded-xl border p-3 text-center"><Icon className="mx-auto mb-2 text-blue-600" size={20} /><strong className="block text-xl">{value ?? 0}</strong><small className="text-slate-500">{title}</small></div>)}</div>
                        <section className="rounded-xl border p-4"><h3 className="mb-3 font-semibold">Disponibilités hebdomadaires</h3>{coach.coach_availabilities?.length ? coach.coach_availabilities.map((slot) => <p key={slot.id} className="border-b py-2 text-sm text-slate-600">Jour {slot.day_of_week} · {slot.start_time} - {slot.end_time}</p>) : <p className="text-sm text-slate-500">Aucune disponibilité enregistrée.</p>}</section>
                    </>}
                </div>
            </aside>
        </div>
    );
}
