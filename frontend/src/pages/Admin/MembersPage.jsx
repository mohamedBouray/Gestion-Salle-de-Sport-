
import { useEffect, useState } from "react";
import {
    Plus, Search, ChevronLeft, ChevronRight,
    UsersRound, UserRoundCheck, UserRoundX,
    Clock3, FileSpreadsheet, LoaderCircle
} from "lucide-react";

import MembersTable from "../../components/admin/membre/MembersTable";
import MemberForm from "../../components/admin/membre/MemberForm";
import MemberDetails from "../../components/admin/membre/MemberDetails";
import { adminApi } from "../../services/AdminApi";
import { apiError } from "../../services/api";

const cards = [
    { key: "total", label: "Total membres", icon: UsersRound },
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
    value ? new Date(value).toLocaleDateString("fr-MA") : "";

export default function MembersPage() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);

    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({});
    const [pagination, setPagination] = useState({});

    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [formMember, setFormMember] = useState(undefined);
    const [detailsId, setDetailsId] = useState(null);
    const [busyId, setBusyId] = useState(null);

    // Recherche avec debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    // Chargement des membres
    useEffect(() => {
        let active = true;

        setLoading(true);
        setError("");

        adminApi.members
            .list({
                search: query,
                status,
                page,
                per_page: 10,
            })
            .then((result) => {
                if (!active) return;

                const list = result.members ?? {};

                setMembers(list.data ?? []);
                setPagination(list);
                setStats(result.stats ?? {});

                if (page > (list.last_page ?? 1)) {
                    setPage(Math.max(1, list.last_page ?? 1));
                }
            })
            .catch((err) => {
                if (active) setError(apiError(err));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [query, status, page, reload]);

    function refresh(message = "") {
        setNotice(message);
        setReload((n) => n + 1);
    }

    // Création / Modification
    async function saveMember(payload, id) {
        const result = id
            ? await adminApi.members.update(id, payload)
            : await adminApi.members.create(payload);

        setFormMember(undefined);
        refresh(result.message || "Membre enregistré.");
    }

    // Actions administrateur
    async function runAction(member, action, message) {
        if (busyId !== null) return;

        setBusyId(member.id);
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

    function toggleStatus(member) {
        if (member.status === "pending") return;

        const blocked = member.status === "active";

        if (
            !window.confirm(
                `${blocked ? "Bloquer" : "Débloquer"} ${member.name} ?`
            )
        ) return;

        runAction(
            member,
            () =>
                adminApi.members.changeStatus(
                    member.id,
                    blocked ? "inactive" : "active"
                ),
            blocked ? "Membre bloqué." : "Membre débloqué."
        );
    }

    function archiveMember(member) {
        if (!window.confirm(`Archiver ${member.name} ?`)) return;

        runAction(
            member,
            () => adminApi.members.remove(member.id),
            "Membre archivé."
        );
    }

    function resendInvitation(member) {
        runAction(
            member,
            () => adminApi.members.resendInvitation(member.id),
            "Invitation renvoyée."
        );
    }

    
    async function exportExcel() {
        if (exporting) return;

        setExporting(true);
        setError("");
        setNotice("");

        try {
            const file = await adminApi.members.exportExcel({
                search: query,
                status,
            });

            const blob = new Blob([file], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            const day = new Date().toISOString().slice(0, 10);
            link.download = `membres-${day}.xlsx`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            setNotice("Fichier Excel téléchargé avec succès.");
        } catch (err) {
            setError(await getExportError(err));
        } finally {
            setExporting(false);
        }
    }


    async function getExportError(err) {
        const responseData = err?.response?.data;

        if (responseData instanceof Blob) {
            try {
                const text = await responseData.text();
                const json = JSON.parse(text);

                if (json.message) {
                    return json.message;
                }
            } catch {
                // Utiliser le message d'erreur standard.
            }
        }

        return apiError(err);
    }

    return (
        <div className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-[1400px] space-y-4">

                {/* HEADER */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
                            Gestion des membres
                        </h1>

                        <p className="mt-1 text-[13px] text-slate-500">
                            Gérez les adhérents, leurs profils et leurs accès.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button"
                            onClick={exportExcel}
                            disabled={exporting || loading}
                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {exporting ? (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <FileSpreadsheet size={15} />
                            )}

                            {exporting ? "Export..." : "Exporter Excel"}
                        </button>

                        <button type="button"
                            onClick={() => setFormMember(null)}
                            className=" cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-700" >
                            <Plus size={15} />
                            Ajouter un membre
                        </button>
                    </div>
                </header>

                {/* STATISTIQUES */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {cards.map(({ key, label, icon: Icon }) => (
                        <div key={key}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-5" >
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

                {/* TABLEAU */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {/* FILTRES */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
                        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                            <Search size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input type="search"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Nom, e-mail ou téléphone..."
                                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[13px] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                            />
                        </div>

                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] outline-none transition focus:border-blue-500 focus:bg-white" >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="pending">En attente</option>
                            <option value="inactive">Bloqués</option>
                        </select>
                    </div>

                    {/* MESSAGES */}
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

                    {/* LISTE MEMBRES */}
                    <MembersTable
                        members={members}
                        loading={loading}
                        busyId={busyId}
                        onView={(member) => setDetailsId(member.id)}
                        onEdit={setFormMember}
                        onResend={resendInvitation}
                        onToggleStatus={toggleStatus}
                        onDelete={archiveMember}
                    />

                    {/* PAGINATION */}
                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
                        <span>
                            {pagination.total ?? 0} membre(s) · Page{" "}
                            {pagination.current_page ?? 1} /{" "}
                            {pagination.last_page ?? 1}
                        </span>

                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                disabled={loading || page <= 1}
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                className=" cursor-pointer inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronLeft size={14} />
                                Précédent
                            </button>

                            <button
                                type="button"
                                disabled={
                                    loading ||
                                    page >= (pagination.last_page ?? 1)
                                }
                                onClick={() => setPage((p) => p + 1)}
                                className=" cursor-pointer inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Suivant
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </footer>
                </section>

                {/* MODAL CREATE / EDIT */}
                {formMember !== undefined && (
                    <MemberForm
                        member={formMember}
                        onClose={() => setFormMember(undefined)}
                        onSave={saveMember}
                    />
                )}

                {/* DETAILS */}
                {detailsId !== null && (
                    <MemberDetails
                        memberId={detailsId}
                        onClose={() => setDetailsId(null)}
                    />
                )}
            </div>
        </div>
    );
}
