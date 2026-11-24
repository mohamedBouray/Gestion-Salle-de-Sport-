<?php

namespace App\Http\Controllers\Api\Members;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservations\StoreMemberReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservations
    ) {}

    // GET /api/member/reservations
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', 'in:pending,confirmed,attended,cancelled,absent,unmarked'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $result = $this->reservations->listMember($request->user(), $filters);
        $result->through(
            fn (CourseEnrollment $reservation) =>
                (new ReservationResource($reservation))->resolve()
        );

        return response()->json([
            'reservations' => $result,
        ]);
    }

    // GET /api/member/course-sessions
    public function sessions(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'course_id' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'string', 'max:100'],
            'period' => ['nullable', 'in:all,today,week'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json([
            'sessions' => $this->reservations->upcomingSessions(
                $request->user(),
                $filters
            ),
        ]);
    }

    // POST /api/member/course-sessions/{session}/reservations
    public function store(
        StoreMemberReservationRequest $request,
        CourseSession $session
    ): JsonResponse {
        // Member vient obligatoirement de Sanctum, jamais du body.
        $reservation = $this->reservations->book($session, $request->user());

        return response()->json([
            'message' => 'Votre réservation est confirmée.',
            'reservation' => (new ReservationResource($reservation))->resolve(),
        ], 201);
    }

    // DELETE /api/member/reservations/{reservation}
    public function destroy(Request $request, CourseEnrollment $reservation): JsonResponse
    {
        // 404 plutôt que divulguer la réservation d'un autre membre.
        abort_unless(
            (int) $reservation->member_id === (int) $request->user()->id,
            404
        );

        $cancelled = $this->reservations->cancelForMember(
            $reservation,
            $request->user()
        );

        return response()->json([
            'message' => 'Votre réservation a été annulée.',
            'reservation' => (new ReservationResource($cancelled))->resolve(),
        ]);
    }
}