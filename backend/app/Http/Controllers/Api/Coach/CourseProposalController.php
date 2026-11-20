<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\CoachWorkspace\StoreCourseProposalRequest;
use App\Models\CourseProposal;
use App\Services\CoachWorkspaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseProposalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = CourseProposal::query()->where('coach_id', $request->user()->id)
            ->with('approvedCourse:id,name')
            ->latest()->limit(100)->get();
        return response()->json(['proposals' => $items]);
    }

    public function store(StoreCourseProposalRequest $request, CoachWorkspaceService $service): JsonResponse
    {
        $proposal = $service->propose($request->user(), $request->validated());
        return response()->json(['message' => 'Proposition envoyée à l’administrateur.', 'proposal' => $proposal], 201);
    }
}
