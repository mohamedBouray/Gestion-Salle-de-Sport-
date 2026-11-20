
import { useEffect, useMemo, useState } from "react";

import {
  CalendarCheck2,
  CalendarDays,
  UsersRound,
} from "lucide-react";

import AttendanceSessionCard from "../../components/coach/attendance/AttendanceSessionCard";
import AttendanceParticipants from "../../components/coach/attendance/AttendanceParticipants";

import {
  Empty,
  ErrorBox,
  Head,
  Notice,
  Page,
  Panel,
  SearchBox,
  Stat,
  Wait,
  useLoad,
} from "../../components/coach/CoachUI";

import { coachAttendanceApi } from "../../services/CoachAttendanceApi";
import { apiError } from "../../services/api";

const FILTERS = [
  ["all", "Toutes"],
  ["today", "Aujourd'hui"],
  ["upcoming", "À venir"],
  ["past", "Passées"],
];

function sameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function matchesPeriod(session, filter) {
  if (filter === "all") return true;

  const start = new Date(session.start_at);

  if (Number.isNaN(start.getTime())) return false;

  const now = new Date();

  if (filter === "today") {
    return sameDay(start, now);
  }

  if (filter === "upcoming") {
    return start.getTime() > now.getTime();
  }

  return start.getTime() <= now.getTime();
}

export default function AttendancePage() {
  const sessionsState = useLoad(coachAttendanceApi.sessions);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [revision, setRevision] = useState(0);

  // Liste des seances du Coach connecte
  const sessions = useMemo(
    () =>
      Array.isArray(sessionsState.data?.sessions)
        ? sessionsState.data.sessions
        : [],
    [sessionsState.data]
  );

  // Recherche et filtres
  const visibleSessions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");

    return sessions.filter((session) => {
      const label = `${
        session.course?.name || ""
      } ${session.location || ""}`;

      return (
        label.toLocaleLowerCase("fr").includes(term) &&
        matchesPeriod(session, period)
      );
    });
  }, [sessions, search, period]);

  // Selection automatique de la premiere seance visible
  useEffect(() => {
    setSelectedId((current) =>
      visibleSessions.some((session) => session.id === current)
        ? current
        : visibleSessions[0]?.id ?? null
    );
  }, [visibleSessions]);

  const selected =
    sessions.find((session) => session.id === selectedId) ||
    null;

  // Recuperer les participants de la seance
  useEffect(() => {
    if (selectedId == null) {
      setDetails(null);
      return;
    }

    const controller = new AbortController();

    setDetailsLoading(true);
    setDetailsError("");
    setActionError("");
    setDetails(null);

    coachAttendanceApi
      .participants(selectedId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setDetails(response);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDetailsError(apiError(error));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedId, revision]);

  const participants = Array.isArray(details?.participants)
    ? details.participants
    : [];

  // Verification date et autorisation du Backend
  const started =
    selected &&
    !Number.isNaN(new Date(selected.start_at).getTime()) &&
    new Date(selected.start_at).getTime() <= Date.now();

  const canMark =
    details?.can_mark === true &&
    started &&
    selected?.status !== "cancelled";

  // Marquer present ou absent
  const markAttendance = async (enrollmentId, status) => {
    if (!selected || !canMark || savingId !== null) return;

    const sessionId = selected.id;

    setSavingId(enrollmentId);
    setNotice("");
    setActionError("");

    try {
      await coachAttendanceApi.mark(
        sessionId,
        enrollmentId,
        status
      );

      setNotice(
        status === "present"
          ? "Présence enregistrée."
          : "Absence enregistrée."
      );

      if (sessionId === selectedId) {
        setRevision((count) => count + 1);
      }
    } catch (error) {
      setActionError(apiError(error));
    } finally {
      setSavingId(null);
    }
  };

  // Actualisation
  const refresh = () => {
    sessionsState.refresh();
    setRevision((count) => count + 1);
    setNotice("");
  };

  // Statistiques
  const todayCount = sessions.filter((session) =>
    matchesPeriod(session, "today")
  ).length;

  const bookings = sessions.reduce(
    (sum, session) =>
      sum + (Number(session.booked_count) || 0),
    0
  );

  return (
    <Page>
      <Head
        title="Présences des séances"
        subtitle="Pointez les membres inscrits à vos cours."
        onRefresh={refresh}
        loading={sessionsState.loading || detailsLoading}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          icon={CalendarDays}
          label="Mes séances"
          value={
            sessionsState.loading ? "—" : sessions.length
          }
        />

        <Stat
          icon={CalendarCheck2}
          label="Aujourd'hui"
          value={sessionsState.loading ? "—" : todayCount}
        />

        <Stat
          icon={UsersRound}
          label="Inscriptions"
          value={sessionsState.loading ? "—" : bookings}
        />
      </div>

      <ErrorBox text={sessionsState.error} />
      <Notice text={notice} />

      <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Colonne des seances */}
        <Panel
          title="Mes séances"
          note={`${visibleSessions.length} résultat(s)`}
        >
          <div className="space-y-3">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Cours ou salle..."
            />

            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
              {FILTERS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    period === value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {sessionsState.loading ? (
              <Wait loading />
            ) : visibleSessions.length ? (
              visibleSessions.map((session) => (
                <AttendanceSessionCard
                  key={session.id}
                  session={session}
                  selected={selectedId === session.id}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setNotice("");
                  }}
                />
              ))
            ) : (
              <Empty
                title="Aucune séance trouvée"
                detail="Changez la recherche ou la période."
              />
            )}
          </div>
        </Panel>

        {/* Colonne des participants */}
        <Panel
          title={
            selected
              ? selected.course?.name || "Participants"
              : "Participants"
          }
          note={
            selected
              ? `${participants.length} membre(s) inscrit(s)`
              : undefined
          }
        >
          {!selected ? (
            <Empty
              title="Sélectionnez une séance"
              detail="Choisissez une séance à gauche pour consulter les participants."
            />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                {new Intl.DateTimeFormat("fr-MA", {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(new Date(selected.start_at))}

                {selected.location
                  ? ` · ${selected.location}`
                  : ""}
              </p>

              {!started && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Le pointage sera disponible à partir du
                  début de la séance.
                </p>
              )}

              {started &&
                !detailsLoading &&
                !detailsError &&
                !canMark && (
                  <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                    Pointage indisponible pour cette séance.
                  </p>
                )}

              <ErrorBox text={detailsError || actionError} />

              {detailsLoading ? (
                <Wait loading />
              ) : detailsError ? null : (
                <AttendanceParticipants
                  key={selected.id}
                  participants={participants}
                  canMark={canMark}
                  savingId={savingId}
                  onMark={markAttendance}
                />
              )}
            </div>
          )}
        </Panel>
      </div>
    </Page>
  );
}
