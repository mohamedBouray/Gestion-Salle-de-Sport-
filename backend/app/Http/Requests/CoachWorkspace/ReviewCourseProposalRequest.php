<?php

namespace App\Http\Requests\CoachWorkspace;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewCourseProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('note'))) {
            $this->merge(['note' => trim($this->input('note')) ?: null]);
        }
    }

    public function rules(): array
    {
        $approve = $this->is('api/admin/course-proposals/*/approve');
        $reject = $this->is('api/admin/course-proposals/*/reject');
        return [
            'price' => [
                'bail', Rule::requiredIf($approve), 'nullable', 'numeric', 'min:0', 'max:999999',
                'regex:/\A(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,2})?\z/D',
            ],
            'note' => ['bail', Rule::requiredIf($reject), 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'price.required' => "Indiquez le prix du cours.",
            'price.numeric' => 'Le prix doit être numérique.',
            'price.min' => 'Le prix doit être positif ou nul.',
            'price.max' => 'Le prix ne doit pas dépasser 999999 MAD.',
            'price.regex' => 'Le prix doit avoir au maximum deux décimales, sans notation scientifique.',
            'note.required' => 'Indiquez le motif du refus.',
            'note.max' => 'La note ne doit pas dépasser 1000 caractères.',
        ];
    }
}