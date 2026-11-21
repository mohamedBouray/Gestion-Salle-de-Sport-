<?php

namespace App\Http\Controllers\Api\Members;

use App\Http\Controllers\Controller;
use App\Services\Members\MemberAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberAccountController extends Controller
{
    public function __construct(
        private readonly MemberAccountService $account
    ) {}

    // GET /api/member/membership
    public function memberships(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in([
                'pending', 'active', 'expired', 'cancelled',
            ])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json(
            $this->account->memberships($request->user(), $filters)
        );
    }

    // GET /api/member/attendance
    public function attendance(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['present', 'left'])],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => [
                'nullable',
                'date_format:Y-m-d',
                Rule::when(
                    $request->filled('from'),
                    ['after_or_equal:from']
                ),
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json(
            $this->account->attendance($request->user(), $filters)
        );
    }
}
