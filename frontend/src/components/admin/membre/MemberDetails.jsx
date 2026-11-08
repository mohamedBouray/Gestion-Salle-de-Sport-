import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, Wallet, X } from "lucide-react";
import { adminApi } from "../../../services/AdminApi";
import { apiError } from "../../../services/api";

const date = (v) => v ? new Date(v).toLocaleDateString("fr-MA") : "—";
const money = (v) => v == null ? "—" : `${Number(v).toFixed(2)} MAD`;
const statuses = { active: "Actif", inactive: "Bloqué", pending: "En attente" };

function Section({ title, icon: Icon, items = [], children }) {
    return (
        <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Icon size={17} className="text-blue-600" /> {title}
            </h3>
            {items.length ? items.slice(0, 8).map(children) : (
                <p className="text-sm text-slate-400">Aucune donnée enregistrée.</p>
            )}
        </section>
    );
}

export default function MemberDetails({ memberId, onClose }) {
    const [member, setMember] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setMember(null);
        setError("");

        adminApi.members.show(memberId)
            .then(({ member }) => active && setMember(member))
            .catch((e) => active && setError(apiError(e)));

        return () => { active = false; };
    }, [memberId]);

    useEffect(() => {
        const close = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <aside role="dialog" aria-modal="true" aria-label="Détails du membre"
                className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl sm:p-6">
                <header className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Détails du membre</h2>
                    <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button>
                </header>

                {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                {!member && !error && <p className="text-sm text-slate-500">Chargement...</p>}

                {member && (
                    <div className="space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <h3 className="font-bold text-slate-900">{member.name}</h3>
                            <p className="break-all text-sm text-slate-500">{member.email}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                {member.phone || "Sans téléphone"} · {statuses[member.status] || member.status} · {date(member.created_at)}
                            </p>
                        </div>

                        <Section title="Abonnements" icon={CreditCard} items={member.member_subscriptions}>
                            {(s) => (
                                <div key={s.id} className="mb-2 rounded-lg bg-slate-50 p-3 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <strong>{s.plan?.name || "Abonnement"}</strong><span>{s.status}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{date(s.starts_at)} – {date(s.ends_at)} · {money(s.price_at_purchase)}</p>
                                </div>
                            )}
                        </Section>

                        <Section title="Réservations" icon={CalendarDays} items={member.course_enrollments}>
                            {(r) => (
                                <div key={r.id} className="mb-2 rounded-lg bg-slate-50 p-3 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <strong>{r.session?.course?.name || "Cours"}</strong><span>{r.status}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{date(r.session?.start_at)} · {money(r.price_at_booking)}</p>
                                </div>
                            )}
                        </Section>

                        <Section title="Paiements" icon={Wallet} items={member.payments}>
                            {(p) => (
                                <div key={p.id} className="mb-2 flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                                    <span>{p.method} · {date(p.paid_at)}</span><strong>{money(p.amount)}</strong>
                                </div>
                            )}
                        </Section>
                    </div>
                )}
            </aside>
        </div>
    );
}
