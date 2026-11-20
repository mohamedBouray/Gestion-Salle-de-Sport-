import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, RefreshCw, X } from "lucide-react";
import { apiError } from "../../services/api";
import { courseProposalsAdminApi } from "../../services/CourseProposalsAdminApi";

const statusLabels = { pending: "En attente", approved: "Acceptée", rejected: "Refusée" };
const badge = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-rose-50 text-rose-700" };
function ProposalCard({ item, onReviewed }) {
  const [price, setPrice] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(action) {
    setError(""); setBusy(true);
    try {
      if (action === "reject" && !note.trim()) { setError("Motif du refus obligatoire."); return; }
      if (action === "approve") await courseProposalsAdminApi.approve(item.id, Number(price), note.trim());
      else await courseProposalsAdminApi.reject(item.id, note.trim());
      onReviewed();
    } catch (e) { setError(apiError(e)); }
    finally { setBusy(false); }
  }
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><BookOpen size={18}/></span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge[item.status] || "bg-slate-100"}`}>{statusLabels[item.status] || item.status}</span></div>
    <h3 className="mt-3 text-sm font-bold text-slate-900">{item.name}</h3><p className="mt-1 text-xs text-slate-500">Proposé par {item.coach?.name || "Coach"}</p>
    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{item.description || "Sans description."}</p>
    <p className="mt-3 text-[11px] text-slate-400">{item.suggested_duration_minutes || "—"} min suggérées · {item.suggested_capacity || "—"} places suggérées</p>
    {item.review_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Retour : {item.review_note}</p>}
    {item.status === "pending" && <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
      <div className="grid grid-cols-[100px_1fr] gap-2"><label className="text-[11px] font-semibold text-slate-600">Prix (MAD)<input type="number" min="0" max="999999" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"/></label><label className="text-[11px] font-semibold text-slate-600">Note / motif refus<textarea rows="1" value={note} maxLength={1000} onChange={(e)=>setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"/></label></div>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2"><button disabled={busy || price==="" || Number(price)<0} onClick={()=>decide("approve")} type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14}/> Accepter</button><button disabled={busy} onClick={()=>decide("reject")} type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 px-2 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><X size={14}/> Refuser</button></div>
    </div>}
  </article>;
}
export default function CourseProposalsPage() {
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    courseProposalsAdminApi.list({ status: status || undefined, page })
      .then(r => { if (active) { setItems(r.proposals?.data || []); setPages(r.proposals?.last_page || 1); } })
      .catch(e => { if (active) setError(apiError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active=false; };
  }, [status, page, tick]);
  return <main className="min-h-full bg-slate-50 px-4 py-5 text-slate-900 sm:px-6"><div className="mx-auto max-w-[1200px] space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><Link to="/admin/classes" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"><ArrowLeft size={13}/> Gestion des cours</Link><h1 className="mt-2 text-xl font-extrabold">Propositions des coachs</h1><p className="mt-1 text-xs text-slate-500">Validez les nouveaux cours proposés par vos coachs.</p></div><button type="button" onClick={()=>setTick(t=>t+1)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><RefreshCw size={14}/> Actualiser</button></header>
    <div className="flex gap-2">{[["pending","En attente"],["approved","Acceptées"],["rejected","Refusées"]].map(([key,label])=><button key={key} onClick={()=>{setStatus(key);setPage(1);}} className={`rounded-lg px-3 py-2 text-xs font-bold ${status===key?"bg-blue-600 text-white":"border border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}</div>
    {error && <div role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
    {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Chargement...</p> : items.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(item=><ProposalCard key={item.id} item={item} onReviewed={()=>setTick(t=>t+1)}/>)}</div> : <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">Aucune proposition pour ce statut.</p>}
    {pages>1 && <div className="flex items-center justify-end gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-40">Précédent</button><span className="text-xs text-slate-500">{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-40">Suivant</button></div>}
  </div></main>;
}
