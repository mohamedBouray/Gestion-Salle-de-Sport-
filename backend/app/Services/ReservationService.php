<?php

namespace App\Services;

use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    private const ACTIVE_STATUSES = ['pending', 'confirmed', 'attended'];
    private const SEATS_TAKEN_STATUSES = ['confirmed', 'attended'];

    // =============================================
    // ADMIN — RECHERCHE ET PAGINATION
    // =============================================

    public function listAdmin(array $filters = []): array
    {
        $query = $this->reservationQuery();
        $this->applyAdminFilters($query, $filters);

        // Les chiffres des cartes ne dépendent pas du statut sélectionné.
        // En revanche, ils respectent recherche/cours/date/séance.
        $statsQuery = clone $query;

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'confirmed' => (clone $statsQuery)->where('status', 'confirmed')->count(),
            'pending' => (clone $statsQuery)->where('status', 'pending')->count(),
            'cancelled' => (clone $statsQuery)->where('status', 'cancelled')->count(),
            'attended' => (clone $statsQuery)->where('status', 'attended')->count(),
        ];

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return [
            'reservations' => $query
                ->orderByDesc('enrolled_at')
                ->orderByDesc('id')
                ->paginate(
                    (int) ($filters['per_page'] ?? 10),
                    ['*'],
                    'page',
                    (int) ($filters['page'] ?? 1)
                ),
            'stats' => $stats,
        ];
    }

    public function listMember(User $member, array $filters = []): LengthAwarePaginator
    {
        $query = $this->reservationQuery()
            ->where('member_id', $member->id);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query
            ->orderByDesc('enrolled_at')
            ->orderByDesc('id')
            ->paginate(
                (int) ($filters['per_page'] ?? 10),
                ['*'],
                'page',
                (int) ($filters['page'] ?? 1)
            );
    }

    public function show(CourseEnrollment $enrollment): CourseEnrollment
    {
        return $enrollment->load([
            'member:id,name,email,phone',
            'session.course:id,name,price,status',
            'session.coach:id,name',
        ]);
    }

    private function reservationQuery(): Builder
    {
        return CourseEnrollment::query()->with([
            'member:id,name,email,phone',
            'session.course:id,name,price,status',
            'session.coach:id,name',
        ]);
    }

    private function applyAdminFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['session_id'])) {
            $query->where('session_id', (int) $filters['session_id']);
        }

        if (!empty($filters['course_id'])) {
            $query->whereHas('session', fn (Builder $q) =>
                $q->where('course_id', (int) $filters['course_id'])
            );
        }

        if (!empty($filters['date'])) {
            $day = Carbon::parse($filters['date'], $this->timezone())
                ->startOfDay();
            $start = $day->copy()->utc()->format('Y-m-d H:i:s');
            $end = $day->addDay()->utc()->format('Y-m-d H:i:s');

            $query->whereHas('session', fn (Builder $q) => $q
                ->where('start_at', '>=', $start)
                ->where('start_at', '<', $end)
            );
        }

        if (!empty($filters['search'])) {
            $text = '%' . trim($filters['search']) . '%';
            $query->where(function (Builder $q) use ($text) {
                $q->whereHas('member', fn (Builder $u) => $u
                    ->where(function (Builder $sub) use ($text) {
                        $sub->where('name', 'like', $text)
                            ->orWhere('email', 'like', $text);
                    })
                )->orWhereHas('session.course', fn (Builder $c) =>
                    $c->where('name', 'like', $text)
                );
            });
        }
    }

    // =============================================
    // MEMBRE — SEANCES A VENIR
    // =============================================

    public function upcomingSessions(User $member, array $filters = []): LengthAwarePaginator
    {
        $now = now('UTC')->format('Y-m-d H:i:s');

        $sessions = CourseSession::query()
            ->with([
                'course:id,name,description,price,status',
                'coach:id,name',
            ])
            ->withCount([
                'enrollments as enrolled_count' => fn (Builder $q) =>
                    $q->whereIn('status', self::SEATS_TAKEN_STATUSES),
            ])
            ->withExists([
                'enrollments as already_reserved' => fn (Builder $q) =>
                    $q->where('member_id', $member->id)
                        ->whereIn('status', self::ACTIVE_STATUSES),
            ])
            ->where('status', 'scheduled')
            ->where('start_at', '>', $now)
            ->whereHas('course', fn (Builder $q) =>
                $q->where('status', 'active')
            )
            ->orderBy('start_at')
            ->paginate(
                (int) ($filters['per_page'] ?? 12),
                ['*'],
                'page',
                (int) ($filters['page'] ?? 1)
            );

        // Un créneau peut être visible sans être réservable :
        // membre sans abonnement, séance complète, réservation existante.
        $sessions->through(function (CourseSession $session) use ($member) {
            $capacity = (int) $session->capacity;
            $remaining = max(0, $capacity - (int) $session->enrolled_count);
            $eligible = $this->hasEligibleSubscription($member, $session);
            $reserved = (bool) $session->already_reserved;

            return [
                'id' => $session->id,
                'course_id' => $session->course_id,
                'coach_id' => $session->coach_id,
                'start_at' => $session->start_at?->toIso8601String(),
                'end_at' => $session->end_at?->toIso8601String(),
                'status' => $session->status,
                'location' => $session->location,
                'capacity' => $capacity,
                'enrolled_count' => (int) $session->enrolled_count,
                'remaining_places' => $remaining,
                'already_reserved' => $reserved,
                'eligible' => $eligible,
                'can_book' => $remaining > 0 && $eligible && !$reserved,
                'course' => $session->course ? [
                    'id' => $session->course->id,
                    'name' => $session->course->name,
                    'price' => $session->course->price,
                ] : null,
                'coach' => $session->coach ? [
                    'id' => $session->coach->id,
                    'name' => $session->coach->name,
                ] : null,
            ];
        });

        return $sessions;
    }

    // =============================================
    // CREATION ADMIN OU MEMBER : MEME LOGIQUE
    // =============================================

    public function book(CourseSession $session, User $member): CourseEnrollment
    {
        return DB::transaction(function () use ($session, $member) {
            // Le verrou sur la séance sérialise les réservations concurrentes
            // pour garantir capacity même si deux membres cliquent ensemble.
            $lockedSession = CourseSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedMember = User::query()
                ->whereKey($member->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$lockedMember->isMember() || !$lockedMember->isActive()) {
                throw ValidationException::withMessages([
                    'member_id' => 'Le compte du membre doit être actif.',
                ]);
            }

            if (
                $lockedSession->status !== 'scheduled' ||
                $lockedSession->start_at->lessThanOrEqualTo(now('UTC'))
            ) {
                throw ValidationException::withMessages([
                    'session_id' => 'Cette séance n’est plus réservable.',
                ]);
            }

            $lockedSession->load('course');
            if (!$lockedSession->course || $lockedSession->course->status !== 'active') {
                throw ValidationException::withMessages([
                    'session_id' => 'Le cours associé doit être actif.',
                ]);
            }

            // La contrainte UNIQUE(session_id, member_id) interdit la
            // création d'une seconde ligne : on réactive une annulation
            // uniquement si elle ne possède pas d'historique de paiement.
            $old = CourseEnrollment::query()
                ->where('session_id', $lockedSession->id)
                ->where('member_id', $lockedMember->id)
                ->lockForUpdate()
                ->first();

            if ($old && $old->status !== 'cancelled') {
                throw ValidationException::withMessages([
                    'session_id' => 'Ce membre a déjà réservé cette séance.',
                ]);
            }

            if ($old && ($old->payments()->exists() || (float) $old->price_at_booking > 0)) {
                throw ValidationException::withMessages([
                    'session_id' => 'Une ancienne réservation a un historique financier : traitement manuel nécessaire.',
                ]);
            }

            if (!$this->hasEligibleSubscription($lockedMember, $lockedSession)) {
                throw ValidationException::withMessages([
                    'subscription' => 'Un abonnement actif (général ou du cours) doit couvrir aujourd’hui et la date de la séance.',
                ]);
            }

            $overlap = CourseEnrollment::query()
                ->where('member_id', $lockedMember->id)
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->where('session_id', '!=', $lockedSession->id)
                ->whereHas('session', function (Builder $q) use ($lockedSession) {
                    $q->where('status', 'scheduled')
                        ->where('start_at', '<', $lockedSession->end_at->format('Y-m-d H:i:s'))
                        ->where('end_at', '>', $lockedSession->start_at->format('Y-m-d H:i:s'));
                })
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'session_id' => 'Le membre possède déjà une réservation à ce créneau.',
                ]);
            }

            $occupied = $lockedSession->enrollments()
                ->whereIn('status', self::SEATS_TAKEN_STATUSES)
                ->count();

            if ($occupied >= $lockedSession->capacity) {
                throw ValidationException::withMessages([
                    'session_id' => 'Cette séance est complète.',
                ]);
            }

            // Réservation couverte par l'abonnement : 0 MAD additionnel.
            // Paiement par séance non pris en charge dans ce workflow.
            if ($old) {
                $old->update([
                    'status' => 'confirmed',
                    'price_at_booking' => 0,
                    'enrolled_at' => now('UTC'),
                    'cancelled_at' => null,
                ]);
                $enrollment = $old;
            } else {
                $enrollment = CourseEnrollment::query()->create([
                    'session_id' => $lockedSession->id,
                    'member_id' => $lockedMember->id,
                    'price_at_booking' => 0,
                    'status' => 'confirmed',
                    'enrolled_at' => now('UTC'),
                    'cancelled_at' => null,
                ]);
            }

            return $this->show($enrollment);
        }, 3);
    }

    // =============================================
    // ANNULATION MEMBRE — PAS DE REMBOURSEMENT AUTO
    // =============================================

    public function cancelForMember(CourseEnrollment $enrollment, User $member): CourseEnrollment
    {
        abort_unless((int) $enrollment->member_id === (int) $member->id, 404);

        return DB::transaction(function () use ($enrollment, $member) {
            // Même ordre de verrous que la création : séance, puis réservation.
            $session = CourseSession::query()
                ->whereKey($enrollment->session_id)
                ->lockForUpdate()
                ->firstOrFail();

            $row = CourseEnrollment::query()
                ->whereKey($enrollment->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless((int) $row->member_id === (int) $member->id, 404);

            if ($row->status === 'cancelled') {
                return $this->show($row);
            }

            if ($row->status === 'attended') {
                throw ValidationException::withMessages([
                    'status' => 'Une présence enregistrée ne peut pas être annulée.',
                ]);
            }

            if ($session->start_at->lessThanOrEqualTo(now('UTC'))) {
                throw ValidationException::withMessages([
                    'status' => 'La séance a déjà commencé.',
                ]);
            }

            if ($row->payments()->exists() || (float) $row->price_at_booking > 0) {
                throw ValidationException::withMessages([
                    'status' => 'Un paiement est associé : contactez l’administration.',
                ]);
            }

            $row->update([
                'status' => 'cancelled',
                'cancelled_at' => now('UTC'),
            ]);

            return $this->show($row);
        }, 3);
    }

    // =============================================
    // ELIGIBILITE ABONNEMENT
    // =============================================

    private function hasEligibleSubscription(User $member, CourseSession $session): bool
    {
        $today = now($this->timezone())->toDateString();
        $day = $session->start_at->copy()->setTimezone($this->timezone())->toDateString();

        return MemberSubscription::query()
            ->where('member_id', $member->id)
            ->where('status', 'active')
            ->whereDate('starts_at', '<=', $today)
            ->whereDate('ends_at', '>=', $today)
            ->whereDate('starts_at', '<=', $day)
            ->whereDate('ends_at', '>=', $day)
            ->whereHas('plan', function (Builder $query) use ($session) {
                $query->withTrashed()->where(function (Builder $q) use ($session) {
                    $q->where('type', 'general')
                        ->orWhere(function (Builder $q) use ($session) {
                            $q->where('type', 'course')
                                ->where('course_id', $session->course_id);
                        });
                });
            })
            ->exists();
    }

    private function timezone(): string
    {
        return config('gym.timezone', 'Africa/Casablanca');
    }
}
