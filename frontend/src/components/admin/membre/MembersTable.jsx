
import { Eye, Pencil, Mail, Trash2, Lock, LockOpen, LoaderCircle, UsersRound } from "lucide-react";

const labels = { active: "Actif", inactive: "Bloqué", pending: "En attente" };

const colors = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const dotColors = { active: "bg-emerald-500", inactive: "bg-red-500", pending: "bg-amber-500" };

const date = (value) => value ? new Date(value).toLocaleDateString("fr-MA", { timeZone: "Africa/Casablanca" }) : "—";

const getInitials = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function Action({ title, onClick, disabled, danger = false, children }) {
    return (
        <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
            className={`cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
                danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            }`}>
            {children}
        </button>
    );
}

export default function MembersTable({ members = [], loading, busyId, onView, onEdit, onResend, onToggleStatus, onDelete }) {
    const actionsDisabled = busyId !== null && busyId !== undefined;

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500">
                    <tr>
                        {["Membre", "Téléphone", "Statut", "Inscription", "Actions"].map((title) => (
                            <th key={title} className={`px-4 py-3 font-semibold ${title === "Actions" ? "text-right" : ""}`}>
                                {title}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <LoaderCircle size={22} className="animate-spin text-blue-600" />
                                    <span className="text-xs">Chargement des membres...</span>
                                </div>
                            </td>
                        </tr>
                    ) : members.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <UsersRound size={26} />
                                    <span className="text-sm font-medium">Aucun membre trouvé.</span>
                                    <span className="text-xs">Essayez une autre recherche.</span>
                                </div>
                            </td>
                        </tr>
                    ) : members.map((member) => {
                        const busy = busyId === member.id;

                        return (
                            <tr key={member.id} className="transition-colors hover:bg-slate-50/70">
                                {/* MEMBRE */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                                            {getInitials(member.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">{member.name}</p>
                                            <p className="max-w-[260px] truncate text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* TELEPHONE */}
                                <td className="px-4 py-3 text-slate-600">{member.phone || "—"}</td>

                                {/* STATUT */}
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        colors[member.status] || "border-slate-200 bg-slate-100 text-slate-600"
                                    }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[member.status] || "bg-slate-400"}`} />
                                        {labels[member.status] || member.status}
                                    </span>
                                </td>

                                {/* INSCRIPTION */}
                                <td className="px-4 py-3 text-slate-500">{date(member.created_at)}</td>

                                {/* ACTIONS */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        {busy ? (
                                            <LoaderCircle size={18} className="animate-spin text-blue-600" />
                                        ) : (
                                            <>
                                                <Action title="Voir" onClick={() => onView(member)} disabled={actionsDisabled}>
                                                    <Eye size={17} />
                                                </Action>

                                                <Action title="Modifier" onClick={() => onEdit(member)} disabled={actionsDisabled}>
                                                    <Pencil size={17} />
                                                </Action>

                                                {member.status === "pending" && (
                                                    <Action title="Renvoyer invitation" onClick={() => onResend(member)} disabled={actionsDisabled}>
                                                        <Mail size={17} />
                                                    </Action>
                                                )}

                                                {member.status === "active" && (
                                                    <Action title="Bloquer" onClick={() => onToggleStatus(member)} disabled={actionsDisabled}>
                                                        <Lock size={17} />
                                                    </Action>
                                                )}

                                                {member.status === "inactive" && (
                                                    <Action title="Débloquer" onClick={() => onToggleStatus(member)} disabled={actionsDisabled}>
                                                        <LockOpen size={17} />
                                                    </Action>
                                                )}

                                                <Action title="Archiver" onClick={() => onDelete(member)} disabled={actionsDisabled} danger>
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
