<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'coach_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query
                        ->where('role', 'coach')
                        ->where('status', 'active')
                        ->whereNull('deleted_at')
                ),
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                'decimal:0,2',
            ],

            'status' => [
                'required',
                Rule::in([
                    'pending',
                    'active',
                    'inactive',
                ]),
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }
}
