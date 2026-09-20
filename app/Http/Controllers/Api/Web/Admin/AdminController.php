<?php

namespace App\Http\Controllers\Api\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\Position;
use App\Models\Partylist;
use App\Models\User;
use App\Models\VoterRegistry;
use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\Course;
use App\Models\DigitalReceipt;
use App\Traits\HasApiResponse;
use App\Traits\HasFileUpload;
use App\Traits\HasAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Imports\VotersImport;
use Maatwebsite\Excel\Facades\Excel;
use App\Services\NotificationService;

class AdminController extends Controller
{
    use HasApiResponse, HasFileUpload, HasAuditLog;

    // ==================== PARTYLIST MANAGEMENT ====================

    public function getPartylists($electionId)
    {
        $partylists = Partylist::where('election_id', $electionId)
            ->with('candidates')
            ->get();

        return $this->successResponse($partylists);
    }

    public function createPartylist(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'name' => 'required|string|max:100|unique:partylists,name',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $logoUrl = $this->uploadFile($request->file('logo'), 'partylist_logos');
        }

        $partylist = Partylist::create([
            'election_id' => $request->election_id,
            'name' => $request->name,
            'logo_url' => $logoUrl,
            'description' => $request->description,
            'approved_by' => $request->user()->user_id,
        ]);

        $this->logAction(
            $request->user()->user_id,
            'CREATE_PARTYLIST',
            'partylists',
            $partylist->partylist_id,
            null,
            $partylist->toArray(),
            $request->ip()
        );

