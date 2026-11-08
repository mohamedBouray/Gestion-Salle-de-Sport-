
import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/api";

const empty = {
    name: "", email: "", phone: "", specialty: "",
    experience_years: "0", bio: "", is_featured: false,
    status: "pending",
};

const fieldClass = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function CoachForm({ coach, onClose, onSave }) {
    const editing = Boolean(coach);
    const [form, setForm] = useState(empty);
    const [photo, setPhoto] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(coach ? {
            name: coach.name ?? "",
            email: coach.email ?? "",
            phone: coach.phone ?? "",
            specialty: coach.profile?.specialty ?? "",
            experience_years: String(coach.profile?.experience_years ?? 0),
            bio: coach.profile?.bio ?? "",
            is_featured: !!coach.profile?.is_featured,
            status: coach.status ?? "pending",
        } : { ...empty });

        setPhoto(null);
        setRemovePhoto(false);
        setError("");
    }, [coach]);

    useEffect(() => {
        const close = (e) => e.key === "Escape" && !saving && onClose();
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [onClose, saving]);

    function change(e) {
        const { name, value, type, checked } = e.target;
        setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }

    async function submit(e) {
        e.preventDefault();
        if (saving) return;

        const payload = new FormData();
        ["name", "phone", "specialty", "bio", "experience_years"].forEach(
            (key) => payload.set(key, String(form[key] ?? ""))
        );

        payload.set("is_featured", form.is_featured ? "1" : "0");
        if (!editing) payload.set("email", form.email.trim());
        if (photo) payload.set("photo", photo);
        if (editing && removePhoto) payload.set("remove_photo", "1");

        setSaving(true);
        setError("");

        try {
            await onSave(payload, coach?.id);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSaving(false);
        }
    }

    const input = (label, name, type = "text", required = false) => (
        <label className="block text-sm font-medium text-slate-700">
            {label}
            <input
                name={name} type={type} value={form[name]}
                onChange={change} required={required}
                disabled={editing && name === "email"}
                min={type === "number" ? 0 : undefined}
                className={fieldClass}
            />
        </label>
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
        >
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un coach" : "Ajouter un coach"}
                className="flex max-h-[94dvh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl">

                <header className="flex items-start justify-between border-b border-slate-100 p-5">
                    <div>
                        <h2 className="text-lg font-bold">{editing ? "Modifier le coach" : "Nouveau coach"}</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {editing ? "Informations professionnelles." : "Une invitation d'activation sera envoyée."}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} aria-label="Fermer">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={submit} className="space-y-4 overflow-y-auto p-5">
                    {error && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        {input("Nom complet *", "name", "text", true)}
                        {input("Adresse e-mail *", "email", "email", true)}
                        {input("Téléphone", "phone", "tel")}
                        {input("Spécialité *", "specialty", "text", true)}
                        {input("Années d'expérience", "experience_years", "number", true)}
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                        Biographie
                        <textarea
                            name="bio" rows={3} value={form.bio}
                            onChange={change} placeholder="Présentation du coach..."
                            className={fieldClass}
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Photo du coach
                        <div className="mt-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                                <ImagePlus size={17} /> JPG, PNG, WEBP (max. 2 Mo)
                            </div>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="w-full text-xs"
                                onChange={(e) => {
                                    setPhoto(e.target.files?.[0] || null);
                                    setRemovePhoto(false);
                                }}
                            />
                            {editing && coach.profile?.photo_url && !photo && !removePhoto && (
                                <img src={coach.profile.photo_url} alt="Photo actuelle"
                                    className="mt-3 h-16 w-16 rounded-lg object-cover" />
                            )}
                        </div>
                    </label>

                    {editing && coach.profile?.photo_url && (
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input type="checkbox" checked={removePhoto}
                                onChange={(e) => {
                                    setRemovePhoto(e.target.checked);
                                    if (e.target.checked) setPhoto(null);
                                }}
                            />
                            Supprimer la photo actuelle
                        </label>
                    )}

                    <label className="flex items-center gap-3 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-900">
                        <input type="checkbox" name="is_featured"
                            checked={form.is_featured} onChange={change}
                            className="h-4 w-4 accent-blue-600" />
                        Afficher sur la Landing Page
                    </label>

                    {editing && form.status !== "pending" && (
                        <label className="block text-sm font-medium text-slate-700">
                            Statut
                            <select name="status" value={form.status} onChange={change} className={fieldClass}>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </label>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" disabled={saving} onClick={onClose}
                            className="rounded-xl border px-4 py-2.5 text-sm hover:bg-slate-50">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                            {saving && <LoaderCircle size={16} className="animate-spin" />}
                            {editing ? "Enregistrer" : "Créer et inviter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
