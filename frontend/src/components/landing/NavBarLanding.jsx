import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Dumbbell } from "lucide-react";
import PillNav from "../Designs/PillNav";
import { useLandingSettings } from "../../contexts/LandingSettingsContext";

export default function NavBarLanding() {
    const s = useLandingSettings();
    const links = s.nav_links || [];
    const [active, setActive] = useState("#home");
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 12);
            const visible = links.filter((item) => {
                if (!item.href?.startsWith("#")) return false;
                const el = document.getElementById(item.href.slice(1));
                return el && el.getBoundingClientRect().top <= 150;
            });
            setActive(visible.at(-1)?.href || "#home");
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [links]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const click = (item) => { setActive(item.href); setOpen(false); };

    return (
        <header className={`sticky top-0 z-50 mx-1 mt-2 rounded-2xl border border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8 ${scrolled ? "shadow-lg shadow-slate-900/10" : "shadow-sm"}`}>
            <div className="flex min-h-[68px] items-center justify-between gap-3">
                <a href="#home" onClick={() => setOpen(false)} className="flex min-w-0 shrink-0 items-center gap-2">
                    {s.site_logo ? <img src={s.site_logo} alt="" className="h-9 w-9 rounded-lg object-contain" /> :
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Dumbbell size={21} /></span>}
                    <span className="max-w-[170px] truncate text-sm font-bold tracking-tight text-slate-900 sm:max-w-none sm:text-base">{s.site_name}</span>
                </a>
                <div className="hidden min-w-0 flex-1 justify-center lg:flex">
                    <PillNav items={links} activeHref={active} onItemClick={click} theme="light" layout="joined" size="sm" surface="none" itemStyle="plain" hoverEffect="glide" indicator="pill" highlightColor="#2563eb" highlightTextColor="#fff" textColor="#475569" collapse="never" intro ariaLabel="Desktop navigation" />
                </div>
                <div className="hidden items-center gap-4 lg:flex">
                    <Link to="/login" className="px-2 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600">{s.navbar_login_text}</Link>
                    <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white hover:bg-blue-700">{s.navbar_register_text} →</Link>
                </div>
                <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg border border-slate-200 p-2.5 lg:hidden">
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
            {open && (
                <nav className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden">
                    {links.map((item, i) => <a key={`${item.href}-${i}`} href={item.href} onClick={() => click(item)} className={`block rounded-lg px-4 py-3 text-sm font-semibold ${active === item.href ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"}`}>{item.label}</a>)}
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                        <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-3 text-center text-sm font-semibold">{s.navbar_login_text}</Link>
                        <Link to="/register" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-semibold text-white">{s.navbar_register_text}</Link>
                    </div>
                </nav>
            )}
        </header>
    );
}