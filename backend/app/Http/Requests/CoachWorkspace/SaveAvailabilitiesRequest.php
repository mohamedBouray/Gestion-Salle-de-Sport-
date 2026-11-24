<?php

namespace App\Http\Requests\CoachWorkspace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveAvailabilitiesRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->isCoach() === true; }

    public function rules(): array
    {
        return [
            'slots' => ['present', 'array', 'max:28'],
            'slots.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) return;
            $slots = $this->input('slots', []);
            $byDay = [];
            foreach ($slots as $index => $slot) {
                $start = $slot['start_time']; $end = $slot['end_time'];
                if ($start >= $end) {
                    $validator->errors()->add("slots.$index.end_time", 'L’heure de fin doit être après le début.');
                }
                $byDay[(int) $slot['day_of_week']][] = [$start, $end, $index];
            }
            foreach ($byDay as $items) {
                usort($items, fn ($a, $b) => strcmp($a[0], $b[0]));
                for ($i = 1; $i < count($items); $i++) {
                    if ($items[$i][0] < $items[$i - 1][1]) {
                        $validator->errors()->add('slots', 'Deux créneaux se chevauchent le même jour.');
                        break;
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'slots.present' => 'Envoyez les disponibilités sous forme de liste, même vide.',
            'slots.array' => 'Format des disponibilités invalide.',
            'slots.max' => 'Maximum 28 créneaux hebdomadaires.',
            'slots.*.day_of_week.between' => 'Jour de semaine invalide.',
            'slots.*.start_time.date_format' => 'Heure de début invalide (HH:mm).',
            'slots.*.end_time.date_format' => 'Heure de fin invalide (HH:mm).',
        ];
    }
}