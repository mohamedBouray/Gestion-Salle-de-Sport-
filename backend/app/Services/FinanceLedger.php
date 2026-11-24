<?php

namespace App\Services;

use App\Models\MemberSubscription;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

/** Server-authoritative monetary summary for one subscription. Amounts are MAD cents. */
final class FinanceLedger
{
    public static function cents(string|int|float $amount): int
    {
        $value = (string) $amount;
        if (!preg_match('/\A(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?\z/D', $value)) {
            throw ValidationException::withMessages(['amount' => 'Montant invalide.']);
        }
        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    public static function money(int $cents): string
    {
        return intdiv($cents, 100) . '.' . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function withTotals(Builder $query): Builder
    {
        return $query->withSum([
            'payments as real_paid_total' => fn ($payments) => $payments
                ->where('status', 'paid')->where('method', '!=', 'demo'),
            'payments as simulated_total' => fn ($payments) => $payments
                ->where('status', 'simulated')->where('method', 'demo'),
        ], 'amount');
    }

    public static function summary(MemberSubscription $subscription): array
    {
        if (!array_key_exists('simulated_total', $subscription->getAttributes())) {
            $subscription = self::withTotals(MemberSubscription::query())
                ->findOrFail($subscription->getKey());
        }

        $price = self::cents($subscription->price_at_purchase);
        $paid = self::cents($subscription->real_paid_total ?? 0);
        $simulated = self::cents($subscription->simulated_total ?? 0);
        $remaining = max(0, $price - $paid - $simulated);

        return [
            'paid_amount' => self::money($paid),
            'simulated_amount' => self::money($simulated),
            'remaining_amount' => self::money($remaining),
            'payment_eligible' => $remaining === 0,
        ];
    }
}