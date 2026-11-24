import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { apiError } from "../../../services/api";

const inputClass =
  "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500";

const labelClass = "block text-xs font-semibold text-slate-700";

export default function TariffForm({
  plan,
  courses = [],
  coursesError = "",
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: plan?.name || "",
    type: plan?.type || "general",
    course_id: plan?.course_id ? String(plan.course_id) : "",
    duration_value: String(plan?.duration_value ?? 1),
    duration_unit: plan?.duration_unit || "month",
    price: String(plan?.price ?? ""),
    description: plan?.description || "",
    status: plan?.status || "active",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "type" ? { course_id: "" } : {}),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;

    setError("");

    const duration = Number(form.duration_value);
    const price = Number(form.price);

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 365
    ) {
      setError("La durée doit être entre 1 et 365.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !/^\d+(?:\.\d{1,2})?$/.test(form.price.trim()) ||
      !Number.isFinite(price) ||
      price < 0 || price > 99999999.99
    ) {
      setError("Indiquez un prix valide.");
      return;
    }

    if (form.name.trim().length < 2 || form.name.trim().length > 160 || !/\p{L}/u.test(form.name)) {
      setError("Nom du tarif invalide : 2 à 160 caractères et au moins une lettre."); return;
    }
    if (form.description.trim().length > 2000) { setError("Description : maximum 2000 caractères."); return; }
    if (form.type === "course" && !form.course_id) {
      setError("Sélectionnez un cours sportif.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      course_id:
        form.type === "course" ? Number(form.course_id) : null,
      duration_value: duration,
      duration_unit: form.duration_unit,
      price: price.toFixed(2),
      description: form.description.trim() || null,
      status: form.status,
    };

    try {
      setSaving(true);
      await onSave(payload);
    } catch (err) {
      setError(apiError(err) || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={plan ? "Modifier le tarif" : "Nouveau tarif"}
        className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {plan ? "Modifier le tarif" : "Nouveau tarif"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Configuration de la formule
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </p>
          )}

          <label className={labelClass}>
            Nom du tarif *
            <input
              required
              maxLength={160}
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              placeholder="Ex : Abonnement mensuel"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Type de formule *
            <select
              value={form.type}
              onChange={(e) => change("type", e.target.value)}
              className={inputClass}
            >
              <option value="general">Accès général</option>
              <option value="course">Cours spécifique</option>
            </select>
          </label>

          {form.type === "course" && (
            <label className={labelClass}>
              Cours sportif *
              <select
                required
                value={form.course_id}
                onChange={(e) => change("course_id", e.target.value)}
                className={inputClass}
              >
                <option value="">Choisir un cours</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {coursesError && (
                <span className="mt-1 block text-xs text-rose-600">
                  {coursesError}
                </span>
              )}
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Durée *
              <input
                required
                type="number"
                min={1}
                max={365}
                step={1}
                value={form.duration_value}
                onChange={(e) =>
                  change("duration_value", e.target.value)
                }
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Unité *
              <select
                value={form.duration_unit}
                onChange={(e) =>
                  change("duration_unit", e.target.value)
                }
                className={inputClass}
              >
                <option value="day">Jour(s)</option>
                <option value="month">Mois</option>
                <option value="year">Année(s)</option>
              </select>
            </label>
          </div>

          <label className={labelClass}>
            Prix (MAD) *
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => change("price", e.target.value)}
              placeholder="299.00"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Description
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) =>
                change("description", e.target.value)
              }
              placeholder="Description de la formule..."
              className={`${inputClass} h-auto py-2`}
            />
          </label>

          <label className={labelClass}>
            Statut
            <select
              value={form.status}
              onChange={(e) => change("status", e.target.value)}
              className={inputClass}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && <LoaderCircle size={14} className="animate-spin" />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
