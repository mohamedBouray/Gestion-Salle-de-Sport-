<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\SiteSettingService;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    public function index(SiteSettingService $service): JsonResponse
    {
        return response()->json(['settings' => $service->all()]);
    }
}