import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CourseProposalForm from "../../components/coach/CourseProposalForm";
import { ArrowUpRight, CalendarDays, Dumbbell, Layers3, Users } from "lucide-react";
import { coachCoursesPlanningApi } from "../../services/CoachCoursesPlanningApi";
import {
  Badge, Empty, ErrorBox, Head, Page, Panel, SearchBox, useLoad, Wait, Notice,
} from "../../components/coach/CoachUI";

export default function CoursesPage() {
  const { data, loading, error, refresh } = useLoad(coachCoursesPlanningApi.courses);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const proposalsState = useLoad(coachCoursesPlanningApi.proposals);
  const courses = useMemo(() => (data?.courses || []).filter((course) =>
    `${course.name || ""} ${course.description || ""}`.toLocaleLowerCase("fr").includes(search.trim().toLocaleLowerCase("fr")),
  ), [data, search]);
  const futureCount = (data?.courses || []).reduce((sum, course) => sum + (Number(course.upcoming_sessions_count) || 0), 0);

  return (
    <Page>
      <Head title="Mes cours" subtitle="Vos cours, séances et propositions à valider." onRefresh={() => { refresh(); proposalsState.refresh(); }} loading={loading} action={<CourseProposalForm onCreated={(text) => { setNotice(text); proposalsState.refresh(); }}/>} />
      <Notice text={notice}/>
      <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Dumbbell size={17}/></div>
          <div><p className="text-lg font-extrabold leading-none text-slate-900">{loading ? "—" : (data?.courses?.length ?? 0)}</p><p className="mt-1 text-[11px] text-slate-500">Cours liés</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><CalendarDays size={17}/></div>
          <div><p className="text-lg font-extrabold leading-none text-slate-900">{loading ? "—" : futureCount}</p><p className="mt-1 text-[11px] text-slate-500">Séances à venir</p></div>
        </div>
      </div>
      <ErrorBox text={error}/>
      <Panel title="Mes propositions de cours" note={`${proposalsState.data?.proposals?.length ?? 0} proposition(s)`}>
        <ErrorBox text={proposalsState.error}/>
        {proposalsState.loading ? <Wait loading/> : (proposalsState.data?.proposals || []).length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {proposalsState.data.proposals.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-3">
            <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold text-slate-900">{item.name}</h3><Badge status={item.status === "approved" ? "accepted" : item.status}/></div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description || "Sans description"}</p>
            <p className="mt-2 text-[11px] text-slate-400">{item.suggested_duration_minutes || "—"} min · {item.suggested_capacity || "—"} places</p>
            {item.review_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">Retour admin : {item.review_note}</p>}
          </div>)}
        </div> : <Empty title="Aucune proposition" detail="Utilisez « Proposer un cours » pour soumettre votre première idée."/>}
      </Panel>
      <Panel title="Catalogue personnel" note={`${courses.length} cours`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Rechercher un cours..."/>
          <Link to="/coach/schedule" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Voir mon planning <ArrowUpRight size={14}/></Link>
        </div>
        {loading ? <Wait loading/> : courses.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article key={course.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Dumbbell size={17}/></span>
                  <Badge status={course.status}/>
                </div>
                <div className="mt-3 flex items-center gap-2"><h3 className="min-w-0 truncate text-[15px] font-extrabold text-slate-900">{course.name}</h3>{!course.is_main_coach && <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">Intervenant</span>}</div>
                <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-[18px] text-slate-500">{course.description || "Description non renseignée."}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600"><CalendarDays size={15} className="text-blue-500"/><strong>{course.upcoming_sessions_count ?? 0}</strong><span className="truncate">à venir</span></div>
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600"><Layers3 size={15} className="text-blue-500"/><strong>{course.sessions_count ?? 0}</strong><span className="truncate">au total</span></div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><Users size={13}/> Planification gérée par l'administration</div>
              </article>
            ))}
          </div>
        ) : <Empty title={search ? "Aucun cours correspondant" : "Aucun cours attribué"} detail={search ? "Essayez un autre mot-clé." : "Les cours attribués par l'administrateur apparaîtront ici."}/>}
      </Panel>
    </Page>
  );
}
