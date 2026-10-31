
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Admin Dashboard
                </h1>

                <p className="mt-2 text-zinc-400">
                    Welcome back, {user?.name}.
                    Manage your fitness center here.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        Users Management
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Manage Coaches, Members and account status.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        Courses Management
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Create and manage gym courses.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        Subscriptions
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Manage memberships and payments.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <Link
                    to="/profile"
                    className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                >
                    Manage My Profile
                </Link>
            </div>
        </DashboardLayout>
    );
}
