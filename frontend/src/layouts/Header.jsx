import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Bell, ChevronDown, ChevronRight, CircleHelp, CircleUserRound,
    LogOut, Menu, Search, Settings2, X
} from "lucide-react";
import { getRoleConfig, getRoleItems } from "./navigation";

const iconBtn = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
const popup = "absolute right-0 top-full z-50 mt-2 w-[min(290px,calc(100vw-24px))] rounded-xl border border-white/10 bg-[#172033] p-3 shadow-2xl shadow-black/50";

export default function Header({ role = "member", user, onMenuOpen, onLogout }) {
    const config = getRoleConfig(role);
    const items = useMemo(() => getRoleItems(role), [role]);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [panel, setPanel] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const actionsRef = useRef(null);
    const searchRef = useRef(null);

    const current = items.find((item) => item.path === pathname);
    const pageTitle = current?.label || (pathname === "/profile" ? "Mon profil" : "Tableau de bord");
    const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase().trim()));
    const initials = (user?.name || "Gym User").trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase();

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault(); setPanel(null); setSearchOpen(true);
            }
            if (e.key === "Escape") { setPanel(null); setSearchOpen(false); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
    useEffect(() => { setPanel(null); setSearchOpen(false); setQuery(""); }, [pathname]);
    useEffect(() => {
        const outside = (e) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target)) setPanel(null);
        };
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, []);

    const openSearch = () => { setPanel(null); setSearchOpen(true); };
    const closeSearch = () => { setSearchOpen(false); setQuery(""); };
    const goTo = (path) => { navigate(path); setPanel(null); closeSearch(); };
    const toggle = (name) => setPanel((currentPanel) => currentPanel === name ? null : name);

    return <>
        <div className="flex h-16 min-w-0 items-center justify-between gap-2 px-3 sm:px-5 lg:px-6">
            {/* Breadcrumbs */}
            <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={onMenuOpen} aria-label="Ouvrir le menu"
                    className={`${iconBtn} lg:hidden`}><Menu size={20} /></button>
                <span className="hidden shrink-0 text-xs text-slate-500 sm:block">{config.compact}</span>
                <ChevronRight size={14} className="hidden shrink-0 text-slate-600 sm:block" />
                <strong className="truncate text-sm font-semibold text-white">{pageTitle}</strong>
            </div>

            <div ref={actionsRef} className="flex shrink-0 items-center gap-1 sm:gap-2">
                {/* Quick search */}
                <button type="button" onClick={openSearch} aria-label="Rechercher"
                    className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-400 hover:border-blue-500/30 md:flex md:w-40 xl:w-56">
                    <Search size={15} /> <span className="flex-1 text-left">Rechercher...</span>
                    <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
                </button>
                <button type="button" onClick={openSearch} aria-label="Rechercher" className={`${iconBtn} md:hidden`}><Search size={19} /></button>

                {/* Help */}
                <div className="relative hidden sm:block">
                    <button type="button" title="Aide" onClick={() => toggle("help")} aria-expanded={panel === "help"} className={iconBtn}><CircleHelp size={19} /></button>
                    {panel === "help" && <div className={popup}>
                        <strong className="text-sm text-white">Aide</strong>
                        <p className="mt-2 text-xs leading-5 text-slate-400">Utilisez le menu à gauche ou Ctrl + K pour retrouver une page.</p>
                    </div>}
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button type="button" aria-label="Notifications" aria-expanded={panel === "notifications"}
                        onClick={() => toggle("notifications")} className={iconBtn}><Bell size={19} /></button>
                    {panel === "notifications" && <div className={popup}>
                        <strong className="text-sm text-white">Notifications</strong>
                        <p className="mt-3 rounded-lg bg-white/[0.04] p-3 text-xs leading-5 text-slate-400">Les notifications apparaîtront après l'intégration de l'API.</p>
                    </div>}
                </div>

                {/* User */}
                <div className="relative ml-1 border-l border-white/10 pl-2">
                    <button type="button" onClick={() => toggle("profile")} aria-label="Mon compte" aria-expanded={panel === "profile"}
                        className="flex items-center gap-2 rounded-lg p-1 hover:bg-white/[0.05]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#165DFF] text-[10px] font-bold text-white">{initials}</span>
                        <span className="hidden max-w-32 text-left lg:block">
                            <strong className="block truncate text-xs text-white">{user?.name || "Gym User"}</strong>
                            <small className="block text-[10px] text-slate-500">{config.compact}</small>
                        </span>
                        <ChevronDown size={14} className="hidden text-slate-500 lg:block" />
                    </button>
                    {panel === "profile" && <div className={popup}>
                        <div className="border-b border-white/10 px-2 pb-3">
                            <strong className="block truncate text-sm text-white">{user?.name || "Gym User"}</strong>
                            <small className="block truncate text-xs text-slate-400">{user?.email}</small>
                        </div>
                        <button type="button" onClick={() => goTo(`/${role}/profile`)} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-white/10"><CircleUserRound size={16} /> Mon profil</button>
                        {role === "admin" && <button type="button" onClick={() => goTo("/admin/settings")} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-white/10"><Settings2 size={16} /> Paramètres</button>}
                        <button type="button" onClick={() => { setPanel(null); onLogout?.(); }} className="mt-1 flex w-full items-center gap-2 border-t border-white/10 px-2 py-3 text-left text-xs text-white hover:bg-white/10"><LogOut size={16} /> Déconnexion</button>
                    </div>}
                </div>
            </div>
        </div>

        {/* Portal ensures search sits above fixed sidebar. */}
        {searchOpen && createPortal(
            <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/75 px-3 pt-[12vh] backdrop-blur-sm"
                onMouseDown={(e) => { if (e.target === e.currentTarget) closeSearch(); }}>
                <div role="dialog" aria-modal="true" aria-label="Recherche des pages"
                    className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[#172033] shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                        <Search size={19} className="text-blue-400" />
                        <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) goTo(filtered[0].path); }}
                            type="search" placeholder="Rechercher une page..." aria-label="Rechercher une page"
                            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
                        <button type="button" onClick={closeSearch} aria-label="Fermer" className={iconBtn}><X size={18} /></button>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto p-2">
                        {filtered.length ? filtered.map((item) => {
                            const Icon = item.icon;
                            return <button type="button" key={item.path} onClick={() => goTo(item.path)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-blue-500/10 hover:text-white">
                                <Icon size={17} className="text-blue-400" /><span className="flex-1">{item.label}</span><ChevronRight size={15} />
                            </button>;
                        }) : <p className="p-5 text-center text-sm text-slate-400">Aucun résultat.</p>}
                    </div>
                    <p className="border-t border-white/10 px-4 py-2 text-[10px] text-slate-500">Ctrl + K pour ouvrir · ESC pour fermer</p>
                </div>
            </div>, document.body
        )}
    </>;
}