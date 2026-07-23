<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherVerificationController extends Controller
{
    /**
     * Issue, revoke, or downgrade a teacher's verification badges (spec
     * 12.1). Each badge is independent and can be set true or false in
     * the same request.
     */
    public function updateVerification(Request $request, TeacherProfile $teacherProfile): JsonResponse
    {
        $validated = $request->validate([
            'identity_verified' => ['sometimes', 'boolean'],
            'education_verified' => ['sometimes', 'boolean'],
            'background_check_passed' => ['sometimes', 'boolean'],
        ]);

        $teacherProfile->update($validated);

        return response()->json(['profile' => $teacherProfile->fresh()]);
    }

    public function approve(TeacherProfile $teacherProfile): JsonResponse
    {
        $teacherProfile->update(['is_approved' => true]);

        return response()->json(['profile' => $teacherProfile->fresh()]);
    }

    public function reject(TeacherProfile $teacherProfile): JsonResponse
    {
        $teacherProfile->update(['is_approved' => false]);

        return response()->json(['profile' => $teacherProfile->fresh()]);
    }
}
