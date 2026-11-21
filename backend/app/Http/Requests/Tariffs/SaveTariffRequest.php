<?php

namespace App\Http\Requests\Tariffs;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveTariffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:160',
            ],

            'type' => [
                'required',
                Rule::in(['general', 'course']),
            ],

            'course_id' => [
                Rule::requiredIf(
                    fn () => $this->input('type') === 'course'
                ),
                'nullable',
                'integer',
                Rule::exists('courses', 'id')
                    ->whereNull('deleted_at'),
            ],

            'duration_value' => [
                'required',
                'integer',
                'min:1',
                'max:365',
            ],

            'duration_unit' => [
                'required',
                Rule::in(['day', 'month', 'year']),
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                'decimal:0,2',
            ],

            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }
}
