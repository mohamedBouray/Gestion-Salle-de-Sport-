import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ImagePlus, Info, LoaderCircle, X } from "lucide-react";
import { adminApi } from "../../../services/AdminApi";
import { coursesApi } from "../../../services/CoursesApi";
import { apiError } from "../../../services/api";

const empty = { name: "", description: "", coach_id: "", price: "0", status: "pending" };
const inputClass = "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:opacity-60";
const labelClass = "block text-xs font-semibold text-slate-700";
const statusOptions = [
    { value: "pending", text: "En attente", color: "peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-700" },
    { value: "active", text: "Actif", color: "peer-checked:border-emerald-400 peer-checked:bg-emerald-50 peer-checked:text-emerald-700" },
    { value: "inactive", text: "Inactif", color: "peer-checked:border-red-400 peer-checked:bg-red-50 peer-checked:text-red-700" },
];
const getImage = (course) => {
    const value = course?.image_url || course?.image;
    return typeof value === "string" && /^(https?:\/\/|\/|blob:|data:image\/)/i.test(value) ? value : "";
};
const asForm = (course) => course ? {
    name: course.name ?? "", description: course.description ?? "",
    coach_id: String(course.coach_id ?? course.coach?.id ?? ""),
    price: String(course.price ?? "0"), status: course.status ?? "pending",
} : { ...empty };
const cleanSpaces = (value) => String(value).trim().replace(/\s+/g, " ");

function validateField(name, raw) {
    const value = String(raw ?? "").trim();
    if (name === "name") {
        if (!value) return "Le nom du cours est obligatoire.";
        if ([...value].length < 2 || [...value].length > 160) return "Le nom doit contenir entre 2 et 160 caractères.";
        if (!/\p{L}/u.test(value)) return "Le nom doit contenir au moins une lettre (ex. : Fitness 360).";
        if (/[<>\u0000-\u001F\u007F]/.test(value)) return "Le nom contient des caractères interdits.";
    }
    if (name === "description" && [...value].length > 5000) return "La description ne doit pas dépasser 5000 caractères.";
    if (name === "coach_id" && value && !/^[1-9]\d*$/.test(value)) return "Sélectionnez un coach valide.";
    if (name === "price") {
        if (!value) return "Le prix est obligatoire.";
        const normalized = value.replace(",", ".");
        if (!/^\d+(?:\.\d{1,2})?$/.test(normalized) || Number(normalized) > 99999999.99)
            return "Prix invalide : nombre positif ou 0, maximum 2 décimales.";
    }
    if (name === "status" && !["pending", "active", "inactive"].includes(value)) return "Statut invalide.";
    return "";
}

