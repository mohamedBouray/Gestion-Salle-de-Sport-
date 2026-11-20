<?php

namespace App\Http\Requests\CoachWorkspace;

use Illuminate\Foundation\Http\FormRequest;

class SaveAvailabilitiesRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isCoach() === true; }

    public function rules(): array
    {
        return [
            'slots' => ['required', 'array', 'max:28'],
            'slots.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time' => ['required', 'date_format:H:i'],
        ];
    }
}
