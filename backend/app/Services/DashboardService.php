<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardService
{
    private const TZ = 'Africa/Casablanca';
    private ?bool $hasAttendanceColumn = null;

    // Statistiques Admin: chiffres globaux; graphiques: periode choisie.
    public function admin(string $period): array
    {
        $buckets = $this->buckets($period);
        $now = now('UTC')->toDateTimeString();
        $today = now(self::TZ)->toDateString();

        $users = DB::table('users')->whereNull('deleted_at');
        $courses = DB::table('courses')->whereNull('deleted_at');
        $payments = DB::table('payments');

        $sessions = DB::table('course_sessions as s')
            ->join('courses as c', 'c.id', '=', 's.course_id')
            ->whereNull('c.deleted_at')
            ->where('c.status', 'active');

        return [
            'summary' => [
                'members_total' => (clone $users)->where('role', 'member')->count(),
                'members_active' => (clone $users)->where('role', 'member')->where('status', 'active')->count(),
                'coaches_active' => (clone $users)->where('role', 'coach')->where('status', 'active')->count(),
                'courses_active' => (clone $courses)->where('status', 'active')->count(),
                'sessions_upcoming' => (clone $sessions)->where('s.status', 'scheduled')->where('s.start_at', '>', $now)->count(),
                'reservations_confirmed' => DB::table('course_enrollments')->where('status', 'confirmed')->count(),
                'visits_today' => DB::table('gym_attendances')->where('role', 'member')->whereIn('status', ['present', 'left'])->whereNotNull('check_in_at')->where('date', $today)->count(),
                'memberships_active' => DB::table('member_subscriptions')->where('status', 'active')->where('starts_at', '<=', $today)->where('ends_at', '>=', $today)->count(),
                'simulated_total' => round((float) (clone $payments)->where('method', 'demo')->where('status', 'simulated')->sum('amount'), 2),
                'revenue_paid' => round((float) (clone $payments)->where('status', 'paid')->sum('amount'), 2),
                'payments_refunded' => (clone $payments)->where('status', 'refunded')->count(),
                'proposals_pending' => DB::table('course_proposals')->where('status', 'pending')->count(),
                'unread_messages' => DB::table('contact_messages')->whereNull('read_at')->count(),
            ],
            'charts' => [
                'simulated_payments' => $this->series(
                    (clone $payments)->where('method', 'demo')->where('status', 'simulated'), 'paid_at', $buckets, money: true
                ),
                'revenue' => $this->series(
                    DB::table('payments')->where('status', 'paid'), 'paid_at', $buckets, money: true
                ),
                'reservations' => $this->series(DB::table('course_enrollments'), 'created_at', $buckets),
                'attendance' => $this->series(
                    DB::table('gym_attendances')->where('role', 'member')->whereIn('status', ['present', 'left'])->whereNotNull('check_in_at'),
                    'date', $buckets, dateOnly: true
                ),
                'memberships' => $this->series(DB::table('member_subscriptions'), 'created_at', $buckets),
                'payment_status' => $this->distribution(
                    DB::table('payments'), 'created_at', $buckets, [
                        'pending' => 'En attente', 'paid' => 'Encaissé (historique)',
                        'simulated' => 'Simulé', 'refunded' => 'Remboursé',
                    ]
                ),
            ],
            'upcoming' => $this->upcoming(),
        ];
    }

    // Statistiques du coach connecte uniquement.
    public function coach(User $coach, string $period): array
    {
        abort_unless($coach->isCoach(), 403);
        $id = (int) $coach->getKey();
        $buckets = $this->buckets($period);
        $now = now('UTC')->toDateTimeString();

        $sessions = DB::table('course_sessions as s')->where('s.coach_id', $id);
        $enrollments = DB::table('course_enrollments as e')
            ->join('course_sessions as s', 's.id', '=', 'e.session_id')
            ->where('s.coach_id', $id);

        $eligible = (clone $enrollments)->whereIn('e.status', ['confirmed', 'attended']);
        $present = $this->presentEnrollments(clone $eligible);
        $absent = $this->absentEnrollments(clone $eligible);
        $presentCount = (clone $present)->count();
        $absentCount = (clone $absent)->count();
        $marked = $presentCount + $absentCount;
        $markedAt = $this->pointageDateColumn();

        return [
            'summary' => [
                'courses_active' => DB::table('courses')->whereNull('deleted_at')->where('coach_id', $id)->where('status', 'active')->count(),
                'sessions_upcoming' => (clone $sessions)->where('s.status', 'scheduled')->where('s.start_at', '>', $now)->count(),
                'members_unique' => (clone $eligible)->distinct()->count('e.member_id'),
                'reservations_confirmed' => (clone $eligible)->count(),
                'sessions_completed' => (clone $sessions)->where('s.status', 'completed')->count(),
                'attendance_rate' => $marked > 0 ? round($presentCount * 100 / $marked, 1) : 0,
            ],
            'charts' => [
                'sessions' => $this->series(clone $sessions, 's.start_at', $buckets),
                'reservations' => $this->series(clone $enrollments, 'e.created_at', $buckets),
                'attendance' => $this->series(clone $present, $markedAt, $buckets),
                'attendance_status' => [
                    ['label' => 'Présent', 'value' => $this->periodCount($present, $markedAt, $buckets)],
                    ['label' => 'Absent', 'value' => $this->periodCount($absent, $markedAt, $buckets)],
                ],
            ],
            'upcoming' => $this->upcoming($id),
        ];
    }

    // Statistiques du membre connecte uniquement.
    public function member(User $member, string $period): array
    {
        abort_unless($member->isMember(), 403);
        $id = (int) $member->getKey();
        $buckets = $this->buckets($period);
        $now = now('UTC')->toDateTimeString();
        $today = now(self::TZ)->toDateString();
        $monthStart = now(self::TZ)->startOfMonth()->toDateString();

        $subscriptions = DB::table('member_subscriptions')->where('member_id', $id);
        $reservations = DB::table('course_enrollments')->where('member_id', $id);
        $visits = DB::table('gym_attendances')
            ->where('user_id', $id)->where('role', 'member')
            ->whereIn('status', ['present', 'left'])->whereNotNull('check_in_at');
        $payments = DB::table('payments')->where('member_id', $id);

        $upcomingCount = DB::table('course_enrollments as e')
            ->join('course_sessions as s', 's.id', '=', 'e.session_id')
            ->where('e.member_id', $id)->where('e.status', 'confirmed')
            ->where('s.status', 'scheduled')->where('s.start_at', '>', $now)
            ->count();

        $subscription = DB::table('member_subscriptions as ms')
            ->join('subscription_plans as p', 'p.id', '=', 'ms.plan_id')
            ->where('ms.member_id', $id)->where('ms.status', 'active')
            ->where('ms.starts_at', '<=', $today)->where('ms.ends_at', '>=', $today)
            ->orderBy('ms.ends_at')->select('p.name as plan_name', 'ms.ends_at')->first();

        $endsAt = $subscription?->ends_at;
        $daysLeft = $endsAt === null ? null : (int) (new \DateTimeImmutable($today))
            ->diff(new \DateTimeImmutable($endsAt))->format('%a');

        return [
            'summary' => [
                'active_memberships' => (clone $subscriptions)->where('status', 'active')->where('starts_at', '<=', $today)->where('ends_at', '>=', $today)->count(),
                'upcoming_reservations' => $upcomingCount,
                'reservations_total' => (clone $reservations)->count(),
                'visits_month' => (clone $visits)->where('date', '>=', $monthStart)->where('date', '<=', $today)->count(),
                'visits_total' => (clone $visits)->count(),
                'simulated_total' => round((float) (clone $payments)->where('method', 'demo')->where('status', 'simulated')->sum('amount'), 2),
                'paid_total' => round((float) (clone $payments)->where('status', 'paid')->sum('amount'), 2),
            ],
            'subscription' => [
                'plan_name' => $subscription?->plan_name,
                'access_now' => $subscription !== null,
                'ends_at' => $endsAt,
                'days_remaining' => $daysLeft,
            ],
            'charts' => [
                'visits' => $this->series(clone $visits, 'date', $buckets, dateOnly: true),
                'reservations' => $this->series(clone $reservations, 'created_at', $buckets),
                'simulated_payments' => $this->series(
                    (clone $payments)->where('method', 'demo')->where('status', 'simulated'), 'paid_at', $buckets, money: true
                ),
                'payments' => $this->series((clone $payments)->where('status', 'paid'), 'paid_at', $buckets, money: true),
                'reservation_status' => $this->distribution(clone $reservations, 'created_at', $buckets, [
                    'pending' => 'En attente', 'confirmed' => 'Confirmée',
                    'attended' => 'Effectuée', 'cancelled' => 'Annulée',
                ]),
            ],
            'upcoming' => $this->upcoming(memberId: $id),
        ];
    }

    // Date locale de chaque point, avec bornes UTC pour les datetime stockes en UTC.
    private function buckets(string $period): array
    {
        $today = CarbonImmutable::now(self::TZ)->startOfDay();
        $items = [];

        if ($period === '12m') {
            $first = $today->startOfMonth()->subMonths(11);
            for ($i = 0; $i < 12; $i++) {
                $start = $first->addMonths($i);
                $end = $start->addMonth();
                $items[] = $this->bucket($start, $end, $start->format('m/Y'));
            }
            return $items;
        }

        $days = match ($period) { '7d' => 7, '90d' => 90, default => 30 };
        $step = match ($period) { '7d' => 1, '90d' => 9, default => 3 };
        $first = $today->subDays($days - 1);

        for ($i = 0; $i < $days / $step; $i++) {
            $start = $first->addDays($i * $step);
            $end = $start->addDays($step);
            $items[] = $this->bucket($start, $end, $start->format('d/m'));
        }
        return $items;
    }

    private function bucket(CarbonImmutable $start, CarbonImmutable $end, string $label): array
    {
        return [
            'label' => $label,
            'from_date' => $start->toDateString(),
            'to_date' => $end->toDateString(),
            'from_utc' => $start->setTimezone('UTC')->format('Y-m-d H:i:s'),
            'to_utc' => $end->setTimezone('UTC')->format('Y-m-d H:i:s'),
        ];
    }

    private function slice(Builder $query, string $column, array $bucket, bool $dateOnly = false): Builder
    {
        $start = $dateOnly ? $bucket['from_date'] : $bucket['from_utc'];
        $end = $dateOnly ? $bucket['to_date'] : $bucket['to_utc'];

        // Expression fixe generee par le serveur (jamais depuis la requete utilisateur).
        if (str_starts_with($column, 'COALESCE(')) {
            return $query->whereRaw("{$column} >= ? AND {$column} < ?", [$start, $end]);
        }

        return $query->where($column, '>=', $start)->where($column, '<', $end);
    }

    private function series(
        Builder $query, string $column, array $buckets,
        bool $dateOnly = false, bool $money = false
    ): array {
        $from = $dateOnly ? 'from_date' : 'from_utc';
        $to = $dateOnly ? 'to_date' : 'to_utc';
        $range = [$from => $buckets[0][$from], $to => $buckets[array_key_last($buckets)][$to]];
        $expression = str_starts_with($column, 'COALESCE(') ? $column : $query->getGrammar()->wrap($column);
        $aggregate = $this->slice(clone $query, $column, $range, $dateOnly)->select([]);
        $amount = $money ? 'amount' : '1';

        foreach ($buckets as $index => $bucket) {
            $aggregate->selectRaw(
                "COALESCE(SUM(CASE WHEN {$expression} >= ? AND {$expression} < ? THEN {$amount} ELSE 0 END), 0) AS bucket_{$index}",
                [$bucket[$from], $bucket[$to]]
            );
        }

        $row = (array) $aggregate->first();

        return array_map(fn (array $bucket, int $index) => [
            'label' => $bucket['label'],
            'value' => $money ? round((float) $row["bucket_{$index}"], 2) : (int) $row["bucket_{$index}"],
        ], $buckets, array_keys($buckets));
    }

    private function periodCount(Builder $query, string $column, array $buckets): int
    {
        $range = [
            'from_utc' => $buckets[0]['from_utc'],
            'to_utc' => $buckets[array_key_last($buckets)]['to_utc'],
        ];
        return $this->slice(clone $query, $column, $range)->count();
    }

    private function distribution(Builder $query, string $column, array $buckets, array $statuses): array
    {
        $range = [
            'from_utc' => $buckets[0]['from_utc'],
            'to_utc' => $buckets[array_key_last($buckets)]['to_utc'],
        ];
        $counts = $this->slice($query, $column, $range)
            ->select('status')->selectRaw('COUNT(*) AS total')->groupBy('status')
            ->pluck('total', 'status');
        $values = [];
        foreach ($statuses as $status => $label) {
            $values[] = ['label' => $label, 'value' => (int) ($counts[$status] ?? 0)];
        }

        return $values;
    }

    private function hasPointageColumn(): bool
    {
        return $this->hasAttendanceColumn ??= Schema::hasColumn('course_enrollments', 'attendance_status');
    }

    private function presentEnrollments(Builder $query): Builder
    {
        if (!$this->hasPointageColumn()) {
            return $query->where('e.status', 'attended');
        }

        return $query->where(function (Builder $q): void {
            $q->where('e.attendance_status', 'present')
                ->orWhere(function (Builder $legacy): void {
                    $legacy->whereNull('e.attendance_status')
                        ->where('e.status', 'attended');
                });
        });
    }

    private function absentEnrollments(Builder $query): Builder
    {
        return $this->hasPointageColumn()
            ? $query->where('e.attendance_status', 'absent')
            : $query->whereRaw('1 = 0');
    }

    private function pointageDateColumn(): string
    {
        return $this->hasPointageColumn()
            ? 'COALESCE(e.attendance_marked_at, e.updated_at)'
            : 'e.updated_at';
    }

    private function upcoming(?int $coachId = null, ?int $memberId = null): array
    {
        $query = DB::table('course_sessions as s')
            ->join('courses as c', 'c.id', '=', 's.course_id')
            ->leftJoin('users as coach', 'coach.id', '=', 's.coach_id')
            ->where('s.status', 'scheduled')
            ->where('s.start_at', '>', now('UTC')->toDateTimeString());

        if ($coachId !== null) {
            $query->where('s.coach_id', $coachId);
        }
        if ($memberId !== null) {
            $query->join('course_enrollments as e', 'e.session_id', '=', 's.id')
                ->where('e.member_id', $memberId)
                ->where('e.status', 'confirmed');
        }

        return $query
            ->orderBy('s.start_at')
            ->limit(5)
            ->get([
                's.id', 'c.name as course_name', 's.start_at',
                's.location', 'coach.name as coach_name',
            ])
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'course_name' => $row->course_name,
                'start_at' => CarbonImmutable::parse($row->start_at, 'UTC')->toIso8601String(),
                'location' => $row->location,
                'coach_name' => $row->coach_name,
            ])
            ->all();
    }
}