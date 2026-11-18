import { useEffect, useState } from "react";
import { AlertCircle, CalendarCheck2, Check, LoaderCircle, Search, UserRound, X } from "lucide-react";
import { dateKey, getPerson, getPeople, localDateTime } from "./attendanceUtils";

const INPUT = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export default function AttendanceForm({ role, mode, record, date, busy, error, onClose, onSubmit, onSearchPeople }) {
  const initialDate = date || dateKey();
  const isCheckout = mode === "check-out";
  const isAbsent = mode === "absent";
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    const current = dateKey(now) === initialDate;
    return current ? localDateTime(now) : `${initialDate}T09:00`;
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isCheckout || selected) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoadingPeople(true);
      setPeopleError("");
      try {
        const result = await onSearchPeople(role, search.trim());
        if (active) setPeople(getPeople(result, role));
      } catch (err) {
        if (active) { setPeople([]); setPeopleError(err.message || "Liste indisponible."); }
      } finally {
        if (active) setLoadingPeople(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [role, isCheckout, selected, search, onSearchPeople]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !busy) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const person = record ? getPerson(record) : selected;
  const label = role === "members" ? "membre" : "coach";
  const title = isCheckout ? "Enregistrer la sortie" : isAbsent ? "Signaler une absence" : "Enregistrer une entrée";

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!isCheckout && !person?.id) return;
    const payload = { role, mode, attendance_id: record?.id, person_id: person?.id,
      date: initialDate, occurred_at: isAbsent ? null : new Date(occurredAt).toISOString(), note: note.trim() };
    await onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="attendance-form-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><CalendarCheck2 size={20}/></div>
            <div><h2 id="attendance-form-title" className="text-base font-extrabold text-slate-900">{title}</h2><p className="text-xs text-slate-500">{role === "members" ? "Présence membre" : "Présence coach"} · {initialDate}</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={19}/></button>
        </header>
        <form onSubmit={submit} className="space-y-4 p-5">
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={16} className="shrink-0"/>{error}</p>}
          {!isCheckout && !selected && (
            <div>
              <label htmlFor="attendance-person-search" className="mb-1.5 block text-xs font-bold text-slate-700">Choisir un {label} *</label>
              <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                <input id="attendance-person-search" value={search} onChange={(e) => setSearch(e.target.value)} className={`${INPUT} pl-9`} placeholder="Nom ou email..." autoComplete="off" />
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                {loadingPeople ? <p className="p-3 text-xs text-slate-500">Recherche...</p> : peopleError ? <p className="p-3 text-xs text-rose-600">{peopleError}</p> : people.length ? people.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-blue-50 last:border-0"><UserRound size={16} className="shrink-0 text-blue-600"/><span className="min-w-0"><span className="block truncate font-bold text-slate-800">{item.name}</span><span className="block truncate text-slate-500">{item.email}</span></span></button>) : <p className="p-3 text-xs text-slate-500">Aucun profil trouvé.</p>}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Recherche limitée aux profils actifs. Le serveur bloque les doublons.</p>
            </div>
          )}
          {person && <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-bold text-blue-900">{person.name}</p><p className="truncate text-xs text-blue-700">{person.email || label}</p></div>{!isCheckout && <button type="button" onClick={() => setSelected(null)} className="ml-3 text-xs font-bold text-blue-700">Changer</button>}</div>}
          {!isAbsent && <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Date et heure *</span><input type="datetime-local" className={INPUT} value={occurredAt} max={localDateTime()} required onChange={(e) => setOccurredAt(e.target.value)} /></label>}
          <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Note (facultatif)</span><textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observation..." className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
            <button type="submit" disabled={busy || (!isCheckout && !person?.id) || (!isAbsent && !occurredAt)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Check size={16}/>} Confirmer</button>
          </div>
        </form>
      </section>
    </div>
  );
}
