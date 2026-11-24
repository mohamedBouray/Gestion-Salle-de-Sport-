import { gymLocalDateTime, gymInstant } from "../../../utils/gymDates.js";
import FrenchDateInput from "../../shared/FrenchDateInput";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";

import { paymentsApi } from "../../../services/PaymentsApi";
import { apiError } from "../../../services/api";

const inputClass =
  "mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-500";

const labelClass = "block text-xs font-semibold text-slate-700";

const localDateTime = gymLocalDateTime;

export default function PaymentForm({ onClose, onSave }) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [memberId, setMemberId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");

  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(localDateTime());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Rechercher les membres
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      setLoadingMembers(true);

      paymentsApi
        .options(
          { member_search: search.trim() },
          controller.signal
        )
        .then((data) => {
          if (!controller.signal.aborted) {
            setMembers(
              Array.isArray(data.members) ? data.members : []
            );
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setError(apiError(err));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingMembers(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  // Charger les abonnements du membre sélectionné
  useEffect(() => {
    if (!memberId) {
      setSubscriptions([]);
      return;
    }

    const controller = new AbortController();

    setLoadingSubscriptions(true);
    setSubscriptions([]);

    paymentsApi
      .options(
        { member_id: Number(memberId) },
        controller.signal
      )
      .then((data) => {
        if (!controller.signal.aborted) {
          setSubscriptions(
            Array.isArray(data.subscriptions)
              ? data.subscriptions
              : []
          );
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(apiError(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingSubscriptions(false);
        }
      });

    return () => controller.abort();
  }, [memberId]);

  const selectedSubscription = useMemo(
    () =>
      subscriptions.find(
        (item) => String(item.id) === subscriptionId
      ),
    [subscriptions, subscriptionId]
  );

  function chooseSubscription(id) {
    setSubscriptionId(id);

    const selected = subscriptions.find(
      (item) => String(item.id) === id
    );

    if (selected) {
      const remaining =
        selected.remaining_amount ??
        selected.price_at_purchase;

      setAmount(
        remaining == null ? "" : String(remaining)
      );
    } else {
      setAmount("");
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (saving) return;

    const value = Number(amount);

    if (!memberId || !subscriptionId) {
      setError("Choisissez un membre et son abonnement.");
      return;
    }

    if (
      amount.trim() === "" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 99999999.99
    ) {
      setError("Le montant doit être supérieur à zéro.");
      return;
    }

    if (selectedSubscription && Number(amount) > Number(selectedSubscription.remaining_amount ?? selectedSubscription.price_at_purchase)) {
      setError("Le montant dépasse le solde restant de l'abonnement."); return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount.trim())) { setError("Saisissez un montant avec 2 décimales maximum."); return; }
    if (!paidAt || Number.isNaN(gymInstant(paidAt).getTime())) {
      setError("Indiquez une date de paiement valide.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await onSave({
        member_id: Number(memberId),
        subscription_id: Number(subscriptionId),
        amount: value.toFixed(2),
        method: "demo",
        paid_at: paidAt,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
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
        aria-label="Nouveau paiement"
        className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Nouveau paiement
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Saisir un règlement simulé
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
            <label htmlFor="payment-member-search" className={labelClass}>
              Rechercher un membre
            </label>

            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-[25px] text-slate-400"
              />

              <input
                id="payment-member-search"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setMemberId("");
                  setSubscriptionId("");
                  setAmount("");
                }}
                placeholder="Nom ou email..."
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              required
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setSubscriptionId("");
                setAmount("");
              }}
              aria-label="Choisir un membre"
              className={inputClass}
            >
              <option value="">
                {loadingMembers
                  ? "Recherche en cours..."
                  : "Choisir un membre"}
              </option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.email}
                </option>
              ))}
            </select>
          </div>

          <label className={labelClass}>
            Abonnement concerné *
            <select
              required
              value={subscriptionId}
              disabled={!memberId || loadingSubscriptions}
              onChange={(e) =>
                chooseSubscription(e.target.value)
              }
              className={inputClass}
            >
              <option value="">
                {loadingSubscriptions
                  ? "Chargement..."
                  : "Choisir un abonnement"}
              </option>

              {subscriptions.map((subscription) => (
                <option
                  key={subscription.id}
                  value={subscription.id}
                >
                  {subscription.plan?.name || "Formule"}
                  {" — "}
                  {subscription.starts_at?.slice(0, 10)}
                </option>
              ))}
            </select>
          </label>

          {selectedSubscription && (
            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
              <p className="font-bold">
                {selectedSubscription.plan?.name || "Abonnement"}
              </p>

              <p className="mt-1">
                Prix initial :{" "}
                {Number(
                  selectedSubscription.price_at_purchase || 0
                ).toFixed(2)}{" "}
                MAD
              </p>

              {selectedSubscription.remaining_amount != null && (
                <p className="mt-1">
                  Reste à simuler :{" "}
                  <strong>
                    {Number(
                      selectedSubscription.remaining_amount
                    ).toFixed(2)}{" "}
                    MAD
                  </strong>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Montant (MAD) *
              <input
                type="number"
                required
                min="0.01"
                max="99999999.99"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250.00"
                className={inputClass}
              />
            </label>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <p className="text-xs font-bold text-emerald-800">Règlement simulé</p>
              <p className="mt-1 text-[11px] text-emerald-700">Montant fictif affecté à cet abonnement.</p>
            </div>
          </div>

          <label className={labelClass}>
            Date et heure du paiement *
            <FrenchDateInput
              required
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Référence
            <input
              value={reference}
              maxLength={120}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Référence de simulation"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Notes
            <textarea
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Information complémentaire..."
              className={`${inputClass} h-auto py-2`}
            />
          </label>

          <p className="rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
            Aucun encaissement ne sera effectué.
            Cette action ne déclenche aucun débit bancaire ni
            activation automatique d'abonnement.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}