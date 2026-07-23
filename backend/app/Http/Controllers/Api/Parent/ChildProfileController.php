<?php

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Parent\StoreChildProfileRequest;
use App\Http\Requests\Api\Parent\UpdateChildProfileRequest;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'children' => $request->user()->children()->orderBy('full_name')->get(),
        ]);
    }

    public function store(StoreChildProfileRequest $request): JsonResponse
    {
        $child = StudentProfile::create([
            ...$request->validated(),
            'parent_user_id' => $request->user()->id,
            // The parent creating this profile directly is, itself, the
            // consent — distinct from a self-registered minor who needs a
            // parent to link and consent after the fact (not yet built).
            'parental_consent_given' => true,
            // Set explicitly (rather than relying on the DB column
            // default) so the in-memory instance returned below reflects
            // it immediately, without needing a fresh() reload.
            'is_active' => true,
        ]);

        return response()->json(['child' => $child], 201);
    }

    public function show(Request $request, StudentProfile $child): JsonResponse
    {
        $this->authorizeOwnership($request, $child);

        return response()->json(['child' => $child]);
    }

    public function update(UpdateChildProfileRequest $request, StudentProfile $child): JsonResponse
    {
        $this->authorizeOwnership($request, $child);

        $child->update($request->validated());

        return response()->json(['child' => $child->fresh()]);
    }

    public function deactivate(Request $request, StudentProfile $child): JsonResponse
    {
        $this->authorizeOwnership($request, $child);

        $child->update(['is_active' => false]);

        return response()->json(['child' => $child->fresh()]);
    }

    public function reactivate(Request $request, StudentProfile $child): JsonResponse
    {
        $this->authorizeOwnership($request, $child);

        $child->update(['is_active' => true]);

        return response()->json(['child' => $child->fresh()]);
    }

    private function authorizeOwnership(Request $request, StudentProfile $child): void
    {
        abort_if($child->parent_user_id !== $request->user()->id, 403, 'This child profile does not belong to you.');
    }
}
