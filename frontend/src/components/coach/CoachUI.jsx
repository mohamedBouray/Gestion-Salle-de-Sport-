import { gymDateKey } from "../../utils/gymDates.js";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CalendarDays, Inbox, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { apiError } from "../../services/api";

export function useLoad(load, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    load().then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) { setError(apiError(e)); setData(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // load functions passed as stable module callbacks or closures depending on deps only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, loading, error, refresh: () => setTick((n) => n + 1) };
}

export function Page({ children }) {
  return <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6"><div className="mx-auto max-w-[1400px] space-y-4">{children}</div></main>;
}

export function Head({ title, subtitle, onRefresh, loading = false, action }) {
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="min-w-0"><h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1><p className="mt-1 text-xs leading-5 text-slate-500 sm:text-[13px]">{subtitle}</p></div>
    <div className="flex gap-2">{action}{onRefresh && <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Actualiser</button>}</div>
  </div>;
}

export function Panel({ title, note, children, className = "" }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
    {(title || note) && <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-[15px] font-bold text-slate-900">{title}</h2>{note && <span className="text-xs text-slate-500">{note}</span>}</div>}{children}
  </section>;
}

export function Stat({ icon: Icon, label, value, href }) {
  const inner = <><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18}/></div><div className="min-w-0"><p className="text-xl font-extrabold leading-none text-slate-900">{value ?? "—"}</p><p className="mt-1.5 text-xs text-slate-500">{label}</p></div>{href && <ArrowRight size={14} className="ml-auto shrink-0 text-slate-400"/>}</>;
  const cn = "flex min-h-[85px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200";
  return href ? <Link to={href} className={cn}>{inner}</Link> : <div className={cn}>{inner}</div>;
}

export function ErrorBox({ text }) { return text ? <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"><AlertCircle size={16}/>{text}</div> : null; }
export function Notice({ text }) { return text ? <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{text}</div> : null; }
export function Wait({ loading }) { return loading ? <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin"/> Chargement des données...</div> : null; }
export function Empty({ title = "Aucun résultat", detail = "Aucune donnée à afficher pour le moment." }) { return <div className="flex flex-col items-center gap-2 py-10 text-center"><Inbox size={24} className="text-slate-300"/><p className="text-sm font-semibold text-slate-700">{title}</p><p className="max-w-sm text-xs leading-5 text-slate-500">{detail}</p></div>; }
export function SearchBox({ value, onChange, placeholder = "Rechercher..." }) { return <div className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-64"/></div>; }

export function Badge({ status }) {
  const states = {
    active: ["Actif", "bg-emerald-50 text-emerald-700"], scheduled: ["Programmée", "bg-blue-50 text-blue-700"], completed: ["Terminée", "bg-slate-100 text-slate-600"], cancelled: ["Annulée", "bg-rose-50 text-rose-700"],
    inactive: ["Inactif", "bg-slate-100 text-slate-600"], pending: ["En attente", "bg-amber-50 text-amber-700"],
    confirmed: ["Réservé", "bg-blue-50 text-blue-700"], attended: ["Présent", "bg-emerald-50 text-emerald-700"],
    accepted: ["Acceptée", "bg-emerald-50 text-emerald-700"], rejected: ["Refusée", "bg-rose-50 text-rose-700"],
  };
  const [label, style] = states[status] || [status || "—", "bg-slate-100 text-slate-600"];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{label}</span>;
}

export const dateTime = (value) => value ? new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
export const dayTime = (value) => value ? new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
export const dateKey = gymDateKey;
export const monogram = (value) => (value || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
export function Detail({ icon: Icon, children }) { return <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><Icon size={14} className="shrink-0 text-slate-400"/><span className="truncate">{children}</span></span>; }
export function PeriodNote() { return <span className="inline-flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={13}/> Données de votre activité</span>; }
