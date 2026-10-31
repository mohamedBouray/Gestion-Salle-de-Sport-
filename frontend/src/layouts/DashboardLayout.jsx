import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const dashboardPaths = {
    admin: "/admin/dashboard",
    coach: "/coach/dashboard",
    member: "/member/dashboard",
};

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        setLoading(true);
        setError("");
        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (err) {
            setError( err.response?.data?.message ||"Logout failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <header className="border-b border-zinc-800 bg-zinc-900">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div>
                        <h1 className="text-xl font-bold text-blue-400">
                            GYM Management
                        </h1>
                        <p className="text-xs capitalize text-zinc-400">
                            {user?.role} Space
                        </p>
                    </div>

                    <nav className="flex flex-wrap items-center gap-4">
                        <Link to={dashboardPaths[user?.role] || "/"}
                            className="text-sm text-zinc-300 hover:text-blue-400">
                            Dashboard
                        </Link>
                        <Link to="/profile"
                            className="text-sm text-zinc-300 hover:text-blue-400">
                            My Profile
                        </Link>

                        <button type="button"
                            onClick={handleLogout}
                            disabled={loading}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50">
                            {loading ? "Logging out..." : "Logout"}
                        </button>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {error && (
                    <p role="alert"
                        className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" >
                        {error}
                    </p>
                )}

                {children}
            </main>
        </div>
    );
}
