import {Eye, Pencil, Mail, Trash2, Lock, LockOpen, LoaderCircle, UsersRound} from "lucide-react";

const labels = {active: "Actif", inactive: "Bloqué", pending: "En attente",};
const colors = { active: "bg-emerald-50 text-emerald-700",inactive: "bg-red-50 text-red-700", pending: "bg-amber-50 text-amber-700",};

const date = (value) => value ? new Date(value).toLocaleDateString("fr-MA") : "—";

function Action({ title, onClick, disabled, danger, children }) {
    return (
        <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
            className={`rounded-lg p-2 transition disabled:opacity-40 ${
                danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`}>
            {children}
        </button>
    );
}

export default function MembersTable({
    members = [], loading, busyId,
    onView, onEdit, onResend, onToggleStatus, onDelete
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                        {["Membre", "Téléphone", "Statut", "Inscription", "Actions"].map((item) => (
                            <th key={item} className="px-5 py-3 font-semibold">
                                {item}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                <LoaderCircle size={22} className="mx-auto animate-spin" />
                            </td>
                        </tr>
                    ) : members.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-14 text-center text-slate-400">
                                <UsersRound size={30} className="mx-auto mb-2" />
                                Aucun membre trouvé.
                            </td>
                        </tr>
                    ) : members.map((member) => {
                        const busy = busyId === member.id;
                        const disabled = busyId !== null && busyId !== undefined;

                        return (
                            <tr key={member.id} className="hover:bg-slate-50/70">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-700">
                                            {member.name?.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{member.name}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-3 text-slate-600">
                                    {member.phone || "—"}
                                </td>

                                <td className="px-5 py-3">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[member.status] || "bg-slate-100"}`}>
                                        {labels[member.status] || member.status}
                                    </span>
                                </td>

                                <td className="px-5 py-3 text-slate-500">
                                    {date(member.created_at)}
                                </td>

                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1">
                                        {busy ? (
                                            <LoaderCircle size={18} className="animate-spin text-blue-600" />
                                        ) : (
                                            <>
                                                <Action title="Voir" onClick={() => onView(member)} disabled={disabled}>
                                                    <Eye size={17} />
                                                </Action>

                                                <Action title="Modifier" onClick={() => onEdit(member)} disabled={disabled}>
                                                    <Pencil size={17} />
                                                </Action>

                                                {member.status === "pending" && (
                                                    <Action title="Renvoyer invitation" onClick={() => onResend(member)} disabled={disabled}>
                                                        <Mail size={17} />
                                                    </Action>
                                                )}

                                                {member.status === "active" && (
                                                    <Action title="Bloquer" onClick={() => onToggleStatus(member)} disabled={disabled} danger>
                                                        <Lock size={17} />
                                                    </Action>
                                                )}

                                                {member.status === "inactive" && (
                                                    <Action title="Débloquer" onClick={() => onToggleStatus(member)} disabled={disabled}>
                                                        <LockOpen size={17} />
                                                    </Action>
                                                )}

                                                <Action title="Archiver" onClick={() => onDelete(member)} disabled={disabled} danger>
                                                    <Trash2 size={17} />
                                                </Action>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
