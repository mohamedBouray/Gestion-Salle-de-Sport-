import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, CalendarDays, ChevronRight,
  CircleAlert, RefreshCw, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

const PALETTE = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"];
const compact = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 });
const currency = new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMetric(value, unit) {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  if (unit === "money") return `${currency.format(number)} MAD`;
  if (unit === "percent") return `${number.toLocaleString("fr-MA", { maximumFractionDigits: 1 })} %`;
  return compact.format(number);
}

export function DashboardShell({ children }) {
  return (
    <div className="min-h-full bg-[#f8fafc] px-3 py-5 text-slate-900 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-5">{children}</div>
    </div>
  );
}

export function DashboardHeader({ title, subtitle, period, setPeriod, refresh, loading }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.15em] text-blue-600">
          Bouray Gym · Statistiques
        </p>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="dashboard-period">Période</label>
        <select
          id="dashboard-period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="12m">12 derniers mois</option>
        </select>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          title="Actualiser les statistiques"
          aria-label="Actualiser le tableau de bord"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-blue-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

export function DashboardState({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div role="status" className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
        <RefreshCw className="mr-2 animate-spin text-blue-600" size={17} /> Chargement des statistiques...
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-white px-4 py-5">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
          <CircleAlert size={17} /> Impossible de charger les statistiques
        </div>
        <p className="mt-1 text-xs text-slate-600">{error}</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Réessayer</button>
      </div>
    );
  }
  return null;
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function StatGrid({ items, summary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map(({ key, label, icon: Icon, to, unit }) => (
        <Link
          to={to}
          key={key}
          className="group min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-blue-200 hover:shadow-sm sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18} /></span>
            <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
          </div>
          <p className="mt-3 break-words text-[11px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 break-words text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {formatMetric(summary?.[key], unit)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function ChartFrame({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <SectionTitle title={title} subtitle={subtitle} />
        <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><TrendingUp size={16} /></span>
      </div>
      {children}
    </section>
  );
}

const moneyTooltip = (value) => formatMetric(value, "money");
const numberTooltip = (value) => formatMetric(value);

export function TrendChart({ title, subtitle, data = [], type = "area", color = "#2563eb", money = false }) {
  const items = Array.isArray(data) ? data.map((entry) => ({
    label: String(entry.label ?? ""),
    value: Number(entry.value) || 0,
  })) : [];
  const tooltipValue = money ? moneyTooltip : numberTooltip;
  const axisTick = { fill: "#94a3b8", fontSize: 10 };

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-xs text-slate-400">Aucune donnée pour cette période</div>
      ) : (
        <div className="h-56 w-full sm:h-64" role="img" aria-label={`Graphique : ${title}`}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={items} margin={{ top: 5, right: 2, bottom: 5, left: -20 }}>
                <CartesianGrid vertical={false} stroke="#edf2f7" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={tooltipValue} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
                <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} maxBarSize={35} name="Valeur" />
              </BarChart>
            ) : (
              <AreaChart data={items} margin={{ top: 5, right: 2, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id={`gradient-${title.replace(/[^a-z0-9]/gi, "-")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf2f7" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={tooltipValue} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#gradient-${title.replace(/[^a-z0-9]/gi, "-")})`} name="Valeur" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}

export function DistributionChart({ title, subtitle, data = [] }) {
  const items = (Array.isArray(data) ? data : [])
    .map((entry) => ({ label: String(entry.label ?? ""), value: Number(entry.value) || 0 }))
    .filter((entry) => entry.value > 0);

  return (
    <ChartFrame title={title} subtitle={subtitle}>
      {!items.length ? (
        <div className="flex h-56 items-center justify-center text-xs text-slate-400">Aucune donnée pour cette période</div>
      ) : (
        <div className="grid items-center gap-1 sm:grid-cols-[minmax(0,1fr)_155px]">
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={items} cx="50%" cy="50%" innerRadius="60%" outerRadius="83%" paddingAngle={3} dataKey="value" nameKey="label" stroke="none">
                  {items.map((entry, index) => <Cell key={`${entry.label}-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatMetric(value)} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {items.map((entry, index) => (
              <div key={`${entry.label}-${index}`} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[index % PALETTE.length] }} />
                  <span className="truncate">{entry.label}</span>
                </span>
                <strong className="text-slate-900">{formatMetric(entry.value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartFrame>
  );
}

export function QuickLinks({ links }) {
  return (
    <section className="space-y-3">
      <SectionTitle title="Accès rapide" subtitle="Toutes vos pages principales" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {links.map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">
            <Icon size={16} className="shrink-0 text-blue-500" />
            <span className="min-w-0 truncate">{label}</span>
            <ChevronRight size={13} className="ml-auto shrink-0 text-slate-300 group-hover:text-blue-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function UpcomingSessions({ items = [], title = "Prochaines séances", to }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <SectionTitle title={title} subtitle="Données des séances programmées" />
        <Link to={to} className="text-[11px] font-bold text-blue-600 hover:underline">Voir tout</Link>
      </div>
      {!items?.length ? (
        <div className="flex min-h-24 items-center justify-center gap-2 text-xs text-slate-400"><CalendarDays size={15} /> Aucune séance à venir</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.slice(0, 5).map((session, index) => {
            const date = session.start_at ? new Date(session.start_at) : null;
            const when = date && !Number.isNaN(date.getTime())
              ? new Intl.DateTimeFormat("fr-MA", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  timeZone: "Africa/Casablanca",
                }).format(date)
              : "Date à confirmer";
            return (
              <div key={`${session.id ?? "item"}-${index}`} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><CalendarDays size={17} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{session.course_name || "Séance sportive"}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{session.location || session.coach_name || "Bouray Gym"}</p>
                </div>
                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600">{when}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function InfoCard({ title, text, to, linkText }) {
  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
      <div className="flex items-center gap-2 text-blue-700"><Activity size={17} /><h2 className="text-sm font-extrabold">{title}</h2></div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{text}</p>
      {to && <Link to={to} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline">{linkText || "Voir détails"}<ArrowRight size={13} /></Link>}
    </section>
  );
}