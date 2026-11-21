<?php

namespace App\Http\Controllers\Api\Members;

use App\Http\Controllers\Controller;
use App\Services\Members\MemberPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberPaymentController extends Controller
{
    public function __construct(
        private readonly MemberPaymentService $payments
    ) {}

    // GET /api/member/payments
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'paid',
                    'refunded',
                ]),
            ],

            'method' => [
                'nullable',
                Rule::in([
                    'cash',
                    'virement',
                    'other',
                ]),
            ],

            'from' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:from',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        return response()->json(
            $this->payments->index(
                $request->user(),
                $filters
            )
        );
    }
}
