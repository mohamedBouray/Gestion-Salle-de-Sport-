import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
import { apiError } from "../../services/api";
import { coachCoursesPlanningApi } from "../../services/CoachCoursesPlanningApi";
import { ErrorBox, Notice } from "./CoachUI";

const week = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const input = "h-8 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-blue-400 focus:outline-none";
const toSlots = (items) => (items || []).filter(s => s.is_active).map(s => ({ day_of_week: Number(s.day_of_week), start_time: String(s.start_time).slice(0,5), end_time: String(s.end_time).slice(0,5) })).sort((a,b) => a.day_of_week-b.day_of_week || a.start_time.localeCompare(b.start_time));

export default function AvailabilityEditor({ value, loading, onSaved }) {
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { setSlots(toSlots(value)); setError(""); setNotice(""); }, [value]);
  function update(index, field, next) { setSlots(s => s.map((item,i) => i===index ? {...item, [field]: field==='day_of_week' ? Number(next) : next} : item)); setNotice(""); }
  function add() { if (slots.length<28) setSlots(s=>[...s,{ day_of_week: 1, start_time: "09:00", end_time: "12:00" }]); }
  async function save() {
    setError(""); setNotice("");
    if (slots.some(s => !s.start_time || !s.end_time || s.start_time>=s.end_time)) { setError("Vérifiez les horaires : fin après début."); return; }
    setSaving(true);
    try {
      const result = await coachCoursesPlanningApi.saveAvailabilities(slots);
      setSlots(toSlots(result.availabilities)); setNotice(result.message || "Disponibilités sauvegardées."); onSaved?.();
    } catch (e) { setError(apiError(e)); }
    finally { setSaving(false); }
  }
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-2"><p className="text-xs leading-5 text-slate-500">Définissez les créneaux chaque semaine.</p><button disabled={saving || loading || slots.length>=28} type="button" onClick={add} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50"><Plus size={13}/> Ajouter</button></div>
    {loading ? <p className="text-xs text-slate-400">Chargement...</p> : slots.length ? <div className="space-y-2">{slots.map((slot,index) => <div key={index} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 p-2">
      <select aria-label="Jour" value={slot.day_of_week} onChange={(e)=>update(index,"day_of_week",e.target.value)} className={`max-w-full flex-1 ${input}`}>{week.map((day,n)=><option key={n} value={n}>{day}</option>)}</select>
      <input aria-label="Début" type="time" value={slot.start_time} onChange={(e)=>update(index,"start_time",e.target.value)} className={input}/><span className="text-xs text-slate-400">–</span><input aria-label="Fin" type="time" value={slot.end_time} onChange={(e)=>update(index,"end_time",e.target.value)} className={input}/>
      <button type="button" aria-label="Supprimer ce créneau" onClick={()=>setSlots(s=>s.filter((_,i)=>i!==index))} className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 size={15}/></button>
    </div>)}</div> : <p className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-400">Aucun créneau. Cliquez sur Ajouter.</p>}
    <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-2.5 text-[11px] leading-4 text-blue-800"><AlertTriangle size={14} className="shrink-0"/>Impossible de supprimer une disponibilité utilisée par une séance future. Les modifications prennent effet après sauvegarde.</div>
    <ErrorBox text={error}/><Notice text={notice}/>
    <button type="button" onClick={save} disabled={saving || loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Save size={14}/>{saving ? "Enregistrement..." : "Enregistrer mes disponibilités"}</button>
  </div>;
}
