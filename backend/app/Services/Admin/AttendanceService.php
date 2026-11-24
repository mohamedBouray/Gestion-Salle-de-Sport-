<?php

namespace App\Services\Admin;

use App\Models\GymAttendance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    private function timezone(): string
    {
        return config('gym.timezone', 'Africa/Casablanca');
    }

    private function dbRole(string $group): string
    {
        return match ($group) {
            'members' => 'member',
            'coaches' => 'coach',
            default => throw ValidationException::withMessages([
                'role' => 'Type de présence invalide.',
            ]),
        };
    }

    public function list(string $group, array $filters): LengthAwarePaginator
    {
        $role = $this->dbRole($group);
        $date = $filters['date'] ?? now($this->timezone())->toDateString();

        $query = GymAttendance::query()
            ->with('person:id,name,email,deleted_at')
            ->where('role', $role)
            ->where('date', $date);

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $query->whereHas('person', function (Builder $people) use ($search) {
                // LIKE bindings are escaped to prevent wildcard-only searches.
                $term = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
                $people->where(function (Builder $part) use ($term) {
                    $part->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            });
        }

        return $query
            ->orderByDesc('check_in_at')
            ->orderByDesc('id')
            ->paginate(min((int) ($filters['per_page'] ?? 12), 100));
    }

    public function summary(?string $date = null): array
    {
        $date ??= now($this->timezone())->toDateString();

        $summary = [
            'members' => ['present' => 0, 'left' => 0, 'visits' => 0],
            'coaches' => ['present' => 0, 'left' => 0, 'absent' => 0, 'visits' => 0],
        ];

        $counts = GymAttendance::query()
            ->select('role', 'status')
            ->selectRaw('COUNT(*) as total')
            ->where('date', $date)
            ->groupBy('role', 'status')
            ->get();

        foreach ($counts as $row) {
            $group = $row->role === 'member' ? 'members' :
                ($row->role === 'coach' ? 'coaches' : null);
            if ($group === null) continue;

            $count = (int) $row->total;
            if ($row->status === 'present' || $row->status === 'left') {
                $summary[$group][$row->status] += $count;
                $summary[$group]['visits'] += $count;
            } elseif ($group === 'coaches' && $row->status === 'absent') {
                $summary['coaches']['absent'] += $count;
            }
        }

        // Counts represent visits / check-ins, not distinct people per calendar day.
        return $summary;
    }

    public function checkIn(string $group, array $data, User $admin): GymAttendance
    {
        $role = $this->dbRole($group);
        $when = $this->parseUtc($data['occurred_at'], 'occurred_at');
        $this->assertNotFuture($when, 'occurred_at');
        $day = $when->copy()->setTimezone($this->timezone())->toDateString();

        return DB::transaction(function () use ($role, $data, $admin, $when, $day) {
            // Locking the User row serializes check-in and absence actions for this person.
            $person = User::query()
                ->whereKey((int) $data['person_id'])
                ->where('role', $role)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$person) {
                throw ValidationException::withMessages([
                    'person_id' => 'Profil introuvable ou inactif pour cette catégorie.',
                ]);
            }

            if ($role === User::MEMBER && !$person->memberSubscriptions()
                ->where('status', 'active')->where('starts_at', '<=', $day)->where('ends_at', '>=', $day)
                ->whereHas('plan', fn ($query) => $query->withTrashed()->whereIn('type', ['general', 'course']))
                ->exists()) {
                throw ValidationException::withMessages([
                    'person_id' => 'Ce membre ne possède pas d’abonnement actif et valide à la date de l’entrée.',
                ]);
            }

            if (GymAttendance::query()
                ->where('user_id', $person->id)
                ->where('status', 'present')
                ->exists()) {
                throw ValidationException::withMessages([
                    'person_id' => 'Cette personne a déjà une entrée ouverte. Enregistrez sa sortie.',
                ]);
            }

            if (GymAttendance::query()
                ->where('user_id', $person->id)
                ->where('date', $day)
                ->where('status', 'absent')
                ->exists()) {
                throw ValidationException::withMessages([
                    'person_id' => 'Une absence est déjà déclarée pour ce jour. Corrigez-la avant un pointage.',
                ]);
            }

            $last = GymAttendance::query()
                ->where('user_id', $person->id)
                ->whereNotNull('check_in_at')
                ->orderByDesc('check_in_at')
                ->first();

            if ($last && (!$last->check_out_at || $when->lessThanOrEqualTo($last->check_out_at))) {
                throw ValidationException::withMessages([
                    'occurred_at' => 'L’entrée doit avoir lieu après la dernière sortie enregistrée.',
                ]);
            }

            $attendance = GymAttendance::query()->create([
                'user_id' => $person->id,
                'role' => $role,
                'date' => $day,
                'check_in_at' => $when,
                'check_out_at' => null,
                'status' => 'present',
                'note' => $data['note'] ?? null,
                'recorded_by' => $admin->id,
            ]);

            return $attendance->load('person');
        }, 3);
    }

    public function checkOut(
        string $group,
        GymAttendance $attendance,
        array $data,
        User $admin
    ): GymAttendance {
        $role = $this->dbRole($group);
        $when = $this->parseUtc($data['occurred_at'], 'occurred_at');
        $this->assertNotFuture($when, 'occurred_at');

        return DB::transaction(function () use ($attendance, $role, $data, $when, $admin) {
            $current = GymAttendance::query()
                ->whereKey($attendance->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($current->role !== $role) {
                abort(404, 'Pointage introuvable pour ce type de profil.');
            }

            if ($current->status !== 'present' || $current->check_out_at !== null) {
                throw ValidationException::withMessages([
                    'attendance' => 'Ce pointage est déjà clôturé ou ne correspond pas à une entrée.',
                ]);
            }

            if (!$current->check_in_at || $when->lessThanOrEqualTo($current->check_in_at)) {
                throw ValidationException::withMessages([
                    'occurred_at' => 'La sortie doit être strictement après l’entrée.',
                ]);
            }

            // Preserve the entry note when the checkout form contains no note.
            $update = [
                'check_out_at' => $when,
                'status' => 'left',
                'recorded_by' => $admin->id,
            ];

            if (!empty($data['note'])) {
                $update['note'] = $data['note'];
            }

            $current->update($update);

            return $current->load('person');
        }, 3);
    }

    public function markCoachAbsent(array $data, User $admin): GymAttendance
    {
        $day = $data['date'];
        if ($day > now($this->timezone())->toDateString()) {
            throw ValidationException::withMessages([
                'date' => 'Impossible de déclarer une absence à une date future.',
            ]);
        }

        return DB::transaction(function () use ($data, $admin, $day) {
            $coach = User::query()
                ->whereKey((int) $data['person_id'])
                ->where('role', 'coach')
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (!$coach) {
                throw ValidationException::withMessages([
                    'person_id' => 'Le coach est introuvable ou inactif.',
                ]);
            }

            if (GymAttendance::query()
                ->where('user_id', $coach->id)
                ->where('date', $day)
                ->exists()) {
                throw ValidationException::withMessages([
                    'date' => 'Un pointage ou une absence existe déjà pour ce coach ce jour.',
                ]);
            }

            // A visit started the previous day can overlap this business day.
            // Never mark absent a coach who was already inside the gym.
            $timezone = $this->timezone();
            $startUtc = Carbon::parse($day . ' 00:00:00', $timezone)
                ->utc()->format('Y-m-d H:i:s');
            $endUtc = Carbon::parse($day . ' 00:00:00', $timezone)
                ->addDay()->utc()->format('Y-m-d H:i:s');

            $overlappingVisit = GymAttendance::query()
                ->where('user_id', $coach->id)
                ->whereIn('status', ['present', 'left'])
                ->where('check_in_at', '<', $endUtc)
                ->where(function (Builder $query) use ($startUtc) {
                    $query->whereNull('check_out_at')
                        ->orWhere('check_out_at', '>', $startUtc);
                })
                ->exists();

            if ($overlappingVisit) {
                throw ValidationException::withMessages([
                    'date' => 'Ce coach a une visite qui recouvre cette journée.',
                ]);
            }

            $row = GymAttendance::query()->create([
                'user_id' => $coach->id,
                'role' => 'coach',
                'date' => $day,
                'status' => 'absent',
                'check_in_at' => null,
                'check_out_at' => null,
                'note' => $data['note'] ?? null,
                'recorded_by' => $admin->id,
            ]);

            return $row->load('person');
        }, 3);
    }

    private function parseUtc(string $value, string $field): Carbon
    {
        try {
            return Carbon::parse($value, config('gym.timezone', 'Africa/Casablanca'))->utc();
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                $field => 'Date et heure invalides.',
            ]);
        }
    }

    private function assertNotFuture(Carbon $when, string $field): void
    {
        if ($when->greaterThan(now('UTC')->addMinute())) {
            throw ValidationException::withMessages([
                $field => 'La date et l’heure ne peuvent pas être dans le futur.',
            ]);
        }
    }
}
