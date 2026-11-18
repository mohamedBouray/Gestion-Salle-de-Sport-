
import { useEffect, useState } from "react";
import {
    LoaderCircle,
    X,
    UserRound,
    Mail,
    Phone
} from "lucide-react";

import { apiError } from "../../../services/api";

const empty = {
    name: "",
    email: "",
    phone: "",
};

const field =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

export default function MemberForm({
    member,
    onClose,
    onSave,
}) {
    const editing = Boolean(member);

    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(
            member
                ? {
                      name: member.name || "",
                      email: member.email || "",
                      phone: member.phone || "",
                  }
                : { ...empty }
        );

        setError("");
    }, [member]);

    useEffect(() => {
        const close = (e) => {
            if (e.key === "Escape" && !saving) {
                onClose();
            }
        };

        window.addEventListener("keydown", close);

        return () =>
            window.removeEventListener("keydown", close);
    }, [onClose, saving]);

    function updateField(name, value) {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function submit(e) {
        e.preventDefault();

        if (saving) return;

        setSaving(true);
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                phone: form.phone.trim() || null,
            };

            if (!editing) {
                payload.email = form.email.trim();
            }

            await onSave(payload, member?.id);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSaving(false);
        }
    }

    const input = (
        label,
        name,
        Icon,
        type = "text",
        placeholder = ""
    ) => (
        <label className="block text-[13px] font-semibold text-slate-700">
            {label}

            <div className="relative">
                <Icon
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    name={name}
                    type={type}
                    value={form[name]}
                    onChange={(e) =>
                        updateField(name, e.target.value)
                    }
                    disabled={saving || (editing && name === "email")}
                    required={name !== "phone"}
                    placeholder={placeholder}
                    className={`${field} pl-10`}
                />
            </div>
        </label>
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={
                    editing
                        ? "Modifier un membre"
                        : "Ajouter un membre"
                }
                className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
                {/* HEADER */}
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-extrabold text-[#0f1b33]">
                            {editing
                                ? "Modifier un membre"
                                : "Ajouter un membre"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {editing
                                ? "Modifiez les informations du membre."
                                : "Créez un nouvel accès pour votre adhérent."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Fermer"
                        className=" cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* FORMULAIRE */}
                <form onSubmit={submit} className="space-y-4 px-5 py-5">

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <UserRound size={17} />
                        </span>

                        <h3 className="text-[13px] font-bold text-slate-800">
                            Informations personnelles
                        </h3>
                    </div>

                    {input(
                        "Nom complet",
                        "name",
                        UserRound,
                        "text",
                        "Ex : Mohamed Bouray"
                    )}

                    {input(
                        "Adresse e-mail",
                        "email",
                        Mail,
                        "email",
                        "exemple@email.com"
                    )}

                    {input(
                        "Téléphone",
                        "phone",
                        Phone,
                        "tel",
                        "Ex : 0600000000"
                    )}

                    {!editing && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                            <div className="flex gap-2">
                                <Mail
                                    size={16}
                                    className="mt-0.5 shrink-0 text-blue-600"
                                />

                                <div>
                                    <p className="text-xs font-bold text-blue-800">
                                        Invitation automatique
                                    </p>

                                    <p className="mt-1 text-xs leading-relaxed text-blue-700">
                                        Le membre recevra un lien par e-mail
                                        pour activer son compte et définir
                                        son mot de passe.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {editing && (
                        <p className="text-[11px] text-slate-400">
                            L'adresse e-mail ne peut pas être modifiée.
                        </p>
                    )}

                    {/* ACTIONS */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className=" cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Annuler
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className=" cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            )}

                            {editing
                                ? "Enregistrer"
                                : "Créer et inviter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
