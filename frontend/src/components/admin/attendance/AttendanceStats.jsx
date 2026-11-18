import { ArrowDownRight, ClipboardCheck, LogOut, UserRoundX } from "lucide-react";

function value(n) {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("fr-MA") : "—";
}

export default function AttendanceStats({ summary, loading }) {
  const members = summary?.members || {};
  const coaches = summary?.coaches || {};
  const present = summary?.present ?? (
    typeof members.present === "number" && typeof coaches.present === "number"
      ? members.present + coaches.present : null
  );
  const left = summary?.left ?? (
    typeof members.left === "number" && typeof coaches.left === "number"
      ? members.left + coaches.left : null
  );
  const visits = summary?.visits ?? (
    typeof members.visits === "number" && typeof coaches.visits === "number"
      ? members.visits + coaches.visits : null
  );
  const cards = [
    { label: "Présents", val: present, icon: ClipboardCheck, tone: "bg-blue-50 text-blue-600" },
    { label: "Sorties", val: left, icon: LogOut, tone: "bg-slate-100 text-slate-600" },
    { label: "Pointages", val: visits, icon: ArrowDownRight, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Coachs absents", val: coaches.absent, icon: UserRoundX, tone: "bg-rose-50 text-rose-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Statistiques des présences">
      {cards.map(({ label, val, icon: Icon, tone }) => (
        <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            <Icon size={19} strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {loading ? <span className="inline-block h-5 w-9 animate-pulse rounded bg-slate-100" /> : value(val)}
            </p>
            <p className="text-[11px] font-medium text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
