<?php

namespace App\Services\Members;

use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class MemberPaymentService
{
    private const TIMEZONE = 'Africa/Casablanca';

    // ==========================================
    // MES PAIEMENTS + FILTRES + STATISTIQUES
    // ==========================================

    public function index(
        User $member,
        array $filters = []
    ): array {
        abort_unless($member->isMember(), 403);

        // L'identite vient du compte connecte,
        // jamais d'un member_id envoye par React.
        $base = Payment::query()
            ->where('member_id', $member->getKey());

        $query = clone $base;

        $search = trim(
            (string) ($filters['search'] ?? '')
        );

        // Recherche par reference, formule ou cours
        if ($search !== '') {
            $query->where(
                function (Builder $q) use ($search): void {
                    $q->where(
                        'reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'subscription.plan',
                        fn (Builder $plan) =>
                            $plan->withTrashed()
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                    )
                    ->orWhereHas(
                        'enrollment.session.course',
                        fn (Builder $course) =>
                            $course->withTrashed()
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                    );
                }
            );
        }

        // Filtre statut
        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        // Filtre methode
        if (!empty($filters['method'])) {
            $query->where(
                'method',
                $filters['method']
            );
        }

        // Dates en timezone Casablanca.
        // Paiement pending: utiliser created_at
        // si paid_at est NULL.
        if (!empty($filters['from'])) {
            $from = CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $filters['from'],
                self::TIMEZONE
            )
                ->startOfDay()
                ->utc()
                ->toDateTimeString();

            $query->whereRaw(
                'COALESCE(payments.paid_at, payments.created_at) >= ?',
                [$from]
            );
        }

        if (!empty($filters['to'])) {
            $to = CarbonImmutable::createFromFormat(
                '!Y-m-d',
                $filters['to'],
                self::TIMEZONE
            )
                ->endOfDay()
                ->utc()
                ->toDateTimeString();

            $query->whereRaw(
                'COALESCE(payments.paid_at, payments.created_at) <= ?',
                [$to]
            );
        }

        // Charger formules et cours, y compris archives

$payments = $query
    ->with([
        'subscription.plan' => function ($plan) {
            $plan->withTrashed()
                ->select('id', 'name');
        },

        'enrollment.session.course' => function ($course) {
            $course->withTrashed()
                ->select('id', 'name');
        },
    ])
    ->orderByRaw(
        'COALESCE(payments.paid_at, payments.created_at) DESC'
    )
    ->orderByDesc('payments.id')
    ->paginate(
        (int) ($filters['per_page'] ?? 9)
    );

        // Format compatible avec PaymentCard.jsx
        $payments->through(
            fn (Payment $row): array =>
                $this->present($row)
        );

        // Statistiques globales du Member,
        // independantes des filtres.
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

                'collected_amount' => (string) (clone $base)
                    ->where('status', 'paid')->where('method', '!=', 'demo')->sum('amount'),
                'pending_cash' => (clone $base)->where('status', 'pending')->where('method', 'cash')->count(),
                'demo_amount' => (string) (clone $base)->where('status', 'simulated')->where('method', 'demo')->sum('amount'),
            ],
        ];
    }

    // ==========================================
    // FORMAT JSON POUR FRONTEND
    // ==========================================

    private function present(Payment $row): array
    {
        // Determiner le type de paiement
        $type = match (true) {
            $row->subscription_id !== null =>
                'subscription',

            $row->enrollment_id !== null =>
                'course',

            default => 'other',
        };

        $subscription = $row->subscription;
        $enrollment = $row->enrollment;

        $session = $enrollment?->session;
        $course = $session?->course;

        return [
            'id' => (int) $row->id,

            'type' => $type,

            'amount' => $row->amount,

            'method' => $row->method,

            'status' => $row->status,

            'reference' => $row->reference,

            'notes' => $row->notes,

            'paid_at' =>
                $row->paid_at?->toIso8601String(),

            'created_at' =>
                $row->created_at?->toIso8601String(),

            // Abonnement
            'subscription' => $subscription ? [
                'id' => (int) $subscription->id,

                'plan' => $subscription->plan ? [
                    'id' => (int) $subscription->plan->id,
                    'name' => $subscription->plan->name,
                ] : null,

            ] : null,

            // Reservation de cours
            'enrollment' => $enrollment ? [
                'id' => (int) $enrollment->id,

                'session' => $session ? [
                    'id' => (int) $session->id,

                    'course' => $course ? [
                        'id' => (int) $course->id,
                        'name' => $course->name,
                    ] : null,

                ] : null,

            ] : null,
        ];
    }
}
