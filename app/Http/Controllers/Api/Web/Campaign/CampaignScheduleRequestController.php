<?php
// app/Http/Controllers/Api/Web/Campaign/CampaignScheduleRequestController.php

namespace App\Http\Controllers\Api\Web\Campaign;

use App\Http\Controllers\Controller;
use App\Models\CampaignScheduleRequest;
use App\Models\CampaignSchedule;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\CourseSection;
use App\Models\AuditLog;
use App\Services\NotificationService;
use App\Traits\HasApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CampaignScheduleRequestController extends Controller
{
    use HasApiResponse;

    /**
     * Candidate submits a schedule request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'section_id' => 'required|exists:course_sections,section_id',
            'preferred_date' => 'required|date|after_or_equal:today',
            'preferred_start_time' => 'required|date_format:H:i',
            'preferred_end_time' => 'required|date_format:H:i|after:preferred_start_time',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $electionId = $request->election_id;

        // Check if user is an approved candidate in this election
        $candidate = Candidate::where('user_id', $user->user_id)
            ->where('election_id', $electionId)
            ->where('is_approved', true)
            ->first();

        if (!$candidate) {
            return response()->json([
                'success' => false,
                'message' => 'You are not an approved candidate in this election'
            ], 403);
        }

        // Check if candidate already has a pending request
        $existingPending = CampaignScheduleRequest::where('candidate_id', $candidate->candidate_id)
            ->where('election_id', $electionId)
            ->where('status', 'pending')
            ->first();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending schedule request. Please wait for it to be processed.'
            ], 400);
        }

        // Check for overlapping requests
        $preferredDate = $request->preferred_date;
        $startTime = $request->preferred_start_time;
        $endTime = $request->preferred_end_time;

        $overlap = CampaignScheduleRequest::where('section_id', $request->section_id)
            ->where('preferred_date', $preferredDate)
            ->where('status', 'pending')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('preferred_start_time', '<', $endTime)
                        ->where('preferred_end_time', '>', $startTime);
                });
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Another candidate has already requested this time slot for the same section.'
            ], 400);
        }

        // Create the request
        $scheduleRequest = CampaignScheduleRequest::create([
            'candidate_id' => $candidate->candidate_id,
            'election_id' => $electionId,
            'section_id' => $request->section_id,
            'preferred_date' => $request->preferred_date,
            'preferred_start_time' => $request->preferred_start_time,
            'preferred_end_time' => $request->preferred_end_time,
            'message' => $request->message,
            'status' => 'pending',
        ]);

        AuditLog::create([
            'user_id' => $user->user_id,
            'action_type' => 'CREATE_SCHEDULE_REQUEST',
            'target_table' => 'campaign_schedule_requests',
            'target_id' => $scheduleRequest->request_id,
            'new_value' => json_encode($scheduleRequest->toArray()),
            'ip_address' => $request->ip(),
        ]);

        // ✅ Notify admins/comelec about new schedule request
        try {
            $notificationService = app(NotificationService::class);
            $adminUsers = \App\Models\User::whereIn('role', ['admin', 'comelec'])->get();
            $candidateName = $user->first_name . ' ' . $user->last_name;
            $section = $scheduleRequest->section;
            $sectionDisplay = $section->course->course_code . ' - Year ' . $section->year_level . ' Section ' . $section->section_code;

            foreach ($adminUsers as $admin) {
                $notificationService->send(
                    $admin->user_id,
                    '📋 New Schedule Request',
                    "{$candidateName} requested schedule for {$sectionDisplay} on {$preferredDate} at {$startTime} - {$endTime}",
                    'system',
                    [
                        'candidate' => $candidateName,
                        'candidate_id' => $candidate->candidate_id,
                        'request_id' => $scheduleRequest->request_id,
                        'section' => $sectionDisplay,
                        'date' => $preferredDate,
                        'time' => $startTime . ' - ' . $endTime
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send schedule request notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Schedule request submitted successfully. Please wait for approval.',
            'data' => $scheduleRequest->load(['candidate.user', 'section.course', 'election'])
        ], 201);
    }

    /**
     * Get candidate's schedule requests
     */
    public function getMyRequests(Request $request)
    {
        try {
            $user = $request->user();

            $candidate = Candidate::where('user_id', $user->user_id)->first();

            if (!$candidate) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0
                ]);
            }

            $requests = CampaignScheduleRequest::where('candidate_id', $candidate->candidate_id)
                ->with(['section.course', 'election', 'processedBy'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($request) {
                    return [
                        'request_id' => $request->request_id,
                        'candidate_id' => $request->candidate_id,
                        'election_id' => $request->election_id,
                        'election_title' => $request->election ? $request->election->title : 'N/A',
                        'section_id' => $request->section_id,
                        'section' => $request->section ? [
                            'section_id' => $request->section->section_id,
                            'section_code' => $request->section->section_code,
                            'year_level' => $request->section->year_level,
                            'course' => $request->section->course ? [
                                'course_code' => $request->section->course->course_code,
                            ] : null,
                            'display_name' => $request->section->course ?
                                $request->section->course->course_code . ' - Year ' . $request->section->year_level . ' Section ' . $request->section->section_code :
                                'Unknown Section',
                        ] : null,
                        'preferred_date' => $request->preferred_date,
                        'preferred_start_time' => $request->preferred_start_time,
                        'preferred_end_time' => $request->preferred_end_time,
                        'message' => $request->message,
                        'status' => $request->status,
                        'admin_remarks' => $request->admin_remarks,
                        'processed_by' => $request->processedBy ? [
                            'user_id' => $request->processedBy->user_id,
                            'first_name' => $request->processedBy->first_name,
                            'last_name' => $request->processedBy->last_name,
                        ] : null,
                        'processed_at' => $request->processed_at,
                        'created_at' => $request->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $requests,
                'total' => $requests->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching my requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all schedule requests for COMELEC/Admin
     */
    public function getRequests(Request $request)
    {
        try {
            $query = CampaignScheduleRequest::with([
                'candidate.user',
                'candidate.position',
                'section.course',
                'election',
                'processedBy'
            ]);

            if ($request->has('election_id')) {
                $query->where('election_id', $request->election_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date')) {
                $query->where('preferred_date', $request->date);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('candidate.user', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $requests = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process a schedule request (approve/reject/reschedule)
     */
    public function processRequest(Request $request, $requestId)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject,reschedule',
            'admin_remarks' => 'nullable|string|max:500',
            'new_date' => 'required_if:action,reschedule|date|after_or_equal:today',
            'new_start_time' => 'required_if:action,reschedule|date_format:H:i',
            'new_end_time' => 'required_if:action,reschedule|date_format:H:i|after:new_start_time',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $scheduleRequest = CampaignScheduleRequest::with(['candidate', 'section', 'election'])
            ->findOrFail($requestId);

        if ($scheduleRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This request has already been processed.'
            ], 400);
        }

        $action = $request->action;
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'comelec'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admin and COMELEC can process requests.'
            ], 403);
        }

        $notificationService = app(NotificationService::class);
        $candidate = $scheduleRequest->candidate;
        $section = $scheduleRequest->section;
        $sectionDisplay = $section->course->course_code . ' - Year ' . $section->year_level . ' Section ' . $section->section_code;
        $preferredDate = $scheduleRequest->preferred_date;
        $startTime = $scheduleRequest->preferred_start_time;
        $endTime = $scheduleRequest->preferred_end_time;

        DB::beginTransaction();

        try {
            if ($action === 'approve') {
                // Create campaign schedule
                $startDateTime = Carbon::parse($preferredDate . ' ' . $startTime);
                $endDateTime = Carbon::parse($preferredDate . ' ' . $endTime);

                $schedule = CampaignSchedule::create([
                    'election_id' => $scheduleRequest->election_id,
                    'section_id' => $scheduleRequest->section_id,
                    'candidate_id' => $scheduleRequest->candidate_id,
                    'start_time' => $startDateTime->format('Y-m-d H:i:s'),
                    'end_time' => $endDateTime->format('Y-m-d H:i:s'),
                    'status' => 'pending',
                    'created_by_user_id' => $user->user_id,
                    'notes' => $request->admin_remarks ?? 'Approved schedule request',
                ]);

                $scheduleRequest->status = 'approved';
                $scheduleRequest->admin_remarks = $request->admin_remarks;
                $scheduleRequest->processed_by_user_id = $user->user_id;
                $scheduleRequest->processed_at = now();
                $scheduleRequest->save();

                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'APPROVE_SCHEDULE_REQUEST',
                    'target_table' => 'campaign_schedule_requests',
                    'target_id' => $scheduleRequest->request_id,
                    'new_value' => json_encode([
                        'status' => 'approved',
                        'schedule_id' => $schedule->schedule_id,
                    ]),
                    'ip_address' => $request->ip(),
                ]);

                // ✅ Notify candidate about approval
                try {
                    $notificationService->scheduleRequestApproved(
                        $candidate->user_id,
                        $sectionDisplay,
                        $preferredDate,
                        $startTime . ' - ' . $endTime
                    );
                } catch (\Exception $e) {
                    Log::warning('Failed to send schedule approval notification: ' . $e->getMessage());
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Schedule request approved and added to campaign schedule.',
                    'data' => [
                        'request' => $scheduleRequest,
                        'schedule' => $schedule
                    ]
                ]);
            } elseif ($action === 'reject') {
                $scheduleRequest->status = 'rejected';
                $scheduleRequest->admin_remarks = $request->admin_remarks ?? 'Request rejected.';
                $scheduleRequest->processed_by_user_id = $user->user_id;
                $scheduleRequest->processed_at = now();
                $scheduleRequest->save();

                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'REJECT_SCHEDULE_REQUEST',
                    'target_table' => 'campaign_schedule_requests',
                    'target_id' => $scheduleRequest->request_id,
                    'new_value' => json_encode(['status' => 'rejected']),
                    'ip_address' => $request->ip(),
                ]);

                // ✅ Notify candidate about rejection
                try {
                    $notificationService->scheduleRequestRejected(
                        $candidate->user_id,
                        $sectionDisplay,
                        $request->admin_remarks ?? 'No reason provided'
                    );
                } catch (\Exception $e) {
                    Log::warning('Failed to send schedule rejection notification: ' . $e->getMessage());
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Schedule request rejected.',
                    'data' => $scheduleRequest
                ]);
            } elseif ($action === 'reschedule') {
                $newDate = $request->new_date;
                $newStartTime = $request->new_start_time;
                $newEndTime = $request->new_end_time;

                $startDateTime = Carbon::parse($newDate . ' ' . $newStartTime);
                $endDateTime = Carbon::parse($newDate . ' ' . $newEndTime);

                if ($endDateTime <= $startDateTime) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'End time must be after start time.'
                    ], 422);
                }

                $scheduleRequest->preferred_date = $newDate;
                $scheduleRequest->preferred_start_time = $newStartTime;
                $scheduleRequest->preferred_end_time = $newEndTime;
                $scheduleRequest->status = 'rescheduled';
                $scheduleRequest->admin_remarks = $request->admin_remarks ?? 'Schedule rescheduled.';
                $scheduleRequest->processed_by_user_id = $user->user_id;
                $scheduleRequest->processed_at = now();
                $scheduleRequest->save();

                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'RESCHEDULE_REQUEST',
                    'target_table' => 'campaign_schedule_requests',
                    'target_id' => $scheduleRequest->request_id,
                    'new_value' => json_encode([
                        'status' => 'rescheduled',
                        'new_date' => $newDate,
                        'new_start_time' => $newStartTime,
                        'new_end_time' => $newEndTime,
                    ]),
                    'ip_address' => $request->ip(),
                ]);

                // ✅ Notify candidate about reschedule
                try {
                    $notificationService->scheduleRequestRescheduled(
                        $candidate->user_id,
                        $sectionDisplay,
                        $newDate,
                        $newStartTime . ' - ' . $newEndTime
                    );
                } catch (\Exception $e) {
                    Log::warning('Failed to send schedule reschedule notification: ' . $e->getMessage());
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Schedule request rescheduled. Candidate has been notified.',
                    'data' => $scheduleRequest
                ]);
            }

            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Invalid action.',
            ], 400);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error processing request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a schedule request
     */
    public function destroy(Request $request, $requestId)
    {
        try {
            $scheduleRequest = CampaignScheduleRequest::findOrFail($requestId);
            $user = $request->user();

            $candidate = Candidate::where('user_id', $user->user_id)->first();
            $isOwner = $candidate && $scheduleRequest->candidate_id === $candidate->candidate_id;
            $isAdmin = in_array($user->role, ['admin', 'comelec']);

            if (!$isOwner && !$isAdmin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this request.'
                ], 403);
            }

            if ($scheduleRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending requests can be cancelled.'
                ], 400);
            }

            $scheduleRequest->delete();

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'DELETE_SCHEDULE_REQUEST',
                'target_table' => 'campaign_schedule_requests',
                'target_id' => $requestId,
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Schedule request cancelled successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available sections for scheduling
     */
    public function getAvailableSections(Request $request, $electionId)
    {
        try {
            $user = $request->user();

            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $electionId)
                ->where('is_approved', true)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not an approved candidate in this election.'
                ], 403);
            }

            $election = Election::findOrFail($electionId);

            $query = CourseSection::with('course')
                ->where('is_active', true);

            if ($election->course_id) {
                $query->where('course_id', $election->course_id);
            }

            $sections = $query->orderBy('course_id')
                ->orderBy('year_level')
                ->orderBy('section_code')
                ->get()
                ->map(function ($section) {
                    return [
                        'section_id' => $section->section_id,
                        'section_code' => $section->section_code,
                        'year_level' => $section->year_level,
                        'course' => $section->course ? [
                            'course_id' => $section->course->course_id,
                            'course_code' => $section->course->course_code,
                        ] : null,
                        'display_name' => $section->course ?
                            $section->course->course_code . ' - Year ' . $section->year_level . ' Section ' . $section->section_code :
                            'Unknown Section',
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $sections
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available sections: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sections: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get summary statistics for schedule requests
     */
    public function getStats(Request $request)
    {
        try {
            $electionId = $request->get('election_id');

            $query = CampaignScheduleRequest::query();

            if ($electionId) {
                $query->where('election_id', $electionId);
            }

            $stats = [
                'total' => $query->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'rejected' => (clone $query)->where('status', 'rejected')->count(),
                'rescheduled' => (clone $query)->where('status', 'rescheduled')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
