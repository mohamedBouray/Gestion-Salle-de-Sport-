
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UsersRound,
} from "lucide-react";

import MemberCard from "../../components/coach/members/MemberCard";
import MemberDetails from "../../components/coach/members/MemberDetails";

import {
  Empty,
  ErrorBox,
  Head,
  Page,
  Panel,
  SearchBox,
  Stat,
  Wait,
} from "../../components/coach/CoachUI";

import { coachMembersApi } from "../../services/CoachMembersApi";
import { apiError } from "../../services/api";

const EMPTY_PAGE = {
  data: [],
  current_page: 1,
  last_page: 1,
  total: 0,
};

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    coachMembersApi
      .list(
        {
          search: query,
          course_id: courseId || undefined,
          status: status || undefined,
          page,
          per_page: 9,
        },
        controller.signal
      )
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(apiError(err));
          setResult(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, courseId, status, page, refreshKey]);

  useEffect(() => {
    if (selectedId == null) return;

    const controller = new AbortController();

    setDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    coachMembersApi
      .show(selectedId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDetails(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setDetailsError(apiError(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedId]);

  const closeDetails = useCallback(() => setSelectedId(null), []);

  const pager = result?.members || EMPTY_PAGE;
  const members = Array.isArray(pager.data) ? pager.data : [];
  const courses = Array.isArray(result?.courses) ? result.courses : [];
  const stats = result?.stats || {};

  const currentPage = Number(pager.current_page) || 1;
  const lastPage = Number(pager.last_page) || 1;

  return (
    <Page>
      <Head
        title="Mes membres"
        subtitle="Membres inscrits à vos séances et à vos cours."
        onRefresh={() => setRefreshKey((value) => value + 1)}
        loading={loading}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={UsersRound}
          label="Mes membres"
          value={loading ? "—" : stats.total ?? 0}
        />

        <Stat
          icon={UserCheck}
          label="Comptes actifs"
          value={loading ? "—" : stats.active ?? 0}
        />

        <Stat
          icon={CalendarDays}
          label="Avec séance à venir"
          value={loading ? "—" : stats.with_upcoming ?? 0}
        />
      </div>

      <Panel
        title="Liste des membres"
        note={!loading && !error ? `${pager.total ?? 0} résultat(s)` : undefined}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex-1 sm:flex-none">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Nom ou email..."
            />
          </div>

          <select
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par cours"
            className="h-9 min-w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">Tous les cours</option>
            {courses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par statut"
            className="h-9 min-w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>

        <ErrorBox text={error} />

        {loading ? (
          <Wait loading />
        ) : error ? null : members.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onView={setSelectedId}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Aucun membre trouvé"
            detail="Les membres ayant une réservation confirmée ou une présence dans vos séances apparaîtront ici."
          />
        )}

        {!loading && !error && lastPage > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              Page {currentPage} / {lastPage}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Page précédente"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(lastPage, p + 1))
                }
                disabled={currentPage >= lastPage}
                aria-label="Page suivante"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </Panel>

      <MemberDetails
        open={selectedId != null}
        member={details?.member}
        sessions={details?.sessions || []}
        loading={detailsLoading}
        error={detailsError}
        onClose={closeDetails}
      />
    </Page>
  );
}
