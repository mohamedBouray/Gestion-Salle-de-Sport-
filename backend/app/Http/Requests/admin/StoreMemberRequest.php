<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
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

        if (is_string($this->input('email'))) {
            $clean['email'] = mb_strtolower(
                trim($this->input('email'))
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
                'bail', 'required', 'string',
                'min:2', 'max:160',
                'regex:/\A[\p{L}\p{M}][\p{L}\p{M} .\'’-]*\z/u',
            ],

            'email' => [
                'bail', 'required', 'string',
                'email:rfc', 'max:190',
                Rule::unique('users', 'email'),
            ],

            'phone' => [
                'bail', 'nullable', 'string', 'max:13',
                'regex:/\A(?:0[567][0-9]{8}|\+?212[567][0-9]{8})\z/',
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
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => 'Saisissez une adresse e-mail valide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'email.max' => "L'adresse e-mail ne doit pas dépasser 190 caractères.",
            'phone.regex' => 'Numéro marocain invalide : 05, 06 ou 07 suivi de 8 chiffres (ou +2125, +2126, +2127 suivi de 8 chiffres).',
            'phone.max' => 'Numéro de téléphone trop long.',
        ];
    }
}
