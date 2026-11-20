import { useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import AvailabilityEditor from "../../components/coach/AvailabilityEditor";
import { coachCoursesPlanningApi } from "../../services/CoachCoursesPlanningApi";
import {
  Badge, dayTime, Empty, ErrorBox, Head, Page, Panel, SearchBox, useLoad, Wait,
} from "../../components/coach/CoachUI";

const date = (value) => value ? new Intl.DateTimeFormat("fr-MA", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";
const isFuture = (value) => Boolean(value) && new Date(value).getTime() >= Date.now();

export default function SchedulePage() {
  const [filter, setFilter] = useState("upcoming");
  const [search, setSearch] = useState("");
  const sessionsState = useLoad(coachCoursesPlanningApi.sessions);
  const availState = useLoad(coachCoursesPlanningApi.availabilities);
  const sessions = useMemo(() => (sessionsState.data?.sessions || []).filter((session) => {
    const match = `${session.course?.name || ""} ${session.location || ""}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr"));
    return match && (filter === "all" || (filter === "upcoming" ? isFuture(session.start_at) : !isFuture(session.start_at)));
  }), [sessionsState.data, filter, search]);

  return (
    <Page>
      <Head title="Mon planning" subtitle="Séances programmées et gestion de vos horaires hebdomadaires." loading={sessionsState.loading || availState.loading} onRefresh={() => { sessionsState.refresh(); availState.refresh(); }}/>
      <ErrorBox text={sessionsState.error}/>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Panel title="Mes séances" note={`${sessions.length} résultat(s)`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div role="group" aria-label="Filtrer les séances" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {[["upcoming", "À venir"], ["past", "Passées"], ["all", "Toutes"]].map(([value, label]) => (
                <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${filter === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{label}</button>
              ))}
            </div>
            <SearchBox value={search} onChange={setSearch} placeholder="Cours ou salle..."/>
          </div>
          {sessionsState.loading ? <Wait loading/> : sessions.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {sessions.map((session) => {
                const booked = Number(session.booked_count || 0);
                const capacity = Number(session.capacity || 0);
                return (
                  <article key={session.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200">
                    <div className="flex flex-wrap items-center justify-between gap-2"><Badge status={session.status}/><span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays size={13}/>{date(session.start_at)}</span></div>
                    <h3 className="mt-3 truncate text-[15px] font-bold text-slate-900">{session.course?.name || "Cours sportif"}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-blue-500"/>{dayTime(session.start_at)} – {dayTime(session.end_at)}</span>
                      <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin size={14} className="text-blue-500"/><span className="max-w-40 truncate">{session.location || "Salle à confirmer"}</span></span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><UsersRound size={15}/>{booked} / {capacity} inscription(s)</span>
                      <span className="text-[11px] text-slate-400">Séance #{session.id}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <Empty title="Aucune séance trouvée" detail="Les séances programmées par l'admin apparaîtront ici. Essayez un autre filtre."/>}
          <p className="mt-4 text-[11px] text-slate-400">Période affichée : 30 jours passés et 60 jours à venir. Horaires dans votre fuseau local.</p>
        </Panel>
        <Panel title="Mes disponibilités" note="Modifiables">
          <ErrorBox text={availState.error}/>
          <AvailabilityEditor value={availState.data?.availabilities} loading={availState.loading} onSaved={availState.refresh}/>
        </Panel>
      </div>
    </Page>
  );
}
