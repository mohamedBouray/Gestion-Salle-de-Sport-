<?php

namespace App\Http\Requests\CoachWorkspace;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCoach() === true;
    }

    protected function prepareForValidation(): void
    {
        $clean = [];
        if (is_string($this->input('name'))) {
            $clean['name'] = preg_replace('/\s+/u', ' ', trim($this->input('name')));
        }
        if (is_string($this->input('description'))) {
            $clean['description'] = trim($this->input('description')) ?: null;
        }
        $this->merge($clean);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'bail', 'required', 'string', 'min:4', 'max:160',
                function ($attribute, $value, $fail) {
                    if (is_string($value) && !preg_match('/\p{L}/u', $value)) {
                        $fail('Le nom doit contenir au moins une lettre (ex. Fitness 360).');
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:3000'],
            'suggested_duration_minutes' => ['bail', 'required', 'integer', 'between:15,240'],
            'suggested_capacity' => ['bail', 'required', 'integer', 'between:1,100'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du cours est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 4 caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 160 caractères.',
            'description.max' => 'La description ne doit pas dépasser 3000 caractères.',
            'suggested_duration_minutes.required' => 'La durée suggérée est obligatoire.',
            'suggested_duration_minutes.integer' => 'La durée doit être un nombre entier.',
            'suggested_duration_minutes.between' => 'La durée doit être entre 15 et 240 minutes.',
            'suggested_capacity.required' => 'La capacité suggérée est obligatoire.',
            'suggested_capacity.integer' => 'La capacité doit être un nombre entier.',
            'suggested_capacity.between' => 'La capacité doit être entre 1 et 100 places.',
        ];
    }
}