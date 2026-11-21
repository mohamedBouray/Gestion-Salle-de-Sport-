import { useEffect, useState } from "react";
import {
    Check, CheckCircle2, Circle, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail,
    Phone, Save, UserRound,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, changePassword } from "../../services/authApi";

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] " + "text-slate-900 placeholder:text-slate-400 outline-none transition " +
    "hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 " + "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";

const ROLE_NAMES = { admin: "Administrateur", coach: "Coach", member: "Membre", };

function getError(error) {
    const errors = error?.response?.data?.errors;
    const first = errors ? Object.values(errors).flat()[0] : null;
    return (first || error?.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
}

function Feedback({ error, success }) {
    if (error) {
        return (
            <div role="alert"
                className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                {error}
            </div>
        );
    }

    if (success) {
        return (
            <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{success}</span>
            </div>
        );
    }
    return null;
}

function Field({ id, label, icon: Icon, required = false, children }) {
    return (
        <div>
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>

            <div className="relative">
                <Icon
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                {children}
            </div>
        </div>
    );
}

function PasswordInput({ id, label, value, onChange, autoComplete, placeholder, disabled }) {
    const [visible, setVisible] = useState(false);

    return (
        <Field id={id} label={label} icon={LockKeyhole}>
            <input
                id={id}
                name={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                placeholder={placeholder}
                minLength={id === "current_password" ? undefined : 8}
                disabled={disabled}
                className={`${inputClass} pl-9 pr-10`}
                required
            />

            <button
                type="button"
                disabled={disabled}
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? `Masquer ${label.toLowerCase()}` : `Afficher ${label.toLowerCase()}`}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
        </Field>
    );
}

function PanelHeader({ title, description }) {
    return (
        <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-bold text-[#0f1b33]">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
    );
}

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
        setProfile({
            name: user?.name || "",
            phone: user?.phone || "",
        });
    }, [user?.name, user?.phone]);

    const dashboard = `/${user?.role || "member"}/dashboard`;
    const roleName = ROLE_NAMES[user?.role] || "Utilisateur";
    const initial = (user?.name || "U").trim().charAt(0).toUpperCase() || "U";
    const active = user?.status === "active";

    const hasChanges =
        profile.name.trim() !== (user?.name || "").trim() ||
        profile.phone.trim() !== (user?.phone || "").trim();

    const passwordRules = [
        { label: "8 caractères minimum", valid: passwordForm.password.length >= 8 },
        { label: "Une majuscule", valid: /[A-Z]/.test(passwordForm.password) },
        { label: "Une minuscule", valid: /[a-z]/.test(passwordForm.password) },
        { label: "Un chiffre", valid: /\d/.test(passwordForm.password) },
    ];
    const passwordValid = passwordRules.every((rule) => rule.valid);
    const passwordsMatch = passwordForm.password === passwordForm.password_confirmation;

    const handleUpdateProfile = async (event) => {
        event.preventDefault();
        if (profileLoading || !hasChanges) return;

        setProfileError("");
        setProfileSuccess("");

        if (!profile.name.trim()) {
            setProfileError("Le nom complet est obligatoire.");
            return;
        }

        setProfileLoading(true);
        try {
            const response = await updateProfile({
                name: profile.name.trim(),
                phone: profile.phone.trim(),
            });
            await refreshUser();
            setProfileSuccess(response?.message || "Informations mises à jour avec succès.");
        } catch (error) {
            setProfileError(getError(error));
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        if (passwordLoading) return;

        setPasswordError("");
        setPasswordSuccess("");

        if (!passwordValid) {
            setPasswordError("Respectez les critères du nouveau mot de passe.");
            return;
        }
        if (!passwordsMatch) {
            setPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
            return;
        }
        if (passwordForm.current_password === passwordForm.password) {
            setPasswordError("Le nouveau mot de passe doit être différent de l'ancien.");
            return;
        }

        setPasswordLoading(true);
        try {
            const response = await changePassword(passwordForm);
            setPasswordSuccess(response?.message || "Mot de passe modifié avec succès.");
            setPasswordForm({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
        } catch (error) {
            setPasswordError(getError(error));
        } finally {
            setPasswordLoading(false);
        }
    };

    const resetProfileFeedback = () => {
        setProfileError("");
        setProfileSuccess("");
    };

    const resetPasswordFeedback = () => {
        setPasswordError("");
        setPasswordSuccess("");
    };

    return (
        <main className="min-h-full bg-slate-50 px-2 py-3 text-slate-900 sm:px-3">
            <div className="mx-auto max-w-[1100px] space-y-4">
                {/* Header */}
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">
                            Mon profil
                        </h1>
                        <p className="mt-1 text-[13px] text-slate-500">
                            Gérez vos informations personnelles et la sécurité de votre compte.
                        </p>
                    </div>
                </header>

                {/* Account overview */}
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                                {initial}
                            </div>

                            <div className="min-w-0">
                                <h2 className="truncate text-base font-bold text-[#0f1b33]">
                                    {user?.name || "Utilisateur"}
                                </h2>

                                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                    <span className="inline-flex min-w-0 items-center gap-1.5">
                                        <Mail size={13} className="shrink-0 text-slate-400" />
                                        <span className="truncate" title={user?.email || ""}>
                                            {user?.email || "Aucune adresse email"}
                                        </span>
                                    </span>

                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone size={13} className="shrink-0 text-slate-400" />
                                        {user?.phone || "Non renseigné"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                {roleName}
                            </span>

                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${active
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                    }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                />
                                {active ? "Compte actif" : "Compte non actif"}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Two panels */}
                <div className="grid items-start gap-4 lg:grid-cols-2">
                    {/* Personal information */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <PanelHeader
                            title="Informations personnelles"
                            description="Modifiez votre nom et votre numéro de téléphone."
                        />

                        <form onSubmit={handleUpdateProfile} className="space-y-4 p-5">
                            <Feedback error={profileError} success={profileSuccess} />

                            <Field id="profile-name" label="Nom complet" icon={UserRound} required>
                                <input
                                    id="profile-name"
                                    name="name"
                                    autoComplete="name"
                                    value={profile.name}
                                    onChange={(event) => {
                                        setProfile((current) => ({ ...current, name: event.target.value }));
                                        resetProfileFeedback();
                                    }}
                                    maxLength={160}
                                    disabled={profileLoading}
                                    required
                                    placeholder="Votre nom complet"
                                    className={`${inputClass} pl-9`}
                                />
                            </Field>

                            <Field id="profile-phone" label="Téléphone" icon={Phone}>
                                <input
                                    id="profile-phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={profile.phone}
                                    onChange={(event) => {
                                        setProfile((current) => ({ ...current, phone: event.target.value }));
                                        resetProfileFeedback();
                                    }}
                                    maxLength={32}
                                    disabled={profileLoading}
                                    placeholder="Ex : 06XXXXXXXX"
                                    className={`${inputClass} pl-9`}
                                />
                            </Field>

                            <Field id="profile-email" label="Adresse email" icon={Mail}>
                                <input
                                    id="profile-email"
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    readOnly
                                    className={`${inputClass} pl-9`}
                                />
                            </Field>

                            <p className="text-xs leading-5 text-slate-400">
                                Votre adresse email et votre rôle sont gérés par l'administration.
                            </p>

                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <span className="text-xs text-slate-400">
                                    {hasChanges ? "Modifications non enregistrées" : "Aucune modification"}
                                </span>

                                <button
                                    type="submit"
                                    disabled={!hasChanges || profileLoading}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {profileLoading ? (
                                        <LoaderCircle size={15} className="animate-spin" />
                                    ) : (
                                        <Save size={15} />
                                    )}
                                    {profileLoading ? "Enregistrement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Security */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <PanelHeader
                            title="Sécurité du compte"
                            description="Mettez à jour votre mot de passe."
                        />

                        <form onSubmit={handleChangePassword} className="space-y-4 p-5">
                            <Feedback error={passwordError} success={passwordSuccess} />

                            <PasswordInput
                                id="current_password"
                                label="Mot de passe actuel"
                                value={passwordForm.current_password}
                                onChange={(event) => {
                                    setPasswordForm((current) => ({ ...current, current_password: event.target.value }));
                                    resetPasswordFeedback();
                                }}
                                autoComplete="current-password"
                                placeholder="Votre mot de passe actuel"
                                disabled={passwordLoading}
                            />

                            <div>
                                <PasswordInput
                                    id="password"
                                    label="Nouveau mot de passe"
                                    value={passwordForm.password}
                                    onChange={(event) => {
                                        setPasswordForm((current) => ({ ...current, password: event.target.value }));
                                        resetPasswordFeedback();
                                    }}
                                    autoComplete="new-password"
                                    placeholder="Saisissez un nouveau mot de passe"
                                    disabled={passwordLoading}
                                />

                                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                    {passwordRules.map((rule) => (
                                        <li
                                            key={rule.label}
                                            className={`flex items-center gap-1.5 text-[11px] ${rule.valid ? "text-emerald-700" : "text-slate-400"
                                                }`}
                                        >
                                            {rule.valid ? <Check size={12} /> : <Circle size={10} />}
                                            {rule.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <PasswordInput
                                    id="password_confirmation"
                                    label="Confirmer le nouveau mot de passe"
                                    value={passwordForm.password_confirmation}
                                    onChange={(event) => {
                                        setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }));
                                        resetPasswordFeedback();
                                    }}
                                    autoComplete="new-password"
                                    placeholder="Confirmez le mot de passe"
                                    disabled={passwordLoading}
                                />

                                {passwordForm.password_confirmation && (
                                    <p
                                        className={`mt-1.5 text-[11px] font-medium ${passwordsMatch ? "text-emerald-700" : "text-red-600"
                                            }`}
                                    >
                                        {passwordsMatch
                                            ? "Les mots de passe correspondent."
                                            : "Les mots de passe ne correspondent pas."}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-4">
                                <button
                                    type="submit"
                                    disabled={
                                        passwordLoading ||
                                        !passwordForm.current_password ||
                                        !passwordValid ||
                                        !passwordsMatch
                                    }
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {passwordLoading && <LoaderCircle size={15} className="animate-spin" />}
                                    {passwordLoading ? "Mise à jour..." : "Modifier le mot de passe"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    );
}