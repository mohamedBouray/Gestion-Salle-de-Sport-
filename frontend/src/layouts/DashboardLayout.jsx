import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ROLE_CONFIG } from "./navigation";

export default function DashboardLayout({ role = "member", user, onLogout }) {
    const safeRole = ROLE_CONFIG[role] ? role : "member";
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { pathname } = useLocation();
    const navigate = useNavigate();

    useEffect(() => setMobileOpen(false), [pathname]);

    useEffect(() => {
        const onEscape = (e) => e.key === "Escape" && setMobileOpen(false);
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, []);

    useEffect(() => {
        if (!mobileOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [mobileOpen]);

    async function handleLogout() {
        if (!onLogout || loggingOut) return;
        setLoggingOut(true);
        try {
            await onLogout();
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <div className="min-h-dvh bg-white text-white">
            {mobileOpen && (
                <button type="button" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 z-40 bg-black/70 lg:hidden" />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 h-dvh overflow-hidden border-r border-white/10 bg-[#101827] transition-[width,transform] duration-300 ease-out motion-reduce:transition-none lg:translate-x-0 ${collapsed ? "w-[250px] lg:w-[76px]" : "w-[250px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <Sidebar role={safeRole} user={user} collapsed={collapsed}
                    onClose={() => setMobileOpen(false)}
                    onCollapse={() => setCollapsed((v) => !v)}
                    onLogout={handleLogout} />
            </aside>

            <div className={`min-w-0 min-h-dvh transition-[margin] duration-300 ease-out motion-reduce:transition-none ${collapsed ? "lg:ml-[76px]" : "lg:ml-[250px]"}`}>
                <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F1726]/95 backdrop-blur-lg">
                    <Header role={safeRole} user={user}
                        onMenuOpen={() => setMobileOpen(true)} onLogout={handleLogout} />
                </header>
                <main className="min-h-[calc(100dvh-64px)] min-w-0">
                    <Outlet context={{ role: safeRole, user, onLogout: handleLogout }} />
                </main>
            </div>
        </div>
    );
}