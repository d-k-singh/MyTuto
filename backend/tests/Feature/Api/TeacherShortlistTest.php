<?php

namespace Tests\Feature\Api;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherShortlistTest extends TestCase
{
    use RefreshDatabase;

    private function makeTeacherProfile(): TeacherProfile
    {
        $user = User::factory()->teacher()->create();

        return TeacherProfile::create(['user_id' => $user->id, 'display_name' => 'Ms. Sharma']);
    }

    public function test_student_can_shortlist_a_teacher(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/tutors/{$teacherProfile->id}/shortlist");

        $response->assertCreated();

        $this->assertDatabaseHas('teacher_shortlists', [
            'user_id' => $student->id,
            'teacher_profile_id' => $teacherProfile->id,
        ]);
    }

    public function test_shortlisting_twice_is_idempotent(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist")->assertCreated();
        $this->actingAs($student, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist")->assertCreated();

        $this->assertDatabaseCount('teacher_shortlists', 1);
    }

    public function test_student_can_remove_a_teacher_from_shortlist(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist")->assertCreated();
        $this->actingAs($student, 'sanctum')->deleteJson("/api/tutors/{$teacherProfile->id}/shortlist")->assertNoContent();

        $this->assertDatabaseMissing('teacher_shortlists', [
            'user_id' => $student->id,
            'teacher_profile_id' => $teacherProfile->id,
        ]);
    }

    public function test_index_returns_only_the_current_users_shortlist(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();
        $otherStudent = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist");
        $this->actingAs($otherStudent, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist");

        $response = $this->actingAs($student, 'sanctum')->getJson('/api/shortlist');

        $response->assertOk()->assertJsonCount(1, 'shortlist');
    }

    public function test_shortlisting_nonexistent_teacher_profile_returns_not_found(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->postJson('/api/tutors/999999/shortlist')->assertNotFound();
    }

    public function test_teacher_role_cannot_access_shortlist_routes(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/shortlist')->assertForbidden();
        $this->actingAs($teacher, 'sanctum')->postJson("/api/tutors/{$teacherProfile->id}/shortlist")->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/shortlist')->assertUnauthorized();
    }
}
