import {
  Banknote,
  CalendarDays,
  CreditCard,
  FileText,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { formatMoney } from "../../../services/MemberPaymentsApi";

const STATUS = {
  paid: {
    label: "Payé",
    className: "bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700",
  },
  refunded: {
    label: "Remboursé",
    className: "bg-rose-50 text-rose-700",
  },
  simulated: {
    label: "Simulation DEMO",
    className: "bg-violet-50 text-violet-700",
  },
};

const METHODS = {
  cash: "Espèces",
  virement: "Virement",
  other: "Autre",
  demo: "Carte simulée — DEMO",
};

const TYPES = {
  subscription: "Abonnement",
  course: "Cours sportif",
};

function displayDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(date);
}

function paymentTitle(payment) {
  if (payment.type === "subscription") {
    return (
      payment.subscription?.plan?.name ||
      "Paiement d'abonnement"
    );
  }

  if (payment.type === "course") {
    return (
      payment.enrollment?.session?.course?.name ||
      "Réservation de cours"
    );
  }

  return "Paiement";
}

export default function PaymentCard({ payment }) {
  const status = STATUS[payment.status] || {
    label: payment.status || "—",
    className: "bg-slate-100 text-slate-600",
  };

  const isPending = payment.status === "pending";
  const isDemo = payment.method === "demo" || payment.status === "simulated";

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ReceiptText size={19} />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-slate-900">
              {paymentTitle(payment)}
            </h3>

            <p className="mt-1 text-[11px] text-slate-500">
              Paiement #{payment.id}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {isDemo && <p className="mt-3 rounded-lg bg-violet-50 p-2.5 text-[11px] font-semibold text-violet-800">Simulation pédagogique : aucune transaction bancaire ni recette réelle.</p>}
      {/* Montant */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <p className="text-[11px] text-slate-500">
          {isPending ? "Montant en attente" : "Montant"}
        </p>

        <p className="mt-1 text-xl font-extrabold text-slate-900">
          {formatMoney(payment.amount)}
        </p>
      </div>

      {/* Détails */}
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-slate-500">
            <CreditCard size={14} className="text-blue-500" />
            Type
          </span>

          <span className="font-semibold text-slate-800">
            {TYPES[payment.type] || "Autre"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-slate-500">
            <Wallet size={14} className="text-blue-500" />
            Méthode
          </span>

          <span className="font-semibold text-slate-800">
            {METHODS[payment.method] || payment.method || "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-slate-500">
            <CalendarDays size={14} className="text-blue-500" />
            {isPending ? "Enregistré le" : "Date de paiement"}
          </span>

          <span className="text-right font-semibold text-slate-800">
            {displayDate(
              isPending
                ? payment.created_at
                : payment.paid_at
            )}
          </span>
        </div>

        {payment.reference && (
          <div className="flex items-start justify-between gap-2 text-xs">
            <span className="flex shrink-0 items-center gap-2 text-slate-500">
              <FileText size={14} className="text-blue-500" />
              Référence
            </span>

            <span className="break-all text-right font-semibold text-slate-800">
              {payment.reference}
            </span>
          </div>
        )}
      </div>

      {/* Notes facultatives */}
      {payment.notes && (
        <details className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <summary className="cursor-pointer text-[11px] font-bold text-slate-600">
            Voir les notes
          </summary>

          <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
            {payment.notes}
          </p>
        </details>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <Banknote size={14} className="text-blue-500" />

          {payment.status === "paid"
            ? "Règlement enregistré"
            : payment.status === "refunded"
              ? "Remboursement déclaré par l'administration"
              : "Règlement en attente de confirmation"}
        </div>
      </div>
    </article>
  );
}
