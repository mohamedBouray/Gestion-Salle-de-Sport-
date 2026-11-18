import { useEffect, useState } from "react";
import { AlertCircle, Info, LoaderCircle, X } from "lucide-react";

import { apiError } from "../../services/api";
import { planningApi } from "../../services/PlanningApi";

// =====================================
// CONFIGURATION
// =====================================

const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 " +
  "text-[13px] text-slate-800 outline-none transition " +
  "placeholder:text-slate-400 hover:border-slate-300 " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60";

const statusOptions = [
  { value: "scheduled", label: "Programmée" },
  { value: "completed", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
];

const weekDays = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

// =====================================
// HELPERS
// =====================================

function localDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())}T` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}`
  );
}

function initialForm(session) {
  if (session) {
    return {
      course_id: String(session.course_id ?? session.course?.id ?? ""),
      coach_id: String(session.coach_id ?? session.coach?.id ?? ""),
      start_at: localDateTime(session.start_at),
      end_at: localDateTime(session.end_at),
      capacity: String(session.capacity ?? 15),
      location: session.location ?? "",
      status: session.status ?? "scheduled",
    };
  }

  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    course_id: "",
    coach_id: "",
    start_at: localDateTime(start),
    end_at: localDateTime(end),
    capacity: "15",
    location: "",
    status: "scheduled",
  };
}

function getCollection(response, key) {
  const value = response?.[key] ?? response?.data ?? response;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

// =====================================
// FORM FIELD
// =====================================

function Field({ label, required = false, children, className = "" }) {
  return (
    <label className={`block min-w-0 text-xs font-semibold text-slate-600 ${className}`}>
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {children}
    </label>
  );
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function SessionModal({
  session = null,
  courses = [],
  coaches = [],
  onClose,
  onSave,
  saving = false,
}) {
  const isEditing = Boolean(session?.id);

  const [form, setForm] = useState(() => initialForm(session));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [availabilities, setAvailabilities] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const busy = saving || submitting;

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));

    if (error) setError("");
  }

  // =====================================
  // ESCAPE CLOSE
  // =====================================

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose]);

  // =====================================
  // COACH AVAILABILITY
  // =====================================

  useEffect(() => {
    if (!form.coach_id) {
      setAvailabilities([]);
      setAvailabilityError("");
      return;
    }

    let active = true;

    async function loadAvailability() {
      setCheckingAvailability(true);
      setAvailabilityError("");

      try {
        const response = await planningApi.admin.coachAvailabilities(
          form.coach_id
        );

        if (!active) return;

        setAvailabilities(getCollection(response, "availabilities"));
      } catch (err) {
        if (!active) return;

        setAvailabilities([]);
        setAvailabilityError(apiError(err));
      } finally {
        if (active) {
          setCheckingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [form.coach_id]);

  // =====================================
  // COURSE SELECTION
  // =====================================

  function selectCourse(value) {
    const selected = courses.find((course) => String(course.id) === value);

    setForm((current) => ({
      ...current,
      course_id: value,
      coach_id: selected?.coach_id ? String(selected.coach_id) : current.coach_id,
    }));

    setError("");
  }

  // Keep existing values selectable even when the related
  // coach/course is no longer in the active list.

  const courseMissing =
    Boolean(form.course_id) &&
    !courses.some((course) => String(course.id) === form.course_id);

  const coachMissing =
    Boolean(form.coach_id) &&
    !coaches.some((coach) => String(coach.id) === form.coach_id);

  const activeAvailability = availabilities.filter(
    (item) =>
      item.is_active === true || item.is_active === 1 || item.is_active === "1"
  );

  // =====================================
  // SUBMIT
  // =====================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    setError("");

    try {
      if (!form.course_id || !form.coach_id) {
        throw new Error("Veuillez sélectionner un cours et un coach.");
      }

      if (!form.start_at || !form.end_at) {
        throw new Error("Veuillez renseigner les dates et horaires.");
      }

      const startDate = new Date(form.start_at);
      const endDate = new Date(form.end_at);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        throw new Error("Date ou heure invalide.");
      }

      if (endDate <= startDate) {
        throw new Error("L'heure de fin doit être après l'heure de début.");
      }

      if (!isEditing && startDate <= new Date()) {
        throw new Error("La nouvelle séance doit commencer dans le futur.");
      }

      const capacity = Number(form.capacity);

      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
        throw new Error("La capacité doit être comprise entre 1 et 1000.");
      }

      const payload = {
        course_id: Number(form.course_id),
        coach_id: Number(form.coach_id),
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        capacity,
        location: form.location.trim() || null,
        status: form.status,
      };

      setSubmitting(true);

      await onSave(payload);

      // PlanningPage closes this modal after a successful API response.
    } catch (err) {
      setError(
        err?.response
          ? apiError(err)
          : err?.message || "Impossible d'enregistrer la séance."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =====================================
  // RENDER
  // =====================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-modal-title"
        className="flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        {/* HEADER */}

        <header className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="session-modal-title"
              className="text-base font-bold text-[#0f1b33]"
            >
              {isEditing ? "Modifier la séance" : "Programmer une séance"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Organisez les horaires et les places du cours.
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

        {/* FORM */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-700"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cours sportif" required>
                <select
                  required
                  value={form.course_id}
                  onChange={(event) => selectCourse(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Choisir un cours</option>

                  {courseMissing && (
                    <option value={form.course_id}>
                      Cours actuel #{form.course_id}
                    </option>
                  )}

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Coach responsable" required>
                <select
                  required
                  value={form.coach_id}
                  onChange={(event) => change("coach_id", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Choisir un coach</option>

                  {coachMissing && (
                    <option value={form.coach_id}>
                      Coach actuel #{form.coach_id}
                    </option>
                  )}

                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {form.coach_id && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs font-semibold text-slate-700">
                  Disponibilités habituelles du coach
                </p>

                {checkingAvailability ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Chargement des disponibilités...
                  </p>
                ) : availabilityError ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Disponibilités indisponibles : {availabilityError}
                  </p>
                ) : activeAvailability.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeAvailability.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium tabular-nums text-slate-600"
                      >
                        {weekDays[Number(item.day_of_week)] || "Jour"}{" "}
                        {String(item.start_time).slice(0, 5)}
                        {" – "}
                        {String(item.end_time).slice(0, 5)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Aucune disponibilité déclarée.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Début de séance" required>
                <input
                  type="datetime-local"
                  required
                  value={form.start_at}
                  onChange={(event) => change("start_at", event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Fin de séance" required>
                <input
                  type="datetime-local"
                  required
                  min={form.start_at || undefined}
                  value={form.end_at}
                  onChange={(event) => change("end_at", event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Salle / Lieu">
                <input
                  type="text"
                  maxLength={160}
                  placeholder="Ex : Studio A"
                  value={form.location}
                  onChange={(event) => change("location", event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Capacité maximale" required>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={form.capacity}
                  onChange={(event) => change("capacity", event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Statut de la séance" className="sm:col-span-2">
                <select
                  value={form.status}
                  onChange={(event) => change("status", event.target.value)}
                  className={inputClass}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <Info size={15} className="mt-0.5 shrink-0 text-blue-600" />
              Les disponibilités sont indicatives. Les conflits d'horaires et
              les réservations existantes sont validés par le serveur.
            </p>
          </div>

          {/* FOOTER */}

          <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Fermer
            </button>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <LoaderCircle size={14} className="animate-spin" />}

              {busy
                ? "Enregistrement..."
                : isEditing
                  ? "Enregistrer les modifications"
                  : "Programmer la séance"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}