<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Coach\CoachMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachMemberController extends Controller
{
    public function __construct(
        private readonly CoachMemberService $members
    ) {}

    // GET /api/coach/members
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'course_id' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', Rule::in(['active', 'pending', 'inactive'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        return response()->json(
            $this->members->index($request->user(), $filters)
        );
    }

    // GET /api/coach/members/{member}
    public function show(Request $request, User $member): JsonResponse
    {
        return response()->json(
            $this->members->show($request->user(), $member)
        );
    }
}
