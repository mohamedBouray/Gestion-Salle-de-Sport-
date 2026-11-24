<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GymWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_simulation_is_idempotent_and_controls_access_to_the_course(): void
    {
        $admin = $this->user('admin');
        $member = $this->user('member');
        $coach = $this->user('coach');
        $course = $this->course($coach);
        $subscription = $this->subscription($member, $course);
        $activate = "/api/admin/memberships/{$subscription->id}/activate";
        $checkout = "/api/member/memberships/{$subscription->id}/checkout";
        $this->actingAs($admin)->patchJson($activate)->assertUnprocessable();
        $this->actingAs($this->user('member'))->postJson($checkout, ['method' => 'demo'])->assertNotFound();
        $this->actingAs($member)->postJson($checkout, ['method' => 'cash'])->assertUnprocessable();

        $this->actingAs($admin)->postJson('/api/admin/payments', [
            'member_id' => $member->id,
            'subscription_id' => $subscription->id,
            'amount' => '50.00',
            'method' => 'demo',
            'paid_at' => now('Africa/Casablanca')->subMinute()->format('Y-m-d\TH:i'),
        ])->assertCreated()->assertJsonPath('payment.status', 'simulated');
        $this->patchJson($activate)->assertUnprocessable();

        $payment = $this->actingAs($member)->postJson($checkout, ['method' => 'demo'])
            ->assertCreated()->assertJsonPath('payment.amount', '150.00');
        $this->postJson($checkout, ['method' => 'demo'])->assertCreated()
            ->assertJsonPath('payment.id', $payment->json('payment.id'));
        $this->assertDatabaseCount('payments', 2);

        $this->actingAs($admin)->patchJson($activate)->assertOk()
            ->assertJsonPath('membership.remaining_amount', '0.00')
            ->assertJsonPath('membership.simulated_amount', '200.00')
            ->assertJsonPath('membership.paid_amount', '0.00');
        $dashboard = $this->getJson('/api/admin/dashboard')->assertOk();
        $this->assertEquals(200, $dashboard->json('summary.simulated_total'));
        $this->assertEquals(0, $dashboard->json('summary.revenue_paid'));
        $this->assertEquals(200, array_sum(array_column($dashboard->json('charts.simulated_payments'), 'value')));

        $session = $this->scheduledSession($course, $coach);
        $otherSession = $this->scheduledSession($this->course($coach), $coach);
        $this->actingAs($member)->getJson('/api/member/courses')->assertOk()
            ->assertJsonFragment(['price' => '200.00', 'duration_unit' => 'month']);
        $this->postJson("/api/member/course-sessions/{$otherSession->id}/reservations")->assertUnprocessable();
        $booking = $this->postJson("/api/member/course-sessions/{$session->id}/reservations")->assertCreated();
        $this->assertEquals(0, $booking->json('reservation.price_at_booking'));

        $cancel = "/api/admin/memberships/{$subscription->id}/cancel";
        $this->actingAs($admin)->patchJson($cancel)->assertJsonValidationErrors('membership');
        $this->actingAs($member)->deleteJson('/api/member/reservations/' . $booking->json('reservation.id'))->assertOk();
        $this->actingAs($admin)->patchJson($cancel)->assertOk();
    }

    public function test_simulated_refund_is_allowed_after_expiration(): void
    {
        $member = $this->user('member');
        $subscription = $this->subscription($member, $this->course($this->user('coach')));
        $subscription->update(['status' => 'active', 'ends_at' => now('Africa/Casablanca')->subDay()->toDateString()]);
        $payment = $subscription->payments()->create([
            'member_id' => $member->id, 'amount' => '200.00', 'method' => 'demo', 'status' => 'simulated',
        ]);

        $this->actingAs($this->user('admin'))->patchJson("/api/admin/payments/{$payment->id}/refund")
            ->assertOk()->assertJsonPath('payment.status', 'refunded');
    }

    public function test_course_validation_and_coach_deactivation(): void
    {
        $admin = $this->user('admin');
        $coach = $this->user('coach');
        $this->actingAs($admin)->postJson('/api/admin/courses', ['name' => '123', 'status' => 'active'])
            ->assertJsonValidationErrors('name');
        $result = $this->postJson('/api/admin/courses', [
            'name' => 'Yoga', 'coach_id' => $coach->id, 'status' => 'active',
        ])->assertCreated()->assertJsonPath('course.price', '0.00');

        $course = Course::findOrFail($result->json('course.id'));
        $this->putJson("/api/admin/courses/{$course->id}", ['status' => null])->assertJsonValidationErrors('status');
        $session = $this->scheduledSession($course, $coach);
        $this->putJson("/api/admin/coaches/{$coach->id}", ['status' => 'inactive'])->assertJsonValidationErrors('status');
        $this->deleteJson("/api/admin/coaches/{$coach->id}")->assertJsonValidationErrors('status');

        // Legacy records can already have an inactive coach assigned.
        $coach->forceFill(['status' => 'inactive'])->save();
        $member = $this->user('member');
        $this->subscription($member, $course)->update(['status' => 'active']);
        $this->actingAs($member)->postJson("/api/member/course-sessions/{$session->id}/reservations")
            ->assertJsonValidationErrors('session_id');
        $this->getJson('/api/member/course-sessions')->assertOk()->assertJsonCount(0, 'sessions.data');
    }

    public function test_course_image_upload_and_replacement(): void
    {
        Storage::fake('public');
        $this->actingAs($this->user('member'))->postJson('/api/admin/courses', [
            'name' => 'Yoga', 'status' => 'active',
        ])->assertForbidden();
        $this->actingAs($this->user('admin'))->post('/api/admin/courses', [
            'name' => 'Yoga', 'status' => 'active',
            'image' => UploadedFile::fake()->create('invalid.txt', 3, 'text/plain'),
        ], ['Accept' => 'application/json'])->assertJsonValidationErrors('image');
        $created = $this->post('/api/admin/courses', [
            'name' => 'Yoga', 'status' => 'active', 'image' => UploadedFile::fake()->image('first.jpg'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $oldImage = $created->json('course.image');
        Storage::disk('public')->assertExists($oldImage);

        $id = $created->json('course.id');
        $updated = $this->post("/api/admin/courses/{$id}", [
            '_method' => 'PUT', 'image' => UploadedFile::fake()->image('second.jpg'),
        ], ['Accept' => 'application/json'])->assertOk();
        Storage::disk('public')->assertMissing($oldImage);
        Storage::disk('public')->assertExists($updated->json('course.image'));
    }

    public function test_first_admin_requires_a_session_and_the_setup_key(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Initial setup uses a MySQL advisory lock.');
        }

        config([
            'auth.allow_initial_admin_registration' => true,
            'auth.initial_admin_setup_key' => 'setup-test-key',
        ]);
        $data = [
            'name' => 'Initial Admin',
            'email' => 'first@example.com',
            'password' => 'TestPassword12',
            'password_confirmation' => 'TestPassword12',
        ];
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->getJson('/api/setup-status')->assertOk();
        }
        $this->postJson('/api/register', $data + ['setup_key' => 'setup-test-key'])->assertStatus(419);
        $this->withHeader('Origin', 'http://localhost:3000')->postJson('/api/register', $data)
            ->assertJsonValidationErrors('setup_key');
        $this->assertDatabaseCount('users', 0);
        $this->postJson('/api/register', $data + ['setup_key' => 'setup-test-key'])
            ->assertCreated()->assertJsonPath('user.role', 'admin');
    }

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role, 'status' => 'active']);
    }

    private function course(User $coach): Course
    {
        return Course::create(['name' => 'Yoga', 'status' => 'active', 'coach_id' => $coach->id]);
    }

    private function subscription(User $member, Course $course): MemberSubscription
    {
        $plan = SubscriptionPlan::create([
            'name' => 'Yoga mensuel', 'type' => 'course', 'course_id' => $course->id,
            'duration_unit' => 'month', 'duration_value' => 1, 'price' => '200.00', 'status' => 'active',
        ]);

        return MemberSubscription::create([
            'plan_id' => $plan->id, 'member_id' => $member->id, 'price_at_purchase' => '200.00',
            'starts_at' => now('Africa/Casablanca')->subDays(2)->toDateString(),
            'ends_at' => now('Africa/Casablanca')->addMonth()->toDateString(),
            'status' => 'pending',
        ]);
    }

    private function scheduledSession(Course $course, User $coach): CourseSession
    {
        return CourseSession::create([
            'course_id' => $course->id, 'coach_id' => $coach->id, 'status' => 'scheduled',
            'start_at' => now('UTC')->addDay(), 'end_at' => now('UTC')->addDay()->addHour(), 'capacity' => 8,
        ]);
    }
}
