<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Http\Requests\CoachWorkspace\SaveAvailabilitiesRequest;
use App\Services\CoachWorkspaceService;
use Illuminate\Http\JsonResponse;

class AvailabilityManagementController extends Controller
{
    public function update(SaveAvailabilitiesRequest $request, CoachWorkspaceService $service): JsonResponse
    {
        $slots = $service->replaceAvailabilities($request->user(), $request->validated()['slots']);
        return response()->json(['message' => 'Disponibilités enregistrées.', 'availabilities' => $slots]);
    }
}
