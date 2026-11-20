<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseSession;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Coach workspace: lecture seule du catalogue attribué et du planning personnel.
 * Le coach est toujours identifié via Sanctum, jamais via un coach_id client.
 * La programmation / modification des séances reste réservée à l'admin.
 */
class CoachCoursePlanningController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $coachId = (int) $request->user()->getKey();
        $nowUtc = now()->utc()->toDateTimeString();

        // Inclut les cours qui lui sont attribués et ceux pour lesquels il
        // anime au moins une séance, même si le coach principal diffère.
        $courses = Course::query()
            ->where(function (Builder $query) use ($coachId): void {
                $query->where('coach_id', $coachId)
                    ->orWhereHas('sessions', function (Builder $sessions) use ($coachId): void {
                        $sessions->where('coach_id', $coachId);
                    });
            })
            ->withCount([
                'sessions as my_sessions_count' => function (Builder $query) use ($coachId): void {
                    $query->where('coach_id', $coachId);
                },
                'sessions as upcoming_sessions_count' => function (Builder $query) use ($coachId, $nowUtc): void {
                    $query->where('coach_id', $coachId)
                        ->where('status', 'scheduled')
                        ->where('start_at', '>=', $nowUtc);
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Course $course) => [
                'id' => (int) $course->id,
                'name' => $course->name,
                'description' => $course->description,
                'status' => $course->status,
                'price' => $course->price,
                'is_main_coach' => (int) $course->coach_id === $coachId,
                'sessions_count' => (int) $course->my_sessions_count,
                'upcoming_sessions_count' => (int) $course->upcoming_sessions_count,
            ])
            ->values();

        return response()->json(['courses' => $courses]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $timezone = config('app.timezone', 'UTC');
        $today = now($timezone);
        $from = Carbon::parse($filters['from'] ?? $today->copy()->subDays(30)->toDateString(), $timezone)->startOfDay();
        $to = Carbon::parse($filters['to'] ?? $today->copy()->addDays(60)->toDateString(), $timezone)->endOfDay();

        if ($to->lessThan($from) || $from->diffInDays($to) > 120) {
            throw ValidationException::withMessages([
                'to' => 'Choisissez une période de 120 jours maximum.',
            ]);
        }

        $coachId = (int) $request->user()->getKey();

        $sessions = CourseSession::query()
            ->where('coach_id', $coachId)
            ->where('end_at', '>=', $from->copy()->utc()->toDateTimeString())
            ->where('start_at', '<=', $to->copy()->utc()->toDateTimeString())
            ->with('course:id,name,description,status')
            ->withCount([
                'enrollments as booked_count' => fn (Builder $query) =>
                    $query->whereIn('status', ['confirmed', 'attended']),
            ])
            ->orderBy('start_at')
            ->orderBy('id')
            ->get()
            ->map(fn (CourseSession $session) => [
                'id' => (int) $session->id,
                'course_id' => (int) $session->course_id,
                'start_at' => $session->start_at?->toIso8601String(),
                'end_at' => $session->end_at?->toIso8601String(),
                'status' => $session->status,
                'location' => $session->location,
                'capacity' => (int) $session->capacity,
                'booked_count' => (int) $session->booked_count,
                'course' => $session->course ? [
                    'id' => (int) $session->course->id,
                    'name' => $session->course->name,
                    'status' => $session->course->status,
                ] : null,
            ])
            ->values();

        return response()->json([
            'sessions' => $sessions,
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    public function availabilities(Request $request): JsonResponse
    {
        $slots = CoachAvailability::query()
            ->where('coach_id', $request->user()->getKey())
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get(['id', 'day_of_week', 'start_time', 'end_time', 'is_active'])
            ->map(fn (CoachAvailability $slot) => [
                'id' => (int) $slot->id,
                'day_of_week' => (int) $slot->day_of_week,
                'start_time' => substr((string) $slot->start_time, 0, 5),
                'end_time' => substr((string) $slot->end_time, 0, 5),
                'is_active' => (bool) $slot->is_active,
            ])
            ->values();

        return response()->json(['availabilities' => $slots]);
    }
}
