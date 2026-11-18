<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreCourseSessionRequest;
use App\Http\Requests\admin\UpdateCourseSessionRequest;
use App\Http\Resources\CourseSessionResource;
use App\Models\CourseSession;
use App\Services\Admin\CourseSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseSessionController extends Controller
{
    // ==========================================
    // CONSTRUCTOR
    // ==========================================

    public function __construct(
        private readonly CourseSessionService $sessions
    ) {}

    // ==========================================
    // 1. LISTE DES SEANCES
    // GET /api/admin/course-sessions
    // ==========================================

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'from' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:from',
            ],

            'status' => [
                'nullable',
                'in:scheduled,completed,cancelled',
            ],
        ]);

        $sessions = $this->sessions->list($filters);

        return response()->json([
            'sessions' => CourseSessionResource::collection(
                $sessions
            )->resolve(),
        ]);
    }

    // ==========================================
    // 2. PROGRAMMER UNE SEANCE
    // POST /api/admin/course-sessions
    // ==========================================

    public function store(
        StoreCourseSessionRequest $request
    ): JsonResponse {
        $session = $this->sessions->create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Séance programmée avec succès.',

            'session' => (
                new CourseSessionResource($session)
            )->resolve(),
        ], 201);
    }

    // ==========================================
    // 3. MODIFIER / ANNULER UNE SEANCE
    // PUT /api/admin/course-sessions/{session}
    // ==========================================

    public function update(
        UpdateCourseSessionRequest $request,
        CourseSession $session
    ): JsonResponse {
        $data = $request->validated();

        // Annulation directe depuis le Planning
        if (
            count($data) === 1 &&
            ($data['status'] ?? null) === 'cancelled'
        ) {
            $session = $this->sessions->cancel($session);

            return response()->json([
                'message' => 'Séance annulée avec succès.',

                'session' => (
                    new CourseSessionResource($session)
                )->resolve(),
            ]);
        }

        // Modification des informations
        $session = $this->sessions->update(
            $session,
            $data
        );

        return response()->json([
            'message' => 'Séance mise à jour avec succès.',

            'session' => (
                new CourseSessionResource($session)
            )->resolve(),
        ]);
    }
}
