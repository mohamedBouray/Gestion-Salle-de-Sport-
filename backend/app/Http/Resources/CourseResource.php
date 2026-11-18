<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CourseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'coach_id' => $this->coach_id,
            'price' => $this->price,
            'image' => $this->image,

            'image_url' => $this->image
                ? url(Storage::disk('public')->url($this->image))
                : null,

            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // COACH ASSOCIE
            'coach' => $this->whenLoaded(
                'coach',
                fn () => $this->coach ? [
                    'id' => $this->coach->id,
                    'name' => $this->coach->name,
                    'status' => $this->coach->status,
                ] : null
            ),

            // NOMBRE DE SEANCES
            'sessions_count' => $this->whenCounted('sessions'),

            // SEANCES CHARGEES
            'sessions' => $this->whenLoaded(
                'sessions',
                fn () => $this->sessions->map(
                    fn ($session) => [
                        'id' => $session->id,
                        'coach_id' => $session->coach_id,
                        'start_at' => $session->start_at?->toIso8601String(),
                        'end_at' => $session->end_at?->toIso8601String(),
                        'capacity' => $session->capacity,
                        'location' => $session->location,
                        'status' => $session->status,
                    ]
                )->values()
            ),
        ];
    }
}
