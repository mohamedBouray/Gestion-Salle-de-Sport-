<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attendance = in_array($this->attendance_status, ['present', 'absent'], true)
            ? $this->attendance_status : ($this->status === 'attended' ? 'present' : 'unmarked');
        $elapsed = $this->relationLoaded('session') && $this->session?->end_at?->lessThanOrEqualTo(now('UTC'));
        $displayStatus = match (true) {
            $this->status === 'cancelled' => 'cancelled',
            $attendance === 'absent' => 'absent',
            $attendance === 'present' => 'attended',
            $elapsed && in_array($this->status, ['confirmed', 'pending'], true) => 'unmarked',
            default => $this->status,
        };
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'member_id' => $this->member_id,
            'status' => $this->status,
            'attendance_status' => $attendance,
            'display_status' => $displayStatus,
            'price_at_booking' => $this->price_at_booking,
            'enrolled_at' => $this->enrolled_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'member' => $this->whenLoaded('member', function () {
                if (!$this->member) {
                    return null;
                }

                return [
                    'id' => $this->member->id,
                    'name' => $this->member->name,
                    'email' => $this->member->email,
                    'phone' => $this->member->phone,
                ];
            }),

            'session' => $this->whenLoaded('session', function () {
                if (!$this->session) {
                    return null;
                }

                $session = $this->session;

                return [
                    'id' => $session->id,
                    'course_id' => $session->course_id,
                    'coach_id' => $session->coach_id,
                    'start_at' => $session->start_at?->toIso8601String(),
                    'end_at' => $session->end_at?->toIso8601String(),
                    'capacity' => $session->capacity,
                    'location' => $session->location,
                    'status' => $session->status === 'scheduled' && $session->end_at?->lessThanOrEqualTo(now('UTC'))
                        ? 'completed' : $session->status,
                    'course' => $session->relationLoaded('course') && $session->course
                        ? [
                            'id' => $session->course->id,
                            'name' => $session->course->name,
                            'price' => $session->course->price,
                            'status' => $session->course->status,
                        ]
                        : null,
                    'coach' => $session->relationLoaded('coach') && $session->coach
                        ? [
                            'id' => $session->coach->id,
                            'name' => $session->coach->name,
                        ]
                        : null,
                ];
            }),
        ];
    }
}
