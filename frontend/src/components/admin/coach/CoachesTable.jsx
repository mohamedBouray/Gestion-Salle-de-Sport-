import { Eye, Pencil, Mail, Trash2, Users, LoaderCircle, Star, Lock, LockOpen} from "lucide-react";
const labels = { active: "Actif", pending: "En attente", inactive: "Bloqué",};

const colors = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
    inactive: "bg-red-50 text-red-700 ring-red-600/15",
};

const dots = {
    active: "bg-emerald-500",
    pending: "bg-amber-500",
    inactive: "bg-red-500",
};

const date = (value) =>
    value ? new Date(value).toLocaleDateString("fr-MA") : "—";

const thClass =
    "px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";

function Action({ title, onClick, disabled, danger, children }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                danger ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-blue-50 hover:text-blue-600" }`} >
            {children}
        </button>
    );
}

function Avatar({ coach }) {
    return coach.profile?.photo_url ? (
        <img src={coach.profile.photo_url} alt={coach.name} className="h-11 w-11 shrink-0 rounded-full object-cover"/>
    ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
            {coach.name?.[0]?.toUpperCase() || "C"}
        </div>
    );
}

export default function CoachesTable({coaches = [],loading = false,busyId = null,onView, onEdit, onDelete, onResend, onToggleStatus,}) {
    if (loading) {
        return (
            <div className="py-12 text-center">
                <LoaderCircle size={22} className="mx-auto animate-spin text-blue-600" />
            </div>
        );
    }

    if (!coaches.length) {
        return (
            <div className="py-12 text-center text-sm text-slate-400">
                <Users size={28} className="mx-auto mb-2" />
                Aucun coach trouvé.
            </div>
        );
    }

    const actions = (coach) => {
        const disabled = busyId !== null;

        if (busyId === coach.id) {
            return (
                <LoaderCircle
                    size={16}
                    className="animate-spin text-blue-600"
                />
            );
        }

        return (
            <div className="flex items-center justify-end gap-0.5">
                <Action
                    title="Voir"
                    onClick={() => onView(coach)}
                    disabled={disabled} >
                    <Eye size={18} />
                </Action>

                <Action
                    title="Modifier"
                    onClick={() => onEdit(coach)}
                    disabled={disabled} >
                    <Pencil size={18} />
                </Action>

                {coach.status === "pending" && (
                    <Action
                        title="Renvoyer invitation"
                        onClick={() => onResend(coach)}
                        disabled={disabled} >
                        <Mail size={18} />
                    </Action>
                )}

                {coach.status === "active" && (
                    <Action
                        title="Bloquer"
                        onClick={() => onToggleStatus(coach)}
                        disabled={disabled}
                        danger >
                        <Lock size={18} />
                    </Action>
                )}

                {coach.status === "inactive" && (
                    <Action
                        title="Débloquer"
                        onClick={() => onToggleStatus(coach)}
                        disabled={disabled} >
                        <LockOpen size={18} />
                    </Action>
                )}

                <Action
                    title="Archiver"
                    onClick={() => onDelete(coach)}
                    disabled={disabled}
                    danger>
                    <Trash2 size={18} />
                </Action>
            </div>
        );
    };

    const status = (coach) => (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                colors[coach.status] || "bg-slate-100 text-slate-600 ring-slate-500/15"
            }`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${dots[coach.status] || "bg-slate-400"}`} />
            {labels[coach.status] || coach.status}
        </span>
    );

    return (
        <>
            {/* Desktop */}
            <div className="mt-3 hidden overflow-x-auto border-t border-slate-200 md:block">
                <table className="w-full min-w-[820px] text-left">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                            <th className={`${thClass} pl-6`}>Coach</th>
                            <th className={thClass}>Spécialité</th>
                            <th className={thClass}>Statut</th>
                            <th className={thClass}>Inscription</th>
                            <th className={`${thClass} pr-6 text-right`}>Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {coaches.map((coach) => (
                            <tr
                                key={coach.id}
                                className="transition-colors hover:bg-slate-50/70"
                            >
                                <td className="py-4 pl-6 pr-4">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar coach={coach} />

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                {coach.name}
                                            </p>
                                            <p className="truncate text-[13px] text-slate-400">
                                                {coach.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-sm text-slate-600">
                                    {coach.profile?.specialty || "—"}

                                    {coach.profile?.is_featured && (
                                        <Star
                                            size={13}
                                            title="Affiché sur la Landing Page"
                                            className="ml-1.5 inline fill-amber-400 text-amber-400"
                                        />
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    {status(coach)}
                                </td>

                                <td className="px-4 py-4 text-[13px] tabular-nums text-slate-500">
                                    {date(coach.created_at)}
                                </td>

                                <td className="py-4 pl-4 pr-6">
                                    {actions(coach)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile */}
            <div className="mt-3 divide-y divide-slate-100 border-t border-slate-200 md:hidden">
                {coaches.map((coach) => (
                    <div key={coach.id} className="space-y-3 p-5">
                        <div className="flex items-center gap-3">
                            <Avatar coach={coach} />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold">
                                    {coach.name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {coach.email}
                                </p>
                            </div>

                            {status(coach)}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-500">
                                {coach.profile?.specialty || "Sans spécialité"}
                            </span>

                            {actions(coach)}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}