import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import MemberSessionCard from "./MemberSessionCard";

function filteredCards(sessions, query) {
  const value = query.trim().toLocaleLowerCase();
  if (!value) return sessions;
  return sessions.filter((session) => [
    session.course?.name, session.coach?.name, session.location,
  ].some((text) => String(text || "").toLocaleLowerCase().includes(value)));
}

const gridClass = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

export default function AvailableSessions({
  sessions = [], loading = false, error = "", pagination,
  page = 1, onPageChange, query = "", onQueryChange, onReserve, busy = false,
}) {
  const visible = filteredCards(sessions, query);
  const lastPage = Math.max(1, Number(pagination?.last_page) || 1);

  return (
    <section className="space-y-3" aria-label="Séances disponibles">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Rechercher dans les séances affichées"
            placeholder="Cours, coach, salle..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        <p className="text-xs text-slate-500">
          Choisissez une séance pour réserver votre place.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className={gridClass} aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-4 h-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <CalendarDays size={28} className="text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-700">Aucune séance trouvée</h3>
          <p className="mt-1 max-w-md text-[13px] text-slate-500">
            {query ? "Essayez un autre mot-clé sur cette page." : "Aucune séance à venir pour le moment."}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600"
            >
              <X size={14} /> Effacer la recherche
            </button>
          )}
        </div>
      ) : !error && (
        <div className={gridClass}>
          {visible.map((session) => (
            <MemberSessionCard key={session.id} session={session} onReserve={onReserve} busy={busy} />
          ))}
        </div>
      )}

      {!loading && !error && lastPage > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <span>
            Page {page} / {lastPage} · {pagination?.total ?? "—"} séance(s)
          </span>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Précédent
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {!loading && !error && query && (
        <p className="text-xs text-slate-400">
          Recherche appliquée uniquement aux séances de cette page.
        </p>
      )}
    </section>
  );
}