
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import TariffCard from "../../components/admin/tariffs/TariffCard";
import TariffForm from "../../components/admin/tariffs/TariffForm";

import { tariffsApi } from "../../services/TariffsApi";
import { coursesApi } from "../../services/CoursesApi";
import { apiError } from "../../services/api";

const statsConfig = [
  { key: "total", label: "Total formules", icon: CreditCard },
  { key: "active", label: "Formules actives", icon: ShieldCheck },
  { key: "inactive", label: "Inactives", icon: CircleOff },
];

export default function TariffsPage() {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});

  const [courses, setCourses] = useState([]);
  const [coursesError, setCoursesError] = useState("");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  // undefined = fermé, null = création, object = modification
  const [editing, setEditing] = useState(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Charger les formules
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    tariffsApi
      .list({
        search: query || undefined,
        type: type || undefined,
        status: status || undefined,
        page,
        per_page: 9,
      })
      .then((result) => {
        if (!active) return;

        const collection = result.plans || {};

        setPlans(
          Array.isArray(collection)
            ? collection
            : collection.data || []
        );

        setPagination(
          Array.isArray(collection) ? {} : collection
        );

        setStats(result.stats || {});

        if (
          collection.last_page &&
          page > collection.last_page
        ) {
          setPage(collection.last_page);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(apiError(err));
        setPlans([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, type, status, page, revision]);

  // Charger les cours existants pour formules spécifiques
  useEffect(() => {
    let active = true;

    coursesApi
      .list({ status: "active", per_page: 100 })
      .then((result) => {
        if (!active) return;

        const collection = result.courses || {};

        setCourses(
          Array.isArray(collection)
            ? collection
            : collection.data || []
        );
      })
      .catch((err) => {
        if (active) setCoursesError(apiError(err));
      });

    return () => {
      active = false;
    };
  }, []);

  function refresh(message = "") {
    setNotice(message);
    setRevision((value) => value + 1);
  }

  async function saveTariff(payload) {
    const response =
      editing?.id != null
        ? await tariffsApi.update(editing.id, payload)
        : await tariffsApi.create(payload);

    setEditing(undefined);

    refresh(
      response?.message || "Formule enregistrée avec succès."
    );
  }

  async function toggleTariff(plan) {
    if (busyId !== null) return;

    const next =
      plan.status === "active" ? "inactive" : "active";

    const confirmation = window.confirm(
      `${next === "active" ? "Activer" : "Désactiver"} la formule « ${plan.name} » ?`
    );

    if (!confirmation) return;

    setBusyId(plan.id);
    setError("");
    setNotice("");

    try {
      const response = await tariffsApi.changeStatus(
        plan.id,
        next
      );

      refresh(
        response?.message ||
          (next === "active"
            ? "Formule activée."
            : "Formule désactivée.")
      );
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusyId(null);
    }
  }

  const lastPage = Math.max(
    1,
    Number(pagination.last_page) || 1
  );

  const currentPage = Number(
    pagination.current_page || page
  );

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Tarifs de la salle
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Gérez les formules et les prix de vos abonnements.
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
              onClick={() => setEditing(null)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              Nouveau tarif
            </button>
          </div>
        </header>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statsConfig.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={17} />
                </span>

                <div>
                  <p className="text-lg font-extrabold text-slate-900">
                    {loading ? "—" : stats[item.key] ?? 0}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <label className="relative min-w-[180px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Rechercher une formule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </label>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par type"
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
          >
            <option value="">Tous les types</option>
            <option value="general">Accès général</option>
            <option value="course">Cours spécifique</option>
          </select>

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
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>

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

        {/* Affichage en cards */}
        {loading ? (
          <div className="py-14 text-center text-sm text-slate-500">
            Chargement des formules...
          </div>
        ) : error ? null : plans.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <TariffCard
                key={plan.id}
                plan={plan}
                busy={busyId !== null}
                onEdit={setEditing}
                onToggle={toggleTariff}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CreditCard
              size={27}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-bold text-slate-800">
              Aucune formule trouvée
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Ajoutez une formule ou modifiez les filtres.
            </p>
          </div>
        )}

        {!loading && !error && lastPage > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
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
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
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
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <TariffForm
          key={editing?.id ?? "new"}
          plan={editing}
          courses={courses}
          coursesError={coursesError}
          onClose={() => setEditing(undefined)}
          onSave={saveTariff}
        />
      )}
    </main>
  );
}
