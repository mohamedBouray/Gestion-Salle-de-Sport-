import { useEffect, useState } from "react";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";

import CourseCard from "../../components/Members/sports/CourseCard";
import {
  memberSportsApi,
  readPage,
} from "../../services/MemberSportsApi";
import { apiError } from "../../services/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCourses() {
      setLoading(true);
      setError("");

      try {
        const response = await memberSportsApi.courses(
          {
            search: query || undefined,
            page,
            per_page: 9,
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        const result = readPage(response, "courses");

        setCourses(result.data);
        setPagination(result);

        if (page > result.last_page) {
          setPage(result.last_page);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(apiError(err));
          setCourses([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [query, page, revision]);

  return (
    <main className="min-h-full bg-slate-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Explorer les cours
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Découvrez les activités sportives de Bouray Gym.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRevision((v) => v + 1)}
            disabled={loading}
            aria-label="Actualiser"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </header>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <BookOpen size={19} />
          </span>

          <div>
            <p className="text-lg font-extrabold text-slate-900">
              {loading ? "—" : pagination.total}
            </p>
            <p className="text-[11px] text-slate-500">
              Cours actifs
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <label className="relative block">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cours..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Chargement des cours...
          </p>
        ) : error ? null : courses.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen
              size={26}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 text-sm font-bold text-slate-800">
              Aucun cours trouvé
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Essayez une autre recherche.
            </p>
          </div>
        )}

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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
      </div>
    </main>
  );
}