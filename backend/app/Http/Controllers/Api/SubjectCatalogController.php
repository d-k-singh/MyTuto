<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\SubjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public, read-only browsing of the subject taxonomy — active records
 * only. Deactivated subjects/categories are hidden from here (spec 1.4)
 * but still visible/manageable via the admin endpoints.
 */
class SubjectCatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => SubjectCategory::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function subjects(Request $request): JsonResponse
    {
        $request->validate([
            'subject_category_id' => ['sometimes', 'integer'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $subjects = Subject::query()
            ->where('is_active', true)
            ->with(['category' => fn ($query) => $query->where('is_active', true)])
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->when(
                $request->filled('subject_category_id'),
                fn ($query) => $query->where('subject_category_id', $request->integer('subject_category_id'))
            )
            ->orderBy('name')
            ->paginate($request->integer('per_page', 25));

        return response()->json($subjects);
    }
}
