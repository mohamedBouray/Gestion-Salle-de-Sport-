import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock3,
  CircleOff,
} from "lucide-react";

import MembershipCard from "../../components/admin/memberships/MembershipCard";
import MembershipForm from "../../components/admin/memberships/MembershipForm";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { membershipsApi } from "../../services/MembershipsApi";
import { apiError } from "../../services/api";

const counters = [
  ["total", "Total", CreditCard],
  ["active", "Actifs", ShieldCheck],
  ["pending", "En attente", Clock3],
  ["expired", "Expirés", CircleOff],
];

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [stats, setStats] = useState({});
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [planId, setPlanId] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationError, setConfirmationError] = useState("");

  // Charger les formules
  useEffect(() => {
    const controller = new AbortController();

    membershipsApi.options("", controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPlans(
            Array.isArray(result.plans) ? result.plans : []
          );
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [revision]);

  // Recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Charger abonnements
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    membershipsApi.list(
      {
        search: query || undefined,
        status: status || undefined,
        plan_id: planId || undefined,
        page,
        per_page: 9,
      },
      controller.signal
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        const collection = response.memberships || {};

        setMemberships(
          Array.isArray(collection.data)
            ? collection.data
            : []
        );

        setPagination(collection);
        setStats(response.stats || {});

        if (
          Number(collection.last_page) > 0 &&
          page > collection.last_page
        ) {
          setPage(collection.last_page);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(apiError(err));
          setMemberships([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query, status, planId, page, revision]);

  function refresh(message = "") {
    setNotice(message);
    setRevision((value) => value + 1);
  }

  // Créer un abonnement
  async function create(payload) {
    const result = await membershipsApi.create(payload);

    setFormOpen(false);

    refresh(
      result.message || "Abonnement créé en attente."
    );
  }

  function askAction(item, type) {
    if (busyId !== null) return;
    if (type === "activate" && item.payment_eligible !== true) {
      setError("Activation refusée : règlement confirmé requis."); return;
    }
    setConfirmation({ item, type }); setConfirmationError("");
  }

  async function performAction() {
    if (!confirmation || busyId !== null) return;
    const { item, type } = confirmation;
    if (type === "activate" && item.payment_eligible !== true) {
      setConfirmationError("Règlement confirmé requis."); return;
    }
    setBusyId(item.id); setConfirmationError(""); setError(""); setNotice("");
    try {
      const result = await membershipsApi[type](item.id);
      setConfirmation(null);
      refresh(result.message || "Opération enregistrée.");
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
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Gestion des abonnements
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Attribution, activation, renouvellement et suivi
              des membres.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => refresh()}
              aria-label="Actualiser"
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              Nouvel abonnement
            </button>
          </div>
        </header>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {counters.map(([key, label, Icon]) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={17} />
              </span>

              <div>
                <p className="text-lg font-extrabold">
                  {loading ? "—" : stats[key] ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <strong>Activation sécurisée :</strong> un abonnement en attente ne doit être activé qu'après confirmation du règlement. Les soldes et le droit d'activation seront calculés par Laravel dans la prochaine étape.
        </div>
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <label className="relative min-w-[170px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Membre ou formule..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </label>

          <select
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setPage(1);
            }}
            aria-label="Filtre formule"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
          >
            <option value="">Toutes les formules</option>

            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filtre statut"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="expired">Expirés</option>
            <option value="cancelled">Annulés</option>
          </select>
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
            Chargement des abonnements...
          </div>
        ) : error ? null : memberships.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {memberships.map((item) => (
              <MembershipCard
                key={item.id}
                item={item}
                busy={busyId !== null}
                onActivate={(m) => askAction(m, "activate")}
                onRenew={(m) => askAction(m, "renew")}
                onCancel={(m) => askAction(m, "cancel")}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            Aucun abonnement trouvé.
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
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage <= 1}
                aria-label="Page précédente"
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(lastPage, p + 1))
                }
                disabled={currentPage >= lastPage}
                aria-label="Page suivante"
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={Boolean(confirmation)}
        title={{ activate: "Activer cet abonnement ?", renew: "Renouveler cet abonnement ?", cancel: "Annuler cet abonnement ?" }[confirmation?.type] || "Confirmer l'action ?"}
        description={{ activate: "L'activation nécessite un règlement préalablement confirmé par Laravel.", renew: "Un nouvel abonnement en attente sera créé.", cancel: "L'abonnement sera annulé, sans remboursement automatique." }[confirmation?.type] || ""}
        subject={confirmation?.item ? `${confirmation.item.member?.name || "Membre"} · ${confirmation.item.plan?.name || "Abonnement"}` : ""}
        variant={confirmation?.type === "cancel" ? "danger" : "primary"}
        confirmLabel={{ activate: "Activer", renew: "Renouveler", cancel: "Annuler l'abonnement" }[confirmation?.type] || "Confirmer"}
        loading={busyId !== null} error={confirmationError}
        onCancel={() => { if (busyId === null) setConfirmation(null); }} onConfirm={performAction}/>
      {/* Formulaire */}
      {formOpen && (
        <MembershipForm
          onClose={() => setFormOpen(false)}
          onSave={create}
        />
      )}
    </main>
  );
}