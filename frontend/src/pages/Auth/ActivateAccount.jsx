import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Dumbbell, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { invitationApi } from "../../services/authApi";
import { apiError } from "../../services/authApi";

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ActivateAccount() {
    const [params] = useSearchParams();
    const email = params.get("email") || "";
    const token = params.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    async function submit(event) {
        event.preventDefault();
        if (!email || !token || busy) return;
        if (password !== confirmation) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await invitationApi.accept({
                email,
                token,
                password,
                password_confirmation: confirmation,
            });
            setDone(true);
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white"><Dumbbell size={22} /></span>
                    <div><h1 className="text-xl font-bold">GYM Management</h1><p className="text-sm text-slate-500">Activation du compte</p></div>
                </div>
                {done ? (
                    <div className="space-y-4 text-center">
                        <CheckCircle2 size={48} className="mx-auto text-blue-600" />
                        <h2 className="text-xl font-bold">Votre compte est activé</h2>
                        <p className="text-sm text-slate-600">Vous pouvez maintenant vous connecter avec votre e-mail et le mot de passe choisi.</p>
                        <Link to="/login" className="block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Se connecter</Link>
                    </div>
                ) : !email || !token ? (
                    <div className="space-y-4"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Lien incomplet. Demandez à l'administrateur de renvoyer une invitation.</p><Link className="font-semibold text-blue-600" to="/login">Retour à la connexion</Link></div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900"><LockKeyhole size={16} className="mr-2 inline" />Invitation pour <strong className="break-all">{email}</strong></div>
                        <label className="block text-sm font-semibold">Nouveau mot de passe
                            <div className="relative"><input required minLength={8} type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className={`${inputClass} pr-12`} />
                                <button type="button" aria-label={visible ? "Masquer" : "Afficher"} onClick={() => setVisible((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </label>
                        <label className="block text-sm font-semibold">Confirmer le mot de passe
                            <input required minLength={8} type={visible ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className={inputClass} />
                        </label>
                        <p className="text-xs text-slate-500">8 caractères minimum, majuscule, minuscule et chiffre.</p>
                        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                        <button type="submit" disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Activation..." : "Activer mon compte"}</button>
                    </form>
                )}
            </div>
        </main>
    );
}
