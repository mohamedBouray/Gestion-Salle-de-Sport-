
import { NavLink } from "react-router-dom";
import {
    Dumbbell, LogOut, X, CircleUserRound,
    PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { getRoleConfig } from "./Navigation";

function getInitials(name) {
    return (name || "Gym User").trim().split(/\s+/).slice(0, 2)
        .map((part) => part[0] || "").join("").toUpperCase();
}

export default function Sidebar({
    role = "member", user, onClose, onLogout,
    loggingOut = false, collapsed = false, onToggleCollapse,
}) {
    const config = getRoleConfig(role);
    const initials = getInitials(user?.name);

    return (
        <div className="flex h-full min-h-0 flex-col bg-white text-slate-800">

            {/* Logo + Toggle */}
            <div className={`flex h-[68px] shrink-0 items-center justify-between border-b border-slate-100 px-4 ${
                collapsed ? "lg:h-[96px] lg:flex-col lg:justify-center lg:gap-2 lg:px-2" : ""
            }`}>
                <NavLink to={config.home} onClick={onClose}
                    title={collapsed ? "GYM Management" : undefined}
                    className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Dumbbell size={19} strokeWidth={2.2} />
                    </div>

                    <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
                        <p className="truncate text-[14px] font-bold tracking-tight text-slate-900">
                            GYM Management
                        </p>
                        <p className="text-[10px] font-medium tracking-wide text-slate-400">
                            FITNESS WORKSPACE
                        </p>
                    </div>
                </NavLink>

                {/* Desktop Collapse Button */}
                {onToggleCollapse && (
                    <button type="button" onClick={onToggleCollapse}
                        title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                        aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                        aria-expanded={!collapsed}
                        className=" cursor-pointer hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 lg:flex">
                        {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
                    </button>
                )}

                {/* Mobile Close */}
                <button type="button" onClick={onClose} aria-label="Fermer le menu"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden">
                    <X size={19} />
                </button>
            </div>

            {/* Workspace */}
            <div className={`shrink-0 px-3 pb-2 pt-3 ${collapsed ? "lg:px-2" : ""}`}>
                <div className={`flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 ${
                    collapsed ? "lg:justify-center lg:px-1" : ""
                }`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                        <CircleUserRound size={17} className="text-blue-600" />
                    </div>

                    <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
                        <p className="text-[10px] text-slate-400">Votre espace</p>
                        <p className="truncate text-xs font-semibold text-slate-700">
                            {config.label}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav aria-label="Navigation principale"
                className={`min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pb-5 pt-3 ${
                    collapsed ? "lg:space-y-3 lg:px-2" : ""
                }`}>

                {config.sections.map((section) => (
                    <div key={section.title}>
                        <p className={`mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 ${
                            collapsed ? "lg:hidden" : ""
                        }`}>
                            {section.title}
                        </p>

                        {collapsed && (
                            <div aria-hidden="true"
                                className="mx-auto mb-3 hidden w-7 border-t border-slate-200 lg:block" />
                        )}

                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <NavLink key={item.path} to={item.path} onClick={onClose}
                                        title={collapsed ? item.label : undefined}
                                        aria-label={collapsed ? item.label : undefined}
                                        className={({ isActive }) => [
                                            "group flex min-h-[37px] items-center gap-3 rounded-lg px-3 py-2",
                                            "text-[12.5px] transition-colors duration-150",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                            collapsed ? "lg:justify-center lg:px-2" : "",
                                            isActive
                                                ? "bg-blue-50 font-semibold text-blue-700"
                                                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                        ].join(" ")}>

                                        {({ isActive }) => (
                                            <>
                                                <Icon size={17} strokeWidth={1.8}
                                                    className={
                                                        isActive
                                                            ? "shrink-0 text-blue-600"
                                                            : "shrink-0 text-slate-400 group-hover:text-slate-700"
                                                    }
                                                />

                                                <span className={`min-w-0 flex-1 ${
                                                    collapsed ? "lg:hidden" : ""
                                                }`}>
                                                    {item.label}
                                                </span>

                                                {isActive && (
                                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 ${
                                                        collapsed ? "lg:hidden" : ""
                                                    }`} />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User + Logout */}
            <div className={`shrink-0 border-t border-slate-100 bg-white p-3 ${
                collapsed ? "lg:p-2" : ""
            }`}>
                <div className={`flex items-center gap-2.5 rounded-xl bg-slate-50 p-2 ${
                    collapsed ? "lg:flex-col lg:gap-2 lg:px-1" : ""
                }`}>
                    <div title={user?.name || "Gym User"}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                        {initials}
                    </div>

                    <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                        <p className="truncate text-xs font-semibold text-slate-800">
                            {user?.name || "Gym User"}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                            {config.compact}
                        </p>
                    </div>

                    <button type="button" onClick={onLogout} disabled={loggingOut}
                        title="Déconnexion" aria-label="Déconnexion"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                        <LogOut size={17} />
                    </button>
                </div>
            </div>
        </div>
    );
}
