<?php

namespace App\Http\Controllers\Api;

use App\Enums\EnquiryStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTeacherEnquiryRequest;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;

class TeacherEnquiryController extends Controller
{
    public function store(StoreTeacherEnquiryRequest $request, TeacherProfile $teacherProfile): JsonResponse
    {
        $enquiry = $teacherProfile->enquiries()->create([
            'user_id' => $request->user()->id,
            'subject_id' => $request->input('subject_id'),
            'message' => $request->validated('message'),
            'status' => EnquiryStatus::Pending,
        ]);

        return response()->json(['enquiry' => $enquiry], 201);
    }
}
