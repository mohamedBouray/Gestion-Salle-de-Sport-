import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCcw, Search, UsersRound, UserRoundCheck, Clock3, UserRoundX } from "lucide-react";
import MembersTable from "../../components/admin/membre/MembersTable";
import MemberForm from "../../components/admin/membre/MemberForm";
import MemberDetails from "../../components/admin/membre/MemberDetails";
import { apiError, memberApi } from "../../services/memberApi";

const statItems = [
    { key: "total", title: "Total membres", icon: UsersRound },
    { key: "active", title: "Actifs", icon: UserRoundCheck },
    { key: "pending", title: "En attente", icon: Clock3 },
    { key: "inactive", title: "Inactifs", icon: UserRoundX },
];

export default function MembersPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [formMember, setFormMember] = useState(undefined);
    const [detailsId, setDetailsId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => { setPage(1); }, [debouncedSearch, status]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        memberApi.list({ search: debouncedSearch, status, page, per_page: 10 })
            .then((result) => {
                if (!alive) return;
                setMembers(result.members.data || []);
                setPagination(result.members);
                setStats(result.stats);
                if (page > result.members.last_page) setPage(Math.max(1, result.members.last_page));
            })
            .catch((err) => { if (alive) setError(apiError(err)); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [debouncedSearch, status, page, reload]);

    function refresh(message = "") {
        setNotice(message);
        setReload((value) => value + 1);
    }

    async function saveMember(payload, id) {
        const result = id ? await memberApi.update(id, payload) : await memberApi.create(payload);
        setFormMember(undefined);
        refresh(result.message || "Membre enregistré.");
    }

    async function resendInvitation(member) {
        setDeletingId(member.id);
        try {
            const result = await memberApi.resendInvitation(member.id);
            refresh(result.message || "Invitation envoyée.");
        } catch (err) {
            setError(apiError(err));
        } finally {
            setDeletingId(null);
        }
    }

    async function deleteMember(member) {
        if (!window.confirm(`Supprimer ${member.name} ? Le compte sera archivé (soft delete).`)) return;
        setDeletingId(member.id);
        try {
            await memberApi.remove(member.id);
            refresh("Membre supprimé avec succès.");
        } catch (err) {
            setError(apiError(err));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="min-h-full bg-white px-4 py-7 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">Administration / Membres</p>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Gestion des membres</h1>
                        <p className="mt-2 text-sm text-slate-500">Gérez les comptes, les accès et les informations des adhérents.</p>
                    </div>
                    <button type="button" onClick={() => setFormMember(null)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                        <Plus size={18} /> Nouveau membre
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {statItems.map(({ key, title, icon: Icon }) => (
                        <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500"><span>{title}</span><Icon size={19} className="text-blue-600" /></div>
                            <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{stats?.[key] ?? '—'}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail ou téléphone..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrer par statut"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
                            <option value="">Tous les statuts</option><option value="active">Actif</option>
                            <option value="pending">En attente</option><option value="inactive">Inactif</option>
                        </select>
                        <button type="button" onClick={() => refresh()} aria-label="Actualiser" title="Actualiser" className="flex h-11 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"><RefreshCcw size={18} /></button>
                    </div>
                </div>

                {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                {notice && <div role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{notice}</div>}

                <MembersTable members={members} loading={loading} onView={(member) => setDetailsId(member.id)}
                    onEdit={(member) => setFormMember(member)} onDelete={deleteMember}
                    onResend={resendInvitation} deletingId={deletingId} />

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>{pagination.total || 0} membre(s) · Page {pagination.current_page || 1} / {pagination.last_page || 1}</span>
                    <div className="flex gap-2">
                        <button type="button" disabled={loading || page <= 1} onClick={() => setPage((n) => n - 1)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40"><ChevronLeft size={16} /> Précédent</button>
                        <button type="button" disabled={loading || page >= pagination.last_page} onClick={() => setPage((n) => n + 1)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Suivant <ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {formMember !== undefined && <MemberForm member={formMember} onClose={() => setFormMember(undefined)} onSave={saveMember} />}
            {detailsId !== null && <MemberDetails memberId={detailsId} onClose={() => setDetailsId(null)} />}
        </div>
    );
}
