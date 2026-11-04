import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, Dumbbell, X } from "lucide-react";
import { apiError, memberApi } from "../../../services/memberApi";

const dateLabel = (value) => value ? new Date(value).toLocaleDateString("fr-MA") : "—";
const money = (value) => value == null ? "—" : `${Number(value).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`;

function DetailSection({ title, icon: Icon, entries, render }) {
    return (
        <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Icon size={17} className="text-blue-600" />{title}</h3>
            {!entries?.length ? <p className="text-sm text-slate-500">Aucune donnée enregistrée.</p> : (
                <div className="space-y-2">{entries.slice(0, 8).map(render)}</div>
            )}
        </section>
    );
}

export default function MemberDetails({ memberId, onClose }) {
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        memberApi.show(memberId).then(({ member }) => {
            if (alive) setMember(member);
        }).catch((err) => {
            if (alive) setError(apiError(err));
        }).finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [memberId]);

    useEffect(() => {
        const escape = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("keydown", escape);
        return () => window.removeEventListener("keydown", escape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <aside role="dialog" aria-modal="true" aria-label="Détails du membre" className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">Détails du membre</h2>
                    <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
                </div>
                <div className="space-y-5 p-6">
                    {loading && <p className="text-sm text-slate-500">Chargement...</p>}
                    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    {member && <>
                        <div className="rounded-xl bg-blue-50 p-5">
                            <p className="text-lg font-bold text-slate-900">{member.name}</p>
                            <p className="mt-1 break-all text-sm text-slate-600">{member.email}</p>
                            <p className="mt-2 text-xs text-slate-500">Téléphone : {member.phone || "—"} · Statut : {member.status} · Ajouté le {dateLabel(member.created_at)}</p>
                        </div>
                        <DetailSection title="Abonnements" icon={CreditCard} entries={member.member_subscriptions} render={(sub) => (
                            <div key={sub.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                                <div className="flex justify-between gap-2 font-medium text-slate-800"><span>{sub.plan?.name || "Abonnement"}</span><span>{sub.status}</span></div>
                                <p className="mt-1 text-xs text-slate-500">{dateLabel(sub.starts_at)} → {dateLabel(sub.ends_at)} · {money(sub.price_at_purchase)}</p>
                            </div>
                        )} />
                        <DetailSection title="Réservations" icon={CalendarDays} entries={member.course_enrollments} render={(entry) => (
                            <div key={entry.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                                <div className="flex justify-between gap-2 font-medium text-slate-800"><span>{entry.session?.course?.name || "Cours"}</span><span>{entry.status}</span></div>
                                <p className="mt-1 text-xs text-slate-500">{dateLabel(entry.session?.start_at)} · {money(entry.price_at_booking)}</p>
                            </div>
                        )} />
                        <DetailSection title="Paiements" icon={Dumbbell} entries={member.payments} render={(payment) => (
                            <div key={payment.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                                <span className="text-slate-700">{payment.method} · {dateLabel(payment.paid_at)}</span>
                                <span className="font-semibold text-slate-900">{money(payment.amount)}</span>
                            </div>
                        )} />
                    </>}
                </div>
            </aside>
        </div>
    );
}
