import {
  BadgeDollarSign, BookOpen, CalendarCheck2, CalendarDays,
  ClipboardCheck, CreditCard, Dumbbell, MessageSquare,
  PanelsTopLeft, Settings2, ShieldCheck, TicketCheck,
  UserRoundCheck, UsersRound, WalletCards, CircleUserRound,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import {
  DashboardHeader, DashboardShell, DashboardState,
  DistributionChart, InfoCard, QuickLinks, SectionTitle,
  StatGrid, TrendChart, UpcomingSessions,
} from "../../components/dashboard/DashboardKit";

const stats = [
  { key: "members_total", label: "Total membres", icon: UsersRound, to: "/admin/members" },
  { key: "members_active", label: "Membres actifs", icon: ShieldCheck, to: "/admin/members" },
  { key: "coaches_active", label: "Coachs actifs", icon: UserRoundCheck, to: "/admin/coaches" },
  { key: "courses_active", label: "Cours actifs", icon: Dumbbell, to: "/admin/classes" },
  { key: "sessions_upcoming", label: "Séances à venir", icon: CalendarDays, to: "/admin/schedule" },
  { key: "reservations_confirmed", label: "Réservations confirmées", icon: TicketCheck, to: "/admin/reservations" },
  { key: "visits_today", label: "Entrées aujourd'hui", icon: ClipboardCheck, to: "/admin/attendance" },
  { key: "memberships_active", label: "Abonnements actifs", icon: CreditCard, to: "/admin/memberships" },
  { key: "revenue_paid", label: "Encaissements non remboursés", icon: BadgeDollarSign, to: "/admin/payments", unit: "money" },
  { key: "payments_refunded", label: "Paiements remboursés", icon: WalletCards, to: "/admin/payments" },
  { key: "proposals_pending", label: "Propositions en attente", icon: BookOpen, to: "/admin/course-proposals" },
  { key: "unread_messages", label: "Messages non lus", icon: MessageSquare, to: "/admin/messages" },
];

const links = [
  { label: "Gestion membres", to: "/admin/members", icon: UsersRound },
  { label: "Gestion coachs", to: "/admin/coaches", icon: UserRoundCheck },
  { label: "Cours sportifs", to: "/admin/classes", icon: Dumbbell },
  { label: "Propositions de cours", to: "/admin/course-proposals", icon: BookOpen },
  { label: "Planning", to: "/admin/schedule", icon: CalendarDays },
  { label: "Réservations", to: "/admin/reservations", icon: CalendarCheck2 },
  { label: "Présences", to: "/admin/attendance", icon: ClipboardCheck },
  { label: "Tarifs", to: "/admin/tariffs", icon: BadgeDollarSign },
  { label: "Abonnements", to: "/admin/memberships", icon: CreditCard },
  { label: "Paiements", to: "/admin/payments", icon: WalletCards },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare },
  { label: "Contenu du site", to: "/admin/landing-page", icon: PanelsTopLeft },
  { label: "Paramètres", to: "/admin/settings", icon: Settings2 },
  { label: "Mon profil", to: "/admin/profile", icon: CircleUserRound },
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
          <section className="space-y-3">
            <SectionTitle title="Indicateurs clés" subtitle="Chiffres globaux et activité du jour" />
            <StatGrid items={stats} summary={data.summary} />
          </section>

          <section className="space-y-3">
            <SectionTitle title="Analyse de l'activité" subtitle="Évolution sur la période sélectionnée" />
            <div className="grid gap-4 xl:grid-cols-2">
              <TrendChart title="Encaissements" subtitle="Paiements marqués payés, hors remboursements" data={charts.revenue} type="area" money color="#2563eb" />
              <TrendChart title="Réservations" subtitle="Nouvelles inscriptions par période" data={charts.reservations} type="bar" color="#06b6d4" />
              <TrendChart title="Présences à la salle" subtitle="Entrées des membres enregistrées" data={charts.attendance} color="#10b981" />
              <TrendChart title="Nouveaux abonnements" subtitle="Abonnements créés par période" data={charts.memberships} type="bar" color="#8b5cf6" />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <UpcomingSessions items={data.upcoming} to="/admin/schedule" />
            <DistributionChart title="Statuts des paiements" subtitle="Répartition des règlements sur la période" data={charts.payment_status} />
          </div>

          <InfoCard
            title="Suivi administratif"
            text="Consultez les propositions de cours et les messages en attente dans leurs espaces. Les chiffres financiers correspondent aux paiements enregistrés, pas à un rapprochement bancaire."
            to="/admin/payments" linkText="Consulter les paiements"
          />
          <QuickLinks links={links} />
        </>
      )}
    </DashboardShell>
  );
}