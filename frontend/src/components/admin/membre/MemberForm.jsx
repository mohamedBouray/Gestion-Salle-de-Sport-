import { useEffect, useState } from "react";
import { LoaderCircle, X, UserRound, Mail, Phone } from "lucide-react";
import { apiError } from "../../../services/api";

const emptyForm = { name: "", email: "", phone: "" };
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]*$/u;
const phonePattern = /^(?:0[567]\d{8}|\+?212[567]\d{8})$/;
const inputClass = "mt-1.5 w-full rounded-lg border bg-slate-50 px-3 py-2.5 pl-10 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-100 disabled:text-slate-500";
const normalizePhone = (value) => value.replace(/[\s-]+/g, "");
const cleanPhone = (value) => value.replace(/[^0-9+\s-]/g, "").replace(/(?!^)\+/g, "").slice(0, 24);

function validateField(name, value) {
    const text = String(value || "").trim();
    if (name === "name") {
        if (!text) return "Le nom complet est obligatoire.";
        if ([...text].length < 2 || [...text].length > 160) return "Le nom doit contenir entre 2 et 160 caractères.";
        if (!namePattern.test(text)) return "Le nom doit contenir des lettres, sans chiffres.";
    }
    if (name === "email") {
        if (!text) return "L'adresse e-mail est obligatoire.";
        if (text.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Saisissez une adresse e-mail valide.";
    }
    if (name === "phone" && text && !phonePattern.test(normalizePhone(text))) {
        return "Numéro invalide : 05, 06 ou 07 + 8 chiffres, ou +212 suivi de 5, 6 ou 7 + 8 chiffres.";
    }
    return "";
}

export default function MemberForm({ member, onClose, onSave }) {
    const editing = Boolean(member);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(member ? { name: member.name || "", email: member.email || "", phone: member.phone || "" } : { ...emptyForm });
        setErrors({}); setTouched({}); setSubmitted(false); setError("");
    }, [member]);

    useEffect(() => {
        const handleEscape = (event) => { if (event.key === "Escape" && !saving) onClose(); };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose, saving]);

    const change = (name, value) => {
        const invalidChars = name === "phone" && cleanPhone(value) !== value;
        const next = name === "phone" ? cleanPhone(value) : value;
        setForm((old) => ({ ...old, [name]: next }));
        setErrors((old) => ({ ...old, [name]: invalidChars ? "Les lettres et caractères spéciaux ne sont pas autorisés." : (touched[name] || submitted ? validateField(name, next) : "") }));
        setError("");
    };

    const blur = (name) => {
        setTouched((old) => ({ ...old, [name]: true }));
        setErrors((old) => ({ ...old, [name]: editing && name === "email" ? "" : validateField(name, form[name]) }));
    };

    const submit = async (event) => {
        event.preventDefault(); if (saving) return;
        setSubmitted(true);
        const next = { name: validateField("name", form.name), phone: validateField("phone", form.phone), email: editing ? "" : validateField("email", form.email) };
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        setSaving(true); setError("");
        try {
            const payload = { name: form.name.trim().replace(/\s+/g, " "), phone: normalizePhone(form.phone) || null };
            if (!editing) payload.email = form.email.trim().toLowerCase();
            await onSave(payload, member?.id);
        } catch (err) {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors) {
                setErrors((old) => ({ ...old, ...Object.fromEntries(Object.entries(backendErrors).map(([key, val]) => [key, Array.isArray(val) ? val[0] : String(val)])) }));
                setError("Vérifiez les champs signalés.");
            } else setError(apiError(err));
        } finally { setSaving(false); }
    };

    const input = (label, name, Icon, type, placeholder, maxLength) => (
        <div>
            <label htmlFor={`member-${name}`} className="block text-[13px] font-semibold text-slate-700">{label}</label>
            <div className="relative">
                <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id={`member-${name}`} name={name} type={type} inputMode={name === "phone" ? "tel" : undefined} autoComplete={name === "phone" ? "tel" : name === "email" ? "email" : "name"}
                    value={form[name]} onChange={(e) => change(name, e.target.value)} onBlur={() => blur(name)} maxLength={maxLength}
                    disabled={saving || (editing && name === "email")} required={name !== "phone"} placeholder={placeholder}
                    aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `member-${name}-error` : undefined}
                    className={`${inputClass} ${errors[name] ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`} />
            </div>
            {errors[name] && <p role="alert" id={`member-${name}-error`} className="mt-1.5 text-xs font-medium text-red-600">{errors[name]}</p>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={editing ? "Modifier un membre" : "Ajouter un membre"} className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                    <div><h2 className="text-lg font-extrabold text-[#0f1b33]">{editing ? "Modifier un membre" : "Ajouter un membre"}</h2><p className="mt-1 text-xs text-slate-500">{editing ? "Modifiez les informations du membre." : "Créez un nouvel accès pour votre adhérent."}</p></div>
                    <button type="button" onClick={onClose} disabled={saving} aria-label="Fermer" className=" cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={19} /></button>
                </div>
                <form onSubmit={submit} noValidate className="space-y-4 overflow-y-auto px-5 py-5">
                    {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><UserRound size={17} /></span><h3 className="text-[13px] font-bold text-slate-800">Informations personnelles</h3></div>
                    {input("Nom complet", "name", UserRound, "text", "Ex : Prénom Nom", 160)}
                    {input("Adresse e-mail", "email", Mail, "email", "exemple@email.com", 190)}
                    {input("Téléphone (facultatif)", "phone", Phone, "tel", "Ex : 0612345678 ou +212 512345678", 24)}
                    <p className="text-[11px] text-slate-500">Numéro marocain : 05, 06 ou 07 suivi de 8 chiffres. Formats +212 et 212 acceptés.</p>
                    {!editing && <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><div className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-blue-600" /><div><p className="text-xs font-bold text-blue-800">Invitation automatique</p><p className="mt-1 text-xs leading-relaxed text-blue-700">Le membre recevra un lien par e-mail pour activer son compte et définir son mot de passe.</p></div></div></div>}
                    {editing && <p className="text-[11px] text-slate-400">L'adresse e-mail ne peut pas être modifiée.</p>}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose} disabled={saving} className=" cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
                        <button type="submit" disabled={saving} className=" cursor-pointer inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{saving && <LoaderCircle size={15} className="animate-spin" />}{editing ? "Enregistrer" : "Créer et inviter"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
