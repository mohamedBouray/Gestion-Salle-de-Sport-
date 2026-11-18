import { useEffect } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, X } from "lucide-react";

function formattedDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function ReservationConfirmModal({ session, onClose, onConfirm, busy = false, error = "" }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  if (!session) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-reservation-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarCheck2 size={22} /></span>
            <div>
              <h2 id="confirm-reservation-title" className="text-lg font-extrabold text-slate-900">Confirmer ma réservation</h2>
              <p className="mt-1 text-xs text-slate-500">Vérifiez les informations de votre séance.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={19} /></button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-base font-extrabold text-slate-900">{session.course?.name || "Cours sportif"}</p>
            <p className="mt-3 flex items-start gap-2 text-sm text-slate-600"><Clock3 size={16} className="mt-0.5 shrink-0 text-blue-600" />{formattedDate(session.start_at)}</p>
            <p className="mt-2 text-sm text-slate-500">Coach : {session.coach?.name || "À confirmer"}</p>
            <p className="mt-1 text-sm text-slate-500">Salle : {session.location || "À confirmer"}</p>
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            La réservation est soumise à la vérification finale de votre abonnement et des places disponibles.
          </p>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 p-5">
          <button type="button" onClick={onClose} disabled={busy} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 disabled:opacity-50">Retour</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
            {busy ? "Réservation..." : "Confirmer"}
          </button>
        </div>
      </section>
    </div>
  );
}
