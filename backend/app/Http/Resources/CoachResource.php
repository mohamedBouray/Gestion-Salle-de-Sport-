<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CoachResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->coachProfile;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'profile' => [
                'specialty' => $profile?->specialty,
                'bio' => $profile?->bio,
                'experience_years' => $profile?->experience_years,
                'is_featured' => (bool) ($profile?->is_featured ?? false),
                'photo_url' => $profile?->photo
                    ? url(Storage::disk('public')->url($profile->photo))
                    : null,
            ],
            'coached_courses_count' => $this->whenCounted('coachedCourses'),
            'coached_sessions_count' => $this->whenCounted('coachedSessions'),
            'received_requests_count' => $this->when(
                isset($this->received_personal_training_requests_count),
                fn () => (int) $this->received_personal_training_requests_count
            ),
            'coach_availabilities' => $this->whenLoaded('coachAvailabilities', fn () =>
                $this->coachAvailabilities->map(fn ($slot) => [
                    'id' => $slot->id,
                    'day_of_week' => $slot->day_of_week,
                    'start_time' => $slot->start_time,
                    'end_time' => $slot->end_time,
                ])->values()
            ),
        ];
    }
}
