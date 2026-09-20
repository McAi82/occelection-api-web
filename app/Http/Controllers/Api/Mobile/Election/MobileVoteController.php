<?php

namespace App\Http\Controllers\Api\Mobile\Election;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\VoterRegistry;
use App\Models\Vote;
use App\Models\Candidate;
use App\Models\DigitalReceipt;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\VoteCast;
use App\Events\TurnoutUpdated;
use App\Services\NotificationService;

class MobileVoteController extends Controller
{
    /**
     * Get Receipt
     * GET /api/mobile/elections/{electionId}/receipt
     */
    public function getReceipt(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            
            $voterRegistry = VoterRegistry::where('election_id', $electionId)
                ->where('user_id', $user->user_id)
                ->first();
                
            if (!$voterRegistry || !$voterRegistry->has_voted) {
                return response()->json([
                    'success' => false,
                    'message' => 'No vote found'
                ], 404);
            }
            
            $receipt = DigitalReceipt::where('voter_registry_id', $voterRegistry->voter_registry_id)
                ->first();
                
            $votes = Vote::where('voter_registry_id', $voterRegistry->voter_registry_id)
                ->with(['candidate.user', 'candidate.position', 'candidate.partylist'])
                ->get();
                
            return response()->json([
                'success' => true,
                'receipt' => [
                    'receipt_code' => $receipt->receipt_code,
                    'generated_at' => $receipt->generated_at,
                    'sent_to_email' => $receipt->sent_to_email
                ],
                'votes' => $votes->map(function($vote) {
                    return [
                        'position' => $vote->position->title,
                        'candidate_name' => $vote->candidate->user->first_name . ' ' . $vote->candidate->user->last_name,
                        'partylist' => $vote->candidate->partylist->name ?? 'Independent',
                        'timestamp' => $vote->timestamp
                    ];
                }),
                'election_title' => $voterRegistry->election->title
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get receipt: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get receipt'
            ], 500);
        }
    }

    /**
     * Get Vote History
     * GET /api/mobile/votes/history
     */
    public function getHistory(Request $request)
    {
        try {
            $user = $request->user();
            
            $history = VoterRegistry::where('user_id', $user->user_id)
                ->where('has_voted', true)
                ->with(['election', 'digitalReceipt'])
                ->orderBy('voted_at', 'desc')
                ->get()
                ->map(function($registry) {
                    return [
                        'election_id' => $registry->election_id,
                        'election_title' => $registry->election->title,
                        'election_type' => $registry->election->election_type,
                        'voted_at' => $registry->voted_at,
                        'receipt_code' => $registry->digitalReceipt->receipt_code ?? null
                    ];
                });
                
            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get history'
            ], 500);
        }
    }

    /**
     * Check Vote Status
     * GET /api/mobile/elections/{electionId}/vote-status
     */
    public function checkStatus(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            $voterRegistry = VoterRegistry::where('election_id', $electionId)
                ->where('user_id', $user->user_id)
                ->first();
                
            if (!$voterRegistry) {
                return response()->json([
                    'success' => true,
                    'has_voted' => false,
                    'is_registered' => false
                ]);
            }
            
            return response()->json([
                'success' => true,
                'has_voted' => $voterRegistry->has_voted,
                'is_registered' => true,
                'voted_at' => $voterRegistry->voted_at
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to check vote status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check status'
            ], 500);
        }
    }

    /**
     * Cast Vote
     * POST /api/mobile/elections/{electionId}/vote
     */
    public function castVote(Request $request, $electionId)
    {
        try {
            DB::beginTransaction();
            
            $user = $request->user();
            
            // ✅ Log the incoming request
            Log::info('Cast vote request', [
                'election_id' => $electionId,
                'user_id' => $user->user_id,
                'votes' => $request->votes
            ]);
            
            // Check election
            $election = Election::findOrFail($electionId);
            
            if (!$election->isOngoing()) {
                // ✅ Log attempt to vote in non-ongoing election
                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'MOBILE_VOTE_ATTEMPT_NOT_ONGOING',
                    'target_table' => 'elections',
                    'target_id' => $electionId,
                    'old_value' => json_encode([
                        'election_title' => $election->title,
                        'status' => $election->isFinished() ? 'finished' : 'upcoming',
                    ]),
                    'new_value' => null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'timestamp' => now(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Election is not ongoing'
                ], 403);
            }
            
            // Check registration
            $voterRegistry = VoterRegistry::where('election_id', $electionId)
                ->where('user_id', $user->user_id)
                ->first();
                
            if (!$voterRegistry) {
                // ✅ Log attempt to vote without registration
                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'MOBILE_VOTE_ATTEMPT_NOT_REGISTERED',
                    'target_table' => 'voter_registries',
                    'target_id' => null,
                    'old_value' => json_encode([
                        'election_id' => $electionId,
                        'election_title' => $election->title,
                    ]),
                    'new_value' => null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'timestamp' => now(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'You are not registered for this election'
                ], 403);
            }
            
            if ($voterRegistry->has_voted) {
                // ✅ Log duplicate vote attempt
                AuditLog::create([
                    'user_id' => $user->user_id,
                    'action_type' => 'MOBILE_VOTE_ATTEMPT_DUPLICATE',
                    'target_table' => 'voter_registries',
                    'target_id' => $voterRegistry->voter_registry_id,
                    'old_value' => json_encode([
                        'election_id' => $electionId,
                        'election_title' => $election->title,
                        'voted_at' => $voterRegistry->voted_at,
                    ]),
                    'new_value' => null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'timestamp' => now(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'You have already voted in this election'
                ], 403);
            }
            
            // ✅ Validate votes structure
            $validator = Validator::make($request->all(), [
                'votes' => 'required|array',
                'votes.*.position_id' => 'required|exists:positions,position_id',
                'votes.*.candidate_id' => 'required|exists:candidates,candidate_id',
            ]);
            
            if ($validator->fails()) {
                Log::error('Vote validation failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check for duplicate positions
            $positionIds = array_column($request->votes, 'position_id');
            if (count($positionIds) !== count(array_unique($positionIds))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot vote multiple times for the same position'
                ], 422);
            }
            
            // Verify each candidate belongs to the correct position
            $selectedCandidates = [];
            foreach ($request->votes as $voteData) {
                $candidate = Candidate::find($voteData['candidate_id']);
                if (!$candidate || $candidate->position_id != $voteData['position_id']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid candidate for position'
                    ], 422);
                }
                
                if (!$candidate->is_approved) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Candidate is not approved'
                    ], 422);
                }
                
                $selectedCandidates[] = [
                    'candidate_id' => $candidate->candidate_id,
                    'candidate_name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                    'position_id' => $candidate->position_id,
                    'position_title' => $candidate->position->title,
                ];
            }
            
            // Process votes
            foreach ($request->votes as $voteData) {
                Vote::create([
                    'voter_registry_id' => $voterRegistry->voter_registry_id,
                    'candidate_id' => $voteData['candidate_id'],
                    'position_id' => $voteData['position_id'],
                    'election_id' => $electionId,
                    'timestamp' => now(),
                ]);
            }
            
            // Mark as voted
            $voterRegistry->has_voted = true;
            $voterRegistry->voted_at = now();
            $voterRegistry->save();
            
            // Generate receipt
            $receiptCode = 'VOTE-' . strtoupper(Str::random(16)) . '-' . $voterRegistry->voter_registry_id;
            DigitalReceipt::create([
                'voter_registry_id' => $voterRegistry->voter_registry_id,
                'receipt_code' => $receiptCode,
                'sent_to_email' => $user->email,
                'generated_at' => now(),
            ]);
            
            // ✅ Log successful vote
            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'MOBILE_VOTE_CAST',
                'target_table' => 'votes',
                'target_id' => $voterRegistry->voter_registry_id,
                'old_value' => json_encode([
                    'election_id' => $electionId,
                    'election_title' => $election->title,
                    'voter_id' => $user->user_id,
                    'voter_email' => $user->email,
                    'voted_at' => now()->toISOString(),
                ]),
                'new_value' => json_encode([
                    'receipt_code' => $receiptCode,
                    'positions_voted' => count($request->votes),
                    'candidates' => $selectedCandidates,
                ]),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            
            DB::commit();

            // ✅ Fire VoteCast event
            $voteData = $request->votes[0] ?? null;
            if ($voteData) {
                $candidate = Candidate::find($voteData['candidate_id']);
                $voteCount = Vote::where('candidate_id', $voteData['candidate_id'])->count();
                $totalVotes = Vote::where('election_id', $electionId)->count();
            }

            // ✅ Fire TurnoutUpdated event
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();
            $percentage = $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0;

            // ✅ Send vote confirmation notification
            $notificationService = app(NotificationService::class);
            $notificationService->voteConfirmed(
                $user->user_id,
                $election->title,
                $receiptCode
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Vote cast successfully',
                'receipt_code' => $receiptCode
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Vote casting failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // ✅ Log vote failure
            AuditLog::create([
                'user_id' => $user->user_id ?? null,
                'action_type' => 'MOBILE_VOTE_FAILED',
                'target_table' => 'votes',
                'target_id' => null,
                'old_value' => json_encode([
                    'election_id' => $electionId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]),
                'new_value' => null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => now(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to cast vote: ' . $e->getMessage()
            ], 500);
        }
    }
}