<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payments\StorePaymentRequest;
use App\Models\Payment;
use App\Services\Admin\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $payments
    ) {}

    // GET /api/admin/payments
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable', 'string', 'max:100',
            ],

            'status' => [
                'nullable',
                Rule::in(['pending', 'paid', 'refunded']),
            ],

            'method' => [
                'nullable',
                Rule::in(['cash', 'virement', 'other']),
            ],

            'from' => [
                'nullable', 'date_format:Y-m-d',
            ],

            'to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:from',
            ],

            'page' => [
                'nullable', 'integer', 'min:1',
            ],

            'per_page' => [
                'nullable', 'integer', 'min:1', 'max:100',
            ],
        ]);

        return response()->json(
            $this->payments->index($filters)
        );
    }

    // GET /api/admin/payments/options
    public function options(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'member_search' => [
                'nullable', 'string', 'max:100',
            ],

            'member_id' => [
                'nullable', 'integer', 'min:1',
            ],
        ]);

        return response()->json(
            $this->payments->options($filters)
        );
    }

    // POST /api/admin/payments
    public function store(
        StorePaymentRequest $request
    ): JsonResponse {
        return response()->json([
            'message' => 'Paiement enregistré avec succès.',

            'payment' => $this->payments->create(
                $request->user(),
                $request->validated()
            ),
        ], 201);
    }

    // PATCH /api/admin/payments/{payment}/refund
    public function refund(
        Request $request,
        Payment $payment
    ): JsonResponse {
        return response()->json([
            'message' =>
                'Remboursement enregistré dans le suivi interne.',

            'payment' => $this->payments->refund(
                $request->user(),
                $payment
            ),
        ]);
    }
}
