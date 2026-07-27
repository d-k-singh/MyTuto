<?php

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Teacher\StoreTeacherSubjectRequest;
use App\Http\Requests\Api\Teacher\UpdateTeacherSubjectRequest;
use App\Models\TeacherSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherSubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'subjects' => $request->user()->teacherProfile->subjects()->with('subject.category')->get(),
        ]);
    }

    public function store(StoreTeacherSubjectRequest $request): JsonResponse
    {
        $teacherSubject = $request->user()->teacherProfile->subjects()->create($request->validated());

        return response()->json([
            'subject' => $teacherSubject->load('subject.category'),
        ], 201);
    }

    public function update(UpdateTeacherSubjectRequest $request, TeacherSubject $teacherSubject): JsonResponse
    {
        $this->authorizeOwnership($request, $teacherSubject);

        $teacherSubject->update($request->validated());

        return response()->json([
            'subject' => $teacherSubject->fresh()->load('subject.category'),
        ]);
    }

    public function destroy(Request $request, TeacherSubject $teacherSubject): JsonResponse
    {
        $this->authorizeOwnership($request, $teacherSubject);

        $teacherSubject->delete();

        return response()->json(null, 204);
    }

    private function authorizeOwnership(Request $request, TeacherSubject $teacherSubject): void
    {
        abort_if(
            $teacherSubject->teacher_profile_id !== $request->user()->teacherProfile->id,
            403,
            'This subject offering does not belong to you.'
        );
    }
}
