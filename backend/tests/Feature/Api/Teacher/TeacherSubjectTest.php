<?php

namespace Tests\Feature\Api\Teacher;

use App\Models\Subject;
use App\Models\SubjectCategory;
use App\Models\TeacherProfile;
use App\Models\TeacherSubject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSubjectTest extends TestCase
{
    use RefreshDatabase;

    private function makeSubject(array $overrides = []): Subject
    {
        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);

        return Subject::create(array_merge([
            'subject_category_id' => $category->id,
            'name' => 'Algebra',
            'slug' => 'algebra',
            'grade_levels' => ['Grade 9', 'Grade 10', 'Grade 11'],
            'is_active' => true,
        ], $overrides));
    }

    public function test_teacher_can_create_a_subject_offering(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);
        $subject = $this->makeSubject();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/teacher/subjects', [
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9', 'Grade 10'],
            'price_per_session_cp' => 500,
        ]);

        $response->assertCreated()
            ->assertJsonPath('subject.subject.name', 'Algebra')
            ->assertJsonPath('subject.price_per_session_cp', 500);

        $this->assertDatabaseHas('teacher_subjects', [
            'teacher_profile_id' => $user->teacherProfile->id,
            'subject_id' => $subject->id,
            'price_per_session_cp' => 500,
        ]);
    }

    public function test_create_requires_subject_grade_levels_and_price(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/teacher/subjects', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['subject_id', 'grade_levels', 'price_per_session_cp']);
    }

    public function test_create_rejects_duplicate_subject_for_same_teacher(): void
    {
        $user = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $user->id]);
        $subject = $this->makeSubject();

        TeacherSubject::create([
            'teacher_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/teacher/subjects', [
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 10'],
            'price_per_session_cp' => 500,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('subject_id');
    }

    public function test_create_rejects_grade_level_not_offered_by_the_subject(): void
    {
        $user = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $user->id]);
        $subject = $this->makeSubject();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/teacher/subjects', [
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 12'],
            'price_per_session_cp' => 500,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('grade_levels');
    }

    public function test_teacher_can_update_own_subject_offering(): void
    {
        $user = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $user->id]);
        $subject = $this->makeSubject();
        $teacherSubject = TeacherSubject::create([
            'teacher_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/teacher/subjects/{$teacherSubject->id}", ['price_per_session_cp' => 600]);

        $response->assertOk()->assertJsonPath('subject.price_per_session_cp', 600);
    }

    public function test_teacher_cannot_update_another_teachers_subject_offering(): void
    {
        $owner = User::factory()->teacher()->create();
        $ownerProfile = TeacherProfile::create(['user_id' => $owner->id]);
        $intruder = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $intruder->id]);
        $subject = $this->makeSubject();
        $teacherSubject = TeacherSubject::create([
            'teacher_profile_id' => $ownerProfile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $this->actingAs($intruder, 'sanctum')
            ->putJson("/api/teacher/subjects/{$teacherSubject->id}", ['price_per_session_cp' => 999])
            ->assertForbidden();

        $this->assertDatabaseHas('teacher_subjects', ['id' => $teacherSubject->id, 'price_per_session_cp' => 400]);
    }

    public function test_teacher_can_delete_own_subject_offering(): void
    {
        $user = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $user->id]);
        $subject = $this->makeSubject();
        $teacherSubject = TeacherSubject::create([
            'teacher_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/teacher/subjects/{$teacherSubject->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('teacher_subjects', ['id' => $teacherSubject->id]);
    }

    public function test_teacher_cannot_delete_another_teachers_subject_offering(): void
    {
        $owner = User::factory()->teacher()->create();
        $ownerProfile = TeacherProfile::create(['user_id' => $owner->id]);
        $intruder = User::factory()->teacher()->create();
        TeacherProfile::create(['user_id' => $intruder->id]);
        $subject = $this->makeSubject();
        $teacherSubject = TeacherSubject::create([
            'teacher_profile_id' => $ownerProfile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $this->actingAs($intruder, 'sanctum')
            ->deleteJson("/api/teacher/subjects/{$teacherSubject->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('teacher_subjects', ['id' => $teacherSubject->id]);
    }

    public function test_index_lists_only_own_subjects(): void
    {
        $user = User::factory()->teacher()->create();
        $profile = TeacherProfile::create(['user_id' => $user->id]);
        $otherUser = User::factory()->teacher()->create();
        $otherProfile = TeacherProfile::create(['user_id' => $otherUser->id]);
        $subject = $this->makeSubject();

        TeacherSubject::create([
            'teacher_profile_id' => $profile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);
        TeacherSubject::create([
            'teacher_profile_id' => $otherProfile->id,
            'subject_id' => $subject->id,
            'grade_levels' => ['Grade 9'],
            'price_per_session_cp' => 400,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/teacher/subjects');

        $response->assertOk()->assertJsonCount(1, 'subjects');
    }

    public function test_non_teacher_cannot_access_subject_routes(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/teacher/subjects')->assertForbidden();
        $this->actingAs($student, 'sanctum')->postJson('/api/teacher/subjects', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/teacher/subjects')->assertUnauthorized();
    }
}
