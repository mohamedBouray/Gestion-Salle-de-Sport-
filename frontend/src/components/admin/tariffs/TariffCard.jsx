
import {
  Clock3,
  Dumbbell,
  Pencil,
  Power,
  ShieldCheck,
} from "lucide-react";

const money = (value) =>
  `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;

const units = {
  day: "jour(s)",
  month: "mois",
  year: "an(s)",
};

export default function TariffCard({
  plan,
  onEdit,
  onToggle,
  busy = false,
}) {
  const active = plan.status === "active";
  const isCourse = plan.type === "course";

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {isCourse ? (
              <Dumbbell size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {plan.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isCourse ? "Abonnement cours" : "Accès général"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
            active
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {active ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="flex items-end gap-1">
          <span className="text-xl font-extrabold text-slate-900">
            {money(plan.price)}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 size={13} />
          {plan.duration_value}{" "}
          {units[plan.duration_unit] || plan.duration_unit}
        </p>
      </div>

      {isCourse && (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <Dumbbell size={14} className="text-blue-500" />
          <span className="truncate">
            {plan.course?.name || "Cours spécifique"}
          </span>
        </p>
      )}

      <p className="mt-3 min-h-10 text-xs leading-5 text-slate-500">
        {plan.description || "Aucune description."}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          disabled={busy}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Pencil size={13} />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onToggle(plan)}
          disabled={busy}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ${
            active
              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <Power size={13} />
          {active ? "Désactiver" : "Activer"}
        </button>
      </div>
    </article>
  );
}
