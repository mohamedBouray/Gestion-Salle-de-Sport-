<?php

namespace App\Http\Requests\admin;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCourseSessionRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isAdmin() === true; }

    protected function prepareForValidation(): void
    {
        if ($this->exists('location') && is_string($this->input('location'))) {
            $location = preg_replace('/\s+/u', ' ', trim($this->input('location')));
            $this->merge(['location' => $location === '' ? null : $location]);
        }
    }

    public function rules(): array
    {
        return [
            'course_id' => ['bail', 'required', 'integer', Rule::exists('courses', 'id')->where(
                fn ($q) => $q->where('status', 'active')->whereNull('deleted_at')
            )],
            'coach_id' => ['bail', 'required', 'integer', Rule::exists('users', 'id')->where(
                fn ($q) => $q->where('role', 'coach')->where('status', 'active')->whereNull('deleted_at')
            )],
            'start_at' => ['bail', 'required', 'date', 'after:now'],
            'end_at' => ['bail', 'required', 'date', 'after:start_at'],
            'capacity' => ['bail', 'required', 'integer', 'between:1,1000'],
            'location' => ['nullable', 'string', 'max:160'],
            'status' => ['sometimes', 'required', Rule::in(['scheduled'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->has('start_at') || $validator->errors()->has('end_at')) return;
            try {
                $tz = config('gym.timezone', 'Africa/Casablanca');
                $start = Carbon::parse($this->input('start_at'))->setTimezone($tz);
                $end = Carbon::parse($this->input('end_at'))->setTimezone($tz);
                if ($start->toDateString() !== $end->toDateString()) {
                    $validator->errors()->add('end_at', 'La séance doit commencer et finir le même jour.');
                }
            } catch (\Throwable $e) { $validator->errors()->add('start_at', 'Date invalide.'); }
        });
    }

    public function messages(): array
    {
        return [
            'course_id.required' => 'Sélectionnez un cours.',
            'course_id.exists' => 'Le cours doit être actif et non archivé.',
            'coach_id.required' => 'Sélectionnez un coach.',
            'coach_id.exists' => 'Le coach doit être actif et non archivé.',
            'start_at.required' => 'Indiquez la date et heure de début.',
            'start_at.date' => 'Date de début invalide.',
            'start_at.after' => 'La séance doit commencer dans le futur.',
            'end_at.required' => 'Indiquez la date et heure de fin.',
            'end_at.date' => 'Date de fin invalide.',
            'end_at.after' => 'La fin doit être après le début.',
            'capacity.required' => 'Indiquez le nombre de places.',
            'capacity.integer' => 'La capacité doit être un nombre entier.',
            'capacity.between' => 'La capacité doit être comprise entre 1 et 1000.',
            'location.max' => 'La salle ne doit pas dépasser 160 caractères.',
            'status.in' => 'Une séance nouvelle doit être programmée.',
        ];
    }
}