<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Memberships\StoreMembershipRequest;
use App\Models\MemberSubscription;
use App\Services\Admin\MembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MembershipController extends Controller
{
    public function __construct(
        private readonly MembershipService $memberships
    ) {}

    // GET /api/admin/memberships
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'active',
                    'expired',
                    'cancelled',
                ]),
            ],
            'plan_id' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json(
            $this->memberships->index($filters)
        );
    }

    // GET /api/admin/memberships/options
    public function options(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'member_search' => ['nullable', 'string', 'max:100'],
        ]);

        return response()->json(
            $this->memberships->options(
                $filters['member_search'] ?? ''
            )
        );
    }

    // POST /api/admin/memberships
    public function store(
        StoreMembershipRequest $request
    ): JsonResponse {
        return response()->json([
            'message' => 'Abonnement créé en attente.',
            'membership' => $this->memberships->create(
                $request->validated()
            ),
        ], 201);
    }

    // PATCH /api/admin/memberships/{membership}/activate
    public function activate(
        MemberSubscription $membership
    ): JsonResponse {
        return response()->json([
            'message' => 'Abonnement activé.',
            'membership' => $this->memberships->activate(
                $membership
            ),
        ]);
    }

    // POST /api/admin/memberships/{membership}/renew
    public function renew(
        MemberSubscription $membership
    ): JsonResponse {
        return response()->json([
            'message' => 'Renouvellement créé en attente.',
            'membership' => $this->memberships->renew(
                $membership
            ),
        ], 201);
    }

    // PATCH /api/admin/memberships/{membership}/cancel
    public function cancel(
        MemberSubscription $membership
    ): JsonResponse {
        return response()->json([
            'message' =>
                'Abonnement annulé. Les demandes Cash ouvertes ont été clôturées.',

            'membership' => $this->memberships->cancel(
                $membership
            ),
        ]);
    }
}
