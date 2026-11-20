<?php

namespace App\Services\Coach;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class CoachMemberService
{
    private const VISIBLE_ENROLLMENTS = ['confirmed', 'attended'];

    public function index(User $coach, array $filters): array
    {
        $coachId = (int) $coach->getKey();
        $now = now()->utc()->toDateTimeString();

        $base = $this->membersForCoach($coachId);

        $stats = [
            'total' => (clone $base)->count(),

            'active' => (clone $base)
                ->where('status', 'active')
                ->count(),

            'with_upcoming' => (clone $base)
                ->whereHas(
                    'courseEnrollments',
                    function (Builder $enrollments) use ($coachId, $now): void {
                        $enrollments
                            ->whereIn('status', self::VISIBLE_ENROLLMENTS)
                            ->whereHas(
                                'session',
                                function (Builder $session) use ($coachId, $now): void {
                                    $session
                                        ->where('coach_id', $coachId)
                                        ->where('status', 'scheduled')
                                        ->where('start_at', '>=', $now);
                                }
                            );
                    }
                )
                ->count(),
        ];

        $query = $this->membersForCoach($coachId);

        if (!empty($filters['search'])) {
            $term = trim($filters['search']);

            $query->where(
                function (Builder $q) use ($term): void {
                    $q->where('name', 'like', '%' . $term . '%')
                        ->orWhere('email', 'like', '%' . $term . '%');
                }
            );
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['course_id'])) {
            $courseId = (int) $filters['course_id'];

            $query->whereHas(
                'courseEnrollments',
                function (Builder $enrollments) use ($coachId, $courseId): void {
                    $enrollments
                        ->whereIn('status', self::VISIBLE_ENROLLMENTS)
                        ->whereHas(
                            'session',
                            function (Builder $session) use ($coachId, $courseId): void {
                                $session
                                    ->where('coach_id', $coachId)
                                    ->where('course_id', $courseId);
                            }
                        );
                }
            );
        }

        $this->withCoachEnrollmentCounts($query, $coachId, $now);

        $paginator = $query
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 9);

        $coursesByMember = $this->memberCourses(
            $coachId,
            $paginator->getCollection()->modelKeys()
        );

        $paginator->through(
            fn (User $member): array =>
                $this->memberData(
                    $member,
                    $coursesByMember[$member->id] ?? []
                )
        );

        $courses = Course::query()
            ->where(
                function (Builder $query) use ($coachId): void {
                    $query
                        ->where('coach_id', $coachId)
                        ->orWhereHas(
                            'sessions',
                            fn (Builder $s) =>
                                $s->where('coach_id', $coachId)
                        );
                }
            )
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(
                fn (Course $course): array => [
                    'id' => (int) $course->id,
                    'name' => $course->name,
                ]
            )
            ->values();

        return [
            'members' => $paginator,
            'courses' => $courses,
            'stats' => $stats,
        ];
    }

    public function show(User $coach, User $member): array
    {
        $coachId = (int) $coach->getKey();
        $now = now()->utc()->toDateTimeString();

        $member = $this->membersForCoach($coachId)
            ->whereKey($member->getKey())
            ->firstOrFail();

        $query = User::query()
            ->whereKey($member->getKey());

        $this->withCoachEnrollmentCounts(
            $query,
            $coachId,
            $now
        );

        $member = $query->firstOrFail();

        $coursesByMember = $this->memberCourses(
            $coachId,
            [(int) $member->id]
        );

        $sessions = CourseEnrollment::query()
            ->join(
                'course_sessions as cs',
                'cs.id',
                '=',
                'course_enrollments.session_id'
            )
            ->where('course_enrollments.member_id', $member->id)
            ->whereIn(
                'course_enrollments.status',
                self::VISIBLE_ENROLLMENTS
            )
            ->where('cs.coach_id', $coachId)
            ->select('course_enrollments.*')
            ->with('session.course:id,name')
            ->orderByDesc('cs.start_at')
            ->orderByDesc('course_enrollments.id')
            ->limit(50)
            ->get()
            ->map(
                function (CourseEnrollment $enrollment): array {
                    $session = $enrollment->session;

                    return [
                        'id' => (int) $session->id,

                        'enrollment_id' => (int) $enrollment->id,

                        'enrollment_status' => $enrollment->status,

                        'start_at' => $session->start_at
                            ?->toIso8601String(),

                        'end_at' => $session->end_at
                            ?->toIso8601String(),

                        'location' => $session->location,

                        'status' => $session->status,

                        'course' => $session->course
                            ? [
                                'id' => (int) $session->course->id,
                                'name' => $session->course->name,
                            ]
                            : null,
                    ];
                }
            )
            ->values();

        return [
            'member' => $this->memberData(
                $member,
                $coursesByMember[$member->id] ?? []
            ),

            'sessions' => $sessions,
        ];
    }

    private function membersForCoach(int $coachId): Builder
    {
        return User::query()
            ->where('role', User::MEMBER)
            ->whereHas(
                'courseEnrollments',
                function (Builder $enrollments) use ($coachId): void {
                    $enrollments
                        ->whereIn(
                            'status',
                            self::VISIBLE_ENROLLMENTS
                        )
                        ->whereHas(
                            'session',
                            fn (Builder $s) =>
                                $s->where('coach_id', $coachId)
                        );
                }
            );
    }

    private function withCoachEnrollmentCounts(
        Builder $query,
        int $coachId,
        string $now
    ): void {
        $query->withCount([
            'courseEnrollments as reservations_count' =>
                function (Builder $enrollments) use ($coachId): void {
                    $enrollments
                        ->whereIn(
                            'status',
                            self::VISIBLE_ENROLLMENTS
                        )
                        ->whereHas(
                            'session',
                            fn (Builder $s) =>
                                $s->where('coach_id', $coachId)
                        );
                },

            'courseEnrollments as upcoming_sessions_count' =>
                function (Builder $enrollments) use ($coachId, $now): void {
                    $enrollments
                        ->whereIn(
                            'status',
                            self::VISIBLE_ENROLLMENTS
                        )
                        ->whereHas(
                            'session',
                            function (Builder $s) use ($coachId, $now): void {
                                $s->where('coach_id', $coachId)
                                    ->where('status', 'scheduled')
                                    ->where('start_at', '>=', $now);
                            }
                        );
                },
        ]);
    }

    private function memberCourses(
        int $coachId,
        array $memberIds
    ): array {
        if ($memberIds === []) {
            return [];
        }

        $rows = DB::table('course_enrollments as ce')
            ->join(
                'course_sessions as cs',
                'cs.id',
                '=',
                'ce.session_id'
            )
            ->join(
                'courses as c',
                'c.id',
                '=',
                'cs.course_id'
            )
            ->where('cs.coach_id', $coachId)
            ->whereIn('ce.member_id', $memberIds)
            ->whereIn(
                'ce.status',
                self::VISIBLE_ENROLLMENTS
            )
            ->whereNull('c.deleted_at')
            ->select([
                'ce.member_id',
                'c.id',
                'c.name',
            ])
            ->distinct()
            ->orderBy('c.name')
            ->get();

        $courses = [];

        foreach ($rows as $row) {
            $courses[(int) $row->member_id][] = [
                'id' => (int) $row->id,
                'name' => $row->name,
            ];
        }

        return $courses;
    }

    private function memberData(
        User $member,
        array $courses
    ): array {
        return [
            'id' => (int) $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'status' => $member->status,
            'courses' => $courses,

            'reservations_count' =>
                (int) $member->reservations_count,

            'upcoming_sessions_count' =>
                (int) $member->upcoming_sessions_count,
        ];
    }
}
