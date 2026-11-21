<?php

namespace App\Services\Members;

use App\Models\Course;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MemberCourseService
{
    // ==========================================
    // CATALOGUE DES COURS POUR MEMBER
    // ==========================================

    public function list(array $filters = []): LengthAwarePaginator
    {
        $now = now('UTC')->toDateTimeString();

        $search = trim(
            (string) ($filters['search'] ?? '')
        );

        // Afficher uniquement les cours actifs
        $query = Course::query()
            ->where('status', 'active')

            // Coach associe au cours
            ->with('coach:id,name')

            // Nombre de seances futures programmees
            ->withCount([
                'sessions as upcoming_sessions_count' =>
                    fn (Builder $sessions) => $sessions
                        ->where('status', 'scheduled')
                        ->where('start_at', '>', $now),
            ]);

        // Recherche par nom ou description
        if ($search !== '') {
            $query->where(
                function (Builder $q) use ($search): void {
                    $q->where(
                        'name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    );
                }
            );
        }

        // Tri + pagination
        $paginator = $query
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(
                (int) ($filters['per_page'] ?? 9),
                ['*'],
                'page',
                (int) ($filters['page'] ?? 1)
            );

        // Format compatible avec React
        $paginator->through(
            static function (Course $course): array {
                return [
                    'id' => (int) $course->id,

                    'name' => $course->name,

                    'description' => $course->description,

                    'price' => $course->price,

                    'status' => $course->status,

                    'upcoming_sessions_count' =>
                        (int) $course->upcoming_sessions_count,

                    'coach' => $course->coach ? [
                        'id' => (int) $course->coach->id,
                        'name' => $course->coach->name,
                    ] : null,
                ];
            }
        );

        return $paginator;
    }
}
