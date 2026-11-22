import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone, Save, UserRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, changePassword } from "../../services/authApi";

// ─────────────── Constantes ───────────────
const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none transition "
    + "hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const submitClass = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
const pillClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

const ROLE_NAMES = { admin: "Administrateur", coach: "Coach", member: "Membre" };
const emptyPasswords = { current_password: "", password: "", password_confirmation: "" };

const PASSWORD_RULES = [
    ["8 caractères minimum", (p) => p.length >= 8],
    ["Une majuscule", (p) => /[A-Z]/.test(p)],
    ["Une minuscule", (p) => /[a-z]/.test(p)],
    ["Un chiffre", (p) => /\d/.test(p)],
];

const PASSWORD_FIELDS = [
    { id: "current_password", label: "Mot de passe actuel", autoComplete: "current-password", placeholder: "Votre mot de passe actuel" },
    { id: "password", label: "Nouveau mot de passe", autoComplete: "new-password", placeholder: "Saisissez un nouveau mot de passe" },
    { id: "password_confirmation", label: "Confirmer le nouveau mot de passe", autoComplete: "new-password", placeholder: "Confirmez le mot de passe" },
];

// ─────────────── Helpers ───────────────
function getError(error) {
    const first = Object.values(error?.response?.data?.errors ?? {}).flat()[0];
    return first || error?.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.";
}

// Lance une requête : vide le message, gère le chargement, puis affiche succès ou erreur
async function perform(setLoading, setMessage, task) {
    setLoading(true);
    setMessage({});
    try { setMessage({ success: await task() }); }
    catch (error) { setMessage({ error: getError(error) }); }
    finally { setLoading(false); }
}

// ─────────────── Composants ───────────────
function Feedback({ error, success }) {
    if (error) return <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">{error}</div>;
    if (!success) return null;
    return (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /><span>{success}</span>
        </div>
    );
}

function Field({ id, label, icon: Icon, required, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}{required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <div className="relative">
                <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {children}
            </div>
        </div>
    );
}

function TextField({ id, label, icon, required, ...props }) {
    return (
        <Field id={id} label={label} icon={icon} required={required}>
            <input id={id} name={id} required={required} className={`${inputClass} pl-9`} {...props} />
        </Field>
    );
}

function PasswordInput({ id, label, ...props }) {
    const [visible, setVisible] = useState(false);
    return (
        <Field id={id} label={label} icon={LockKeyhole}>
            <input id={id} name={id} type={visible ? "text" : "password"} minLength={id === "current_password" ? undefined : 8} required className={`${inputClass} pl-9 pr-10`} {...props} />
            <button type="button" disabled={props.disabled} onClick={() => setVisible((v) => !v)} aria-label={`${visible ? "Masquer" : "Afficher"} ${label.toLowerCase()}`}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
        </Field>
    );
}

function Panel({ title, description, onSubmit, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-3.5">
                <h2 className="text-sm font-bold text-[#0f1b33]">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 p-5">{children}</form>
        </section>
    );
}

