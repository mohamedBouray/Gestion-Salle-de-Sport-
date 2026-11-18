
import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, Wallet, X, UserRound, Phone, Mail, CalendarClock, LoaderCircle} from "lucide-react";

import { adminApi } from "../../../services/AdminApi";
import { apiError } from "../../../services/api";

const date = (value) =>
    value ? new Date(value).toLocaleDateString("fr-MA") : "—";

const money = (value) =>
    value == null ? "—" : `${Number(value).toFixed(2)} MAD`;

const statuses = {
    active: "Actif",
    inactive: "Bloqué",
    pending: "En attente",
};

const statusColors = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const initials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return "?";

    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

function Section({title,icon: Icon, items = [],children,}) {
    const data = Array.isArray(items) ? items : [];

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon size={16} />
                    </span>

                    <h3 className="text-[13px] font-bold text-slate-800">
                        {title}
                    </h3>
                </div>

                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                    {data.length}
                </span>
            </div>

            <div className="space-y-2 p-4">
                {data.length ? (
                    data.slice(0, 8).map(children)
                ) : (
                    <p className="py-3 text-center text-xs text-slate-400">
                        Aucune donnée enregistrée.
                    </p>
                )}
            </div>
        </section>
    );
}

export default function MemberDetails({ memberId, onClose,}) {
    const [member, setMember] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        setMember(null);
        setError("");

        adminApi.members
            .show(memberId)
            .then(({ member }) => {
                if (active) setMember(member);
            })
            .catch((err) => {
                if (active) setError(apiError(err));
            });

        return () => {
            active = false;
        };
    }, [memberId]);

    useEffect(() => {
        const close = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", close);

        return () =>
            window.removeEventListener("keydown", close);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/50"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}>
            <aside role="dialog"
                aria-modal="true"
                aria-label="Détails du membre"
                className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-slate-50 shadow-2xl" >
                {/* HEADER */}
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <div>
                        <h2 className="text-lg font-extrabold text-[#0f1b33]">
                            Détails du membre
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Informations et historique de l'adhérent
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className=" cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* CONTENT */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">

                    {error && (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    {!member && !error && (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                            <LoaderCircle
                                size={18}
                                className="animate-spin text-blue-600"
                            />
                            Chargement...
                        </div>
                    )}

                    {member && (
                        <>
                            {/* PROFIL */}
                            <section className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start gap-3">

                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                                        {initials(member.name)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base font-bold text-slate-900">
                                            {member.name}
                                        </h3>

                                        <p className="mt-1 break-all text-xs text-slate-500">
                                            {member.email}
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                statusColors[member.status] ||
                                                "border-slate-200 bg-slate-50 text-slate-600"
                                            }`}
                                        >
                                            {statuses[member.status] ||
                                                member.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">

                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Phone
                                            size={15}
                                            className="shrink-0 text-blue-600"
                                        />
                                        {member.phone || "Sans téléphone"}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <CalendarClock
                                            size={15}
                                            className="shrink-0 text-blue-600"
                                        />
                                        Inscrit le {date(member.created_at)}
                                    </div>
                                </div>
                            </section>

                            {/* ABONNEMENTS */}
                            <Section
                                title="Abonnements"
                                icon={CreditCard}
                                items={member.member_subscriptions}
                            >
                                {(subscription) => (
                                    <div
                                        key={subscription.id}
                                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <strong className="text-xs font-semibold text-slate-800">
                                                {subscription.plan?.name ||
                                                    "Abonnement"}
                                            </strong>

                                            <span className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-600">
                                                {subscription.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {date(subscription.starts_at)}
                                            {" – "}
                                            {date(subscription.ends_at)}
                                        </p>

                                        <p className="mt-1 text-xs font-bold text-blue-600">
                                            {money(subscription.price_at_purchase)}
                                        </p>
                                    </div>
                                )}
                            </Section>

                            {/* RESERVATIONS */}
                            <Section
                                title="Réservations"
                                icon={CalendarDays}
                                items={member.course_enrollments}
                            >
                                {(reservation) => (
                                    <div
                                        key={reservation.id}
                                        className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <strong className="text-xs font-semibold text-slate-800">
                                                {reservation.session?.course?.name ||
                                                    "Cours"}
                                            </strong>

                                            <span className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-600">
                                                {reservation.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {date(reservation.session?.start_at)}
                                        </p>

                                        <p className="mt-1 text-xs font-bold text-blue-600">
                                            {money(reservation.price_at_booking)}
                                        </p>
                                    </div>
                                )}
                            </Section>

                            {/* PAIEMENTS */}
                            <Section
                                title="Paiements"
                                icon={Wallet}
                                items={member.payments}
                            >
                                {(payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">
                                                {payment.method || "Paiement"}
                                            </p>

                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {date(payment.paid_at)}
                                            </p>
                                        </div>

                                        <strong className="text-xs font-bold text-blue-600">
                                            {money(payment.amount)}
                                        </strong>
                                    </div>
                                )}
                            </Section>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className=" cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Fermer
                    </button>
                </footer>
            </aside>
        </div>
    );
}
