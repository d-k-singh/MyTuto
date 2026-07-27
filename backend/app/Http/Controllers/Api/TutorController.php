<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\TutorSearchRequest;
use App\Models\TeacherProfile;
use App\Models\TeacherShortlist;
use App\Models\TeacherSubject;
use App\Support\TutorMatchScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class TutorController extends Controller
{
    public function search(TutorSearchRequest $request): JsonResponse
    {
        $criteria = [
            'grade_level' => $request->string('grade_level')->toString(),
            'language' => $request->string('language')->toString(),
            'geographic_preference' => $request->string('geographic_preference')->toString(),
            'searcher_country' => $this->resolveSearcherCountry($request),
            'budget_max' => $request->integer('budget_max'),
            'gender_preference' => $request->genderPreference(),
            'teaching_mode' => $request->string('teaching_mode')->toString(),
            'time_block' => $request->string('time_block')->toString(),
        ];

        $candidates = TeacherSubject::where('subject_id', $request->integer('subject_id'))
            ->whereHas('teacherProfile', fn ($query) => $query->where('is_approved', true)
                ->whereHas('user', fn ($query) => $query->where('is_active', true)))
            ->with(['teacherProfile.user', 'subject.category'])
            ->get();

        $shortlistedIds = TeacherShortlist::where('user_id', $request->user()->id)
            ->pluck('teacher_profile_id')
            ->all();

        $results = $candidates
            ->map(function (TeacherSubject $teacherSubject) use ($criteria, $shortlistedIds) {
                $score = TutorMatchScorer::score($teacherSubject, $criteria);

                return $this->presentResult($teacherSubject, $score['total'], $shortlistedIds);
            })
            ->sortByDesc('match_score')
            ->values();

        $perPage = $request->integer('per_page', 10);
        $page = $request->integer('page', 1);

        $paginated = new LengthAwarePaginator(
            $results->forPage($page, $perPage)->values(),
            $results->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return response()->json($paginated);
    }

    public function show(Request $request, TeacherProfile $teacherProfile): JsonResponse
    {
        abort_unless(
            $teacherProfile->is_approved && $teacherProfile->user->is_active,
            404,
        );

        $isShortlisted = TeacherShortlist::where('user_id', $request->user()->id)
            ->where('teacher_profile_id', $teacherProfile->id)
            ->exists();

        return response()->json([
            'teacher' => [
                'id' => $teacherProfile->id,
                'name' => $teacherProfile->display_name ?? $teacherProfile->user->name,
                'bio' => $teacherProfile->bio,
                'country' => $teacherProfile->country,
                'city' => $teacherProfile->city,
                'teaching_mode' => $teacherProfile->teaching_mode,
                'languages' => $teacherProfile->languages ?? [],
                'years_experience' => $teacherProfile->years_experience,
                'identity_verified' => $teacherProfile->identity_verified,
                'education_verified' => $teacherProfile->education_verified,
                'background_check_passed' => $teacherProfile->background_check_passed,
                'is_approved' => $teacherProfile->is_approved,
                'is_shortlisted' => $isShortlisted,
                'subjects' => $teacherProfile->subjects()->with('subject.category')->get()->map(fn (TeacherSubject $ts) => [
                    'id' => $ts->id,
                    'subject' => $ts->subject->name,
                    'category' => $ts->subject->category->name,
                    'grade_levels' => $ts->grade_levels,
                    'price_per_session_cp' => $ts->price_per_session_cp,
                ]),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentResult(TeacherSubject $teacherSubject, int $matchScore, array $shortlistedIds): array
    {
        $profile = $teacherSubject->teacherProfile;

        return [
            'teacher_profile_id' => $profile->id,
            'match_score' => $matchScore,
            'name' => $profile->display_name ?? $profile->user->name,
            'is_verified' => $profile->is_approved,
            'subject' => $teacherSubject->subject->name,
            'subject_category' => $teacherSubject->subject->category->name,
            'grade_levels' => $teacherSubject->grade_levels,
            'price_per_session_cp' => $teacherSubject->price_per_session_cp,
            'languages' => $profile->languages ?? [],
            'bio_summary' => $profile->bio ? mb_substr($profile->bio, 0, 160) : null,
            'is_shortlisted' => in_array($profile->id, $shortlistedIds, true),
        ];
    }

    private function resolveSearcherCountry(Request $request): ?string
    {
        $user = $request->user();

        return match (true) {
            $user->isStudent() => $user->studentProfile?->country,
            $user->isParent() => $user->parentProfile?->country,
            default => null,
        };
    }
}
