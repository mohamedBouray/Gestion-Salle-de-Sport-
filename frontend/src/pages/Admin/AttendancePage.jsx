import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarCheck2, ChevronLeft, ChevronRight, Plus, RefreshCw, UserRoundCheck, UsersRound } from "lucide-react";
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

export default function AttendancePage() {
    const today = dateKey();
    const [role, setRole] = useState("members");
    const [filters, setFilters] = useState({ date: today, search: "", status: "all" });
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [refreshId, setRefreshId] = useState(0);
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: null });
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [form, setForm] = useState(null);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(filters.search.trim()), 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        let alive = true;
        setSummaryLoading(true);
        attendanceApi.summary(filters.date).then((response) => {
            if (alive) setSummary(response?.summary ?? response?.data ?? response);
        }).catch(() => { if (alive) setSummary(null); }).finally(() => { if (alive) setSummaryLoading(false); });
        return () => { alive = false; };
    }, [filters.date, refreshId]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        const params = { date: filters.date, page, per_page: PAGE_SIZE };
        if (search) params.search = search;
        if (filters.status !== "all") params.status = filters.status;
        attendanceApi.list(role, params).then((response) => {
            if (!alive) return;
            const result = getRows(response);
            setRows(result.items);
            setPagination(result);
            if (result.lastPage < page) setPage(result.lastPage);
        }).catch((err) => { if (alive) { setRows([]); setError(apiError(err)); } }).finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [role, filters.date, filters.status, search, page, refreshId]);

    const changeFilters = useCallback((part) => {
        setFilters((previous) => ({ ...previous, ...part }));
        setPage(1);
    }, []);

    const refresh = useCallback(() => setRefreshId((n) => n + 1), []);
    const searchPeople = useCallback((which, value) => attendanceApi.searchPeople(which, value), []);

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
        } finally { setSaving(false); }
    }

    const heading = useMemo(() => displayDate(filters.date), [filters.date]);
    const total = pagination.total;
    const Cards = role === "members" ? MemberAttendanceCards : CoachAttendanceCards;

    return (
        <div className="space-y-4 px-4 py-4 pb-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"><CalendarCheck2 size={22} /></div>
                    <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-blue-600">Bouray Gym · Administration</p><h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Gestion des présences</h1><p className="text-xs text-slate-500">Entrées, sorties et suivi quotidien</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={loading} onClick={refresh} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Actualiser</button>
                    <button type="button" onClick={() => openForm("check-in")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700"><Plus size={16} /> Pointer une entrée</button>
                </div>
            </div>

            {notice && <div role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</div>}
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={17} className="shrink-0" /><span>{error} — Vérifier les endpoints Laravel des présences.</span></div>}

            <AttendanceStats summary={summary} loading={summaryLoading} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div role="tablist" aria-label="Type de présence" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
                    <button role="tab" type="button" aria-selected={role === "members"} onClick={() => changeRole("members")}
                        className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${role === "members" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}><UsersRound size={16} /> Membres</button>
                    <button role="tab" type="button" aria-selected={role === "coaches"} onClick={() => changeRole("coaches")}
                        className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${role === "coaches" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}><UserRoundCheck size={16} /> Coachs</button>
                </div>
                {role === "coaches" && <button type="button" onClick={() => openForm("absent")} className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Signaler absence coach</button>}
            </div>

            <AttendanceFilters today={today} filters={filters} onChange={changeFilters} onReset={() => { setFilters({ date: today, search: "", status: "all" }); setPage(1); }} />

            <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-sm font-extrabold text-slate-900">{role === "members" ? "Pointages des membres" : "Pointages des coachs"}</h2><p className="mt-0.5 text-xs capitalize text-slate-500">{heading}</p></div><span className="text-xs font-medium text-slate-500">{total == null ? "Total indisponible" : `${total} résultat(s)`}</span></div>
                <Cards records={rows} loading={loading} onView={setDetails} onAction={(record, mode) => openForm(mode, record)} />
                {pagination.lastPage > 1 && <nav aria-label="Pagination des présences" className="mt-4 flex items-center justify-center gap-3"><button disabled={loading || page <= 1} onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronLeft size={18} /></button><span className="text-xs font-semibold text-slate-600">Page {pagination.currentPage} / {pagination.lastPage}</span><button disabled={loading || page >= pagination.lastPage} onClick={() => setPage((n) => n + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronRight size={18} /></button></nav>}
            </section>

            {form && <AttendanceForm role={form.role} mode={form.mode} record={form.record} date={filters.date} busy={saving} error={formError} onClose={() => { if (!saving) setForm(null); }} onSubmit={saveAttendance} onSearchPeople={searchPeople} />}
            {details && <AttendanceDetails role={role} record={details} onClose={() => setDetails(null)} onAction={(record, mode) => openForm(mode, record)} />}
        </div>
    );
}
