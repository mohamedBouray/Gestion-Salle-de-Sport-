import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/api";

const empty = {
    name: "", email: "", phone: "", specialty: "",
    experience_years: "0", bio: "", is_featured: false,
    status: "pending",
};

const fieldClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none transition " +
    "placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-500";

const labelClass = "block text-xs font-semibold text-slate-600";

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
        setForm((f) => ({
            ...f,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function choosePhoto(file) {
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setError("Image JPG, PNG ou WEBP, maximum 2 Mo.");
            return;
        }
        setPhoto(file);
        setRemovePhoto(false);
        setError("");
    }

    async function submit(e) {
        e.preventDefault();
        if (saving) 
            return;

        const payload = new FormData();
        ["name", "phone", "specialty", "bio", "experience_years"].forEach(
            (key) => payload.set(key, String(form[key] ?? ""))
        );

        payload.set("is_featured", form.is_featured ? "1" : "0");
        if (editing && form.status !== "pending") payload.set("status", form.status);
        if (!editing) 
            payload.set("email", form.email.trim());
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
        <label className={labelClass}>
            {label}
            <input name={name} type={type} value={form[name]}
                onChange={change} required={required}
                disabled={editing && name === "email"}
                min={type === "number" ? 0 : undefined}
                max={type === "number" ? 80 : undefined}
                maxLength={{ name: 160, email: 190, phone: 32, specialty: 160 }[name]}
                className={fieldClass}
            />
        </label>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()} >
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un coach" : "Ajouter un coach"}
                className="flex max-h-[94dvh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl" >
                <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
                    <div>
                        <h2 className="text-base font-bold">
                            {editing ? "Modifier le coach" : "Nouveau coach"}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {editing ? "Informations professionnelles." : "Une invitation d'activation sera envoyée."}
                        </p>
                    </div>

                    <button type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Fermer"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 cursor-pointer" >
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={submit} className="space-y-4 overflow-y-auto p-5">
                    {error && (
                        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">
                            {error}
                        </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        {input("Nom complet *", "name", "text", true)}
                        {input("Adresse e-mail *", "email", "email", true)}
                        {input("Téléphone", "phone", "tel")}
                        {input("Spécialité *", "specialty", "text", true)}
                        {input("Années d'expérience", "experience_years", "number", true)}
                    </div>

                    <label className={labelClass}>
                        Biographie
                        <textarea
                            name="bio" rows={3} value={form.bio}
                            onChange={change} placeholder="Présentation du coach..." maxLength={3000}
                            className={fieldClass}
                        />
                    </label>

                    {/* Photo */}
                    <div>
                        <label htmlFor="coach-photo" className={labelClass}>
                            Photo du coach
                        </label>

                        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3">
                            {editing && coach.profile?.photo_url && !photo && !removePhoto ? (
                                <img src={coach.profile.photo_url}
                                    alt="Photo actuelle"
                                    className="h-12 w-12 shrink-0 rounded-full object-cover"/>
                            ) : (
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                                    <ImagePlus size={18} />
                                </span>
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-500">
                                    JPG, PNG, WEBP (max. 2 Mo)
                                </p>
                                <input id="coach-photo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="mt-1.5 w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:border-blue-200 hover:file:text-blue-600"
                                    onChange={(e) => choosePhoto(e.target.files?.[0])}
                                />
                            </div>
                        </div>

                        {editing && coach.profile?.photo_url && (
                            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                <input type="checkbox"
                                    checked={removePhoto}
                                    onChange={(e) => { setRemovePhoto(e.target.checked); if (e.target.checked) setPhoto(null);}}
                                    className="accent-blue-600"
                                />
                                Supprimer la photo actuelle
                            </label>
                        )}
                    </div>

                    <label className="flex items-center gap-2.5 text-[13px] font-medium text-slate-700">
                        <input type="checkbox" name="is_featured"
                            checked={form.is_featured} onChange={change}
                            disabled={saving}
                            className="h-4 w-4 rounded accent-blue-600"/>
                        Afficher sur la Landing Page
                    </label>
                    <p className="text-xs text-slate-500">
                        Un seul coach peut être mis en avant. Choisir celui-ci retire automatiquement l'ancien.
                    </p>

                    {editing && form.status !== "pending" && (
                        <label className={labelClass}>
                            Statut
                            <select name="status" value={form.status}
                                onChange={change} className={fieldClass} >
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </label>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" disabled={saving} onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer " >
                            Annuler
                        </button>

                        <button type="submit" disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer " >
                            {saving && <LoaderCircle size={14} className="animate-spin" />}
                            {editing ? "Enregistrer" : "Créer et inviter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}