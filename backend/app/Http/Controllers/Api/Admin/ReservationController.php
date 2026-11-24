<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservations\StoreAdminReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\User;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservations
    ) {}

    // GET /api/admin/reservations
    public function index(Request $request): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $result = $this->reservations->listAdmin($filters);
        $result['reservations']->through(
            fn (CourseEnrollment $reservation) =>
                (new ReservationResource($reservation))->resolve()
        );

        return response()->json($result);
    }

    // GET /api/admin/reservations/{reservation}
    public function show(CourseEnrollment $reservation): JsonResponse
    {
        return response()->json([
            'reservation' => (new ReservationResource(
                $this->reservations->show($reservation)
            ))->resolve(),
        ]);
    }

    // GET /api/admin/course-sessions/{session}/reservations
    public function bySession(Request $request, CourseSession $session): JsonResponse
    {
        $filters = $this->validateFilters($request);
        $filters['session_id'] = $session->id;

        $result = $this->reservations->listAdmin($filters);
        $result['reservations']->through(
            fn (CourseEnrollment $reservation) =>
                (new ReservationResource($reservation))->resolve()
        );

        return response()->json($result);
    }

    // POST /api/admin/course-sessions/{session}/reservations
    public function store(
        StoreAdminReservationRequest $request,
        CourseSession $session
    ): JsonResponse {
        $member = User::query()
            ->whereKey((int) $request->validated('member_id'))
            ->where('role', 'member')
            ->where('status', 'active')
            ->firstOrFail();

        $reservation = $this->reservations->book($session, $member);

        return response()->json([
            'message' => 'Réservation confirmée pour le membre.',
            'reservation' => (new ReservationResource($reservation))->resolve(),
        ], 201);
    }

    // PATCH /api/admin/reservations/{reservation}/cancel
    // Seul le rôle Admin atteint ce contrôleur (routes protégées).
    public function cancel(Request $request, CourseEnrollment $reservation): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $cancelled = $this->reservations->cancelForAdmin($reservation);

        return response()->json([
            'message' => 'Réservation annulée. L’historique a été conservé.',
            'reservation' => (new ReservationResource($cancelled))->resolve(),
        ]);
    }

    private function validateFilters(Request $request): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:pending,confirmed,attended,cancelled,absent,unmarked'],
            'course_id' => ['nullable', 'integer', 'min:1'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
    }
}