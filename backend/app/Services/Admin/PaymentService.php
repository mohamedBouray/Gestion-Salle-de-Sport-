<?php

namespace App\Services\Admin;

use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    private const TZ = 'Africa/Casablanca';

    // Paiements des abonnements uniquement
    private function base(): Builder
    {
        return Payment::query()
            ->whereNotNull('subscription_id');
    }

    // ==========================================
    // LISTE, FILTRES ET STATISTIQUES
    // ==========================================

    public function index(array $filters): array
    {
        $base = $this->base();
        $query = clone $base;
        $search = trim($filters['search'] ?? '');

        if ($search !== '') {
            $query->where(
                function (Builder $q) use ($search): void {
                    $q->where(
                        'reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'member',
                        function (Builder $member) use ($search): void {
                            $member->withTrashed()
                                ->where(
                                    function (Builder $m) use ($search): void {
                                        $m->where('name', 'like', "%{$search}%")
                                          ->orWhere('email', 'like', "%{$search}%");
                                    }
                                );
                        }
                    )
                    ->orWhereHas(
                        'subscription.plan',
                        function (Builder $plan) use ($search): void {
                            $plan->withTrashed()
                                ->where('name', 'like', "%{$search}%");
                        }
                    );
                }
            );
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['method'])) {
            $query->where('method', $filters['method']);
        }

        if (!empty($filters['from'])) {
            $from = CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $filters['from'],
                self::TZ
            )->startOfDay()->utc()->toDateTimeString();

            $query->where('paid_at', '>=', $from);
        }

        if (!empty($filters['to'])) {
            $to = CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $filters['to'],
                self::TZ
            )->endOfDay()->utc()->toDateTimeString();

            $query->where('paid_at', '<=', $to);
        }

        $payments = $query
            ->with([
                'member' => fn ($q) =>
                    $q->withTrashed()
                      ->select('id', 'name', 'email'),

                'subscription.plan' => fn ($q) =>
                    $q->withTrashed()
                      ->select('id', 'name'),
            ])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 9))
            ->withQueryString();

        $payments->through(
            fn (Payment $row): array => $this->present($row)
        );

        return [
            'payments' => $payments,

            'stats' => [
                'total' => (clone $base)->count(),

                'paid' => (clone $base)
                    ->where('status', 'paid')
                    ->count(),

                'refunded' => (clone $base)
                    ->where('status', 'refunded')
                    ->count(),

                // Paiements encaissés moins paiements remboursés
                'collected_amount' => (string) (clone $base)
                    ->where('status', 'paid')
                    ->sum('amount'),
            ],
        ];
    }

    // ==========================================
    // OPTIONS MEMBRES ET ABONNEMENTS
    // ==========================================

    public function options(array $filters): array
    {
        $search = trim($filters['member_search'] ?? '');

        $members = User::query()
            ->where('role', User::MEMBER)
            ->where('status', 'active');

        if ($search !== '') {
            $members->where(
                function (Builder $q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                }
            );
        }

        $list = $members
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'email'])
            ->map(
                fn (User $u): array => [
                    'id' => (int) $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                ]
            )
            ->values();

        $subscriptions = collect();

        if (!empty($filters['member_id'])) {
            $subscriptions = MemberSubscription::query()
                ->where('member_id', (int) $filters['member_id'])
                ->whereIn('status', [
                    'pending',
                    'active',
                    'expired',
                ])
                ->with([
                    'plan' => fn ($q) =>
                        $q->withTrashed()
                          ->select('id', 'name'),
                ])
                ->withSum([
                    'payments as paid_total' => fn ($q) =>
                        $q->where('status', 'paid'),
                ], 'amount')
                ->orderByDesc('id')
                ->limit(100)
                ->get()
                ->map(
                    function (MemberSubscription $s): array {
                        $price = $this->cents(
                            $s->price_at_purchase
                        );

                        $paid = $this->cents(
                            $s->paid_total ?? 0
                        );

                        $remaining = max(0, $price - $paid);

                        return [
                            'id' => (int) $s->id,
                            'status' => $s->status,

                            'starts_at' =>
                                $s->starts_at?->toDateString(),

                            'price_at_purchase' =>
                                $s->price_at_purchase,

                            'remaining_amount' =>
                                $this->money($remaining),

                            'plan' => $s->plan ? [
                                'id' => (int) $s->plan->id,
                                'name' => $s->plan->name,
                            ] : null,
                        ];
                    }
                )
                ->filter(
                    fn (array $s): bool =>
                        $this->cents($s['remaining_amount']) > 0
                )
                ->values();
        }

        return [
            'members' => $list,
            'subscriptions' => $subscriptions,
        ];
    }

    // ==========================================
    // ENREGISTRER UN PAIEMENT
    // ==========================================

    public function create(User $admin, array $data): array
    {
        $paidAt = CarbonImmutable::createFromFormat(
            '!Y-m-d\TH:i',
            $data['paid_at'],
            self::TZ
        );

        if (
            $paidAt->greaterThan(
                CarbonImmutable::now(self::TZ)->addMinutes(5)
            )
        ) {
            throw ValidationException::withMessages([
                'paid_at' =>
                    'La date de paiement ne peut pas être future.',
            ]);
        }

        $record = DB::transaction(
            function () use ($admin, $data, $paidAt): Payment {
                // Verrouiller le membre
                $member = User::query()
                    ->whereKey((int) $data['member_id'])
                    ->where('role', User::MEMBER)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->first();

                if (!$member) {
                    throw ValidationException::withMessages([
                        'member_id' =>
                            'Membre introuvable ou inactif.',
                    ]);
                }

                // Verrouiller l'abonnement
                $subscription = MemberSubscription::query()
                    ->whereKey((int) $data['subscription_id'])
                    ->where('member_id', $member->id)
                    ->lockForUpdate()
                    ->first();

                if (
                    !$subscription ||
                    !in_array(
                        $subscription->status,
                        ['pending', 'active', 'expired'],
                        true
                    )
                ) {
                    throw ValidationException::withMessages([
                        'subscription_id' =>
                            'Abonnement invalide ou annulé pour ce membre.',
                    ]);
                }

                // Calcul en centimes pour éviter les erreurs
                $amount = $this->cents($data['amount']);

                $price = $this->cents(
                    $subscription->price_at_purchase
                );

                $alreadyPaid = $this->cents(
                    Payment::query()
                        ->where(
                            'subscription_id',
                            $subscription->id
                        )
                        ->where('status', 'paid')
                        ->sum('amount')
                );

                // Refuser un montant supérieur au reste
                if (
                    $amount <= 0 ||
                    $alreadyPaid + $amount > $price
                ) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            'Montant supérieur au reste à payer.',
                    ]);
                }

                $reference = trim(
                    $data['reference'] ?? ''
                ) ?: null;

                $utcDate = $paidAt
                    ->utc()
                    ->toDateTimeString();

                // Eviter une référence déjà utilisée
                if (
                    $reference !== null &&
                    Payment::query()
                        ->where('member_id', $member->id)
                        ->where('reference', $reference)
                        ->whereIn('status', [
                            'paid',
                            'refunded',
                        ])
                        ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'reference' =>
                            'Cette référence existe déjà pour ce membre.',
                    ]);
                }

                // Eviter les paiements identiques
                if (
                    Payment::query()
                        ->where(
                            'subscription_id',
                            $subscription->id
                        )
                        ->where('status', 'paid')
                        ->where(
                            'amount',
                            $this->money($amount)
                        )
                        ->where('method', $data['method'])
                        ->where('paid_at', $utcDate)
                        ->exists()
                ) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            'Un paiement identique est déjà enregistré à cette minute.',
                    ]);
                }

                // Créer le paiement
                return Payment::query()->create([
                    'member_id' => $member->id,

                    'subscription_id' =>
                        $subscription->id,

                    'enrollment_id' => null,
                    'personal_session_id' => null,

                    'recorded_by_user_id' =>
                        $admin->id,

                    'amount' => $this->money($amount),

                    'method' => $data['method'],
                    'status' => 'paid',
                    'paid_at' => $utcDate,
                    'reference' => $reference,

                    'notes' =>
                        trim($data['notes'] ?? '') ?: null,
                ]);
            },
            3
        );

        return $this->present(
            $this->loadRow($record)
        );
    }

    // ==========================================
    // ENREGISTRER UN REMBOURSEMENT
    // ==========================================

    public function refund(
        User $admin,
        Payment $payment
    ): array {
        abort_unless(
            $admin->isAdmin() &&
            $payment->subscription_id !== null,
            404
        );

        $updated = DB::transaction(
            function () use ($admin, $payment): Payment {
                User::withTrashed()
                    ->whereKey($payment->member_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                MemberSubscription::query()
                    ->whereKey($payment->subscription_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $row = Payment::query()
                    ->whereKey($payment->id)
                    ->whereNotNull('subscription_id')
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($row->status !== 'paid') {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Seul un paiement payé peut être marqué remboursé.',
                    ]);
                }

                $row->status = 'refunded';

                $audit = 'Remboursement déclaré le '
                    . now(self::TZ)->format('Y-m-d H:i')
                    . ' par administrateur #'
                    . $admin->id
                    . '.';

                $row->notes = trim(
                    ($row->notes ? $row->notes . "\n" : '')
                    . $audit
                );

                $row->save();

                return $row;
            },
            3
        );

        return $this->present(
            $this->loadRow($updated)
        );
    }

    // ==========================================
    // FORMATER LA REPONSE API
    // ==========================================

    private function loadRow(Payment $payment): Payment
    {
        return $payment->load([
            'member' => fn ($q) =>
                $q->withTrashed()
                  ->select('id', 'name', 'email'),

            'subscription.plan' => fn ($q) =>
                $q->withTrashed()
                  ->select('id', 'name'),
        ]);
    }

    private function present(Payment $row): array
    {
        return [
            'id' => (int) $row->id,

            'member_id' => (int) $row->member_id,

            'subscription_id' =>
                $row->subscription_id === null
                    ? null
                    : (int) $row->subscription_id,

            'amount' => $row->amount,
            'method' => $row->method,
            'status' => $row->status,

            'paid_at' =>
                $row->paid_at?->toIso8601String(),

            'reference' => $row->reference,
            'notes' => $row->notes,

            'member' => $row->member ? [
                'id' => (int) $row->member->id,
                'name' => $row->member->name,
                'email' => $row->member->email,
            ] : null,

            'subscription' => $row->subscription ? [
                'id' => (int) $row->subscription->id,

                'plan' => $row->subscription->plan ? [
                    'id' =>
                        (int) $row->subscription->plan->id,

                    'name' =>
                        $row->subscription->plan->name,
                ] : null,
            ] : null,
        ];
    }

    // ==========================================
    // CALCUL DES MONTANTS EN CENTIMES
    // ==========================================

    private function cents(string|int|float $value): int
    {
        $str = (string) $value;

        if (
            !preg_match(
                '/^\d{1,15}(?:\.\d{1,2})?$/D',
                $str
            )
        ) {
            throw ValidationException::withMessages([
                'amount' => 'Montant invalide.',
            ]);
        }

        [$whole, $fraction] = array_pad(
            explode('.', $str, 2),
            2,
            ''
        );

        return ((int) $whole * 100)
            + (int) str_pad($fraction, 2, '0');
    }

    private function money(int $cents): string
    {
        return intdiv($cents, 100)
            . '.'
            . str_pad(
                (string) ($cents % 100),
                2,
                '0',
                STR_PAD_LEFT
            );
    }
}
