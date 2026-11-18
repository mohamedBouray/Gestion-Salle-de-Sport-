<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Le Service doit charger ce compteur.
        // Il représente les réservations confirmées
        // et les présences enregistrées.

        $attributes = $this->resource->getAttributes();

        $enrolledCount = array_key_exists(
            'enrolled_count',
            $attributes
        )
            ? (int) $attributes['enrolled_count']
            : null;

        $capacity = $this->capacity !== null
            ? (int) $this->capacity
            : null;

        // Ne pas inventer les places disponibles
        // si le compteur n'a pas été chargé.

        $remainingPlaces = (
            $capacity !== null &&
            $enrolledCount !== null
        )
            ? max(0, $capacity - $enrolledCount)
            : null;

        return [
            // =====================================
            // IDENTIFIANTS
            // =====================================

            'id' => $this->id,
            'course_id' => $this->course_id,
            'coach_id' => $this->coach_id,

            // =====================================
            // INFORMATIONS DE LA SEANCE
            // =====================================

            'start_at' => $this->start_at
                ?->toIso8601String(),

            'end_at' => $this->end_at
                ?->toIso8601String(),

            'capacity' => $capacity,

            'location' => $this->location,

            'status' => $this->status,

            // =====================================
            // COURS ASSOCIE
            // =====================================

            'course' => $this->whenLoaded(
                'course',
                function () {
                    if (!$this->course) {
                        return null;
                    }

                    return [
                        'id' => $this->course->id,
                        'name' => $this->course->name,
                        'description' =>
                            $this->course->description,
                        'price' => $this->course->price,
                        'status' => $this->course->status,
                    ];
                }
            ),

            'course_name' => $this->relationLoaded('course')
                ? $this->course?->name
                : null,

            // =====================================
            // COACH RESPONSABLE
            // =====================================

            'coach' => $this->whenLoaded(
                'coach',
                function () {
                    if (!$this->coach) {
                        return null;
                    }

                    return [
                        'id' => $this->coach->id,
                        'name' => $this->coach->name,
                        'status' => $this->coach->status,
                    ];
                }
            ),

            'coach_name' => $this->relationLoaded('coach')
                ? $this->coach?->name
                : null,

            // =====================================
            // CAPACITE ET RESERVATIONS
            // =====================================

            'enrolled_count' => $enrolledCount,

            'remaining_places' => $remainingPlaces,

            // =====================================
            // DATES SYSTEME
            // =====================================

            'created_at' => $this->created_at
                ?->toIso8601String(),

            'updated_at' => $this->updated_at
                ?->toIso8601String(),
        ];
    }
}
