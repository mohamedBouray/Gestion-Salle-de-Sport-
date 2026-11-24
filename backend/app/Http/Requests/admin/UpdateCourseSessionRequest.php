<?php

namespace App\Http\Requests\admin;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCourseSessionRequest extends FormRequest
{
    // =====================================
    // AUTORISATION ADMIN
    // =====================================

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    // =====================================
    // REGLES DE VALIDATION
    // =====================================

    protected function prepareForValidation(): void
    {
        if ($this->exists('location') && is_string($this->input('location'))) {
            $location = preg_replace('/\s+/u', ' ', trim($this->input('location')));
            $this->merge(['location' => $location === '' ? null : $location]);
        }
    }

    public function rules(): array
    {
        $session = $this->route('session');

        $currentCourseId = $session?->course_id;
        $currentCoachId = $session?->coach_id;

        return [

            // COURS SPORTIF
            'course_id' => [
                'sometimes',
                'required',
                'integer',

                Rule::exists('courses', 'id')->where(
                    function ($query) use ($currentCourseId) {
                        $query
                            ->whereNull('deleted_at')
                            ->where(function ($q) use ($currentCourseId) {
                                $q->where('status', 'active');

                                if ($currentCourseId !== null) {
                                    $q->orWhere('id', $currentCourseId);
                                }
                            });
                    }
                ),
            ],

            // COACH RESPONSABLE
            'coach_id' => [
                'sometimes',
                'required',
                'integer',

                Rule::exists('users', 'id')->where(
                    function ($query) use ($currentCoachId) {
                        $query
                            ->where('role', 'coach')
                            ->whereNull('deleted_at')
                            ->where(function ($q) use ($currentCoachId) {
                                $q->where('status', 'active');

                                if ($currentCoachId !== null) {
                                    $q->orWhere('id', $currentCoachId);
                                }
                            });
                    }
                ),
            ],

            // DATE DE DEBUT
            'start_at' => [
                'sometimes',
                'required',
                'date',
            ],

            // DATE DE FIN
            'end_at' => [
                'sometimes',
                'required',
                'date',
            ],

            // CAPACITE
            'capacity' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                'max:1000',
            ],

            // SALLE
            'location' => [
                'sometimes',
                'nullable',
                'string',
                'max:160',
            ],

            // STATUT DE LA SEANCE
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'scheduled',
                    'completed',
                    'cancelled',
                ]),
            ],
        ];
    }

    // =====================================
    // VALIDATION DES HORAIRES
    // =====================================

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {

            if (
                !$this->exists('start_at') &&
                !$this->exists('end_at')
            ) {
                return;
            }

            if (
                $validator->errors()->has('start_at') ||
                $validator->errors()->has('end_at')
            ) {
                return;
            }

            $session = $this->route('session');

            $start = $this->input(
                'start_at',
                $session?->start_at
            );

            $end = $this->input(
                'end_at',
                $session?->end_at
            );

            if (!$start || !$end) {
                return;
            }

            $startDate = Carbon::parse($start, config('gym.timezone', 'Africa/Casablanca'));
            $endDate = Carbon::parse($end, config('gym.timezone', 'Africa/Casablanca'));

            if ($endDate->lessThanOrEqualTo($startDate)) {
                $validator->errors()->add('end_at', 'La date de fin doit être après la date de début.');
                return;
            }
            $timezone = config('gym.timezone', 'Africa/Casablanca');
            if ($startDate->copy()->setTimezone($timezone)->toDateString() !== $endDate->copy()->setTimezone($timezone)->toDateString()) {
                $validator->errors()->add('end_at', 'La séance doit commencer et finir le même jour.');
            }
        });
    }

    // =====================================
    // MESSAGES D'ERREUR
    // =====================================

    public function messages(): array
    {
        return [
            'course_id.exists' =>
                'Le cours sélectionné est indisponible.',

            'coach_id.exists' =>
                'Le coach sélectionné est indisponible.',

            'start_at.date' =>
                'La date de début est invalide.',

            'end_at.date' =>
                'La date de fin est invalide.',

            'capacity.required' =>
                'Veuillez renseigner la capacité.',

            'capacity.integer' =>
                'La capacité doit être un nombre entier.',

            'capacity.min' =>
                'La capacité minimale est de 1 place.',

            'capacity.max' =>
                'La capacité maximale est de 1000 places.',

            'location.max' =>
                'Le nom de la salle ne peut pas dépasser 160 caractères.',

            'status.in' =>
                'Le statut sélectionné est invalide.',
        ];
    }
}
