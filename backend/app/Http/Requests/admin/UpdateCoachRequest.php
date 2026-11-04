<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCoachRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'specialty' => ['sometimes', 'required', 'string', 'max:160'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'experience_years' => ['sometimes', 'integer', 'min:0', 'max:80'],
            'is_featured' => ['sometimes', 'boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_photo' => ['sometimes', 'boolean'],
        ];
    }
}
