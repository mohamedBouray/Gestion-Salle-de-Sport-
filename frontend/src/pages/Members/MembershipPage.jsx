
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

import MembershipCard from "../../components/Members/account/MembershipCard";
import {
  memberAccountApi,
  readPage,
} from "../../services/MemberAccountApi";
import { apiError } from "../../services/api";

const counters = [
  ["total", "Total abonnements", CreditCard],
  ["active", "Actifs", ShieldCheck],
  ["pending", "En attente", Clock3],
  ["expired", "Expirés", ShieldX],
];

export default function MembershipPage() {
  const [memberships, setMemberships] = useState([]);
  const [active, setActive] = useState([]);
  const [stats, setStats] = useState({});

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    memberAccountApi
      .memberships(
        {
          status: status || undefined,
          page,
          per_page: 9,
        },
        controller.signal
      )
      .then((response) => {
        if (controller.signal.aborted) return;

        const result = readPage(
          response,
          "memberships"
        );

        setMemberships(result.items);
        setPagination(result);
        setStats(response.stats || {});

        setActive(
          Array.isArray(response.active)
            ? response.active
            : []
        );

        if (page > result.last_page) {
          setPage(result.last_page);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(apiError(err));
        setMemberships([]);
        setActive([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [status, page, revision]);

  function refresh() {
    setRevision((value) => value + 1);
  }

  return (
    <main className="min-h-full space-y-4 pb-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Mon abonnement
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Consultez vos formules et leurs périodes de validité.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
          Actualiser
        </button>
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counters.map(([key, label, Icon]) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={17} />
            </span>

            <div>
              <p className="text-lg font-extrabold text-slate-900">
                {loading ? "—" : stats[key] ?? 0}
              </p>

              <p className="text-[11px] text-slate-500">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Abonnements actuellement valides */}
      {!loading && !error && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={17}
              className="text-blue-600"
            />

            <h2 className="text-sm font-extrabold text-slate-900">
              Mes abonnements en cours
            </h2>
          </div>

          {active.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {active.map((item) => (
                <MembershipCard
                  key={item.id}
                  membership={item}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">
                Aucun abonnement actif actuellement
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Si vous avez déjà demandé un abonnement,
                consultez son statut ci-dessous ou contactez
                l'administration de la salle.
              </p>
            </div>
          )}

          <Link
            to="/member/classes"
            className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
          >
            Explorer les cours
          </Link>
        </section>
      )}

      {/* Historique */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-slate-900">
            Tous mes abonnements
          </h2>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrer les abonnements"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="expired">Expirés</option>
            <option value="cancelled">Annulés</option>
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Chargement des abonnements...
          </p>
        ) : error ? null : memberships.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {memberships.map((item) => (
              <MembershipCard
                key={item.id}
                membership={item}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CreditCard
              size={26}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Aucun abonnement trouvé
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Vos abonnements apparaîtront ici après
              attribution par l'administration.
            </p>
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading &&
        !error &&
        pagination.last_page > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-xs text-slate-500">
              Page {pagination.current_page} /{" "}
              {pagination.last_page}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Page précédente"
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                aria-label="Page suivante"
                disabled={page >= pagination.last_page}
                onClick={() =>
                  setPage((p) =>
                    Math.min(pagination.last_page, p + 1)
                  )
                }
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
    </main>
  );
}
