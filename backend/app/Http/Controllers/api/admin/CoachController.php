<?php

namespace App\Http\Controllers\api\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\admin\StoreCoachRequest;
use App\Http\Requests\admin\UpdateCoachRequest;
use App\Models\AccountInvitation;
use App\Models\User;
use App\Services\AccountInvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CoachController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,pending,inactive'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = User::query()->where('role', User::COACH)->with('coachProfile');

        if (!empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%")
                    ->orWhereHas('coachProfile', fn ($profile) =>
                        $profile->where('specialty', 'like', "%{$term}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $coaches = $query->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (User $coach) => $this->coachData($coach));

        $base = User::query()->where('role', User::COACH);

        return response()->json([
            'coaches' => $coaches,
            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'pending' => (clone $base)->where('status', 'pending')->count(),
                'inactive' => (clone $base)->where('status', 'inactive')->count(),
            ],
        ]);
    }

    public function show(User $coach): JsonResponse
    {
        $this->ensureCoach($coach);
        $coach->load('coachProfile', 'coachAvailabilities')
            ->loadCount(['coachedCourses', 'coachedSessions', 'receivedPersonalTrainingRequests']);

        return response()->json([
            'coach' => array_merge($this->coachData($coach), [
                'coach_availabilities' => $coach->coachAvailabilities,
                'coached_courses_count' => $coach->coached_courses_count,
                'coached_sessions_count' => $coach->coached_sessions_count,
                'received_requests_count' => $coach->received_personal_training_requests_count,
            ]),
        ]);
    }

    public function store(
        StoreCoachRequest $request,
        AccountInvitationService $invitations
    ): JsonResponse {
        $data = $request->validated();
        $photo = $request->file('photo')?->store('coach-profiles', 'public');

        try {
            $coach = DB::transaction(function () use ($data, $photo, $request) {
                $coach = new User();
                $coach->name = $data['name'];
                $coach->email = mb_strtolower(trim($data['email']));
                $coach->phone = $data['phone'] ?? null;
                $coach->password = Str::random(64); // Unusable random password until activation.
                $coach->role = User::COACH;
                $coach->status = 'pending';
                $coach->created_by_user_id = $request->user()->id;
                $coach->save();

                $coach->coachProfile()->create([
                    'specialty' => $data['specialty'],
                    'bio' => $data['bio'] ?? null,
                    'photo' => $photo,
                    'experience_years' => $data['experience_years'],
                    'is_featured' => (bool) ($data['is_featured'] ?? false),
                ]);

                return $coach;
            });
        } catch (\Throwable $e) {
            if ($photo) Storage::disk('public')->delete($photo);
            throw $e;
        }

        $emailSent = $invitations->send($coach, $request->user());

        return response()->json([
            'message' => $emailSent
                ? "Coach créé. E-mail d'activation envoyé."
                : "Coach créé, mais l'e-mail n'a pas pu être envoyé. Renvoyez l'invitation.",
            'email_sent' => $emailSent,
            'coach' => $this->coachData($coach->load('coachProfile')),
        ], 201);
    }

    public function update(UpdateCoachRequest $request, User $coach): JsonResponse
    {
        $this->ensureCoach($coach);
        $data = $request->validated();

        if ($coach->status === 'pending' && array_key_exists('status', $data)) {
            throw ValidationException::withMessages([
                'status' => ["L'activation doit se faire depuis le lien reçu par e-mail."],
            ]);
        }

        $oldPhoto = $coach->coachProfile?->photo;
        $newPhoto = $request->file('photo')?->store('coach-profiles', 'public');
        $shouldRemovePhoto = $request->boolean('remove_photo');

        try {
            DB::transaction(function () use ($coach, $data, $newPhoto, $shouldRemovePhoto) {
                foreach (['name', 'phone', 'status'] as $field) {
                    if (array_key_exists($field, $data)) $coach->{$field} = $data[$field];
                }
                $coach->save();

                $profileData = [];
                foreach (['specialty', 'bio', 'experience_years', 'is_featured'] as $field) {
                    if (array_key_exists($field, $data)) $profileData[$field] = $data[$field];
                }
                if ($newPhoto) $profileData['photo'] = $newPhoto;
                elseif ($shouldRemovePhoto) $profileData['photo'] = null;

                if ($profileData) {
                    $coach->coachProfile()->updateOrCreate(['user_id' => $coach->id], $profileData);
                }
            });
        } catch (\Throwable $e) {
            if ($newPhoto) Storage::disk('public')->delete($newPhoto);
            throw $e;
        }

        if ($oldPhoto && ($newPhoto || $shouldRemovePhoto)) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return response()->json([
            'message' => 'Coach mis à jour.',
            'coach' => $this->coachData($coach->fresh()->load('coachProfile')),
        ]);
    }

    public function destroy(User $coach): JsonResponse
    {
        $this->ensureCoach($coach);

        DB::transaction(function () use ($coach) {
            AccountInvitation::where('user_id', $coach->id)
                ->whereNull('accepted_at')->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);
            $coach->delete(); // Soft delete; preserve history.
        });

        return response()->json(['message' => 'Coach archivé.']);
    }

    public function resendInvitation(
        Request $request, User $coach, AccountInvitationService $invitations
    ): JsonResponse {
        $this->ensureCoach($coach);
        $sent = $invitations->send($coach, $request->user());

        return response()->json([
            'email_sent' => $sent,
            'message' => $sent ? 'Invitation envoyée.' : "Envoi échoué. Vérifiez la configuration mail.",
        ], $sent ? 200 : 503);
    }

    private function ensureCoach(User $user): void
    {
        abort_unless($user->role === User::COACH, 404, 'Coach introuvable.');
    }

    private function coachData(User $coach): array
    {
        $profile = $coach->coachProfile;

        return [
            'id' => $coach->id,
            'name' => $coach->name,
            'email' => $coach->email,
            'phone' => $coach->phone,
            'role' => $coach->role,
            'status' => $coach->status,
            'created_at' => $coach->created_at,
            'profile' => [
                'specialty' => $profile?->specialty,
                'bio' => $profile?->bio,
                'experience_years' => $profile?->experience_years,
                'is_featured' => (bool) ($profile?->is_featured ?? false),
                'photo_url' => $profile?->photo ? url(Storage::disk('public')->url($profile->photo)) : null,
            ],
        ];
    }
}
