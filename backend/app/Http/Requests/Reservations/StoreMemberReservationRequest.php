<?php

namespace App\Http\Requests\Reservations;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isMember() === true;
    }

    public function rules(): array
    {
        // L'identité du membre vient TOUJOURS de la session Sanctum.
        // L'identifiant de séance vient du paramètre de route {session}.
        return [
            'member_id' => ['prohibited'],
            'session_id' => ['prohibited'],
            'status' => ['prohibited'],
            'price_at_booking' => ['prohibited'],
        ];
    }
}
