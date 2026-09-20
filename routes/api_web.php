<?php
// routes/api_web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Web\Auth\AuthController;
use App\Http\Controllers\Api\Web\Auth\FaceController;
use App\Http\Controllers\Api\Web\Auth\PasswordController;
use App\Http\Controllers\Api\Web\Admin\AdminController;
use App\Http\Controllers\Api\Web\Election\ElectionController;
use App\Http\Controllers\Api\Web\Election\CandidateController;
use App\Http\Controllers\Api\Web\Election\VoteController;
use App\Http\Controllers\Api\Web\Election\PartylistController;
use App\Http\Controllers\Api\Web\Comment\CommentController;
use App\Http\Controllers\Api\Web\Feedback\FeedbackController;
use App\Http\Controllers\Api\Web\Campaign\CampaignScheduleController;
use App\Http\Controllers\Api\Web\Monitoring\MonitoringController;
use App\Http\Controllers\Api\Web\Course\CourseController;
use App\Http\Controllers\Api\Web\Candidacy\CandidacyController;
use App\Http\Controllers\Api\Web\Admin\RecordsController;
use App\Http\Controllers\Api\Web\Campaign\CampaignPostController;
use App\Http\Controllers\Api\Web\BroadcastController;
use App\Http\Controllers\Api\Web\Campaign\CampaignScheduleRequestController;
use App\Http\Controllers\Api\Web\NotificationController;
use App\Http\Controllers\Api\Web\Partylist\PartylistRequestController;

use App\Events\NewNotification;
use App\Models\Notification;
use App\Models\User;
/*
|--------------------------------------------------------------------------
| Web API Routes
|--------------------------------------------------------------------------
| Base URL: /api/web
*/



