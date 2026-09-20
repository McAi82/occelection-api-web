<?php

namespace App\Http\Controllers\Api\Web\Election;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\AuditLog;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CandidateController extends Controller
{
    // Get all candidates for an election
    public function getByElection($electionId)
    {
        $candidates = Candidate::where('election_id', $electionId)
            ->where('is_approved', true)
            ->with(['user.course', 'position', 'partylist'])
            ->get();
        
        return response()->json($candidates);
    }

    // Get single candidate by ID
    public function getById($id)
    {
        try {
            $candidate = Candidate::with(['user.course', 'position', 'partylist', 'election'])
                ->findOrFail($id);
            
            if ($candidate->photo_url && !str_starts_with($candidate->photo_url, 'http')) {
                $candidate->photo_url = asset($candidate->photo_url);
            }
            return response()->json($candidate);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Candidate not found'], 404);
        }
    }

    // ❌ REMOVED: apply() method - No longer needed

    // Update candidate (admin only)
    public function update(Request $request, $id)
    {
        $candidate = Candidate::findOrFail($id);
        
        // Only admin can update
        // if ($request->user()->role !== 'admin') {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
        
        $validator = Validator::make($request->all(), [
            'platform' => 'nullable|string',
            'qualifications' => 'nullable|string',
            'position_id' => 'nullable|exists:positions,position_id',
            'partylist_id' => 'nullable|exists:partylists,partylist_id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        if ($request->has('platform')) {
            $candidate->platform = $request->platform;
        }
        if ($request->has('qualifications')) {
            $candidate->qualifications = $request->qualifications;
        }
        if ($request->has('position_id')) {
            $candidate->position_id = $request->position_id;
        }
        if ($request->has('partylist_id')) {
            $candidate->partylist_id = $request->partylist_id;
        }
        
        $candidate->save();
        
        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'UPDATE_CANDIDATE',
            'target_table' => 'candidates',
            'target_id' => $candidate->candidate_id,
            'new_value' => json_encode($candidate->toArray()),
            'ip_address' => $request->ip(),
        ]);
        
        return response()->json([
            'message' => 'Candidate updated successfully',
            'candidate' => $candidate->load('user', 'position', 'partylist')
        ]);
    }

    // Approve candidate (Admin only)
    public function approve(Request $request, $id)
    {
        try {
            $candidate = Candidate::findOrFail($id);
            
            $candidate->is_approved = true;
            $candidate->approved_by = $request->user()->user_id;
            $candidate->approved_at = now();
            $candidate->save();
            
            // Update user role to candidate
            $candidate->user->role = 'candidate';
            $candidate->user->save();
            
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'APPROVE_CANDIDATE',
                'target_table' => 'candidates',
                'target_id' => $candidate->candidate_id,
                'old_value' => json_encode(['is_approved' => false]),
                'new_value' => json_encode(['is_approved' => true]),
                'ip_address' => $request->ip(),
            ]);
            
            // Send notification to candidate (optional)
            // $notificationService->sendCandidateApproval(...);
            
            return response()->json([
                'message' => 'Candidate approved successfully',
                'candidate' => $candidate
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Candidate not found'], 404);
        }
    }

    // Reject candidate (Admin only)
    public function reject(Request $request, $id)
    {
        try {
            $candidate = Candidate::findOrFail($id);
            $candidate->delete();
            
            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'REJECT_CANDIDATE',
                'target_table' => 'candidates',
                'target_id' => $id,
                'ip_address' => $request->ip(),
            ]);
            
            return response()->json([
                'message' => 'Candidate rejected successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Candidate not found'], 404);
        }
    }

    public function getStats($id)
    {
        $candidate = Candidate::findOrFail($id);
        $voteCount = Vote::where('candidate_id', $id)->count();
        
        return response()->json([
            'success' => true,
            'candidate_id' => $id,
            'vote_count' => $voteCount,
            'percentage' => 0
        ]);
    }

    public function getVoters(Request $request, $id)
    {
        try {
            $candidate = Candidate::with(['election'])->findOrFail($id);
            $electionId = $candidate->election_id;

            // Get all votes for this candidate
            $votes = Vote::where('candidate_id', $id)
                ->with(['voterRegistry.user'])
                ->get();

            // Extract voter data with ticket numbers
            $voters = $votes->map(function($vote) {
                $voterRegistry = $vote->voterRegistry;
                return [
                    'vote_id' => $vote->vote_id,
                    'voter_registry_id' => $voterRegistry ? $voterRegistry->voter_registry_id : null,
                    'student_id' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->student_id : 'N/A',
                    'first_name' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->first_name : 'N/A',
                    'last_name' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->last_name : 'N/A',
                    'voted_at' => $vote->timestamp,
                    'ticket_number' => $this->generateTicketNumber($vote->vote_id, $voterRegistry ? $voterRegistry->voter_registry_id : null),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'candidate_id' => $candidate->candidate_id,
                    'candidate_name' => $candidate->user ? $candidate->user->first_name . ' ' . $candidate->user->last_name : 'Unknown',
                    'election_title' => $candidate->election ? $candidate->election->title : 'Unknown Election',
                    'total_votes' => $voters->count(),
                    'voters' => $voters,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching voters for candidate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch voters: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a ticket number for the vote
     */
    private function generateTicketNumber($voteId, $voterRegistryId)
    {
        $year = date('Y');
        $month = date('m');
        $day = date('d');
        $random = strtoupper(substr(uniqid(), -6));
        return "VOTE-{$year}{$month}{$day}-{$voterRegistryId}-{$random}";
    }

    /**
     * Get voters for a candidate with pagination
     */
    public function getVotersPaginated(Request $request, $id)
    {
        try {
            $perPage = $request->get('per_page', 20);
            $search = $request->get('search', '');

            $candidate = Candidate::with(['election'])->findOrFail($id);

            $query = Vote::where('candidate_id', $id)
                ->with(['voterRegistry.user']);

            // Search by student ID or name
            if ($search) {
                $query->whereHas('voterRegistry.user', function($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                });
            }

            $votes = $query->orderBy('timestamp', 'desc')->paginate($perPage);

            $voters = $votes->map(function($vote) {
                $voterRegistry = $vote->voterRegistry;
                return [
                    'vote_id' => $vote->vote_id,
                    'voter_registry_id' => $voterRegistry ? $voterRegistry->voter_registry_id : null,
                    'student_id' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->student_id : 'N/A',
                    'first_name' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->first_name : 'N/A',
                    'last_name' => $voterRegistry && $voterRegistry->user ? $voterRegistry->user->last_name : 'N/A',
                    'voted_at' => $vote->timestamp,
                    'ticket_number' => $this->generateTicketNumber($vote->vote_id, $voterRegistry ? $voterRegistry->voter_registry_id : null),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'candidate_id' => $candidate->candidate_id,
                    'candidate_name' => $candidate->user ? $candidate->user->first_name . ' ' . $candidate->user->last_name : 'Unknown',
                    'election_title' => $candidate->election ? $candidate->election->title : 'Unknown Election',
                    'total_votes' => $votes->total(),
                    'per_page' => $votes->perPage(),
                    'current_page' => $votes->currentPage(),
                    'last_page' => $votes->lastPage(),
                    'voters' => $voters,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching voters for candidate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch voters: ' . $e->getMessage()
            ], 500);
        }
    }
}