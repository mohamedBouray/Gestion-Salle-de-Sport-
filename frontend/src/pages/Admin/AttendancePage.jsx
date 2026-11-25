import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Plus, RefreshCw, UserRoundCheck, UsersRound, X } from "lucide-react";
import { apiError } from "../../services/api";
import { attendanceApi } from "../../services/AttendanceApi";
import AttendanceStats from "../../components/admin/attendance/AttendanceStats";
import AttendanceFilters from "../../components/admin/attendance/AttendanceFilters";
import MemberAttendanceCards from "../../components/admin/attendance/MemberAttendanceCards";
import CoachAttendanceCards from "../../components/admin/attendance/CoachAttendanceCards";
import AttendanceForm from "../../components/admin/attendance/AttendanceForm";
import AttendanceDetails from "../../components/admin/attendance/AttendanceDetails";
import { dateKey, displayDate, getRows } from "../../components/admin/attendance/attendanceUtils";

const PAGE_SIZE = 12;

const TABS = [
    { id: "members", label: "Membres", icon: UsersRound },
    { id: "coaches", label: "Coachs", icon: UserRoundCheck },
];

const defaultFilters = (today) => ({ date: today, search: "", status: "all" });
const pagerButton = "cursor-pointer inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40";

export default function AttendancePage() {
    const today = dateKey();

    // Liste, filtres et pagination
    const [role, setRole] = useState("members");
    const [filters, setFilters] = useState(() => defaultFilters(today));
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [refreshId, setRefreshId] = useState(0);
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: null });
    const [summary, setSummary] = useState(null);

    // États de la page
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // Fenêtres
    const [form, setForm] = useState(null);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [details, setDetails] = useState(null);

    // Recherche avec délai
    useEffect(() => {
        const timer = setTimeout(() => setSearch(filters.search.trim()), 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Résumé du jour
    useEffect(() => {
        let alive = true;
        setSummaryLoading(true);
        attendanceApi.summary(filters.date)
            .then((response) => { if (alive) setSummary(response?.summary ?? response?.data ?? response); })
            .catch(() => { if (alive) setSummary(null); })
            .finally(() => { if (alive) setSummaryLoading(false); });
        return () => { alive = false; };
    }, [filters.date, refreshId]);

    // Liste des pointages
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        const params = { date: filters.date, page, per_page: PAGE_SIZE };
        if (search) params.search = search;
        if (filters.status !== "all") params.status = filters.status;
        attendanceApi.list(role, params)
            .then((response) => {
                if (!alive) return;
                const result = getRows(response);
                setRows(result.items);
                setPagination(result);
                if (result.lastPage < page) setPage(result.lastPage);
            })
            .catch((err) => { if (alive) { setRows([]); setError(apiError(err)); } })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [role, filters.date, filters.status, search, page, refreshId]);

    const refresh = useCallback(() => setRefreshId((n) => n + 1), []);
    const searchPeople = useCallback((which, value) => attendanceApi.searchPeople(which, value), []);

    const changeFilters = useCallback((part) => {
        setFilters((previous) => ({ ...previous, ...part }));
        setPage(1);
    }, []);

    const resetFilters = () => { setFilters(defaultFilters(today)); setPage(1); };

    function changeRole(nextRole) {
        setRole(nextRole);
        setPage(1);
        setFilters((previous) => ({ ...previous, search: "", status: "all" }));
        setSearch("");
        setDetails(null);
        setNotice("");
    }

    function openForm(mode, record = null) {
        setForm({ role, mode, record });
        setFormError("");
        setDetails(null);
    }

    async function saveAttendance(payload) {
        if (saving) return;
        setSaving(true);
        setFormError("");
        try {
            let response;
            if (payload.mode === "check-in") response = await attendanceApi.checkIn(payload.role, payload);
            else if (payload.mode === "check-out") response = await attendanceApi.checkOut(payload.role, payload.attendance_id, payload);
            else if (payload.mode === "absent" && payload.role === "coaches") response = await attendanceApi.markCoachAbsent(payload);
            else throw new Error("Action non disponible.");
            setForm(null);
            setNotice(response?.message || "Pointage enregistré avec succès.");
            refresh();
        } catch (err) {
            setFormError(err?.response ? apiError(err) : (err?.message || "Impossible d'enregistrer le pointage."));
        } finally {
            setSaving(false);
        }
    }

    const heading = useMemo(() => displayDate(filters.date), [filters.date]);
    const total = pagination.total;
    const Cards = role === "members" ? MemberAttendanceCards : CoachAttendanceCards;

    return (
        <main className="min-h-full bg-slate-50 px-2 py-3 text-slate-900 sm:px-3">
            <div className="mx-auto max-w-[1400px] space-y-4">
                {/* En-tête */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">Gestion des présences</h1>
                        <p className="mt-1 text-[13px] text-slate-500">Entrées, sorties et suivi quotidien de la salle.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* <button type="button" disabled={loading} onClick={refresh} className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-50">
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser
                        </button> */}
                        <button type="button" onClick={() => openForm("check-in")} className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700">
                            <Plus size={16} /> Pointer une entrée
                        </button>
                    </div>
                </header>

                {/* Messages */}
                {notice && (
                    <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1">{notice}</span>
                        <button type="button" aria-label="Masquer le message" onClick={() => setNotice("")} className=" cursor-pointer rounded p-0.5 hover:bg-emerald-100"><X size={14} /></button>
                    </div>
                )}
                {error && (
                    <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1">{error}</span>
                        <button type="button" onClick={refresh} className=" cursor-pointer text-xs font-semibold underline">Réessayer</button>
                    </div>
                )}

                <AttendanceStats summary={summary} loading={summaryLoading} />

                {/* Type de pointage + infos de la liste */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div role="tablist" aria-label="Type de présence" className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button key={id} type="button" role="tab" aria-selected={role === id} onClick={() => changeRole(id)}
                                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${role === id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                                <Icon size={15} /> {label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="font-medium capitalize text-slate-700">{heading}</span>
                        <span>{total == null ? "Total indisponible" : `${total} résultat(s)`}</span>
                        {role === "coaches" && (
                            <button type="button" onClick={() => openForm("absent")} className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-3 py-1.5 font-semibold text-red-700 transition hover:bg-red-100">
                                Signaler absence coach
                            </button>
                        )}
                    </div>
                </div>

                <AttendanceFilters today={today} filters={filters} onChange={changeFilters} onReset={resetFilters} />

                {/* Liste */}
                <section aria-label={role === "members" ? "Pointages des membres" : "Pointages des coachs"}>
                    <Cards records={rows} loading={loading} onView={setDetails} onAction={(record, mode) => openForm(mode, record)} />
                    {pagination.lastPage > 1 && (
                        <nav aria-label="Pagination des présences" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                            <span>Page {pagination.currentPage} / {pagination.lastPage}</span>
                            <div className="flex gap-1.5">
                                <button type="button" disabled={loading || page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className={pagerButton}><ChevronLeft size={14} /> Précédent</button>
                                <button type="button" disabled={loading || page >= pagination.lastPage} onClick={() => setPage((n) => n + 1)} className={pagerButton}>Suivant <ChevronRight size={14} /></button>
                            </div>
                        </nav>
                    )}
                </section>
            </div>

            {form && (
                <AttendanceForm role={form.role} mode={form.mode} record={form.record} date={filters.date} busy={saving} error={formError}
                    onClose={() => { if (!saving) setForm(null); }} onSubmit={saveAttendance} onSearchPeople={searchPeople} />
            )}
            {details && <AttendanceDetails role={role} record={details} onClose={() => setDetails(null)} onAction={(record, mode) => openForm(mode, record)} />}
        </main>
    );
}