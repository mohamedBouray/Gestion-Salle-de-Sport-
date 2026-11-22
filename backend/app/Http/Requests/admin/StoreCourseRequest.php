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

    protected function prepareForValidation(): void
    {
        $clean = [];
        if (is_string($this->input('name'))) {
            $clean['name'] = preg_replace('/\s+/u', ' ', trim($this->input('name')));
        }
        if (is_string($this->input('description'))) {
            $description = trim($this->input('description'));
            $clean['description'] = $description === '' ? null : $description;
        }
        if (is_string($this->input('coach_id'))) {
            $coachId = trim($this->input('coach_id'));
            $clean['coach_id'] = $coachId === '' ? null : $coachId;
        }
        if (is_string($this->input('price'))) {
            $clean['price'] = str_replace(',', '.', trim($this->input('price')));
        }
        if (is_string($this->input('status'))) {
            $clean['status'] = trim($this->input('status'));
        }
        $this->merge($clean);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'bail', 'required', 'string', 'min:2', 'max:160',
                'regex:/\A[^\p{C}<>]+\z/u',
                function ($attribute, $value, $fail) {
                    if (is_string($value) && preg_match('/\p{L}/u', $value) !== 1) {
                        $fail('Le nom du cours doit contenir au moins une lettre.');
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'coach_id' => [
                'nullable', 'integer',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->where('role', 'coach')
                        ->where('status', 'active')->whereNull('deleted_at')
                ),
            ],
            'price' => [
                'bail', 'required', 'numeric', 'min:0', 'max:99999999.99',
                'decimal:0,2', 'regex:/\A[0-9]+(?:\.[0-9]{1,2})?\z/D',
            ],
            'status' => ['required', Rule::in(['pending', 'active', 'inactive'])],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du cours est obligatoire.',
            'name.min' => 'Le nom doit contenir au moins 2 caractères.',
            'name.max' => 'Le nom ne doit pas dépasser 160 caractères.',
            'name.regex' => 'Le nom contient des caractères interdits.',
            'description.max' => 'La description ne doit pas dépasser 5000 caractères.',
            'coach_id.integer' => 'Sélectionnez un coach valide.',
            'coach_id.exists' => 'Le coach sélectionné doit être actif et disponible.',
            'price.required' => 'Le prix est obligatoire.',
            'price.numeric' => 'Saisissez un prix valide.',
            'price.min' => 'Le prix ne peut pas être négatif.',
            'price.max' => 'Le prix est trop élevé.',
            'price.decimal' => 'Le prix ne doit pas dépasser 2 décimales.',
            'price.regex' => 'Prix invalide : uniquement des chiffres et 2 décimales maximum.',
            'status.required' => 'Le statut est obligatoire.',
            'status.in' => 'Le statut sélectionné est invalide.',
            'image.image' => 'Le fichier doit être une image valide.',
            'image.mimes' => 'Formats acceptés : JPG, PNG et WEBP.',
            'image.max' => "L'image ne doit pas dépasser 5 Mo.",
        ];
    }
}
