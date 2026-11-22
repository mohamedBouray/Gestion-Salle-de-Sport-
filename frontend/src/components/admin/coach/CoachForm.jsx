
import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/api";

const empty = {
    name: "", email: "", phone: "", specialty: "",
    experience_years: "0", bio: "", is_featured: false, status: "pending",
};
const fieldClass = "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-500";
const labelClass = "block text-xs font-semibold text-slate-700";
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u;
const phonePattern = /^(?:0[67]\d{8}|\+?212[67]\d{8})$/;
const normalizeSpaces = (v) => v.trim().replace(/\s+/g, " ");
const normalizePhone = (v) => v.replace(/[\s-]/g, "");
const phoneHint = "06/07 + 8 chiffres, ou +212/212 + 6/7 + 8 chiffres.";

function validate(name, raw, editing) {
    const value = String(raw ?? "").trim();
    if (name === "name") {
        if (!value) return "Le nom complet est obligatoire.";
        if ([...value].length < 2 || [...value].length > 160) return "Le nom doit contenir entre 2 et 160 caractères.";
        if (!namePattern.test(value)) return "Le nom doit contenir des lettres, sans chiffres ni symboles spéciaux.";
    }
    if (name === "email" && !editing) {
        if (!value) return "L'adresse e-mail est obligatoire.";
        if (value.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Saisissez une adresse e-mail valide (190 caractères maximum).";
    }
    if (name === "phone" && value) {
        if (!/^[+\d\s-]+$/.test(value) || (value.match(/\+/g) || []).length > 1 || (value.includes("+") && !value.startsWith("+"))) return "Le téléphone ne peut contenir que des chiffres, espaces, tirets et + au début.";
        if (!phonePattern.test(normalizePhone(value))) return `Numéro marocain invalide. ${phoneHint}`;
    }
    if (name === "specialty") {
        if (!value) return "La spécialité est obligatoire.";
        if ([...value].length < 2 || [...value].length > 160) return "La spécialité doit contenir entre 2 et 160 caractères.";
        if (!/\p{L}/u.test(value)) return "La spécialité doit contenir au moins une lettre (ex : HIIT, Fitness 360).";
    }
    if (name === "experience_years") {
        if (!/^(0|[1-9]\d*)$/.test(value) || Number(value) > 80) return "L'expérience doit être un nombre entier entre 0 et 80.";
    }
    if (name === "bio" && [...value].length > 3000) return "La biographie ne doit pas dépasser 3000 caractères.";
    return "";
}

export default function CoachForm({ coach, onClose, onSave }) {
    const editing = Boolean(coach);
    const [form, setForm] = useState(empty);
    const [photo, setPhoto] = useState(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const photoInputRef = useRef(null);

    useEffect(() => {
        setForm(coach ? {
            name: coach.name ?? "", email: coach.email ?? "",
            phone: coach.phone ?? "", specialty: coach.profile?.specialty ?? "",
            experience_years: String(coach.profile?.experience_years ?? 0),
            bio: coach.profile?.bio ?? "",
            is_featured: !!coach.profile?.is_featured,
            status: coach.status ?? "pending",
        } : { ...empty });
        setPhoto(null); setRemovePhoto(false); setError("");
        setErrors({}); setTouched({}); setSubmitted(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
    }, [coach]);

    useEffect(() => {
        const close = (e) => { if (e.key === "Escape" && !saving) onClose(); };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [onClose, saving]);

    function change(e) {
        const { name, value, type, checked } = e.target;
        if (name === "phone") {
            if (!/^[+\d\s-]*$/.test(value) || (value.match(/\+/g) || []).length > 1 || (value.includes("+") && !value.startsWith("+"))) {
                setErrors((p) => ({ ...p, phone: "Lettres et caractères spéciaux interdits dans le téléphone." }));
                return;
            }
            const digits = value.replace(/\D/g, "");
            const international = /^\+?212/.test(normalizePhone(value));
            if (value.length > 32 || digits.length > (international ? 12 : 10)) {
                setErrors((p) => ({ ...p, phone: `Trop de chiffres. ${phoneHint}` }));
                return;
            }
        }
        const next = type === "checkbox" ? checked : value;
        setForm((p) => ({ ...p, [name]: next }));
        if (type !== "checkbox") setErrors((p) => ({
            ...p, [name]: touched[name] || submitted ? validate(name, next, editing) : "",
        }));
        setError("");
    }

    function blur(name) {
        setTouched((p) => ({ ...p, [name]: true }));
        setErrors((p) => ({ ...p, [name]: validate(name, form[name], editing) }));
    }

    function choosePhoto(file) {
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setPhoto(null);
            if (photoInputRef.current) photoInputRef.current.value = "";
            setErrors((p) => ({ ...p, photo: "Photo invalide : JPG, PNG ou WEBP, maximum 2 Mo." }));
            return;
        }
        setPhoto(file); setRemovePhoto(false);
        setErrors((p) => ({ ...p, photo: "" }));
        setError("");
    }

    async function submit(e) {
        e.preventDefault();
        if (saving) return;
        setSubmitted(true);
        const next = {};
        ["name", "phone", "specialty", "experience_years", "bio", ...(!editing ? ["email"] : [])]
            .forEach((name) => { next[name] = validate(name, form[name], editing); });
        setErrors((p) => ({ ...p, ...next }));
        if (Object.values(next).some(Boolean) || errors.photo) return;

        const payload = new FormData();
        payload.set("name", normalizeSpaces(form.name));
        payload.set("phone", normalizePhone(form.phone.trim()));
        payload.set("specialty", normalizeSpaces(form.specialty));
        payload.set("bio", form.bio.trim());
        payload.set("experience_years", String(form.experience_years));
        payload.set("is_featured", form.is_featured ? "1" : "0");
        if (!editing) payload.set("email", form.email.trim().toLowerCase());
        if (editing && form.status !== "pending") payload.set("status", form.status);
        if (photo) payload.set("photo", photo);
        if (editing && removePhoto) payload.set("remove_photo", "1");

        setSaving(true); setError("");
        try {
            await onSave(payload, coach?.id);
        } catch (err) {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors && typeof backendErrors === "object") {
                setErrors((p) => ({
                    ...p,
                    ...Object.fromEntries(Object.entries(backendErrors).map(
                        ([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]
                    )),
                }));
                setError("Vérifiez les champs signalés ci-dessous.");
            } else setError(apiError(err));
        } finally { setSaving(false); }
    }

    const input = (label, name, type = "text", required = false) => (
        <div>
            <label className={labelClass} htmlFor={`coach-${name}`}>{label}</label>
            <input id={`coach-${name}`} name={name} type={type} value={form[name]}
                onChange={change} onBlur={() => blur(name)}
                disabled={saving || (editing && name === "email")} required={required}
                min={type === "number" ? 0 : undefined}
                max={type === "number" ? 80 : undefined}
                step={type === "number" ? 1 : undefined}
                maxLength={{ name: 160, email: 190, phone: 32, specialty: 160 }[name]}
                inputMode={name === "phone" ? "tel" : type === "number" ? "numeric" : undefined}
                autoComplete={{ name: "name", email: "email", phone: "tel" }[name]}
                placeholder={name === "phone" ? "06XXXXXXXX ou +212 6XXXXXXXX" : undefined}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `coach-${name}-error` : undefined}
                className={`${fieldClass} ${errors[name] ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
            />
            {name === "phone" && <p className="mt-1 text-[11px] font-normal text-slate-500">Facultatif. {phoneHint}</p>}
            {errors[name] && <p id={`coach-${name}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un coach" : "Ajouter un coach"}
                className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3.5">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{editing ? "Modifier le coach" : "Nouveau coach"}</h2>
                        <p className="mt-0.5 text-xs text-slate-500">{editing ? "Informations professionnelles." : "Une invitation d'activation sera envoyée."}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} aria-label="Fermer"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={submit} noValidate className="space-y-4 overflow-y-auto p-5">
                    {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">{error}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {input("Nom complet *", "name", "text", true)}
                        {input("Adresse e-mail *", "email", "email", true)}
                        {input("Téléphone", "phone", "tel")}
                        {input("Spécialité *", "specialty", "text", true)}
                        {input("Années d'expérience *", "experience_years", "number", true)}
                    </div>

                    <div>
                        <label htmlFor="coach-bio" className={labelClass}>Biographie</label>
                        <textarea id="coach-bio" name="bio" rows={3} value={form.bio}
                            onChange={change} onBlur={() => blur("bio")} maxLength={3000}
                            placeholder="Présentation du coach..." aria-invalid={!!errors.bio}
                            className={`${fieldClass} ${errors.bio ? "border-red-400" : "border-slate-200"}`} />
                        <p className="mt-1 text-right text-[11px] text-slate-400">{form.bio.length}/3000</p>
                        {errors.bio && <p role="alert" className="text-xs text-red-600">{errors.bio}</p>}
                    </div>

                    <div>
                        <label htmlFor="coach-photo" className={labelClass}>Photo du coach</label>
                        <div className={`mt-1.5 flex items-center gap-3 rounded-lg border border-dashed bg-slate-50/60 p-3 ${errors.photo ? "border-red-400" : "border-slate-300"}`}>
                            {editing && coach.profile?.photo_url && !photo && !removePhoto
                                ? <img src={coach.profile.photo_url} alt="Photo actuelle" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                                : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400"><ImagePlus size={18} /></span>
                            }
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-500">JPG, PNG, WEBP (max. 2 Mo)</p>
                                <input ref={photoInputRef} id="coach-photo" type="file"
                                    accept="image/jpeg,image/png,image/webp" disabled={saving}
                                    className="mt-1.5 w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:border-blue-200 hover:file:text-blue-600"
                                    onChange={(e) => choosePhoto(e.target.files?.[0])} />
                                {photo && <p className="mt-1 truncate text-[11px] text-blue-600">Sélectionnée : {photo.name}</p>}
                            </div>
                        </div>
                        {errors.photo && (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <p role="alert" className="text-xs text-red-600">{errors.photo}</p>
                                <button type="button" onClick={() => {
                                    setErrors((p) => ({ ...p, photo: "" }));
                                    setPhoto(null);
                                    if (photoInputRef.current) photoInputRef.current.value = "";
                                }} className="text-xs font-semibold text-blue-600 hover:underline">
                                    Ignorer cette photo
                                </button>
                            </div>
                        )}
                        {editing && coach.profile?.photo_url && (
                            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                                <input type="checkbox" disabled={saving} checked={removePhoto}
                                    onChange={(e) => {
                                        setRemovePhoto(e.target.checked);
                                        if (e.target.checked) {
                                            setPhoto(null);
                                            if (photoInputRef.current) photoInputRef.current.value = "";
                                        }
                                    }} className="accent-blue-600" />
                                Supprimer la photo actuelle
                            </label>
                        )}
                    </div>

                    <div>
                        <label className="flex items-center gap-2.5 text-[13px] font-medium text-slate-700">
                            <input type="checkbox" name="is_featured" checked={form.is_featured}
                                onChange={change} disabled={saving} className="h-4 w-4 rounded accent-blue-600" />
                            Afficher sur la Landing Page
                        </label>
                        <p className="mt-1 text-xs text-slate-500">
                            Un seul coach peut être mis en avant. Choisir celui-ci retire automatiquement l'ancien.
                        </p>
                    </div>

                    {editing && form.status !== "pending" && (
                        <div>
                            <label htmlFor="coach-status" className={labelClass}>Statut</label>
                            <select id="coach-status" name="status" value={form.status} onChange={change}
                                disabled={saving} className={`${fieldClass} border-slate-200`}>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                            {errors.status && <p role="alert" className="mt-1 text-xs text-red-600">{errors.status}</p>}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" disabled={saving} onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                            {saving && <LoaderCircle size={14} className="animate-spin" />}
                            {editing ? "Enregistrer" : "Créer et inviter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
