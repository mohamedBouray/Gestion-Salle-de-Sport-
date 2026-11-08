
import { useEffect, useState } from "react";
import {Outlet, useLocation,useNavigate,} from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { ROLE_CONFIG } from "./Navigation";

export default function DashboardLayout({role = "member", user, onLogout,}) {
    const safeRole = ROLE_CONFIG[role] ? role : "member";
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Close sidebar after navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Escape closes mobile sidebar
    useEffect(() => {
        function handleEscape(event) {
            if (event.key === "Escape") {
                setMobileOpen(false);
            }
        }

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Prevent body scrolling when mobile menu is open
    useEffect(() => {
        if (!mobileOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileOpen]);

    async function handleLogout() {
        if (!onLogout || loggingOut) return;

        setLoggingOut(true);

        try {
            await onLogout();
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Erreur de déconnexion :", error);
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 antialiased">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <button type="button"
                    aria-label="Fermer le menu"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"/>
            )}

            {/* Fixed Sidebar */}
            <aside id="dashboard-sidebar"
                className={["fixed inset-y-0 left-0 z-50", "h-dvh w-[252px]","overflow-hidden border-r border-slate-200", "bg-white",
                    "transition-transform duration-300 ease-out", "motion-reduce:transition-none","lg:translate-x-0",
                    mobileOpen? "translate-x-0 shadow-2xl": "-translate-x-full",].join(" ")} >
                <Sidebar role={safeRole} user={user} onClose={() => setMobileOpen(false)} onLogout={handleLogout} loggingOut={loggingOut}/>
            </aside>

            {/* Main Workspace */}
            <div className="min-h-dvh min-w-0 lg:ml-[252px]">
                {/* Header */}
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
                    <Header role={safeRole}
                        user={user}
                        onMenuOpen={() => setMobileOpen(true)}
                        onLogout={handleLogout}
                        loggingOut={loggingOut}/>
                </header>

                {/* Page Content */}
                <main className="min-h-[calc(100dvh-68px)] min-w-0 bg-[#F8FAFC]">
                    <Outlet
                        context={{
                            role: safeRole,
                            user,
                            onLogout: handleLogout,
                        }}/>
                </main>
            </div>
        </div>
    );
}
