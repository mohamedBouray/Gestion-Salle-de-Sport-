<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCoachRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    protected function prepareForValidation(): void
    {
        $clean = [];

        foreach (['name', 'specialty'] as $field) {
            if (is_string($this->input($field))) {
                $clean[$field] = preg_replace('/\s+/u', ' ', trim($this->input($field)));
            }
        }

        if (is_string($this->input('email'))) {
            $clean['email'] = mb_strtolower(trim($this->input('email')));
        }

        if (is_string($this->input('phone'))) {
            $phone = preg_replace('/[\s-]+/u', '', trim($this->input('phone')));
            $clean['phone'] = $phone === '' ? null : $phone;
        }

        if (is_string($this->input('bio'))) {
            $clean['bio'] = trim($this->input('bio')) ?: null;
        }

        $this->merge($clean);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'bail', 'required', 'string', 'min:2', 'max:160',
                'regex:/\A[\p{L}\p{M}][\p{L}\p{M} .\'’-]*\z/u',
            ],
            'email' => [
                'bail', 'required', 'string', 'email:rfc', 'max:190',
                Rule::unique('users', 'email'),
            ],
            'phone' => [
                'bail', 'nullable', 'string', 'max:13',
                'regex:/\A(?:0[67][0-9]{8}|\+?212[67][0-9]{8})\z/',
            ],
            'specialty' => [
                'bail', 'required', 'string', 'min:2', 'max:160',
                function ($attribute, $value, $fail) {
                    if (is_string($value) && !preg_match('/\p{L}/u', $value)) {
                        $fail('La spécialité doit contenir au moins une lettre.');
                    }
                },
            ],
            'bio' => ['nullable', 'string', 'max:3000'],
            'experience_years' => ['bail', 'required', 'integer', 'min:0', 'max:80'],
            'is_featured' => ['sometimes', 'boolean'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom complet est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 2 caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 160 caractères.',
            'name.regex' => 'Le nom doit contenir des lettres, sans chiffres ni symboles spéciaux.',
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => 'Saisissez une adresse e-mail valide.',
            'email.max' => "L'adresse e-mail ne doit pas dépasser 190 caractères.",
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'phone.regex' => 'Numéro marocain invalide : 06 ou 07 + 8 chiffres, ou +212/212 + 6/7 + 8 chiffres.',
            'phone.max' => 'Numéro de téléphone trop long.',
            'specialty.required' => 'La spécialité est obligatoire.',
            'specialty.min' => 'La spécialité doit contenir au moins 2 caractères.',
            'specialty.max' => 'La spécialité ne doit pas dépasser 160 caractères.',
            'bio.max' => 'La biographie ne doit pas dépasser 3000 caractères.',
            'experience_years.required' => "Le nombre d'années d'expérience est obligatoire.",
            'experience_years.integer' => "L'expérience doit être un nombre entier.",
            'experience_years.min' => "L'expérience doit être supérieure ou égale à 0.",
            'experience_years.max' => "L'expérience ne doit pas dépasser 80 ans.",
            'photo.image' => 'Le fichier doit être une image.',
            'photo.mimes' => 'Formats acceptés : JPG, PNG et WEBP.',
            'photo.max' => 'La photo ne doit pas dépasser 2 Mo.',
        ];
    }
}
