import {
  BookOpenCheck, CalendarDays, CircleUserRound,
  Clock3, CreditCard, ShieldCheck, TicketCheck,
  WalletCards, Activity, ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../hooks/useDashboard";
import {
  DashboardHeader, DashboardShell, DashboardState,
  DistributionChart, formatMetric, InfoCard, QuickLinks,
  SectionTitle, StatGrid, TrendChart, UpcomingSessions,
} from "../../components/dashboard/DashboardKit";

const stats = [
  { key: "active_memberships", label: "Abonnements actifs", icon: ShieldCheck, to: "/member/membership" },
  { key: "upcoming_reservations", label: "Réservations à venir", icon: TicketCheck, to: "/member/reservations" },
  { key: "reservations_total", label: "Mes réservations", icon: CalendarDays, to: "/member/reservations" },
  { key: "visits_month", label: "Visites ce mois", icon: ClipboardCheck, to: "/member/attendance" },
  { key: "visits_total", label: "Total visites", icon: Clock3, to: "/member/attendance" },
  { key: "simulated_total", label: "Montant simulé", icon: WalletCards, to: "/member/payments", unit: "money" },
];

const links = [
  { label: "Explorer les cours", to: "/member/classes", icon: BookOpenCheck },
  { label: "Planning", to: "/member/schedule", icon: CalendarDays },
  { label: "Mes réservations", to: "/member/reservations", icon: TicketCheck },
  { label: "Mon abonnement", to: "/member/membership", icon: ShieldCheck },
  { label: "Mes présences", to: "/member/attendance", icon: Activity },
  { label: "Mes paiements", to: "/member/payments", icon: CreditCard },
  { label: "Mon profil", to: "/member/profile", icon: CircleUserRound },
];

function SubscriptionPanel({ subscription }) {
  const active = subscription?.access_now === true;
  const daysLeft = Number(subscription?.days_remaining);
  const showDays = active && Number.isFinite(daysLeft) && daysLeft >= 0;
  const expiry = subscription?.ends_at
    ? new Intl.DateTimeFormat("fr-MA", {
        day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
      }).format(new Date(`${String(subscription.ends_at).slice(0, 10)}T12:00:00Z`))
    : "—";

  return (
    <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
      <div className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={20} /> Mon abonnement</div>
      <p className="mt-4 text-lg font-extrabold">{subscription?.plan_name || "Aucune formule active"}</p>
      <p className="mt-1 text-xs text-blue-100">{active ? "Accès autorisé aujourd'hui" : "Aucun accès actif aujourd'hui"}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-white/10 p-3">
        <div><p className="text-[11px] text-blue-100">Fin de validité</p><p className="mt-1 text-xs font-bold">{expiry}</p></div>
        <div><p className="text-[11px] text-blue-100">Jours restants</p><p className="mt-1 text-xs font-bold">{showDays ? formatMetric(daysLeft) : "—"}</p></div>
      </div>
      <Link to="/member/membership" className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Voir mon abonnement</Link>
    </section>
  );
}

export default function MemberDashboard() {
  const { data, period, setPeriod, loading, error, refresh } = useDashboard("member");
  const charts = data?.charts || {};

  return (
    <DashboardShell>
      <DashboardHeader
        title="Mon espace sportif"
        subtitle="Vos réservations, visites, abonnements et paiements en un seul endroit."
        period={period} setPeriod={setPeriod} refresh={refresh} loading={loading}
      />
      <DashboardState loading={loading} error={error} onRetry={refresh} />
      {!loading && !error && data && (
        <>
          <section className="space-y-3">
            <SectionTitle title="Mon récapitulatif" subtitle="Données personnelles uniquement" />
            <StatGrid items={stats} summary={data.summary} />
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_1.4fr]">
            <SubscriptionPanel subscription={data.subscription} />
            <UpcomingSessions items={data.upcoming} title="Mes prochaines réservations" to="/member/reservations" />
          </div>

          <section className="space-y-3">
            <SectionTitle title="Ma progression" subtitle="Évolution de votre activité sur la période sélectionnée" />
            <div className="grid gap-4 xl:grid-cols-2">
              <TrendChart title="Mes visites à la salle" subtitle="Entrées enregistrées à l'accueil" data={charts.visits} color="#2563eb" />
              <TrendChart title="Mes réservations" subtitle="Réservations créées par période" data={charts.reservations} type="bar" color="#06b6d4" />
              <TrendChart title="Mes règlements simulés" subtitle="Hors remboursements simulés" data={charts.simulated_payments} color="#10b981" money />
              <DistributionChart title="Statuts de mes réservations" subtitle="Répartition sur la période" data={charts.reservation_status} />
            </div>
          </section>

          <InfoCard
            title="Prêt pour votre prochaine séance ?"
            text="Consultez les cours disponibles et réservez votre place. Les disponibilités et les règles d'accès sont vérifiées lors de la réservation."
            to="/member/classes" linkText="Explorer les cours"
          />
          <QuickLinks links={links} />
        </>
      )}
    </DashboardShell>
  );
}