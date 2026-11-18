<?php

namespace App\Http\Requests\admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        $currentCoachId = $this->route('course')?->coach_id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:160',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            'coach_id' => [
                'sometimes',
                'nullable',
                'integer',

                Rule::exists('users', 'id')->where(
                    function ($query) use ($currentCoachId) {
                        $query
                            ->where('role', 'coach')
                            ->whereNull('deleted_at')
                            ->where(function ($q) use ($currentCoachId) {
                                $q->where('status', 'active');

                                if ($currentCoachId !== null) {
                                    $q->orWhere('id', $currentCoachId);
                                }
                            });
                    }
                ),
            ],

            'price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                'decimal:0,2',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'pending',
                    'active',
                    'inactive',
                ]),
            ],

            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }
}
