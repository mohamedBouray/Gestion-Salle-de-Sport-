
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function CoachDashboard() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Coach Dashboard
                </h1>

                <p className="mt-2 text-zinc-400">
                    Welcome, Coach {user?.name}.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        My Courses
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        View your assigned courses.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        My Schedule
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        View your training sessions.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="text-lg font-semibold">
                        Attendance
                    </h2>

                    <p className="mt-2 text-sm text-zinc-400">
                        Manage attendance for your sessions.
                    </p>

                    <p className="mt-5 text-sm text-amber-400">
                        Coming soon
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
