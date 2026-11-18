<?php

namespace App\Http\Requests\Reservations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'member_id' => [
                'required',
                'integer',
                'min:1',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query
                        ->where('role', 'member')
                        ->where('status', 'active')
                        ->whereNull('deleted_at')
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'member_id.required' => 'Veuillez sélectionner un membre.',
            'member_id.integer' => 'Identifiant du membre invalide.',
            'member_id.min' => 'Identifiant du membre invalide.',
            'member_id.exists' => 'Membre introuvable, inactif ou archivé.',
        ];
    }
}
