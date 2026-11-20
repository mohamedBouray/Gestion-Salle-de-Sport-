import { useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { apiError } from "../../services/api";
import { coachCoursesPlanningApi } from "../../services/CoachCoursesPlanningApi";
import { ErrorBox } from "./CoachUI";

const empty = { name: "", description: "", suggested_duration_minutes: 60, suggested_capacity: 15 };
const field = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default function CourseProposalForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await coachCoursesPlanningApi.proposeCourse({
        name: form.name.trim(), description: form.description.trim(),
        suggested_duration_minutes: Number(form.suggested_duration_minutes),
        suggested_capacity: Number(form.suggested_capacity),
      });
      setForm(empty); setOpen(false); onCreated?.("Proposition envoyée à l'administrateur.");
    } catch (e) { setError(apiError(e)); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" onClick={() => { setOpen(true); setError(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"><Plus size={15}/> Proposer un cours</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl" aria-label="Proposer un cours">
        <div className="flex items-start justify-between gap-2"><div><h2 className="text-base font-extrabold text-slate-900">Proposer un cours</h2><p className="mt-1 text-xs text-slate-500">La proposition doit être validée par l'admin.</p></div><button type="button" aria-label="Fermer" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
        <label className="block text-xs font-semibold text-slate-600">Nom du cours<input required minLength={4} maxLength={160} value={form.name} onChange={(e) => set("name", e.target.value)} className={`mt-1 ${field}`} placeholder="Ex. Renforcement musculaire"/></label>
        <label className="block text-xs font-semibold text-slate-600">Description<textarea maxLength={3000} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-400" placeholder="Objectifs, déroulement..."/></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-semibold text-slate-600">Durée suggérée (min)<input type="number" min="15" max="240" required value={form.suggested_duration_minutes} onChange={(e) => set("suggested_duration_minutes", e.target.value)} className={`mt-1 ${field}`}/></label><label className="block text-xs font-semibold text-slate-600">Capacité suggérée<input type="number" min="1" max="100" required value={form.suggested_capacity} onChange={(e) => set("suggested_capacity", e.target.value)} className={`mt-1 ${field}`}/></label></div>
        <ErrorBox text={error}/>
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Annuler</button><button disabled={busy} type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Send size={14}/>{busy ? "Envoi..." : "Envoyer"}</button></div>
      </form>
    </div>}
  </>;
}
