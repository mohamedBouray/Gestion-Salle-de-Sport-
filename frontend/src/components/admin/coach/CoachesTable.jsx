
import {
    Eye, Pencil, Mail, Trash2, Users, LoaderCircle,
    Star, Lock, LockOpen
} from "lucide-react";

const labels = {
    active: "Actif",
    pending: "En attente",
    inactive: "Bloqué",
};

const colors = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    inactive: "bg-red-50 text-red-700",
};

const date = (value) =>
    value ? new Date(value).toLocaleDateString("fr-MA") : "—";

function Action({ title, onClick, disabled, danger, children }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                danger
                    ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
            {children}
        </button>
    );
}

function Avatar({ coach }) {
    return coach.profile?.photo_url ? (
        <img
            src={coach.profile.photo_url}
            alt={coach.name}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
        />
    ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
            {coach.name?.[0]?.toUpperCase() || "C"}
        </div>
    );
}

export default function CoachesTable({
    coaches = [],
    loading = false,
    busyId = null,
    onView,
    onEdit,
    onDelete,
    onResend,
    onToggleStatus,
}) {
    if (loading) {
        return (
            <div className="py-14 text-center">
                <LoaderCircle
                    size={24}
                    className="mx-auto animate-spin text-blue-600"
                />
            </div>
        );
    }

    if (!coaches.length) {
        return (
            <div className="py-14 text-center text-slate-400">
                <Users size={30} className="mx-auto mb-2" />
                Aucun coach trouvé.
            </div>
        );
    }

    const actions = (coach) => {
        const disabled = busyId !== null;

        if (busyId === coach.id) {
            return (
                <LoaderCircle
                    size={18}
                    className="animate-spin text-blue-600"
                />
            );
        }

        return (
            <div className="flex items-center gap-1">
                <Action
                    title="Voir"
                    onClick={() => onView(coach)}
                    disabled={disabled}
                >
                    <Eye size={17} />
                </Action>

                <Action
                    title="Modifier"
                    onClick={() => onEdit(coach)}
                    disabled={disabled}
                >
                    <Pencil size={17} />
                </Action>

                {coach.status === "pending" && (
                    <Action
                        title="Renvoyer invitation"
                        onClick={() => onResend(coach)}
                        disabled={disabled}
                    >
                        <Mail size={17} />
                    </Action>
                )}

                {coach.status === "active" && (
                    <Action
                        title="Bloquer"
                        onClick={() => onToggleStatus(coach)}
                        disabled={disabled}
                        danger
                    >
                        <Lock size={17} />
                    </Action>
                )}

                {coach.status === "inactive" && (
                    <Action
                        title="Débloquer"
                        onClick={() => onToggleStatus(coach)}
                        disabled={disabled}
                    >
                        <LockOpen size={17} />
                    </Action>
                )}

                <Action
                    title="Archiver"
                    onClick={() => onDelete(coach)}
                    disabled={disabled}
                    danger
                >
                    <Trash2 size={17} />
                </Action>
            </div>
        );
    };

    const status = (coach) => (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                colors[coach.status] || "bg-slate-100 text-slate-600"
            }`}
        >
            {labels[coach.status] || coach.status}
        </span>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                            {[
                                "Coach",
                                "Spécialité",
                                "Statut",
                                "Inscription",
                                "Actions",
                            ].map((item) => (
                                <th
                                    key={item}
                                    className="px-5 py-3 font-semibold"
                                >
                                    {item}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {coaches.map((coach) => (
                            <tr
                                key={coach.id}
                                className="hover:bg-slate-50/70"
                            >
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar coach={coach} />

                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800">
                                                {coach.name}
                                            </p>
                                            <p className="break-all text-xs text-slate-400">
                                                {coach.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-3 text-slate-600">
                                    {coach.profile?.specialty || "—"}

                                    {coach.profile?.is_featured && (
                                        <Star
                                            size={14}
                                            className="ml-2 inline fill-amber-400 text-amber-400"
                                        />
                                    )}
                                </td>

                                <td className="px-5 py-3">
                                    {status(coach)}
                                </td>

                                <td className="px-5 py-3 text-slate-500">
                                    {date(coach.created_at)}
                                </td>

                                <td className="px-5 py-3">
                                    {actions(coach)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
                {coaches.map((coach) => (
                    <div key={coach.id} className="space-y-3 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar coach={coach} />

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">
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
