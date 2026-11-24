<?php

namespace App\Services;

use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
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

        $now = now('UTC')->toDateTimeString();
        $counts = $statsQuery->toBase()->selectRaw("COUNT(*) AS total,
            COUNT(CASE WHEN status = 'confirmed' AND attendance_status IS NULL AND EXISTS (SELECT 1 FROM course_sessions WHERE course_sessions.id = course_enrollments.session_id AND end_at > ?) THEN 1 END) AS confirmed,
            COUNT(CASE WHEN status = 'pending' AND attendance_status IS NULL AND EXISTS (SELECT 1 FROM course_sessions WHERE course_sessions.id = course_enrollments.session_id AND end_at > ?) THEN 1 END) AS pending,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled,
            COUNT(CASE WHEN status <> 'cancelled' AND (attendance_status = 'present' OR (status = 'attended' AND attendance_status IS NULL)) THEN 1 END) AS attended,
            COUNT(CASE WHEN status <> 'cancelled' AND attendance_status = 'absent' THEN 1 END) AS absent,
            COUNT(CASE WHEN status IN ('confirmed', 'pending') AND attendance_status IS NULL AND EXISTS (SELECT 1 FROM course_sessions WHERE course_sessions.id = course_enrollments.session_id AND end_at <= ?) THEN 1 END) AS unmarked", [$now, $now, $now])->first();
        $stats = array_map('intval', (array) $counts);

        $this->applyDisplayStatus($query, $filters['status'] ?? null);

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

        $this->applyDisplayStatus($query, $filters['status'] ?? null);

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

    private function applyDisplayStatus(Builder $query, ?string $status): void
    {
        if ($status === 'absent') {
            $query->where('status', '!=', 'cancelled')->where('attendance_status', 'absent');
        } elseif ($status === 'unmarked') {
            $query->whereIn('status', ['confirmed', 'pending'])->whereNull('attendance_status')
                ->whereHas('session', fn ($q) => $q->where('end_at', '<=', now('UTC')));
        } elseif (in_array($status, ['confirmed', 'pending'], true)) {
            $query->where('status', $status)->whereNull('attendance_status')
                ->whereHas('session', fn ($q) => $q->where('end_at', '>', now('UTC')));
        } elseif ($status === 'attended') {
            $query->where('status', '!=', 'cancelled')->where(fn ($q) => $q
                ->where('attendance_status', 'present')->orWhere(fn ($q) => $q->where('status', 'attended')->whereNull('attendance_status')));
        } elseif ($status) {
            $query->where('status', $status);
        }
    }

    public function show(CourseEnrollment $enrollment): CourseEnrollment
    {
        return $enrollment->load([
            'member' => fn ($q) => $q->withTrashed()->select('id', 'name', 'email', 'phone'),
            'session.course' => fn ($q) => $q->withTrashed()->select('id', 'name', 'price', 'status'),
            'session.coach:id,name',
        ]);
    }

    private function reservationQuery(): Builder
    {
        return CourseEnrollment::query()->with([
            'member' => fn ($q) => $q->withTrashed()->select('id', 'name', 'email', 'phone'),
            'session.course' => fn ($q) => $q->withTrashed()->select('id', 'name', 'price', 'status'),
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
            $text = '%' . addcslashes(trim($filters['search']), '%_\\') . '%';
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
        $nowUtc = now('UTC')->format('Y-m-d H:i:s');
        $period = $filters['period'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));
        $courseId = $filters['course_id'] ?? null;

        $query = CourseSession::query()
            ->with(['course:id,name,description,price,status', 'coach:id,name'])
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
            ->where('start_at', '>', $nowUtc)
            // Ne jamais exposer les cours inactifs / archives au catalogue.
            ->whereHas('course', fn (Builder $q) => $q->where('status', 'active'))
            ->whereHas('coach', fn (Builder $q) => $q->where('role', 'coach')->where('status', 'active'));

        // TOUS les filtres sont executes dans MySQL AVANT la pagination.
        if ($courseId !== null) {
            $query->where('course_id', (int) $courseId);
        }

        if ($search !== '') {
            // Les caracteres % et _ saisis sont des textes, pas des jokers SQL.
            $like = '%' . addcslashes($search, '%_\\') . '%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('location', 'like', $like)
                    ->orWhereHas('course', fn (Builder $c) => $c->where('name', 'like', $like))
                    ->orWhereHas('coach', fn (Builder $c) => $c->where('name', 'like', $like));
            });
        }

        // Periode calculee dans le fuseau de la salle (pas celui du navigateur).
        $localNow = now($this->timezone());
        if ($period === 'today') {
            $tomorrowUtc = $localNow->copy()->addDay()->startOfDay()
                ->utc()->format('Y-m-d H:i:s');
            $query->where('start_at', '<', $tomorrowUtc);
        } elseif ($period === 'week') {
            $weekEndUtc = $localNow->copy()->addDays(7)
                ->utc()->format('Y-m-d H:i:s');
            $query->where('start_at', '<=', $weekEndUtc);
        }

        $sessions = $query->orderBy('start_at')->orderBy('id')
            ->paginate(
                (int) ($filters['per_page'] ?? 12),
                ['*'],
                'page',
                (int) ($filters['page'] ?? 1)
            );

        // L'affichage ne garantit pas une place : book() revalide tout
        // sous verrou (capacite, abonnement, statut, doublon).
        $subscriptions = $this->eligibleSubscriptions($member);
        $sessions->through(function (CourseSession $session) use ($subscriptions): array {
            $capacity = (int) $session->capacity;
            $remaining = max(0, $capacity - (int) $session->enrolled_count);
            $eligible = $this->coversSession($subscriptions, $session);
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

            if (!$lockedSession->coach()->where('role', 'coach')->where('status', 'active')->exists()) {
                throw ValidationException::withMessages(['session_id' => 'Le coach de cette séance doit être actif.']);
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

            if (!$this->coversSession($this->eligibleSubscriptions($lockedMember), $lockedSession)) {
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
                $old->forceFill(['attendance_status' => null, 'attendance_marked_at' => null, 'attendance_marked_by_user_id' => null])->save();
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

            if (!in_array($row->status, ['pending', 'confirmed'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Cette réservation ne peut plus être annulée.',
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
    // ANNULATION ADMIN — CONSERVE L'HISTORIQUE
    // =============================================

    public function cancelForAdmin(CourseEnrollment $enrollment): CourseEnrollment
    {
        return DB::transaction(function () use ($enrollment) {
            // Même ordre de verrous que book() et cancelForMember().
            $session = CourseSession::query()
                ->whereKey($enrollment->session_id)
                ->lockForUpdate()
                ->firstOrFail();

            $row = CourseEnrollment::query()
                ->whereKey($enrollment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ((int) $row->session_id !== (int) $session->id) {
                abort(409, 'La séance de cette réservation a changé. Actualisez la page.');
            }

            if ($row->status === 'cancelled') {
                return $this->show($row); // Annulation idempotente.
            }

            if (!in_array($row->status, ['pending', 'confirmed'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Seules les réservations en attente ou confirmées peuvent être annulées.',
                ]);
            }

            if (!$session->start_at || $session->start_at->lessThanOrEqualTo(now('UTC'))) {
                throw ValidationException::withMessages([
                    'status' => 'Impossible d’annuler une réservation après le début de la séance.',
                ]);
            }

            // Pas de suppression de paiement, remboursement ou correction financière implicite.
            if ($row->payments()->exists() || (float) $row->price_at_booking > 0) {
                throw ValidationException::withMessages([
                    'status' => 'Un paiement est associé : traitez ce dossier financièrement avant toute annulation.',
                ]);
            }

            $row->update(['status' => 'cancelled', 'cancelled_at' => now('UTC')]);
            return $this->show($row);
        }, 3);
    }

    // =============================================
    // ELIGIBILITE ABONNEMENT
    // =============================================

    public function assertReservationsStillCovered(User $member, MemberSubscription $cancelled): void
    {
        if ($cancelled->starts_at->toDateString() > now($this->timezone())->toDateString()) {
            return;
        }

        $cancelled->load(['plan' => fn ($plans) => $plans->withTrashed()]);
        $cancelledCoverage = new Collection([$cancelled]);
        $subscriptions = $this->eligibleSubscriptions($member);
        $reservations = $member->courseEnrollments()->whereIn('status', self::ACTIVE_STATUSES)
            ->whereHas('session', fn (Builder $query) => $query->where('status', 'scheduled')
                ->where('start_at', '>', now('UTC')))
            ->with('session:id,course_id,start_at')->get();

        foreach ($reservations as $reservation) {
            if ($reservation->session
                && $this->coversSession($cancelledCoverage, $reservation->session)
                && !$this->coversSession($subscriptions, $reservation->session)) {
                throw ValidationException::withMessages([
                    'membership' => 'Annulez les réservations futures non couvertes avant de clôturer cet abonnement.',
                ]);
            }
        }
    }

    private function eligibleSubscriptions(User $member): Collection
    {
        $today = now($this->timezone())->toDateString();

        return MemberSubscription::query()->where('member_id', $member->id)->where('status', 'active')
            ->where('starts_at', '<=', $today)->where('ends_at', '>=', $today)
            ->with(['plan' => fn ($plans) => $plans->withTrashed()->select('id', 'type', 'course_id')])
            ->get();
    }

    private function coversSession(Collection $subscriptions, CourseSession $session): bool
    {
        $day = $session->start_at->copy()->setTimezone($this->timezone())->toDateString();

        return $subscriptions->contains(fn (MemberSubscription $subscription) =>
            $subscription->starts_at->toDateString() <= $day
            && $subscription->ends_at->toDateString() >= $day
            && ($subscription->plan?->type === 'general' || (
                $subscription->plan?->type === 'course'
                && (int) $subscription->plan->course_id === (int) $session->course_id
            ))
        );
    }

    private function timezone(): string
    {
        return config('gym.timezone', 'Africa/Casablanca');
    }
}