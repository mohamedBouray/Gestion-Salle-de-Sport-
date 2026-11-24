import { useState } from "react";
import { CreditCard } from "lucide-react";
import ConfirmDialog from "../../shared/ConfirmDialog";
import { memberPaymentsApi } from "../../../services/MemberPaymentsApi";
import { apiError } from "../../../services/api";

const money = (amount) => `${new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount) || 0)} MAD`;

export default function CheckoutDialog({ membership, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!membership) return null;

  const submit = async () => {
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await memberPaymentsApi.checkout(membership.id);
      if (!response?.payment?.id || response.payment.method !== "demo" || response.payment.status !== "simulated")
        throw new Error("Confirmation incohérente : aucun paiement ne sera annoncé sans vérification.");
      onSuccess?.(response);
    } catch (err) {
      setError(err.response ? apiError(err) : err.message);
    } finally { setLoading(false); }
  };

  return <ConfirmDialog open title="Choisir le mode de règlement" variant="primary"
    subject={membership.plan?.name || "Abonnement"} subjectLabel="ABONNEMENT"
    description="Simulez le règlement de cet abonnement."
    warning="Démonstration uniquement. Aucun argent ne sera débité."
    confirmLabel="Lancer la simulation"
    loading={loading} error={error} onCancel={onClose} onConfirm={submit}>
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-900">Prix de l'abonnement : {money(membership.price_at_purchase)}</p>
      <div className="rounded-xl border border-blue-500 bg-blue-50 p-3">
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <CreditCard size={18} className="text-blue-600" />Montant à simuler : {money(membership.remaining_amount)}
        </span>
      </div>
    </div>
  </ConfirmDialog>;
}