<?php

namespace App\Http\Controllers\Api\Web\Election;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\VoterRegistry;
use App\Models\Vote;
use App\Models\Candidate;
use App\Models\DigitalReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VoteController extends Controller
{
    /**
     * Web - Check if user has voted in an election
     * GET /web/elections/{electionId}/vote-status
     */
    public function checkVoteStatus(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            
            $voterRegistry = VoterRegistry::where('election_id', $electionId)
                ->where('user_id', $user->user_id)
                ->first();
                
            if (!$voterRegistry) {
                return response()->json([
                    'success' => true,
                    'is_registered' => false,
                    'has_voted' => false
                ]);
            }
            
            return response()->json([
                'success' => true,
                'is_registered' => true,
                'has_voted' => $voterRegistry->has_voted,
                'voted_at' => $voterRegistry->voted_at,
                'sanction_eligible' => $voterRegistry->sanction_eligible
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to check vote status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to check vote status'
            ], 500);
        }
    }
    
    /**
     * Web - Get vote receipt (view only)
     * GET /web/elections/{electionId}/receipt
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
                
            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt not found'
                ], 404);
            }
            
            $votes = Vote::where('voter_registry_id', $voterRegistry->voter_registry_id)
                ->with(['candidate.user', 'candidate.position', 'candidate.partylist'])
                ->get();
                
            $voteDetails = [];
            foreach ($votes as $vote) {
                $voteDetails[] = [
                    'position' => $vote->position->title,
                    'candidate_name' => $vote->candidate->user->first_name . ' ' . $vote->candidate->user->last_name,
                    'partylist' => $vote->candidate->partylist->name ?? 'Independent',
                    'timestamp' => $vote->timestamp
                ];
            }
            
            return response()->json([
                'success' => true,
                'receipt' => [
                    'receipt_code' => $receipt->receipt_code,
                    'generated_at' => $receipt->generated_at,
                    'sent_to_email' => $receipt->sent_to_email
                ],
                'votes' => $voteDetails,
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
     * Web - Get voting history for user
     * GET /web/votes/history
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
                'history' => $history,
                'total' => $history->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get voting history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get voting history'
            ], 500);
        }
    }

    /**
     * Web - Resend vote receipt email
     * POST /web/elections/{electionId}/resend-receipt
     */
    public function resendReceipt(Request $request, $electionId)
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
                
            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt not found'
                ], 404);
            }
            
            // Resend email
            \App\Jobs\SendVoteReceipt::dispatch(
                $user->email,
                $receipt->receipt_code,
                $user->first_name,
                $voterRegistry->election->title
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Receipt resent successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to resend receipt: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resend receipt'
            ], 500);
        }
    }

    /**
     * Web - Get election statistics (Admin & COMELEC only)
     * GET /web/elections/{electionId}/statistics
     */
    public function getStatistics(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            
            // Only admin and COMELEC can view detailed statistics on web
            if (!in_array($user->role, ['admin', 'comelec'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $election = Election::findOrFail($electionId);
            
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();
                
            $votesPerHour = Vote::where('election_id', $electionId)
                ->select(DB::raw('HOUR(timestamp) as hour'), DB::raw('COUNT(*) as count'))
                ->groupBy('hour')
                ->orderBy('hour')
                ->get();
                
            $votesPerPosition = Vote::where('election_id', $electionId)
                ->select('positions.title', DB::raw('COUNT(*) as count'))
                ->join('positions', 'votes.position_id', '=', 'positions.position_id')
                ->groupBy('positions.title')
                ->get();
                
            $recentVotes = Vote::where('election_id', $electionId)
                ->with(['candidate.user', 'candidate.position'])
                ->orderBy('timestamp', 'desc')
                ->limit(20)
                ->get()
                ->map(function($vote) {
                    return [
                        'candidate_name' => $vote->candidate->user->first_name . ' ' . $vote->candidate->user->last_name,
                        'position' => $vote->position->title,
                        'timestamp' => $vote->timestamp
                    ];
                });
                
            return response()->json([
                'success' => true,
                'statistics' => [
                    'total_voters' => $totalVoters,
                    'voted_count' => $votedCount,
                    'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                    'remaining_voters' => $totalVoters - $votedCount,
                    'votes_per_hour' => $votesPerHour,
                    'votes_per_position' => $votesPerPosition,
                    'recent_votes' => $recentVotes,
                    'last_updated' => now()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get election statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics'
            ], 500);
        }
    }

    /**
     * Web - Get voting percentage summary (for dashboard)
     * GET /web/elections/{electionId}/turnout-summary
     */
    public function getTurnoutSummary(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            
            // Only admin and COMELEC can view this
            if (!in_array($user->role, ['admin', 'comelec'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();
            
            $turnoutByCourse = VoterRegistry::where('voter_registries.election_id', $electionId)
                ->join('users', 'voter_registries.user_id', '=', 'users.user_id')
                ->leftJoin('courses', 'users.course_id', '=', 'courses.course_id')
                ->select(
                    'courses.course_code',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN voter_registries.has_voted = 1 THEN 1 ELSE 0 END) as voted')
                )
                ->groupBy('courses.course_code')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_voters' => $totalVoters,
                    'voted_count' => $votedCount,
                    'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                    'remaining_voters' => $totalVoters - $votedCount,
                    'turnout_by_course' => $turnoutByCourse
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get turnout summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get turnout summary'
            ], 500);
        }
    }

    public function getCandidateVoteTickets($electionId, $candidateId, Request $request)
    {
        try {
            Log::info('Fetching vote tickets', [
                'election_id' => $electionId,
                'candidate_id' => $candidateId,
                'user_id' => $request->user() ? $request->user()->user_id : null
            ]);

            // Check if election exists
            $election = Election::find($electionId);
            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Election not found'
                ], 404);
            }

            // Check if candidate exists
            $candidate = Candidate::with(['user'])
                ->where('candidate_id', $candidateId)
                ->where('election_id', $electionId)
                ->first();
                
            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found'
                ], 404);
            }

            // Get all votes for this candidate
            $votes = Vote::where('candidate_id', $candidateId)
                ->where('election_id', $electionId)
                ->with(['voterRegistry.user'])
                ->orderBy('timestamp', 'desc')
                ->get();

            Log::info('Found votes', ['count' => $votes->count()]);

            // ✅ Get digital receipts for each vote
            $tickets = [];
            foreach ($votes as $vote) {
                // ✅ Get the digital receipt for this vote
                $digitalReceipt = DigitalReceipt::where('voter_registry_id', $vote->voter_registry_id)
                    ->first();

                // ✅ Use the receipt_code from digital_receipts table
                $receiptCode = $digitalReceipt ? $digitalReceipt->receipt_code : null;
                
                // If no receipt code found, generate one
                if (!$receiptCode) {
                    $receiptCode = $this->generateTicketNumber($vote->vote_id);
                }

                $ticketData = [
                    'vote_id' => $vote->vote_id,
                    'ticket_number' => $receiptCode, // ✅ Use receipt_code from database
                    'voted_at' => $vote->timestamp,
                    'has_receipt' => $digitalReceipt ? true : false,
                ];
                
                // Only include voter info if election is finished or user is admin/comelec
                $isOngoing = $election->isOngoing();
                if (!$isOngoing) {
                    $ticketData['voter'] = $vote->voterRegistry && $vote->voterRegistry->user ? [
                        'user_id' => $vote->voterRegistry->user->user_id,
                        'first_name' => $vote->voterRegistry->user->first_name,
                        'last_name' => $vote->voterRegistry->user->last_name,
                    ] : null;
                }
                
                $tickets[] = $ticketData;
            }

            // Get total votes count
            $totalVotes = Vote::where('candidate_id', $candidateId)
                ->where('election_id', $electionId)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'candidate_id' => $candidateId,
                    'candidate_name' => $candidate->user ? $candidate->user->first_name . ' ' . $candidate->user->last_name : 'Unknown Candidate',
                    'total_votes' => $totalVotes,
                    'tickets' => $tickets,
                    'is_ongoing' => $election->isOngoing(),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch vote tickets: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vote tickets: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a fallback ticket number if no receipt exists
     */
    private function generateTicketNumber($voteId)
    {
        $prefix = 'VOTE';
        $random1 = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 2));
        $random2 = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $random3 = str_pad($voteId, 3, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$random1}-{$random2}-{$random3}";
    }
}