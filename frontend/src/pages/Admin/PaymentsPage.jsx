import FrenchDateInput from "../../components/shared/FrenchDateInput";
import { useEffect, useState } from "react";

import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";

import PaymentCard from "../../components/admin/payments/PaymentCard";
import PaymentForm from "../../components/admin/payments/PaymentForm";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

import { paymentsApi } from "../../services/PaymentsApi";
import { apiError } from "../../services/api";

const counters = [
  ["total", "Total paiements", CreditCard],
  ["simulated", "Simulés", Wallet],
  ["refunded", "Remboursés", RotateCcw],
  ["demo_amount", "Montant simulé", Banknote],
];

const money = (value) =>
  `${new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)} MAD`;

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationError, setConfirmationError] = useState("");

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Charger les paiements
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    paymentsApi
      .list(
        {
          search: query || undefined,
          status: status || undefined,
          method: method || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          per_page: 9,
        },
        controller.signal
      )
      .then((result) => {
        if (controller.signal.aborted) return;

        const collection = result.payments || {};

        setPayments(
          Array.isArray(collection.data)
            ? collection.data
            : []
        );

        setPagination(collection);
        setStats(result.stats || {});

        if (
          Number(collection.last_page) > 0 &&
          page > Number(collection.last_page)
        ) {
          setPage(Number(collection.last_page));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(apiError(err));
        setPayments([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query, status, method, from, to, page, revision]);

  function refresh(message = "") {
    setNotice(message);
    setRevision((value) => value + 1);
  }

  // Créer un paiement
  async function createPayment(payload) {
    const result = await paymentsApi.create(payload);

    setFormOpen(false);
    setPage(1);

    refresh(
      result.message || "Paiement enregistré avec succès."
    );
  }

  function askAction(payment, type) { setConfirmation({ payment, type }); setConfirmationError(""); }

  async function runConfirmedAction() {
    if (!confirmation || busyId !== null) return;
    const { payment, type } = confirmation;
    setBusyId(payment.id); setError(""); setConfirmationError("");
    try {
      const result = type === "reject" ? await paymentsApi.rejectCash(payment.id) : await paymentsApi.refund(payment.id);
      setConfirmation(null);
      refresh(result.message || (type === "reject" ? "Demande clôturée." : "Remboursement enregistré."));
    } catch (err) { setConfirmationError(apiError(err)); }
    finally { setBusyId(null); }
  }

  const currentPage =
    Number(pagination.current_page) || page;

  const lastPage = Math.max(
    1,
    Number(pagination.last_page) || 1
  );

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Gestion des paiements
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Suivi des règlements et remboursements.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              aria-label="Actualiser"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              Nouveau paiement
            </button>
          </div>
        </header>

        {/* Statistiques compactes */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {counters.map(([key, label, Icon]) => (
            <div
              key={key}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={17} />
              </span>

              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-900">
                  {loading
                    ? "—"
                    : key === "collected_amount"
                      ? money(stats[key])
                      : stats[key] ?? 0}
                </p>

                <p className="text-[11px] text-slate-500">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-900">
          <strong>Paiements simulés</strong> · Les données d’encaissement antérieures sont conservées dans l’historique.
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["cash_collected_amount", "Espèces historiques", true],
            ["pending_cash", "Anciennes demandes ouvertes", false],
            ["demo_amount", "Total simulé", true],
          ].map(([key, label, currency]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="mt-1 text-base font-extrabold text-slate-900">{stats[key] == null ? "—" : currency ? money(stats[key]) : stats[key]}</p>
            {stats[key] == null && <p className="mt-1 text-[10px] text-slate-400">Donnée indisponible</p>}
          </div>)}
        </div>
        {/* Recherche et filtres */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            <label className="relative min-w-[180px] flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Membre, formule, référence..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
              />
            </label>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filtrer par statut"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
            >
              <option value="">Tous les statuts</option>
              <option value="paid">Payés</option>
              <option value="pending">En attente</option>
              <option value="refunded">Remboursés</option>
              <option value="simulated">Simulés (DEMO)</option>
            </select>

            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              aria-label="Filtrer par mode"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
            >
              <option value="">Tous les modes</option>
              <option value="cash">Espèces</option>
              <option value="virement">Virement</option>
              <option value="other">Autre</option>
              <option value="demo">Simulation DEMO</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-slate-500">
              Du
              <FrenchDateInput
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
              />
            </label>

            <label className="flex items-center gap-2 text-[11px] text-slate-500">
              Au
              <FrenchDateInput
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setQuery("");
                setStatus("");
                setMethod("");
                setFrom("");
                setTo("");
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Messages */}
        {notice && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700"
          >
            {notice}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </p>
        )}

        {/* Cards */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Chargement des paiements...
          </div>
        ) : error ? null : payments.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                busy={busyId !== null}
                onRefund={(payment) => askAction(payment, "refund")}
                onRejectCash={(payment) => askAction(payment, "reject")}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Aucun paiement trouvé.
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && lastPage > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-xs text-slate-500">
              Page {currentPage} / {lastPage}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                aria-label="Page précédente"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() =>
                  setPage((p) => Math.min(lastPage, p + 1))
                }
                aria-label="Page suivante"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={Boolean(confirmation)} title={confirmation?.type === "reject" ? "Clôturer cette ancienne demande ?" : "Simuler un remboursement ?"}
        description={confirmation?.type === "reject" ? "Cette demande sera clôturée sans encaissement." : "Le montant simulé sera retiré du total réglé."}
        subject={confirmation ? `${confirmation.payment.member?.name || "Membre"} · ${money(confirmation.payment.amount)}` : ""}
        variant={confirmation?.type === "reject" ? "success" : "danger"}
        confirmLabel={confirmation?.type === "reject" ? "Clôturer" : "Simuler le remboursement"}
        loading={busyId !== null} error={confirmationError} onCancel={() => { if (busyId === null) setConfirmation(null); }} onConfirm={runConfirmedAction}/>
      {/* Formulaire */}
      {formOpen && (
        <PaymentForm
          onClose={() => setFormOpen(false)}
          onSave={createPayment}
        />
      )}
    </main>
  );
}