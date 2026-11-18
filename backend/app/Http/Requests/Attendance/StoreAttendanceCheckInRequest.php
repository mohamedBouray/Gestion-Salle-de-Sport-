<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceCheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'person_id' => [
                'required', 'integer', 'min:1',
                Rule::exists('users', 'id')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],
            'occurred_at' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'person_id.exists' => 'Ce profil est introuvable, inactif ou archivé.',
            'occurred_at.required' => 'Veuillez renseigner la date et l’heure d’entrée.',
            'occurred_at.date' => 'La date et l’heure d’entrée sont invalides.',
        ];
    }
}
