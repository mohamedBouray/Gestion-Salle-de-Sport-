import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ImagePlus, Info, LoaderCircle, X } from "lucide-react";
import { adminApi } from "../../../services/AdminApi";
import { coursesApi } from "../../../services/CoursesApi";
import { apiError } from "../../../services/api";

const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition " +
    "placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:opacity-60";
const labelClass = "block text-xs font-semibold text-slate-600";
const empty = { name: "", description: "", coach_id: "", price: "0", status: "pending" };

const statusOptions = [
    { value: "pending", text: "En attente", color: "peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-700" },
    { value: "active", text: "Actif", color: "peer-checked:border-emerald-400 peer-checked:bg-emerald-50 peer-checked:text-emerald-700" },
    { value: "inactive", text: "Inactif", color: "peer-checked:border-red-400 peer-checked:bg-red-50 peer-checked:text-red-700" },
];

const getImage = (course) => {
    const value = course?.image_url || course?.image;
    return typeof value === "string" && /^(https?:\/\/|\/|blob:|data:image\/)/i.test(value) ? value : "";
};
const asForm = (course) => course ? ({
    name: course.name ?? "", description: course.description ?? "",
    coach_id: String(course.coach_id ?? course.coach?.id ?? ""),
    price: String(course.price ?? "0"), status: course.status ?? "pending",
}) : { ...empty };

export default function CourseForm({ course, onClose, onSave }) {
    const editing = Boolean(course?.id);
    const [record, setRecord] = useState(course ?? null);
    const [form, setForm] = useState(() => asForm(course));
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(editing);
    const [loadingCoaches, setLoadingCoaches] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(() => getImage(course));

    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, []);

    useEffect(() => {
        function onKeyDown(event) { if (event.key === "Escape" && !saving) onClose(); }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, saving]);

    useEffect(() => {
        if (!editing) return;
        let mounted = true;
        coursesApi.show(course.id)
            .then((result) => {
                if (!mounted) return;
                const value = result.course ?? result.data ?? result;
                setRecord(value);
                setForm(asForm(value));
            })
            .catch((err) => { if (mounted) setError(apiError(err)); })
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

    const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));
    const selectedCoach = String(form.coach_id);
    const options = [...coaches];
    if (selectedCoach && !options.some((item) => String(item.id) === selectedCoach)) {
        options.push({ id: selectedCoach, name: record?.coach?.name || `Coach #${selectedCoach}`, current: true });
    }

    function pickImage(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setError("Choisissez une image JPG, PNG ou WEBP.");
            event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("La taille maximale de l'image est de 5 Mo.");
            event.target.value = "";
            return;
        }
        setError("");
        setImageFile(file);
    }

    async function submit(event) {
        event.preventDefault();
        if (saving || loading) return;
        setError("");
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append("name", form.name.trim());
            payload.append("description", form.description.trim());
            payload.append("coach_id", form.coach_id);
            payload.append("price", form.price);
            payload.append("status", form.status);
            if (imageFile) payload.append("image", imageFile);
            await onSave(payload, course?.id);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setSaving(false);
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-form-title"
                className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            >
                <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 id="course-form-title" className="text-base font-bold text-[#0f1b33]">
                            {editing ? "Modifier le cours" : "Nouveau cours"}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Renseignez les informations de l'activité sportive.
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                        {error && (
                            <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                                {error}
                            </p>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                                <LoaderCircle size={20} className="animate-spin text-blue-600" />
                                Chargement du cours...
                            </div>
                        ) : (
                            <>
                                <label className={labelClass}>
                                    Nom du cours <span className="text-red-500">*</span>
                                    <input
                                        required autoFocus maxLength={160}
                                        value={form.name}
                                        onChange={(e) => change("name", e.target.value)}
                                        placeholder="Ex. : Yoga, Boxe, Cross Training..."
                                        className={inputClass}
                                    />
                                </label>

                                <label className={labelClass}>
                                    Description
                                    <textarea
                                        rows={3} maxLength={5000}
                                        value={form.description}
                                        onChange={(e) => change("description", e.target.value)}
                                        placeholder="Objectifs, niveau et contenu du cours..."
                                        className={`${inputClass} resize-y`}
                                    />
                                </label>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label className={labelClass}>
                                        Coach principal
                                        <select
                                            value={form.coach_id}
                                            onChange={(e) => change("coach_id", e.target.value)}
                                            disabled={loadingCoaches}
                                            className={inputClass}
                                        >
                                            <option value="">Aucun coach assigné</option>
                                            {options.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}{item.current ? " (actuel)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className={labelClass}>
                                        Prix par séance (MAD) <span className="text-red-500">*</span>
                                        <input
                                            type="number" required min="0" max="99999999.99" step="0.01"
                                            value={form.price}
                                            onChange={(e) => change("price", e.target.value)}
                                            className={inputClass}
                                        />
                                    </label>
                                </div>

                                <div>
                                    <p className={labelClass}>Statut du cours</p>
                                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                                        {statusOptions.map((item) => (
                                            <label key={item.value} className="cursor-pointer">
                                                <input
                                                    type="radio" name="course-status" value={item.value}
                                                    checked={form.status === item.value}
                                                    onChange={() => change("status", item.value)}
                                                    className="peer sr-only"
                                                />
                                                <span className={`flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 ${item.color}`}>
                                                    {form.status === item.value && <Check size={13} />}
                                                    {item.text}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className={labelClass}>Image du cours</p>
                                    <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-3 transition hover:border-blue-400 hover:bg-blue-50/40">
                                        <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200 text-slate-400">
                                            {preview
                                                ? <img src={preview} alt="Aperçu du cours" className="h-full w-full object-cover" />
                                                : <ImagePlus size={22} />}
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block truncate text-[13px] font-semibold text-slate-700">
                                                {imageFile?.name || (preview ? "Modifier l'image" : "Ajouter une image")}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500">
                                                JPG, PNG ou WEBP · Max. 5 Mo
                                            </span>
                                        </span>

                                        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={pickImage} />
                                    </label>
                                </div>

                                <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                                    <Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
                                    Dates, horaires, salle et nombre de places seront définis dans le Planning.
                                </p>
                            </>
                        )}
                    </div>

                    <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
                        <button
                            type="button" onClick={onClose} disabled={saving}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        >
                            Annuler
                        </button>

                        <button
                            type="submit" disabled={saving || loading || loadingCoaches}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving && <LoaderCircle size={14} className="animate-spin" />}
                            {saving ? "Enregistrement..." : editing ? "Enregistrer" : "Créer le cours"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>, document.body
    );
}