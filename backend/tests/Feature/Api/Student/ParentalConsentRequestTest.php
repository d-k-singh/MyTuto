<?php

namespace Tests\Feature\Api\Student;

use App\Enums\ConsentRequestStatus;
use App\Mail\ParentalConsentRequested;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ParentalConsentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_request_parental_consent(): void
    {
        Mail::fake();

        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'parent@example.com',
        ]);

        $response->assertCreated()
            ->assertJsonPath('request.parent_email', 'parent@example.com')
            ->assertJsonPath('request.status', 'pending');

        $this->assertDatabaseHas('parental_consent_requests', [
            'student_id' => $student->id,
            'parent_email' => 'parent@example.com',
            'status' => 'pending',
        ]);

        Mail::assertSent(ParentalConsentRequested::class, function ($mail) {
            return $mail->hasTo('parent@example.com');
        });
    }

    public function test_cannot_request_consent_if_already_linked_to_a_parent(): void
    {
        $parent = User::factory()->parent()->create();
        $student = User::factory()->student()->create();
        StudentProfile::create([
            'user_id' => $student->id,
            'parent_user_id' => $parent->id,
            'parental_consent_given' => true,
        ]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'someone@example.com',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_email');
    }

    public function test_cannot_request_consent_while_one_is_already_pending(): void
    {
        Mail::fake();

        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $student->parentalConsentRequests()->create([
            'parent_email' => 'first@example.com',
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'second@example.com',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_email');
    }

    public function test_can_request_again_after_previous_request_expired(): void
    {
        Mail::fake();

        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $student->parentalConsentRequests()->create([
            'parent_email' => 'first@example.com',
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'second@example.com',
        ]);

        $response->assertCreated();
    }

    public function test_cannot_invite_own_email(): void
    {
        $student = User::factory()->student()->create(['email' => 'me@example.com']);
        StudentProfile::create(['user_id' => $student->id]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'me@example.com',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_email');
    }

    public function test_rejects_invalid_email(): void
    {
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/student/parental-consent-requests', [
            'parent_email' => 'not-an-email',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_email');
    }

    public function test_student_can_list_own_requests(): void
    {
        Mail::fake();

        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $student->parentalConsentRequests()->create([
            'parent_email' => 'parent@example.com',
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($student, 'sanctum')->getJson('/api/student/parental-consent-requests');

        $response->assertOk()->assertJsonCount(1, 'requests');
    }

    public function test_non_student_cannot_access_these_routes(): void
    {
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($teacher, 'sanctum')->getJson('/api/student/parental-consent-requests')->assertForbidden();
        $this->actingAs($teacher, 'sanctum')->postJson('/api/student/parental-consent-requests', [])->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/student/parental-consent-requests')->assertUnauthorized();
    }
}
