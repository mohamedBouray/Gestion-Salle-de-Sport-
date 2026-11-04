import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/memberApi";

const empty = { name: "", email: "", phone: "", status: "pending" };
const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function MemberForm({ member, onClose, onSave }) {
    const editing = Boolean(member);
    const [form, setForm] = useState({ ...empty });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setForm(member ? {
            name: member.name || "", email: member.email || "", phone: member.phone || "",
            status: member.status || "pending",
        } : { ...empty });
        setErrors({});
        setMessage("");
    }, [member]);

    useEffect(() => {
        const escape = (event) => event.key === "Escape" && !saving && onClose();
        window.addEventListener("keydown", escape);
        return () => window.removeEventListener("keydown", escape);
    }, [onClose, saving]);

    function change(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setErrors((current) => ({ ...current, [event.target.name]: undefined }));
    }

    async function submit(event) {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        setErrors({});
        setMessage("");
        try {
            const payload = { name: form.name.trim(), phone: form.phone.trim() || null };
            if (!editing) payload.email = form.email.trim();
            if (editing && form.status !== "pending") payload.status = form.status;
            await onSave(payload, member?.id);
        } catch (error) {
            setErrors(error.response?.data?.errors || {});
            setMessage(apiError(error));
        } finally {
            setSaving(false);
        }
    }

    const input = (label, name, type = "text", required = false) => (
        <label className="block text-xs font-semibold text-slate-700" key={name}>
            {label}
            <input className={fieldClass} name={name} type={type} value={form[name]} onChange={change} required={required} disabled={editing && name === "email"} />
            {errors[name]?.[0] && <span className="mt-1 block text-xs text-red-600">{errors[name][0]}</span>}
        </label>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un membre" : "Ajouter un membre"} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-900">{editing ? "Modifier le membre" : "Ajouter un membre"}</h2><p className="mt-1 text-xs text-slate-500">{editing ? "Mettez à jour les informations." : "Un e-mail d'activation sera envoyé au membre."}</p></div><button type="button" onClick={onClose} disabled={saving} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
                <form onSubmit={submit} className="max-h-[calc(100dvh-140px)] space-y-4 overflow-y-auto px-6 py-5">
                    {message && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
                    {input("Nom complet *", "name", "text", true)}
                    {input("Adresse e-mail *", "email", "email", true)}
                    {input("Téléphone", "phone", "tel")}
                    {editing && form.status !== "pending" && <label className="block text-xs font-semibold text-slate-700">Statut
                        <select className={fieldClass} name="status" value={form.status} onChange={change}><option value="active">Actif</option><option value="inactive">Inactif</option></select>
                    </label>}
                    {form.status === "pending" && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Le membre choisira son mot de passe via le lien envoyé à son adresse e-mail. Aucun mot de passe n'est envoyé par l'admin.</p>}
                    {editing && <p className="text-xs text-slate-500">L'adresse e-mail n'est pas modifiable depuis ce formulaire pour protéger la connexion.</p>}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}{editing ? "Enregistrer" : "Créer et inviter"}</button></div>
                </form>
            </div>
        </div>
    );
}
