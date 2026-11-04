import { Eye, MailCheck, Pencil, Trash2, UsersRound } from "lucide-react";

const statusStyles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};
const statusLabels = { active: "Actif", pending: "En attente", inactive: "Inactif" };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("fr-MA") : "—";

export default function MembersTable({ members, loading, onView, onEdit, onDelete, onResend, deletingId }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[770px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                            {['Membre', 'Téléphone', 'Statut', 'Inscription', 'Actions'].map((name) => (
                                <th key={name} className="px-5 py-4 font-semibold">{name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Chargement des membres...</td></tr>
                        ) : !members.length ? (
                            <tr><td colSpan={5} className="px-5 py-14 text-center text-slate-500">
                                <UsersRound className="mx-auto mb-3 text-slate-400" size={32} />Aucun membre trouvé.
                            </td></tr>
                        ) : members.map((member) => (
                            <tr key={member.id} className="transition-colors hover:bg-slate-50/70">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                                            {(member.name || 'M').trim().slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">{member.name}</p>
                                            <p className="text-xs text-slate-500">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">{member.phone || '—'}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[member.status] || statusStyles.inactive}`}>
                                        {statusLabels[member.status] || member.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600">{dateLabel(member.created_at)}</td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => onView(member)} title="Détails" aria-label={`Détails de ${member.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Eye size={17} /></button>
                                        <button type="button" onClick={() => onEdit(member)} title="Modifier" aria-label={`Modifier ${member.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil size={17} /></button>
                                        {member.status === "pending" && <button type="button" disabled={deletingId === member.id} onClick={() => onResend(member)} title="Renvoyer invitation" aria-label={`Renvoyer invitation à ${member.name}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-40"><MailCheck size={17} /></button>}
                                        <button type="button" onClick={() => onDelete(member)} title="Supprimer" aria-label={`Supprimer ${member.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
