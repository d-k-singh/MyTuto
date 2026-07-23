<?php

namespace Tests\Feature\Api\Teacher;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_view_own_profile(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id, 'display_name' => 'Ms. Sharma']);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/teacher/profile');

        $response->assertOk()->assertJsonPath('profile.display_name', 'Ms. Sharma');
    }

    public function test_teacher_can_update_own_profile(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/teacher/profile', [
            'display_name' => 'Ms. Sharma',
            'bio' => 'Ten years teaching IB Mathematics.',
            'country' => 'India',
            'city' => 'Bengaluru',
            'teaching_mode' => 'online',
            'years_experience' => 10,
            'date_of_birth' => '1990-01-01',
        ]);

        $response->assertOk()
            ->assertJsonPath('profile.display_name', 'Ms. Sharma')
            ->assertJsonPath('profile.teaching_mode', 'online')
            ->assertJsonPath('profile.years_experience', 10);

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'city' => 'Bengaluru',
        ]);
    }

    public function test_update_reports_completion_percentage(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/teacher/profile', [
            'display_name' => 'Ms. Sharma',
        ]);

        // 1 of 9 completion fields filled in.
        $response->assertOk()->assertJsonPath('profile.completion_percentage', 11);
    }

    public function test_update_rejects_teacher_under_eighteen(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/teacher/profile', [
            'date_of_birth' => now()->subYears(16)->toDateString(),
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('date_of_birth');
    }

    public function test_update_rejects_invalid_teaching_mode(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/teacher/profile', [
            'teaching_mode' => 'telepathy',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('teaching_mode');
    }

    public function test_update_cannot_self_verify(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/teacher/profile', [
            'identity_verified' => true,
            'is_approved' => true,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('teacher_profiles', [
            'user_id' => $user->id,
            'identity_verified' => false,
            'is_approved' => false,
        ]);
    }

    public function test_student_cannot_access_teacher_profile_routes(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/teacher/profile')->assertForbidden();
        $this->actingAs($student, 'sanctum')->putJson('/api/teacher/profile', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/teacher/profile')->assertUnauthorized();
    }
}
