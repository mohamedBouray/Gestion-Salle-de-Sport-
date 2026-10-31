
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function MemberDashboard() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Member Dashboard
                </h1>

                <p className="mt-2 text-zinc-400">
                    Welcome, {user?.name}.
                    Explore your fitness journey.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        Available Courses
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Discover our gym courses.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        My Reservations
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        View and manage your bookings.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        My Subscription
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Check your membership status.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
