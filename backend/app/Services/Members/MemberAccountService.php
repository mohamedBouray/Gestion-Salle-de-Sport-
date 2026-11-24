<?php

namespace App\Services\Members;

use App\Models\GymAttendance;
use App\Models\MemberSubscription;
use App\Models\User;
use App\Services\FinanceLedger;
use Illuminate\Database\Eloquent\Builder;

class MemberAccountService
{
    private function timezone(): string
    {
        return config('gym.timezone', 'Africa/Casablanca');
    }

    private function today(): string
    {
        return now($this->timezone())->toDateString();
    }

    // ==========================================
    // MON ABONNEMENT
    // ==========================================

    public function memberships(
        User $member,
        array $filters = []
    ): array {
        abort_unless($member->isMember(), 403);

        $today = $this->today();
        $memberId = (int) $member->getKey();

        $query = MemberSubscription::query()
            ->where('member_id', $memberId);

        if (!empty($filters['status'])) {
            $this->filterSubscriptionStatus(
                $query,
                $filters['status'],
                $today
            );
        }

        // Garder les anciennes formules dans l'historique
        // meme si Admin les a supprimees.
        $withPlan = [
            'plan' => fn ($q) => $q->withTrashed()
                ->select('id', 'name', 'type'),
        ];

        // Historique avec pagination
        $memberships = FinanceLedger::withTotals($query)
            ->with($withPlan)
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 9));

        $memberships->through(
            fn (MemberSubscription $row): array =>
                $this->subscriptionData($row, $today)
        );

        // Abonnements valides aujourd'hui
        // Independants des filtres et de la pagination
        $active = FinanceLedger::withTotals(MemberSubscription::query())
            ->where('member_id', $memberId)
            ->where('status', 'active')
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->with($withPlan)
            ->orderBy('ends_at')
            ->get()
            ->map(
                fn (MemberSubscription $row): array =>
                    $this->subscriptionData($row, $today)
            )
            ->values();

        // Base pour statistiques globales
        $base = MemberSubscription::query()
            ->where('member_id', $memberId);

        return [
            'active' => $active,

            'memberships' => $memberships,

            'stats' => [
                'total' => (clone $base)->count(),

                'active' => (clone $base)
                    ->where('status', 'active')
                    ->whereDate('starts_at', '<=', $today)
                    ->whereDate('ends_at', '>=', $today)
                    ->count(),

                'pending' => (clone $base)
                    ->where('status', 'pending')
                    ->whereDate('ends_at', '>=', $today)
                    ->count(),

                'expired' => (clone $base)
                    ->where(
                        function (Builder $q) use ($today): void {
                            $q->where('status', 'expired')
                                ->orWhere(
                                    function (Builder $open) use ($today): void {
                                        $open
                                            ->whereIn(
                                                'status',
                                                ['active', 'pending']
                                            )
                                            ->whereDate(
                                                'ends_at',
                                                '<',
                                                $today
                                            );
                                    }
                                );
                        }
                    )
                    ->count(),
            ],
        ];
    }

    // ==========================================
    // FILTRAGE DES ABONNEMENTS
    // ==========================================

    private function filterSubscriptionStatus(
        Builder $query,
        string $status,
        string $today
    ): void {
        if ($status === 'active') {
            $query
                ->where('status', 'active')
                ->whereDate('starts_at', '<=', $today)
                ->whereDate('ends_at', '>=', $today);

            return;
        }

        if ($status === 'pending') {
            $query
                ->where('status', 'pending')
                ->whereDate('ends_at', '>=', $today);

            return;
        }

        if ($status === 'expired') {
            $query->where(
                function (Builder $q) use ($today): void {
                    $q->where('status', 'expired')
                        ->orWhere(
                            function (Builder $open) use ($today): void {
                                $open
                                    ->whereIn(
                                        'status',
                                        ['active', 'pending']
                                    )
                                    ->whereDate(
                                        'ends_at',
                                        '<',
                                        $today
                                    );
                            }
                        );
                }
            );

            return;
        }

        $query->where('status', 'cancelled');
    }

    // ==========================================
    // FORMAT ABONNEMENT POUR REACT
    // ==========================================

    private function subscriptionData(
        MemberSubscription $row,
        string $today
    ): array {
        $start = $row->starts_at?->toDateString();
        $end = $row->ends_at?->toDateString();

        $effective = $row->status;

        // Calcul de l'expiration sans modifier DB
        if (
            in_array($effective, ['active', 'pending'], true)
            && $end !== null
            && $end < $today
        ) {
            $effective = 'expired';
        }

        return [
            'id' => (int) $row->id,

            'status' => $row->status,

            'effective_status' => $effective,

            'starts_at' => $start,

            'ends_at' => $end,

            'price_at_purchase' =>
                $row->price_at_purchase,

            ...FinanceLedger::summary($row),

            'access_now' =>
                $row->status === 'active'
                && $start !== null
                && $end !== null
                && $start <= $today
                && $end >= $today,

            'plan' => $row->plan ? [
                'id' => (int) $row->plan->id,
                'name' => $row->plan->name,
                'type' => $row->plan->type,
            ] : null,
        ];
    }

    // ==========================================
    // MES PRESENCES
    // ENTREES ET SORTIES DE LA SALLE
    // ==========================================

    public function attendance(
        User $member,
        array $filters = []
    ): array {
        abort_unless($member->isMember(), 403);

        $memberId = (int) $member->getKey();

        // Uniquement les pointages du Member connecte
        $base = GymAttendance::query()
            ->where('user_id', $memberId)
            ->where('role', 'member')
            ->whereIn('status', ['present', 'left']);

        $query = clone $base;

        // Filtre statut
        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        // Filtre date debut
        if (!empty($filters['from'])) {
            $query->whereDate(
                'date',
                '>=',
                $filters['from']
            );
        }

        // Filtre date fin
        if (!empty($filters['to'])) {
            $query->whereDate(
                'date',
                '<=',
                $filters['to']
            );
        }

        // Historique pagine
        $attendances = $query
            ->orderByDesc('date')
            ->orderByDesc('check_in_at')
            ->orderByDesc('id')
            ->paginate(
                (int) ($filters['per_page'] ?? 12)
            );

        // Format attendu par GymVisitCard.jsx
        $attendances->through(
            fn (GymAttendance $row): array => [
                'id' => (int) $row->id,

                'date' =>
                    $row->date?->format('Y-m-d'),

                'status' => $row->status,

                'check_in_at' =>
                    $row->check_in_at?->copy()
                        ->utc()
                        ->toIso8601String(),

                'check_out_at' =>
                    $row->check_out_at?->copy()
                        ->utc()
                        ->toIso8601String(),

                'note' => $row->note,
            ]
        );

        // Dates du mois actuel
        $monthStart = now($this->timezone())
            ->startOfMonth()
            ->toDateString();

        $monthEnd = now($this->timezone())
            ->endOfMonth()
            ->toDateString();

        return [
            'attendances' => $attendances,

            'stats' => [
                'total_visits' => (clone $base)
                    ->count(),

                'this_month' => (clone $base)
                    ->whereDate(
                        'date',
                        '>=',
                        $monthStart
                    )
                    ->whereDate(
                        'date',
                        '<=',
                        $monthEnd
                    )
                    ->count(),

                'inside_now' => (clone $base)
                    ->where('status', 'present')
                    ->whereNull('check_out_at')
                    ->count(),
            ],
        ];
    }
}


