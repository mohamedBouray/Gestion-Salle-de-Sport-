<?php

namespace App\Services\Admin;

use App\Models\AccountInvitation;
use App\Models\CourseEnrollment;
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

        $counts = User::query()->where('role', User::MEMBER)->toBase()->selectRaw(
            "COUNT(*) AS total, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active, COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending, COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS inactive"
        )->first();

        return [
            'members' => $query->latest('id')
                ->paginate($filters['per_page'] ?? 10)
                ->withQueryString(),

            'stats' => [
                'total' => (int) $counts->total,
                'active' => (int) $counts->active,
                'pending' => (int) $counts->pending,
                'inactive' => (int) $counts->inactive,
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

    public function create(array $data, User $admin): array{
        $member = DB::transaction(function () use ($data, $admin) {
            $member = new User();

            $member->name = trim($data['name']);
            $member->email = mb_strtolower(trim($data['email']));
            $member->phone = $data['phone'] ?? null;
            $member->password = Str::random(64);

            $member->role = User::MEMBER;
            $member->status = 'pending';
            $member->created_by_user_id = $admin->id;

            $member->save();

            return $member;
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
                $this->cancelFutureReservations($member);
                $this->revokeAccess($member);
            }

            return $member->fresh();
        }, 3);
    }


    public function archive(User $member): void
    {
        $this->ensureMember($member);

        DB::transaction(function () use ($member) {
            $member = User::whereKey($member->id)->lockForUpdate()->firstOrFail();
            $this->cancelFutureReservations($member);
            $this->revokeAccess($member);
            AccountInvitation::where('user_id', $member->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $member->delete();
        }, 3);
    }

    public function resendInvitation(User $member, User $admin): bool
    {
        $this->ensureMember($member);

        return $this->invitations->send($member, $admin);
    }

    // Member lock prevents new bookings while the account is being disabled.
    // Retry transactions on deadlocks with concurrent booking/cancellation.
    private function cancelFutureReservations(User $member): void
    {
        $future = CourseEnrollment::query()->where('member_id', $member->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereHas('session', fn ($query) => $query->where('start_at', '>', now('UTC')));

        // Blocking a user must not be prevented by an old payment.
        // Keep payment records intact; any refund is a separate admin action.
        $future->update(['status' => 'cancelled', 'cancelled_at' => now('UTC')]);
    }

    private function revokeAccess(User $member): void
    {
        $member->forceFill(['remember_token' => null])->save();
        $member->sessions()->delete();
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
