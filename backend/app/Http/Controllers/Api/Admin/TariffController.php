<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tariffs\ChangeTariffStatusRequest;
use App\Http\Requests\Tariffs\SaveTariffRequest;
use App\Models\SubscriptionPlan;
use App\Services\Admin\TariffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TariffController extends Controller
{
    public function __construct(
        private readonly TariffService $tariffs
    ) {}

    // GET /api/admin/tariffs
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable', 'string', 'max:100',
            ],
            'type' => [
                'nullable',
                Rule::in(['general', 'course']),
            ],
            'status' => [
                'nullable',
                Rule::in(['active', 'inactive']),
            ],
            'page' => [
                'nullable', 'integer', 'min:1',
            ],
            'per_page' => [
                'nullable', 'integer', 'min:1', 'max:100',
            ],
        ]);

        return response()->json(
            $this->tariffs->list($filters)
        );
    }

    // POST /api/admin/tariffs
    public function store(
        SaveTariffRequest $request
    ): JsonResponse {
        $plan = $this->tariffs->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Tarif créé avec succès.',
            'plan' => $plan,
        ], 201);
    }

    // PUT /api/admin/tariffs/{tariff}
    public function update(
        SaveTariffRequest $request,
        SubscriptionPlan $tariff
    ): JsonResponse {
        $plan = $this->tariffs->update(
            $tariff,
            $request->validated()
        );

        return response()->json([
            'message' => 'Tarif modifié avec succès.',
            'plan' => $plan,
        ]);
    }

    // PATCH /api/admin/tariffs/{tariff}/status
    public function changeStatus(
        ChangeTariffStatusRequest $request,
        SubscriptionPlan $tariff
    ): JsonResponse {
        $plan = $this->tariffs->changeStatus(
            $tariff,
            $request->validated('status')
        );

        return response()->json([
            'message' => $plan['status'] === 'active'
                ? 'Tarif activé avec succès.'
                : 'Tarif désactivé avec succès.',

            'plan' => $plan,
        ]);
    }
}