// ─────────────── Page ───────────────
export default function Profile() {
    const { user, refreshUser } = useAuth();
    const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
    const [passwords, setPasswords] = useState(emptyPasswords);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState({});
    const [passwordMsg, setPasswordMsg] = useState({});

    useEffect(() => { setProfile({ name: user?.name || "", phone: user?.phone || "" }); }, [user?.name, user?.phone]);

    const active = user?.status === "active";
    const hasChanges = profile.name.trim() !== (user?.name || "").trim() || profile.phone.trim() !== (user?.phone || "").trim();
    const rules = PASSWORD_RULES.map(([label, test]) => ({ label, valid: test(passwords.password) }));
    const passwordValid = rules.every((r) => r.valid);
    const passwordsMatch = passwords.password === passwords.password_confirmation;

    // Met à jour un champ et efface le message de son formulaire
    const bind = (setValues, setMessage) => (key) => (event) => {
        setValues((current) => ({ ...current, [key]: event.target.value }));
        setMessage({});
    };
    const bindProfile = bind(setProfile, setProfileMsg);
    const bindPassword = bind(setPasswords, setPasswordMsg);

    const saveProfile = (event) => {
        event.preventDefault();
        if (profileLoading || !hasChanges) return;
        if (!profile.name.trim()) return setProfileMsg({ error: "Le nom complet est obligatoire." });
        perform(setProfileLoading, setProfileMsg, async () => {
            const response = await updateProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
            await refreshUser();
            return response?.message || "Informations mises à jour avec succès.";
        });
    };

    const savePassword = (event) => {
        event.preventDefault();
        if (passwordLoading) return;
        const problem = !passwordValid ? "Respectez les critères du nouveau mot de passe."
            : !passwordsMatch ? "La confirmation ne correspond pas au nouveau mot de passe."
            : passwords.current_password === passwords.password ? "Le nouveau mot de passe doit être différent de l'ancien." : "";
        if (problem) return setPasswordMsg({ error: problem });
        perform(setPasswordLoading, setPasswordMsg, async () => {
            const response = await changePassword(passwords);
            setPasswords(emptyPasswords);
            return response?.message || "Mot de passe modifié avec succès.";
        });
    };

    return (
        <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6">
            <div className="mx-auto max-w-[1100px] space-y-4">
                <header>
                    <h1 className="text-xl font-extrabold tracking-tight text-[#0f1b33] sm:text-2xl">Mon profil</h1>
                    <p className="mt-1 text-[13px] text-slate-500">Gérez vos informations personnelles et la sécurité de votre compte.</p>
                </header>

                {/* Aperçu du compte */}
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                            {(user?.name || "U").trim().charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-base font-bold text-[#0f1b33]">{user?.name || "Utilisateur"}</h2>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <Mail size={13} className="shrink-0 text-slate-400" />
                                    <span className="truncate" title={user?.email || ""}>{user?.email || "Aucune adresse email"}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone size={13} className="shrink-0 text-slate-400" />{user?.phone || "Non renseigné"}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`${pillClass} bg-blue-50 text-blue-700 ring-blue-600/20`}>{ROLE_NAMES[user?.role] || "Utilisateur"}</span>
                        <span className={`${pillClass} ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {active ? "Compte actif" : "Compte non actif"}
                        </span>
                    </div>
                </section>

                <div className="grid items-start gap-4 lg:grid-cols-2">
                    {/* Informations personnelles */}
                    <Panel title="Informations personnelles" description="Modifiez votre nom et votre numéro de téléphone." onSubmit={saveProfile}>
                        <Feedback {...profileMsg} />
                        <TextField id="name" label="Nom complet" icon={UserRound} required autoComplete="name" maxLength={160} placeholder="Votre nom complet"
                            value={profile.name} onChange={bindProfile("name")} disabled={profileLoading} />
                        <TextField id="phone" label="Téléphone" icon={Phone} type="tel" autoComplete="tel" maxLength={32} placeholder="Ex : 06XXXXXXXX"
                            value={profile.phone} onChange={bindProfile("phone")} disabled={profileLoading} />
                        <TextField id="email" label="Adresse email" icon={Mail} type="email" value={user?.email || ""} disabled readOnly />
                        <p className="text-xs leading-5 text-slate-400">Votre adresse email et votre rôle sont gérés par l'administration.</p>
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <span className="text-xs text-slate-400">{hasChanges ? "Modifications non enregistrées" : "Aucune modification"}</span>
                            <button type="submit" disabled={!hasChanges || profileLoading} className={submitClass}>
                                {profileLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                                {profileLoading ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </Panel>

                    {/* Sécurité */}
                    <Panel title="Sécurité du compte" description="Mettez à jour votre mot de passe." onSubmit={savePassword}>
                        <Feedback {...passwordMsg} />
                        {PASSWORD_FIELDS.map((field) => (
                            <div key={field.id}>
                                <PasswordInput {...field} value={passwords[field.id]} onChange={bindPassword(field.id)} disabled={passwordLoading} />
                                {field.id === "password" && (
                                    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                                        {rules.map(({ label, valid }) => (
                                            <li key={label} className={`flex items-center gap-1.5 text-[11px] ${valid ? "text-emerald-700" : "text-slate-400"}`}>
                                                {valid ? <Check size={12} /> : <Circle size={10} />}{label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {field.id === "password_confirmation" && passwords.password_confirmation && (
                                    <p className={`mt-1.5 text-[11px] font-medium ${passwordsMatch ? "text-emerald-700" : "text-red-600"}`}>
                                        {passwordsMatch ? "Les mots de passe correspondent." : "Les mots de passe ne correspondent pas."}
                                    </p>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-end border-t border-slate-100 pt-4">
                            <button type="submit" disabled={passwordLoading || !passwords.current_password || !passwordValid || !passwordsMatch} className={submitClass}>
                                {passwordLoading && <LoaderCircle size={15} className="animate-spin" />}
                                {passwordLoading ? "Mise à jour..." : "Modifier le mot de passe"}
                            </button>
                        </div>
                    </Panel>
                </div>
            </div>
        </main>
    );
}