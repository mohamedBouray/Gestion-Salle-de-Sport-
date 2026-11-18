<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date?->format('Y-m-d'),
            'role' => $this->role,
            'person_id' => $this->user_id,
            'person' => $this->whenLoaded('person', function () {
                return $this->person ? [
                    'id' => $this->person->id,
                    'name' => $this->person->name,
                    'email' => $this->person->email,
                ] : null;
            }),
            'status' => $this->status,
            'check_in_at' => $this->check_in_at?->copy()->utc()->toIso8601String(),
            'check_out_at' => $this->check_out_at?->copy()->utc()->toIso8601String(),
            'note' => $this->note,
            'recorded_by' => $this->recorded_by,
            'created_at' => $this->created_at?->copy()->utc()->toIso8601String(),
        ];
    }
}
