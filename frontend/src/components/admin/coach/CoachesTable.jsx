import { Eye, MailCheck, Pencil, Trash2, UserRoundCheck } from "lucide-react";

const labels = { active: "Actif", pending: "En attente", inactive: "Inactif" };
const badge = {
    active: "bg-blue-50 text-blue-700",
    pending: "bg-amber-50 text-amber-800",
    inactive: "bg-slate-100 text-slate-700",
};
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("fr-MA") : "—";

export default function CoachesTable({ coaches, loading, busyId, onView, onEdit, onDelete, onResend }) {
    if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Chargement des coachs...</div>;
    if (!coaches.length) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500"><UserRoundCheck className="mx-auto mb-2 text-slate-400" />Aucun coach trouvé.</div>;

    const actions = (coach) => (
        <div className="flex items-center gap-1">
            <button type="button" onClick={() => onView(coach)} title="Voir" aria-label={`Voir ${coach.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye size={17} /></button>
            <button type="button" onClick={() => onEdit(coach)} title="Modifier" aria-label={`Modifier ${coach.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil size={17} /></button>
            {coach.status === "pending" && <button type="button" disabled={busyId === coach.id} onClick={() => onResend(coach)} title="Renvoyer invitation" aria-label={`Renvoyer invitation à ${coach.name}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-40"><MailCheck size={17} /></button>}
            <button type="button" onClick={() => onDelete(coach)} title="Archiver" aria-label={`Archiver ${coach.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
        </div>
    );

    const picture = (coach) => coach.profile?.photo_url ?
        <img src={coach.profile.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" /> :
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">{coach.name?.[0] || "C"}</span>;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Coach</th><th className="px-5 py-4">Spécialité</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Ajouté le</th><th className="px-5 py-4">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {coaches.map((coach) => <tr key={coach.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3"><div className="flex items-center gap-3">{picture(coach)}<div className="min-w-0"><p className="font-semibold text-slate-900">{coach.name}</p><p className="text-xs text-slate-500">{coach.email}</p></div></div></td>
                            <td className="px-5 py-3 text-slate-600">{coach.profile?.specialty || "—"}{coach.profile?.is_featured && <span className="ml-2 text-xs text-blue-600">★ Landing</span>}</td>
                            <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[coach.status] || badge.inactive}`}>{labels[coach.status] || coach.status}</span></td>
                            <td className="px-5 py-3 text-slate-600">{dateLabel(coach.created_at)}</td>
                            <td className="px-5 py-3">{actions(coach)}</td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
                {coaches.map((coach) => <div key={coach.id} className="space-y-3 p-4">
                    <div className="flex items-center gap-3">{picture(coach)}<div className="min-w-0 flex-1"><p className="truncate font-semibold">{coach.name}</p><p className="truncate text-xs text-slate-500">{coach.email}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge[coach.status] || badge.inactive}`}>{labels[coach.status] || coach.status}</span></div>
                    <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{coach.profile?.specialty || "Sans spécialité"}</span>{actions(coach)}</div>
                </div>)}
            </div>
        </section>
    );
}
