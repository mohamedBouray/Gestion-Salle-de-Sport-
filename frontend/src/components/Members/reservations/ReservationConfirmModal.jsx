import { useEffect } from "react";
import { CheckCircle2, Clock3, LoaderCircle, X } from "lucide-react";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-reservation-title"
        className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="confirm-reservation-title" className="text-base font-bold text-[#0f1b33]">
              Confirmer ma réservation
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Vérifiez les informations de votre séance.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fermer"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-3 p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-sm font-bold text-[#0f1b33]">
              {session.course?.name || "Cours sportif"}
            </p>
            <p className="mt-2 flex items-start gap-2 text-[13px] capitalize text-slate-600">
              <Clock3 size={14} className="mt-0.5 shrink-0 text-blue-600" />
              {formattedDate(session.start_at)}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Coach : {session.coach?.name || "À confirmer"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Salle : {session.location || "À confirmer"}
            </p>
          </div>

          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
            La réservation est soumise à la vérification finale de votre
            abonnement et des places disponibles.
          </p>

          {error && (
            <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Retour
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {busy ? "Réservation..." : "Confirmer"}
          </button>
        </footer>
      </section>
    </div>
  );
}