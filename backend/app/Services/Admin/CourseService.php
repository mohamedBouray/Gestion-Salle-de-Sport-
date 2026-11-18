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
    // =====================================
    // LISTE + FILTRES + STATISTIQUES
    // =====================================

    public function list(array $filters): array
    {
        $query = Course::query()->with('coach:id,name,status');
        $search = trim($filters['search'] ?? '');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('coach', fn ($coach) =>
                        $coach->where('name', 'like', "%{$search}%")
                    );
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $base = Course::query();

        return [
            'courses' => $query->latest('id')
                ->withCount('sessions')
                ->paginate($filters['per_page'] ?? 10)
                ->withQueryString(),

            'stats' => [
                'total' => (clone $base)->count(),
                'active' => (clone $base)->where('status', 'active')->count(),
                'inactive' => (clone $base)->where('status', 'inactive')->count(),
                'pending' => (clone $base)->where('status', 'pending')->count(),

                'scheduled_sessions' => CourseSession::query()
                    ->where('status', 'scheduled')
                    ->where('start_at', '>=', now())
                    ->whereHas('course')
                    ->count(),
            ],
        ];
    }

    // =====================================
    // DETAILS DU COURS
    // =====================================

    public function show(Course $course): Course
    {
        return $course
            ->load('coach:id,name,status')
            ->loadCount('sessions')
            ->load([
                'sessions' => fn ($query) =>
                    $query->orderBy('start_at')->limit(5),
            ]);
    }

    // =====================================
    // CREATION DU COURS
    // =====================================

    public function create(array $data, User $admin): Course
    {
        $imagePath = null;

        try {
            if (($data['image'] ?? null) instanceof UploadedFile) {
                $imagePath = $data['image']->store('courses', 'public');
            }

            $course = DB::transaction(function () use ($data, $admin, $imagePath) {
                return Course::create([
                    'name' => trim($data['name']),
                    'description' => $data['description'] ?? null,
                    'coach_id' => $data['coach_id'] ?? null,
                    'price' => $data['price'],
                    'image' => $imagePath,
                    'status' => $data['status'] ?? 'pending',
                    'created_by_user_id' => $admin->id,
                ]);
            });

            return $course
                ->load('coach:id,name,status')
                ->loadCount('sessions');

        } catch (Throwable $e) {
            if ($imagePath) {
                Storage::disk('public')->delete($imagePath);
            }

            throw $e;
        }
    }

    // =====================================
    // MODIFICATION DU COURS
    // =====================================

    public function update(Course $course, array $data): Course
    {
        $newImage = null;

        try {
            if (($data['image'] ?? null) instanceof UploadedFile) {
                $newImage = $data['image']->store('courses', 'public');
            }

            [$course, $oldImage] = DB::transaction(
                function () use ($course, $data, $newImage) {

                    $current = Course::query()
                        ->whereKey($course->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $oldImage = $current->image;

                    $attributes = Arr::only($data, [
                        'name',
                        'description',
                        'coach_id',
                        'price',
                        'status',
                    ]);

                    if (isset($attributes['name'])) {
                        $attributes['name'] = trim($attributes['name']);
                    }

                    if ($newImage) {
                        $attributes['image'] = $newImage;
                    }

                    $current->update($attributes);

                    return [$current, $oldImage];
                }
            );

        } catch (Throwable $e) {
            if ($newImage) {
                Storage::disk('public')->delete($newImage);
            }

            throw $e;
        }

        // Supprimer l'ancienne image après succès DB
        if ($newImage && $oldImage && $newImage !== $oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        return $course->fresh()
            ->load('coach:id,name,status')
            ->loadCount('sessions');
    }

    // =====================================
    // ARCHIVAGE DU COURS
    // =====================================

    public function archive(Course $course): void
    {
        DB::transaction(function () use ($course) {

            $current = Course::query()
                ->whereKey($course->id)
                ->lockForUpdate()
                ->firstOrFail();

            $hasFutureSessions = $current->sessions()
                ->where('status', 'scheduled')
                ->where('start_at', '>=', now())
                ->exists();

            if ($hasFutureSessions) {
                throw ValidationException::withMessages([
                    'course' => [
                        "Annulez d'abord les séances futures de ce cours avant de l'archiver.",
                    ],
                ]);
            }

            // Soft Delete : conserver l'historique
            $current->delete();
        });
    }
}
