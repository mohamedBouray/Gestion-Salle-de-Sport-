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
    public function __construct(private AccountInvitationService $invitations) {}

    public function list(array $filters)
    {
        $query = User::query()->where('role', User::COACH)->with('coachProfile');

        if (!empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")
                ->orWhereHas('coachProfile', fn ($p) =>
                    $p->where('specialty', 'like', "%{$term}%"))
            );
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();
    }

    public function stats(): array
    {
        $counts = User::query()->where('role', User::COACH)->toBase()->selectRaw(
            "COUNT(*) AS total, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active, COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending, COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS inactive"
        )->first();
        return [
            'total' => (int) $counts->total,
            'active' => (int) $counts->active,
            'pending' => (int) $counts->pending,
            'inactive' => (int) $counts->inactive,
        ];
    }

    // Compatibility with controllers using paginate()/find().
    public function paginate(array $filters): array
    {
        return ['coaches' => $this->list($filters), 'stats' => $this->stats()];
    }

    public function find(User $coach): User
    {
        return $this->show($coach);
    }

    public function show(User $coach): User
    {
        $this->ensureCoach($coach);
        return $coach->load(['coachProfile', 'coachAvailabilities'])
            ->loadCount(['coachedCourses', 'coachedSessions', 'receivedPersonalTrainingRequests']);
    }

    public function create(array $data, User $admin, ?UploadedFile $photo = null): array
    {
        $path = $photo?->store('coach-profiles', 'public');
        try {
            $coach = DB::transaction(function () use ($data, $admin, $path) {
                if (!empty($data['is_featured'])) {
                    // Same database lock as update(): ensure only one Featured coach.
                    User::query()->where('role', User::ADMIN)
                        ->orderBy('id')->lockForUpdate()->firstOrFail();

                    DB::table('coach_profiles')
                        ->where('is_featured', true)
                        ->update(['is_featured' => false, 'updated_at' => now()]);
                }

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

    public function update(
        User $coach,
        array $data,
        ?UploadedFile $photo = null,
        bool $removePhoto = false
    ): User {
        $this->ensureCoach($coach);
        $removePhoto = $removePhoto || (bool) ($data['remove_photo'] ?? false);
        $newPhoto = $photo?->store('coach-profiles', 'public');
        $oldPhoto = null;

        try {
            DB::transaction(function () use ($coach, $data, $newPhoto, $removePhoto, &$oldPhoto) {
                // Same lock for every coach edit: only one featured coach can be selected.
                User::query()->where('role', User::ADMIN)
                    ->orderBy('id')->lockForUpdate()->firstOrFail();

                $current = User::query()->whereKey($coach->id)
                    ->lockForUpdate()->firstOrFail();
                $this->ensureCoach($current);

                if ($current->status === 'pending' && array_key_exists('status', $data)) {
                    throw ValidationException::withMessages([
                        'status' => ["L'activation doit se faire depuis le lien reçu par e-mail."],
                    ]);
                }

                $featured = (bool) ($data['is_featured'] ?? false);

                if ($featured) {
                    DB::table('coach_profiles')
                        ->where('user_id', '!=', $current->id)
                        ->where('is_featured', true)
                        ->update(['is_featured' => false, 'updated_at' => now()]);
                }

                foreach (['name', 'phone', 'status'] as $field) {
                    if (array_key_exists($field, $data)) $current->{$field} = $data[$field];
                }
                if ($current->isDirty('status') && $current->status === 'inactive') {
                    $this->assertNoUpcomingSessions($current);
                }
                $current->save();

                if ($current->status === 'inactive') $this->revokeAccess($current);

                $oldPhoto = $current->coachProfile?->photo;
                $profile = [];
                foreach (['specialty', 'bio', 'experience_years', 'is_featured'] as $field) {
                    if (array_key_exists($field, $data)) $profile[$field] = $data[$field];
                }
                if ($newPhoto) $profile['photo'] = $newPhoto;
                elseif ($removePhoto) $profile['photo'] = null;

                if ($profile) $current->coachProfile()->updateOrCreate(
                    ['user_id' => $current->id], $profile
                );
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
            $coach = User::query()->whereKey($coach->id)->lockForUpdate()->firstOrFail();
            $this->assertNoUpcomingSessions($coach);
            AccountInvitation::where('user_id', $coach->id)
                ->whereNull('accepted_at')->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            $this->revokeAccess($coach);
            $coach->coachProfile()->update(['is_featured' => false]);
            $coach->delete();
        });
    }

    public function resendInvitation(User $coach, User $admin): bool
    {
        $this->ensureCoach($coach);
        return $this->invitations->send($coach, $admin);
    }

    private function revokeAccess(User $coach): void
    {
        $coach->forceFill(['remember_token' => null])->save();
        $coach->sessions()->delete();
    }

    private function assertNoUpcomingSessions(User $coach): void
    {
        if ($coach->coachedSessions()->where('status', 'scheduled')->where('end_at', '>', now('UTC'))->exists()) {
            throw ValidationException::withMessages([
                'status' => 'Réaffectez ou annulez les séances à venir de ce coach avant de continuer.',
            ]);
        }
    }

    private function ensureCoach(User $coach): void
    {
        abort_unless($coach->role === User::COACH, 404, 'Coach introuvable.');
    }
}
