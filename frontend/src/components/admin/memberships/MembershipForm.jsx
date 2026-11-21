
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { membershipsApi } from "../../../services/MembershipsApi";
import { apiError } from "../../../services/api";

const control =
  "mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500";

function todayLocal() {
  const d = new Date();
  return new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);
}

export default function MembershipForm({
  onClose,
  onSave,
}) {
  const [memberSearch, setMemberSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startsAt, setStartsAt] = useState(todayLocal());

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setLoadingOptions(true);

      membershipsApi.options(
        memberSearch.trim(),
        controller.signal
      )
        .then((response) => {
          if (controller.signal.aborted) return;

          setMembers(
            Array.isArray(response.members)
              ? response.members
              : []
          );

          setPlans(
            Array.isArray(response.plans)
              ? response.plans
              : []
          );

          setError("");
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setError(apiError(err));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingOptions(false);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [memberSearch]);

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === planId),
    [plans, planId]
  );

  async function submit(event) {
    event.preventDefault();

    if (saving) return;

    if (!memberId || !planId || !startsAt) {
      setError(
        "Sélectionnez un membre, une formule et une date."
      );
      return;
    }

    try {
      setError("");
      setSaving(true);

      await onSave({
        member_id: Number(memberId),
        plan_id: Number(planId),
        starts_at: startsAt,
      });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Attribuer un abonnement"
        className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Nouvel abonnement
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Attribution à un membre de la salle
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
        </header>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="membership-member-search"
              className="text-xs font-semibold text-slate-700"
            >
              Rechercher un membre
            </label>

            <div className="relative mt-1.5">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="membership-member-search"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberId("");
                }}
                placeholder="Nom ou email..."
                className={`${control} mt-0 pl-9`}
              />
            </div>

            <select
              aria-label="Sélectionner un membre"
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className={control}
            >
              <option value="">
                {loadingOptions
                  ? "Recherche..."
                  : "Choisir un membre actif"}
              </option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>

            <p className="mt-1 text-[11px] text-slate-500">
              La recherche affiche uniquement les comptes
              Members actifs.
            </p>
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Formule d'abonnement
            <select
              required
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className={control}
            >
              <option value="">Choisir une formule active</option>

              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {Number(plan.price).toFixed(2)} MAD
                </option>
              ))}
            </select>
          </label>

          {selectedPlan && (
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              Durée : {selectedPlan.duration_value}{" "}
              {selectedPlan.duration_unit}
              {" · "}
              Prix : {Number(selectedPlan.price).toFixed(2)} MAD
            </div>
          )}

          <label className="block text-xs font-semibold text-slate-700">
            Date de début
            <input
              required
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={control}
            />
          </label>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
            L'abonnement sera créé <strong>En attente</strong>.
            L'activation se fait séparément par l'Admin.
            Aucun paiement n'est enregistré automatiquement.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700"
            >
              Fermer
            </button>

            <button
              type="submit"
              disabled={saving || loadingOptions}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />
              )}
              {saving ? "Enregistrement..." : "Attribuer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
