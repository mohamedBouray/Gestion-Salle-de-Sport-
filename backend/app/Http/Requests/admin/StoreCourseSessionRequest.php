<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            // Cours existant et actif
            'course_id' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(
                    fn ($query) => $query
                        ->where('status', 'active')
                        ->whereNull('deleted_at')
                ),
            ],

            // Coach actif
            'coach_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query
                        ->where('role', 'coach')
                        ->where('status', 'active')
                        ->whereNull('deleted_at')
                ),
            ],

            // Date et horaires
            'start_at' => [
                'required',
                'date',
                'after:now',
            ],

            'end_at' => [
                'required',
                'date',
                'after:start_at',
            ],

            // Nombre de places
            'capacity' => [
                'required',
                'integer',
                'min:1',
                'max:1000',
            ],

            // Salle
            'location' => [
                'nullable',
                'string',
                'max:160',
            ],

            // Statut initial
            'status' => [
                'sometimes',
                'required',
                Rule::in(['scheduled']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'course_id.required' =>
                'Veuillez sélectionner un cours.',

            'course_id.exists' =>
                'Le cours sélectionné est indisponible ou inactif.',

            'coach_id.required' =>
                'Veuillez sélectionner un coach.',

            'coach_id.exists' =>
                'Le coach sélectionné est indisponible ou inactif.',

            'start_at.required' =>
                'Veuillez renseigner la date de début.',

            'start_at.after' =>
                'La séance doit commencer dans le futur.',

            'end_at.required' =>
                'Veuillez renseigner la date de fin.',

            'end_at.after' =>
                'La fin doit être après le début.',

            'capacity.required' =>
                'Veuillez renseigner la capacité.',

            'capacity.min' =>
                'La capacité doit être supérieure à zéro.',

            'capacity.max' =>
                'La capacité maximale est de 1000 places.',

            'status.in' =>
                'Une nouvelle séance doit être programmée.',
        ];
    }
}
