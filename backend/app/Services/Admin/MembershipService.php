<?php

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\MemberSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MembershipService
{
    private const TIMEZONE = 'Africa/Casablanca';

    private const ELIGIBLE_PLAN_TYPES = [
        'general',
        'course',
    ];

    private const OPEN_STATUSES = [
        'pending',
        'active',
    ];

    // ==========================================
    // LISTE + FILTRES + STATISTIQUES
    // ==========================================

    public function index(array $filters): array
    {
        $today = $this->today();

        $base = MemberSubscription::query();
        $query = MemberSubscription::query();

        if (!empty($filters['search'])) {
            $term = trim($filters['search']);

            $query->where(
                function (Builder $q) use ($term): void {
                    $q->whereHas(
                        'member',
                        fn (Builder $member) =>
                            $member->withTrashed()->where(
                                fn (Builder $m) =>
                                    $m->where('name', 'like', "%{$term}%")
                                      ->orWhere('email', 'like', "%{$term}%")
                            )
                    )->orWhereHas(
                        'plan',
                        fn (Builder $plan) =>
                            $plan->withTrashed()
                                 ->where('name', 'like', "%{$term}%")
                    );
                }
            );
        }

        if (!empty($filters['plan_id'])) {
            $query->where(
                'plan_id',
                (int) $filters['plan_id']
            );
        }

        if (!empty($filters['status'])) {
            $status = $filters['status'];

            if ($status === 'expired') {
                $query->where(
                    function (Builder $q) use ($today): void {
                        $q->where('status', 'expired')
                          ->orWhere(
                              fn (Builder $active) =>
                                  $active->whereIn(
                                      'status',
                                      self::OPEN_STATUSES
                                  )->whereDate('ends_at', '<', $today)
                          );
                    }
                );
            } elseif ($status === 'active') {
                $query->where('status', 'active')
                    ->whereDate('starts_at', '<=', $today)
                    ->whereDate('ends_at', '>=', $today);
            } elseif ($status === 'pending') {
                $query->where('status', 'pending')
                    ->whereDate('ends_at', '>=', $today);
            } else {
                $query->where('status', 'cancelled');
            }
        }

        $memberships = $query
            ->with([
                'member' => fn ($q) => $q->withTrashed(),
                'plan' => fn ($q) => $q->withTrashed(),
            ])
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 9))
            ->withQueryString();

        $memberships->through(
            fn (MemberSubscription $row): array =>
                $this->present($row)
        );

        return [
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
                        fn (Builder $q) =>
                            $q->where('status', 'expired')
                              ->orWhere(
                                  fn (Builder $open) =>
                                      $open->whereIn(
                                          'status',
                                          self::OPEN_STATUSES
                                      )->whereDate(
                                          'ends_at',
                                          '<',
                                          $today
                                      )
                              )
                    )
                    ->count(),
            ],
        ];
    }

    // ==========================================
    // OPTIONS DU FORMULAIRE
    // ==========================================

    public function options(string $search = ''): array
    {
        $members = User::query()
            ->where('role', User::MEMBER)
            ->where('status', 'active');

        $search = trim($search);

        if ($search !== '') {
            $members->where(
                fn (Builder $q) =>
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
            );
        }

        $membersList = $members
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'email'])
            ->map(
                fn (User $member): array => [
                    'id' => (int) $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                ]
            )
            ->values();

        $plansList = SubscriptionPlan::query()
            ->whereIn('type', self::ELIGIBLE_PLAN_TYPES)
            ->where('status', 'active')
            ->where(
                fn (Builder $q) =>
                    $q->where('type', 'general')
                      ->orWhereHas(
                          'course',
                          fn (Builder $course) =>
                              $course->where('status', 'active')
                      )
            )
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'type',
                'price',
                'duration_value',
                'duration_unit',
            ])
            ->map(
                fn (SubscriptionPlan $plan): array => [
                    'id' => (int) $plan->id,
                    'name' => $plan->name,
                    'type' => $plan->type,
                    'price' => $plan->price,
                    'duration_value' =>
                        (int) $plan->duration_value,
                    'duration_unit' => $plan->duration_unit,
                ]
            )
            ->values();

        return [
            'members' => $membersList,
            'plans' => $plansList,
        ];
    }

    // ==========================================
    // CREER UN ABONNEMENT
    // ==========================================

    public function create(array $data): array
    {
        $row = DB::transaction(
            function () use ($data): MemberSubscription {
                $member = $this->lockActiveMember(
                    (int) $data['member_id']
                );

                $plan = $this->lockAvailablePlan(
                    (int) $data['plan_id']
                );

                $start = CarbonImmutable::createFromFormat(
                    '!Y-m-d',
                    $data['starts_at'],
                    self::TIMEZONE
                );

                $end = $this->periodEnd($start, $plan);

                $this->assertNoOverlap(
                    (int) $member->id,
                    (int) $plan->id,
                    $start->toDateString(),
                    $end->toDateString()
                );

                return MemberSubscription::query()->create([
                    'member_id' => $member->id,
                    'plan_id' => $plan->id,
                    'starts_at' => $start->toDateString(),
                    'ends_at' => $end->toDateString(),
                    'price_at_purchase' => $plan->price,
                    'status' => 'pending',
                ]);
            },
            3
        );

        return $this->present(
            $this->loadRow($row)
        );
    }

    // ==========================================
    // ACTIVER UN ABONNEMENT
    // ==========================================

    public function activate(
        MemberSubscription $membership
    ): array {
        $row = DB::transaction(
            function () use ($membership): MemberSubscription {
                $this->lockActiveMember(
                    (int) $membership->member_id
                );

                $current = $this->lockRow(
                    (int) $membership->id
                );

                if ($current->status !== 'pending') {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Seul un abonnement en attente '
                            . 'peut être activé.',
                    ]);
                }

                if (
                    $current->ends_at->toDateString()
                    < $this->today()
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Abonnement expiré : '
                            . 'créez un renouvellement.',
                    ]);
                }

                $this->lockAvailablePlan(
                    (int) $current->plan_id
                );

                $this->assertNoOverlap(
                    (int) $current->member_id,
                    (int) $current->plan_id,
                    $current->starts_at->toDateString(),
                    $current->ends_at->toDateString(),
                    (int) $current->id
                );

                $current->status = 'active';
                $current->save();

                return $current;
            },
            3
        );

        return $this->present(
            $this->loadRow($row)
        );
    }

    // ==========================================
    // RENOUVELER UN ABONNEMENT
    // ==========================================

    public function renew(
        MemberSubscription $membership
    ): array {
        $row = DB::transaction(
            function () use ($membership): MemberSubscription {
                $member = $this->lockActiveMember(
                    (int) $membership->member_id
                );

                $current = $this->lockRow(
                    (int) $membership->id
                );

                $today = $this->today();

                $renewable = in_array(
                    $current->status,
                    ['active', 'expired', 'cancelled'],
                    true
                ) || (
                    $current->status === 'pending'
                    && $current->ends_at->toDateString() < $today
                );

                if (!$renewable) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Ce renouvellement n’est pas autorisé.',
                    ]);
                }

                $plan = $this->lockAvailablePlan(
                    (int) $current->plan_id
                );

                $start = CarbonImmutable::createFromFormat(
                    '!Y-m-d',
                    $today,
                    self::TIMEZONE
                );

                // Abonnement actif :
                // renouveler apres la fin de la periode.
                if (
                    $current->status === 'active'
                    && $current->ends_at->toDateString() >= $today
                ) {
                    $start = CarbonImmutable::createFromFormat(
                        '!Y-m-d',
                        $current->ends_at->toDateString(),
                        self::TIMEZONE
                    )->addDay();
                }

                $end = $this->periodEnd($start, $plan);

                $this->assertNoOverlap(
                    (int) $member->id,
                    (int) $plan->id,
                    $start->toDateString(),
                    $end->toDateString()
                );

                return MemberSubscription::query()->create([
                    'member_id' => $member->id,
                    'plan_id' => $plan->id,
                    'starts_at' => $start->toDateString(),
                    'ends_at' => $end->toDateString(),
                    'price_at_purchase' => $plan->price,
                    'status' => 'pending',
                ]);
            },
            3
        );

        return $this->present(
            $this->loadRow($row)
        );
    }

    // ==========================================
    // ANNULER UN ABONNEMENT
    // ==========================================

    public function cancel(
        MemberSubscription $membership
    ): array {
        $row = DB::transaction(
            function () use ($membership): MemberSubscription {
                $this->lockActiveMember(
                    (int) $membership->member_id
                );

                $current = $this->lockRow(
                    (int) $membership->id
                );

                if (
                    !in_array(
                        $current->status,
                        self::OPEN_STATUSES,
                        true
                    )
                    || $current->ends_at->toDateString()
                       < $this->today()
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Seul un abonnement en attente '
                            . 'ou actif non expiré peut être annulé.',
                    ]);
                }

                $current->status = 'cancelled';
                $current->save();

                return $current;
            },
            3
        );

        return $this->present(
            $this->loadRow($row)
        );
    }

    // ==========================================
    // VERIFICATIONS
    // ==========================================

    private function lockActiveMember(int $memberId): User
    {
        $member = User::query()
            ->whereKey($memberId)
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

        return $member;
    }

    private function lockAvailablePlan(
        int $planId
    ): SubscriptionPlan {
        $plan = SubscriptionPlan::query()
            ->whereKey($planId)
            ->where('status', 'active')
            ->whereIn(
                'type',
                self::ELIGIBLE_PLAN_TYPES
            )
            ->lockForUpdate()
            ->first();

        if (!$plan) {
            throw ValidationException::withMessages([
                'plan_id' =>
                    'Formule inactive, supprimée '
                    . 'ou non disponible.',
            ]);
        }

        if (
            $plan->type === 'course'
            && !Course::query()
                ->whereKey($plan->course_id)
                ->where('status', 'active')
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'plan_id' =>
                    'Le cours associé à cette formule est inactif.',
            ]);
        }

        return $plan;
    }

    private function lockRow(
        int $id
    ): MemberSubscription {
        return MemberSubscription::query()
            ->whereKey($id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    // Empecher les periodes qui se chevauchent.
    private function assertNoOverlap(
        int $memberId,
        int $planId,
        string $startsAt,
        string $endsAt,
        ?int $exceptId = null
    ): void {
        $query = MemberSubscription::query()
            ->where('member_id', $memberId)
            ->where('plan_id', $planId)
            ->whereIn('status', self::OPEN_STATUSES)
            ->whereDate('starts_at', '<=', $endsAt)
            ->whereDate('ends_at', '>=', $startsAt);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'starts_at' =>
                    'Ce membre a déjà un abonnement actif '
                    . 'ou en attente pour cette formule '
                    . 'sur cette période.',
            ]);
        }
    }

    // ==========================================
    // CALCUL DE LA DATE DE FIN
    // ==========================================

    private function periodEnd(
        CarbonImmutable $start,
        SubscriptionPlan $plan
    ): CarbonImmutable {
        $duration = (int) $plan->duration_value;

        if ($duration < 1 || $duration > 365) {
            throw ValidationException::withMessages([
                'plan_id' => 'Durée du tarif invalide.',
            ]);
        }

        $after = match ($plan->duration_unit) {
            'day' =>
                $start->addDays($duration),

            'month' =>
                $start->addMonthsNoOverflow($duration),

            'year' =>
                $start->addYearsNoOverflow($duration),

            default =>
                throw ValidationException::withMessages([
                    'plan_id' =>
                        'Unité de durée non reconnue.',
                ]),
        };

        // La date de fin est inclusive.
        return $after->subDay();
    }

    // ==========================================
    // FORMAT JSON POUR REACT
    // ==========================================

    private function present(
        MemberSubscription $membership
    ): array {
        $today = $this->today();

        $start = $membership->starts_at
            ?->toDateString();

        $end = $membership->ends_at
            ?->toDateString();

        $effective = $membership->status;

        if (
            in_array(
                $effective,
                self::OPEN_STATUSES,
                true
            )
            && $end !== null
            && $end < $today
        ) {
            $effective = 'expired';
        }

        return [
            'id' => (int) $membership->id,
            'member_id' =>
                (int) $membership->member_id,

            'plan_id' =>
                (int) $membership->plan_id,

            'status' => $membership->status,
            'effective_status' => $effective,

            'starts_at' => $start,
            'ends_at' => $end,

            'price_at_purchase' =>
                $membership->price_at_purchase,

            'access_now' =>
                $membership->status === 'active'
                && $start !== null
                && $end !== null
                && $start <= $today
                && $end >= $today,

            'member' => $membership->member ? [
                'id' => (int) $membership->member->id,
                'name' => $membership->member->name,
                'email' => $membership->member->email,
            ] : null,

            'plan' => $membership->plan ? [
                'id' => (int) $membership->plan->id,
                'name' => $membership->plan->name,
                'type' => $membership->plan->type,
            ] : null,

            'created_at' =>
                $membership->created_at
                    ?->toIso8601String(),
        ];
    }

    private function loadRow(
        MemberSubscription $row
    ): MemberSubscription {
        return $row->load([
            'member' => fn ($q) =>
                $q->withTrashed(),

            'plan' => fn ($q) =>
                $q->withTrashed(),
        ]);
    }

    private function today(): string
    {
        return now(self::TIMEZONE)->toDateString();
    }
}
