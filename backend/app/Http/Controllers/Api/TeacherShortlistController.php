<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherProfile;
use App\Models\TeacherShortlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherShortlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'shortlist' => $request->user()->teacherShortlists()
                ->with('teacherProfile.user')
                ->latest()
                ->get()
                ->map(fn (TeacherShortlist $shortlist) => [
                    'teacher_profile_id' => $shortlist->teacher_profile_id,
                    'name' => $shortlist->teacherProfile->display_name ?? $shortlist->teacherProfile->user->name,
                    'shortlisted_at' => $shortlist->created_at,
                ]),
        ]);
    }

    public function store(Request $request, TeacherProfile $teacherProfile): JsonResponse
    {
        $shortlist = TeacherShortlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'teacher_profile_id' => $teacherProfile->id,
        ]);

        return response()->json(['shortlist' => $shortlist], 201);
    }

    public function destroy(Request $request, TeacherProfile $teacherProfile): JsonResponse
    {
        TeacherShortlist::where('user_id', $request->user()->id)
            ->where('teacher_profile_id', $teacherProfile->id)
            ->delete();

        return response()->json(null, 204);
    }
}
