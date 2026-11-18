import { ArrowRight, Clock3, Eye, LogOut, UserRoundCheck } from "lucide-react";
import { displayTime, getPerson, STATUS_META } from "./attendanceUtils";

export default function CoachAttendanceCards({ records, loading, onView, onAction }) {
  if (loading && !records.length) return <div className="py-16 text-center text-sm text-slate-400">Chargement des présences...</div>;
  if (!records.length) return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-14 text-center text-sm text-slate-500">Aucun pointage coach pour ces filtres.</div>;
  return (
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {records.map((row) => {
        const person = getPerson(row);
        const meta = STATUS_META[row.status] || { label: "Inconnu", className: "bg-slate-100 text-slate-600 ring-slate-200" };
        return (
          <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md motion-reduce:transform-none">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UserRoundCheck size={19}/></div>
                <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-slate-900" title={person.name}>{person.name}</h3><p className="truncate text-xs text-slate-400" title={person.email}>{person.email || "Coach"}</p></div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.className}`}>{meta.label}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
              <div><p className="text-[10px] font-medium text-slate-400">Arrivée</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-700"><Clock3 size={13}/>{displayTime(row.check_in_at)}</p></div>
              <div><p className="text-[10px] font-medium text-slate-400">Départ</p><p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-slate-700"><ArrowRight size={13}/>{displayTime(row.check_out_at)}</p></div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => onView(row)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Eye size={15}/> Détails</button>
              {row.status === "present" && row.id && <button type="button" onClick={() => onAction(row, "check-out")} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><LogOut size={15}/> Départ</button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
