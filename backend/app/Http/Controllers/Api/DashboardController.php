<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard) {}

    public function admin(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        return response()->json($this->dashboard->admin($this->period($request)));
    }

    public function coach(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isCoach(), 403);
        return response()->json($this->dashboard->coach(
            $request->user(), $this->period($request)
        ));
    }

    public function member(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isMember(), 403);
        return response()->json($this->dashboard->member(
            $request->user(), $this->period($request)
        ));
    }

    private function period(Request $request): string
    {
        $data = $request->validate([
            'period' => ['nullable', Rule::in(['7d', '30d', '90d', '12m'])],
        ]);

        return $data['period'] ?? '30d';
    }
}