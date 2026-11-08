<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreMemberRequest;
use App\Http\Requests\admin\UpdateMemberRequest;
use App\Models\User;
use App\Services\Admin\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request, MemberService $service): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,pending,inactive'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json($service->list($filters));
    }

    public function show(User $member, MemberService $service): JsonResponse
    {
        return response()->json([
            'member' => $service->show($member),
        ]);
    }

    public function store( StoreMemberRequest $request, MemberService $service ): JsonResponse {
        return response()->json(
            $service->create($request->validated(), $request->user()),
            201
        );
    }

    public function update( UpdateMemberRequest $request, User $member, MemberService $service): JsonResponse {
        return response()->json([
            'message' => 'Membre modifié.',
            'member' => $service->update($member, $request->validated()),
        ]);
    }

    public function destroy(User $member, MemberService $service): JsonResponse{
        $service->archive($member);
        return response()->json(['message' => 'Membre archivé.']);
    }

    public function resendInvitation( Request $request, User $member, MemberService $service): JsonResponse {
        $sent = $service->resendInvitation($member, $request->user());

        return response()->json([
            'email_sent' => $sent,
            'message' => $sent? 'Invitation envoyée.': 'Envoi échoué. Vérifiez la configuration mail.',
        ], $sent ? 200 : 503);
    }
}
