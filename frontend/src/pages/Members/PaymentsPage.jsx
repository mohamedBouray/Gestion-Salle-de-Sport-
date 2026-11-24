import FrenchDateInput from "../../components/shared/FrenchDateInput";
import { useEffect, useState } from "react";

import {
    Banknote,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    RefreshCw,
    RotateCcw,
    Search,
} from "lucide-react";

import PaymentCard from "../../components/Members/payments/PaymentCard";

import {
    memberPaymentsApi,
    readPaymentsPage,
    formatMoney,
} from "../../services/MemberPaymentsApi";

import { apiError } from "../../services/api";

const COUNTERS = [
    {
        key: "total",
        label: "Total paiements",
        icon: CreditCard,
    },
    {
        key: "simulated",
        label: "Simulés",
        icon: Banknote,
    },
    {
        key: "refunded",
        label: "Remboursés",
        icon: RotateCcw,
    },
    {
        key: "demo_amount",
        label: "Montant simulé",
        icon: Clock3,
        money: true,
    },
];

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({});

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    // Recherche et filtres
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [method, setMethod] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);

    // Etats UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Recherche avec debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Charger les paiements du Member connecte
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError("");

        memberPaymentsApi
            .list(
                {
                    search: query || undefined,
                    status: status || undefined,
                    method: method || undefined,
                    from: from || undefined,
                    to: to || undefined,
                    page,
                    per_page: 9,
                },
                controller.signal
            )
            .then((response) => {
                if (controller.signal.aborted) return;

                const result = readPaymentsPage(response);

                setPayments(result.items);
                setPagination(result);
                setStats(response.stats || {});

                if (page > result.last_page) {
                    setPage(result.last_page);
                }
            })
            .catch((err) => {
                if (controller.signal.aborted) return;

                setError(apiError(err));
                setPayments([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [
        query,
        status,
        method,
        from,
        to,
        page,
        revision,
    ]);

    function refresh() {
        setRevision((value) => value + 1);
    }

    function resetFilters() {
        setSearch("");
        setQuery("");
        setStatus("");
        setMethod("");
        setFrom("");
        setTo("");
        setPage(1);
    }

    const currentPage =
        Number(pagination.current_page) || page;

    const lastPage = Math.max(
        1,
        Number(pagination.last_page) || 1
    );

    return (
        <main className="min-h-full space-y-4 pb-8 text-slate-900 px-4 py-4">
            {/* HEADER */}
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight">
                        Mes paiements
                    </h1>

                    <p className="mt-1 text-xs text-slate-500">
                        Consultez vos règlements et votre historique financier.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refresh}
                    disabled={loading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw
                        size={15}
                        className={loading ? "animate-spin" : ""}
                    />
                    Actualiser
                </button>
            </header>

            <p className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">Espèces : validées uniquement par l'accueil. Les opérations DEMO ne représentent aucun paiement bancaire réel.</p>
            {/* STATISTIQUES */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {COUNTERS.map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.key}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Icon size={18} />
                            </span>

                            <div className="min-w-0">
                                <p className="truncate text-base font-extrabold text-slate-900">
                                    {loading
                                        ? "—"
                                        : item.money
                                            ? formatMoney(stats[item.key])
                                            : stats[item.key] ?? 0}
                                </p>

                                <p className="text-[11px] text-slate-500">
                                    {item.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* RECHERCHE ET FILTRES */}
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                    <label className="relative min-w-[180px] flex-1">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Référence ou formule..."
                            aria-label="Rechercher un paiement"
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
                        />
                    </label>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                        aria-label="Filtrer par statut"
                        className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="paid">Payés</option>
                        <option value="pending">En attente</option>
                        <option value="refunded">Remboursés</option>
                        <option value="simulated">Simulations DEMO</option>
                    </select>

                    <select
                        value={method}
                        onChange={(event) => {
                            setMethod(event.target.value);
                            setPage(1);
                        }}
                        aria-label="Filtrer par méthode"
                        className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700"
                    >
                        <option value="">Toutes les méthodes</option>
                        <option value="cash">Espèces</option>
                        <option value="virement">Virement</option>
                        <option value="other">Autre</option>
                        <option value="demo">Carte simulée — DEMO</option>
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-slate-500">
                        Du
                        <FrenchDateInput
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(event) => {
                                setFrom(event.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
                        />
                    </label>

                    <label className="flex items-center gap-2 text-[11px] text-slate-500">
                        Au
                        <FrenchDateInput
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(event) => {
                                setTo(event.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        Réinitialiser
                    </button>
                </div>
            </section>

            <p className="text-[11px] text-slate-500">
                Les statistiques couvrent tous vos paiements.
                Les filtres s'appliquent à l'historique ci-dessous.
            </p>

            {/* ERREUR */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
                >
                    {error}
                </div>
            )}

            {/* HISTORIQUE */}
            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-extrabold text-slate-900">
                        Historique de mes paiements
                    </h2>

                    {!loading && !error && (
                        <span className="text-xs text-slate-500">
                            {pagination.total} paiement(s)
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="py-12 text-center text-sm text-slate-500">
                        Chargement de vos paiements...
                    </div>
                ) : error ? null : payments.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {payments.map((payment) => (
                            <PaymentCard
                                key={payment.id}
                                payment={payment}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <CreditCard
                            size={28}
                            className="mx-auto text-slate-400"
                        />

                        <p className="mt-3 text-sm font-bold text-slate-800">
                            Aucun paiement trouvé
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Vos règlements apparaîtront ici après
                            leur enregistrement par l'administration.
                        </p>
                    </div>
                )}
            </section>

            {/* PAGINATION */}
            {!loading && !error && lastPage > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                    <span className="text-xs text-slate-500">
                        Page {currentPage} / {lastPage}
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-label="Page précédente"
                            disabled={currentPage <= 1}
                            onClick={() =>
                                setPage((p) => Math.max(1, p - 1))
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            type="button"
                            aria-label="Page suivante"
                            disabled={currentPage >= lastPage}
                            onClick={() =>
                                setPage((p) =>
                                    Math.min(lastPage, p + 1)
                                )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* INFORMATION */}
            <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-[11px] leading-5 text-blue-800">
                Les paiements sont enregistrés par l'administration.
                Pour toute question ou correction, contactez
                l'accueil de Bouray Gym.
            </div>
        </main>
    );
}

