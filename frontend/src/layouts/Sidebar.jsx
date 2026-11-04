import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronsLeft, Dumbbell, LogOut, X } from "lucide-react";
import { getRoleConfig } from "./navigation";

export default function Sidebar({ role = "member", user, collapsed = false, onClose, onCollapse, onLogout }) {
    const config = getRoleConfig(role);
    const { pathname } = useLocation();
    const [shortScreen, setShortScreen] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const hidden = collapsed ? "lg:hidden" : "";
    const initials = (user?.name || "Gym User").trim().split(/\s+/)
        .slice(0, 2).map((name) => name[0]).join("").toUpperCase();

    useEffect(() => {
        const media = window.matchMedia("(max-height: 840px)");
        const update = () => setShortScreen(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    useEffect(() => setExpanded(null), [pathname]);

    const currentGroup = config.sections.find((group) =>
        group.items.some((item) => item.path === pathname)
    )?.title || config.sections[0].title;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#101827] text-slate-300">
            {/* Brand */}
            <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-3 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}>
                <NavLink to={`/${role}/dashboard`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2.5 lg:flex-none">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#165DFF] text-white">
                        <Dumbbell size={19} strokeWidth={2.2} />
                    </span>
                    <span className={`min-w-0 ${hidden}`}>
                        <strong className="block whitespace-nowrap text-[13px] font-bold text-white">GYM <span className="text-blue-400">Management</span></strong>
                        <small className="block text-[9px] tracking-widest text-slate-500">FITNESS WORKSPACE</small>
                    </span>
                </NavLink>
                <button type="button" aria-label="Fermer" onClick={onClose}
                    className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden"><X size={18} /></button>
            </div>

            {/* Workspace */}
            <div className="shrink-0 px-3 pb-1 pt-3">
                <div className={`flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-2 ${collapsed ? "lg:justify-center" : ""}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-xs font-bold text-blue-400">{role[0]?.toUpperCase()}</span>
                    <div className={`min-w-0 ${hidden}`}>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Votre espace</p>
                        <p className="truncate text-xs font-semibold text-white">{config.label}</p>
                    </div>
                </div>
            </div>

            {/* Navigation never scrolls: short screens use one open section at a time. */}
            <nav className="min-h-0 flex-1 space-y-1.5 overflow-hidden px-2.5 py-2" aria-label="Navigation principale">
                {config.sections.map((section) => {
                    const open = !shortScreen || (expanded ?? currentGroup) === section.title;
                    return (
                        <div key={section.title}>
                            <button type="button" title={section.title} disabled={!shortScreen}
                                aria-expanded={open}
                                onClick={() => setExpanded(open ? "" : section.title)}
                                className={`flex h-5 w-full items-center justify-between px-2 text-left text-[9px] font-bold tracking-[0.13em] text-slate-500 ${shortScreen ? "hover:text-white" : "cursor-default"} ${collapsed ? "lg:justify-center" : ""}`}>
                                <span className={hidden}>{section.title}</span>
                                {collapsed && <span className="hidden h-px w-5 bg-white/15 lg:block" />}
                                {shortScreen && <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""} ${hidden}`} />}
                            </button>
                            {open && (
                                <div className="mt-0.5 space-y-0.5">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <NavLink key={item.path} to={item.path} onClick={onClose} title={collapsed ? item.label : undefined}
                                                className={({ isActive }) => `group relative flex h-[29px] items-center gap-2.5 rounded-lg px-2.5 text-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${collapsed ? "lg:justify-center lg:px-2" : ""} ${isActive ? "bg-blue-600/15 font-semibold text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
                                                {({ isActive }) => <>
                                                    <Icon size={16} strokeWidth={1.8} className={`shrink-0 ${isActive ? "text-[#4486FF]" : "text-slate-500 group-hover:text-white"}`} />
                                                    <span className={`min-w-0 flex-1 truncate ${hidden}`}>{item.label}</span>
                                                    {isActive && <span className={`absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-[#165DFF] ${collapsed ? "lg:hidden" : ""}`} />}
                                                </>}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom profile and logout */}
            <div className="shrink-0 border-t border-white/10 p-2.5">
                <div className={`flex items-center gap-2 rounded-lg bg-white/[0.04] p-1.5 ${collapsed ? "lg:flex-col" : ""}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#165DFF] text-[10px] font-bold text-white">{initials}</span>
                    <span className={`min-w-0 flex-1 ${hidden}`}>
                        <strong className="block truncate text-[11px] text-white">{user?.name || "Gym User"}</strong>
                        <small className="block truncate text-[10px] text-slate-500">{config.compact}</small>
                    </span>
                    <button type="button" onClick={onLogout} title="Déconnexion" aria-label="Déconnexion"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"><LogOut size={16} /></button>
                </div>
                <button type="button" onClick={onCollapse}
                    aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                    className={`mt-1.5 hidden h-7 w-full items-center gap-2 rounded-lg px-2 text-[11px] text-slate-500 hover:bg-white/5 hover:text-white lg:flex ${collapsed ? "lg:justify-center" : ""}`}>
                    <ChevronsLeft size={15} className={`transition-transform ${collapsed ? "rotate-180" : ""}`} />
                    {!collapsed && "Réduire le menu"}
                </button>
            </div>
        </div>
    );
}