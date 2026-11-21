<?php

namespace App\Http\Requests\Tariffs;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangeTariffStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }
}
