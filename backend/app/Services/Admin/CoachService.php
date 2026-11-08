<?php

namespace App\Services\Admin;

use App\Models\AccountInvitation;
use App\Models\User;

use App\Services\AccountInvitationService;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class CoachService
{
    public function __construct(
        private AccountInvitationService $invitations
    ) {}

    public function list(array $filters){
        $query = User::query()
            ->where('role', User::COACH)
            ->with('coachProfile');

        if (!empty($filters['search'])) {
            $term = $filters['search'];

            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhereHas('coachProfile', fn ($p) =>
                        $p->where('specialty', 'like', "%{$term}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function stats(): array{
        $base = User::query()->where('role', User::COACH);

        return [
            'total' => (clone $base)->count(),
            'active' => (clone $base)->where('status', 'active')->count(),
            'pending' => (clone $base)->where('status', 'pending')->count(),
            'inactive' => (clone $base)->where('status', 'inactive')->count(),
        ];
    }

    public function show(User $coach): User{
        $this->ensureCoach($coach);

        return $coach->load(['coachProfile', 'coachAvailabilities'])
            ->loadCount([
                'coachedCourses',
                'coachedSessions',
                'receivedPersonalTrainingRequests',
            ]);
    }

    public function create( array $data, User $admin, ?UploadedFile $photo = null): array {
        $path = $photo?->store('coach-profiles', 'public');

        try {
            $coach = DB::transaction(function () use ($data, $admin, $path) {
                $coach = new User();
                $coach->name = $data['name'];
                $coach->email = mb_strtolower(trim($data['email']));
                $coach->phone = $data['phone'] ?? null;
                $coach->password = Str::random(64);
                $coach->role = User::COACH;
                $coach->status = 'pending';
                $coach->created_by_user_id = $admin->id;
                $coach->save();

                $coach->coachProfile()->create([
                    'specialty' => $data['specialty'],
                    'bio' => $data['bio'] ?? null,
                    'photo' => $path,
                    'experience_years' => $data['experience_years'],
                    'is_featured' => (bool) ($data['is_featured'] ?? false),
                ]);

                return $coach;
            });
        } catch (Throwable $e) {
            if ($path) Storage::disk('public')->delete($path);
            throw $e;
        }

        $sent = $this->invitations->send($coach, $admin);

        return [
            'coach' => $coach->load('coachProfile'),
            'email_sent' => $sent,
            'message' => $sent
                ? "Coach créé. E-mail d'activation envoyé."
                : "Coach créé, mais l'e-mail n'a pas pu être envoyé. Renvoyez l'invitation.",
        ];
    }

    public function update( User $coach,array $data, ?UploadedFile $photo = null, bool $removePhoto = false): User {
        $this->ensureCoach($coach);

        if ($coach->status === 'pending' && array_key_exists('status', $data)) {
            throw ValidationException::withMessages([
                'status' => ["L'activation doit se faire depuis le lien reçu par e-mail."],
            ]);
        }

        $oldPhoto = $coach->coachProfile?->photo;
        $newPhoto = $photo?->store('coach-profiles', 'public');

        try {
            DB::transaction(function () use ($coach, $data, $newPhoto, $removePhoto) {
                foreach (['name', 'phone', 'status'] as $field) {
                    if (array_key_exists($field, $data)) {
                        $coach->{$field} = $data[$field];
                    }
                }

                $coach->save();
                if ($coach->status === 'inactive') {
                    $coach->sessions()->delete();
                }

                $profile = [];

                foreach (['specialty', 'bio', 'experience_years', 'is_featured'] as $field) {
                    if (array_key_exists($field, $data)) {
                        $profile[$field] = $data[$field];
                    }
                }

                if ($newPhoto) {
                    $profile['photo'] = $newPhoto;
                } elseif ($removePhoto) {
                    $profile['photo'] = null;
                }

                if ($profile) {
                    $coach->coachProfile()->updateOrCreate(
                        ['user_id' => $coach->id],
                        $profile
                    );
                }
            });
        } catch (Throwable $e) {
            if ($newPhoto) Storage::disk('public')->delete($newPhoto);
            throw $e;
        }

        if ($oldPhoto && ($newPhoto || $removePhoto)) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return $coach->fresh()->load('coachProfile');
    }

    public function archive(User $coach): void
    {
        $this->ensureCoach($coach);

        DB::transaction(function () use ($coach) {
            AccountInvitation::where('user_id', $coach->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $coach->delete();
        });
    }

    public function resendInvitation(User $coach, User $admin): bool
    {
        $this->ensureCoach($coach);

        return $this->invitations->send($coach, $admin);
    }

    private function ensureCoach(User $coach): void
    {
        abort_unless(
            $coach->role === User::COACH,
            404,
            'Coach introuvable.'
        );
    }
}
