<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreSubjectRequest;
use App\Http\Requests\Api\Admin\UpdateSubjectRequest;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'subject_category_id' => ['sometimes', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $subjects = Subject::query()
            ->with('category')
            ->when(
                $request->filled('subject_category_id'),
                fn ($query) => $query->where('subject_category_id', $request->integer('subject_category_id'))
            )
            ->when($request->has('is_active'), fn ($query) => $query->where('is_active', $request->boolean('is_active')))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 25));

        return response()->json($subjects);
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Subject::uniqueSlugFrom($data['name']);
        // See SubjectCategoryController::store for why this is explicit.
        $data['is_active'] ??= true;

        $subject = Subject::create($data);

        return response()->json(['subject' => $subject->load('category')], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        return response()->json(['subject' => $subject->load('category')]);
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['name']) && $data['name'] !== $subject->name) {
            $data['slug'] = Subject::uniqueSlugFrom($data['name'], $subject->id);
        }

        $subject->update($data);

        return response()->json(['subject' => $subject->fresh()->load('category')]);
    }

    public function destroy(Subject $subject): Response
    {
        $subject->delete();

        return response()->noContent();
    }

    public function activate(Subject $subject): JsonResponse
    {
        $subject->update(['is_active' => true]);

        return response()->json(['subject' => $subject->fresh()->load('category')]);
    }

    public function deactivate(Subject $subject): JsonResponse
    {
        $subject->update(['is_active' => false]);

        return response()->json(['subject' => $subject->fresh()->load('category')]);
    }
}
