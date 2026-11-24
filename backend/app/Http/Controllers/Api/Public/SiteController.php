<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\SiteSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SiteController extends Controller
{
    public function index(SiteSettingService $service): JsonResponse
    {
        $coach = User::query()
            ->where('role', User::COACH)
            ->where('status', 'active')
            ->whereHas('coachProfile', fn ($query) => $query->where('is_featured', true))
            ->with('coachProfile')
            ->latest('id')
            ->first();

        $featured = null;
        $classes = [];
        if ($coach) {
            $profile = $coach->coachProfile;
            $now = now('UTC')->toDateTimeString();
            $timezone = config('gym.timezone', 'Africa/Casablanca');
            $courses = $coach->coachedCourses()->where('status', 'active')
                ->with(['sessions' => fn ($query) => $query
                    ->where('coach_id', $coach->id)
                    ->where('status', 'scheduled')
                    ->where('start_at', '>', $now)
                    ->withCount(['enrollments as enrolled_count' => fn ($enrollments) => $enrollments
                        ->whereIn('status', ['confirmed', 'attended'])])
                    ->orderBy('start_at')->orderBy('id')->limit(1)])
                ->orderBy('name')->orderBy('id')->get();

            $featured = [
                'id' => $coach->id,
                'name' => $coach->name,
                'specialty' => $profile?->specialty,
                'experience_years' => (int) ($profile?->experience_years ?? 0),
                'photo_url' => $profile?->photo
                    ? url(Storage::disk('public')->url($profile->photo))
                    : null,
                'courses_count' => $courses->count(),
            ];

            $classes = $courses->map(function (Course $course) use ($timezone, $coach): array {
                $session = $course->sessions->first();
                return [
                    'id' => $course->id,
                    'coach_id' => $coach->id,
                    'title' => $course->name,
                    'category' => 'Cours collectif',
                    'session_id' => $session?->id,
                    'days' => $session?->start_at->copy()->setTimezone($timezone)->format('d/m/Y'),
                    'time' => $session ? $session->start_at->copy()->setTimezone($timezone)->format('H:i')
                        .' – '.$session->end_at->copy()->setTimezone($timezone)->format('H:i') : null,
                    'location' => $session?->location,
                    'enrolled' => $session ? (int) $session->enrolled_count : null,
                    'capacity' => $session?->capacity,
                ];
            })->all();
        }

        return response()->json([
            'settings' => array_merge($service->all(), [
                'featured_coach' => $featured,
                'classes_items' => $classes,
                'pricing_plans' => $this->publicPlans(),
            ]),
        ]);
    }

    /** Prefer two general offers and one course offer; fill remaining slots from either type. */
    private function publicPlans(): array
    {
        $general = SubscriptionPlan::query()->where('status', 'active')
            ->where('type', 'general')->orderBy('price')->orderBy('id')->limit(3)->get();
        $specific = SubscriptionPlan::query()->where('status', 'active')
            ->where('type', 'course')
            ->whereHas('course', fn ($query) => $query->where('status', 'active'))
            ->with('course:id,name')->orderBy('price')->orderBy('id')->limit(3)->get();

        $plans = $general->take(2)->concat($specific->take(1))
            ->concat($general->skip(2))->concat($specific->skip(1))->take(3);

        return $plans->values()->map(function (SubscriptionPlan $plan): array {
            $general = $plan->type === 'general';
            $unit = match ($plan->duration_unit) {
                'day' => $plan->duration_value > 1 ? 'jours' : 'jour',
                'year' => $plan->duration_value > 1 ? 'ans' : 'an',
                default => 'mois',
            };
            $coverage = $general ? 'Accès aux cours collectifs inclus' : 'Cours : '.$plan->course->name;

            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description ?: $coverage,
                'price' => $plan->price,
                'currency' => 'DH',
                'period' => '/ '.$plan->duration_value.' '.$unit,
                'type_label' => $general ? 'Abonnement général' : 'Abonnement spécifique',
                'features' => [$coverage, 'Réservation selon les places disponibles'],
                'popular' => false,
            ];
        })->all();
    }
}
