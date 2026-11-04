import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/memberApi";

const empty = { name: "", email: "", phone: "", specialty: "", experience_years: "0", bio: "", is_featured: false, status: "pending" };
const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CoachForm({ coach, onClose, onSave }) {
    const editing = Boolean(coach);
    const [form, setForm] = useState({ ...empty });
    const [photo, setPhoto] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(coach ? {
            name: coach.name ?? "", email: coach.email ?? "", phone: coach.phone ?? "",
            specialty: coach.profile?.specialty ?? "", experience_years: String(coach.profile?.experience_years ?? 0),
            bio: coach.profile?.bio ?? "", is_featured: !!coach.profile?.is_featured,
            status: coach.status || "pending",
        } : { ...empty });
        setPhoto(null);
        setRemovePhoto(false);
        setErrors({});
        setError("");
    }, [coach]);

    useEffect(() => {
        const onEscape = (event) => event.key === "Escape" && !busy && onClose();
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [busy, onClose]);

    function change(event) {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const payload = new FormData();
        ["name", "phone", "specialty", "bio", "experience_years"].forEach((field) => payload.set(field, String(form[field] ?? "")));
        payload.set("is_featured", form.is_featured ? "1" : "0");
        if (!editing) payload.set("email", form.email.trim());
        if (editing && form.status !== "pending") payload.set("status", form.status);
        if (photo) payload.set("photo", photo);
        if (editing && removePhoto) payload.set("remove_photo", "1");

        setBusy(true);
        setError("");
        setErrors({});
        try {
            await onSave(payload, coach?.id);
        } catch (err) {
            setErrors(err.response?.data?.errors ?? {});
            setError(apiError(err));
        } finally {
            setBusy(false);
        }
    }

    function field(label, name, type = "text", required = false) {
        return (
            <label key={name} className="block text-xs font-semibold text-slate-700">{label}
                <input name={name} type={type} required={required} value={form[name]} onChange={change} disabled={editing && name === "email"}
                    className={`${fieldClass} disabled:bg-slate-100`} />
                {errors[name]?.[0] && <small className="mt-1 block text-red-600">{errors[name][0]}</small>}
            </label>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier le coach" : "Nouveau coach"} className="flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-lg font-bold">{editing ? "Modifier le coach" : "Nouveau coach"}</h2><p className="text-xs text-slate-500">{editing ? "Informations professionnelles" : "Une invitation sera envoyée par e-mail."}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Fermer"><X size={20} /></button></div>
                <form onSubmit={submit} className="space-y-4 overflow-y-auto p-5">
                    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">{field("Nom complet *", "name", "text", true)}{field("Email *", "email", "email", true)}{field("Téléphone", "phone", "tel")}{field("Spécialité *", "specialty", "text", true)}{field("Années d'expérience *", "experience_years", "number", true)}</div>
                    <label className="block text-xs font-semibold text-slate-700">Biographie
                        <textarea name="bio" value={form.bio} onChange={change} rows={3} className={fieldClass} placeholder="Présentation du coach..." />
                        {errors.bio?.[0] && <small className="text-red-600">{errors.bio[0]}</small>}
                    </label>
                    <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs font-medium text-slate-600 hover:border-blue-300">
                        <span className="flex items-center gap-2"><ImagePlus size={18} />Photo (JPG, PNG, WEBP, max 2 Mo)</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-xs" onChange={(event) => { setPhoto(event.target.files?.[0] || null); setRemovePhoto(false); }} />
                        {coach?.profile?.photo_url && !photo && !removePhoto && <img src={coach.profile.photo_url} alt="Photo actuelle" className="mt-2 h-16 w-16 rounded-xl object-cover" />}
                    </label>
                    {editing && coach.profile?.photo_url && <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={removePhoto} onChange={(event) => { setRemovePhoto(event.target.checked); if (event.target.checked) setPhoto(null); }} />Supprimer la photo actuelle</label>}
                    <label className="flex items-center gap-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900"><input type="checkbox" name="is_featured" checked={form.is_featured} onChange={change} className="h-4 w-4 accent-blue-600" />Mettre en avant sur la Landing Page</label>
                    {editing && form.status !== "pending" && <label className="block text-xs font-semibold">Statut
                        <select name="status" value={form.status} onChange={change} className={fieldClass}><option value="active">Actif</option><option value="inactive">Inactif</option></select>
                    </label>}
                    {editing && <p className="text-xs text-slate-500">L'adresse e-mail ne se modifie pas ici pour protéger l'accès au compte.</p>}
                    {editing && form.status === "pending" && <p className="text-xs text-amber-700">En attente : le coach doit activer son compte depuis le lien reçu par e-mail.</p>}
                    <div className="flex justify-end gap-2 border-t pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Annuler</button><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin" />}{editing ? "Enregistrer" : "Créer et inviter"}</button></div>
                </form>
            </div>
        </div>
    );
}
