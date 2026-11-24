import {
  Banknote,
  CalendarDays,
  CreditCard,
  FileText,
  RotateCcw,
} from "lucide-react";

const statuses = {
  pending: ["En attente", "bg-amber-50 text-amber-700"],
  paid: ["Payé", "bg-emerald-50 text-emerald-700"],
  refunded: ["Remboursé", "bg-rose-50 text-rose-700"],
  simulated: ["Simulation DEMO", "bg-violet-50 text-violet-700"],
};

const methods = {
  cash: "Espèces",
  virement: "Virement",
  other: "Autre",
  demo: "Carte simulée — DEMO",
};

const money = (value) =>
  `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;

function dateLabel(value) {
  if (!value) return "Non renseignée";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export default function PaymentCard({
  payment,
  busy = false,
  onRefund,
  onRejectCash,
}) {
  const [statusLabel, statusClass] =
    statuses[payment.status] || [
      payment.status || "—",
      "bg-slate-100 text-slate-600",
    ];

  const planName =
    payment.subscription?.plan?.name ||
    payment.plan?.name ||
    "Abonnement";

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CreditCard size={17} />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">
              {payment.member?.name || "Membre"}
            </h3>

            <p className="truncate text-[11px] text-slate-500">
              {payment.member?.email || "—"}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">
            Montant
          </p>

          <p className="mt-1 text-lg font-extrabold text-slate-900">
            {money(payment.amount)}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
          <Banknote size={14} />
          {methods[payment.method] || payment.method}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-600">
        <p className="flex items-center gap-2">
          <CreditCard
            size={14}
            className="shrink-0 text-blue-500"
          />
          <span className="truncate">{planName}</span>
        </p>

        <p className="flex items-center gap-2">
          <CalendarDays
            size={14}
            className="shrink-0 text-blue-500"
          />
          {dateLabel(payment.paid_at)}
        </p>

        {payment.reference && (
          <p className="flex items-center gap-2">
            <FileText
              size={14}
              className="shrink-0 text-blue-500"
            />
            <span className="truncate">
              Réf : {payment.reference}
            </span>
          </p>
        )}
      </div>

      {payment.notes && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-600">
          {payment.notes}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span>Paiement #{payment.id}</span>

        {payment.method === "cash" && payment.status === "pending" && onRejectCash && (
          <button type="button" disabled={busy} onClick={() => onRejectCash(payment)}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Banknote size={13}/> Clôturer la demande
          </button>
        )}
        {payment.status === "simulated" && payment.method === "demo" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onRefund(payment)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 px-3 font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Simuler le remboursement
          </button>
        )}
      </div>
    </article>
  );
}