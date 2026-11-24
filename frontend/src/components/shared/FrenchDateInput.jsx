import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

export function formatFrenchDate(value, withTime = false) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(value);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}${withTime && match[4] ? ` ${match[4]}` : ""}`;
}

export function parseFrenchDate(value, withTime = false) {
  const match = (withTime ? /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/ : /^(\d{2})\/(\d{2})\/(\d{4})$/).exec(value.trim());
  if (!match) return null;
  const [, day, month, year, hours = "00", minutes = "00"] = match;
  if (+year < 1 || +month < 1 || +month > 12 || +day < 1 || +hours > 23 || +minutes > 59) return null;
  const check = new Date(0);
  check.setUTCFullYear(+year, +month - 1, +day);
  if (check.getUTCFullYear() !== +year || check.getUTCMonth() !== +month - 1 || check.getUTCDate() !== +day) return null;
  return `${year}-${month}-${day}${withTime ? `T${hours}:${minutes}` : ""}`;
}

// Text is always French, independently of the browser locale. The native picker
// is retained as an optional shortcut. Parent components still receive ISO strings.
export default function FrenchDateInput({ type = "date", value = "", onChange, min, max, required, disabled, className, ...props }) {
  const withTime = type === "datetime-local";
  const [draft, setDraft] = useState(() => formatFrenchDate(value, withTime));
  const input = useRef(null);
  const picker = useRef(null);
  const lastValue = useRef(value);
  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      setDraft(formatFrenchDate(value, withTime));
    }
  }, [value, withTime]);
  function validation(text) {
    if (!text.trim()) return required ? "Ce champ est obligatoire." : "";
    const iso = parseFrenchDate(text, withTime);
    if (!iso) return `Date invalide. Format : ${withTime ? "JJ/MM/AAAA HH:mm" : "JJ/MM/AAAA"}.`;
    if (min && iso < min) return `Date minimale : ${formatFrenchDate(min, withTime)}.`;
    if (max && iso > max) return `Date maximale : ${formatFrenchDate(max, withTime)}.`;
    return "";
  }
  useEffect(() => { input.current?.setCustomValidity(validation(draft)); }, [draft, min, max, required, withTime]);
  function update(text) {
    setDraft(text);
    const problem = validation(text);
    input.current?.setCustomValidity(problem);
    if (!problem || !text.trim()) {
      const iso = text.trim() ? parseFrenchDate(text, withTime) : "";
      if (iso !== lastValue.current) {
        lastValue.current = iso;
        onChange?.({ target: { value: iso }, currentTarget: { value: iso } });
      }
    }
  }
  return (
    <span className={`relative inline-flex max-w-full min-w-0 items-center ${className?.includes("w-full") ? "w-full" : ""}`}>
      <input {...props} ref={input} type="text" value={draft} required={required} disabled={disabled}
        placeholder={withTime ? "JJ/MM/AAAA HH:mm" : "JJ/MM/AAAA"}
        autoComplete="off" maxLength={withTime ? 16 : 10}
        className={`${className || ""} !pr-9`} onChange={(event) => update(event.target.value)}
        onBlur={() => { if (draft.trim() && validation(draft)) input.current?.reportValidity(); }} />
      <input ref={picker} type={type} value={value || ""} min={min} max={max} disabled={disabled}
        tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute right-0 h-8 w-8 opacity-0"
        onChange={(event) => update(formatFrenchDate(event.target.value, withTime))} />
      <button type="button" disabled={disabled} aria-label="Ouvrir le calendrier" title="Ouvrir le calendrier"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-blue-600"
        onClick={() => { try { if (picker.current?.showPicker) picker.current.showPicker(); else input.current?.focus(); } catch { input.current?.focus(); } }}>
        <CalendarDays size={15} />
      </button>
    </span>
  );
}
