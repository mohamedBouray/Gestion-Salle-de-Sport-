<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Services\Coach\CoachAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CoachAttendanceController extends Controller
{
    public function __construct(
        private readonly CoachAttendanceService $attendance
    ) {}

    // GET /api/coach/attendance/sessions/{session}/participants
    public function participants(
        Request $request,
        CourseSession $session
    ): JsonResponse {
        return response()->json(
            $this->attendance->participants(
                $request->user(),
                $session
            )
        );
    }

    // PATCH /api/coach/attendance/sessions/{session}/enrollments/{enrollment}
    public function mark(
        Request $request,
        CourseSession $session,
        CourseEnrollment $enrollment
    ): JsonResponse {
        $data = $request->validate([
            'status' => [
                'required',
                Rule::in(['present', 'absent']),
            ],
        ]);

        return response()->json(
            $this->attendance->mark(
                $request->user(),
                $session,
                $enrollment,
                $data['status']
            )
        );
    }
}
