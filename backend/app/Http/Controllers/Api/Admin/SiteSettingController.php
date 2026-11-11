<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\UpdateSiteSettingRequest;
use App\Services\SiteSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SiteSettingController extends Controller
{
    public function index(SiteSettingService $service): JsonResponse
    {
        return response()->json(['settings' => $service->all()]);
    }

    public function update(UpdateSiteSettingRequest $request, SiteSettingService $service): JsonResponse
    {
        return response()->json([
            'message' => 'Paramètres enregistrés.',
            'settings' => $service->update($request->validated('settings')),
        ]);
    }

    public function uploadImage(Request $request, SiteSettingService $service): JsonResponse
    {
        $data = $request->validate([
            'key' => ['required', Rule::in(config('landing.image_keys'))],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        return response()->json([
            'message' => 'Image enregistrée.',
            'settings' => $service->uploadImage($data['key'], $request->file('image')),
        ]);
    }
}