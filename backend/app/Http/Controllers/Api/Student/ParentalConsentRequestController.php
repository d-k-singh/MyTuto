<?php

namespace App\Http\Controllers\Api\Student;

use App\Enums\ConsentRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Student\StoreParentalConsentRequestRequest;
use App\Mail\ParentalConsentRequested;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ParentalConsentRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'requests' => $request->user()->parentalConsentRequests()->latest()->get(),
        ]);
    }

    public function store(StoreParentalConsentRequestRequest $request): JsonResponse
    {
        $consentRequest = $request->user()->parentalConsentRequests()->create([
            'parent_email' => $request->validated('parent_email'),
            'status' => ConsentRequestStatus::Pending,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($consentRequest->parent_email)->send(new ParentalConsentRequested($consentRequest));

        return response()->json(['request' => $consentRequest], 201);
    }
}
