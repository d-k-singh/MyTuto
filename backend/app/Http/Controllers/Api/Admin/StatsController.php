<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Aggregate counts for the admin dashboard overview. Deliberately a
     * dedicated endpoint rather than derived client-side from
     * GET /admin/users — that list doesn't carry teacher approval status
     * (fetched lazily per-teacher), and counting via a full user fetch
     * doesn't scale the way a handful of count() queries does.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'total_users' => User::count(),
            'users_by_role' => User::query()
                ->select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->pluck('count', 'role'),
            'pending_teacher_approvals' => TeacherProfile::where('is_approved', false)->count(),
            'total_subjects' => Subject::count(),
        ]);
    }
}
