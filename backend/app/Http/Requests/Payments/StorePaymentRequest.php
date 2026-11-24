<?php

namespace App\Http\Requests\Payments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'member_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')
                    ->where('role', 'member')
                    ->where('status', 'active')
                    ->whereNull('deleted_at'),
            ],

            'subscription_id' => [
                'required', 'integer',
                Rule::exists('member_subscriptions', 'id'),
            ],

            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:99999999.99',
                'decimal:0,2',
            ],

            'method' => [
                'required',
                Rule::in(['demo']),
            ],

            'paid_at' => [
                'required',
                'date_format:Y-m-d\TH:i',
            ],

            'reference' => [
                'nullable', 'string', 'max:120',
            ],

            'notes' => [
                'nullable', 'string', 'max:2000',
            ],
        ];
    }
}
