import { ArrowLeft, Construction } from "lucide-react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { getRoleItems } from "../../layouts/Navigation";

export default function SectionPlaceholder() {
    const { role = "member" } = useOutletContext() || {};
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const item = getRoleItems(role).find((entry) => entry.path === pathname);
    const Icon = item?.icon || Construction;

    return <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">{role} workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{item?.label || "Module"}</h1>
        <p className="mt-2 text-sm text-slate-400">Gestion et suivi depuis votre espace.</p>

        <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#121A2B] px-5 py-10 text-center">
            <span className="rounded-xl bg-blue-500/10 p-4 text-blue-400"><Icon size={28} /></span>
            <h2 className="mt-4 text-lg font-semibold text-white">Module {item?.label || "à venir"}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Cette page est prête pour la future intégration avec Laravel API.</p>
            <button type="button" onClick={() => navigate(`/${role}/dashboard`)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#165DFF] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                <ArrowLeft size={15} /> Retour au tableau de bord
            </button>
        </div>
    </div>;
}