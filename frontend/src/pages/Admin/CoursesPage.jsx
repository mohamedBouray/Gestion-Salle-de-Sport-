import { useEffect, useState } from "react";
import {
    CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleOff,
    FileSpreadsheet, Dumbbell, LoaderCircle, Plus, RefreshCw, Search, X,
} from "lucide-react";
import CoursesTable from "../../components/admin/courses/CoursesTable";
import CourseForm from "../../components/admin/courses/CourseForm";
import CourseDetails from "../../components/admin/courses/CourseDetails";
import { coursesApi } from "../../services/CoursesApi";
import { apiError } from "../../services/api";

const statsConfig = [
    { key: "total", label: "Total des cours", icon: Dumbbell },
    { key: "active", label: "Cours actifs", icon: CheckCircle2 },
    { key: "inactive", label: "Cours inactifs", icon: CircleOff },
    { key: "scheduled_sessions", label: "Séances à venir", icon: CalendarDays },
];

async function exportError(error) {
    if (error?.response?.data instanceof Blob) {
        try {
            const result = JSON.parse(await error.response.data.text());
            if (result.message) return result.message;
        } catch { /* Utiliser l'erreur standard. */ }
    }
    return apiError(error);
}

function StatCard({ item, value, loading }) {
    const Icon = item.icon;
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={18} />
            </span>

            <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">
                    {loading
                        ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-100" />
                        : value ?? 0}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">{item.label}</p>
            </div>
        </div>
    );
}

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState({});
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [formCourse, setFormCourse] = useState(undefined); // undefined: fermé, null: nouveau
    const [detailsId, setDetailsId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setQuery(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");
        coursesApi.list({ search: query, status, page, per_page: 10 })
            .then((result) => {
                if (!mounted) return;
                const collection = result.courses ?? {};
                setCourses(Array.isArray(collection) ? collection : collection.data ?? []);
                setPagination(Array.isArray(collection) ? {} : collection);
                setStats(result.stats ?? {});
                if (collection.last_page && page > collection.last_page) setPage(collection.last_page);
            })
            .catch((err) => { if (mounted) { setError(apiError(err)); setCourses([]); } })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [query, status, page, refreshKey]);

    function refresh(message = "") {
        setNotice(message);
        setRefreshKey((value) => value + 1);
    }

    async function saveCourse(payload, id) {
        const response = id != null
            ? await coursesApi.update(id, payload)
            : await coursesApi.create(payload);
        setFormCourse(undefined);
        refresh(response?.message || "Cours enregistré avec succès.");
    }

    async function runAction(course, action, success) {
        if (busyId !== null) return;
        setBusyId(course.id);
        setNotice("");
        setError("");
        try {
            await action();
            refresh(success);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusyId(null);
        }
    }

    function toggleStatus(course) {
        const next = course.status === "active" ? "inactive" : "active";
        if (!window.confirm(`${next === "active" ? "Activer" : "Désactiver"} le cours « ${course.name} » ?`)) return;
        runAction(course, () => coursesApi.changeStatus(course.id, next),
            next === "active" ? "Cours activé avec succès." : "Cours désactivé avec succès.");
    }

    function archiveCourse(course) {
        if (!window.confirm(`Archiver le cours « ${course.name} » ?`)) return;
        runAction(course, () => coursesApi.remove(course.id), "Cours archivé avec succès.");
    }

    async function exportExcel() {
        if (exporting) return;
        setExporting(true);
        setError("");
        setNotice("");
        try {
            const file = await coursesApi.exportExcel({ search: query, status });
            const blob = new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `cours-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setNotice("Fichier Excel téléchargé avec succès.");
        } catch (err) {
            setError(await exportError(err));
        } finally {
            setExporting(false);
        }
    }

    const lastPage = Math.max(1, pagination.last_page ?? 1);
    const total = pagination.total ?? 0;
    const current = pagination.current_page ?? page;

    return (
        <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-[1400px] space-y-4">

                {/* Header */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
                            Gestion des cours
                        </h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            Organisez vos activités sportives et gérez les cours de votre salle.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={exportExcel}
                            disabled={exporting || loading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {exporting ? <LoaderCircle size={17} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                            {exporting ? "Export..." : "Exporter Excel"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormCourse(null)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700"
                        >
                            <Plus size={16} />
                            Nouveau cours
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statsConfig.map((item) => (
                        <StatCard key={item.key} item={item} value={stats[item.key]} loading={loading} />
                    ))}
                </section>

                {/* List card */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 px-4 py-3">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-md">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                placeholder="Rechercher un cours ou un coach..."
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                            {search && (
                                <button
                                    type="button"
                                    title="Effacer"
                                    onClick={() => { setSearch(""); setPage(1); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            aria-label="Filtrer par statut"
                            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                            <option value="pending">En attente</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => refresh()}
                            title="Actualiser"
                            aria-label="Actualiser les cours"
                            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {error && (
                        <p role="alert" className="mx-4 mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                            {error}
                        </p>
                    )}

                    {notice && (
                        <p role="status" className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
                            <CheckCircle2 size={15} />
                            {notice}
                        </p>
                    )}

                    <CoursesTable
                        courses={courses}
                        loading={loading}
                        busyId={busyId}
                        onView={(course) => setDetailsId(course.id)}
                        onEdit={setFormCourse}
                        onToggleStatus={toggleStatus}
                        onDelete={archiveCourse}
                    />

                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
                        <span>{total} cours · Page {current} / {lastPage}</span>

                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                disabled={loading || page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronLeft size={14} /> Précédent
                            </button>

                            <button
                                type="button"
                                disabled={loading || page >= lastPage}
                                onClick={() => setPage((p) => p + 1)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Suivant <ChevronRight size={14} />
                            </button>
                        </div>
                    </footer>
                </section>
            </div>

            {formCourse !== undefined && (
                <CourseForm course={formCourse} onClose={() => setFormCourse(undefined)} onSave={saveCourse} />
            )}
            {detailsId !== null && (
                <CourseDetails courseId={detailsId} onClose={() => setDetailsId(null)} />
            )}
        </main>
    );
}