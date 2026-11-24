<?php

namespace App\Services\Admin;

use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseSessionService
{
    private const OCCUPIED_STATUSES = [
        'confirmed',
        'attended',
    ];

    private const ACTIVE_ENROLLMENT_STATUSES = [
        'pending',
        'confirmed',
        'attended',
    ];

    // ==========================================
    // 1. LISTE DES SEANCES
    // ==========================================

    public function list(array $filters = []): Collection
    {
        $timezone = $this->timezone();

        $from = Carbon::parse(
            $filters['from'] ?? now($timezone)->toDateString(),
            $timezone
        )->startOfDay();

        $to = Carbon::parse(
            $filters['to'] ?? $from->copy()->addDays(6)->toDateString(),
            $timezone
        )->addDay()->startOfDay();

        if (
            $to->lessThanOrEqualTo($from) ||
            $from->diffInDays($to) > 31
        ) {
            throw ValidationException::withMessages([
                'to' => 'La période doit être comprise entre 1 et 31 jours.',
            ]);
        }

        // Synchronize before filtering, including when the scheduler is offline.
        CourseSession::completeElapsed();

        $query = CourseSession::query()
            ->with([
                'course:id,name,description,price,status',
                'coach:id,name,status',
            ])
            ->withCount([
                'enrollments as enrolled_count' => fn ($q) =>
                    $q->whereIn(
                        'status',
                        self::OCCUPIED_STATUSES
                    ),
            ])
            ->where(
                'end_at',
                '>',
                $from->utc()->format('Y-m-d H:i:s')
            )
            ->where(
                'start_at',
                '<',
                $to->utc()->format('Y-m-d H:i:s')
            );

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query
            ->orderBy('start_at')
            ->orderBy('id')
            ->get();
    }

    // ==========================================
    // 2. CREER UNE SEANCE
    // ==========================================

    public function create(array $data): CourseSession
    {
        return $this->synchronized(function () use ($data) {
            $start = Carbon::parse($data['start_at'])->utc();
            $end = Carbon::parse($data['end_at'])->utc();

            $courseId = (int) $data['course_id'];
            $coachId = (int) $data['coach_id'];
            $capacity = (int) $data['capacity'];

            $location = $this->normalizeLocation(
                $data['location'] ?? null
            );

            $this->assertValidDates($start, $end, true);
            $this->assertActiveCourse($courseId);
            $this->assertActiveCoach($coachId);

            $this->assertCoachAvailable(
                $coachId,
                $start,
                $end
            );

            $this->assertNoConflicts(
                $coachId,
                $start,
                $end,
                $location
            );

            $session = CourseSession::create([
                'course_id' => $courseId,
                'coach_id' => $coachId,
                'start_at' => $start,
                'end_at' => $end,
                'capacity' => $capacity,
                'location' => $location,
                'status' => 'scheduled',
            ]);

            return $this->hydrate($session);
        });
    }

    // ==========================================
    // 3. MODIFIER UNE SEANCE
    // ==========================================

    public function update(
        CourseSession $session,
        array $data
    ): CourseSession {
        return $this->synchronized(function () use (
            $session,
            $data
        ) {
            $current = CourseSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($current->status !== 'scheduled') {
                throw ValidationException::withMessages([
                    'status' =>
                        'Une séance terminée ou annulée ne peut plus être modifiée.',
                ]);
            }

            $status = $data['status'] ?? $current->status;

            // Annulation
            if ($status === 'cancelled') {
                if ($this->hasScheduleChanges($current, $data)) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Annulez la séance séparément des autres modifications.',
                    ]);
                }

                return $this->cancelLocked($current);
            }

            // Clôture
            if ($status === 'completed') {
                if ($this->hasScheduleChanges($current, $data)) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Terminez la séance séparément des autres modifications.',
                    ]);
                }

                if ($current->end_at->isFuture()) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'La séance ne peut être terminée avant son heure de fin.',
                    ]);
                }

                $current->update([
                    'status' => 'completed',
                ]);

                return $this->hydrate($current);
            }

            if ($current->start_at->isPast()) {
                throw ValidationException::withMessages([
                    'start_at' =>
                        'Les horaires et informations d’une séance commencée ne peuvent plus être modifiés.',
                ]);
            }

            $courseId = (int) (
                $data['course_id'] ?? $current->course_id
            );

            $coachId = (int) (
                $data['coach_id'] ?? $current->coach_id
            );

            $start = Carbon::parse(
                $data['start_at'] ?? $current->start_at
            )->utc();

            $end = Carbon::parse(
                $data['end_at'] ?? $current->end_at
            )->utc();

            $capacity = (int) (
                $data['capacity'] ?? $current->capacity
            );

            $location = $this->normalizeLocation(
                array_key_exists('location', $data)
                    ? $data['location']
                    : $current->location
            );

            $this->assertValidDates($start, $end, true);

            $this->assertActiveCourse($courseId);
            $this->assertActiveCoach($coachId);

            // Capacité minimum selon les réservations
            $enrolled = $this->occupiedCount($current);

            if ($capacity < $enrolled) {
                throw ValidationException::withMessages([
                    'capacity' =>
                        "La capacité ne peut pas être inférieure aux {$enrolled} réservations confirmées ou présences.",
                ]);
            }

            $this->assertCoachAvailable(
                $coachId,
                $start,
                $end
            );

            $this->assertNoConflicts(
                $coachId,
                $start,
                $end,
                $location,
                $current->id
            );

            $current->update([
                'course_id' => $courseId,
                'coach_id' => $coachId,
                'start_at' => $start,
                'end_at' => $end,
                'capacity' => $capacity,
                'location' => $location,
                'status' => 'scheduled',
            ]);

            return $this->hydrate($current);
        });
    }

    // ==========================================
    // 4. ANNULER UNE SEANCE
    // ==========================================

    public function cancel(CourseSession $session): CourseSession
    {
        return $this->synchronized(function () use ($session) {
            $current = CourseSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            return $this->cancelLocked($current);
        });
    }

    private function cancelLocked(
        CourseSession $session
    ): CourseSession {
        if ($session->status !== 'scheduled') {
            throw ValidationException::withMessages([
                'status' =>
                    'Seule une séance programmée peut être annulée.',
            ]);
        }

        if ($session->start_at->isPast()) {
            throw ValidationException::withMessages([
                'status' =>
                    'Impossible d’annuler une séance déjà commencée.',
            ]);
        }

        $hasReservations = $session->enrollments()
            ->whereIn(
                'status',
                self::ACTIVE_ENROLLMENT_STATUSES
            )
            ->exists();

        if ($hasReservations) {
            throw ValidationException::withMessages([
                'status' =>
                    'Cette séance possède des réservations actives. Traitez-les avant de l’annuler.',
            ]);
        }

        $session->update([
            'status' => 'cancelled',
        ]);

        return $this->hydrate($session);
    }

    // ==========================================
    // 5. VERIFIER LE COURS
    // ==========================================

    private function assertActiveCourse(int $courseId): void
    {
        $valid = Course::query()
            ->whereKey($courseId)
            ->where('status', 'active')
            ->exists();

        if (!$valid) {
            throw ValidationException::withMessages([
                'course_id' =>
                    'Le cours sélectionné doit être actif et non archivé.',
            ]);
        }
    }

    // ==========================================
    // 6. VERIFIER LE COACH
    // ==========================================

    private function assertActiveCoach(int $coachId): void
    {
        $valid = User::query()
            ->whereKey($coachId)
            ->where('role', 'coach')
            ->where('status', 'active')
            ->lockForUpdate()->first(['id']);

        if (!$valid) {
            throw ValidationException::withMessages([
                'coach_id' =>
                    'Le coach sélectionné doit être actif.',
            ]);
        }
    }

    // ==========================================
    // 7. VERIFIER LES DATES
    // ==========================================

    private function assertValidDates(
        Carbon $start,
        Carbon $end,
        bool $mustBeFuture = false
    ): void {
        if ($end->lessThanOrEqualTo($start)) {
            throw ValidationException::withMessages([
                'end_at' =>
                    'La fin de la séance doit être après son début.',
            ]);
        }

        if ($mustBeFuture && $start->lessThanOrEqualTo(now('UTC'))) {
            throw ValidationException::withMessages([
                'start_at' =>
                    'La séance doit commencer dans le futur.',
            ]);
        }
    }

    // ==========================================
    // 8. VERIFIER LES DISPONIBILITES COACH
    // ==========================================

    private function assertCoachAvailable(
        int $coachId,
        Carbon $start,
        Carbon $end
    ): void {
        $timezone = $this->timezone();

        $localStart = $start->copy()->setTimezone($timezone);
        $localEnd = $end->copy()->setTimezone($timezone);

        if (
            $localStart->toDateString() !==
            $localEnd->toDateString()
        ) {
            throw ValidationException::withMessages([
                'end_at' =>
                    'Une séance doit commencer et terminer le même jour.',
            ]);
        }

        $dayOfWeek = $localStart->dayOfWeek;

        $startTime = $localStart->format('H:i:s');
        $endTime = $localEnd->format('H:i:s');

        $slots = CoachAvailability::query()
            ->where('coach_id', $coachId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        $available = $slots->contains(function ($slot) use (
            $startTime,
            $endTime
        ) {
            $slotStart = substr(
                (string) $slot->start_time,
                0,
                8
            );

            $slotEnd = substr(
                (string) $slot->end_time,
                0,
                8
            );

            return (
                $slotStart <= $startTime &&
                $slotEnd >= $endTime
            );
        });

        if (!$available) {
            throw ValidationException::withMessages([
                'coach_id' =>
                    'Le coach n’est pas disponible sur ce créneau. Vérifiez ses disponibilités habituelles.',
            ]);
        }
    }

    // ==========================================
    // 9. CONFLITS COACH ET SALLE
    // ==========================================

    private function assertNoConflicts(
        int $coachId,
        Carbon $start,
        Carbon $end,
        ?string $location,
        ?int $excludeId = null
    ): void {
        $startSql = $start->copy()
            ->utc()
            ->format('Y-m-d H:i:s');

        $endSql = $end->copy()
            ->utc()
            ->format('Y-m-d H:i:s');

        $query = CourseSession::query()
            ->where('status', 'scheduled')
            ->where('start_at', '<', $endSql)
            ->where('end_at', '>', $startSql);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        // Coach déjà occupé
        if (
            (clone $query)
                ->where('coach_id', $coachId)
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'coach_id' =>
                    'Ce coach possède déjà une séance pendant ce créneau.',
            ]);
        }

        // Salle déjà occupée
        if ($location !== null) {
            $roomBusy = (clone $query)
                ->whereRaw(
                    'LOWER(TRIM(location)) = ?',
                    [mb_strtolower($location)]
                )
                ->exists();

            if ($roomBusy) {
                throw ValidationException::withMessages([
                    'location' =>
                        'Cette salle est déjà occupée pendant ce créneau.',
                ]);
            }
        }
    }

    // ==========================================
    // 10. RESERVATIONS CONFIRMEES
    // ==========================================

    private function occupiedCount(CourseSession $session): int
    {
        return $session->enrollments()
            ->whereIn(
                'status',
                self::OCCUPIED_STATUSES
            )
            ->count();
    }

    // ==========================================
    // 11. DETECTER CHANGEMENTS HORS STATUT
    // ==========================================

    private function hasScheduleChanges(
        CourseSession $session,
        array $data
    ): bool {
        foreach (['course_id', 'coach_id', 'capacity'] as $field) {
            if (
                array_key_exists($field, $data) &&
                (int) $data[$field] !== (int) $session->{$field}
            ) {
                return true;
            }
        }

        if (
            array_key_exists('location', $data) &&
            $this->normalizeLocation($data['location']) !==
            $this->normalizeLocation($session->location)
        ) {
            return true;
        }

        foreach (['start_at', 'end_at'] as $field) {
            if (
                array_key_exists($field, $data) &&
                Carbon::parse($data[$field])->utc()->timestamp !==
                $session->{$field}->copy()->utc()->timestamp
            ) {
                return true;
            }
        }

        return false;
    }

    // ==========================================
    // 12. CHARGER DONNEES POUR REACT
    // ==========================================

    private function hydrate(
        CourseSession $session
    ): CourseSession {
        return $session
            ->fresh()
            ->load([
                'course:id,name,description,price,status',
                'coach:id,name,status',
            ])
            ->loadCount([
                'enrollments as enrolled_count' => fn ($q) =>
                    $q->whereIn(
                        'status',
                        self::OCCUPIED_STATUSES
                    ),
            ]);
    }

    // ==========================================
    // 13. HELPERS
    // ==========================================

    private function normalizeLocation(
        ?string $location
    ): ?string {
        $value = trim((string) $location);

        return $value === '' ? null : $value;
    }

    private function timezone(): string
    {
        return config('gym.timezone', 'Africa/Casablanca');
    }

    // ==========================================
    // 14. TRANSACTION + VERROU MYSQL
    // ==========================================

    private function synchronized(callable $callback): mixed
    {
        // MySQL: serialize planning modifications
        // to avoid concurrent coach/room bookings.

        if (DB::connection()->getDriverName() !== 'mysql') {
            return DB::transaction($callback, 3);
        }

        $lockName = 'bouray_gym_planning';

        $result = DB::selectOne(
            'SELECT GET_LOCK(?, 10) AS acquired',
            [$lockName]
        );

        if ((int) ($result->acquired ?? 0) !== 1) {
            throw ValidationException::withMessages([
                'planning' =>
                    'Le planning est en cours de modification. Veuillez réessayer.',
            ]);
        }

        try {
            return DB::transaction($callback, 3);
        } finally {
            DB::selectOne(
                'SELECT RELEASE_LOCK(?) AS released',
                [$lockName]
            );
        }
    }
}
