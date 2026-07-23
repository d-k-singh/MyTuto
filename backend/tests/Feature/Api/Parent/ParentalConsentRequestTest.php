<?php

namespace Tests\Feature\Api\Parent;

use App\Enums\ConsentRequestStatus;
use App\Models\ParentalConsentRequest;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentalConsentRequestTest extends TestCase
{
    use RefreshDatabase;

    private function pendingRequestFor(User $student, string $parentEmail): ParentalConsentRequest
    {
        return $student->parentalConsentRequests()->create([
            'parent_email' => $parentEmail,
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->addDays(7),
        ]);
    }

    public function test_parent_sees_only_pending_requests_addressed_to_their_email(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $studentA = User::factory()->student()->create();
        $studentB = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $studentA->id]);
        StudentProfile::create(['user_id' => $studentB->id]);

        $this->pendingRequestFor($studentA, 'parent@example.com');
        $this->pendingRequestFor($studentB, 'someone-else@example.com');

        $response = $this->actingAs($parent, 'sanctum')->getJson('/api/parent/parental-consent-requests');

        $response->assertOk()->assertJsonCount(1, 'requests');
    }

    public function test_expired_requests_do_not_appear_in_index(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);

        $student->parentalConsentRequests()->create([
            'parent_email' => 'parent@example.com',
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($parent, 'sanctum')->getJson('/api/parent/parental-consent-requests');

        $response->assertOk()->assertJsonCount(0, 'requests');
    }

    public function test_parent_can_approve_a_request_and_it_links_the_student(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $consentRequest = $this->pendingRequestFor($student, 'parent@example.com');

        $response = $this->actingAs($parent, 'sanctum')
            ->postJson("/api/parent/parental-consent-requests/{$consentRequest->id}/approve");

        $response->assertOk()->assertJsonPath('request.status', 'approved');

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'parent_user_id' => $parent->id,
            'parental_consent_given' => true,
        ]);

        $this->assertDatabaseHas('parental_consent_requests', [
            'id' => $consentRequest->id,
            'status' => 'approved',
        ]);
    }

    public function test_parent_can_decline_a_request_without_linking(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $consentRequest = $this->pendingRequestFor($student, 'parent@example.com');

        $response = $this->actingAs($parent, 'sanctum')
            ->postJson("/api/parent/parental-consent-requests/{$consentRequest->id}/decline");

        $response->assertOk()->assertJsonPath('request.status', 'declined');

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'parent_user_id' => null,
            'parental_consent_given' => false,
        ]);
    }

    public function test_parent_cannot_approve_a_request_addressed_to_a_different_email(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $consentRequest = $this->pendingRequestFor($student, 'someone-else@example.com');

        $this->actingAs($parent, 'sanctum')
            ->postJson("/api/parent/parental-consent-requests/{$consentRequest->id}/approve")
            ->assertForbidden();

        $this->assertDatabaseHas('student_profiles', [
            'user_id' => $student->id,
            'parent_user_id' => null,
        ]);
    }

    public function test_cannot_approve_an_already_resolved_request(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $consentRequest = $this->pendingRequestFor($student, 'parent@example.com');
        $consentRequest->update(['status' => ConsentRequestStatus::Declined, 'responded_at' => now()]);

        $this->actingAs($parent, 'sanctum')
            ->postJson("/api/parent/parental-consent-requests/{$consentRequest->id}/approve")
            ->assertStatus(409);
    }

    public function test_cannot_approve_an_expired_request(): void
    {
        $parent = User::factory()->parent()->create(['email' => 'parent@example.com']);
        $student = User::factory()->student()->create();
        StudentProfile::create(['user_id' => $student->id]);
        $consentRequest = $student->parentalConsentRequests()->create([
            'parent_email' => 'parent@example.com',
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->subDay(),
        ]);

        $this->actingAs($parent, 'sanctum')
            ->postJson("/api/parent/parental-consent-requests/{$consentRequest->id}/approve")
            ->assertStatus(409);
    }

    public function test_non_parent_cannot_access_these_routes(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student, 'sanctum')->getJson('/api/parent/parental-consent-requests')->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/parent/parental-consent-requests')->assertUnauthorized();
    }
}
