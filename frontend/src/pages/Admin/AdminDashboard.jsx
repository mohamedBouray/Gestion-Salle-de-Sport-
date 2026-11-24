import {
    BadgeDollarSign, BookOpen, CalendarDays, ClipboardCheck,
    CreditCard, MessageSquare, ShieldCheck, TicketCheck,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import {
    DashboardHeader, DashboardShell, DashboardState,
    DistributionChart, StatGrid, TrendChart, UpcomingSessions,
} from "../../components/dashboard/DashboardKit";

// Indicateurs clés : 8 chiffres seulement (le reste est visible dans les graphiques et les pages dédiées)
const stats = [
    { key: "simulated_total", label: "Montant simulé", icon: BadgeDollarSign, to: "/admin/payments", unit: "money" },
    { key: "members_active", label: "Membres actifs", icon: ShieldCheck, to: "/admin/members" },
    { key: "memberships_active", label: "Abonnements actifs", icon: CreditCard, to: "/admin/memberships" },
    { key: "reservations_confirmed", label: "Réservations confirmées", icon: TicketCheck, to: "/admin/reservations" },
    { key: "visits_today", label: "Entrées aujourd'hui", icon: ClipboardCheck, to: "/admin/attendance" },
    { key: "sessions_upcoming", label: "Séances à venir", icon: CalendarDays, to: "/admin/schedule" },
    { key: "proposals_pending", label: "Propositions en attente", icon: BookOpen, to: "/admin/course-proposals" },
    { key: "unread_messages", label: "Messages non lus", icon: MessageSquare, to: "/admin/messages" },
];

export default function AdminDashboard() {
    const { data, period, setPeriod, loading, error, refresh } = useDashboard("admin");
    const charts = data?.charts || {};

    return (
        <DashboardShell>
            <DashboardHeader
                title="Tableau de bord administrateur"
                subtitle="Vue globale de votre salle : activité, abonnements et finances."
                period={period} setPeriod={setPeriod} refresh={refresh} loading={loading}
            />
            <DashboardState loading={loading} error={error} onRetry={refresh} />

            {!loading && !error && data && (
                <>
                    <StatGrid items={stats} summary={data.summary} />

                    {/* Finances : graphique principal + répartition des paiements */}
                    <div className="grid gap-4 xl:grid-cols-3">
                        <div className="min-w-0 xl:col-span-2">
                            <TrendChart title="Règlements simulés" subtitle="Hors remboursements simulés" data={charts.simulated_payments} type="area" money color="#2563eb" />
                        </div>
                        <div className="min-w-0">
                            <DistributionChart title="Statuts des paiements" subtitle="Répartition sur la période" data={charts.payment_status} />
                        </div>
                    </div>

                    {/* Activité */}
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        <TrendChart title="Réservations" subtitle="Nouvelles inscriptions" data={charts.reservations} type="bar" color="#06b6d4" />
                        <TrendChart title="Présences à la salle" subtitle="Entrées des membres" data={charts.attendance} color="#10b981" />
                        <TrendChart title="Nouveaux abonnements" subtitle="Abonnements créés" data={charts.memberships} type="bar" color="#8b5cf6" />
                    </div>

                    <UpcomingSessions items={data.upcoming} to="/admin/schedule" />
                </>
            )}
        </DashboardShell>
    );
}