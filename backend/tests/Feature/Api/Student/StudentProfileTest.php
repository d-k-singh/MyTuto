<?php

namespace Tests\Feature\Api\Student;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_own_profile(): void
    {
        $user = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $user->id, 'learning_goal' => 'Exam prep']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/student/profile');

        $response->assertOk()->assertJsonPath('profile.learning_goal', 'Exam prep');
    }

    public function test_student_can_update_own_profile(): void
    {
        $user = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/student/profile', [
            'date_of_birth' => '2010-01-01',
            'gender' => 'female',
            'country' => 'India',
            'city' => 'Mumbai',
            'learning_goal' => 'Exam Prep',
        ]);

        $response->assertOk()
            ->assertJsonPath('profile.city', 'Mumbai')
            ->assertJsonPath('profile.learning_goal', 'Exam Prep')
            ->assertJsonPath('profile.is_minor', true);

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $user->id,
            'city' => 'Mumbai',
        ]);
    }

    public function test_is_minor_is_null_when_date_of_birth_unknown(): void
    {
        $user = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/student/profile');

        $response->assertOk()->assertJsonPath('profile.is_minor', null);
    }

    public function test_adult_student_is_not_flagged_as_minor(): void
    {
        $user = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/student/profile', [
            'date_of_birth' => now()->subYears(25)->toDateString(),
        ]);

        $response->assertOk()->assertJsonPath('profile.is_minor', false);
    }

    public function test_update_rejects_future_date_of_birth(): void
    {
        $user = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/student/profile', [
            'date_of_birth' => now()->addDay()->toDateString(),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('date_of_birth');
    }

    public function test_student_cannot_self_declare_parent_link_or_consent(): void
    {
        $user = User::factory()->student()->create();
        $otherUser = User::factory()->parent()->create();
        StudentProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/student/profile', [
            'parent_user_id' => $otherUser->id,
            'parental_consent_given' => true,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $user->id,
            'parent_user_id' => null,
            'parental_consent_given' => false,
        ]);
    }

    public function test_teacher_cannot_access_student_profile_routes(): void
    {
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/student/profile')->assertForbidden();
        $this->actingAs($teacher, 'sanctum')->putJson('/api/student/profile', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/student/profile')->assertUnauthorized();
    }
}
