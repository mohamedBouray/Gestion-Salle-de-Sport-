<?php

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TariffService
{
    private const TYPES = ['general', 'course'];

    // Liste + filtres + statistiques
    public function list(array $filters): array
    {
        $base = SubscriptionPlan::query()
            ->whereIn('type', self::TYPES);

        $query = clone $base;

        $search = trim($filters['search'] ?? '');

        if ($search !== '') {
            $query->where(
                'name',
                'like',
                '%' . $search . '%'
            );
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $plans = $query
            ->with([
                'course' => fn ($query) =>
                    $query->withTrashed()
                        ->select('id', 'name'),
            ])
            ->withCount('subscriptions')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 9)
            ->withQueryString();

        $plans->through(
            fn (SubscriptionPlan $plan): array =>
                $this->present($plan)
        );

        return [
            'plans' => $plans,

            'stats' => [
                'total' => (clone $base)->count(),

                'active' => (clone $base)
                    ->where('status', 'active')
                    ->count(),

                'inactive' => (clone $base)
                    ->where('status', 'inactive')
                    ->count(),
            ],
        ];
    }

    // Création d'une formule
    public function create(array $data): array
    {
        $this->assertAvailableCourse(
            $data['type'],
            $data['course_id'] ?? null,
            $data['status']
        );

        $plan = SubscriptionPlan::query()->create(
            $this->attributes($data)
        );

        return $this->present(
            $this->loadPlan($plan)
        );
    }

    // Modification d'une formule
    public function update(
        SubscriptionPlan $tariff,
        array $data
    ): array {
        $plan = DB::transaction(
            function () use ($tariff, $data): SubscriptionPlan {

                $current = SubscriptionPlan::query()
                    ->whereIn('type', self::TYPES)
                    ->whereKey($tariff->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                $newCourseId = $data['type'] === 'course'
                    ? (int) $data['course_id']
                    : null;

                $associationChanged =
                    $current->type !== $data['type']
                    || (
                        $current->course_id === null
                            ? null
                            : (int) $current->course_id
                    ) !== $newCourseId;

                // Protéger les abonnements existants
                if (
                    $associationChanged
                    && $current->subscriptions()->exists()
                ) {
                    throw ValidationException::withMessages([
                        'type' =>
                            'Cette formule a déjà des abonnements. '
                            . 'Son type et son cours associé '
                            . 'ne peuvent plus changer.',
                    ]);
                }

                $this->assertAvailableCourse(
                    $data['type'],
                    $newCourseId,
                    $data['status']
                );

                $current->fill(
                    $this->attributes($data)
                );

                $current->save();

                return $current;
            },
            3
        );

        return $this->present(
            $this->loadPlan($plan)
        );
    }

    // Activation / désactivation
    public function changeStatus(
        SubscriptionPlan $tariff,
        string $status
    ): array {
        $plan = DB::transaction(
            function () use ($tariff, $status): SubscriptionPlan {

                $current = SubscriptionPlan::query()
                    ->whereIn('type', self::TYPES)
                    ->whereKey($tariff->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->assertAvailableCourse(
                    $current->type,
                    $current->course_id,
                    $status
                );

                $current->status = $status;
                $current->save();

                return $current;
            },
            3
        );

        return $this->present(
            $this->loadPlan($plan)
        );
    }

    // Préparer les champs du Model
    private function attributes(array $data): array
    {
        return [
            'name' => trim($data['name']),
            'type' => $data['type'],

            'course_id' =>
                $data['type'] === 'course'
                    ? (int) $data['course_id']
                    : null,

            'duration_value' =>
                (int) $data['duration_value'],

            'duration_unit' => $data['duration_unit'],
            'price' => $data['price'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'],
        ];
    }

    // Vérifier le cours associé
    private function assertAvailableCourse(
        string $type,
        ?int $courseId,
        string $status
    ): void {
        if (
            $type !== 'course'
            || $status !== 'active'
        ) {
            return;
        }

        $exists = Course::query()
            ->whereKey($courseId)
            ->where('status', 'active')
            ->exists();

        if (!$exists) {
            throw ValidationException::withMessages([
                'course_id' =>
                    'Pour activer ce tarif, '
                    . 'sélectionnez un cours actif.',
            ]);
        }
    }

    // Charger les relations
    private function loadPlan(
        SubscriptionPlan $plan
    ): SubscriptionPlan {
        return $plan
            ->load([
                'course' => fn ($query) =>
                    $query->withTrashed()
                        ->select('id', 'name'),
            ])
            ->loadCount('subscriptions');
    }

    // Format JSON compatible avec React
    private function present(
        SubscriptionPlan $plan
    ): array {
        return [
            'id' => (int) $plan->id,
            'name' => $plan->name,
            'type' => $plan->type,

            'course_id' =>
                $plan->course_id === null
                    ? null
                    : (int) $plan->course_id,

            'duration_value' =>
                (int) $plan->duration_value,

            'duration_unit' => $plan->duration_unit,
            'price' => $plan->price,
            'description' => $plan->description,
            'status' => $plan->status,

            'subscriptions_count' =>
                (int) ($plan->subscriptions_count ?? 0),

            'course' => $plan->course ? [
                'id' => (int) $plan->course->id,
                'name' => $plan->course->name,
            ] : null,

            'created_at' =>
                $plan->created_at?->toIso8601String(),

            'updated_at' =>
                $plan->updated_at?->toIso8601String(),
        ];
    }
}
