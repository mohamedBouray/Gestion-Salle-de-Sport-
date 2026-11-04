import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Plus, RefreshCcw, Search, UserRoundCheck, UserRoundX, Users } from "lucide-react";
import CoachForm from "../../components/admin/coach/CoachForm";
import CoachesTable from "../../components/admin/coach/CoachesTable";
import CoachDetails from "../../components/admin/coach/CoachDetails";
import { coachApi } from "../../services/coachApi";
import { apiError } from "../../services/memberApi";

const cards = [
    { key: "total", label: "Total coachs", icon: Users },
    { key: "active", label: "Actifs", icon: UserRoundCheck },
    { key: "pending", label: "En attente", icon: Clock3 },
    { key: "inactive", label: "Inactifs", icon: UserRoundX },
];

export default function CoachesPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [coaches, setCoaches] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [formCoach, setFormCoach] = useState(undefined);
    const [detailsId, setDetailsId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => setPage(1), [debouncedSearch, status]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        coachApi.list({ search: debouncedSearch, status, page, per_page: 10 })
            .then((result) => {
                if (!alive) return;
                setCoaches(result.coaches.data || []);
                setPagination(result.coaches);
                setStats(result.stats);
                if (page > result.coaches.last_page) setPage(Math.max(1, result.coaches.last_page));
            })
            .catch((err) => { if (alive) setError(apiError(err)); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [debouncedSearch, status, page, reload]);

    function refresh(message = "") {
        setNotice(message);
        setReload((current) => current + 1);
    }

    async function saveCoach(payload, id) {
        const result = id ? await coachApi.update(id, payload) : await coachApi.create(payload);
        setFormCoach(undefined);
        refresh(result.message || (id ? "Coach modifié." : "Coach créé."));
    }

    async function deleteCoach(coach) {
        if (!window.confirm(`Archiver ${coach.name} ?`)) return;
        setBusyId(coach.id);
        try {
            await coachApi.remove(coach.id);
            refresh("Coach archivé.");
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    }

    async function resend(coach) {
        setBusyId(coach.id);
        try {
            const result = await coachApi.resendInvitation(coach.id);
            refresh(result.message || "Invitation envoyée.");
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="min-h-full bg-white px-4 py-7 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">Administration / Utilisateurs</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestion des coachs</h1><p className="mt-2 text-sm text-slate-500">Gérez les entraîneurs, leurs profils et les invitations.</p></div>
                    <button type="button" onClick={() => setFormCoach(null)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Plus size={18} /> Nouveau coach</button>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(({ key, label, icon: Icon }) => <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between text-xs text-slate-500"><span>{label}</span><Icon size={18} className="text-blue-600" /></div><p className="mt-3 text-3xl font-bold">{stats[key] ?? 0}</p></div>)}</div>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="relative min-w-[200px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, spécialité..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500" /></div>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm"><option value="">Tous les statuts</option><option value="active">Actif</option><option value="pending">En attente</option><option value="inactive">Inactif</option></select>
                    <button type="button" aria-label="Actualiser" onClick={() => refresh()} className="rounded-xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50"><RefreshCcw size={18} /></button>
                </div>
                {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {notice && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
                <CoachesTable coaches={coaches} loading={loading} busyId={busyId} onView={(coach) => setDetailsId(coach.id)} onEdit={setFormCoach} onDelete={deleteCoach} onResend={resend} />
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{pagination.total || 0} coach(s) · Page {pagination.current_page || 1} / {pagination.last_page || 1}</span><div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((n) => n - 1)} className="flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16} />Précédent</button><button type="button" disabled={loading || page >= pagination.last_page} onClick={() => setPage((n) => n + 1)} className="flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40">Suivant<ChevronRight size={16} /></button></div></div>
            </div>
            {formCoach !== undefined && <CoachForm coach={formCoach} onClose={() => setFormCoach(undefined)} onSave={saveCoach} />}
            {detailsId !== null && <CoachDetails coachId={detailsId} onClose={() => setDetailsId(null)} />}
        </div>
    );
}
