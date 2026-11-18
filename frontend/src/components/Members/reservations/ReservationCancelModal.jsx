import { useEffect } from "react";
import { AlertTriangle, Ban, LoaderCircle, X } from "lucide-react";

export default function ReservationCancelModal({ reservation, onClose, onConfirm, busy = false, error = "" }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  if (!reservation) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="cancel-reservation-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={22} /></span>
            <div>
              <h2 id="cancel-reservation-title" className="text-lg font-extrabold text-slate-900">Annuler la réservation ?</h2>
              <p className="mt-1 text-xs text-slate-500">Vérifiez votre choix avant de continuer.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={19} /></button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-extrabold text-slate-900">{reservation.session?.course?.name || "Cours sportif"}</p>
            <p className="mt-1 text-xs text-slate-500">Réservation #{reservation.id}</p>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Votre place sera libérée si l'annulation est acceptée. Les réservations avec paiement associé peuvent nécessiter l'intervention de l'administration.
          </p>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-5">
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 disabled:opacity-50">Garder ma place</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Ban size={17} />}
            {busy ? "Annulation..." : "Confirmer l'annulation"}
          </button>
        </div>
      </section>
    </div>
  );
}
