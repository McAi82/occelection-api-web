<?php
// routes/api_mobile.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Mobile\Auth\MobileAuthController;
use App\Http\Controllers\Api\Mobile\Auth\MobileFaceController;
use App\Http\Controllers\Api\Mobile\Auth\MobilePasswordController;
use App\Http\Controllers\Api\Mobile\Election\MobileElectionController;
use App\Http\Controllers\Api\Mobile\Election\MobileCandidateController;
use App\Http\Controllers\Api\Mobile\Election\MobileVoteController;
use App\Http\Controllers\Api\Mobile\Partylist\MobilePartylistController;
use App\Http\Controllers\Api\Mobile\Interaction\MobileCommentController;
use App\Http\Controllers\Api\Mobile\Course\MobileCourseController;
use App\Http\Controllers\Api\Mobile\Campaign\MobileCampaignScheduleController;

/*
|--------------------------------------------------------------------------
| Mobile API Routes
|--------------------------------------------------------------------------
*/

// ==================== PUBLIC MOBILE ROUTES ====================
Route::prefix('mobile')->group(function () {

    // Mobile Auth
    Route::post('/login', [MobileAuthController::class, 'login']);
    Route::post('/register', [MobileAuthController::class, 'register']);
    Route::post('/forgot-password', [MobilePasswordController::class, 'forgotPassword']);
    Route::post('/reset-password', [MobilePasswordController::class, 'resetPassword']);
    Route::post('/verify-credentials', [MobileAuthController::class, 'verifyCredentials']);

    // ✅ FIXED: Face registration (public) - POST method
    Route::post('/face/register-public', [MobileFaceController::class, 'registerFacePublic']);

    // Mobile Face recognition
    Route::post('/detect-face', [MobileFaceController::class, 'detectFace']);
    Route::post('/verify-face', [MobileFaceController::class, 'verifyFace']);
    Route::post('/face/verify-by-id', [MobileFaceController::class, 'verifyFaceById']);

    // Courses
    Route::get('/courses', [MobileCourseController::class, 'index']);
    Route::get('/courses/{id}', [MobileCourseController::class, 'show']);

    // Partylists
    Route::get('/partylists', [MobilePartylistController::class, 'index']);
    Route::get('/partylists/{id}', [MobilePartylistController::class, 'show']);

    // Elections (Public)
    Route::get('/elections', [MobileElectionController::class, 'index']);
    Route::get('/elections/active', [MobileElectionController::class, 'getActiveElection']);
    Route::get('/elections/{id}', [MobileElectionController::class, 'show']);
    Route::get('/elections/{id}/results', [MobileElectionController::class, 'getResults']);

    // Candidates (Public)
    Route::get('/candidates/{id}', [MobileCandidateController::class, 'getById']);
    Route::get('/candidates/election/{electionId}', [MobileCandidateController::class, 'getByElection']);

    Route::get('/campaign-schedules/candidate/{candidateId}', [MobileCampaignScheduleController::class, 'getCandidateSchedules']);

    Route::post('/detect-face', [MobileFaceController::class, 'detectFace']);
    Route::post('/face/verify-by-id', [MobileFaceController::class, 'verifyFaceById']);
    Route::get('/elections/{electionId}/receipt', [MobileVoteController::class, 'getReceipt']);
});

// ==================== AUTHENTICATED MOBILE ROUTES ====================
Route::prefix('mobile')->middleware(['auth:sanctum'])->group(function () {

    // Auth & Profile
    Route::post('/logout', [MobileAuthController::class, 'logout']);
    Route::get('/me', [MobileAuthController::class, 'me']);
    Route::post('/change-password', [MobilePasswordController::class, 'changePassword']);
    Route::post('/update-face-photo', [MobileFaceController::class, 'updateFacePhoto']);

    // ✅ FIXED: Get face data for local sync (authenticated)
    Route::get('/face/data', [MobileFaceController::class, 'getFaceData']);

    // Voting endpoints
    Route::get('/elections/{electionId}/ballot', [MobileCandidateController::class, 'getBallot']);
    Route::post('/elections/{electionId}/vote', [MobileVoteController::class, 'castVote']);
    Route::get('/elections/{electionId}/vote-status', [MobileVoteController::class, 'checkStatus']);
    Route::get('/elections/{electionId}/receipt', [MobileVoteController::class, 'getReceipt']);
    Route::get('/votes/history', [MobileVoteController::class, 'getHistory']);

    // Comments
    Route::get('/comments/election/{electionId}', [MobileCommentController::class, 'getByElection']);
    Route::post('/comments', [MobileCommentController::class, 'store']);

    Route::get('/votes/history', [MobileVoteController::class, 'getHistory']);
    Route::get('/elections/{electionId}/receipt', [MobileVoteController::class, 'getReceipt']);

    Route::post('/face/verify-by-id', [MobileFaceController::class, 'verifyFaceById']);
    Route::post('/face/detect', [MobileFaceController::class, 'detectFace']);
    Route::post('/face/register', [MobileFaceController::class, 'updateFacePhoto']);
});
