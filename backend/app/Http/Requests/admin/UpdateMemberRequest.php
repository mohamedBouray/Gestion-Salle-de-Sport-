<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    protected function prepareForValidation(): void
    {
        $clean = [];

        if (is_string($this->input('name'))) {
            $clean['name'] = preg_replace(
                '/\s+/u',
                ' ',
                trim($this->input('name'))
            );
        }

        if (is_string($this->input('phone'))) {
            $phone = preg_replace(
                '/[\s-]+/u',
                '',
                trim($this->input('phone'))
            );

            $clean['phone'] = $phone === '' ? null : $phone;
        }

        $this->merge($clean);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'bail', 'sometimes', 'required',
                'string', 'min:2', 'max:160',
                'regex:/\A[\p{L}\p{M}][\p{L}\p{M} .\'’-]*\z/u',
            ],

            'phone' => [
                'bail', 'sometimes', 'nullable',
                'string', 'max:13',
                'regex:/\A(?:0[567][0-9]{8}|\+?212[567][0-9]{8})\z/',
            ],

            'status' => [
                'sometimes',
                Rule::in(['active', 'inactive']),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom complet est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 2 caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 160 caractères.',
            'name.regex' => 'Le nom doit contenir des lettres, sans chiffres.',
            'phone.regex' => 'Numéro marocain invalide : 05, 06 ou 07 suivi de 8 chiffres (ou +2125, +2126, +2127 suivi de 8 chiffres).',
            'phone.max' => 'Numéro de téléphone trop long.',
            'status.in' => 'Le statut sélectionné est invalide.',
        ];
    }
}
