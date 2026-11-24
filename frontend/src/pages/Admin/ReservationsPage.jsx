import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import { reservationsApi } from "../../services/ReservationsApi";
import { adminApi } from "../../services/AdminApi";
import { coursesApi } from "../../services/CoursesApi";
import { planningApi } from "../../services/PlanningApi";
import { apiError } from "../../services/api";

import ReservationsStats from "../../components/admin/reservations/ReservationsStats";
import ReservationsFilters from "../../components/admin/reservations/ReservationsFilters";
import ReservationsTable from "../../components/admin/reservations/ReservationsTable";
import ReservationForm from "../../components/admin/reservations/ReservationForm";
import ReservationDetails from "../../components/admin/reservations/ReservationDetails";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

// ========================================
// CONSTANTS
// ========================================

const PER_PAGE = 10;

const initialFilters = {
  search: "",
  status: "all",
  courseId: "all",
  date: "",
};

// ========================================
// HELPERS
// ========================================

function extractCollection(result, key) {
  const value = result?.[key] ?? result?.data ?? result;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

function extractReservations(result, requestedPage) {
  const source = result?.reservations ?? result?.data ?? result;

  const reservations = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : [];

  const meta = result?.meta ?? {};

  return {
    reservations,

    pagination: {
      current_page:
        Number(source?.current_page ?? meta.current_page ?? requestedPage) || 1,

      last_page: Number(source?.last_page ?? meta.last_page ?? 1) || 1,

      total:
        source?.total ??
        meta.total ??
        (Array.isArray(source) ? source.length : null),

      per_page: Number(source?.per_page ?? meta.per_page ?? PER_PAGE) || PER_PAGE,
    },

    // Les statistiques doivent provenir du Backend, pas de la page courante.
    stats: result?.stats ?? null,
  };
}

function localDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

// ========================================
// MAIN PAGE
// ========================================

export default function ReservationsPage() {
  // List data
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: null,
    per_page: PER_PAGE,
  });

  const [courses, setCourses] = useState([]);

  // Filters & pagination
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  // Page states
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [members, setMembers] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // =====================================
  // DEBOUNCED SEARCH
  // =====================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(filters.search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // =====================================
  // LOAD COURSES FOR FILTERS
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setCoursesLoading(true);

      try {
        const response = await coursesApi.list({ page: 1, per_page: 100 });

        if (!active) return;

        setCourses(extractCollection(response, "courses"));
      } catch {
        if (active) setCourses([]);
      } finally {
        if (active) setCoursesLoading(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  // =====================================
  // LOAD RESERVATIONS
  // =====================================

  useEffect(() => {
    let active = true;

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const params = { page, per_page: PER_PAGE };

        if (query) {
          params.search = query;
        }

        if (filters.status !== "all") {
          params.status = filters.status;
        }

        if (filters.courseId !== "all") {
          params.course_id = filters.courseId;
        }

        if (filters.date) {
          params.date = filters.date;
        }

        const response = await reservationsApi.admin.list(params);

        if (!active) return;

        const result = extractReservations(response, page);

        setReservations(result.reservations);
        setStats(result.stats);
        setPagination(result.pagination);

        if (page > result.pagination.last_page) {
          setPage(result.pagination.last_page);
        }
      } catch (err) {
        if (!active) return;

        setError(apiError(err));
        setReservations([]);
        setStats(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReservations();

    return () => {
      active = false;
    };
  }, [page, query, filters.status, filters.courseId, filters.date, reload]);

  // =====================================
  // LOAD MEMBER & SESSION OPTIONS (ONLY WHEN FORM IS OPEN)
  // =====================================

  useEffect(() => {
    if (!createOpen) return;

    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");

      const results = await Promise.allSettled([
        adminApi.members.list({ page: 1, per_page: 100, status: "active" }),

        planningApi.admin.sessions({
          from: localDateKey(new Date()),
          to: futureDate(28),
        }),
      ]);

      if (!active) return;

      const [membersResult, sessionsResult] = results;

      if (membersResult.status === "fulfilled") {
        setMembers(
          extractCollection(membersResult.value, "members").filter(
            (member) => member.status === "active"
          )
        );
      } else {
        setMembers([]);
      }

      if (sessionsResult.status === "fulfilled") {
        const now = new Date();

        const sessions = extractCollection(sessionsResult.value, "sessions");

        setAvailableSessions(
          sessions
            .filter((session) => {
              const start = new Date(session.start_at);

              return (
                session.status === "scheduled" &&
                !Number.isNaN(start.getTime()) &&
                start > now
              );
            })
            .sort(
              (a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
            )
        );
      } else {
        setAvailableSessions([]);
      }

      if (
        membersResult.status === "rejected" ||
        sessionsResult.status === "rejected"
      ) {
        setOptionsError("Impossible de charger certains membres ou séances.");
      }

      setOptionsLoading(false);
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [createOpen]);

  // =====================================
  // ACTIONS: FILTERS
  // =====================================

  function updateFilters(changes) {
    setFilters((current) => ({ ...current, ...changes }));

    setPage(1);
    setNotice("");
  }

  function resetFilters() {
    setFilters({ ...initialFilters });
    setPage(1);
    setNotice("");
  }

  // =====================================
  // ACTIONS: REFRESH
  // =====================================

  function refresh(message = "") {
    setNotice(message);
    setReload((value) => value + 1);
  }

  // =====================================
  // ACTIONS: CREATE RESERVATION
  // =====================================

  function openCreate() {
    setFormError("");
    setOptionsError("");
    setCreateOpen(true);
  }

  function closeCreate() {
    if (saving) return;

    setCreateOpen(false);
    setFormError("");
  }

  async function saveReservation(payload) {
    if (saving) return;

    setSaving(true);
    setFormError("");
    setError("");
    setNotice("");

    try {
      const memberId = Number(payload.member_id);
      const sessionId = Number(payload.session_id);

      if (!Number.isSafeInteger(memberId) || memberId < 1) {
        throw new Error("Veuillez sélectionner un membre.");
      }

      if (!Number.isSafeInteger(sessionId) || sessionId < 1) {
        throw new Error("Veuillez sélectionner une séance.");
      }

      const result = await reservationsApi.admin.createForMember(
        sessionId,
        memberId
      );

      setCreateOpen(false);
      setPage(1);

      refresh(result?.message || "Réservation créée avec succès.");
    } catch (err) {
      const message = err?.response
        ? apiError(err)
        : err?.message || "Impossible de créer la réservation.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // ADMIN — ANNULATION SÉCURISÉE
  // =====================================

  function requestCancellation(reservation) {
    if (cancelBusy) return;
    setSelectedReservation(null);
    setCancelError("");
    setCancelTarget(reservation);
  }

  async function confirmCancellation() {
    if (!cancelTarget || cancelBusy) return;
    setCancelBusy(true);
    setCancelError("");
    try {
      const response = await reservationsApi.admin.cancel(cancelTarget.id);
      setCancelTarget(null);
      setPage(1);
      refresh(response?.message || "Réservation annulée.");
    } catch (err) {
      setCancelError(err?.response ? apiError(err) : err?.message || "Annulation impossible.");
    } finally {
      setCancelBusy(false);
    }
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
              Gestion des réservations
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Suivez les réservations des membres et gérez les inscriptions à
              l'accueil.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refresh()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Nouvelle réservation
            </button>
          </div>
        </header>

        {/* Success */}
        {notice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700"
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Fermer le message"
              className="rounded p-0.5 hover:bg-emerald-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => refresh()}
              className="text-xs font-semibold underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <ReservationsStats stats={stats} loading={loading} />

        {/* List card */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <ReservationsFilters
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
              courses={courses}
              loading={coursesLoading}
              total={pagination.total}
            />
          </div>

          {loading && reservations.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-slate-500">
              <LoaderCircle size={26} className="animate-spin text-blue-600" />
              <p className="text-[13px]">Chargement des réservations...</p>
            </div>
          ) : (
            <ReservationsTable
              reservations={reservations}
              loading={loading}
              pagination={pagination}
              onPageChange={setPage}
              onView={setSelectedReservation}
            />
          )}
        </section>
      </div>

      {createOpen && (
        <ReservationForm
          members={members}
          sessions={availableSessions}
          loading={optionsLoading}
          loadingError={optionsError}
          error={formError}
          saving={saving}
          onClose={closeCreate}
          onSave={saveReservation}
        />
      )}

      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onCancel={requestCancellation}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Annuler cette réservation ?"
        description="La place sera libérée, mais l'historique sera conservé."
        subject={`${cancelTarget?.member?.name || "Membre"} · ${cancelTarget?.session?.course?.name || "Cours sportif"}`}
        subjectLabel="RÉSERVATION SÉLECTIONNÉE"
        warning="L'annulation est refusée après le début de la séance ou si un paiement est associé. Aucun remboursement automatique."
        variant="danger"
        confirmLabel="Annuler la réservation"
        loading={cancelBusy}
        error={cancelError}
        onCancel={() => { if (!cancelBusy) { setCancelTarget(null); setCancelError(""); } }}
        onConfirm={confirmCancellation}
      />
    </main>
  );
}
