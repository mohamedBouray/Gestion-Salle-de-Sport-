
import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authApi";

export default function ResetPassword() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const email = searchParams.get("email") || "";

    const [formData, setFormData] = useState({
        password: "",
        password_confirmation: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        if (formData.password !== formData.password_confirmation) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({
                token,
                email,
                ...formData,
            });

            setSuccess(true);

        } catch (err) {
            const errors = err.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : err.response?.data?.message ||
                      "Unable to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 font-sans">

            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-xl">

                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
                        <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-8a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2zm1-12V7a5 5 0 0110 0v2"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Reset Password
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        Create a new secure password for your account.
                    </p>
                </div>

                {error && (
                    <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <p className="mb-5 text-green-400">
                            Password reset successfully!
                        </p>

                        <button
                            onClick={() => navigate("/login", { replace: true })}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-400"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
                                New Password
                            </label>

                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength={8}
                                required
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            <p className="mt-2 text-xs text-zinc-400">
                                Minimum 8 characters, uppercase,
                                lowercase and one number.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-zinc-300">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !token}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-sm text-blue-500 hover:text-blue-400">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
