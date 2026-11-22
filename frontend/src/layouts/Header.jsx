import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, X, ChevronRight, ChevronDown, CircleUserRound, LogOut, Loader2, CornerDownLeft } from "lucide-react";
import api from "../services/api";
import { getRoleConfig, getRoleItems, getNavigationItem } from "./Navigation";

const normalize = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const initials = (s) => (s || "Utilisateur").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
const menuItem = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs";

// Recherche serveur (debounce 300 ms + annulation de la requête précédente)
function useRemoteSearch(query, role) {
    const [state, setState] = useState({ remote: [], busy: false, failed: false });
    const enabled = normalize(query).length >= 2;

    useEffect(() => {
        setState({ remote: [], busy: enabled, failed: false });
        if (!enabled) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const { data } = await api.get("/api/search", { params: { q: query.trim() }, signal: controller.signal });
                if (!controller.signal.aborted) setState({ remote: Array.isArray(data.results) ? data.results : [], busy: false, failed: false });
            } catch {
                if (!controller.signal.aborted) setState({ remote: [], busy: false, failed: true });
            }
        }, 300);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, role, enabled]);

    return state;
}

function SearchBox({ role, pages }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [mobile, setMobile] = useState(false);
    const [active, setActive] = useState(0);
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const term = normalize(query);
    const hasQuery = term.length >= 2;
    const { remote, busy, failed } = useRemoteSearch(query, role);

    const results = useMemo(() => {
        if (!hasQuery) return [];
        const local = pages
            .filter((p) => normalize(p.label).includes(term))
            .map((p) => ({ id: `page-${p.path}`, type: "Pages", title: p.label, detail: "Ouvrir la page", path: p.path, icon: p.icon }));
        const extra = remote.filter((r) => !local.some((p) => p.title === r.title && p.path === r.path));
        return [...local, ...extra].slice(0, 20);
    }, [pages, remote, term, hasQuery]);

    const close = useCallback(() => { setOpen(false); setMobile(false); setQuery(""); setActive(0); }, []);
    const go = (path) => { close(); if (path) navigate(path); };

    useEffect(close, [pathname, close]);
    useEffect(() => { if (mobile) inputRef.current?.focus(); }, [mobile]);
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(true);
                if (window.innerWidth < 640) setMobile(true); else inputRef.current?.focus();
            } else if (e.key === "Escape") close();
        };
        const onOutside = (e) => { if (!rootRef.current?.contains(e.target)) close(); };
        window.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onOutside);
        return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onOutside); };
    }, [close]);

    const onKeyDown = (e) => {
        if (!results.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") { e.preventDefault(); go(results[active]?.path); }
    };

    return (
        <div ref={rootRef} className="flex items-center">
            {/* Mobile trigger */}
            <button type="button" aria-label="Ouvrir la recherche" onClick={() => { setMobile((v) => !v); setOpen(true); }} className=" cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden">
                <Search size={19} />
            </button>

            <div className={`${mobile ? "absolute left-3 right-3 top-[74px] z-50 block" : "hidden"} sm:relative sm:left-auto sm:right-auto sm:top-auto sm:block sm:w-60 lg:w-80`}>
                {/* Input */}
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
                    {busy ? <Loader2 size={16} className="shrink-0 animate-spin text-blue-500" /> : <Search size={16} className="shrink-0 text-slate-400" />}
                    <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} placeholder="Rechercher dans le contenu..." aria-label="Recherche globale" aria-controls="global-search-results" aria-expanded={open && hasQuery} className="w-full min-w-0 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400" />
                    {query
                        ? <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Effacer" className="cursor-pointer text-slate-400 hover:text-slate-700"><X size={15} /></button>
                        : <kbd className="hidden shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:block">Ctrl K</kbd>}
                </div>

                {/* Results */}
                {open && hasQuery && (
                    <ul id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[65vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                        {results.map((r, i) => {
                            const Icon = r.icon || pages.find((p) => p.path === r.path)?.icon || Search;
                            return (
                                <li key={r.id} role="presentation">
                                    {r.type !== results[i - 1]?.type && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.type}</p>}
                                    <button type="button" role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r.path)} className={`cursor-pointer flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left ${i === active ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}>
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-inset ring-slate-200"><Icon size={15} /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-semibold">{r.title}</span>
                                            <span className="block truncate text-[11px] text-slate-400">{r.detail}</span>
                                        </span>
                                        {i === active && <CornerDownLeft size={13} className="shrink-0 text-blue-400" />}
                                    </button>
                                </li>
                            );
                        })}
                        {!results.length && <li className="px-3 py-6 text-center text-[13px] text-slate-500">{busy ? "Recherche en cours..." : `Aucun résultat pour « ${query.trim()} »`}</li>}
                        {failed && <li className="px-3 py-2 text-xs text-amber-700">Recherche des données indisponible. Vérifiez l'API.</li>}
                    </ul>
                )}
            </div>
        </div>
    );
}

function AccountMenu({ role, user, config, onLogout, loggingOut }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const name = user?.name || "Utilisateur";

    useEffect(() => { setOpen(false); }, [pathname]);
    useEffect(() => {
        if (!open) return;
        const onOutside = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("pointerdown", onOutside);
        window.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("pointerdown", onOutside); window.removeEventListener("keydown", onKey); };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu du compte" aria-expanded={open} className="cursor-pointer flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">{initials(user?.name)}</span>
                <span className="hidden max-w-32 text-left md:block">
                    <span className="block truncate text-xs font-semibold text-slate-800">{name}</span>
                    <span className="block text-[10px] text-slate-400">{config.compact}</span>
                </span>
                <ChevronDown size={14} className="hidden text-slate-400 md:block" />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    <div className="mb-1 border-b border-slate-100 px-3 py-2.5">
                        <p className="truncate text-xs font-semibold text-slate-800">{name}</p>
                        <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                    </div>
                    <button type="button" onClick={() => navigate(`/${role}/profile`)} className={`${menuItem} text-slate-700 hover:bg-slate-50 cursor-pointer`}>
                        <CircleUserRound size={16} />Mon profil
                    </button>
                    <button type="button" disabled={loggingOut} onClick={() => { setOpen(false); onLogout?.(); }} className={`${menuItem} text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer`}>
                        {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}Déconnexion
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Header({ role = "member", user, onMenuOpen, onLogout, loggingOut = false }) {
    const { pathname } = useLocation();
    const config = getRoleConfig(role);
    const pages = useMemo(() => getRoleItems(role), [role]);
    const title = getNavigationItem(role, pathname)?.label || "Tableau de bord";

    return (
        <div className="relative flex h-[68px] min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={onMenuOpen} aria-label="Ouvrir le menu" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden">
                    <Menu size={20} />
                </button>
                <div className="min-w-0">
                    <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
                        {config.compact}<ChevronRight size={13} /><span className="truncate">{title}</span>
                    </div>
                    <h1 className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">{title}</h1>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <SearchBox role={role} pages={pages} />
                <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
                <AccountMenu role={role} user={user} config={config} onLogout={onLogout} loggingOut={loggingOut} />
            </div>
        </div>
    );
}