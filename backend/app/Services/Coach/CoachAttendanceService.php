<?php

namespace App\Services\Coach;

use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CoachAttendanceService
{
    private const RESERVATION_STATUSES = [
        'confirmed',
        'attended',
    ];

    // Liste des participants d'une séance
    public function participants(
        User $coach,
        CourseSession $session
    ): array {
        $this->assertOwnSession($coach, $session);

        $enrollments = CourseEnrollment::query()
            ->where('session_id', $session->id)
            ->whereIn('status', self::RESERVATION_STATUSES)
            ->with('member:id,name,email')
            ->orderBy('id')
            ->get();

        $participants = $enrollments
            ->map(
                fn (CourseEnrollment $row): array =>
                    $this->participantData($row)
            )
            ->values();

        return [
            'session' => [
                'id' => (int) $session->id,
                'start_at' => $session->start_at?->toIso8601String(),
                'status' => $session->status,
            ],

            'can_mark' => $this->canMark($session),

            'participants' => $participants,

            'summary' => [
                'total' => $participants->count(),

                'present' => $participants
                    ->where('attendance_status', 'present')
                    ->count(),

                'absent' => $participants
                    ->where('attendance_status', 'absent')
                    ->count(),

                'unmarked' => $participants
                    ->where('attendance_status', 'unmarked')
                    ->count(),
            ],
        ];
    }

    // Enregistrer présent ou absent
    public function mark(
        User $coach,
        CourseSession $session,
        CourseEnrollment $enrollment,
        string $status
    ): array {
        $this->assertOwnSession($coach, $session);

        abort_unless(
            (int) $enrollment->session_id === (int) $session->id,
            404
        );

        $updated = DB::transaction(
            function () use (
                $coach,
                $session,
                $enrollment,
                $status
            ) {
                // Verrouiller la séance
                $lockedSession = CourseSession::query()
                    ->whereKey($session->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->assertOwnSession(
                    $coach,
                    $lockedSession
                );

                if (!$this->canMark($lockedSession)) {
                    throw ValidationException::withMessages([
                        'session' =>
                            'Le pointage est possible seulement '
                            . 'apres le debut d une seance non annulee.',
                    ]);
                }

                // Verrouiller la réservation
                $row = CourseEnrollment::query()
                    ->whereKey($enrollment->id)
                    ->where('session_id', $lockedSession->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!in_array(
                    $row->status,
                    self::RESERVATION_STATUSES,
                    true
                )) {
                    throw ValidationException::withMessages([
                        'enrollment' =>
                            'Seule une reservation confirmee '
                            . 'peut etre pointee.',
                    ]);
                }

                // Enregistrer le pointage
                $row->attendance_status = $status;

                $row->attendance_marked_at = now('UTC')
                    ->toDateTimeString();

                $row->attendance_marked_by_user_id =
                    $coach->getKey();

                // Compatibilité avec Gestion Réservations
                $row->status = $status === 'present'
                    ? 'attended'
                    : 'confirmed';

                $row->save();

                return $row->load(
                    'member:id,name,email'
                );
            },
            3
        );

        return [
            'message' => $status === 'present'
                ? 'Presence enregistree.'
                : 'Absence enregistree.',

            'participant' =>
                $this->participantData($updated),
        ];
    }

    // Sécurité : séance appartenant au Coach connecté
    private function assertOwnSession(
        User $coach,
        CourseSession $session
    ): void {
        abort_unless(
            $coach->isCoach()
                && (int) $session->coach_id
                    === (int) $coach->getKey(),
            404
        );
    }

    // Vérifier si pointage autorisé
    private function canMark(
        CourseSession $session
    ): bool {
        return in_array(
            $session->status,
            ['scheduled', 'completed'],
            true
        )
            && $session->start_at !== null
            && $session->start_at->lessThanOrEqualTo(
                now('UTC')
            );
    }

    // Format compatible avec React
    private function participantData(
        CourseEnrollment $enrollment
    ): array {
        $attendance = $enrollment->attendance_status;

        // Compatibilité avec les anciennes présences
        if (!in_array(
            $attendance,
            ['present', 'absent'],
            true
        )) {
            $attendance =
                $enrollment->status === 'attended'
                    ? 'present'
                    : 'unmarked';
        }

        $member = $enrollment->member;

        return [
            'enrollment_id' => (int) $enrollment->id,

            'attendance_status' => $attendance,

            'member' => $member ? [
                'id' => (int) $member->id,
                'name' => $member->name,
                'email' => $member->email,
            ] : null,
        ];
    }
}
