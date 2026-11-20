<?php

namespace App\Services;

use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseProposal;
use App\Models\CourseSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CoachWorkspaceService
{
    public function propose(User $coach, array $data): CourseProposal
    {
        return DB::transaction(function () use ($coach, $data) {
            $name = trim($data['name']);
            $exists = CourseProposal::query()
                ->where('coach_id', $coach->id)
                ->where('status', 'pending')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->exists();
            if ($exists) {
                throw ValidationException::withMessages(['name' => 'Une proposition portant ce nom est déjà en attente.']);
            }
            return CourseProposal::create([
                'coach_id' => $coach->id,
                'name' => $name,
                'description' => trim($data['description'] ?? ''),
                'suggested_duration_minutes' => $data['suggested_duration_minutes'] ?? null,
                'suggested_capacity' => $data['suggested_capacity'] ?? null,
                'status' => 'pending',
            ]);
        });
    }

    public function approve(CourseProposal $proposal, User $admin, array $data): CourseProposal
    {
        return DB::transaction(function () use ($proposal, $admin, $data) {
            $locked = CourseProposal::query()->whereKey($proposal->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages(['proposal' => 'Cette proposition a déjà été traitée.']);
            }
            $coach = User::query()->whereKey($locked->coach_id)->where('role', 'coach')->where('status', 'active')->first();
            if (!$coach) {
                throw ValidationException::withMessages(['coach' => 'Coach inactif ou introuvable.']);
            }
            $course = Course::create([
                'coach_id' => $coach->id,
                'created_by_user_id' => $admin->id,
                'name' => $locked->name,
                'description' => $locked->description,
                'price' => $data['price'] ?? 0,
                'status' => 'active',
            ]);
            $locked->update([
                'status' => 'approved',
                'reviewed_by_admin_id' => $admin->id,
                'approved_course_id' => $course->id,
                'review_note' => $data['note'] ?? null,
                'reviewed_at' => now(),
            ]);
            return $locked->fresh(['coach:id,name', 'approvedCourse:id,name']);
        }, 3);
    }

    public function reject(CourseProposal $proposal, User $admin, ?string $note): CourseProposal
    {
        return DB::transaction(function () use ($proposal, $admin, $note) {
            $locked = CourseProposal::query()->whereKey($proposal->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages(['proposal' => 'Cette proposition a déjà été traitée.']);
            }
            if (!trim($note ?? '')) {
                throw ValidationException::withMessages(['note' => 'Indiquez le motif du refus.']);
            }
            $locked->update([
                'status' => 'rejected',
                'reviewed_by_admin_id' => $admin->id,
                'review_note' => trim($note),
                'reviewed_at' => now(),
            ]);
            return $locked->fresh(['coach:id,name']);
        }, 3);
    }

    /** Replace all weekly slots atomically. Session protection matches Admin Planning's gym timezone. */
    public function replaceAvailabilities(User $coach, array $slots): array
    {
        $clean = [];
        foreach ($slots as $slot) {
            $day = (int) $slot['day_of_week'];
            $start = $slot['start_time'] . ':00';
            $end = $slot['end_time'] . ':00';
            if ($start >= $end) {
                throw ValidationException::withMessages(['slots' => 'La fin doit être après le début.']);
            }
            $clean[] = compact('day', 'start', 'end');
        }
        usort($clean, fn ($a, $b) => [$a['day'], $a['start']] <=> [$b['day'], $b['start']]);
        $lastByDay = [];
        foreach ($clean as $item) {
            $day = $item['day'];
            if (isset($lastByDay[$day]) && $item['start'] < $lastByDay[$day]) {
                throw ValidationException::withMessages(['slots' => 'Créneaux qui se chevauchent le même jour.']);
            }
            $lastByDay[$day] = $item['end'];
        }
        $callback = function () use ($coach, $clean) {
            // Lock coach row (and synchronize with Admin Planning lock on MySQL).
            User::query()->whereKey($coach->id)->lockForUpdate()->firstOrFail();
            $future = CourseSession::query()
                ->where('coach_id', $coach->id)
                ->where('status', 'scheduled')
                ->where('start_at', '>=', now('UTC')->toDateTimeString())
                ->get(['start_at', 'end_at']);
            $tz = config('gym.timezone', 'Africa/Casablanca');
            foreach ($future as $session) {
                $start = $session->start_at->copy()->setTimezone($tz);
                $end = $session->end_at->copy()->setTimezone($tz);
                $supported = $start->toDateString() === $end->toDateString()
                    && collect($clean)->contains(fn ($slot) =>
                        $slot['day'] === $start->dayOfWeek
                        && $slot['start'] <= $start->format('H:i:s')
                        && $slot['end'] >= $end->format('H:i:s')
                    );
                if (!$supported) {
                    throw ValidationException::withMessages([
                        'slots' => 'Une séance future est déjà programmée sur un créneau supprimé. Contactez l’admin.',
                    ]);
                }
            }
            CoachAvailability::query()->where('coach_id', $coach->id)->delete();
            foreach ($clean as $slot) {
                CoachAvailability::create([
                    'coach_id' => $coach->id,
                    'day_of_week' => $slot['day'],
                    'start_time' => $slot['start'],
                    'end_time' => $slot['end'],
                    'is_active' => true,
                ]);
            }
            return CoachAvailability::query()->where('coach_id', $coach->id)
                ->orderBy('day_of_week')->orderBy('start_time')
                ->get(['id', 'day_of_week', 'start_time', 'end_time', 'is_active'])
                ->map(fn ($slot) => [
                    'id' => (int) $slot->id,
                    'day_of_week' => (int) $slot->day_of_week,
                    'start_time' => substr((string) $slot->start_time, 0, 5),
                    'end_time' => substr((string) $slot->end_time, 0, 5),
                    'is_active' => true,
                ])->all();
        };

        if (DB::connection()->getDriverName() !== 'mysql') {
            return DB::transaction($callback, 3);
        }
        // Same lock as App\Services\Admin\CourseSessionService.
        $name = 'bouray_gym_planning';
        $acquired = DB::selectOne('SELECT GET_LOCK(?, 10) AS acquired', [$name]);
        if ((int) ($acquired->acquired ?? 0) !== 1) {
            throw ValidationException::withMessages(['slots' => 'Planning occupé. Réessayez.']);
        }
        try {
            return DB::transaction($callback, 3);
        } finally {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS released', [$name]);
        }
    }
}
