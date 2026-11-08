<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreCoachRequest;
use App\Http\Requests\admin\UpdateCoachRequest;
use App\Http\Resources\CoachResource;
use App\Models\User;
use App\Services\Admin\CoachService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    public function index(Request $request, CoachService $service): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,pending,inactive'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $coaches = $service->list($filters)->through(
            fn (User $coach) => (new CoachResource($coach))->resolve()
        );

        return response()->json([
            'coaches' => $coaches,
            'stats' => $service->stats(),
        ]);
    }

    public function show(User $coach, CoachService $service): JsonResponse
    {
        $coach = $service->show($coach);

        return response()->json([
            'coach' => array_merge((new CoachResource($coach))->resolve(),
                [
                    'coach_availabilities' => $coach->coachAvailabilities,
                    'coached_courses_count' => $coach->coached_courses_count,
                    'coached_sessions_count' => $coach->coached_sessions_count,
                    'received_requests_count' => $coach->received_personal_training_requests_count,
                ]
            ),
        ]);
    }

    public function store( StoreCoachRequest $request, CoachService $service): JsonResponse {
        $result = $service->create(
            $request->validated(),
            $request->user(),
            $request->file('photo')
        );

        return response()->json([
            'message' => $result['message'],
            'email_sent' => $result['email_sent'],
            'coach' => (new CoachResource($result['coach']))->resolve(),
        ], 201);
    }

    public function update( UpdateCoachRequest $request,User $coach, CoachService $service ): JsonResponse {
        $coach = $service->update(
            $coach,
            $request->validated(),
            $request->file('photo'),
            $request->boolean('remove_photo')
        );
        return response()->json([
            'message' => 'Coach mis à jour.',
            'coach' => (new CoachResource($coach))->resolve(),
        ]);
    }

    public function destroy(User $coach, CoachService $service): JsonResponse{
        $service->archive($coach);
        return response()->json(['message' => 'Coach archivé.']);
    }

    public function resendInvitation( Request $request, User $coach, CoachService $service): JsonResponse {
        $sent = $service->resendInvitation($coach, $request->user());
        return response()->json([
            'email_sent' => $sent,
            'message' => $sent
                ? 'Invitation envoyée.'
                : 'Envoi échoué. Vérifiez la configuration mail.',
        ], $sent ? 200 : 503);
    }
}
