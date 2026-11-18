import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CreditCard, Dumbbell, UsersRound, Receipt, CheckCircle2, BookOpen, MessageSquare, ListTodo, BarChart3 } from "lucide-react";
import { operationsApi } from "../../services/OperationsApi";
import { apiError } from "../../services/api";
import { Shell, Title, Feedback, Wait, Card, Refresh, displayDate, money } from "../../components/operations/Workspace";

const configurations = {
    admin: [
        ["Membres actifs", "members", UsersRound, "/admin/members"],
        ["Coachs actifs", "coaches", UsersRound, "/admin/coaches"],
        ["Cours actifs", "courses", Dumbbell, "/admin/classes"],
        ["Propositions", "pending_courses", BookOpen, "/admin/classes"],
        ["Séances à venir", "upcoming_sessions", CalendarDays, "/admin/schedule"],
        ["Réservations", "reservations", CheckCircle2, "/admin/reservations"],
        ["Abonnements actifs", "active_memberships", CreditCard, "/admin/memberships"],
        ["Revenus encaissés", "paid_revenue", Receipt, "/admin/payments"],
        ["Messages non lus", "new_messages", MessageSquare, "/admin/messages"],
        ["Demandes privées", "pending_requests", ListTodo, "/admin/personal-requests"],
    ],
    coach: [
        ["Mes cours", "courses", Dumbbell, "/coach/classes"],
        ["Propositions", "pending_courses", BookOpen, "/coach/classes"],
        ["Séances à venir", "upcoming_sessions", CalendarDays, "/coach/schedule"],
        ["Participants", "participants", UsersRound, "/coach/members"],
        ["Demandes", "pending_requests", ListTodo, "/coach/tasks"],
    ],
    member: [
        ["Mes réservations", "reservations", CalendarDays, "/member/reservations"],
        ["Mes présences", "attendances", CheckCircle2, "/member/attendance"],
        ["Demandes en attente", "pending_requests", ListTodo, "/member/requests"],
    ],
};

export default function OverviewPage({ role = "admin", analytics = false }) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        operationsApi.dashboard(role).then((data) => { if (alive) setResult(data); })
            .catch((e) => { if (alive) setError(apiError(e)); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [role, reload]);
    const stats = result?.stats || {};
    return <Shell>
        <Title kicker={role === "admin" ? "Administration / Vue d’ensemble" : role === "coach" ? "Espace coach" : "Espace membre"} title={analytics ? "Statistiques de la salle" : "Tableau de bord"} description="Données réelles de l’application, issues de Laravel." actions={<Refresh onClick={() => setReload((v) => v + 1)}/>}/>
        <Feedback error={error}/>
        <Wait loading={loading} empty={!result}>
            {role === "member" && <Card className={result?.access?.has_access ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}><p className="font-bold">{result?.access?.has_access ? "Abonnement général actif" : "Abonnement requis pour réserver"}</p><p className="mt-1 text-sm">{result?.access?.subscription?.plan_name || "Aucun forfait actif"} {result?.access?.subscription?.ends_at ? `· Fin : ${result.access.subscription.ends_at}` : ""}</p><Link to="/member/membership" className="mt-2 inline-block text-sm font-bold text-blue-700 underline">Voir mon abonnement</Link></Card>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{(configurations[role] || []).map(([label, key, Icon, href]) => <Link to={href} key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"><span className="flex items-center justify-between text-sm text-slate-500">{label}<Icon size={20} className="text-blue-600"/></span><p className="mt-3 text-2xl font-extrabold text-slate-900">{key === "paid_revenue" ? money(stats[key]) : Number(stats[key] || 0).toLocaleString("fr-MA")}</p></Link>)}</div>
            {!!result?.upcoming?.length && <Card><h2 className="mb-4 text-lg font-bold">{role === "member" ? "Mes prochaines réservations" : "Séances à venir"}</h2><div className="divide-y divide-slate-100">{result.upcoming.map((item) => { const session = item.session || item; return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="font-semibold">{session.course?.name || "Cours collectif"}</span><span className="text-slate-500">{displayDate(session.start_at)}</span></div>; })}</div></Card>}
            {analytics && role === "admin" && <Card><p className="text-sm text-slate-600"><BarChart3 size={17} className="mr-2 inline text-blue-600"/>Revenus = total des paiements marqués « paid », pas le chiffre d’affaires net ni un rapprochement bancaire.</p></Card>}
        </Wait>
    </Shell>;
}
