<?php

namespace App\Http\Controllers\api\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreMemberRequest;
use App\Http\Requests\admin\UpdateMemberRequest;
use App\Models\AccountInvitation;
use App\Models\User;
use App\Services\AccountInvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,pending,inactive'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = User::where('role', User::MEMBER);
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        if (!empty($filters['status'])) $query->where('status', $filters['status']);

        $members = $query->latest('id')->paginate($filters['per_page'] ?? 10)->withQueryString();
        $base = User::where('role', User::MEMBER);

        return response()->json([
            'members' => $members,
            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'pending' => (clone $base)->where('status', 'pending')->count(),
                'inactive' => (clone $base)->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function show(User $member): JsonResponse
    {
        $this->ensureMember($member);
        $member->load(['memberSubscriptions.plan', 'courseEnrollments.session.course', 'payments']);
        return response()->json(['member' => $member]);
    }

    public function store(
        StoreMemberRequest $request, AccountInvitationService $invitations
    ): JsonResponse {
        $data = $request->validated();

        $member = new User();
        $member->name = $data['name'];
        $member->email = mb_strtolower(trim($data['email']));
        $member->phone = $data['phone'] ?? null;
        $member->password = Str::random(64); // Unusable until the e-mail activation.
        $member->role = User::MEMBER;
        $member->status = 'pending';
        $member->created_by_user_id = $request->user()->id;
        $member->save();

        $sent = $invitations->send($member, $request->user());

        return response()->json([
            'message' => $sent
                ? "Membre créé. E-mail d'activation envoyé."
                : "Membre créé, mais l'e-mail n'a pas pu être envoyé. Renvoyez l'invitation.",
            'email_sent' => $sent,
            'member' => $member,
        ], 201);
    }

    public function update(UpdateMemberRequest $request, User $member): JsonResponse
    {
        $this->ensureMember($member);
        $data = $request->validated();

        if ($member->status === 'pending' && array_key_exists('status', $data)) {
            throw ValidationException::withMessages([
                'status' => ["L'activation doit se faire depuis le lien reçu par e-mail."],
            ]);
        }

        foreach (['name', 'phone', 'status'] as $field) {
            if (array_key_exists($field, $data)) $member->{$field} = $data[$field];
        }
        $member->save();

        return response()->json(['message' => 'Membre modifié.', 'member' => $member->fresh()]);
    }

    public function destroy(User $member): JsonResponse
    {
        $this->ensureMember($member);
        DB::transaction(function () use ($member) {
            AccountInvitation::where('user_id', $member->id)
                ->whereNull('accepted_at')->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            $member->delete();
        });
        return response()->json(['message' => 'Membre archivé.']);
    }

    public function resendInvitation(
        Request $request, User $member, AccountInvitationService $invitations
    ): JsonResponse {
        $this->ensureMember($member);
        $sent = $invitations->send($member, $request->user());
        return response()->json([
            'email_sent' => $sent,
            'message' => $sent ? 'Invitation envoyée.' : "Envoi échoué. Vérifiez la configuration mail.",
        ], $sent ? 200 : 503);
    }

    private function ensureMember(User $user): void
    {
        abort_unless($user->role === User::MEMBER, 404, 'Membre introuvable.');
    }
}
