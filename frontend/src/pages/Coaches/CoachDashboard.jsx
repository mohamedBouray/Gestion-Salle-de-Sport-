import {
  CalendarDays, ClipboardCheck, CircleUserRound,
  Dumbbell, TicketCheck, UsersRound, CheckCheck,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import {
  DashboardHeader, DashboardShell, DashboardState,
  DistributionChart, InfoCard, QuickLinks, SectionTitle,
  StatGrid, TrendChart, UpcomingSessions,
} from "../../components/dashboard/DashboardKit";

const stats = [
  { key: "courses_active", label: "Mes cours actifs", icon: Dumbbell, to: "/coach/classes" },
  { key: "sessions_upcoming", label: "Séances à venir", icon: CalendarDays, to: "/coach/schedule" },
  { key: "members_unique", label: "Mes membres distincts", icon: UsersRound, to: "/coach/members" },
  { key: "reservations_confirmed", label: "Inscriptions confirmées", icon: TicketCheck, to: "/coach/members" },
  { key: "sessions_completed", label: "Séances terminées", icon: CheckCheck, to: "/coach/schedule" },
  { key: "attendance_rate", label: "Taux de présence pointée", icon: ClipboardCheck, to: "/coach/attendance", unit: "percent" },
];

const links = [
  { label: "Mes cours", to: "/coach/classes", icon: Dumbbell },
  { label: "Mon planning", to: "/coach/schedule", icon: CalendarDays },
  { label: "Mes membres", to: "/coach/members", icon: UsersRound },
  { label: "Présences des séances", to: "/coach/attendance", icon: ClipboardCheck },
  { label: "Mon profil", to: "/coach/profile", icon: CircleUserRound },
];

export default function CoachDashboard() {
  const { data, period, setPeriod, loading, error, refresh } = useDashboard("coach");
  const charts = data?.charts || {};

  return (
    <DashboardShell>
      <DashboardHeader
        title="Mon tableau de bord"
        subtitle="Retrouvez vos séances, vos participants et vos présences."
        period={period} setPeriod={setPeriod} refresh={refresh} loading={loading}
      />
      <DashboardState loading={loading} error={error} onRetry={refresh} />
      {!loading && !error && data && (
        <>
          <section className="space-y-3">
            <SectionTitle title="Mon activité" subtitle="Statistiques limitées à vos propres cours et séances" />
            <StatGrid items={stats} summary={data.summary} />
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <TrendChart title="Séances animées" subtitle="Séances programmées sur la période" data={charts.sessions} type="bar" color="#2563eb" />
            <TrendChart title="Inscriptions aux cours" subtitle="Réservations de vos séances" data={charts.reservations} color="#06b6d4" />
            <TrendChart title="Présences des participants" subtitle="Participants marqués présents" data={charts.attendance} color="#10b981" />
            <DistributionChart title="Présences et absences" subtitle="Pointages réalisés sur vos séances" data={charts.attendance_status} />
          </div>

          <UpcomingSessions items={data.upcoming} title="Mes prochaines séances" to="/coach/schedule" />
          <InfoCard
            title="Pointage des membres"
            text="Les indicateurs de présence utilisent les présences des séances enregistrées par le Coach, et non les entrées/sorties générales à l'accueil."
            to="/coach/attendance" linkText="Ouvrir les présences"
          />
          <QuickLinks links={links} />
        </>
      )}
    </DashboardShell>
  );
}