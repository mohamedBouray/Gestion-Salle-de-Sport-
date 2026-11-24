import { gymDateKey, gymCalendarDay, addCalendarDays } from "../../utils/gymDates.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import { planningApi } from "../../services/PlanningApi";
import { coursesApi } from "../../services/CoursesApi";
import { adminApi } from "../../services/AdminApi";
import { apiError } from "../../services/api";

import PlanningHeader from "./PlanningHeader";
import PlanningStats from "./PlanningStats";
import PlanningFilters from "./PlanningFilters";
import PlanningCalendar from "./PlanningCalendar";
import SessionModal from "./SessionModal";
import SessionDetails from "./SessionDetails";
import ConfirmDialog from "../shared/ConfirmDialog";

// ========================================
// HELPERS
// ========================================

const defaultFilters = {
  search: "",
  status: "all",
  courseId: "all",
  coachId: "all",
};

const addDays = addCalendarDays;
const dateKey = gymDateKey;
function startOfWeek(date) {
  const day = gymCalendarDay(date);
  return addCalendarDays(day, -((day.getUTCDay() + 6) % 7));
}

function extractCollection(response, key) {
  const value = response?.[key] ?? response?.data ?? response;

  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const navButton =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700";

// ========================================
// MAIN COMPONENT
// ========================================

export default function PlanningPage({ role = "admin" }) {
  const isAdmin = role === "admin";

  // Calendar
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  // Data
  const [rawSessions, setSessions] = useState([]);
  const [clock, setClock] = useState(() => Date.now());
  const [creationDate, setCreationDate] = useState("");
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const sessions = useMemo(() => rawSessions.map((session) =>
    session.status === "scheduled" && new Date(session.end_at).getTime() <= clock
      ? { ...session, status: "completed" }
      : session
  ), [rawSessions, clock]);
  const [courses, setCourses] = useState([]);
  const [coaches, setCoaches] = useState([]);

  // UI
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  // Feedback
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [notice, setNotice] = useState("");

  // Modals: undefined = closed, null = new session, object = edit session
  const [editingSession, setEditingSession] = useState(undefined);
  const [detailsId, setDetailsId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState("");

  // ========================================
  // CALENDAR DATES
  // ========================================

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const weekEnd = days[6];

  const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

  const monthLabel = new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca",
    month: "long",
    year: "numeric",
  }).format(weekStart);

  const todayKey = dateKey(new Date(clock));
  const isCurrentWeek = days.some((day) => dateKey(day) === todayKey);

  // ========================================
  // LOAD COURSES AND COACHES
  // ========================================

  useEffect(() => {
    if (!isAdmin) {
      setOptionsLoading(false);
      return;
    }

    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError("");

      const results = await Promise.allSettled([
        coursesApi.list({ status: "active", per_page: 100, page: 1 }),
        adminApi.coaches.list({ status: "active", per_page: 100, page: 1 }),
      ]);

      if (!active) return;

      const [coursesResult, coachesResult] = results;

      if (coursesResult.status === "fulfilled") {
        setCourses(extractCollection(coursesResult.value, "courses"));
      } else {
        setCourses([]);
      }

      if (coachesResult.status === "fulfilled") {
        setCoaches(extractCollection(coachesResult.value, "coaches"));
      } else {
        setCoaches([]);
      }

      if (
        coursesResult.status === "rejected" ||
        coachesResult.status === "rejected"
      ) {
        setOptionsError("Impossible de charger certains cours ou coachs.");
      }

      setOptionsLoading(false);
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  // ========================================
  // LOAD SESSIONS
  // ========================================

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadSessions() {
      setLoading(true);
      setError("");

      try {
        const response = await planningApi.admin.sessions({
          from: dateKey(weekStart),
          to: dateKey(weekEnd),
        });

        if (!active) return;

        setSessions(extractCollection(response, "sessions"));
      } catch (err) {
        if (!active) return;

        setError(apiError(err));
        setSessions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSessions();

    return () => {
      active = false;
    };
  }, [isAdmin, weekStart, reload]);

  // ========================================
  // FILTERS
  // ========================================

  const filteredSessions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return sessions
      .filter((session) => {
        const course =
          courses.find((item) => String(item.id) === String(session.course_id)) ??
          null;

        const coach =
          coaches.find((item) => String(item.id) === String(session.coach_id)) ??
          null;

        const searchableText = [
          session.course?.name,
          session.course_name,
          course?.name,
          session.coach?.name,
          session.coach_name,
          coach?.name,
          session.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !search || searchableText.includes(search);

        const matchesStatus =
          filters.status === "all" || session.status === filters.status;

        const matchesCourse =
          filters.courseId === "all" ||
          String(session.course_id) === filters.courseId;

        const matchesCoach =
          filters.coachId === "all" ||
          String(session.coach_id) === filters.coachId;

        return matchesSearch && matchesStatus && matchesCourse && matchesCoach;
      })
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
  }, [sessions, courses, coaches, filters]);

  // ========================================
  // GROUP SESSIONS BY DAY
  // ========================================

  const sessionsByDay = useMemo(() => {
    const grouped = {};

    days.forEach((day) => {
      grouped[dateKey(day)] = [];
    });

    filteredSessions.forEach((session) => {
      const key = dateKey(session.start_at);

      if (grouped[key]) {
        grouped[key].push(session);
      }
    });

    return grouped;
  }, [days, filteredSessions]);

  // ========================================
  // SELECTED SESSION
  // ========================================

  const selectedSession = useMemo(() => {
    if (detailsId === null) return null;

    return (
      sessions.find((session) => String(session.id) === String(detailsId)) ??
      null
    );
  }, [sessions, detailsId]);

  // ========================================
  // CALENDAR ACTIONS
  // ========================================

  const previousWeek = useCallback(() => {
    setWeekStart((current) => startOfWeek(addDays(current, -7)));
    setNotice("");
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((current) => startOfWeek(addDays(current, 7)));
    setNotice("");
  }, []);

  const goToday = useCallback(() => {
    setWeekStart(startOfWeek(new Date()));
    setNotice("");
  }, []);

  const refresh = useCallback(() => {
    setReload((value) => value + 1);
  }, []);

  // ========================================
  // FILTER ACTIONS
  // ========================================

  function updateFilters(changes) {
    setFilters((current) => ({ ...current, ...changes }));
  }

  function resetFilters() {
    setFilters({ ...defaultFilters });
  }

  // ========================================
  // SESSION ACTIONS
  // ========================================

  function createSession(day) {
    const key = day instanceof Date ? dateKey(day) : "";
    if (key && key < dateKey(new Date())) return;
    setCreationDate(key);
    setError("");
    setNotice("");
    setEditingSession(null);
  }

  function editSession(session) {
    if (session.status !== "scheduled" || new Date(session.start_at).getTime() <= Date.now()) return;
    setDetailsId(null);
    setEditingSession(session);
  }

  function viewSession(session) {
    setDetailsId(session.id);
  }

  async function saveSession(payload) {
    if (saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const isEditing = Boolean(editingSession?.id);

      if (isEditing) {
        await planningApi.admin.update(editingSession.id, payload);
      } else {
        await planningApi.admin.create(payload);
      }

      setEditingSession(undefined);

      setNotice(
        isEditing
          ? "Séance modifiée avec succès."
          : "Séance programmée avec succès."
      );

      refresh();
    } catch (err) {
      setError(apiError(err));
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function cancelSession(session) {
    if (saving || session.status !== "scheduled") return;
    setCancelTarget(session);
    setCancelError("");
  }

  async function confirmCancelSession() {
    if (!cancelTarget || saving) return;
    setSaving(true);
    setCancelError("");
    setError("");
    setNotice("");
    try {
      await planningApi.admin.update(cancelTarget.id, { status: "cancelled" });
      setCancelTarget(null);
      setDetailsId(null);
      setNotice("Séance annulée avec succès.");
      refresh();
    } catch (err) {
      // Garder le dialogue ouvert pour afficher la raison métier (422).
      setCancelError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // ADMIN ACCESS
  // ========================================

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Cette nouvelle interface Planning est réservée à l'administration pour
        le moment.
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <PlanningHeader
          onCreate={createSession}
          onRefresh={refresh}
          refreshing={loading}
        />

        {/* FEEDBACK */}

        {notice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700"
          >
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {optionsError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800"
          >
            <AlertCircle size={16} />
            <span>{optionsError}</span>
          </div>
        )}

        <PlanningStats
          sessions={sessions}
          filteredSessions={filteredSessions}
          loading={loading}
        />

        {/* CALENDAR CARD */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Week navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-bold capitalize text-[#0f1b33]">
                {monthLabel}
              </h2>

              <span className="text-xs text-slate-500">{weekLabel}</span>

              {isCurrentWeek && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Cette semaine
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={previousWeek}
                aria-label="Semaine précédente"
                title="Semaine précédente"
                className={navButton}
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={goToday}
                disabled={isCurrentWeek}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-default disabled:opacity-50"
              >
                Aujourd'hui
              </button>

              <button
                type="button"
                onClick={nextWeek}
                aria-label="Semaine suivante"
                title="Semaine suivante"
                className={navButton}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
            <PlanningFilters
              filters={filters}
              onChange={updateFilters}
              onReset={resetFilters}
              courses={courses}
              coaches={coaches}
              loading={optionsLoading}
              totalCount={sessions.length}
              filteredCount={filteredSessions.length}
            />
          </div>

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 text-slate-500">
              <LoaderCircle size={26} className="animate-spin text-blue-600" />
              <p className="text-[13px]">Chargement du planning...</p>
            </div>
          ) : (
            <PlanningCalendar
              days={days}
              sessionsByDay={sessionsByDay}
              onViewSession={viewSession}
              onEditSession={editSession}
              onCreateSession={createSession}
              busy={saving}
              now={clock}
            />
          )}
        </section>
      </div>

      {editingSession !== undefined && (
        <SessionModal
          session={editingSession}
          initialDate={creationDate}
          courses={courses}
          coaches={coaches}
          onClose={() => setEditingSession(undefined)}
          onSave={saveSession}
          saving={saving}
        />
      )}

      {selectedSession && (
        <SessionDetails
          session={selectedSession}
          onClose={() => setDetailsId(null)}
          onEdit={editSession}
          onCancel={cancelSession}
          busy={saving}
        />
      )}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Annuler cette séance ?"
        description="La séance sera annulée mais restera dans l'historique du planning."
        subject={cancelTarget?.course?.name || cancelTarget?.course_name || "Cours sportif"}
        subjectLabel="SÉANCE SÉLECTIONNÉE"
        warning="Les réservations sans paiement seront annulées. Une séance commencée ou un dossier financier nécessite un traitement manuel."
        confirmLabel="Annuler la séance"
        variant="danger"
        loading={saving}
        error={cancelError}
        onCancel={() => { if (!saving) { setCancelTarget(null); setCancelError(""); } }}
        onConfirm={confirmCancelSession}
      />
    </main>
  );
}