
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  TicketCheck,
} from "lucide-react";

import SessionCard from "../../components/Members/sports/SessionCard";
import {
  memberSportsApi,
  readPage,
} from "../../services/MemberSportsApi";
import { apiError } from "../../services/api";

function matchesPeriod(session, period) {
  if (period === "all") return true;

  const start = new Date(session.start_at);

  if (Number.isNaN(start.getTime())) return false;

  const now = new Date();

  if (period === "today") {
    return start.toDateString() === now.toDateString();
  }

  if (period === "week") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);

    return start >= now && start <= end;
  }

  return true;
}

export default function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const courseId = searchParams.get("course") || "";

  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await memberSportsApi.sessions(
          { page, per_page: 50 },
          controller.signal
        );

        if (controller.signal.aborted) return;

        const result = readPage(response, "sessions");

        setSessions(result.data);
        setPagination(result);

        if (page > result.last_page) {
          setPage(result.last_page);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(apiError(err));
          setSessions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [page, revision]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");

    return sessions.filter((session) => {
      const label = [
        session.course?.name,
        session.coach?.name,
        session.location,
      ].join(" ").toLocaleLowerCase("fr");

      const matchesCourse =
        !courseId ||
        String(session.course_id) === String(courseId);

      return (
        matchesCourse &&
        label.includes(term) &&
        matchesPeriod(session, period)
      );
    });
  }, [sessions, courseId, search, period]);

  async function book(session) {
    if (bookingId !== null || session.can_book !== true) {
      return;
    }

    const confirmed = window.confirm(
      `Confirmer votre réservation pour « ${
        session.course?.name || "Cours sportif"
      } » ?`
    );

    if (!confirmed) return;

    setBookingId(session.id);
    setError("");
    setNotice("");

    try {
      const result = await memberSportsApi.book(session.id);

      setNotice(
        result?.message || "Réservation confirmée avec succès."
      );

      setRevision((value) => value + 1);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBookingId(null);
    }
  }

  function refresh() {
    setNotice("");
    setRevision((value) => value + 1);
  }

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Mon planning
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Consultez les séances et réservez votre place.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Actualiser"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <Link
              to="/member/reservations"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              <TicketCheck size={15} />
              Mes réservations
            </Link>
          </div>
        </header>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <CalendarDays size={19} />
          </span>

          <div>
            <p className="text-lg font-extrabold text-slate-900">
              {loading ? "—" : pagination.total}
            </p>
            <p className="text-[11px] text-slate-500">
              Séances à venir
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <label className="relative block">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cours, coach ou salle..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {[
              ["all", "Toutes"],
              ["today", "Aujourd'hui"],
              ["week", "7 prochains jours"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                aria-pressed={period === value}
                className={`h-8 rounded-lg px-3 text-[11px] font-semibold ${
                  period === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}

            {courseId && (
              <button
                type="button"
                onClick={() => {
                  setSearchParams({});
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[11px] font-semibold text-blue-700"
              >
                Retirer filtre cours ×
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div
            role="status"
            className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Chargement du planning...
          </p>
        ) : error && sessions.length === 0 ? null : visible.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                busy={bookingId !== null}
                onBook={book}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CalendarDays
              size={26}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-bold text-slate-800">
              Aucune séance trouvée
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Changez les filtres ou consultez les autres séances.
            </p>
          </div>
        )}

        {!loading &&
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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

        <p className="text-[11px] text-slate-400">
          Les filtres de recherche s'appliquent aux séances
          de la page chargée. Les réservations sont vérifiées
          par Laravel avant confirmation.
        </p>
      </div>
    </main>
  );
}
