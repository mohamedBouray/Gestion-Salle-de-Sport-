
import { useEffect, useState } from "react";

import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  RefreshCw,
} from "lucide-react";

import GymVisitCard from "../../components/Members/account/GymVisitCard";

import {
  memberAccountApi,
  readPage,
} from "../../services/MemberAccountApi";

import { apiError } from "../../services/api";

const counters = [
  ["total_visits", "Total visites", CalendarCheck2],
  ["this_month", "Ce mois", Clock3],
  ["inside_now", "En salle", DoorOpen],
];

export default function AttendancePage() {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState({});

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les pointages personnels
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    memberAccountApi
      .attendance(
        {
          status: status || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          per_page: 12,
        },
        controller.signal
      )
      .then((response) => {
        if (controller.signal.aborted) return;

        const result = readPage(
          response,
          "attendances"
        );

        setVisits(result.items);
        setPagination(result);
        setStats(response.stats || {});

        if (page > result.last_page) {
          setPage(result.last_page);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        setError(apiError(err));
        setVisits([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [status, from, to, page, revision]);

  function refresh() {
    setRevision((value) => value + 1);
  }

  function resetFilters() {
    setStatus("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <main className="min-h-full space-y-4 pb-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Mes présences
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Retrouvez vos entrées et sorties à Bouray Gym.
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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

      {/* Filtres */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrer les présences"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700"
          >
            <option value="">Toutes les visites</option>
            <option value="present">En salle</option>
            <option value="left">Sorties enregistrées</option>
          </select>

          <label className="flex items-center gap-2 text-[11px] text-slate-500">
            Du
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
            />
          </label>

          <label className="flex items-center gap-2 text-[11px] text-slate-500">
            Au
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
            />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      <p className="text-[11px] text-slate-500">
        Les statistiques représentent toutes vos visites.
        Les filtres s'appliquent à l'historique ci-dessous.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Historique des visites */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-slate-900">
            Historique de mes visites
          </h2>

          {!loading && !error && (
            <span className="text-xs text-slate-500">
              {pagination.total} visite(s)
            </span>
          )}
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Chargement de vos présences...
          </p>
        ) : error ? null : visits.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visits.map((visit) => (
              <GymVisitCard
                key={visit.id}
                visit={visit}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CalendarCheck2
              size={27}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-bold text-slate-800">
              Aucune présence trouvée
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Vos entrées et sorties apparaîtront ici
              après leur enregistrement à l'accueil.
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
                disabled={page <= 1}
                onClick={() =>
                  setPage((p) => Math.max(1, p - 1))
                }
                aria-label="Page précédente"
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                disabled={page >= pagination.last_page}
                onClick={() =>
                  setPage((p) =>
                    Math.min(pagination.last_page, p + 1)
                  )
                }
                aria-label="Page suivante"
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
