import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Plus, Send, X } from "lucide-react";
import { apiError } from "../../services/api";
import { coachCoursesPlanningApi } from "../../services/CoachCoursesPlanningApi";

const initial = { name: "", description: "", suggested_duration_minutes: "60", suggested_capacity: "15" };
const style = "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-100";
const normalize = (value) => value.trim().replace(/\s+/g, " ");
const length = (value) => [...value].length;
function validate(key, raw) {
    const value = String(raw ?? "").trim();
    if (key === "name") {
        if (!value) return "Le nom du cours est obligatoire.";
        if (length(value) < 4 || length(value) > 160) return "Le nom doit contenir entre 4 et 160 caractères.";
        if (!/\p{L}/u.test(value)) return "Le nom doit contenir au moins une lettre (ex. : Fitness 360).";
    }
    if (key === "description" && length(value) > 3000) return "La description ne doit pas dépasser 3000 caractères.";
    if (key === "suggested_duration_minutes" && (!/^[1-9]\d*$/.test(value) || Number(value) < 15 || Number(value) > 240)) return "La durée doit être un entier entre 15 et 240 minutes.";
    if (key === "suggested_capacity" && (!/^[1-9]\d*$/.test(value) || Number(value) < 1 || Number(value) > 100)) return "La capacité doit être un entier entre 1 et 100 places.";
    return "";
}

export default function CourseProposalForm({ onCreated }) {
    const [open, setOpen] = useState(false), [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({}), [touched, setTouched] = useState({});
    const [busy, setBusy] = useState(false), [error, setError] = useState("");
    const firstRef = useRef(null), cancelRef = useRef(null);
    const fields = Object.keys(initial);
    const close = () => { if (!busy) { setOpen(false); setErrors({}); setError(""); } };
    const update = (key, value) => {
        setForm((s) => ({ ...s, [key]: value })); setError("");
        if (touched[key]) setErrors((e) => ({ ...e, [key]: validate(key, value) }));
    };
    const blur = (key) => { setTouched((s) => ({ ...s, [key]: true })); setErrors((e) => ({ ...e, [key]: validate(key, form[key]) })); };

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement, overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden"; firstRef.current?.focus();
        const onKey = (e) => { if (e.key === "Escape" && !busy) close(); };
        window.addEventListener("keydown", onKey);
        return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus?.(); };
    }, [open, busy]);

    async function submit(e) {
        e.preventDefault(); if (busy) return;
        const next = Object.fromEntries(fields.map((key) => [key, validate(key, form[key])]));
        setErrors(next); setTouched(Object.fromEntries(fields.map((key) => [key, true])));
        if (Object.values(next).some(Boolean)) return;
        setBusy(true); setError("");
        try {
            await coachCoursesPlanningApi.proposeCourse({
                name: normalize(form.name), description: form.description.trim() || null,
                suggested_duration_minutes: Number(form.suggested_duration_minutes), suggested_capacity: Number(form.suggested_capacity),
            });
            setOpen(false); setForm({ ...initial }); setErrors({}); setTouched({});
            onCreated?.("Proposition envoyée à l'administrateur.");
        } catch (err) {
            const invalid = err.response?.data?.errors;
            if (invalid && typeof invalid === "object") {
                setErrors((old) => ({ ...old, ...Object.fromEntries(Object.entries(invalid).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])) }));
                setError("Corrigez les champs signalés.");
            } else setError(apiError(err));
        } finally { setBusy(false); }
    }
    const fieldError = (key) => errors[key] && <p id={`proposal-${key}-error`} role="alert" className="mt-1.5 text-xs text-red-600">{errors[key]}</p>;
    const attrs = (key) => ({
        id: `proposal-${key}`, value: form[key], onChange: (e) => update(key, e.target.value), onBlur: () => blur(key),
        disabled: busy, "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `proposal-${key}-error` : undefined,
        className: `${style} ${errors[key] ? "border-red-400" : "border-slate-200 focus:border-blue-400"}`
    });

    return <>
        <button type="button" onClick={() => { setOpen(true); setError(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"><Plus size={15} /> Proposer un cours</button>
        {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
            <section role="dialog" aria-modal="true" aria-label="Proposer un cours" className="flex max-h-[94dvh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
                    <div><h2 className="text-lg font-extrabold text-slate-900">Proposer un cours</h2><p className="mt-1 text-xs text-slate-500">Seul l'administrateur peut accepter et publier le cours.</p></div>
                    <button type="button" aria-label="Fermer" disabled={busy} onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
                </header>
                <form onSubmit={submit} noValidate className="space-y-4 overflow-y-auto px-5 py-5">
                    {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
                    <div><label htmlFor="proposal-name" className="text-xs font-semibold text-slate-700">Nom du cours <span className="text-red-500">*</span></label>
                        <input ref={firstRef} {...attrs("name")} maxLength={160} placeholder="Ex. Fitness 360" required />{fieldError("name")}</div>
                    <div><label htmlFor="proposal-description" className="text-xs font-semibold text-slate-700">Description (facultative)</label>
                        <textarea {...attrs("description")} rows={3} maxLength={3000} placeholder="Objectifs, déroulement..." className={`${attrs("description").className} resize-y`} />
                        <p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/3000</p>{fieldError("description")}</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div><label htmlFor="proposal-suggested_duration_minutes" className="text-xs font-semibold text-slate-700">Durée suggérée (min) *</label>
                            <input type="number" min="15" max="240" step="1" required {...attrs("suggested_duration_minutes")} />{fieldError("suggested_duration_minutes")}</div>
                        <div><label htmlFor="proposal-suggested_capacity" className="text-xs font-semibold text-slate-700">Capacité suggérée *</label>
                            <input type="number" min="1" max="100" step="1" required {...attrs("suggested_capacity")} />{fieldError("suggested_capacity")}</div>
                    </div>
                    <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button ref={cancelRef} type="button" disabled={busy} onClick={close} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
                        <button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />} {busy ? "Envoi..." : "Envoyer"}</button>
                    </footer>
                </form>
            </section>
        </div>}
    </>;
}