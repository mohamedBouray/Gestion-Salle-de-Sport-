<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachAvailability;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Http\JsonResponse;

class CoachAvailabilityController extends Controller
{
    // ==========================================
    // 1. DISPONIBILITES D'UN COACH
    // GET /api/admin/coaches/{coach}/availabilities
    // ==========================================

    public function index(User $coach): JsonResponse
    {
        // Vérifier que l'utilisateur est un coach
        if ($coach->role !== 'coach') {
            abort(404, 'Coach introuvable.');
        }

        // Charger les disponibilités actives
        $availabilities = CoachAvailability::query()
            ->where('coach_id', $coach->id)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get([
                'id',
                'coach_id',
                'day_of_week',
                'start_time',
                'end_time',
                'is_active',
            ]);

        // Formater les disponibilités pour React
        $formattedAvailabilities = $availabilities
            ->map(function (CoachAvailability $availability) {
                return [
                    'id' => $availability->id,

                    'coach_id' => (int) $availability->coach_id,

                    'day_of_week' => (int) $availability->day_of_week,

                    'day_label' => $this->dayLabel(
                        (int) $availability->day_of_week
                    ),

                    'start_time' => $this->formatTime(
                        $availability->start_time
                    ),

                    'end_time' => $this->formatTime(
                        $availability->end_time
                    ),

                    'is_active' => (bool) $availability->is_active,
                ];
            })
            ->values();

        // Réponse JSON
        return response()->json([
            'coach' => [
                'id' => $coach->id,
                'name' => $coach->name,
                'status' => $coach->status,
            ],

            'availabilities' => $formattedAvailabilities,

            'total' => $formattedAvailabilities->count(),
        ]);
    }

    // ==========================================
    // 2. LIBELLE DU JOUR
    // 0 = DIMANCHE
    // 6 = SAMEDI
    // ==========================================

    private function dayLabel(int $day): string
    {
        $days = [
            0 => 'Dimanche',
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
        ];

        return $days[$day] ?? 'Inconnu';
    }

    // ==========================================
    // 3. FORMAT HORAIRES
    // ==========================================

    private function formatTime(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('H:i');
        }

        $text = trim((string) $value);

        if (
            preg_match(
                '/(?:^|\s)(\d{2}):(\d{2})/',
                $text,
                $matches
            )
        ) {
            return $matches[1] . ':' . $matches[2];
        }

        return null;
    }
}
