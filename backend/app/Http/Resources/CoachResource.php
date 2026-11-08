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
        ];
    }
}
