<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CoachWorkspace\ReviewCourseProposalRequest;
use App\Models\CourseProposal;
use App\Services\CoachWorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseProposalReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate(['status' => ['nullable', 'in:pending,approved,rejected']]);
        $query = CourseProposal::query()->with(['coach:id,name,email', 'approvedCourse:id,name'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest();
        if (!empty($filters['status'])) $query->where('status', $filters['status']);
        return response()->json(['proposals' => $query->paginate(20)]);
    }

    public function approve(ReviewCourseProposalRequest $request, CourseProposal $proposal, CoachWorkspaceService $service): JsonResponse
    {
        $result = $service->approve($proposal, $request->user(), $request->validated());
        return response()->json(['message' => 'Cours approuvé et créé.', 'proposal' => $result]);
    }

    public function reject(ReviewCourseProposalRequest $request, CourseProposal $proposal, CoachWorkspaceService $service): JsonResponse
    {
        $result = $service->reject($proposal, $request->user(), $request->validated()['note'] ?? null);
        return response()->json(['message' => 'Proposition refusée.', 'proposal' => $result]);
    }
}
