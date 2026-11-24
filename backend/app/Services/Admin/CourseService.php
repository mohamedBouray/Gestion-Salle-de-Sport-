<?php

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\CourseSession;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class CourseService
{
    public function list(array $filters): array
    {
        $query = Course::query()->with('coach:id,name,status');
        $search = trim($filters['search'] ?? '');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('coach', fn ($coach) => $coach->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $base = Course::query();

        return [
            'courses' => $query->latest('id')->withCount('sessions')
                ->paginate($filters['per_page'] ?? 10)->withQueryString(),
            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'inactive' => (clone $base)->where('status', 'inactive')->count(),
                'pending' => (clone $base)->where('status', 'pending')->count(),
                'scheduled_sessions' => CourseSession::query()->where('status', 'scheduled')
                    ->where('start_at', '>=', now('UTC'))->whereHas('course')->count(),
            ],
        ];
    }

    public function show(Course $course): Course
    {
        return $course->load('coach:id,name,status')->loadCount('sessions')
            ->load(['sessions' => fn ($q) => $q->orderBy('start_at')->limit(5)]);
    }

    public function create(array $data, User $admin): Course
    {
        $imagePath = null;
        try {
            if (($data['image'] ?? null) instanceof UploadedFile) {
                $imagePath = $this->storeImage($data['image']);
            }
            $course = DB::transaction(function () use ($data, $admin, $imagePath) {
                $this->assertActiveCoach($data['coach_id'] ?? null);

                return Course::create([
                    'name' => trim($data['name']),
                    'description' => $data['description'] ?? null,
                    'coach_id' => $data['coach_id'] ?? null,
                    'price' => $data['price'] ?? '0.00',
                    'image' => $imagePath,
                    'status' => $data['status'] ?? 'pending',
                    'created_by_user_id' => $admin->id,
                ]);
            });
        } catch (Throwable $e) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            throw $e;
        }

        return $course->load('coach:id,name,status')->loadCount('sessions');
    }

    public function update(Course $course, array $data): Course
    {
        $newImage = null;
        try {
            if (($data['image'] ?? null) instanceof UploadedFile) {
                $newImage = $this->storeImage($data['image']);
            }

            [$updated, $oldImage] = $this->synchronizedPlanning(function () use ($course, $data, $newImage) {
                $current = Course::query()->whereKey($course->id)->lockForUpdate()->firstOrFail();
                $attributes = Arr::only($data, ['name', 'description', 'coach_id', 'price', 'status']);
                $nextStatus = $attributes['status'] ?? $current->status;

                // Une séance programmée ne doit pas rester ouverte sur un cours désactivé.
                if ($nextStatus !== $current->status && $nextStatus !== 'active') {
                    $this->assertCanSuspendOrArchive($current, 'status');
                }

                // La validation Request peut autoriser le coach actuel inactif pour un simple edit.
                // Mais pas pour activer un cours ni pour remplacer le coach sur un cours actif.
                $coachChanged = array_key_exists('coach_id', $attributes)
                    && (string) $attributes['coach_id'] !== (string) $current->coach_id;
                if ($coachChanged || ($nextStatus === 'active' && $current->status !== 'active')) {
                    $coachId = array_key_exists('coach_id', $attributes) ? $attributes['coach_id'] : $current->coach_id;
                    $this->assertActiveCoach($coachId);
                }

                if (isset($attributes['name'])) $attributes['name'] = trim($attributes['name']);
                $oldImage = $current->image;
                if ($newImage) $attributes['image'] = $newImage;
                $current->update($attributes);

                return [$current, $oldImage];
            });
        } catch (Throwable $e) {
            if ($newImage) Storage::disk('public')->delete($newImage);
            throw $e;
        }

        if ($newImage && $oldImage && $newImage !== $oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        return $updated->fresh()->load('coach:id,name,status')->loadCount('sessions');
    }

    private function storeImage(UploadedFile $image): string
    {
        $path = $image->store('courses', 'public');
        if ($path === false) {
            throw ValidationException::withMessages(['image' => "L’image n’a pas pu être enregistrée."]);
        }

        return $path;
    }

    private function assertActiveCoach(int|string|null $coachId): void
    {
        if ($coachId !== null && !User::query()->whereKey($coachId)
            ->where('role', 'coach')->where('status', 'active')->lockForUpdate()->first(['id'])) {
            throw ValidationException::withMessages(['coach_id' => 'Le coach sélectionné doit être actif.']);
        }
    }

    public function archive(Course $course): void
    {
        $this->synchronizedPlanning(function () use ($course) {
            $current = Course::query()->whereKey($course->id)->lockForUpdate()->firstOrFail();
            $this->assertCanSuspendOrArchive($current, 'course');
            $current->delete(); // SoftDelete : ne détruit pas les réservations ni les séances.
        });
    }

    private function assertCanSuspendOrArchive(Course $course, string $field): void
    {
        // Vérifier aussi les séances déjà commencées mais non terminées.
        $hasSessions = $course->sessions()->where('status', 'scheduled')
            ->where('end_at', '>', now('UTC'))->exists();
        if ($hasSessions) {
            throw ValidationException::withMessages([
                $field => "Ce cours possède des séances programmées à venir ou en cours. Traitez les réservations actives puis annulez les séances futures depuis le Planning avant de continuer.",
            ]);
        }

        // Protection supplémentaire contre un historique incohérent (séance annulée avec réservation active).
        $hasReservations = $course->sessions()->where('end_at', '>', now('UTC'))
            ->whereHas('enrollments', fn ($q) => $q->whereIn('status', ['pending', 'confirmed', 'attended']))
            ->exists();
        if ($hasReservations) {
            throw ValidationException::withMessages([
                $field => 'Ce cours possède encore des réservations actives à venir. Elles doivent être traitées avant cette action.',
            ]);
        }
    }

    // Même verrou MySQL que CourseSessionService : aucune création/modification
    // de séance ne doit se produire au milieu d'une désactivation / d'un archivage.
    private function synchronizedPlanning(callable $callback): mixed
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return DB::transaction($callback, 3);
        }

        $lockName = 'bouray_gym_planning';
        $result = DB::selectOne('SELECT GET_LOCK(?, 10) AS acquired', [$lockName]);
        if ((int) ($result->acquired ?? 0) !== 1) {
            throw ValidationException::withMessages([
                'course' => 'Le planning est en cours de modification. Veuillez réessayer.',
            ]);
        }

        try {
            return DB::transaction($callback, 3);
        } finally {
            DB::selectOne('SELECT RELEASE_LOCK(?) AS released', [$lockName]);
        }
    }
}