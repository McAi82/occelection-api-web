<?php

namespace App\Http\Controllers\Api\Mobile\Election;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\Candidate;
use App\Models\Vote;
use App\Models\VoterRegistry;
use Illuminate\Http\Request;

class MobileElectionController extends Controller
{
    /**
     * Get Active Election
     * GET /api/mobile/elections/active
     */
    public function getActiveElection()
    {
        try {
            $now = now();

            $election = Election::where('voting_start', '<=', $now)
                ->where('voting_end', '>=', $now)
                ->with(['positions', 'course'])
                ->first();

            if (!$election) {
                $election = Election::where('voting_start', '>', $now)
                    ->with(['positions', 'course'])
                    ->orderBy('voting_start', 'asc')
                    ->first();
            }

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active election found'
                ], 404);
            }

            $election->is_ongoing = $election->isOngoing();
            $election->status = $this->getStatus($election);

            // Get candidates per position
            $positions = $election->positions->map(function ($position) use ($election) {
                $candidates = Candidate::where('election_id', $election->election_id)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'partylist'])
                    ->get();

                return [
                    'position_id' => $position->position_id,
                    'title' => $position->title,
                    'order_in_ballot' => $position->order_in_ballot,
                    'max_winners' => $position->max_winners,
                    'candidates' => $candidates->map(function ($candidate) {
                        return [
                            'candidate_id' => $candidate->candidate_id,
                            'name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                            'photo_url' => $candidate->photo_url,
                            'partylist' => $candidate->partylist->name ?? 'Independent',
                            'platform' => $candidate->platform,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'election' => $election,
                'positions' => $positions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active election'
            ], 500);
        }
    }

    /**
     * Get Election Results
     * GET /api/mobile/elections/{id}/results
     */
    public function getResults($id)
    {
        try {
            $election = Election::findOrFail($id);

            $results = [];
            foreach ($election->positions as $position) {
                $candidates = Candidate::where('election_id', $id)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'partylist'])
                    ->get();

                $positionResults = [];
                foreach ($candidates as $candidate) {
                    $voteCount = Vote::where('election_id', $id)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();

                    $positionResults[] = [
                        'candidate_id' => $candidate->candidate_id,
                        'candidate_name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                        'partylist' => $candidate->partylist->name ?? 'Independent',
                        'photo_url' => $candidate->photo_url,
                        'votes' => $voteCount,
                    ];
                }

                usort($positionResults, function ($a, $b) {
                    return $b['votes'] - $a['votes'];
                });

                $results[] = [
                    'position_id' => $position->position_id,
                    'position_title' => $position->title,
                    'candidates' => $positionResults,
                ];
            }

            // ✅ Calculate unique voters who have voted
            $totalVoters = VoterRegistry::where('election_id', $id)->count();
            $votedCount = VoterRegistry::where('election_id', $id)
                ->where('has_voted', true)
                ->count();
            $totalVotesCast = Vote::where('election_id', $id)->count();
            $turnoutPercentage = $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0;

            return response()->json([
                'success' => true,
                'election' => [
                    'election_id' => $election->election_id,
                    'title' => $election->title,
                    'is_ongoing' => $election->isOngoing(),
                    'is_finished' => $election->isFinished(),
                ],
                'results' => $results,
                'summary' => [
                    'total_voters' => $totalVoters,          // Total registered voters
                    'voted_count' => $votedCount,            // ✅ Unique voters who voted
                    'total_votes_cast' => $totalVotesCast,   // Sum of all votes across positions
                    'turnout_percentage' => $turnoutPercentage,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch results'
            ], 500);
        }
    }

    private function getStatus($election)
    {
        $now = now();
        if ($now < $election->voting_start) return 'upcoming';
        if ($now > $election->voting_end) return 'ended';
        return 'ongoing';
    }

    /**
     * Get all elections (for listing)
     * GET /api/mobile/elections
     */
    public function index()
    {
        try {
            $elections = Election::with(['positions', 'course'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($election) {
                    return [
                        'election_id' => $election->election_id,
                        'title' => $election->title,
                        'election_type' => $election->election_type,
                        'description' => $election->description,
                        'voting_start' => $election->voting_start,
                        'voting_end' => $election->voting_end,
                        'status' => $this->getStatus($election),
                        'is_ongoing' => $election->isOngoing(),
                        'positions_count' => $election->positions->count(),
                    ];
                });

            return response()->json([
                'success' => true,
                'elections' => $elections
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch elections'
            ], 500);
        }
    }

    /**
     * Get single election by ID
     * GET /api/mobile/elections/{id}
     */
    public function show($id)
    {
        try {
            $election = Election::with(['positions', 'course'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'election' => [
                    'election_id' => $election->election_id,
                    'title' => $election->title,
                    'election_type' => $election->election_type,
                    'description' => $election->description,
                    'voting_start' => $election->voting_start,
                    'voting_end' => $election->voting_end,
                    'status' => $this->getStatus($election),
                    'is_ongoing' => $election->isOngoing(),
                    'positions' => $election->positions->map(function ($position) {
                        return [
                            'position_id' => $position->position_id,
                            'title' => $position->title,
                            'category' => $position->category,
                            'order_in_ballot' => $position->order_in_ballot,
                            'max_winners' => $position->max_winners,
                        ];
                    }),
                    'course' => $election->course ? [
                        'course_id' => $election->course->course_id,
                        'course_code' => $election->course->course_code,
                        'course_name' => $election->course->course_name,
                    ] : null,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Election not found'
            ], 404);
        }
    }
}
