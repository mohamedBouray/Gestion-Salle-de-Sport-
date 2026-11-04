import { ArrowDownRight, ArrowUpRight, ChevronRight, Clock3, MoreHorizontal } from "lucide-react";

const card = "rounded-xl border border-white/[0.08] bg-[#121A2B]";
const button = "inline-flex items-center gap-2 rounded-lg bg-[#165DFF] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors";

export function PageIntro({ eyebrow, title, description, action, actionText, children }) {
	return <div className="flex flex-wrap items-end justify-between gap-4">
		<div className="min-w-0">
			<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">{eyebrow}</p>
			<h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
			<p className="mt-2 text-sm text-slate-400">{description}</p>
		</div>
		{(children || action) && <div className="flex flex-wrap items-center gap-2">{children}{action && <button type="button" onClick={action} className={button}>{actionText || "Voir les détails"}<ArrowUpRight size={15} /></button>}</div>}
	</div>;
}

export function StatCard({ label, value, note, trend, icon: Icon, spark = [15, 25, 20, 33, 28, 39, 45], accent = false }) {
	const points = spark.map((number, i) => `${i * 21},${48 - number}`).join(" ");
	const negative = trend?.startsWith("-");
	return <div className={`${card} p-4 transition-colors hover:border-blue-500/25 ${accent ? "border-blue-500/25" : ""}`}>
		<div className="flex items-center justify-between gap-2">
			<span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
			{Icon && <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400"><Icon size={17} /></span>}
		</div>
		<strong className="mt-4 block text-2xl font-bold text-white sm:text-3xl">{value}</strong>
		<div className="mt-3 flex items-end justify-between gap-2">
			<div className="min-w-0 text-[11px] text-slate-500">
				{trend && <span className={`flex items-center gap-0.5 font-semibold ${negative ? "text-slate-300" : "text-blue-400"}`}>
					{negative ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}
				</span>}
				<span>{note}</span>
			</div>
			<svg viewBox="0 0 130 52" aria-hidden="true" className="h-10 w-24 shrink-0 text-blue-500/80">
				<polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
	</div>;
}

export function Widget({ title, description, action, children, className = "" }) {
	return <section className={`${card} min-w-0 p-4 sm:p-5 ${className}`}>
		<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
			<div><h3 className="font-semibold text-white">{title}</h3>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>
			{action || <MoreHorizontal size={18} className="text-slate-500" />}
		</div>
		{children}
	</section>;
}

export function MiniClass({ icon, name, coach, time, seats, onClick }) {
	return <div className="flex items-center gap-3 border-b border-white/[0.06] py-3 last:border-b-0">
		<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">{icon}</span>
		<div className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{name}</strong><small className="text-[11px] text-slate-500">{coach}</small></div>
		<div className="shrink-0 text-right"><strong className="block text-[11px] text-slate-200">{time}</strong><small className="text-[10px] text-slate-500">{seats}</small></div>
		<button type="button" aria-label={`Ouvrir ${name}`} onClick={onClick} className="rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-blue-400"><ChevronRight size={16} /></button>
	</div>;
}

export function Timeline({ events = [] }) {
	return <div className="divide-y divide-white/[0.06]">{events.map((event, i) =>
		<div key={`${event.title}-${i}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
			<span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
			<div className="min-w-0 flex-1"><strong className="block text-xs text-white">{event.title}</strong><p className="mt-1 text-[11px] text-slate-500">{event.text}</p></div>
			<span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-500"><Clock3 size={11} />{event.time}</span>
		</div>
	)}</div>;
}
export function ActivityBars({ data = [], labels = [] }) {
	const max = Math.max(1, ...data);
	return <div className="relative h-56">
		<div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
			{[0, 1, 2, 3, 4].map((i) => <div key={i} className="border-t border-dashed border-white/[0.07]" />)}
		</div>
		<div className="relative grid h-full gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}>
			{data.map((value, i) => <div key={`${labels[i] || i}`} className="flex min-w-0 flex-col items-center">
				<div className="flex w-full flex-1 items-end justify-center pb-2">
					<div title={`${labels[i]}: ${value}`} style={{ height: `${Math.max(5, Math.round(value / max * 100))}%` }}
						className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-700 to-blue-400 transition-all duration-300 hover:from-blue-600 hover:to-blue-300 motion-reduce:transition-none" />
				</div>
				<small className="text-[10px] text-slate-500">{labels[i]}</small>
			</div>)}
		</div>
	</div>;
}

export function Banner({ userName, action, actionText, badge, title, subtitle }) {
	return <section className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-r from-[#15336B] to-[#111D35] px-5 py-7 sm:px-8 sm:py-9">
		<div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border border-white/10" />
		<div className="relative z-10 max-w-2xl">
			<p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">{badge || "VOTRE ESPACE"}</p>
			<h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{title || <>Bienvenue, <em>{userName}</em>.</>}</h2>
			<p className="mt-3 text-sm leading-6 text-slate-300">{subtitle || "Retrouvez toutes vos activités au même endroit."}</p>
			{action && <button type="button" onClick={action} className={`mt-5 ${button}`}>{actionText || "En savoir plus"}<ArrowUpRight size={16} /></button>}
		</div>
	</section>;
}

export function ExampleDataLabel() {
	return <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400">DONNÉES DE DÉMONSTRATION</span>;
}

export function navigateToSection(navigate, role, section) {
	navigate(`/${role}/${section}`);
}