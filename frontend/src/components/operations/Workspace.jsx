import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw, SearchX } from "lucide-react";
export const Card = ({ children, className = "" }) => <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
export const Field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export function Title({ kicker, title, description, actions }) {
    return <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">{kicker}</p><h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{actions}</header>;
}
export function Feedback({ error, success }) {
    return <>{error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18}/>{error}</p>}{success && <p role="status" className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 size={18}/>{success}</p>}</>;
}
export const Shell = ({ children }) => <div className="min-h-full bg-[#f6f8fc] px-2 py-3 text-slate-900 sm:px-3 lg:px-4"><div className="mx-auto max-w-[1450px] space-y-6">{children}</div></div>;
export function Wait({ loading, empty, children }) {
    if (loading) return <Card className="flex min-h-48 items-center justify-center"><LoaderCircle className="animate-spin text-blue-600" size={30}/></Card>;
    if (empty) return <Card className="flex min-h-40 flex-col items-center justify-center gap-2 text-sm text-slate-500"><SearchX size={24}/>Aucune donnée disponible.</Card>;
    return children;
}
export function Refresh({ onClick }) {
    return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16}/> Actualiser</button>;
}
export const listOf = (result, key) => {
    const val = result?.[key] ?? result?.data ?? result;
    return Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
};
export const displayDate = (iso) => iso ? new Intl.DateTimeFormat("fr-MA", { timeZone: "Africa/Casablanca", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "—";
export const money = (num) => `${Number(num || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