        return $this->successResponse($partylist, 'Partylist created successfully', 201);
    }

    public function updatePartylist(Request $request, $id)
    {
        $partylist = Partylist::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $oldValue = $partylist->toArray();

        if ($request->has('name')) {
            $partylist->name = $request->name;
        }
        if ($request->has('description')) {
            $partylist->description = $request->description;
        }

        if ($request->hasFile('logo')) {
            if ($partylist->logo_url) {
                $oldLogoPath = str_replace('/storage/', '', $partylist->logo_url);
                if (Storage::disk('public')->exists($oldLogoPath)) {
                    Storage::disk('public')->delete($oldLogoPath);
                }
            }

            $logoUrl = $this->uploadFile($request->file('logo'), 'partylist_logos');
            $partylist->logo_url = $logoUrl;
        }

        $partylist->save();

        $this->logAction(
            $request->user()->user_id,
            'UPDATE_PARTYLIST',
            'partylists',
            $partylist->partylist_id,
            $oldValue,
            $partylist->toArray(),
            $request->ip()
        );

        return $this->successResponse($partylist, 'Partylist updated successfully');
    }

    public function deletePartylist(Request $request, $id)
    {
        $partylist = Partylist::findOrFail($id);

        if ($partylist->candidates()->count() > 0) {
            return $this->errorResponse('Cannot delete partylist with existing candidates', 400);
        }

        if ($partylist->logo_url) {
            $this->deleteFile($partylist->logo_url);
        }

        $this->logAction(
            $request->user()->user_id,
            'DELETE_PARTYLIST',
            'partylists',
            $id,
            $partylist->toArray(),
            null,
            $request->ip()
        );

        $partylist->delete();

        return $this->successResponse(null, 'Partylist deleted successfully');
    }

    // ==================== POSITION MANAGEMENT ====================

    public function createPosition(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'title' => 'required|string|max:50',
            'order_in_ballot' => 'required|integer',
            'max_winners' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $position = Position::create($request->all());

        $this->logAction(
            $request->user()->user_id,
            'CREATE_POSITION',
            'positions',
            $position->position_id,
            null,
            $position->toArray(),
            $request->ip()
        );

        return $this->successResponse($position, 'Position created successfully', 201);
    }

    public function updatePosition(Request $request, $id)
    {
        $position = Position::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:50',
            'order_in_ballot' => 'sometimes|integer',
            'max_winners' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $oldValue = $position->toArray();
        $position->update($request->all());

        $this->logAction(
            $request->user()->user_id,
            'UPDATE_POSITION',
            'positions',
            $position->position_id,
            $oldValue,
            $position->toArray(),
            $request->ip()
        );

        return $this->successResponse($position, 'Position updated successfully');
    }

    public function deletePosition(Request $request, $id)
    {
        $position = Position::findOrFail($id);

        $this->logAction(
            $request->user()->user_id,
            'DELETE_POSITION',
            'positions',
            $id,
            $position->toArray(),
            null,
            $request->ip()
        );

        $position->delete();

        return $this->successResponse(null, 'Position deleted successfully');
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:50',
            'last_name' => 'sometimes|string|max:50',
            'email' => 'sometimes|email|unique:users,email,' . $id . ',user_id',
            'student_id' => 'sometimes|string|unique:users,student_id,' . $id . ',user_id',
            'course' => 'nullable|string|max:100',
            'year_level' => 'nullable|integer|min:1|max:4',
            'role' => 'sometimes|in:admin,comelec,candidate,voter',
            'password' => 'sometimes|min:8',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $oldValue = $user->toArray();

        if ($request->has('first_name')) $user->first_name = $request->first_name;
        if ($request->has('last_name')) $user->last_name = $request->last_name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('student_id')) $user->student_id = $request->student_id;

        if ($request->has('course') && $request->course) {
            $course = Course::where('course_code', $request->course)->first();
            if ($course) {
                $user->course_id = $course->course_id;
            }
        }

        if ($request->has('year_level')) $user->year_level = $request->year_level;
        if ($request->has('role')) $user->role = $request->role;
        if ($request->has('password') && $request->password) {
            $user->password_hash = Hash::make($request->password);
        }

        $user->save();

        $this->logAction(
            $request->user()->user_id,
            'UPDATE_USER',
            'users',
            $user->user_id,
            $oldValue,
            $user->toArray(),
            $request->ip()
        );

        return $this->successResponse($user->load('course'), 'User updated successfully');
    }

    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->user_id === $request->user()->user_id) {
            return $this->errorResponse('Cannot delete your own account', 400);
        }

        $this->logAction(
            $request->user()->user_id,
            'DELETE_USER',
            'users',
            $id,
            $user->toArray(),
            null,
            $request->ip()
        );

        $user->delete();

        return $this->successResponse(null, 'User deleted successfully');
    }

    // ==================== VOTER MANAGEMENT ====================

    public function importVoters(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'file'        => 'required|file|mimes:xlsx,csv,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $import = new VotersImport($request->election_id);
        Excel::import($import, $request->file('file'));

        $createdCount  = $import->getImportedCount();
        $updatedCount  = $import->getUpdatedCount();
        $registeredCount = $import->getRegisteredCount();
        $skippedRows   = $import->getSkippedRows();

        $this->logAction(
            $request->user()->user_id,
            'IMPORT_VOTERS',
            'voter_registries',
            null,
            null,
            [
                'created'    => $createdCount,
                'updated'    => $updatedCount,
                'registered' => $registeredCount,
                'skipped'    => count($skippedRows),
            ],
            $request->ip()
        );

        // Build summary message
        $message = "Successfully imported voters: ";
        $parts = [];
        if ($createdCount > 0) $parts[] = "{$createdCount} new user(s) created";
        if ($updatedCount > 0) $parts[] = "{$updatedCount} existing user(s) updated";
        if ($registeredCount > 0) $parts[] = "{$registeredCount} voter(s) registered for this election";
        $message .= implode(', ', $parts);

        if (count($skippedRows) > 0) {
            $message .= '. ' . count($skippedRows) . ' row(s) skipped.';
        }

        $this->notifyVotersImported($request->election_id, $registeredCount);

        return $this->successResponse([
            'imported_count'   => $createdCount,
            'updated_count'    => $updatedCount,
            'registered_count' => $registeredCount,
            'skipped_rows'     => $skippedRows,
            'errors'           => [], // for backward compat with frontend
        ], $message);
    } catch (\Exception $e) {
        Log::error('Import failed: ' . $e->getMessage());
        Log::error($e->getTraceAsString());
        return $this->errorResponse(
            'Failed to import voters: ' . $e->getMessage(),
            500
        );
    }
}

    // ==================== CANDIDATE MANAGEMENT ====================

    public function addCandidate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'user_id' => 'required|exists:users,user_id',
            'position_id' => 'required|exists:positions,position_id',
            'partylist_id' => 'nullable|exists:partylists,partylist_id',
            'platform' => 'nullable|string',
            'qualifications' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $existingCandidate = Candidate::where('user_id', $request->user_id)
            ->where('election_id', $request->election_id)
            ->first();

        if ($existingCandidate) {
            return $this->errorResponse('User is already a candidate for this election', 400);
        }

        $candidate = Candidate::create([
            'user_id' => $request->user_id,
            'election_id' => $request->election_id,
            'position_id' => $request->position_id,
            'partylist_id' => $request->partylist_id,
            'platform' => $request->platform ?? 'To be announced',
            'qualifications' => $request->qualifications ?? 'To be announced',
            'is_approved' => true,
            'approved_by' => $request->user()->user_id,
            'approved_at' => now(),
        ]);

        $user = User::find($request->user_id);
        if ($user && $user->role === 'voter') {
            $user->role = 'candidate';
            $user->save();
        }

        $this->logAction(
            $request->user()->user_id,
            'ADD_CANDIDATE',
            'candidates',
            $candidate->candidate_id,
            null,
            $candidate->toArray(),
            $request->ip()
        );

        return $this->successResponse(
            $candidate->load('user', 'position', 'partylist'),
            'Candidate added successfully',
            201
        );
    }

    public function addBulkCandidates(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'election_id' => 'required|exists:elections,election_id',
            'candidates' => 'required|array',
            'candidates.*.user_id' => 'required|exists:users,user_id',
            'candidates.*.position_id' => 'required|exists:positions,position_id',
            'candidates.*.partylist_id' => 'nullable|exists:partylists,partylist_id',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $successCount = 0;
        $failCount = 0;
        $errors = [];

        foreach ($request->candidates as $candidateData) {
            try {
                $existingCandidate = Candidate::where('user_id', $candidateData['user_id'])
                    ->where('election_id', $request->election_id)
                    ->first();

                if ($existingCandidate) {
                    $failCount++;
                    $errors[] = ['user_id' => $candidateData['user_id'], 'message' => 'Already a candidate'];
                    continue;
                }

                $candidate = Candidate::create([
                    'user_id' => $candidateData['user_id'],
                    'election_id' => $request->election_id,
                    'position_id' => $candidateData['position_id'],
                    'partylist_id' => $candidateData['partylist_id'] ?? null,
                    'platform' => $candidateData['platform'] ?? 'To be announced',
                    'qualifications' => $candidateData['qualifications'] ?? 'To be announced',
                    'is_approved' => true,
                    'approved_by' => $request->user()->user_id,
                    'approved_at' => now(),
                ]);

                $user = User::find($candidateData['user_id']);
                if ($user && $user->role === 'voter') {
                    $user->role = 'candidate';
                    $user->save();
                }

                $successCount++;
            } catch (\Exception $e) {
                $failCount++;
                $errors[] = ['user_id' => $candidateData['user_id'], 'message' => $e->getMessage()];
            }
        }

        $this->logAction(
            $request->user()->user_id,
            'BULK_ADD_CANDIDATES',
            'candidates',
            null,
            null,
            ['success' => $successCount, 'failed' => $failCount],
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'success_count' => $successCount,
            'fail_count' => $failCount,
            'errors' => $errors
        ], 200);
    }

    public function updateCandidate(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'partylist_id' => 'nullable|exists:partylists,partylist_id',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $oldPartylistId = $candidate->partylist_id;
        $candidate->partylist_id = $request->partylist_id;
        $candidate->save();

        $this->logAction(
            $request->user()->user_id,
            'UPDATE_CANDIDATE_PARTYLIST',
            'candidates',
            $candidate->candidate_id,
            ['partylist_id' => $oldPartylistId],
            ['partylist_id' => $request->partylist_id],
            $request->ip()
        );

        return $this->successResponse(
            $candidate->load('user', 'position', 'partylist'),
            'Candidate updated successfully'
        );
    }

    public function getAllCandidates(Request $request)
    {
        $query = Candidate::with(['user', 'position', 'partylist', 'election']);

        if ($request->has('election_id')) {
            $query->where('election_id', $request->election_id);
        }

        if ($request->has('is_approved')) {
            $query->where('is_approved', $request->is_approved);
        }

        $candidates = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->successResponse($candidates);
    }

    public function deleteCandidate(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);

        if ($candidate->votes()->count() > 0) {
            return $this->errorResponse('Cannot delete candidate with existing votes', 400);
        }

        $oldValue = $candidate->toArray();

        $otherCandidates = Candidate::where('user_id', $candidate->user_id)
            ->where('candidate_id', '!=', $id)
            ->count();

        if ($otherCandidates === 0) {
            $user = User::find($candidate->user_id);
            if ($user && $user->role === 'candidate') {
                $user->role = 'voter';
                $user->save();
            }
        }

        $this->logAction(
            $request->user()->user_id,
            'DELETE_CANDIDATE',
            'candidates',
            $id,
            $oldValue,
            null,
            $request->ip()
        );

        $candidate->delete();

        return $this->successResponse(null, 'Candidate removed successfully');
    }

    // ==================== ELECTION MANAGEMENT ====================

    public function updateElection(Request $request, $id)
    {
        $election = Election::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'voting_start' => 'sometimes|date',
            'voting_end' => 'sometimes|date|after:voting_start',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $oldValue = $election->toArray();

        // ✅ If voting_start is updated, update year as well
        if ($request->has('voting_start')) {
            $votingStart = Carbon::parse($request->voting_start);
            $election->year = $votingStart->year;
        }

        $election->update($request->only(['title', 'description', 'voting_start', 'voting_end', 'is_active']));

        $this->logAction(
            $request->user()->user_id,
            'UPDATE_ELECTION',
            'elections',
            $election->election_id,
            $oldValue,
            $election->toArray(),
            $request->ip()
        );

        return $this->successResponse($election->load('positions', 'course'), 'Election updated successfully');
    }

    // ==================== REPORTS ====================

    public function getFullResults($electionId)
    {
        try {
            $election = Election::with('positions')->findOrFail($electionId);

            $results = [];
            foreach ($election->positions as $position) {
                $candidates = Candidate::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'partylist'])
                    ->get();

                $positionResults = [];
                foreach ($candidates as $candidate) {
                    $voteCount = \App\Models\Vote::where('election_id', $electionId)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();

                    $positionResults[] = [
                        'candidate' => $candidate,
                        'votes' => $voteCount,
                    ];
                }

                usort($positionResults, function ($a, $b) {
                    return $b['votes'] - $a['votes'];
                });

                $results[$position->title] = $positionResults;
            }

            return $this->successResponse([
                'election' => $election,
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to fetch results', 500);
        }
    }

    public function getTurnoutReport($electionId)
    {
        try {
            $election = Election::findOrFail($electionId);

            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();

            $byCourse = VoterRegistry::where('voter_registries.election_id', $electionId)
                ->join('users', 'voter_registries.user_id', '=', 'users.user_id')
                ->leftJoin('courses', 'users.course_id', '=', 'courses.course_id')
                ->select(
                    'courses.course_code',
                    'courses.course_name',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN voter_registries.has_voted = 1 THEN 1 ELSE 0 END) as voted')
                )
                ->groupBy('courses.course_code', 'courses.course_name')
                ->get()
                ->map(function ($item) {
                    return [
                        'course' => $item->course_code ?? 'No Course',
                        'total' => (int) $item->total,
                        'voted' => (int) $item->voted,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_voters' => $totalVoters,
                    'voted_count' => $votedCount,
                    'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                    'remaining_voters' => $totalVoters - $votedCount,
                    'breakdown_by_course' => $byCourse,
                    'last_updated' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch turnout report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getSanctionsList($electionId)
    {
        try {
            $election = Election::findOrFail($electionId);

            $nonVoters = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', false)
                ->with('user.course')
                ->get();

            $nonVotersList = $nonVoters->map(function ($item) {
                $user = $item->user;
                return [
                    'student_id' => $user->student_id ?? '',
                    'first_name' => $user->first_name ?? '',
                    'last_name' => $user->last_name ?? '',
                    'email' => $user->email ?? '',
                    'course' => $user->course ? ($user->course->course_code ?? $user->course->course_name ?? 'No Course') : 'No Course',
                    'year_level' => $user->year_level ?? '',
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_eligible_voters' => VoterRegistry::where('election_id', $electionId)->count(),
                    'total_non_voters' => $nonVoters->count(),
                    'non_voters_list' => $nonVotersList
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get sanctions list: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== AUDIT LOGS ====================

    public function getAuditLogs(Request $request)
    {
        try {
            $query = AuditLog::with('user');

            if ($request->has('action_type')) {
                $query->where('action_type', $request->action_type);
            }

            if ($request->has('from_date')) {
                $query->whereDate('timestamp', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('timestamp', '<=', $request->to_date);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            $logs = $query->orderBy('timestamp', 'desc')->paginate($request->get('per_page', 50));

            return $this->successResponse($logs);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to fetch audit logs', 500);
        }
    }

    public function getElectionAuditTrail($electionId)
    {
        $auditLogs = AuditLog::where('target_table', 'elections')
            ->orWhere(function ($query) use ($electionId) {
                $query->whereIn('target_table', ['candidates', 'votes', 'voter_registries'])
                    ->where('target_id', 'like', "%{$electionId}%");
            })
            ->with('user')
            ->orderBy('timestamp', 'desc')
            ->take(100)
            ->get();

        return $this->successResponse([
            'election_id' => $electionId,
            'audit_trail' => $auditLogs
        ]);
    }

    public function getVoterReceipt($electionId, $voterRegistryId)
    {
        $receipt = DigitalReceipt::where('voter_registry_id', $voterRegistryId)
            ->first();

        if (!$receipt) {
            return response()->json([
                'success' => false,
                'message' => 'Receipt not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'receipt_code' => $receipt->receipt_code,
            'generated_at' => $receipt->generated_at,
            'sent_to_email' => $receipt->sent_to_email
        ]);
    }

    public function getUsers(Request $request)
    {
        $query = User::with(['course', 'section']);

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get(); // ✅ Get all users (not paginated)

        // ✅ Transform to consistent format
        $transformedUsers = $users->map(function ($user) {
            return [
                'user_id' => $user->user_id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'student_id' => $user->student_id,
                'course' => $user->course ? [
                    'course_id' => $user->course->course_id,
                    'course_code' => $user->course->course_code,
                    'course_name' => $user->course->course_name,
                ] : null,
                'section' => $user->section ? [
                    'section_id' => $user->section->section_id,
                    'section_code' => $user->section->section_code,
                    'section_name' => $user->section->section_name,
                    'year_level' => $user->section->year_level,
                ] : null,
                'year_level' => $user->year_level,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'face_reference_photo' => $user->face_reference_photo,
                'is_face_registered' => $user->is_face_registered,
                'created_at' => $user->created_at,
            ];
        });

        // ✅ Return consistent structure
        return response()->json([
            'success' => true,
            'data' => $transformedUsers,
            'total' => $transformedUsers->count()
        ]);
    }

    // Update createUser() method
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'email' => 'required|email|max:100|unique:users,email',
            'student_id' => 'required|string|max:20|unique:users,student_id',
            'course_id' => 'nullable|exists:courses,course_id',
            'section_id' => 'nullable|exists:course_sections,section_id',
            'year_level' => 'nullable|integer|min:1|max:4',
            'role' => 'required|in:admin,comelec,candidate,voter',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'student_id' => $request->student_id,
                'course_id' => $request->course_id,
                'section_id' => $request->section_id,
                'year_level' => $request->year_level,
                'role' => $request->role,
                'password_hash' => Hash::make($request->password),
                'is_active' => true,
            ]);

            // Log the action
            $this->logAction(
                $request->user()->user_id,
                'CREATE_USER',
                'users',
                $user->user_id,
                null,
                $user->toArray(),
                $request->ip()
            );

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load(['course', 'section'])
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function removeVoter($electionId, $voterRegistryId)
    {
        try {
            $voterRegistry = VoterRegistry::where('voter_registry_id', $voterRegistryId)
                ->where('election_id', $electionId)
                ->first();

            if (!$voterRegistry) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voter not found in this election'
                ], 404);
            }

            // Check if voter has already voted
            if ($voterRegistry->has_voted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot remove a voter who has already cast their vote'
                ], 400);
            }

            $voterName = $voterRegistry->user->first_name . ' ' . $voterRegistry->user->last_name;

            $voterRegistry->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action_type' => 'REMOVE_VOTER',
                'target_table' => 'voter_registries',
                'target_id' => $voterRegistryId,
                'old_value' => json_encode(['election_id' => $electionId, 'user_id' => $voterRegistry->user_id]),
                'ip_address' => request()->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "{$voterName} has been removed from the election"
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove voter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove voter: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getVoters($electionId)
    {
        $voters = VoterRegistry::where('election_id', $electionId)
            ->with('user')
            ->get()
            ->map(function ($voter) {
                return [
                    'voter_registry_id' => $voter->voter_registry_id,
                    'first_name' => $voter->user->first_name,
                    'last_name' => $voter->user->last_name,
                    'student_id' => $voter->user->student_id,
                    'email' => $voter->user->email,
                    'course' => $voter->user->course,
                    'year_level' => $voter->user->year_level,
                    'has_voted' => $voter->has_voted,
                    'voted_at' => $voter->voted_at,
                ];
            });

        return $this->successResponse([
            'voters' => $voters,
            'total_voters' => $voters->count(),
            'voted_count' => $voters->where('has_voted', true)->count()
        ]);
    }

    /**
     * ✅ FIXED: Get voter statistics with proper error handling
     */
    public function getVoterStats($electionId)
    {
        try {
            $election = Election::find($electionId);

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Election not found'
                ], 404);
            }

            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();

            $stats = [
                'total_voters' => $totalVoters,
                'voted_count' => $votedCount,
                'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                'remaining_voters' => $totalVoters - $votedCount,
            ];

            // Add breakdown by course if there are voters
            if ($totalVoters > 0) {
                $byCourse = VoterRegistry::where('voter_registries.election_id', $electionId)
                    ->join('users', 'voter_registries.user_id', '=', 'users.user_id')
                    ->leftJoin('courses', 'users.course_id', '=', 'courses.course_id')
                    ->select(
                        'courses.course_id',
                        'courses.course_code',
                        'courses.course_name',
                        DB::raw('COUNT(*) as total'),
                        DB::raw('SUM(CASE WHEN voter_registries.has_voted = 1 THEN 1 ELSE 0 END) as voted')
                    )
                    ->groupBy('courses.course_id', 'courses.course_code', 'courses.course_name')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'course' => $item->course_code ?? 'No Course',
                            'total' => (int) $item->total,
                            'voted' => (int) $item->voted,
                            'percentage' => $item->total > 0 ? round(($item->voted / $item->total) * 100, 2) : 0,
                        ];
                    });

                $stats['breakdown_by_course'] = $byCourse;
            } else {
                $stats['breakdown_by_course'] = [];
            }

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get voter stats: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to get voter statistics: ' . $e->getMessage(),
                'data' => [
                    'total_voters' => 0,
                    'voted_count' => 0,
                    'turnout_percentage' => 0,
                    'remaining_voters' => 0,
                    'breakdown_by_course' => []
                ]
            ], 500);
        }
    }

    public function notifyVoterRegistered($voterRegistryId)
    {
        try {
            $voterRegistry = VoterRegistry::with(['user', 'election'])->find($voterRegistryId);
            if (!$voterRegistry) return;

            $notificationService = app(NotificationService::class);
            $notificationService->voterRegistered(
                $voterRegistry->user_id,
                $voterRegistry->election->title
            );
        } catch (\Exception $e) {
            Log::warning('Failed to send voter registration notification: ' . $e->getMessage());
        }
    }

    /**
     * Add notification when voters are imported
     */
    public function notifyVotersImported($electionId, $importedCount)
    {
        try {
            $election = Election::find($electionId);
            if (!$election) return;

            // Notify admin who imported
            $adminId = auth()->id();
            $notificationService = app(NotificationService::class);

            $notificationService->send(
                $adminId,
                '📋 Voters Imported',
                "Successfully imported {$importedCount} voters for {$election->title}",
                'system',
                ['election' => $election->title, 'count' => $importedCount]
            );
        } catch (\Exception $e) {
            Log::warning('Failed to send import notification: ' . $e->getMessage());
        }
    }
}
