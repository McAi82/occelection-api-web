<?php
// app/Http/Controllers/Api/Web/Candidacy/CandidacyController.php

namespace App\Http\Controllers\Api\Web\Candidacy;

use App\Http\Controllers\Controller;
use App\Models\CandidacyApplication;
use App\Models\Election;
use App\Models\User;
use App\Models\Candidate;
use App\Models\Position;
use App\Models\Partylist;
use App\Models\PartylistMembership;
use App\Models\AuditLog;
use App\Services\NotificationService;
use App\Traits\HasApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class CandidacyController extends Controller
{
    use HasApiResponse;

    /**
     * Voter submits candidacy application
     */
    public function apply(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'form_data' => 'required|array',
            'form_data.lastName' => 'required|string|max:50',
            'form_data.firstName' => 'required|string|max:50',
            'form_data.mi' => 'nullable|string|max:5',
            'form_data.age' => 'required|integer|min:16|max:99',
            'form_data.course' => 'required|string|max:100',
            'form_data.presentAddress' => 'required|string|max:200',
            'form_data.presentAddress2' => 'nullable|string|max:200',
            'form_data.studentNo' => 'required|string|max:20',
            'form_data.currentYear' => 'required|string|max:20',
            'form_data.noUnitLoad' => 'required|integer|min:0|max:30',
            'form_data.cellphone' => 'required|string|min:10|max:11',
            'form_data.socialMedia' => 'nullable|string|max:100',
            'form_data.positionCSG' => 'boolean',
            'form_data.positionSC' => 'boolean',
            'form_data.department' => 'nullable|string|max:100',
            'form_data.partyIndependent' => 'boolean',
            'form_data.partyOther' => 'boolean',
            'form_data.politicalParty' => 'nullable|string|max:100',
            'form_data.aff1Org' => 'nullable|string|max:100',
            'form_data.aff1Pos' => 'nullable|string|max:100',
            'form_data.aff1Date' => 'nullable|string|max:20',
            'form_data.aff2Org' => 'nullable|string|max:100',
            'form_data.aff2Pos' => 'nullable|string|max:100',
            'form_data.aff2Date' => 'nullable|string|max:20',
            'form_data.aff3Org' => 'nullable|string|max:100',
            'form_data.aff3Pos' => 'nullable|string|max:100',
            'form_data.aff3Date' => 'nullable|string|max:20',
            'form_data.day' => 'required|integer|min:1|max:31',
            'form_data.month' => 'required|string|max:20',
            'form_data.year' => 'required|string|max:10',
            'form_data.platform' => 'nullable|string',
            'form_data.qualifications' => 'nullable|string',
            'form_data.selectedPosition' => 'required|string|max:100',
            'selected_partylist_id' => 'nullable|exists:partylists,partylist_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // ✅ Check if user is authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        $electionId = $request->election_id;
        $formData = $request->form_data;
        $selectedPartylistId = $request->selected_partylist_id;

        // Check if user already applied for this election
        $existing = CandidacyApplication::where('user_id', $user->user_id)
            ->where('election_id', $electionId)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted an application for this election.'
            ], 400);
        }

        // Check if user is already a candidate
        $isCandidate = Candidate::where('user_id', $user->user_id)
            ->where('election_id', $electionId)
            ->exists();

        if ($isCandidate) {
            return response()->json([
                'success' => false,
                'message' => 'You are already a candidate in this election.'
            ], 400);
        }

        // Check if at least one organization is selected
        if (!$formData['positionCSG'] && !$formData['positionSC']) {
            return response()->json([
                'success' => false,
                'message' => 'Please select an organization',
                'errors' => ['organization' => ['Please select an organization']]
            ], 422);
        }

        // Check if a specific position is selected
        if (empty($formData['selectedPosition'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please select a specific position',
                'errors' => ['position' => ['Please select a specific position']]
            ], 422);
        }

        // Check party affiliation
        if (!$formData['partyIndependent'] && !$formData['partyOther']) {
            return response()->json([
                'success' => false,
                'message' => 'Please select your political party affiliation',
                'errors' => ['party' => ['Please select your political party affiliation']]
            ], 422);
        }

        // If partyOther is true, politicalParty must have a value
        if ($formData['partyOther'] && empty($formData['politicalParty'])) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter the political party name',
                'errors' => ['politicalParty' => ['Please enter the political party name']]
            ], 422);
        }

        $application = CandidacyApplication::create([
            'user_id' => $user->user_id,
            'election_id' => $electionId,
            'form_data' => $formData,
            'selected_partylist_id' => $selectedPartylistId,
            'admin_status' => 'pending',
        ]);

        AuditLog::create([
            'user_id' => $user->user_id,
            'action_type' => 'SUBMIT_CANDIDACY_APPLICATION',
            'target_table' => 'candidacy_applications',
            'target_id' => $application->application_id,
            'new_value' => json_encode([
                'election_id' => $electionId,
                'selected_partylist_id' => $selectedPartylistId,
            ]),
            'ip_address' => $request->ip(),
        ]);

        // ✅ Send notification to applicant (with error handling)
        try {
            $notificationService = app(NotificationService::class);
            $election = Election::find($electionId);
            $position = $formData['selectedPosition'] ?? 'Unknown Position';

            if ($election && $notificationService) {
                $notificationService->applicationSubmitted(
                    $user->user_id,
                    $election->title ?? 'Election',
                    $position
                );

                // ✅ Notify all admins about new application
                $adminUsers = User::where('role', 'admin')->get();
                foreach ($adminUsers as $admin) {
                    $notificationService->send(
                        $admin->user_id,
                        '📋 New Candidacy Application',
                        "{$user->first_name} {$user->last_name} applied for {$position} in {$election->title}",
                        'system',
                        [
                            'applicant' => $user->first_name . ' ' . $user->last_name,
                            'position' => $position,
                            'election' => $election->title,
                            'application_id' => $application->application_id
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send application notifications: ' . $e->getMessage());
            // ✅ Continue even if notification fails
        }

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
            'data' => $application
        ], 201);
    }

    /**
     * Admin: List all applications (with filters)
     */
    public function adminList(Request $request)
    {
        try {
            $query = CandidacyApplication::with(['user', 'election'])
                ->orderBy('created_at', 'desc');

            if ($request->has('status')) {
                $query->where('admin_status', $request->status);
            }

            if ($request->has('election_id')) {
                $query->where('election_id', $request->election_id);
            }

            $applications = $query->get();

            $transformed = $applications->map(function ($app) {
                return [
                    'application_id' => $app->application_id,
                    'user_id' => $app->user_id,
                    'election_id' => $app->election_id,
                    'form_data' => $app->form_data,
                    'admin_status' => $app->admin_status,
                    'admin_approved_at' => $app->admin_approved_at,
                    'admin_approved_by_user_id' => $app->admin_approved_by_user_id,
                    'admin_remarks' => $app->admin_remarks,
                    'recommendation_letter_path' => $app->recommendation_letter_path,
                    'letter_generated' => $app->letter_generated,
                    'created_at' => $app->created_at,
                    'updated_at' => $app->updated_at,
                    'user' => $app->user ? [
                        'user_id' => $app->user->user_id,
                        'first_name' => $app->user->first_name,
                        'last_name' => $app->user->last_name,
                        'email' => $app->user->email,
                        'student_id' => $app->user->student_id,
                    ] : null,
                    'election' => $app->election ? [
                        'election_id' => $app->election->election_id,
                        'title' => $app->election->title,
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformed,
                'total' => $transformed->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch applications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Admin: Approve application (first step)
     */
    public function adminApprove(Request $request, $id)
{
    $application = CandidacyApplication::with(['user', 'election'])->findOrFail($id);

    if ($application->admin_status !== 'pending') {
        return response()->json([
            'success' => false,
            'message' => 'This application has already been processed.'
        ], 400);
    }

    $user = $application->user;
    
    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User not found'
        ], 404);
    }

    $electionId = $application->election_id;
    $formData = $application->form_data;
    $selectedPartylistId = $application->selected_partylist_id;

    // Check if user is already a candidate
    $existingCandidate = Candidate::where('user_id', $user->user_id)
        ->where('election_id', $electionId)
        ->first();

    if ($existingCandidate) {
        return response()->json([
            'success' => false,
            'message' => 'User is already a candidate in this election.'
        ], 400);
    }

    // ✅ Initialize variables to avoid undefined errors
    $partylist = null;
    $isCreator = false;
    $partylistName = null;
    $membership = null;

    DB::transaction(function () use ($application, $request, $user, $formData, $selectedPartylistId, &$partylist, &$isCreator, &$partylistName, &$membership) {
        // Update application
        $application->admin_status = 'approved';
        $application->admin_approved_at = now();
        $application->admin_approved_by_user_id = $request->user()->user_id;
        $application->admin_remarks = $request->remarks;
        $application->save();

        // Generate recommendation letter
        $this->generateRecommendationLetter($application);

        // Get the selected position from form data
        $positionTitle = $formData['selectedPosition'] ?? null;
        
        if (!$positionTitle) {
            if ($formData['positionCSG'] ?? false) {
                $positionTitle = 'CSG President';
            } elseif ($formData['positionSC'] ?? false) {
                $positionTitle = 'Governor';
            } else {
                $positionTitle = 'Other';
            }
        }

        // Find position_id based on election and title
        $position = Position::where('election_id', $application->election_id)
            ->where('title', $positionTitle)
            ->first();

        if (!$position) {
            $position = Position::where('election_id', $application->election_id)
                ->where('title', 'like', '%' . $positionTitle . '%')
                ->first();
        }

        if (!$position) {
            $position = Position::where('election_id', $application->election_id)->first();
        }

        // Create candidate record
        $candidate = Candidate::create([
            'user_id' => $user->user_id,
            'election_id' => $application->election_id,
            'position_id' => $position ? $position->position_id : null,
            'platform' => $formData['platform'] ?? 'To be announced',
            'qualifications' => $formData['qualifications'] ?? 'To be announced',
            'photo_url' => null,
            'is_approved' => true,
            'approved_by_user_id' => $request->user()->user_id,
            'approved_at' => now(),
        ]);

        // ✅ CHECK: Is this the highest position? If so, create a partylist
        $isHighest = $this->isHighestPosition($application->election_id, $positionTitle);
        
        if ($isHighest) {
            // ✅ Create partylist for the highest position candidate
            $partylist = $this->createPartylistForCandidate($candidate, $user, $formData);
            $isCreator = true;
            $partylistName = $partylist ? $partylist->name : null;
            
            Log::info('✅ Partylist created for highest position', [
                'candidate_id' => $candidate->candidate_id,
                'partylist_id' => $partylist ? $partylist->partylist_id : null,
                'partylist_name' => $partylistName,
                'user_id' => $user->user_id,
            ]);
        } 
        // ✅ If not highest position and has selected partylist, create PENDING membership request
        else if ($selectedPartylistId) {
            $partylist = Partylist::where('partylist_id', $selectedPartylistId)
                ->where('election_id', $application->election_id)
                ->first();

            if ($partylist) {
                // ✅ Create PENDING membership (not approved yet)
                $membership = PartylistMembership::create([
                    'partylist_id' => $partylist->partylist_id,
                    'candidate_id' => $candidate->candidate_id,
                    'status' => 'pending',
                    'approved_at' => null,
                    'approved_by_user_id' => null,
                    'is_active' => true,
                ]);

                Log::info('✅ Candidate applied to partylist (pending approval)', [
                    'candidate_id' => $candidate->candidate_id,
                    'partylist_id' => $partylist->partylist_id,
                    'partylist_name' => $partylist->name,
                    'membership_id' => $membership->membership_id,
                    'user_id' => $user->user_id,
                ]);

                $partylistName = $partylist->name;

                // ✅ Notify partylist creator about new request
                try {
                    $notificationService = app(NotificationService::class);
                    $creatorId = $partylist->created_by_user_id;
                    $candidateName = $user->first_name . ' ' . $user->last_name;
                    
                    // ✅ FIX: Get position title safely
                    $positionTitleForNotification = 'Unknown Position';
                    if ($candidate->position) {
                        $positionTitleForNotification = $candidate->position->title;
                    }
                    
                    $notificationService->send(
                        $creatorId,
                        '📋 New Partylist Membership Request',
                        "{$candidateName} (Position: {$positionTitleForNotification}) has requested to join your partylist \"{$partylist->name}\". Please review and approve or reject the request.",
                        'system',
                        [
                            'candidate' => $candidateName,
                            'candidate_id' => $candidate->candidate_id,
                            'partylist' => $partylist->name,
                            'partylist_id' => $partylist->partylist_id,
                            'membership_id' => $membership->membership_id,
                            'position' => $positionTitleForNotification
                        ]
                    );
                } catch (\Exception $e) {
                    Log::warning('Failed to send partylist request notification: ' . $e->getMessage());
                }
            } else {
                Log::warning('Selected partylist not found for membership request', [
                    'selected_partylist_id' => $selectedPartylistId,
                    'candidate_id' => $candidate->candidate_id,
                ]);
            }
        }

        // Update user role to candidate
        if ($user->role !== 'candidate') {
            $user->role = 'candidate';
            $user->save();
        }

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'ADMIN_APPROVE_CANDIDATE',
            'target_table' => 'candidates',
            'target_id' => $candidate->candidate_id,
            'new_value' => json_encode([
                'user_id' => $user->user_id,
                'election_id' => $application->election_id,
                'position_id' => $position ? $position->position_id : null,
                'position_title' => $positionTitle,
                'is_creator' => $isCreator,
                'partylist_created' => $isHighest,
                'partylist_name' => $partylistName,
                'auto_joined_partylist' => !$isHighest && $selectedPartylistId,
                'membership_status' => !$isHighest && $selectedPartylistId ? 'pending' : null,
            ]),
            'ip_address' => $request->ip(),
        ]);

        // ✅ Send notification to applicant (Admin Approved)
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->candidateApprovedAdmin(
                $user->user_id,
                $positionTitle,
                $application->election->title
            );
        } catch (\Exception $e) {
            Log::warning('Failed to send admin approval notification: ' . $e->getMessage());
        }
    });

    return response()->json([
        'success' => true,
        'message' => 'Application approved. Candidate registered successfully.',
        'data' => [
            'application' => $application->fresh(),
            'partylist_created' => $partylist !== null,
            'partylist_name' => $partylistName,
            'membership_status' => $membership ? $membership->status : ($isCreator ? 'approved' : null),
        ]
    ]);
}

    /**
     * Admin: Reject application
     */
    public function adminReject(Request $request, $id)
    {
        $application = CandidacyApplication::with(['user', 'election'])->findOrFail($id);

        if ($application->admin_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This application has already been processed.'
            ], 400);
        }

        $user = $application->user;

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $formData = $application->form_data;
        $positionTitle = $formData['selectedPosition'] ?? 'Unknown Position';

        $application->admin_status = 'rejected';
        $application->admin_remarks = $request->remarks;
        $application->save();

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'ADMIN_REJECT_CANDIDATE',
            'target_table' => 'candidacy_applications',
            'target_id' => $application->application_id,
            'new_value' => json_encode(['admin_status' => 'rejected']),
            'ip_address' => $request->ip(),
        ]);

        // ✅ Send rejection notification
        try {
            $notificationService = app(NotificationService::class);
            if ($notificationService) {
                $notificationService->candidateRejected(
                    $user->user_id,
                    $positionTitle,
                    $application->election->title,
                    $request->remarks
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send rejection notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Application rejected.',
            'data' => $application
        ]);
    }

    /**
     * COMELEC: List applications that are admin-approved
     */
    public function comelecList(Request $request)
    {
        $query = CandidacyApplication::with(['user', 'election'])
            ->where('admin_status', 'approved')
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('comelec_status', $request->status);
        }

        if ($request->has('election_id')) {
            $query->where('election_id', $request->election_id);
        }

        $applications = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Check if position is the highest position for an election
     */
    private function isHighestPosition($electionId, $positionTitle)
    {
        $topPosition = Position::where('election_id', $electionId)
            ->orderBy('order_in_ballot')
            ->first();

        if (!$topPosition) {
            return false;
        }

        return $topPosition->title === $positionTitle;
    }

    /**
     * Create a partylist for the highest position candidate
     */
    private function createPartylistForCandidate($candidate, $user, $formData)
    {
        try {
            $partylistName = null;

            if (isset($formData['partyOther']) && $formData['partyOther'] === true && !empty($formData['politicalParty'])) {
                $partylistName = $formData['politicalParty'];
            } else if (isset($formData['partyIndependent']) && $formData['partyIndependent'] === true) {
                $partylistName = $user->first_name . ' ' . $user->last_name . "'s Independent Partylist";
            } else {
                $partylistName = $user->first_name . ' ' . $user->last_name . "'s Partylist";
            }

            $election = Election::find($candidate->election_id);

            $partylist = Partylist::create([
                'election_id' => $candidate->election_id,
                'name' => $partylistName,
                'description' => 'Partylist created by ' . $user->first_name . ' ' . $user->last_name . ' for ' . ($election ? $election->title : 'Election'),
                'created_by_user_id' => $user->user_id,
                'approved_by_user_id' => $user->user_id,
            ]);

            PartylistMembership::create([
                'partylist_id' => $partylist->partylist_id,
                'candidate_id' => $candidate->candidate_id,
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by_user_id' => $user->user_id,
                'is_active' => true,
            ]);

            Log::info('Partylist created for candidate', [
                'candidate_id' => $candidate->candidate_id,
                'partylist_id' => $partylist->partylist_id,
                'partylist_name' => $partylistName,
                'user_id' => $user->user_id,
            ]);

            return $partylist;
        } catch (\Exception $e) {
            Log::error('Failed to create partylist: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * COMELEC: Approve candidate (final step)
     */
    public function comelecApprove(Request $request, $id)
    {
        $application = CandidacyApplication::with(['user', 'election'])->findOrFail($id);

        if ($application->admin_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'This application has not been admin-approved.'
            ], 400);
        }

        if ($application->comelec_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This application has already been processed by COMELEC.'
            ], 400);
        }

        $user = $application->user;

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $electionId = $application->election_id;
        $formData = $application->form_data;

        // Check if user is already a candidate
        $existingCandidate = Candidate::where('user_id', $user->user_id)
            ->where('election_id', $electionId)
            ->first();

        if ($existingCandidate) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a candidate in this election.'
            ], 400);
        }

        DB::transaction(function () use ($application, $request, $user, $formData) {
            $application->comelec_status = 'approved';
            $application->comelec_approved_at = now();
            $application->comelec_approved_by_user_id = $request->user()->user_id;
            $application->comelec_remarks = $request->remarks;
            $application->save();

            $positionTitle = $formData['selectedPosition'] ?? null;

            if (!$positionTitle) {
                if ($formData['positionCSG'] ?? false) {
                    $positionTitle = 'CSG President';
                } elseif ($formData['positionSC'] ?? false) {
                    $positionTitle = 'Governor';
                } else {
                    $positionTitle = 'Other';
                }
            }

            $position = Position::where('election_id', $application->election_id)
                ->where('title', $positionTitle)
                ->first();

            if (!$position) {
                $position = Position::where('election_id', $application->election_id)
                    ->where('title', 'like', '%' . $positionTitle . '%')
                    ->first();
            }

            if (!$position) {
                $position = Position::where('election_id', $application->election_id)->first();
            }

            $candidate = Candidate::create([
                'user_id' => $user->user_id,
                'election_id' => $application->election_id,
                'position_id' => $position ? $position->position_id : null,
                'platform' => $formData['platform'] ?? 'To be announced',
                'qualifications' => $formData['qualifications'] ?? 'To be announced',
                'photo_url' => null,
                'is_approved' => true,
                'approved_by_user_id' => $request->user()->user_id,
                'approved_at' => now(),
            ]);

            $isHighest = $this->isHighestPosition($application->election_id, $positionTitle);

            $partylist = null;
            $isCreator = false;
            $partylistName = null;

            if ($isHighest) {
                $partylist = $this->createPartylistForCandidate($candidate, $user, $formData);
                $isCreator = true;
                $partylistName = $partylist ? $partylist->name : null;
            }

            if ($user->role !== 'candidate') {
                $user->role = 'candidate';
                $user->save();
            }

            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'COMELEC_APPROVE_CANDIDATE',
                'target_table' => 'candidates',
                'target_id' => $candidate->candidate_id,
                'new_value' => json_encode([
                    'user_id' => $user->user_id,
                    'election_id' => $application->election_id,
                    'position_id' => $position ? $position->position_id : null,
                    'position_title' => $positionTitle,
                    'is_creator' => $isCreator,
                    'partylist_created' => $isHighest,
                    'partylist_name' => $partylistName,
                ]),
                'ip_address' => $request->ip(),
            ]);

            // ✅ Send notification to applicant (COMELEC Approved)
            try {
                $notificationService = app(NotificationService::class);
                if ($notificationService) {
                    $notificationService->candidateApprovedComelec(
                        $user->user_id,
                        $positionTitle,
                        $application->election->title
                    );
                }
            } catch (\Exception $e) {
                Log::warning('Failed to send COMELEC approval notification: ' . $e->getMessage());
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Candidate approved and registered successfully.',
            'data' => [
                'application' => $application->fresh(),
                'partylist_created' => true,
                'partylist_name' => $formData['politicalParty'] ?? null,
            ]
        ]);
    }

    /**
     * COMELEC: Reject candidate (final step)
     */
    public function comelecReject(Request $request, $id)
    {
        $application = CandidacyApplication::with(['user', 'election'])->findOrFail($id);

        if ($application->admin_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'This application has not been admin-approved.'
            ], 400);
        }

        if ($application->comelec_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This application has already been processed by COMELEC.'
            ], 400);
        }

        $user = $application->user;

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $formData = $application->form_data;
        $positionTitle = $formData['selectedPosition'] ?? 'Unknown Position';

        $application->comelec_status = 'rejected';
        $application->comelec_remarks = $request->remarks;
        $application->save();

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'COMELEC_REJECT_CANDIDATE',
            'target_table' => 'candidacy_applications',
            'target_id' => $application->application_id,
            'new_value' => json_encode(['comelec_status' => 'rejected']),
            'ip_address' => $request->ip(),
        ]);

        // ✅ Send rejection notification
        try {
            $notificationService = app(NotificationService::class);
            if ($notificationService) {
                $notificationService->candidateRejected(
                    $user->user_id,
                    $positionTitle,
                    $application->election->title,
                    $request->remarks
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send COMELEC rejection notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Candidate application rejected by COMELEC.',
            'data' => $application
        ]);
    }

    /**
     * Get application details (for voter to check status)
     */
    public function getMyApplication(Request $request, $electionId = null)
    {
        $user = $request->user();
        $query = CandidacyApplication::where('user_id', $user->user_id);

        if ($electionId) {
            $query->where('election_id', $electionId);
        }

        $applications = $query->with('election')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    /**
     * Get available partylists for a candidate to join
     */
    public function getAvailablePartylists(Request $request, $electionId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $userCandidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $electionId)
                ->where('is_approved', true)
                ->first();

            if (!$userCandidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not an approved candidate in this election'
                ], 403);
            }

            $existingMembership = PartylistMembership::where('candidate_id', $userCandidate->candidate_id)
                ->where('status', 'approved')
                ->where('is_active', true)
                ->first();

            if ($existingMembership) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are already a member of a partylist',
                    'data' => [
                        'partylist_id' => $existingMembership->partylist_id,
                        'partylist_name' => $existingMembership->partylist->name ?? null
                    ]
                ], 400);
            }

            $positionTitle = $userCandidate->position ? $userCandidate->position->title : null;
            $isHighest = $this->isHighestPosition($electionId, $positionTitle);

            $partylists = Partylist::where('election_id', $electionId)
                ->withCount(['activeMemberships as members_count'])
                ->with(['creator'])
                ->get()
                ->map(function ($partylist) use ($userCandidate) {
                    $pendingRequest = PartylistMembership::where('partylist_id', $partylist->partylist_id)
                        ->where('candidate_id', $userCandidate->candidate_id)
                        ->where('status', 'pending')
                        ->first();

                    return [
                        'partylist_id' => $partylist->partylist_id,
                        'name' => $partylist->name,
                        'description' => $partylist->description,
                        'logo_url' => $partylist->logo_url,
                        'members_count' => $partylist->members_count ?? 0,
                        'creator' => $partylist->creator ? [
                            'user_id' => $partylist->creator->user_id,
                            'first_name' => $partylist->creator->first_name,
                            'last_name' => $partylist->creator->last_name,
                        ] : null,
                        'has_pending_request' => !is_null($pendingRequest),
                        'request_id' => $pendingRequest?->membership_id,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'can_create' => $isHighest,
                    'create_message' => $isHighest ?
                        'You are running for the highest position. A partylist has been or will be created for you.' :
                        'You can join an existing partylist.',
                    'is_highest_position' => $isHighest,
                    'position_title' => $positionTitle,
                    'partylists' => $partylists,
                    'user_candidate' => [
                        'candidate_id' => $userCandidate->candidate_id,
                        'position' => $userCandidate->position ? [
                            'position_id' => $userCandidate->position->position_id,
                            'title' => $userCandidate->position->title,
                        ] : null,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available partylists: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available partylists: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Candidate applies to join a partylist
     */
    public function candidateApplyToPartylist(Request $request, $partylistId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            $partylist = Partylist::findOrFail($partylistId);

            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $partylist->election_id)
                ->where('is_approved', true)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'message' => 'You are not an approved candidate in this election'
                ], 403);
            }

            $existingMembership = PartylistMembership::where('candidate_id', $candidate->candidate_id)
                ->where('status', 'approved')
                ->where('is_active', true)
                ->first();

            if ($existingMembership) {
                return response()->json([
                    'message' => 'You are already a member of a partylist'
                ], 400);
            }

            $existingRequest = PartylistMembership::where('partylist_id', $partylistId)
                ->where('candidate_id', $candidate->candidate_id)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'message' => 'You already have a pending application for this partylist'
                ], 400);
            }

            $rejectedRequest = PartylistMembership::where('partylist_id', $partylistId)
                ->where('candidate_id', $candidate->candidate_id)
                ->where('status', 'rejected')
                ->first();

            if ($rejectedRequest) {
                return response()->json([
                    'message' => 'Your previous application was rejected'
                ], 400);
            }

            $membership = PartylistMembership::create([
                'partylist_id' => $partylistId,
                'candidate_id' => $candidate->candidate_id,
                'status' => 'pending',
                'is_active' => true,
            ]);

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'CANDIDATE_APPLY_PARTYLIST',
                'target_table' => 'partylist_memberships',
                'target_id' => $membership->membership_id,
                'new_value' => json_encode(['partylist_id' => $partylistId]),
                'ip_address' => $request->ip(),
            ]);

            // ✅ Notify partylist creator
            try {
                $notificationService = app(NotificationService::class);
                if ($notificationService) {
                    $creatorId = $partylist->created_by_user_id;
                    $candidateName = $user->first_name . ' ' . $user->last_name;
                    $position = $candidate->position ? $candidate->position->title : 'Unknown Position';

                    $notificationService->send(
                        $creatorId,
                        '📋 New Partylist Application',
                        "{$candidateName} (Position: {$position}) has applied to join your partylist \"{$partylist->name}\".",
                        'system',
                        [
                            'candidate' => $candidateName,
                            'candidate_id' => $candidate->candidate_id,
                            'partylist' => $partylist->name,
                            'partylist_id' => $partylistId,
                            'membership_id' => $membership->membership_id,
                            'position' => $position
                        ]
                    );
                }
            } catch (\Exception $e) {
                Log::warning('Failed to send partylist application notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'data' => $membership->load(['candidate.user'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error applying to partylist: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to apply to partylist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending requests for the partylist (creator only)
     */
    public function getPartylistRequests(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $partylist = Partylist::where('created_by_user_id', $user->user_id)->first();

            if (!$partylist) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'You are not a partylist creator'
                ]);
            }

            $requests = PartylistMembership::where('partylist_id', $partylist->partylist_id)
                ->where('status', 'pending')
                ->with(['candidate.user', 'candidate.position'])
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $requests,
                'partylist' => $partylist
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching partylist requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle partylist request (approve/reject)
     */
    public function handlePartylistRequest(Request $request, $membershipId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:approve,reject',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            $action = $request->action;

            $membership = PartylistMembership::with(['partylist', 'candidate'])
                ->findOrFail($membershipId);

            if ($membership->partylist->created_by_user_id !== $user->user_id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            if ($membership->status !== 'pending') {
                return response()->json([
                    'message' => 'This request has already been processed'
                ], 400);
            }

            $notificationService = app(NotificationService::class);
            $candidateId = $membership->candidate_id;
            $candidate = $membership->candidate;
            $candidateName = $candidate->user->first_name . ' ' . $candidate->user->last_name;
            $partylistName = $membership->partylist->name;

            if ($action === 'approve') {
                $membership->status = 'approved';
                $membership->approved_at = now();
                $membership->approved_by_user_id = $user->user_id;
                $membership->is_active = true;
                $membership->save();

                $message = 'Candidate approved and added to partylist';

                try {
                    if ($notificationService) {
                        $notificationService->partylistMembershipApproved(
                            $candidate->user_id,
                            $partylistName
                        );
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to send partylist approval notification: ' . $e->getMessage());
                }
            } else {
                $membership->status = 'rejected';
                $membership->is_active = false;
                $membership->save();

                $message = 'Application rejected';

                try {
                    if ($notificationService) {
                        $notificationService->partylistMembershipRejected(
                            $candidate->user_id,
                            $partylistName
                        );
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to send partylist rejection notification: ' . $e->getMessage());
                }
            }

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'HANDLE_PARTYLIST_REQUEST',
                'target_table' => 'partylist_memberships',
                'target_id' => $membershipId,
                'new_value' => json_encode(['status' => $action === 'approve' ? 'approved' : 'rejected']),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $membership->load('candidate.user')
            ]);
        } catch (\Exception $e) {
            Log::error('Error handling partylist request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to handle request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidate's partylist membership status
     */
    public function getMyPartylist(Request $request, $electionId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $electionId)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not a candidate in this election'
                ], 403);
            }

            $membership = PartylistMembership::where('candidate_id', $candidate->candidate_id)
                ->with(['partylist', 'partylist.activeMemberships.candidate.user'])
                ->first();

            if (!$membership) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'You are not a member of any partylist'
                ]);
            }

            $isCreator = $membership->partylist->created_by_user_id === $user->user_id;

            return response()->json([
                'success' => true,
                'data' => [
                    'membership' => $membership,
                    'partylist' => $membership->partylist,
                    'status' => $membership->status,
                    'is_creator' => $isCreator,
                    'is_approved' => $membership->status === 'approved',
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching my partylist: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylist: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadRecommendationLetter(Request $request, $id)
    {
        $application = CandidacyApplication::with(['user', 'election'])
            ->findOrFail($id);

        if ($application->admin_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Recommendation letter is only available for approved applications.'
            ], 403);
        }

        // ✅ Check if file exists in storage
        if ($application->recommendation_letter_path && Storage::disk('public')->exists($application->recommendation_letter_path)) {
            $filePath = Storage::disk('public')->path($application->recommendation_letter_path);
            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="recommendation_letter.pdf"',
            ]);
        }

        // ✅ Generate PDF if not exists
        return $this->generateRecommendationLetter($application, true);
    }

    /**
     * Voter downloads their own recommendation letter
     */
    public function voterDownloadRecommendationLetter(Request $request, $applicationId)
    {
        $application = CandidacyApplication::findOrFail($applicationId);

        if ($application->user_id !== $request->user()->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($application->admin_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Recommendation letter is not yet available. Please wait for admin approval.'
            ], 403);
        }

        // ✅ Check if file exists in storage
        if ($application->recommendation_letter_path && Storage::disk('public')->exists($application->recommendation_letter_path)) {
            $filePath = Storage::disk('public')->path($application->recommendation_letter_path);
            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="recommendation_letter.pdf"',
            ]);
        }

        // ✅ Generate PDF if not exists
        return $this->generateRecommendationLetter($application, true);
    }

    /**
     * Generate PDF recommendation letter
     */
    private function generateRecommendationLetter(CandidacyApplication $application, $download = false)
    {
        $data = [
            'application' => $application,
            'user' => $application->user,
            'election' => $application->election,
            'form' => $application->form_data,
            'date' => now()->format('F d, Y'),
        ];

        try {
            $pdf = Pdf::loadView('pdf.recommendation_letter', $data);
            $pdf->setPaper('letter', 'portrait');

            if ($download) {
                // ✅ Return PDF as download
                return $pdf->download('recommendation_letter.pdf');
            }

            // ✅ Save PDF to storage
            $filename = 'recommendation_letters/' . $application->application_id . '_' . time() . '.pdf';
            Storage::disk('public')->put($filename, $pdf->output());
            $application->recommendation_letter_path = $filename;
            $application->letter_generated = true;
            $application->save();

            return $pdf;
        } catch (\Exception $e) {
            Log::error('Failed to generate PDF: ' . $e->getMessage());

            if ($download) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to generate recommendation letter: ' . $e->getMessage()
                ], 500);
            }

            throw $e;
        }
    }

    public function getAvailableElections(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $now = now();

            // ✅ Get all active elections where voting hasn't ended
            $elections = Election::where('is_active', true)
                ->where('voting_end', '>', $now)
                ->with(['course'])
                ->orderBy('voting_start', 'asc')
                ->get();

            // ✅ Filter elections where user hasn't applied and isn't a candidate
            $availableElections = $elections->filter(function ($election) use ($user) {
                // Check if user already applied
                $hasApplied = CandidacyApplication::where('user_id', $user->user_id)
                    ->where('election_id', $election->election_id)
                    ->exists();

                // Check if user is already a candidate
                $isCandidate = Candidate::where('user_id', $user->user_id)
                    ->where('election_id', $election->election_id)
                    ->exists();

                // Check if user is a voter (only voters can apply)
                $isVoter = $user->role === 'voter';

                return !$hasApplied && !$isCandidate && $isVoter;
            })->values();

            // ✅ Get elections where user has applied (for status tracking)
            $appliedElections = CandidacyApplication::where('user_id', $user->user_id)
                ->with(['election'])
                ->get()
                ->map(function ($application) {
                    return [
                        'election_id' => $application->election_id,
                        'election_title' => $application->election->title ?? 'Unknown',
                        'status' => $application->admin_status,
                        'application_id' => $application->application_id,
                        'submitted_at' => $application->created_at,
                    ];
                });

            // ✅ Get elections where user is a candidate
            $candidateElections = Candidate::where('user_id', $user->user_id)
                ->with(['election', 'position'])
                ->get()
                ->map(function ($candidate) {
                    return [
                        'election_id' => $candidate->election_id,
                        'election_title' => $candidate->election->title ?? 'Unknown',
                        'position' => $candidate->position->title ?? 'Unknown',
                        'status' => $candidate->is_approved ? 'approved' : 'pending',
                        'candidate_id' => $candidate->candidate_id,
                    ];
                });

            // ✅ Transform available elections
            $available = $availableElections->map(function ($election) {
                return [
                    'election_id' => $election->election_id,
                    'title' => $election->title,
                    'election_type' => $election->election_type,
                    'description' => $election->description,
                    'voting_start' => $election->voting_start,
                    'voting_end' => $election->voting_end,
                    'course' => $election->course ? [
                        'course_id' => $election->course->course_id,
                        'course_code' => $election->course->course_code,
                        'course_name' => $election->course->course_name,
                    ] : null,
                    'is_available' => true,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'available' => $available,
                    'applied' => $appliedElections,
                    'candidate' => $candidateElections,
                    'can_apply' => $user->role === 'voter',
                    'has_pending_application' => $appliedElections->contains('status', 'pending'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch available elections: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available elections: ' . $e->getMessage()
            ], 500);
        }
    }
}
