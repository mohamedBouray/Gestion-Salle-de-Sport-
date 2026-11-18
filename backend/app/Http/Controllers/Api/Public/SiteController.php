<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
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
            ->whereHas('coachProfile', fn ($query) => $query->where('is_featured', true))
            ->with('coachProfile')
            ->withCount('coachedCourses')
            ->latest('id')
            ->first();

        $featured = null;
        if ($coach) {
            $profile = $coach->coachProfile;
            $featured = [
                'id' => $coach->id,
                'name' => $coach->name,
                'specialty' => $profile?->specialty,
                'experience_years' => (int) ($profile?->experience_years ?? 0),
                'photo_url' => $profile?->photo
                    ? url(Storage::disk('public')->url($profile->photo))
                    : null,
                'courses_count' => (int) $coach->coached_courses_count,
            ];
        }

        return response()->json([
            'settings' => array_merge($service->all(), ['featured_coach' => $featured]),
        ]);
    }
}
