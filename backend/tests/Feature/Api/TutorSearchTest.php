<?php

namespace Tests\Feature\Api;

use App\Models\Subject;
use App\Models\SubjectCategory;
use App\Models\TeacherProfile;
use App\Models\TeacherSubject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TutorSearchTest extends TestCase
{
    use RefreshDatabase;

    private Subject $subject;

    protected function setUp(): void
    {
        parent::setUp();

        $category = SubjectCategory::create(['name' => 'Mathematics', 'slug' => 'mathematics', 'is_active' => true]);
        $this->subject = Subject::create([
            'subject_category_id' => $category->id,
            'name' => 'Algebra',
            'slug' => 'algebra',
            'grade_levels' => ['Grade 9', 'Grade 10', 'Grade 11'],
            'is_active' => true,
        ]);
    }

    /**
     * A teacher configured to match every dimension of $this->baseSearchParams()
     * by default, with overrides for both the profile and the subject offering.
     */
    private function makeMatchingTeacher(array $profileOverrides = [], array $teacherSubjectOverrides = []): TeacherProfile
    {
        $user = User::factory()->teacher()->create(['is_active' => $profileOverrides['user_is_active'] ?? true]);
        unset($profileOverrides['user_is_active']);

        $profile = TeacherProfile::create(array_merge([
            'user_id' => $user->id,
            'display_name' => 'Ms. Match',
            'country' => 'India',
            'gender' => 'female',
            'teaching_mode' => 'online',
            'languages' => ['English', 'Hindi'],
            'available_time_blocks' => ['08:00-12:00', '18:00-20:00'],
            'is_approved' => true,
        ], $profileOverrides));

        TeacherSubject::create(array_merge([
            'teacher_profile_id' => $profile->id,
            'subject_id' => $this->subject->id,
            'grade_levels' => ['Grade 9', 'Grade 10'],
            'price_per_session_cp' => 500,
        ], $teacherSubjectOverrides));

        return $profile;
    }

    private function makeStudentSearcher(?string $country = 'India'): User
    {
        $user = User::factory()->student()->create();
        $user->studentProfile()->create(['country' => $country]);

        return $user;
    }

    private function baseSearchParams(): array
    {
        return [
            'subject_id' => $this->subject->id,
            'grade_level' => 'Grade 9',
            'language' => 'Hindi',
            'geographic_preference' => 'local',
            'budget_max' => 500,
            'gender_preference' => 'female',
            'teaching_mode' => 'online',
            'time_block' => '08:00-12:00',
        ];
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()))->assertUnauthorized();
    }

    public function test_teacher_role_cannot_access_search(): void
    {
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()))
            ->assertForbidden();
    }

    public function test_search_requires_core_fields(): void
    {
        $student = $this->makeStudentSearcher();

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['subject_id', 'grade_level', 'language', 'geographic_preference', 'budget_max', 'teaching_mode', 'time_block']);
    }

    public function test_unapproved_teacher_is_excluded_from_results(): void
    {
        $this->makeMatchingTeacher(['is_approved' => false]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_inactive_teacher_is_excluded_from_results(): void
    {
        $this->makeMatchingTeacher(['user_is_active' => false]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_teacher_matching_every_dimension_scores_100(): void
    {
        $this->makeMatchingTeacher();
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_teacher_matching_only_subject_scores_30(): void
    {
        $this->makeMatchingTeacher(
            ['country' => 'Canada', 'gender' => 'male', 'teaching_mode' => 'in_person', 'languages' => ['French'], 'available_time_blocks' => ['20:00-22:00']],
            ['grade_levels' => ['Grade 11'], 'price_per_session_cp' => 999999],
        );
        $student = $this->makeStudentSearcher('India');

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 30);
    }

    public function test_expertise_level_mismatch_excludes_that_component(): void
    {
        $this->makeMatchingTeacher([], ['grade_levels' => ['Grade 11']]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        // 100 - 20 (expertise level weight)
        $response->assertOk()->assertJsonPath('data.0.match_score', 80);
    }

    public function test_language_match_is_case_insensitive(): void
    {
        $this->makeMatchingTeacher(['languages' => ['hindi']]);
        $student = $this->makeStudentSearcher();

        $params = array_merge($this->baseSearchParams(), ['language' => 'HINDI']);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_language_mismatch_loses_ten_points(): void
    {
        $this->makeMatchingTeacher(['languages' => ['Tamil']]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_language_unset_on_teacher_does_not_error(): void
    {
        $this->makeMatchingTeacher(['languages' => null]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_geographic_international_preference_always_matches(): void
    {
        $this->makeMatchingTeacher(['country' => 'United Kingdom']);
        $student = $this->makeStudentSearcher('India');

        $params = array_merge($this->baseSearchParams(), ['geographic_preference' => 'international']);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_geographic_local_preference_mismatch_loses_five_points(): void
    {
        $this->makeMatchingTeacher(['country' => 'United Kingdom']);
        $student = $this->makeStudentSearcher('India');

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 95);
    }

    public function test_geographic_local_preference_with_unknown_searcher_country_is_neutral(): void
    {
        $this->makeMatchingTeacher();
        $student = $this->makeStudentSearcher(null);

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        // 100 - 5 (full weight) + 2.5 (half weight, rounded) = 97.5 -> 98
        $response->assertOk()->assertJsonPath('data.0.match_score', 98);
    }

    public function test_budget_exactly_at_max_is_a_match(): void
    {
        $this->makeMatchingTeacher([], ['price_per_session_cp' => 500]);
        $student = $this->makeStudentSearcher();

        $params = array_merge($this->baseSearchParams(), ['budget_max' => 500]);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_budget_over_max_loses_ten_points(): void
    {
        $this->makeMatchingTeacher([], ['price_per_session_cp' => 501]);
        $student = $this->makeStudentSearcher();

        $params = array_merge($this->baseSearchParams(), ['budget_max' => 500]);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_gender_no_preference_always_matches(): void
    {
        $this->makeMatchingTeacher(['gender' => 'male']);
        $student = $this->makeStudentSearcher();

        $params = array_merge($this->baseSearchParams(), ['gender_preference' => 'no_preference']);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_gender_mismatch_loses_ten_points(): void
    {
        $this->makeMatchingTeacher(['gender' => 'male']);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_gender_preference_against_unset_teacher_gender_does_not_match(): void
    {
        $this->makeMatchingTeacher(['gender' => null]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_hybrid_teacher_matches_any_requested_teaching_mode(): void
    {
        $this->makeMatchingTeacher(['teaching_mode' => 'hybrid']);
        $student = $this->makeStudentSearcher();

        $params = array_merge($this->baseSearchParams(), ['teaching_mode' => 'in_person']);
        $response = $this->actingAs($student, 'sanctum')->getJson('/api/tutors/search?'.http_build_query($params));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }

    public function test_teaching_mode_mismatch_loses_five_points(): void
    {
        $this->makeMatchingTeacher(['teaching_mode' => 'in_person']);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 95);
    }

    public function test_preferred_time_mismatch_loses_ten_points(): void
    {
        $this->makeMatchingTeacher(['available_time_blocks' => ['20:00-22:00']]);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 90);
    }

    public function test_results_are_sorted_by_match_score_descending(): void
    {
        $this->makeMatchingTeacher(['display_name' => 'Perfect Match']);
        $this->makeMatchingTeacher(['display_name' => 'Partial Match', 'gender' => 'male']);
        $student = $this->makeStudentSearcher();

        $response = $this->actingAs($student, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Perfect Match')
            ->assertJsonPath('data.1.name', 'Partial Match');
    }

    public function test_parent_can_search_using_their_own_profile_country(): void
    {
        $this->makeMatchingTeacher(['country' => 'India']);
        $parent = User::factory()->parent()->create();
        $parent->parentProfile()->create(['country' => 'India']);

        $response = $this->actingAs($parent, 'sanctum')
            ->getJson('/api/tutors/search?'.http_build_query($this->baseSearchParams()));

        $response->assertOk()->assertJsonPath('data.0.match_score', 100);
    }
}
