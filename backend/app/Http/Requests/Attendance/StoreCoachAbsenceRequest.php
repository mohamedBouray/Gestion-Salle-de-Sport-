<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCoachAbsenceRequest extends FormRequest
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
                    ->where('role', 'coach')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],
            'date' => ['required', 'date_format:Y-m-d'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
