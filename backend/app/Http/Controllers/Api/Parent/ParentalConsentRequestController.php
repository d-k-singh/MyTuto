<?php

namespace App\Http\Controllers\Api\Parent;

use App\Enums\ConsentRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\ParentalConsentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParentalConsentRequestController extends Controller
{
    /**
     * Pending requests addressed to the current parent's email. There's no
     * foreign key linking these to the parent (the parent may not have had
     * an account yet when the request was created), so this is a lookup
     * by email rather than a relation.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = ParentalConsentRequest::with('student')
            ->where('parent_email', $request->user()->email)
            ->where('status', ConsentRequestStatus::Pending)
            ->where('expires_at', '>', now())
            ->latest()
            ->get();

        return response()->json(['requests' => $requests]);
    }

    public function approve(Request $request, ParentalConsentRequest $consentRequest): JsonResponse
    {
        $this->authorizeRecipient($request, $consentRequest);
        $this->ensureActionable($consentRequest);

        DB::transaction(function () use ($request, $consentRequest) {
            $consentRequest->student->studentProfile->update([
                'parent_user_id' => $request->user()->id,
                'parental_consent_given' => true,
            ]);

            $consentRequest->update([
                'status' => ConsentRequestStatus::Approved,
                'responded_at' => now(),
            ]);
        });

        return response()->json(['request' => $consentRequest->fresh()]);
    }

    public function decline(Request $request, ParentalConsentRequest $consentRequest): JsonResponse
    {
        $this->authorizeRecipient($request, $consentRequest);
        $this->ensureActionable($consentRequest);

        $consentRequest->update([
            'status' => ConsentRequestStatus::Declined,
            'responded_at' => now(),
        ]);

        return response()->json(['request' => $consentRequest->fresh()]);
    }

    private function authorizeRecipient(Request $request, ParentalConsentRequest $consentRequest): void
    {
        abort_if(
            strcasecmp($consentRequest->parent_email, $request->user()->email) !== 0,
            403,
            'This consent request was not addressed to your account.'
        );
    }

    private function ensureActionable(ParentalConsentRequest $consentRequest): void
    {
        abort_unless($consentRequest->isActionable(), 409, 'This consent request has already been resolved or has expired.');
    }
}
