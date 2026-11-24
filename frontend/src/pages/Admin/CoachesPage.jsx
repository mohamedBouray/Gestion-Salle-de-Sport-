import { gymDateKey } from "../../utils/gymDates.js";
import { useEffect, useState } from "react";
import {
    Plus, Search, ChevronLeft, ChevronRight, Users, UserRoundCheck,
    UserRoundX, Clock3, FileSpreadsheet, LoaderCircle,
} from "lucide-react";

// Components
import CoachForm from "../../components/admin/coach/CoachForm";
import CoachesTable from "../../components/admin/coach/CoachesTable";
import CoachDetails from "../../components/admin/coach/CoachDetails";

// APIs
import { adminApi } from "../../services/AdminApi";
import { apiError } from "../../services/api";

const cards = [
    { key: "total", label: "Total coachs", icon: Users },
    { key: "active", label: "Actifs", icon: UserRoundCheck },
    { key: "pending", label: "En attente", icon: Clock3 },
    { key: "inactive", label: "Inactifs", icon: UserRoundX },
];

const statusLabels = {
    active: "Actif",
    pending: "En attente",
    inactive: "Bloqué",
};

const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("fr-MA", { timeZone: "Africa/Casablanca" }) : "";

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
    const [exporting, setExporting] = useState(false);
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
        const result = id
            ? await adminApi.coaches.update(id, payload)
            : await adminApi.coaches.create(payload);

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

    // =====================================
    // EXPORT EXCEL (tous les coachs, avec les filtres actuels)
    // =====================================

    async function exportExcel() {
        if (exporting) return;

        setExporting(true);
        setError("");
        setNotice("");

        try {
            const blob = await adminApi.coaches.exportExcel({search: query, status, });
            // Create a temporary download link.
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const day = gymDateKey();
            link.download = `coachs-${day}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            setNotice("Téléchargement du fichier Excel lancé.");
        } catch (err) {
            let message = "Impossible d'exporter les coachs.";
            const responseData = err?.response?.data;

            if (responseData instanceof Blob) {
                try {
                    const text = await responseData.text();
                    const json = JSON.parse(text);
                    message = json.message || message;
                } catch {
                }
            } else {
                message = apiError(err);
            }

            setError(message);
        } finally {
            setExporting(false);
        }
    }


    return (
        <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-[1400px] space-y-4">

                {/* Header */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
                            Gestion des coachs
                        </h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            Gérez les entraîneurs, leurs profils et leurs accès.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={exportExcel}
                            disabled={exporting || loading}
                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {exporting ? (
                                <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                                <FileSpreadsheet size={15} />
                            )}
                            {exporting ? "Export..." : "Exporter Excel"}
                        </button>

                        <button type="button"
                            onClick={() => setFormCoach(null)}
                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-700">
                            <Plus size={15} />
                            Ajouter un coach
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {cards.map(({ key, label, icon: Icon }) => (
                        <div key={key}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Icon size={18} />
                            </span>

                            <div className="min-w-0">
                                <p className="text-xl font-bold leading-none">
                                    {stats[key] ?? 0}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                    {label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table card */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Nom, e-mail ou spécialité..."
                                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"/>
                        </div>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] outline-none transition focus:border-blue-500 focus:bg-white">
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="pending">En attente</option>
                            <option value="inactive">Bloqués</option>
                        </select>
                    </div>

                    {error && (
                        <p role="alert" className="mx-4 mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                            {error}
                        </p>
                    )}

                    {notice && (
                        <p role="status" className="mx-4 mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
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
                        onToggleStatus={toggleStatus}/>

                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
                        <span>
                            {pagination.total ?? 0} coach(s) · Page {pagination.current_page ?? 1} / {pagination.last_page ?? 1}
                        </span>

                        <div className="flex gap-1.5">
                            <button type="button"
                                disabled={loading || page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40" >
                                <ChevronLeft size={14} /> Précédent
                            </button>

                            <button
                                type="button"
                                disabled={loading || page >= (pagination.last_page ?? 1)}
                                onClick={() => setPage((p) => p + 1)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                                Suivant <ChevronRight size={14} />
                            </button>
                        </div>
                    </footer>
                </section>

                {formCoach !== undefined && (
                    <CoachForm
                        coach={formCoach}
                        onClose={() => setFormCoach(undefined)}
                        onSave={saveCoach}/>
                )}

                {detailsId !== null && (
                    <CoachDetails
                        coachId={detailsId}
                        onClose={() => setDetailsId(null)} />
                )}
            </div>
        </div>
    );
}