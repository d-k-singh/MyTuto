<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Teacher\UpdateTeacherProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'profile' => $request->user()->teacherProfile,
        ]);
    }

    public function update(UpdateTeacherProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->teacherProfile;

        $profile->update($request->validated());

        return response()->json([
            'profile' => $profile->fresh(),
        ]);
    }
}
