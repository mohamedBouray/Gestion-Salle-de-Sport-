import { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight,Users, UserRoundCheck, UserRoundX, Clock3} from "lucide-react";

// Componemts
import CoachForm from "../../components/admin/coach/CoachForm";
import CoachesTable from "../../components/admin/coach/CoachesTable";
import CoachDetails from "../../components/admin/coach/CoachDetails";

// APIS 
import { adminApi } from "../../services/AdminApi";
import { apiError } from "../../services/api";


const cards = [
    { key: "total", label: "Total coachs", icon: Users },
    { key: "active", label: "Actifs", icon: UserRoundCheck },
    { key: "pending", label: "En attente", icon: Clock3 },
    { key: "inactive", label: "Inactifs", icon: UserRoundX },
];

export default function CoachesPage() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);

    const [coaches, setCoaches] = useState([]);
    const [stats, setStats] = useState({});
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [formCoach, setFormCoach] = useState(undefined);
    const [detailsId, setDetailsId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        adminApi.coaches.list({ search: query, status, page, per_page: 10 })
            .then((result) => {
                if (!active) return;

                const list = result.coaches;
                setCoaches(list?.data ?? []);
                setPagination(list ?? {});
                setStats(result.stats ?? {});

                if (page > (list?.last_page ?? 1)) {
                    setPage(Math.max(1, list.last_page));
                }
            })
            .catch((err) => active && setError(apiError(err)))
            .finally(() => active && setLoading(false));

        return () => { active = false; };
    }, [query, status, page, reload]);

    function refresh(message = "") {
        setNotice(message);
        setReload((n) => n + 1);
    }

    async function saveCoach(payload, id) {
        const result = id ? await adminApi.coaches.update(id, payload): await adminApi.coaches.create(payload);

        setFormCoach(undefined);
        refresh(result.message || "Coach enregistré.");
    }

    async function runAction(coach, action, message) {
        if (busyId !== null) return;

        setBusyId(coach.id);
        setError("");
        setNotice("");

        try {
            await action();
            refresh(message);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    }

    function archiveCoach(coach) {
        if (!window.confirm(`Archiver ${coach.name} ?`)) return;

        runAction(
            coach,
            () => adminApi.coaches.remove(coach.id),
            "Coach archivé."
        );
    }

    function resendInvitation(coach) {
        runAction(
            coach,
            () => adminApi.coaches.resendInvitation(coach.id),
            "Invitation renvoyée."
        );
    }
    function toggleStatus(coach) {
        if (coach.status === "pending") return;

        const blocked = coach.status === "active";

        if (!window.confirm(
            `${blocked ? "Bloquer" : "Débloquer"} ${coach.name} ?`
        )) return;

        runAction(
            coach,
            () => adminApi.coaches.changeStatus(
                coach.id,
                blocked ? "inactive" : "active"
            ),
            blocked ? "Coach bloqué." : "Coach débloqué."
        );
    }

    return (
        <div className="min-h-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-[1500px] space-y-5">

                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-blue-600">
                            ADMINISTRATION / COACHS
                        </p>
                        <h1 className="mt-1 text-2xl font-bold">
                            Gestion des coachs
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Gérez les entraîneurs, leurs profils et leurs accès.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFormCoach(null)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        <Plus size={17} /> Ajouter un coach
                    </button>
                </header>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {cards.map(({ key, label, icon: Icon }) => (
                        <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                                <span>{label}</span>
                                <Icon size={19} className="text-blue-600" />
                            </div>
                            <p className="mt-3 text-3xl font-bold">
                                {stats[key] ?? 0}
                            </p>
                        </div>
                    ))}
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
                        <div className="relative min-w-[220px] flex-1">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Nom, e-mail ou spécialité..."
                                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="pending">En attente</option>
                            <option value="inactive">Inactifs</option>
                        </select>
                    </div>

                    {error && (
                        <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {notice && (
                        <p role="status" className="m-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                            {notice}
                        </p>
                    )}

                    <CoachesTable
                        coaches={coaches}
                        loading={loading}
                        busyId={busyId}
                        onView={(coach) => setDetailsId(coach.id)}
                        onEdit={setFormCoach}
                        onDelete={archiveCoach}
                        onResend={resendInvitation}
                        onToggleStatus={toggleStatus}
                    />

                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 text-sm text-slate-500">
                        <span>
                            {pagination.total ?? 0} coach(s) · Page {pagination.current_page ?? 1} / {pagination.last_page ?? 1}
                        </span>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={loading || page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40"
                            >
                                <ChevronLeft size={16} /> Précédent
                            </button>

                            <button
                                type="button"
                                disabled={loading || page >= (pagination.last_page ?? 1)}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center gap-1 rounded-lg border px-3 py-2 disabled:opacity-40"
                            >
                                Suivant <ChevronRight size={16} />
                            </button>
                        </div>
                    </footer>
                </section>

                {formCoach !== undefined && (
                    <CoachForm
                        coach={formCoach}
                        onClose={() => setFormCoach(undefined)}
                        onSave={saveCoach}
                    />
                )}

                {detailsId !== null && (
                    <CoachDetails
                        coachId={detailsId}
                        onClose={() => setDetailsId(null)}
                    />
                )}
            </div>
        </div>
    );
}
