<?php

namespace Tests\Feature\Api;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherEnquiryTest extends TestCase
{
    use RefreshDatabase;

    private function makeTeacherProfile(): TeacherProfile
    {
        $user = User::factory()->teacher()->create();

        return TeacherProfile::create(['user_id' => $user->id, 'display_name' => 'Ms. Sharma']);
    }

    public function test_student_can_submit_an_enquiry(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/tutors/{$teacherProfile->id}/enquiries", [
                'message' => 'Is Tuesday evening availability still open?',
            ]);

        $response->assertCreated()
            ->assertJsonPath('enquiry.status', 'pending')
            ->assertJsonPath('enquiry.message', 'Is Tuesday evening availability still open?');

        $this->assertDatabaseHas('teacher_enquiries', [
            'user_id' => $student->id,
            'teacher_profile_id' => $teacherProfile->id,
            'status' => 'pending',
        ]);
    }

    public function test_enquiry_requires_a_message(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/tutors/{$teacherProfile->id}/enquiries", []);

        $response->assertUnprocessable()->assertJsonValidationErrors('message');
    }

    public function test_enquiry_subject_id_is_optional(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/tutors/{$teacherProfile->id}/enquiries", ['message' => 'General question.']);

        $response->assertCreated()->assertJsonPath('enquiry.subject_id', null);
    }

    public function test_teacher_role_cannot_submit_an_enquiry(): void
    {
        $teacherProfile = $this->makeTeacherProfile();
        $otherTeacher = User::factory()->teacher()->create();

        $this->actingAs($otherTeacher, 'sanctum')
            ->postJson("/api/tutors/{$teacherProfile->id}/enquiries", ['message' => 'Hi'])
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $teacherProfile = $this->makeTeacherProfile();

        $this->postJson("/api/tutors/{$teacherProfile->id}/enquiries", ['message' => 'Hi'])->assertUnauthorized();
    }
}
