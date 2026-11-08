
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authApi";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const data = await forgotPassword(email);
            setSuccess(data.message);
        } catch (err) {
            const errors = err.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : err.response?.data?.message ||
                      "Something went wrong."
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
                        <svg className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H8v3H5v-3l5.257-5.257A6 6 0 1121 9z"/>
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Forgot Password?
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                        Enter your email address and we'll send
                        you a link to reset your password.
                    </p>
                </div>

                {error && (
                    <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div role="status" className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email"
                            className="mb-1.5 block text-sm font-medium text-zinc-300">
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-blue-500 hover:text-blue-400"
                    >
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
