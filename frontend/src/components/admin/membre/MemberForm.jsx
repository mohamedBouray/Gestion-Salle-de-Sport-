import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/api";

const empty = { name: "", email: "", phone: "" };
const field = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function MemberForm({ member, onClose, onSave }) {
    const editing = Boolean(member);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(member ? {
            name: member.name || "",
            email: member.email || "",
            phone: member.phone || "",
        } : empty);
        setError("");
    }, [member]);

    useEffect(() => {
        const close = (e) => e.key === "Escape" && !saving && onClose();
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [onClose, saving]);

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
            if (!editing) payload.email = form.email.trim();

            await onSave(payload, member?.id);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSaving(false);
        }
    }

    const input = (label, name, type = "text") => (
        <label className="block text-sm font-medium text-slate-700">
            {label}
            <input
                name={name} type={type} value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                disabled={editing && name === "email"} required={name !== "phone"}
                className={field}
            />
        </label>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un membre" : "Ajouter un membre"}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold">{editing ? "Modifier le membre" : "Nouveau membre"}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {editing ? "Modifier les informations du membre." : "Une invitation d'activation sera envoyée."}
                        </p>
                    </div>
                    <button onClick={onClose} disabled={saving} aria-label="Fermer" className="rounded-lg p-2 hover:bg-slate-100"><X size={19} /></button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                    {input("Nom complet", "name")}
                    {input("Adresse e-mail", "email", "email")}
                    {input("Téléphone", "phone", "tel")}

                    {!editing && (
                        <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                            Le membre recevra un lien pour activer son compte et définir son mot de passe.
                        </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose} disabled={saving}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                            {saving && <LoaderCircle size={16} className="animate-spin" />}
                            {editing ? "Enregistrer" : "Créer et inviter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}