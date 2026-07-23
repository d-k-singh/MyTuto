<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Student\UpdateStudentProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'profile' => $request->user()->studentProfile,
        ]);
    }

    public function update(UpdateStudentProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->studentProfile;

        $profile->update($request->validated());

        return response()->json([
            'profile' => $profile->fresh(),
        ]);
    }
}
