import { CalendarDays, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import MemberSessionCard from "./MemberSessionCard";

function filteredCards(sessions, query) {
  const value = query.trim().toLocaleLowerCase();
  if (!value) return sessions;
  return sessions.filter((session) => [
    session.course?.name, session.coach?.name, session.location,
  ].some((text) => String(text || "").toLocaleLowerCase().includes(value)));
}

export default function AvailableSessions({
  sessions = [], loading = false, error = "", pagination,
  page = 1, onPageChange, query = "", onQueryChange, onReserve, busy = false,
}) {
  const visible = filteredCards(sessions, query);
  const lastPage = Math.max(1, Number(pagination?.last_page) || 1);

  return (
    <section className="space-y-4" aria-label="Séances disponibles">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Séances à venir</h2>
          <p className="mt-1 text-xs text-slate-500">Choisissez une séance pour réserver votre place.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Rechercher dans les séances affichées"
            placeholder="Cours, coach, salle..."
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-6 w-3/5 rounded-lg bg-slate-100" />
              <div className="mt-8 h-7 w-2/3 rounded-lg bg-slate-100" />
              <div className="mt-5 h-24 rounded-xl bg-slate-100" />
              <div className="mt-6 h-10 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><CalendarDays size={27} /></div>
          <h3 className="mt-4 font-bold text-slate-900">Aucune séance trouvée</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {query ? "Essayez un autre mot-clé sur cette page." : "Aucune séance à venir pour le moment."}
          </p>
          {query && (
            <button onClick={() => onQueryChange("")} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
              <X size={15} /> Effacer la recherche
            </button>
          )}
        </div>
      ) : !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((session) => (
            <MemberSessionCard key={session.id} session={session} onReserve={onReserve} busy={busy} />
          ))}
        </div>
      )}

      {!loading && !error && lastPage > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">
            Page {page} / {lastPage} · {pagination?.total ?? "—"} séance(s) au total
          </span>
          <div className="flex gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">
              <ChevronLeft size={15} /> Précédent
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= lastPage} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">
              Suivant <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
      {!loading && !error && query && <p className="text-xs text-slate-400">Recherche appliquée uniquement aux séances de cette page.</p>}
    </section>
  );
}
