<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceCheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'occurred_at' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'occurred_at.required' => 'Veuillez renseigner la date et l’heure de sortie.',
            'occurred_at.date' => 'La date et l’heure de sortie sont invalides.',
        ];
    }
}
