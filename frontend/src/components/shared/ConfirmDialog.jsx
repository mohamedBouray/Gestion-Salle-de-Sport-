import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, ShieldCheck, X } from "lucide-react";

const variants = {
  danger: { Icon: AlertTriangle, icon: "bg-amber-50 text-amber-600", button: "bg-red-600 hover:bg-red-700" },
  warning: { Icon: AlertTriangle, icon: "bg-amber-50 text-amber-600", button: "bg-amber-600 hover:bg-amber-700" },
  primary: { Icon: ShieldCheck, icon: "bg-blue-50 text-blue-600", button: "bg-blue-600 hover:bg-blue-700" },
  success: { Icon: CheckCircle2, icon: "bg-emerald-50 text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700" },
  info: { Icon: Info, icon: "bg-slate-100 text-slate-600", button: "bg-slate-700 hover:bg-slate-800" },
};

/** Dialogue partagé : l'action API reste dans la page appelante (onConfirm). */
export default function ConfirmDialog({
  open = true, title = "Confirmer cette action ?", description = "", subject = "",
  subjectLabel = "ÉLÉMENT SÉLECTIONNÉ", warning = "", variant = "danger",
  confirmLabel = "Confirmer", cancelLabel = "Annuler", loading = false, error = "",
  onConfirm, onCancel, children,
}) {
  const titleId = useId(), descriptionId = useId(), dialogRef = useRef(null);
  const cancelRef = useRef(null), closeRef = useRef(onCancel), loadingRef = useRef(loading);
  closeRef.current = onCancel; loadingRef.current = loading;
  const { Icon, icon, button } = variants[variant] ?? variants.danger;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!loadingRef.current) closeRef.current?.();
      }
      if (event.key !== "Tab") return;
      const list = [...(dialogRef.current?.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]') || [])];
      if (!list.length) return event.preventDefault();
      const first = list[0], last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onCancel?.(); }}>
      <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="overflow-y-auto px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${icon}`}><Icon size={24} /></span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
              <p id={descriptionId} className="mt-1.5 text-[13px] leading-6 text-slate-500 sm:text-sm">{description}</p>
            </div>
            <button type="button" disabled={loading} onClick={onCancel} aria-label="Fermer"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"><X size={19} /></button>
          </div>
          {subject && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{subjectLabel}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{subject}</p>
          </div>}
          {warning && <p className="mt-4 text-[13px] leading-6 text-amber-700">{warning}</p>}
          {children && <div className="mt-4">{children}</div>}
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}
        </div>
        <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-7">
          <button ref={cancelRef} type="button" disabled={loading} onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{cancelLabel}</button>
          <button type="button" disabled={loading} onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition disabled:cursor-wait disabled:opacity-60 ${button}`}>
            {loading && <LoaderCircle size={15} className="animate-spin" />}{loading ? "Traitement..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>, document.body
  );
}
