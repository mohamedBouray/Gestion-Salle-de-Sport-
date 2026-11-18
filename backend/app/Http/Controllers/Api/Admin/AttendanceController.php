<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceCheckInRequest;
use App\Http\Requests\Attendance\StoreCoachAbsenceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceCheckOutRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\GymAttendance;
use App\Services\Admin\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly AttendanceService $attendance
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return response()->json([
            'summary' => $this->attendance->summary($filters['date'] ?? null),
        ]);
    }

    public function members(Request $request): JsonResponse
    {
        return $this->listFor('members', $request);
    }

    public function coaches(Request $request): JsonResponse
    {
        return $this->listFor('coaches', $request);
    }

    private function listFor(string $group, Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:all,present,left,absent'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $result = $this->attendance->list($group, $filters);
        $result->through(fn (GymAttendance $row) =>
            (new AttendanceResource($row))->resolve()
        );

        return response()->json(['records' => $result]);
    }

    public function memberCheckIn(StoreAttendanceCheckInRequest $request): JsonResponse
    {
        return $this->checkIn('members', $request);
    }

    public function coachCheckIn(StoreAttendanceCheckInRequest $request): JsonResponse
    {
        return $this->checkIn('coaches', $request);
    }

    private function checkIn(string $group, StoreAttendanceCheckInRequest $request): JsonResponse
    {
        $row = $this->attendance->checkIn($group, $request->validated(), $request->user());

        return response()->json([
            'message' => 'Entrée enregistrée avec succès.',
            'attendance' => (new AttendanceResource($row))->resolve(),
        ], 201);
    }

    public function memberCheckOut(
        UpdateAttendanceCheckOutRequest $request,
        GymAttendance $attendance
    ): JsonResponse {
        return $this->checkOut('members', $request, $attendance);
    }

    public function coachCheckOut(
        UpdateAttendanceCheckOutRequest $request,
        GymAttendance $attendance
    ): JsonResponse {
        return $this->checkOut('coaches', $request, $attendance);
    }

    private function checkOut(
        string $group,
        UpdateAttendanceCheckOutRequest $request,
        GymAttendance $attendance
    ): JsonResponse {
        $row = $this->attendance->checkOut(
            $group,
            $attendance,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'message' => 'Sortie enregistrée avec succès.',
            'attendance' => (new AttendanceResource($row))->resolve(),
        ]);
    }

    public function coachAbsence(StoreCoachAbsenceRequest $request): JsonResponse
    {
        $row = $this->attendance->markCoachAbsent(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'message' => 'Absence du coach enregistrée.',
            'attendance' => (new AttendanceResource($row))->resolve(),
        ], 201);
    }
}
