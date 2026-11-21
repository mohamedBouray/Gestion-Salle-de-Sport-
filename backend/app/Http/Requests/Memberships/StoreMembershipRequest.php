<?php

namespace App\Http\Requests\Memberships;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMembershipRequest extends FormRequest
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
                Rule::exists('users', 'id')
                    ->where('role', 'member')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],

            'plan_id' => [
                'required',
                'integer',
                Rule::exists('subscription_plans', 'id')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],

            'starts_at' => [
                'required',
                'date_format:Y-m-d',
            ],
        ];
    }
}
