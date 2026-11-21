
import {
  CalendarDays,
  Check,
  RefreshCw,
  Ban,
  UserRound,
} from "lucide-react";

const labels = {
  active: ["Actif", "bg-emerald-50 text-emerald-700"],
  pending: ["En attente", "bg-amber-50 text-amber-700"],
  expired: ["Expiré", "bg-slate-100 text-slate-600"],
  cancelled: ["Annulé", "bg-rose-50 text-rose-700"],
};

function displayDate(value) {
  if (!value) return "—";

  const date = new Date(
    `${String(value).slice(0, 10)}T12:00:00`
  );

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function money(value) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;
}

export default function MembershipCard({
  item,
  busy = false,
  onActivate,
  onRenew,
  onCancel,
}) {
  const actual = item.effective_status || item.status;

  const [statusLabel, statusClass] = labels[actual] || [
    actual || "—",
    "bg-slate-100 text-slate-600",
  ];

  const raw = item.status;

  const canActivate =
    raw === "pending" && actual !== "expired";

  const canCancel =
    (raw === "pending" || raw === "active") &&
    actual !== "expired";

  const canRenew = [
    "active",
    "expired",
    "cancelled",
  ].includes(actual);

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <UserRound size={17} />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {item.member?.name || "Membre"}
            </h3>
            <p className="truncate text-[11px] text-slate-500">
              {item.member?.email || "—"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <p className="truncate text-xs font-bold text-slate-800">
          {item.plan?.name || "Formule supprimée"}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">
            Prix à la souscription
          </span>
          <span className="text-xs font-extrabold text-slate-900">
            {money(item.price_at_purchase)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
        <p className="flex items-center gap-1">
          <CalendarDays size={13} className="text-blue-500" />
          Début : {displayDate(item.starts_at)}
        </p>

        <p className="flex items-center gap-1">
          <CalendarDays size={13} className="text-blue-500" />
          Fin : {displayDate(item.ends_at)}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {canActivate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onActivate(item)}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-3 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Check size={13} />
            Activer
          </button>
        )}

        {canRenew && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRenew(item)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw size={13} />
            Renouveler
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onCancel(item)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Ban size={13} />
            Annuler
          </button>
        )}
      </div>
    </article>
  );
}
