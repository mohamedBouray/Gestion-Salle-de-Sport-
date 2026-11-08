import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error , setError] = useState("");
    const [formData, setFormData] = useState({email:"" , password:""});
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({...formData , [e.target.name]: e.target.value});
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        setError("");

        try {
            const user = await login(formData);

            navigate(`/${user.role}/dashboard`, {
                replace: true,
            });

        } catch (err) {
            const errors = err.response?.data?.errors;

            setError(
                errors
                    ? Object.values(errors).flat()[0]
                    : err.response?.data?.message ||
                    "Invalid email or password."
            );
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 font-sans">
            
            <div  className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
            <div className="absolute top-6 left-6 z-20 animate-fade-in">
                <button  onClick={() => navigate("/")}
                    className="group flex items-center gap-2  px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:text-white cursor-pointer">
                    <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Return
                </button>
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
                
                {/* Header / Logo */}
                <div className="mb-8 text-center animate-fade-in delay-100">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-zinc-400">Sign in to your GYM Management account.</p>
                </div>
                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5 animate-fade-in delay-200">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                            Email Address
                        </label>
                        <input  type="email" id="email"  name="email" placeholder="you@example.com" onChange={handleChange} value={formData.email}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <input type="password" id="password" name="password" placeholder="••••••••" onChange={handleChange} value={formData.password}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder-zinc-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={isLoading}
                        className="group relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-70">
                        {isLoading ? (
                            <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                Sign In
                                <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-400 animate-fade-in delay-300">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-semibold text-blue-500 transition-colors hover:text-blue-400">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}