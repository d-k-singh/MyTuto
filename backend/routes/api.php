<?php

use App\Http\Controllers\Api\Admin\TeacherVerificationController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Parent\ChildProfileController;
use App\Http\Controllers\Api\Parent\ParentalConsentRequestController as ParentParentalConsentRequestController;
use App\Http\Controllers\Api\Parent\ParentProfileController;
use App\Http\Controllers\Api\Student\ParentalConsentRequestController as StudentParentalConsentRequestController;
use App\Http\Controllers\Api\Student\StudentProfileController;
use App\Http\Controllers\Api\Teacher\TeacherProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::middleware('role:teacher')->prefix('teacher')->group(function () {
        Route::get('/profile', [TeacherProfileController::class, 'show']);
        Route::put('/profile', [TeacherProfileController::class, 'update']);
    });

    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);

        Route::get('/parental-consent-requests', [StudentParentalConsentRequestController::class, 'index']);
        Route::post('/parental-consent-requests', [StudentParentalConsentRequestController::class, 'store']);
    });

    Route::middleware('role:parent')->prefix('parent')->group(function () {
        Route::get('/profile', [ParentProfileController::class, 'show']);
        Route::put('/profile', [ParentProfileController::class, 'update']);

        Route::get('/children', [ChildProfileController::class, 'index']);
        Route::post('/children', [ChildProfileController::class, 'store']);
        Route::get('/children/{child}', [ChildProfileController::class, 'show']);
        Route::put('/children/{child}', [ChildProfileController::class, 'update']);
        Route::patch('/children/{child}/deactivate', [ChildProfileController::class, 'deactivate']);
        Route::patch('/children/{child}/reactivate', [ChildProfileController::class, 'reactivate']);

        Route::get('/parental-consent-requests', [ParentParentalConsentRequestController::class, 'index']);
        Route::post('/parental-consent-requests/{consentRequest}/approve', [ParentParentalConsentRequestController::class, 'approve']);
        Route::post('/parental-consent-requests/{consentRequest}/decline', [ParentParentalConsentRequestController::class, 'decline']);
    });

    Route::middleware('role:admin,super_admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}/activate', [AdminUserController::class, 'activate']);
        Route::patch('/users/{user}/deactivate', [AdminUserController::class, 'deactivate']);

        Route::patch('/teachers/{teacherProfile}/verification', [TeacherVerificationController::class, 'updateVerification']);
        Route::patch('/teachers/{teacherProfile}/approve', [TeacherVerificationController::class, 'approve']);
        Route::patch('/teachers/{teacherProfile}/reject', [TeacherVerificationController::class, 'reject']);
    });
});
