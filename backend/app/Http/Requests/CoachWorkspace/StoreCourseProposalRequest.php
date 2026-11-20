<?php

namespace App\Http\Requests\CoachWorkspace;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseProposalRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isCoach() === true; }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:4', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'suggested_duration_minutes' => ['nullable', 'integer', 'min:15', 'max:240'],
            'suggested_capacity' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
