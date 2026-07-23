<?php

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Parent\UpdateParentProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'profile' => $request->user()->parentProfile,
        ]);
    }

    public function update(UpdateParentProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->parentProfile;

        $profile->update($request->validated());

        return response()->json([
            'profile' => $profile->fresh(),
        ]);
    }
}
