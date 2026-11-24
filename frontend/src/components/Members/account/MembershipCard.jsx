import {
  CalendarDays,
  CreditCard,
  ShieldCheck,
  Tag,
} from "lucide-react";

const statuses = {
  active: [
    "Actif",
    "bg-emerald-50 text-emerald-700",
  ],
  pending: [
    "En attente",
    "bg-amber-50 text-amber-700",
  ],
  expired: [
    "Expiré",
    "bg-slate-100 text-slate-600",
  ],
  cancelled: [
    "Annulé",
    "bg-rose-50 text-rose-700",
  ],
};

function displayDate(value) {
  if (!value) return "—";

  const day = String(value).slice(0, 10);
  const date = new Date(`${day}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function money(value) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;
}

export default function MembershipCard({ membership, onCheckout }) {
  const status =
    membership.effective_status ||
    membership.status;

  const [label, color] = statuses[status] || [
    status || "—",
    "bg-slate-100 text-slate-600",
  ];

  const plan = membership.plan || {};
  const hasAccess = membership.access_now === true;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <CreditCard size={19} />
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${color}`}
        >
          {label}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-extrabold text-slate-900">
        {plan.name || "Formule d'abonnement"}
      </h3>

      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Tag size={13} />

        {plan.type === "course"
          ? "Abonnement cours"
          : plan.type === "general"
            ? "Accès général"
            : "Autre formule"}
      </p>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <p className="text-[11px] text-slate-500">
          Prix à la souscription
        </p>

        <p className="mt-1 text-lg font-extrabold text-slate-900">
          {money(membership.price_at_purchase)}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[11px] text-slate-500">
            Début
          </p>

          <p className="mt-1 flex items-center gap-1 font-semibold text-slate-700">
            <CalendarDays
              size={13}
              className="text-blue-500"
            />
            {displayDate(membership.starts_at)}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">
            Expiration
          </p>

          <p className="mt-1 flex items-center gap-1 font-semibold text-slate-700">
            <CalendarDays
              size={13}
              className="text-blue-500"
            />
            {displayDate(membership.ends_at)}
          </p>
        </div>
      </div>

      {membership.remaining_amount != null && <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="text-slate-500">Reste à simuler</span>
        <strong className="text-slate-900">{money(membership.remaining_amount)}</strong>
      </div>}
      {Number(membership.price_at_purchase) > 0 && status === "pending" && Number(membership.remaining_amount) > 0 && onCheckout && <button
        type="button" onClick={() => onCheckout(membership)}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
        Simuler le règlement
      </button>}
      <div className="mt-auto pt-4">
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold ${
            hasAccess
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <ShieldCheck size={15} />

          {hasAccess
            ? "Accès actif aujourd'hui"
            : "Accès non actif aujourd'hui"}
        </div>
      </div>
    </article>
  );
}