Route::prefix('web')->group(function () {

    Route::get('/test-realtime-notification', function () {
        // Get the authenticated user or first user
        $user = auth()->user() ?? User::first();

        if (!$user) {
            return response()->json(['error' => 'No user found']);
        }

        // Create notification
        $notification = Notification::create([
            'user_id' => $user->user_id,
            'title' => '🔔 Real-time Test Notification',
            'message' => 'This notification appeared in real-time at ' . now()->format('H:i:s'),
            'type' => 'system',
            'is_read' => false,
        ]);

        // ✅ Broadcast the event
        broadcast(new NewNotification($notification, $user->user_id));

        return response()->json([
            'success' => true,
            'message' => 'Real-time notification sent!',
            'notification' => $notification,
            'user_id' => $user->user_id,
        ]);
    });

    // ==================== PUBLIC ROUTES ====================
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [PasswordController::class, 'forgotPassword']);
    Route::post('/reset-password', [PasswordController::class, 'resetPassword']);
    Route::post('/verify-credentials', [AuthController::class, 'verifyCredentials']);
    Route::post('/detect-face', [FaceController::class, 'detectFace']);
    Route::post('/verify-face', [FaceController::class, 'verifyFace']);
    Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate']);

    // ==================== PARTYLIST PUBLIC ROUTES ====================
    Route::get('/partylists', [PartylistController::class, 'index']);
    Route::get('/partylists/years', [PartylistController::class, 'getAvailableYears']);
    Route::get('/partylists/current-year', [PartylistController::class, 'getCurrentYearPartylists']);
    Route::get('/partylists/{id}', [PartylistController::class, 'show']);
    Route::get('/partylists/election/{electionId}', [PartylistController::class, 'getByElection']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::get('/feedback/categories', [FeedbackController::class, 'getCategories']);

    // ==================== PUBLIC FACE REGISTRATION ====================
    Route::post('/face/register-public', [FaceController::class, 'registerFacePublic']);

    // ==================== PROTECTED ROUTES ====================
    Route::middleware(['auth:sanctum'])->group(function () {

        // ==================== CANDIDACY APPLICATION ROUTES (Public) ====================
        Route::prefix('candidacy')->group(function () {

            Route::post('/apply', [CandidacyController::class, 'apply']);
            Route::get('/available-elections', [CandidacyController::class, 'getAvailableElections']);
            Route::get('/my-applications/{electionId?}', [CandidacyController::class, 'getMyApplication']);
            Route::get('/my-applications/{applicationId}/download-letter', [CandidacyController::class, 'voterDownloadRecommendationLetter']);
        });

        // Auth & Profile
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [PasswordController::class, 'changePassword']);
        Route::post('/update-face-photo', [FaceController::class, 'updateFacePhoto']);

        // ==================== CANDIDATE APPLICATION (Web) ====================
        Route::put('/candidates/{id}', [CandidateController::class, 'update']);
        Route::get('/candidates/{id}/stats', [CandidateController::class, 'getStats']);

        // Elections (View only)
        Route::get('/elections', [ElectionController::class, 'index']);
        Route::get('/elections/active', [ElectionController::class, 'getActiveElection']);
        Route::get('/elections/{id}', [ElectionController::class, 'show']);
        Route::get('/elections/{id}/live-results', [ElectionController::class, 'getLiveResults']);
        Route::get('/elections/{id}/results', [ElectionController::class, 'getResults']);
        Route::get('/elections/{id}/winners', [ElectionController::class, 'getWinners']);

        // ==================== CANDIDATE SCHEDULE REQUESTS ====================
        Route::prefix('candidate/schedule-requests')->group(function () {
            Route::get('/sections/{electionId}', [CampaignScheduleRequestController::class, 'getAvailableSections']);
            Route::post('/', [CampaignScheduleRequestController::class, 'store']);
            Route::get('/my', [CampaignScheduleRequestController::class, 'getMyRequests']);
            Route::delete('/{requestId}', [CampaignScheduleRequestController::class, 'destroy']);
        });

        Route::prefix('partylist')->group(function () {
            // Creator routes
            Route::get('requests/pending', [PartylistRequestController::class, 'getPendingRequests']);
            Route::put('requests/{membershipId}/approve', [PartylistRequestController::class, 'approveRequest']);
            Route::put('requests/{membershipId}/reject', [PartylistRequestController::class, 'rejectRequest']);
            Route::get('my-membership/{electionId}', [PartylistRequestController::class, 'getMyMembershipStatus']);
            Route::get('{partylistId}/requests', [PartylistRequestController::class, 'getPartylistRequests']);
            // ✅ Debug route
            Route::get('/debug', [PartylistRequestController::class, 'debugCheck']);
        });

        // ==================== CANDIDATE PARTYLIST MANAGEMENT ====================
        Route::prefix('candidate/partylists')->group(function () {
            Route::get('/available/{electionId}', [PartylistController::class, 'candidateGetAvailableLists']);
            Route::post('/create', [PartylistController::class, 'candidateCreate']);
            Route::post('/{partylistId}/apply', [PartylistController::class, 'candidateApply']);
            Route::get('/requests', [PartylistController::class, 'candidateGetRequests']);
            Route::put('/requests/{membershipId}', [PartylistController::class, 'candidateHandleRequest']);
        });

        // ==================== CANDIDATE PARTYLIST (Alternative routes) ====================
        Route::prefix('candidacy')->group(function () {
            Route::get('/available-partylists/{electionId}', [CandidacyController::class, 'getAvailablePartylists']);
            Route::post('/apply-partylist/{partylistId}', [CandidacyController::class, 'candidateApplyToPartylist']);
            Route::get('/my-partylist/{electionId}', [CandidacyController::class, 'getMyPartylist']);
            Route::get('/partylist-requests', [CandidacyController::class, 'getPartylistRequests']);
            Route::put('/partylist-requests/{membershipId}', [CandidacyController::class, 'handlePartylistRequest']);
        });

        // ==================== CANDIDATES (View only) ====================
        Route::get('/candidates/election/{electionId}', [CandidateController::class, 'getByElection']);
        Route::get('/candidates/{id}', [CandidateController::class, 'getById']);

        // ==================== VOTING - READ ONLY ====================
        Route::get('/elections/{electionId}/vote-status', [VoteController::class, 'checkVoteStatus']);
        Route::get('/elections/{electionId}/receipt', [VoteController::class, 'getReceipt']);
        Route::post('/elections/{electionId}/resend-receipt', [VoteController::class, 'resendReceipt']);
        Route::get('/votes/history', [VoteController::class, 'getHistory']);

        // ==================== VOTE TICKETS ====================
        Route::get('/elections/{electionId}/candidates/{candidateId}/tickets', [VoteController::class, 'getCandidateVoteTickets']);

        // ==================== STATISTICS (Admin & COMELEC only) ====================
        Route::middleware(['checkRole:admin,comelec'])->group(function () {
            Route::get('/elections/{electionId}/statistics', [VoteController::class, 'getStatistics']);
            Route::get('/elections/{electionId}/turnout-summary', [VoteController::class, 'getTurnoutSummary']);
        });

        // ==================== COMMENTS ====================
        Route::get('/comments/election/{electionId}', [CommentController::class, 'getByElection']);
        Route::post('/comments', [CommentController::class, 'store']);
        Route::put('/comments/{commentId}/moderate', [CommentController::class, 'moderate']);
        Route::delete('/comments/{commentId}', [CommentController::class, 'delete']);

        // ==================== FEEDBACK ====================
        Route::post('/feedback', [FeedbackController::class, 'store']);
        Route::get('/feedback/check/{electionId}', [FeedbackController::class, 'checkStatus']);
        Route::get('/feedback/my/{electionId}', [FeedbackController::class, 'getUserFeedback']);
        Route::post('/feedback/{id}/helpful', [FeedbackController::class, 'markHelpful']);
        Route::put('/feedback/{id}', [FeedbackController::class, 'update']);
        Route::delete('/feedback/{id}', [FeedbackController::class, 'destroy']);

        // ==================== COURSES ====================
        Route::get('/courses', [CourseController::class, 'index']);
        Route::get('/courses/{id}', [CourseController::class, 'show']);
        Route::get('/courses/code/{courseCode}', [CourseController::class, 'getByCode']);
        Route::get('/courses/{courseId}/sections', [CourseController::class, 'getSectionsByCourse']);
        Route::get('/sections', [CourseController::class, 'getAllSections']);

        // ==================== ADMIN ROUTES ====================
        Route::middleware(['checkRole:admin'])->prefix('admin')->group(function () {

            // User Management
            Route::get('/users', [AdminController::class, 'getUsers']);
            Route::post('/users', [AdminController::class, 'createUser']);
            Route::put('/users/{id}', [AdminController::class, 'updateUser']);
            Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

            // Position Management
            Route::post('/positions', [AdminController::class, 'createPosition']);
            Route::put('/positions/{id}', [AdminController::class, 'updatePosition']);
            Route::delete('/positions/{id}', [AdminController::class, 'deletePosition']);

            // Election Management
            Route::post('/elections', [ElectionController::class, 'store']);
            Route::put('/elections/{id}', [AdminController::class, 'updateElection']);
            Route::delete('/elections/{id}', [ElectionController::class, 'destroy']);

            // Voter Management
            Route::get('/voters/{electionId}', [AdminController::class, 'getVoters']);
            Route::get('/voters/stats/{electionId}', [AdminController::class, 'getVoterStats']);
            Route::post('/voters/import', [AdminController::class, 'importVoters']);

            // Face Registration
            Route::get('/face/users-without', [FaceController::class, 'getUsersWithoutFace']);
            Route::get('/face/users-with', [FaceController::class, 'getUsersWithFace']);
            Route::post('/face/register', [FaceController::class, 'registerFace']);
            Route::delete('/face/delete/{userId}', [FaceController::class, 'deleteFace']);

            // Reports
            Route::get('/reports/turnout/{electionId}', [AdminController::class, 'getTurnoutReport']);
            Route::get('/reports/sanctions/{electionId}', [AdminController::class, 'getSanctionsList']);
            Route::get('/reports/results/{electionId}', [AdminController::class, 'getFullResults']);

            // Audit Logs
            Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
            Route::get('/audit-logs/election/{electionId}', [AdminController::class, 'getElectionAuditTrail']);

            // Feedback Management
            Route::get('/feedback', [FeedbackController::class, 'adminIndex']);
            Route::post('/feedback/{id}/respond', [FeedbackController::class, 'respond']);

            Route::get('/voters/{electionId}/{voterRegistryId}/receipt', [AdminController::class, 'getVoterReceipt']);
            Route::get('/sections', [CampaignScheduleController::class, 'getSections']);
            Route::delete('/voters/{electionId}/{voterRegistryId}', [AdminController::class, 'removeVoter']);

            // Admin-only candidacy management
            Route::prefix('candidacy')->group(function () {
                Route::get('/applications', [CandidacyController::class, 'adminList']);
                Route::put('/{id}/approve', [CandidacyController::class, 'adminApprove']);
                Route::put('/{id}/reject', [CandidacyController::class, 'adminReject']);
                Route::get('/{id}/recommendation-letter', [CandidacyController::class, 'downloadRecommendationLetter']);
            });

            // Election Records
            Route::prefix('records')->group(function () {
                Route::get('/years', [RecordsController::class, 'getYears']);
                Route::get('/year/{year}', [RecordsController::class, 'getYearRecords']);
                Route::get('/stats', [RecordsController::class, 'getYearlyStats']);
                Route::get('/election/{electionId}', [RecordsController::class, 'getElectionDetail']);
                Route::get('/export/{year}', [RecordsController::class, 'exportYearRecords']);
                Route::get('/election/{electionId}/export', [RecordsController::class, 'exportElection']);
            });

            // Schedule Requests Management (Admin only)
            Route::get('/schedule-requests', [CampaignScheduleRequestController::class, 'getRequests']);
            Route::put('/schedule-requests/{requestId}/process', [CampaignScheduleRequestController::class, 'processRequest']);
            Route::get('/schedule-requests/stats', [CampaignScheduleRequestController::class, 'getStats']);
        });

        // ==================== COMELEC ROUTES ====================
        Route::middleware(['checkRole:comelec'])->prefix('comelec')->group(function () {

            // Get Users (COMELEC only)
            Route::get('/users', [AdminController::class, 'getUsers']);

            // Candidate Management (COMELEC can manage candidates)
            Route::post('/candidates/add', [AdminController::class, 'addCandidate']);
            Route::post('/candidates/bulk-add', [AdminController::class, 'addBulkCandidates']);
            Route::put('/candidates/{id}', [AdminController::class, 'updateCandidate']);
            Route::delete('/candidates/{id}', [AdminController::class, 'deleteCandidate']);
            Route::get('/candidates', [AdminController::class, 'getAllCandidates']);

            // Campaign Schedule Management (COMELEC only)
            Route::prefix('campaign-schedules')->group(function () {
                Route::post('/election/{electionId}', [CampaignScheduleController::class, 'store']);
                Route::post('/election/{electionId}/bulk', [CampaignScheduleController::class, 'bulkStore']);
                Route::put('/{id}', [CampaignScheduleController::class, 'update']);
                Route::delete('/{id}', [CampaignScheduleController::class, 'destroy']);
            });

            // Schedule Requests (COMELEC can also manage)
            Route::get('/schedule-requests', [CampaignScheduleRequestController::class, 'getRequests']);
            Route::put('/schedule-requests/{requestId}/process', [CampaignScheduleRequestController::class, 'processRequest']);
            Route::get('/schedule-requests/stats', [CampaignScheduleRequestController::class, 'getStats']);
        });

        // ==================== CAMPAIGN SCHEDULES - PUBLIC GET ROUTES ====================
        Route::prefix('campaign-schedules')->group(function () {
            Route::get('/election/{electionId}', [CampaignScheduleController::class, 'index']);
            Route::get('/course/{electionId}/{courseSection}', [CampaignScheduleController::class, 'getByCourse']);
            Route::get('/candidate/{candidateId}', [CampaignScheduleController::class, 'getCandidateSchedules']);
        });

        // ==================== MONITORING ROUTES (Admin & COMELEC) ====================
        Route::middleware(['checkRole:admin,comelec'])->prefix('monitoring')->group(function () {
            Route::get('/audit-trail/all', [MonitoringController::class, 'getAllAuditTrail']);
            Route::get('/dashboard/{electionId}', [MonitoringController::class, 'getDashboard']);
            Route::get('/results/{electionId}', [MonitoringController::class, 'getLiveResults']);
            Route::get('/turnout/{electionId}', [MonitoringController::class, 'getTurnout']);
            Route::get('/audit-trail/{electionId}', [MonitoringController::class, 'getAuditTrail']);
            Route::get('/audit-trail/user/{userId}', [MonitoringController::class, 'getUserAuditTrail']);
            Route::get('/voters/{electionId}', [MonitoringController::class, 'getVoterStatus']);
            Route::get('/positions/{electionId}', [MonitoringController::class, 'getPositionProgress']);
            Route::get('/statistics/{electionId}', [MonitoringController::class, 'getStatistics']);
            Route::get('/realtime/{electionId}', [MonitoringController::class, 'getRealtimeUpdates']);
            Route::post('/refresh/{electionId}', [MonitoringController::class, 'refreshData']);
            Route::get('/courses', [CourseController::class, 'getAllCourses']);
            Route::get('/courses/with-stats', [CourseController::class, 'getCoursesWithStats']);
            Route::post('/courses', [CourseController::class, 'store']);
            Route::put('/courses/{id}', [CourseController::class, 'update']);
            Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
        });

        // ==================== CAMPAIGN POST ROUTES ====================
        // ✅ Removed checkRole:candidate - only auth:sanctum is needed
        // The controller will handle role validation internally
        Route::prefix('campaign-posts')->group(function () {
            // Get posts for an election (Voters & everyone)
            Route::get('/election/{electionId}', [CampaignPostController::class, 'getPosts']);
            Route::get('/candidate/{candidateId}', [CampaignPostController::class, 'getCandidatePosts']);

            // Comment on a post
            Route::post('/{postId}/comments', [CampaignPostController::class, 'addComment']);
            Route::delete('/comments/{commentId}', [CampaignPostController::class, 'deleteComment']);

            // Reactions
            Route::post('/{postId}/reactions', [CampaignPostController::class, 'addReaction']);
            Route::delete('/{postId}/reactions', [CampaignPostController::class, 'removeReaction']);

            // ✅ Candidate/Admin only routes - Create, Update, Delete
            Route::post('/', [CampaignPostController::class, 'createPost']);
            Route::put('/{postId}', [CampaignPostController::class, 'updatePost']);
            Route::delete('/{postId}', [CampaignPostController::class, 'deletePost']);
        });
    });
});
