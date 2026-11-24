<?php

namespace App\Services\Admin;

use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\User;
use App\Services\FinanceLedger;
use Illuminate\Support\Str;
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

            $query->whereRaw('COALESCE(payments.paid_at, payments.created_at) >= ?', [$from]);
        }

        if (!empty($filters['to'])) {
            $to = CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $filters['to'],
                self::TZ
            )->endOfDay()->utc()->toDateTimeString();

            $query->whereRaw('COALESCE(payments.paid_at, payments.created_at) <= ?', [$to]);
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
            ->orderByRaw('COALESCE(payments.paid_at, payments.created_at) DESC')
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
                'simulated' => (clone $base)->where('method', 'demo')->where('status', 'simulated')->count(),

                'paid' => (clone $base)
                    ->where('status', 'paid')
                    ->count(),

                'refunded' => (clone $base)
                    ->where('status', 'refunded')
                    ->count(),

                // Paiements encaissés moins paiements remboursés
                'collected_amount' => (string) (clone $base)->where('status', 'paid')
                    ->where('method', '!=', 'demo')->sum('amount'),
                'cash_collected_amount' => (string) (clone $base)->where('status', 'paid')
                    ->where('method', 'cash')->sum('amount'),
                'pending_cash' => (clone $base)->where('status', 'pending')
                    ->where('method', 'cash')->count(),
                'demo_amount' => (string) (clone $base)->where('method', 'demo')
                    ->where('status', 'simulated')->sum('amount'),
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
            $subscriptions = FinanceLedger::withTotals(MemberSubscription::query())
                ->where('member_id', (int) $filters['member_id'])
                ->where('status', 'pending')
                ->whereDate('ends_at', '>=', now(self::TZ)->toDateString())
                ->with([
                    'plan' => fn ($q) =>
                        $q->withTrashed()
                          ->select('id', 'name'),
                ])
                ->orderByDesc('id')
                ->limit(100)
                ->get()
                ->map(
                    function (MemberSubscription $s): array {
                        $balance = FinanceLedger::summary($s);

                        return [
                            'id' => (int) $s->id,
                            'status' => $s->status,

                            'starts_at' =>
                                $s->starts_at?->toDateString(),

                            'price_at_purchase' =>
                                $s->price_at_purchase,

                            'remaining_amount' =>
                                $balance['remaining_amount'],

                            'plan' => $s->plan ? [
                                'id' => (int) $s->plan->id,
                                'name' => $s->plan->name,
                            ] : null,
                        ];
                    }
                )
                ->filter(
                    fn (array $s): bool =>
                        FinanceLedger::cents($s['remaining_amount']) > 0
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
        if (($data['method'] ?? null) !== 'demo') {
            throw ValidationException::withMessages([
                'method' => 'Seul un règlement simulé peut être enregistré.',
            ]);
        }

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
                    !$subscription || $subscription->status !== 'pending'
                    || $subscription->ends_at->toDateString() < now(self::TZ)->toDateString()
                ) {
                    throw ValidationException::withMessages([
                        'subscription_id' => 'Abonnement en attente et non expiré requis.',
                    ]);
                }

                $amount = FinanceLedger::cents($data['amount']);
                $remaining = FinanceLedger::cents(FinanceLedger::summary($subscription)['remaining_amount']);
                if ($amount <= 0 || $amount > $remaining) {
                    throw ValidationException::withMessages([
                        'amount' => 'Montant supérieur au reste à simuler.',
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
                            'simulated',
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
                        ->where('status', 'simulated')
                        ->where(
                            'amount',
                            FinanceLedger::money($amount)
                        )
                        ->where('method', 'demo')
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

                    'amount' => FinanceLedger::money($amount),

                    'method' => 'demo',
                    'status' => 'simulated',
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

                $subscription = MemberSubscription::query()
                    ->whereKey($payment->subscription_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $row = Payment::query()
                    ->whereKey($payment->id)
                    ->whereNotNull('subscription_id')
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($row->method !== 'demo' || $row->status !== 'simulated') {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Seul un règlement simulé peut être remboursé.',
                    ]);
                }

                if ($subscription->status === 'active'
                    && $subscription->ends_at->toDateString() >= now(self::TZ)->toDateString()) {
                    throw ValidationException::withMessages([
                        'status' => 'Annulez d’abord l’abonnement actif avant de déclarer un remboursement.',
                    ]);
                }
                $row->status = 'refunded';

                $audit = 'Remboursement simulé le '
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

    public function checkout(User $member, MemberSubscription $membership): array
    {
        abort_unless($member->isMember() && $member->isActive(), 403);

        $payment = DB::transaction(function () use ($member, $membership): Payment {
            User::query()->whereKey($member->id)->where('status', 'active')->lockForUpdate()->firstOrFail();
            $sub = MemberSubscription::query()->whereKey($membership->id)
                ->where('member_id', $member->id)->lockForUpdate()->firstOrFail();

            if ($sub->status !== 'pending' || $sub->ends_at->toDateString() < now(self::TZ)->toDateString()) {
                throw ValidationException::withMessages(['membership' => 'Abonnement non éligible à la simulation.']);
            }

            $balance = FinanceLedger::summary($sub);
            if ($balance['remaining_amount'] === '0.00') {
                $existing = $sub->payments()->where('method', 'demo')->where('status', 'simulated')
                    ->latest('id')->first();
                if ($existing) {
                    return $existing;
                }

                throw ValidationException::withMessages(['membership' => 'Cet abonnement est déjà réglé.']);
            }

            return $sub->payments()->create([
                'member_id' => $member->id,
                'amount' => $balance['remaining_amount'],
                'method' => 'demo',
                'status' => 'simulated',
                'paid_at' => now('UTC'),
                'reference' => 'DEMO-' . Str::upper(Str::random(16)),
            ]);
        }, 3);

        return $this->present($this->loadRow($payment));
    }

    // ADMIN: Clear a stale/rejected Cash request without recording any money.
    public function rejectCash(User $admin, Payment $payment): array
    {
        abort_unless($admin->isAdmin() && $payment->subscription_id !== null, 404);
        $record = DB::transaction(function () use ($payment, $admin): Payment {
            User::withTrashed()->whereKey($payment->member_id)->lockForUpdate()->firstOrFail();
            MemberSubscription::query()->whereKey($payment->subscription_id)->lockForUpdate()->firstOrFail();
            $row = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($row->method !== 'cash' || $row->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Seule une demande Cash en attente peut être refusée.']);
            }
            $row->status = 'cancelled';
            $row->notes = trim(($row->notes ? $row->notes . "\n" : '') . 'Demande refusée par admin #' . $admin->id . '.');
            $row->save();
            return $row;
        }, 3);
        return $this->present($this->loadRow($record));
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
}
