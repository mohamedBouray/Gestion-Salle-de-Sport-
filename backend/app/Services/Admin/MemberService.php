<?php

namespace App\Services\Admin;

use App\Models\AccountInvitation;
use App\Models\User;
use App\Services\AccountInvitationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberService
{
    public function __construct(
        private AccountInvitationService $invitations
    ) {}

    public function list(array $filters): array
    {
        $query = User::query()->where('role', User::MEMBER);

        if (!empty($filters['search'])) {
            $term = $filters['search'];

            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $base = User::query()->where('role', User::MEMBER);

        return [
            'members' => $query->latest('id')
                ->paginate($filters['per_page'] ?? 10)
                ->withQueryString(),

            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'pending' => (clone $base)->where('status', 'pending')->count(),
                'inactive' => (clone $base)->where('status', 'inactive')->count(),
            ],
        ];
    }

    public function show(User $member): User
    {
        $this->ensureMember($member);

        return $member->load([
            'memberSubscriptions.plan',
            'courseEnrollments.session.course',
            'payments',
        ]);
    }

    public function create(array $data, User $admin): array
    {
        $member = DB::transaction(function () use ($data, $admin) {
            return User::create([
                'name' => $data['name'],
                'email' => mb_strtolower(trim($data['email'])),
                'phone' => $data['phone'] ?? null,
                'password' => Str::random(64),
                'role' => User::MEMBER,
                'status' => 'pending',
                'created_by_user_id' => $admin->id,
            ]);
        });

        $sent = $this->invitations->send($member, $admin);

        return [
            'message' => $sent
                ? "Membre créé. E-mail d'activation envoyé."
                : "Membre créé, mais l'e-mail n'a pas pu être envoyé.",
            'email_sent' => $sent,
            'member' => $member,
        ];
    }

   
    public function update(User $member, array $data): User
    {
        $this->ensureMember($member);

        return DB::transaction(function () use ($member, $data) {
            $member = User::whereKey($member->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($member->status === 'pending' && array_key_exists('status', $data)) {
                throw ValidationException::withMessages([
                    'status' => ["Le compte doit d'abord être activé par invitation."],
                ]);
            }

            foreach (['name', 'phone', 'status'] as $field) {
                if (array_key_exists($field, $data)) {
                    $member->{$field} = $data[$field];
                }
            }

            $member->save();

            if ($member->status === 'inactive') {
                $member->sessions()->delete();
            }

            return $member->fresh();
        });
    }


    public function archive(User $member): void
    {
        $this->ensureMember($member);

        DB::transaction(function () use ($member) {
            AccountInvitation::where('user_id', $member->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $member->delete();
        });
    }

    public function resendInvitation(User $member, User $admin): bool
    {
        $this->ensureMember($member);

        return $this->invitations->send($member, $admin);
    }

    private function ensureMember(User $member): void
    {
        abort_unless(
            $member->role === User::MEMBER,
            404,
            'Membre introuvable.'
        );
    }
}
