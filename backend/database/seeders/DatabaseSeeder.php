<?php

namespace Database\Seeders;

use App\Models\CoachAvailability;
use App\Models\ContactMessage;
use App\Models\Course;
use App\Models\CourseProposal;
use App\Models\GymAttendance;
use App\Models\MemberSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = (string) env('GYM_DEMO_PASSWORD', '');
        if (!app()->environment(['local', 'testing']) || strlen($password) < 8 || strlen($password) > 72) {
            throw new RuntimeException('Utilisez local/testing et GYM_DEMO_PASSWORD (8 à 72 octets).');
        }

        DB::transaction(function () use ($password): void {
            // This dedicated tariff is also the completion marker. A second run
            // leaves existing demo data untouched instead of resetting user edits.
            $marker = 'Bouray Démo — Accès complet mensuel';
            if (SubscriptionPlan::withTrashed()->where('name', $marker)->exists()) {
                $this->command?->warn('Jeu de données Bouray Démo déjà installé : aucune modification.');
                return;
            }

            $today = CarbonImmutable::now(config('gym.timezone', 'Africa/Casablanca'))->startOfDay();
            $admin = $this->account('admin@gmail.com', 'Admin Bouray Gym', User::ADMIN, 'active', $password, null, true);

            $general = SubscriptionPlan::create([
                'name' => $marker, 'type' => 'general', 'price' => '300.00',
                'duration_unit' => 'month', 'duration_value' => 1, 'status' => 'active',
                'description' => 'Accès à tous les cours collectifs de la salle sur réservation.',
            ]);
            SubscriptionPlan::create([
                'name' => 'Bouray Démo — Accès complet trimestriel', 'type' => 'general',
                'price' => '800.00', 'duration_unit' => 'month', 'duration_value' => 3,
                'status' => 'active', 'description' => 'Trois mois de cours collectifs inclus.',
            ]);
            SubscriptionPlan::create([
                'name' => 'Bouray Démo — Ancienne formule', 'type' => 'general',
                'price' => '280.00', 'duration_unit' => 'month', 'duration_value' => 1,
                'status' => 'inactive',
            ]);

            $coachData = [
                ['nora', 'Nora Bennis', 'Yoga et Pilates', 6, 'active'],
                ['amine', 'Amine Alaoui', 'Boxe fitness et HIIT', 8, 'active'],
                ['hajar', 'Hajar Tazi', 'Zumba', 4, 'pending'],
                ['mehdi', 'Mehdi Idrissi', 'Musculation', 5, 'pending'],
                ['imane', 'Imane Fassi', 'Cycling', 3, 'pending'],
            ];
            $coaches = [];
            foreach ($coachData as $i => [$slug, $name, $specialty, $experience, $status]) {
                $coach = $this->account("coach.$slug@example.test", $name, User::COACH, $status, $password, $admin);
                $coach->coachProfile()->create([
                    'specialty' => $specialty, 'experience_years' => $experience,
                    'bio' => "Coach spécialisé en $specialty, accompagnement adapté à chaque niveau.",
                    'is_featured' => $i === 0,
                ]);
                if ($status === 'active') {
                    // Four teaching days, matching the seeded session dates.
                    $weekdays = array_unique(array_map(fn (int $offset) => $today->addDays($offset)->dayOfWeek, [-7, -3, 2, 6]));
                    foreach ($weekdays as $weekday) {
                        CoachAvailability::create([
                            'coach_id' => $coach->id, 'day_of_week' => $weekday,
                            'start_time' => $i === 0 ? '09:00:00' : '10:00:00',
                            'end_time' => $i === 0 ? '18:30:00' : '19:30:00', 'is_active' => true,
                        ]);
                    }
                }
                $coaches[] = $coach;
            }

            $names = [
                'Salma Amrani', 'Yassine El Idrissi', 'Sara Bennani', 'Omar Berrada',
                'Lina Tahiri', 'Hamza El Fassi', 'Aya Chraibi', 'Anas Lahlou',
                'Mariam Tazi', 'Bilal Mansouri', 'Kenza Slaoui', 'Adam Naciri',
                'Nadia Alaoui', 'Rayan Amrani', 'Sofia Bennis', 'Ismail Rami',
                'Yasmine El Alami', 'Zakaria Tazi', 'Malak Idrissi', 'Reda Fadili',
            ];
            $members = [];
            foreach ($names as $i => $name) {
                $status = $i < 16 ? 'active' : ($i < 19 ? 'pending' : 'inactive');
                $members[] = $this->account(sprintf('member%02d@example.test', $i + 1), $name, User::MEMBER, $status, $password, $admin);
            }

            $offers = [
                ['Yoga', 'Mobilité, respiration et souplesse, tous niveaux.', 0, '200.00', 12, 10, 'Salle Zen'],
                ['Pilates', 'Renforcement profond et amélioration de la posture.', 0, '220.00', 14, 17, 'Salle Zen'],
                ['Boxe fitness', 'Cardio et techniques de boxe sans contact.', 1, '250.00', 16, 11, 'Studio Cardio'],
                ['HIIT', 'Circuit cardio et renforcement musculaire.', 1, '230.00', 15, 18, 'Studio Cardio'],
            ];
            $plans = [];
            $sessions = [];
            foreach ($offers as $i => [$title, $description, $coachIndex, $price, $capacity, $hour, $location]) {
                $coach = $coaches[$coachIndex];
                $course = Course::create([
                    'name' => "Démo — $title", 'description' => $description,
                    'created_by_user_id' => $admin->id, 'coach_id' => $coach->id,
                    'price' => '0.00', 'status' => 'active',
                ]);
                $plans[$i] = SubscriptionPlan::create([
                    'name' => "Bouray Démo — $title mensuel", 'type' => 'course', 'course_id' => $course->id,
                    'price' => $price, 'duration_unit' => 'month', 'duration_value' => 1, 'status' => 'active',
                    'description' => "Accès aux séances de $title sur réservation.",
                ]);
                foreach ([-7, -3, 2, 6] as $offset) {
                    $start = $today->addDays($offset)->setTime($hour, 0);
                    $sessions[$i][$offset] = $course->sessions()->create([
                        'coach_id' => $coach->id, 'start_at' => $start->utc(), 'end_at' => $start->addHour()->utc(),
                        'capacity' => $capacity, 'location' => $location,
                        'status' => $offset < 0 ? 'completed' : 'scheduled',
                    ]);
                }
            }
            foreach (['Zumba' => 'pending', 'Cycling' => 'inactive'] as $title => $status) {
                Course::create([
                    'name' => "Démo — $title", 'description' => 'Cours sans séance ouverte pour le moment.',
                    'created_by_user_id' => $admin->id, 'coach_id' => null,
                    'price' => '0.00', 'status' => $status,
                ]);
            }

            // Members 1–8: all courses; members 9–12: one specific course each.
            // Members 13–14: expired; members 15–16: waiting for payment/activation.
            foreach (range(0, 15) as $i) {
                $plan = ($i >= 8 && $i < 12) ? $plans[$i - 8] : $general;
                $start = $today->addDays($i < 12 ? -12 : ($i < 14 ? -45 : 0));
                $status = $i < 12 ? 'active' : ($i < 14 ? 'expired' : 'pending');
                $sub = $this->subscription($members[$i], $plan, $start, $status);
                if ($status !== 'pending') {
                    $sub->payments()->create([
                        'member_id' => $members[$i]->id, 'recorded_by_user_id' => $admin->id,
                        'amount' => $sub->price_at_purchase, 'method' => 'demo', 'status' => 'simulated',
                        'paid_at' => $start->setTime(8, 0)->utc(), 'reference' => 'BOURAY-DEMO-' . $sub->id,
                        'notes' => 'Paiement fictif de démonstration, aucun argent réel.',
                    ]);
                } elseif ($i === 14) {
                    $sub->payments()->create([
                        'member_id' => $members[$i]->id, 'amount' => $sub->price_at_purchase,
                        'method' => 'demo', 'status' => 'simulated',
                        'paid_at' => now('UTC'), 'reference' => 'BOURAY-DEMO-' . $sub->id,
                        'notes' => 'Simulation effectuée, activation administrative en attente.',
                    ]);
                }
            }

            foreach ($sessions as $courseIndex => $dates) {
                $participants = [$members[$courseIndex * 2], $members[$courseIndex * 2 + 1], $members[8 + $courseIndex]];
                foreach ($dates as $offset => $session) {
                    foreach ($participants as $j => $member) {
                        $past = $offset < 0;
                        $absent = $past && $j === 2 && $offset === -3;
                        $enrollment = $session->enrollments()->create([
                            'member_id' => $member->id, 'price_at_booking' => '0.00',
                            'status' => $past && !$absent ? 'attended' : 'confirmed',
                            'enrolled_at' => $today->addDays(-10)->setTime(8, 0)->utc(),
                        ]);
                        if ($past) {
                            $enrollment->forceFill([
                                'attendance_status' => $absent ? 'absent' : 'present',
                                'attendance_marked_at' => $session->end_at,
                                'attendance_marked_by_user_id' => $session->coach_id,
                            ])->save();
                        }
                    }
                }
            }
            // A cancelled upcoming reservation remains visible in history.
            $sessions[0][6]->enrollments()->create([
                'member_id' => $members[2]->id, 'price_at_booking' => '0.00', 'status' => 'cancelled',
                'enrolled_at' => $today->addDays(-2)->setTime(9, 0)->utc(),
                'cancelled_at' => $today->subDay()->setTime(10, 0)->utc(),
            ]);

            // Gym check-in history is distinct from course attendance.
            foreach (array_merge(array_slice($members, 0, 12), array_slice($coaches, 0, 2)) as $i => $person) {
                $day = $today->subDays(1 + ($i % 5));
                $checkIn = $day->setTime(9 + ($i % 5), 0);
                GymAttendance::create([
                    'user_id' => $person->id, 'role' => $person->role, 'date' => $day->toDateString(),
                    'check_in_at' => $checkIn->utc(), 'check_out_at' => $checkIn->addHours(2)->utc(),
                    'status' => 'left', 'recorded_by' => $admin->id, 'note' => 'Pointage de démonstration.',
                ]);
            }

            foreach ([['Stretching', 0, 45, 12], ['Circuit training', 1, 60, 15]] as [$title, $coachIndex, $duration, $capacity]) {
                CourseProposal::create([
                    'coach_id' => $coaches[$coachIndex]->id, 'name' => "Démo — $title",
                    'description' => 'Proposition de nouveau cours collectif.', 'suggested_duration_minutes' => $duration,
                    'suggested_capacity' => $capacity, 'status' => 'pending',
                ]);
            }
            foreach ([['Renseignements abonnements', 'Quels sont les tarifs mensuels ?', 'new'],
                      ['Horaires Yoga', 'Proposez-vous des cours le week-end ?', 'read'],
                      ['Séance découverte', 'Comment réserver une séance ?', 'replied']] as $i => [$subject, $message, $status]) {
                ContactMessage::create([
                    'name' => "Visiteur démo " . ($i + 1), 'email' => 'visitor' . ($i + 1) . '@example.test',
                    'subject' => $subject, 'message' => $message, 'status' => $status,
                    'read_at' => $status === 'new' ? null : now('UTC'),
                    'replied_at' => $status === 'replied' ? now('UTC') : null,
                ]);
            }
            $this->command?->info('Bouray Démo : données créées. Aucun e-mail envoyé, aucun paiement réel.');
        });
    }

    private function account(string $email, string $name, string $role, string $status, string $password, ?User $admin, bool $reuseAdmin = false): User
    {
        $existing = User::withTrashed()->where('email', $email)->first();
        if ($existing) {
            if ($reuseAdmin && !$existing->trashed() && $existing->role === User::ADMIN && $existing->status === 'active') {
                return $existing; // Never reset an existing administrator password.
            }
            throw new RuntimeException("Compte existant incompatible avec le jeu de démonstration : $email");
        }
        $user = new User(['email' => $email, 'name' => $name, 'password' => Hash::make($password)]);
        $user->forceFill([
            'role' => $role, 'status' => $status, 'created_by_user_id' => $admin?->id,
            'email_verified_at' => $status === 'pending' ? null : now('UTC'),
        ])->save();
        return $user;
    }

    private function subscription(User $member, SubscriptionPlan $plan, CarbonImmutable $start, string $status): MemberSubscription
    {
        return MemberSubscription::create([
            'member_id' => $member->id, 'plan_id' => $plan->id, 'starts_at' => $start->toDateString(),
            'ends_at' => $start->addMonthNoOverflow()->subDay()->toDateString(),
            'price_at_purchase' => $plan->price, 'status' => $status,
        ]);
    }
}
