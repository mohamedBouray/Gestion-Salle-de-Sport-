
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    updateProfile,
    changePassword,
} from "../../services/authApi";

export default function Profile() {
    const { user, refreshUser } = useAuth();

    const [profile, setProfile] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || "",
                phone: user.phone || "",
            });
        }
    }, [user]);

    const getError = (err) => {
        const errors = err.response?.data?.errors;

        return errors
            ? Object.values(errors).flat()[0]
            : err.response?.data?.message ||
              "Something went wrong.";
    };

    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({
            ...passwordForm,
            [e.target.name]: e.target.value,
        });
    };

    // UPDATE PROFILE
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        setProfileLoading(true);
        setProfileError("");
        setProfileSuccess("");

        try {
            const data = await updateProfile(profile);

            await refreshUser();

            setProfileSuccess(data.message);
        } catch (err) {
            setProfileError(getError(err));
        } finally {
            setProfileLoading(false);
        }
    };

    // CHANGE PASSWORD
    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (
            passwordForm.password !==
            passwordForm.password_confirmation
        ) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setPasswordLoading(true);

        try {
            const data = await changePassword(passwordForm);

            setPasswordSuccess(data.message);

            setPasswordForm({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
        } catch (err) {
            setPasswordError(getError(err));
        } finally {
            setPasswordLoading(false);
        }
    };

    const dashboard =
        `/${user?.role || "member"}/dashboard`;

    const inputClass =
        "w-full rounded-lg border border-zinc-700 " +
        "bg-zinc-800/50 px-4 py-3 text-sm text-white " +
        "placeholder-zinc-500 focus:border-blue-500 " +
        "focus:outline-none focus:ring-1 focus:ring-blue-500";

    const labelClass =
        "mb-2 block text-sm font-medium text-zinc-300";

    return (
        <div className="min-h-screen bg-zinc-950 px-4 py-10 text-white">

            <div className="mx-auto max-w-3xl">

                {/* HEADER */}
                <div className="mb-8">
                    <Link
                        to={dashboard}
                        className="text-sm text-blue-400 hover:text-blue-300"
                    >
                        ← Back to Dashboard
                    </Link>

                    <h1 className="mt-5 text-3xl font-bold">
                        My Profile
                    </h1>

                    <p className="mt-2 text-zinc-400">
                        Manage your personal information
                        and account security.
                    </p>
                </div>

                {/* ACCOUNT INFORMATION */}
                <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold">
                                {user?.name}
                            </h2>

                            <p className="text-sm capitalize text-zinc-400">
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-zinc-500">
                                Email Address
                            </p>
                            <p className="mt-1 break-all text-sm">
                                {user?.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-500">
                                Account Status
                            </p>
                            <p className="mt-1 text-sm capitalize text-green-400">
                                {user?.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* EDIT PROFILE */}
                <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <h2 className="mb-1 text-xl font-semibold">
                        Personal Information
                    </h2>

                    <p className="mb-6 text-sm text-zinc-400">
                        Update your name and phone number.
                    </p>

                    {profileError && (
                        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                            {profileError}
                        </div>
                    )}

                    {profileSuccess && (
                        <div role="status" className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                            {profileSuccess}
                        </div>
                    )}

                    <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-5"
                    >
                        <div>
                            <label htmlFor="name" className={labelClass}>
                                Full Name
                            </label>

                            <input
                                id="name"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className={inputClass}
                                maxLength={160}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className={labelClass}>
                                Phone Number
                            </label>

                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleProfileChange}
                                placeholder="06XXXXXXXX"
                                maxLength={32}
                                className={inputClass}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                        >
                            {profileLoading
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </form>
                </div>

                {/* CHANGE PASSWORD */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <h2 className="mb-1 text-xl font-semibold">
                        Change Password
                    </h2>

                    <p className="mb-6 text-sm text-zinc-400">
                        Keep your account secure
                        with a strong password.
                    </p>

                    {passwordError && (
                        <div role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div role="status" className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                            {passwordSuccess}
                        </div>
                    )}

                    <form
                        onSubmit={handleChangePassword}
                        className="space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="current_password"
                                className={labelClass}
                            >
                                Current Password
                            </label>

                            <input
                                id="current_password"
                                type="password"
                                name="current_password"
                                value={passwordForm.current_password}
                                onChange={handlePasswordChange}
                                autoComplete="current-password"
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="new_password"
                                className={labelClass}
                            >
                                New Password
                            </label>

                            <input
                                id="new_password"
                                type="password"
                                name="password"
                                value={passwordForm.password}
                                onChange={handlePasswordChange}
                                autoComplete="new-password"
                                minLength={8}
                                className={inputClass}
                                required
                            />

                            <p className="mt-2 text-xs text-zinc-500">
                                At least 8 characters,
                                uppercase, lowercase and a number.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className={labelClass}
                            >
                                Confirm New Password
                            </label>

                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={passwordForm.password_confirmation}
                                onChange={handlePasswordChange}
                                autoComplete="new-password"
                                className={inputClass}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                        >
                            {passwordLoading
                                ? "Updating..."
                                : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
