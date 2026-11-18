import { useEffect } from "react";
import { CalendarDays, Clock3, FileText, LogOut, UserRound, X } from "lucide-react";
import { displayTime, getPerson, STATUS_META } from "./attendanceUtils";

export default function AttendanceDetails({ role, record, onClose, onAction }) {
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  if (!record) return null;
  const person = getPerson(record);
  const meta = STATUS_META[record.status] || { label: "Inconnu", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  const fields = [
    ["Jour", record.date || "—", CalendarDays],
    ["Entrée", displayTime(record.check_in_at), Clock3],
    ["Sortie", displayTime(record.check_out_at), LogOut],
  ];
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="attendance-details-title" className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="attendance-details-title" className="text-base font-extrabold text-slate-900">Détails du pointage</h2><p className="text-xs text-slate-500">{role === "members" ? "Membre" : "Coach"}</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={19}/></button></header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><UserRound size={21}/></div><div className="min-w-0"><h3 className="truncate text-base font-extrabold text-slate-900">{person.name}</h3><p className="truncate text-xs text-slate-500">{person.email}</p></div></div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${meta.className}`}>{meta.label}</span>
          <div className="space-y-2">{fields.map(([label, val, Icon]) => <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"><span className="flex items-center gap-2 text-xs text-slate-500"><Icon size={15}/>{label}</span><span className="text-xs font-bold text-slate-800">{val}</span></div>)}</div>
          {record.note && <div className="rounded-xl border border-slate-100 p-3"><p className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-700"><FileText size={15}/> Observation</p><p className="whitespace-pre-wrap break-words text-xs text-slate-500">{record.note}</p></div>}
        </div>
        <div className="border-t border-slate-100 p-4">
          {record.status === "present" && <button type="button" onClick={() => onAction(record, "check-out")} className="mb-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"><LogOut size={16}/> Enregistrer sortie</button>}
          <button type="button" onClick={onClose} className="h-10 w-full rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Fermer</button>
        </div>
      </aside>
    </div>
  );
}
