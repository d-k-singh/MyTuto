<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreSubjectCategoryRequest;
use App\Http\Requests\Api\Admin\UpdateSubjectCategoryRequest;
use App\Models\SubjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class SubjectCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'categories' => SubjectCategory::withCount('subjects')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreSubjectCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = SubjectCategory::uniqueSlugFrom($data['name']);
        // Set explicitly rather than relying on the DB column default —
        // otherwise the in-memory instance returned below won't reflect
        // it until reloaded (bit us with is_active before; see
        // ChildProfileController::store for the same fix).
        $data['is_active'] ??= true;

        $category = SubjectCategory::create($data);

        return response()->json(['category' => $category], 201);
    }

    public function show(SubjectCategory $subjectCategory): JsonResponse
    {
        return response()->json(['category' => $subjectCategory->loadCount('subjects')]);
    }

    public function update(UpdateSubjectCategoryRequest $request, SubjectCategory $subjectCategory): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $subjectCategory->name) {
            $data['slug'] = SubjectCategory::uniqueSlugFrom($data['name'], $subjectCategory->id);
        }

        $subjectCategory->update($data);

        return response()->json(['category' => $subjectCategory->fresh()]);
    }

    public function destroy(SubjectCategory $subjectCategory): Response
    {
        abort_if(
            $subjectCategory->subjects()->exists(),
            409,
            'This category still has subjects under it. Remove or reassign them first.'
        );

        $subjectCategory->delete();

        return response()->noContent();
    }

    public function activate(SubjectCategory $subjectCategory): JsonResponse
    {
        $subjectCategory->update(['is_active' => true]);

        return response()->json(['category' => $subjectCategory->fresh()]);
    }

    public function deactivate(SubjectCategory $subjectCategory): JsonResponse
    {
        $subjectCategory->update(['is_active' => false]);

        return response()->json(['category' => $subjectCategory->fresh()]);
    }
}
