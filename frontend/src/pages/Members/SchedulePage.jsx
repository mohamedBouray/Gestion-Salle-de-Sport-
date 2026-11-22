import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Search, TicketCheck } from "lucide-react";
import SessionCard from "../../components/Members/sports/SessionCard";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { memberSportsApi, readPage } from "../../services/MemberSportsApi";
import { apiError } from "../../services/api";

const PERIODS = [["all", "Toutes"], ["today", "Aujourd'hui"], ["week", "7 prochains jours"]];
const emptyPagination = { current_page: 1, last_page: 1, total: 0 };

export default function SchedulePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const courseId = searchParams.get("course") || "";
    const [sessions, setSessions] = useState([]);
    const [pagination, setPagination] = useState(emptyPagination);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [period, setPeriod] = useState("all");
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [selectedSession, setSelectedSession] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [bookingError, setBookingError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { setPage(1); }, [courseId, period]);

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true); setError("");
            try {
                const response = await memberSportsApi.sessions({
                    page, per_page: 12, period,
                    search: debouncedSearch || undefined,
                    course_id: courseId || undefined,
                }, controller.signal);
                if (controller.signal.aborted) return;
                const result = readPage(response, "sessions");
                setSessions(result.data);
                setPagination(result);
                if (page > result.last_page) setPage(result.last_page);
            } catch (err) {
                if (!controller.signal.aborted) { setError(apiError(err)); setSessions([]); setPagination(emptyPagination); }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        load();
        return () => controller.abort();
    }, [page, courseId, period, debouncedSearch, revision]);

    function askToBook(session) {
        if (bookingId !== null || session.can_book !== true) return;
        setBookingError(""); setNotice(""); setSelectedSession(session);
    }

    async function confirmBooking() {
        if (!selectedSession || bookingId !== null) return;
        setBookingId(selectedSession.id); setBookingError("");
        try {
            const result = await memberSportsApi.book(selectedSession.id);
            setSelectedSession(null);
            setNotice(result?.message || "Réservation confirmée avec succès.");
            setRevision((value) => value + 1);
        } catch (err) {
            // La capacité / l'abonnement sont revérifiés par Laravel sous verrou.
            setBookingError(apiError(err));
            setRevision((value) => value + 1);
        } finally {
            setBookingId(null);
        }
    }

    function clearCourseFilter() {
        const next = new URLSearchParams(searchParams);
        next.delete("course");
        setSearchParams(next);
        setPage(1);
    }

    const dateLabel = selectedSession?.start_at ? new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedSession.start_at)) : "";

    return (
        <main className="min-h-full bg-slate-50 px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-[1400px] space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div><h1 className="text-xl font-extrabold text-slate-900">Mon planning</h1><p className="mt-1 text-xs text-slate-500">Consultez les séances et réservez votre place.</p></div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => { setNotice(""); setRevision((v) => v + 1); }} disabled={loading} aria-label="Actualiser"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        </button>
                        <Link to="/member/reservations" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"><TicketCheck size={15} />Mes réservations</Link>
                    </div>
                </header>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><CalendarDays size={19} /></span>
                    <div><p className="text-lg font-extrabold text-slate-900">{loading ? "—" : pagination.total}</p><p className="text-[11px] text-slate-500">Séances correspondant aux filtres</p></div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                    <label className="relative block">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="search" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} placeholder="Cours, coach ou salle..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500" />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        {PERIODS.map(([value, label]) => (
                            <button key={value} type="button" onClick={() => { setPeriod(value); setPage(1); }} aria-pressed={period === value}
                                className={`h-8 rounded-lg px-3 text-[11px] font-semibold ${period === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                {label}
                            </button>
                        ))}
                        {courseId && <button type="button" onClick={clearCourseFilter} className="h-8 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[11px] font-semibold text-blue-700">Retirer filtre cours ×</button>}
                    </div>
                </div>

                {notice && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</div>}
                {error && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

                {loading ? (
                    <p className="py-12 text-center text-sm text-slate-500">Chargement du planning...</p>
                ) : error ? null : sessions.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {sessions.map((session) => <SessionCard key={session.id} session={session} busy={bookingId !== null} onBook={askToBook} />)}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <CalendarDays size={26} className="mx-auto text-slate-400" />
                        <p className="mt-3 text-sm font-bold text-slate-800">Aucune séance trouvée</p>
                        <p className="mt-1 text-xs text-slate-500">Changez les filtres ou consultez les autres séances.</p>
                    </div>
                )}

                {!loading && !error && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                        <span className="text-xs text-slate-500">Page {pagination.current_page} / {pagination.last_page}</span>
                        <div className="flex gap-2">
                            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Page précédente" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
                            <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))} aria-label="Page suivante" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog open={Boolean(selectedSession)} title="Confirmer cette réservation ?"
                description="Vérifiez le cours et la date avant de réserver votre place."
                subject={`${selectedSession?.course?.name || "Cours sportif"}${dateLabel ? ` · ${dateLabel}` : ""}`}
                subjectLabel="SÉANCE SÉLECTIONNÉE" variant="primary" confirmLabel="Réserver ma place"
                loading={bookingId !== null} error={bookingError}
                onCancel={() => { if (bookingId === null) { setSelectedSession(null); setBookingError(""); } }}
                onConfirm={confirmBooking} />
        </main>
    );
}