<?php

namespace Tests\Feature;

use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseSession;
use App\Models\MemberSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GymBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role, 'status' => 'active']);
    }

    private function createCourseSession(User $coach, bool $past = false): CourseSession
    {
        $course = Course::create(['name' => 'Yoga', 'coach_id' => $coach->id, 'status' => 'active']);
        $start = now('Africa/Casablanca')->startOfDay()->addDays($past ? -1 : 1)->setTime(15, 0);
        CoachAvailability::firstOrCreate([
            'coach_id' => $coach->id, 'day_of_week' => $start->dayOfWeek,
            'start_time' => '08:00:00', 'end_time' => '20:00:00',
        ], ['is_active' => true]);
        return CourseSession::create([
            'course_id' => $course->id, 'coach_id' => $coach->id,
            'start_at' => $start->copy()->utc(), 'end_at' => $start->copy()->addHour()->utc(),
            'status' => $past ? 'completed' : 'scheduled', 'capacity' => 8, 'location' => 'Salle 1',
        ]);
    }

    private function reservation(CourseSession $session, User $member): CourseEnrollment
    {
        return $session->enrollments()->create([
            'member_id' => $member->id, 'status' => 'confirmed', 'price_at_booking' => 0,
            'enrolled_at' => now('UTC'),
        ]);
    }

    public function test_reserved_session_cannot_change_course_coach_or_time_but_can_change_capacity_and_cancel(): void
    {
        $admin = $this->user('admin');
        $coach = $this->user('coach');
        $session = $this->createCourseSession($coach);
        $member = $this->user('member');
        $reservation = $this->reservation($session, $member);
        $url = "/api/admin/course-sessions/{$session->id}";
        $this->actingAs($admin)->putJson($url, ['start_at' => $session->start_at->copy()->addMinutes(10)->toIso8601String()])->assertUnprocessable();
        $this->putJson($url, ['coach_id' => $this->user('coach')->id])->assertUnprocessable();
        $other = Course::create(['name' => 'Boxe', 'coach_id' => $coach->id, 'status' => 'active']);
        $this->putJson($url, ['course_id' => $other->id])->assertUnprocessable();
        $this->putJson($url, ['capacity' => 10, 'location' => 'Salle 2'])->assertOk();
        $this->assertSame(10, $session->fresh()->capacity);
        $this->putJson($url, ['status' => 'cancelled'])->assertOk();
        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('cancelled', $reservation->fresh()->status);
        $this->assertNotNull($reservation->fresh()->cancelled_at);
    }

    public function test_block_and_archive_cancel_future_reservations_but_keep_history(): void
    {
        $admin = $this->user('admin');
        $coach = $this->user('coach');
        $member = $this->user('member');
        $member->forceFill(['remember_token' => 'demo-test-token'])->save();
        $future = $this->reservation($this->createCourseSession($coach), $member);
        $past = $this->reservation($this->createCourseSession($coach, true), $member);
        $url = "/api/admin/members/{$member->id}";
        $this->actingAs($admin)->putJson($url, ['status' => 'inactive'])->assertOk();
        $this->assertSame('cancelled', $future->fresh()->status);
        $this->assertSame('confirmed', $past->fresh()->status);
        $this->assertNull($member->fresh()->remember_token);
        $this->putJson($url, ['status' => 'active'])->assertOk();
        $future->update(['status' => 'confirmed', 'cancelled_at' => null]);
        $this->deleteJson($url)->assertOk();
        $this->assertSoftDeleted('users', ['id' => $member->id]);
        $this->assertSame('cancelled', $future->fresh()->status);
        $this->assertSame('confirmed', $past->fresh()->status);
    }

    public function test_member_can_browse_without_subscription_but_cannot_check_in_or_book(): void
    {
        $member = $this->user('member');
        $admin = $this->user('admin');
        $session = $this->createCourseSession($this->user('coach'));
        $this->actingAs($member)->getJson('/api/member/courses')->assertOk();
        $this->getJson('/api/member/course-sessions')->assertOk();
        $this->postJson("/api/member/course-sessions/{$session->id}/reservations")->assertUnprocessable();
        $input = ['person_id' => $member->id, 'occurred_at' => now('UTC')->toIso8601String()];
        $this->actingAs($admin)->postJson('/api/admin/attendance/members/check-in', $input)->assertJsonValidationErrors('person_id');
        $plan = SubscriptionPlan::create(['name' => 'Formule générale', 'type' => 'general', 'price' => 300,
            'duration_unit' => 'month', 'duration_value' => 1, 'status' => 'active']);
        $sub = MemberSubscription::create(['member_id' => $member->id, 'plan_id' => $plan->id,
            'starts_at' => now('Africa/Casablanca')->subDays(2)->toDateString(),
            'ends_at' => now('Africa/Casablanca')->addDays(5)->toDateString(), 'status' => 'pending', 'price_at_purchase' => 300]);
        $this->postJson('/api/admin/attendance/members/check-in', $input)->assertJsonValidationErrors('person_id');
        $sub->update(['status' => 'active']);
        $this->postJson('/api/admin/attendance/members/check-in', $input)->assertCreated();
    }

    public function test_member_sees_and_filters_absence_and_unmarked_attendance(): void
    {
        $coach = $this->user('coach');
        $member = $this->user('member');
        $session = $this->createCourseSession($coach, true);
        $reservation = $this->reservation($session, $member);
        $this->actingAs($member)->getJson('/api/member/reservations?status=unmarked')
            ->assertOk()->assertJsonPath('reservations.data.0.display_status', 'unmarked');
        $this->actingAs($coach)->patchJson("/api/coach/attendance/sessions/{$session->id}/enrollments/{$reservation->id}", ['status' => 'absent'])->assertOk();
        $this->actingAs($member)->getJson('/api/member/reservations?status=absent')->assertOk()
            ->assertJsonPath('reservations.data.0.attendance_status', 'absent')
            ->assertJsonPath('reservations.data.0.display_status', 'absent');
        $this->getJson('/api/member/reservations?status=confirmed')->assertJsonPath('reservations.total', 0);
        $this->actingAs($coach)->patchJson("/api/coach/attendance/sessions/{$session->id}/enrollments/{$reservation->id}", ['status' => 'present'])->assertOk();
        $this->actingAs($member)->getJson('/api/member/reservations?status=attended')->assertOk()
            ->assertJsonPath('reservations.data.0.display_status', 'attended');
    }
}