export default function CourseForm({ course, onClose, onSave }) {
    const editing = Boolean(course?.id);
    const [record, setRecord] = useState(course ?? null);
    const [form, setForm] = useState(() => asForm(course));
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(editing);
    const [loadingCoaches, setLoadingCoaches] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(() => getImage(course));

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    useEffect(() => {
        const onKey = (event) => { if (event.key === "Escape" && !saving) onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, saving]);

    useEffect(() => {
        if (!editing) return;
        let mounted = true;
        coursesApi.show(course.id)
            .then((result) => {
                if (!mounted) return;
                const value = result.course ?? result.data ?? result;
                setRecord(value); setForm(asForm(value));
            })
            .catch((err) => { if (mounted) { setLoadError(true); setError(apiError(err)); } })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [editing, course?.id]);

    useEffect(() => {
        let mounted = true;
        adminApi.coaches.list({ status: "active", page: 1, per_page: 100 })
            .then((result) => {
                if (!mounted) return;
                const list = result.coaches ?? [];
                setCoaches(Array.isArray(list) ? list : list.data ?? []);
            })
            .catch((err) => { if (mounted) setError(apiError(err)); })
            .finally(() => { if (mounted) setLoadingCoaches(false); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!imageFile) { setPreview(getImage(record)); return; }
        const url = URL.createObjectURL(imageFile);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile, record]);

    const change = (key, value) => {
        setForm((old) => ({ ...old, [key]: value }));
        setErrors((old) => ({ ...old, [key]: touched[key] || submitted ? validateField(key, value) : "" }));
        setError("");
    };
    const blur = (key) => {
        setTouched((old) => ({ ...old, [key]: true }));
        setErrors((old) => ({ ...old, [key]: validateField(key, form[key]) }));
    };
    const selectedCoach = String(form.coach_id);
    const options = [...coaches];
    if (selectedCoach && !options.some((item) => String(item.id) === selectedCoach)) {
        options.push({ id: selectedCoach, name: record?.coach?.name || `Coach #${selectedCoach}`, current: true });
    }

    function pickImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        event.target.value = "";
        let message = "";
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) message = "Choisissez une image JPG, PNG ou WEBP.";
        else if (file.size > 5 * 1024 * 1024) message = "L'image ne doit pas dépasser 5 Mo.";
        setImageFile(message ? null : file);
        setErrors((old) => ({ ...old, image: message }));
    }

    async function submit(event) {
        event.preventDefault();
        if (saving || loading || loadingCoaches || loadError) return;
        setSubmitted(true);
        const next = Object.fromEntries(Object.keys(empty).map((key) => [key, validateField(key, form[key])]));
        next.image = errors.image || "";
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        setSaving(true); setError("");
        try {
            const payload = new FormData();
            payload.set("name", cleanSpaces(form.name));
            payload.set("description", form.description.trim());
            payload.set("coach_id", form.coach_id);
            payload.set("price", form.price.trim().replace(",", "."));
            payload.set("status", form.status);
            if (imageFile) payload.set("image", imageFile);
            await onSave(payload, course?.id);
        } catch (err) {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors && typeof backendErrors === "object") {
                setErrors((old) => ({
                    ...old, ...Object.fromEntries(Object.entries(backendErrors).map(([key, val]) =>
                        [key, Array.isArray(val) ? val[0] : String(val)]))
                }));
                setError("Vérifiez les champs signalés ci-dessous.");
            } else setError(apiError(err));
        } finally { setSaving(false); }
    }

    const fieldError = (name) => errors[name] ? <p role="alert" className="mt-1 text-xs font-medium text-red-600" id={`course-${name}-error`}>{errors[name]}</p> : null;
    const styleFor = (name) => `${inputClass} ${errors[name] ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`;

    return createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="course-form-title"
                className="flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4">
                    <div><h2 id="course-form-title" className="text-base font-bold text-[#0f1b33]">{editing ? "Modifier le cours" : "Nouveau cours"}</h2>
                        <p className="mt-1 text-xs text-slate-500">Renseignez les informations de l'activité sportive.</p></div>
                    <button type="button" aria-label="Fermer" onClick={onClose} disabled={saving}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={18} /></button>
                </header>

                <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                        {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{error}</p>}
                        {loading ? <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                            <LoaderCircle size={20} className="animate-spin text-blue-600" />Chargement du cours...
                        </div> : <>
                            <div>
                                <label className={labelClass} htmlFor="course-name">Nom du cours <span className="text-red-500">*</span></label>
                                <input id="course-name" value={form.name} onChange={(e) => change("name", e.target.value)} onBlur={() => blur("name")}
                                    maxLength={160} autoFocus disabled={saving || loadError} placeholder="Ex. : Yoga, Boxe, Fitness 360" aria-invalid={!!errors.name}
                                    aria-describedby={errors.name ? "course-name-error" : undefined} className={styleFor("name")} />
                                {fieldError("name")}
                            </div>
                            <div>
                                <label className={labelClass} htmlFor="course-description">Description</label>
                                <textarea id="course-description" rows={3} maxLength={5000} value={form.description}
                                    onChange={(e) => change("description", e.target.value)} onBlur={() => blur("description")}
                                    disabled={saving || loadError} placeholder="Objectifs, niveau et contenu du cours..."
                                    aria-invalid={!!errors.description} className={`${styleFor("description")} resize-y`} />
                                <p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/5000</p>
                                {fieldError("description")}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass} htmlFor="course-coach">Coach principal (facultatif)</label>
                                    <select id="course-coach" value={form.coach_id} onChange={(e) => change("coach_id", e.target.value)} onBlur={() => blur("coach_id")}
                                        disabled={saving || loadingCoaches || loadError} aria-invalid={!!errors.coach_id} className={styleFor("coach_id")}>
                                        <option value="">Aucun coach assigné</option>
                                        {options.map((item) => <option key={item.id} value={item.id}>{item.name}{item.current ? " (actuel)" : ""}</option>)}
                                    </select>
                                    {fieldError("coach_id")}
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor="course-price">Prix par séance (MAD) <span className="text-red-500">*</span></label>
                                    <input id="course-price" type="text" inputMode="decimal" value={form.price} onChange={(e) => change("price", e.target.value)}
                                        onBlur={() => blur("price")} disabled={saving || loadError} placeholder="Ex. : 50.00" aria-invalid={!!errors.price}
                                        className={styleFor("price")} />
                                    {fieldError("price")}
                                </div>
                            </div>
                            <div>
                                <p className={labelClass}>Statut du cours</p>
                                <div className="mt-1.5 grid grid-cols-3 gap-2">
                                    {statusOptions.map((item) => <label key={item.value} className="cursor-pointer">
                                        <input type="radio" name="course-status" value={item.value} checked={form.status === item.value}
                                            onChange={() => change("status", item.value)} disabled={saving || loadError} className="peer sr-only" />
                                        <span className={`flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 ${item.color}`}>
                                            {form.status === item.value && <Check size={13} />}{item.text}
                                        </span>
                                    </label>)}
                                </div>
                                {fieldError("status")}
                            </div>
                            <div>
                                <p className={labelClass}>Image du cours</p>
                                <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 transition hover:border-blue-400">
                                    <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200 text-slate-400">
                                        {preview ? <img src={preview} alt="Aperçu du cours" className="h-full w-full object-cover" /> : <ImagePlus size={22} />}
                                    </span>
                                    <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-slate-700">
                                        {imageFile?.name || (preview ? "Modifier l'image" : "Ajouter une image")}
                                    </span><span className="mt-1 block text-xs text-slate-500">JPG, PNG, WEBP · Max. 5 Mo</span></span>
                                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving || loadError}
                                        className="sr-only" onChange={pickImage} />
                                </label>
                                {fieldError("image")}
                                {errors.image && <button type="button" className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                                    onClick={() => setErrors((old) => ({ ...old, image: "" }))}>Ignorer l'image invalide</button>}
                            </div>
                            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
                                Dates, horaires, salle et nombre de places seront définis dans le Planning.</p>
                        </>}
                    </div>
                    <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
                        <button type="button" onClick={onClose} disabled={saving}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Annuler</button>
                        <button type="submit" disabled={saving || loading || loadingCoaches || loadError}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                            {saving && <LoaderCircle size={14} className="animate-spin" />}{saving ? "Enregistrement..." : editing ? "Enregistrer" : "Créer le cours"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>, document.body
    );
}
