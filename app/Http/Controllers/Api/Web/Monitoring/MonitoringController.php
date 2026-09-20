<?php

namespace App\Http\Controllers\Api\Web\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\Candidate;
use App\Models\Vote;
use App\Models\VoterRegistry;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonitoringController extends Controller
{
    public function getDashboard($electionId)
    {
        try {
            $election = Election::with(['positions', 'course'])->findOrFail($electionId);
            
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();
            
            $totalCandidates = Candidate::where('election_id', $electionId)
                ->where('is_approved', true)
                ->count();
            
            $now = now();
            $isOngoing = $now >= $election->voting_start && $now <= $election->voting_end;
            
            $positionProgress = [];
            foreach ($election->positions as $position) {
                $totalCandidatesForPosition = Candidate::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->count();
                
                $votesCast = Vote::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->count();
                
                $progressPercentage = 0;
                if ($totalVoters > 0 && $totalCandidatesForPosition > 0) {
                    $progressPercentage = round(($votesCast / ($totalVoters * $totalCandidatesForPosition)) * 100, 2);
                }
                
                $positionProgress[] = [
                    'position_id' => $position->position_id,
                    'title' => $position->title,
                    'category' => $position->category ?? 'Other',
                    'total_candidates' => $totalCandidatesForPosition,
                    'votes_cast' => $votesCast,
                    'progress_percentage' => $progressPercentage
                ];
            }
            
            $recentActivity = Vote::where('election_id', $electionId)
                ->where('timestamp', '>=', now()->subMinutes(30))
                ->count();
            
            return response()->json([
                'statistics' => [
                    'total_voters' => $totalVoters,
                    'voted_count' => $votedCount,
                    'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                    'remaining_voters' => $totalVoters - $votedCount,
                    'total_candidates' => $totalCandidates,
                    'total_positions' => $election->positions->count(),
                ],
                'position_progress' => $positionProgress,
                'recent_activity' => [
                    'last_30_minutes' => $recentActivity,
                ],
                'is_ongoing' => $isOngoing,
                'election' => [
                    'election_id' => $election->election_id,
                    'title' => $election->title,
                    'description' => $election->description,
                    'voting_start' => $election->voting_start,
                    'voting_end' => $election->voting_end,
                    'is_ongoing' => $isOngoing,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch monitoring data: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getLiveResults($electionId)
    {
        try {
            $election = Election::findOrFail($electionId);
            
            $now = now();
            $isOngoing = $now >= $election->voting_start && $now <= $election->voting_end;
            
            $liveResults = [];
            foreach ($election->positions as $position) {
                $candidates = Candidate::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'partylist'])
                    ->get();
                
                $positionResults = [];
                foreach ($candidates as $candidate) {
                    $voteCount = Vote::where('election_id', $electionId)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();
                    
                    $positionResults[] = [
                        'candidate_id' => $candidate->candidate_id,
                        'candidate_name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                        'partylist' => $candidate->partylist->name ?? 'Independent',
                        'partylist_id' => $candidate->partylist_id,
                        'votes' => $voteCount,
                        'photo_url' => $candidate->photo_url,
                    ];
                }
                
                usort($positionResults, function($a, $b) {
                    return $b['votes'] - $a['votes'];
                });
                
                $liveResults[] = [
                    'position_id' => $position->position_id,
                    'position_title' => $position->title,
                    'category' => $position->category ?? 'Other',
                    'candidates' => $positionResults,
                    'total_votes' => array_sum(array_column($positionResults, 'votes')),
                ];
            }
            
            $totalVotesCast = Vote::where('election_id', $electionId)->count();
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            
            return response()->json([
                'results' => $liveResults,
                'summary' => [
                    'total_votes_cast' => $totalVotesCast,
                    'total_voters' => $totalVoters,
                    'turnout_percentage' => $totalVoters > 0 ? round(($totalVotesCast / $totalVoters) * 100, 2) : 0,
                ],
                'is_ongoing' => $isOngoing,
                'last_updated' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch live results: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getTurnout($electionId)
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
                    'courses.course_id',
                    'courses.course_code',
                    'courses.course_name',
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN voter_registries.has_voted = 1 THEN 1 ELSE 0 END) as voted')
                )
                ->groupBy('courses.course_id', 'courses.course_code', 'courses.course_name')
                ->get()
                ->map(function($item) {
                    return [
                        'course' => [
                            'course_code' => $item->course_code ?? 'No Course',
                            'course_name' => $item->course_name,
                        ],
                        'total' => (int) $item->total,
                        'voted' => (int) $item->voted,
                    ];
                });
            
            $byYear = VoterRegistry::where('voter_registries.election_id', $electionId)
                ->join('users', 'voter_registries.user_id', '=', 'users.user_id')
                ->select('users.year_level')
                ->selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN voter_registries.has_voted = 1 THEN 1 ELSE 0 END) as voted')
                ->groupBy('users.year_level')
                ->orderBy('users.year_level')
                ->get()
                ->map(function($item) {
                    return [
                        'year_level' => $item->year_level ?? 'Unknown',
                        'total' => (int) $item->total,
                        'voted' => (int) $item->voted,
                        'percentage' => $item->total > 0 ? round(($item->voted / $item->total) * 100, 2) : 0,
                    ];
                });
            
            return response()->json([
                'total_voters' => $totalVoters,
                'voted_count' => $votedCount,
                'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                'remaining_voters' => $totalVoters - $votedCount,
                'breakdown' => [
                    'by_course' => $byCourse,
                    'by_year' => $byYear,
                ],
                'last_updated' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch turnout data: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getVoterStatus($electionId)
    {
        try {
            $voters = VoterRegistry::where('election_id', $electionId)
                ->with('user')
                ->get()
                ->map(function($voter) {
                    return [
                        'voter_registry_id' => $voter->voter_registry_id,
                        'name' => $voter->user->first_name . ' ' . $voter->user->last_name,
                        'student_id' => $voter->user->student_id,
                        'course' => $voter->user->course,
                        'year_level' => $voter->user->year_level,
                        'has_voted' => $voter->has_voted,
                        'voted_at' => $voter->voted_at,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'voters' => $voters,
                    'total' => $voters->count(),
                    'voted' => $voters->where('has_voted', true)->count(),
                    'not_voted' => $voters->where('has_voted', false)->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch voter status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getPositionProgress($electionId)
    {
        try {
            $election = Election::with('positions')->findOrFail($electionId);
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            
            $progress = [];
            foreach ($election->positions as $position) {
                $votesCast = Vote::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->count();
                
                $totalCandidates = Candidate::where('election_id', $electionId)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->count();
                
                $completionPercentage = 0;
                if ($totalVoters > 0) {
                    $completionPercentage = round(($votesCast / $totalVoters) * 100, 2);
                }
                
                $progress[] = [
                    'position_id' => $position->position_id,
                    'title' => $position->title,
                    'category' => $position->category ?? 'Other',
                    'total_candidates' => $totalCandidates,
                    'votes_cast' => $votesCast,
                    'expected_votes' => $totalVoters,
                    'completion_percentage' => $completionPercentage,
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $progress
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch position progress: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getStatistics($electionId)
    {
        try {
            $election = Election::findOrFail($electionId);
            
            $now = now();
            $isOngoing = $now >= $election->voting_start && $now <= $election->voting_end;
            $isUpcoming = $now < $election->voting_start;
            $isFinished = $now > $election->voting_end;
            
            $totalVoters = VoterRegistry::where('election_id', $electionId)->count();
            $votedCount = VoterRegistry::where('election_id', $electionId)
                ->where('has_voted', true)
                ->count();
            
            $totalCandidates = Candidate::where('election_id', $electionId)
                ->where('is_approved', true)
                ->count();
            
            $totalPositions = $election->positions->count();
            $totalPartylists = \App\Models\Partylist::where('election_id', $electionId)->count();
            
            $votesPerHour = Vote::where('election_id', $electionId)
                ->select(DB::raw('HOUR(timestamp) as hour'), DB::raw('COUNT(*) as count'))
                ->groupBy('hour')
                ->orderBy('hour')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'election' => [
                        'id' => $election->election_id,
                        'title' => $election->title,
                        'type' => $election->election_type,
                        'status' => $isOngoing ? 'ongoing' : ($isUpcoming ? 'upcoming' : 'finished'),
                    ],
                    'voting_statistics' => [
                        'total_voters' => $totalVoters,
                        'voted' => $votedCount,
                        'not_voted' => $totalVoters - $votedCount,
                        'turnout_percentage' => $totalVoters > 0 ? round(($votedCount / $totalVoters) * 100, 2) : 0,
                    ],
                    'election_statistics' => [
                        'total_candidates' => $totalCandidates,
                        'total_positions' => $totalPositions,
                        'total_partylists' => $totalPartylists,
                        'total_votes_cast' => Vote::where('election_id', $electionId)->count(),
                    ],
                    'votes_per_hour' => $votesPerHour,
                    'last_updated' => now(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getRealtimeUpdates($electionId)
    {
        try {
            $latestVotes = Vote::where('election_id', $electionId)
                ->where('timestamp', '>=', now()->subMinutes(5))
                ->with(['candidate.user', 'candidate.partylist', 'position'])
                ->orderBy('timestamp', 'desc')
                ->take(20)
                ->get()
                ->map(function($vote) {
                    return [
                        'candidate_name' => $vote->candidate->user->first_name . ' ' . $vote->candidate->user->last_name,
                        'position' => $vote->position->title,
                        'partylist' => $vote->candidate->partylist->name ?? 'Independent',
                        'timestamp' => $vote->timestamp,
                    ];
                });
            
            $totalVotesToday = Vote::where('election_id', $electionId)
                ->whereDate('timestamp', today())
                ->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'latest_votes' => $latestVotes,
                    'total_votes_today' => $totalVotesToday,
                    'timestamp' => now(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch real-time updates: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function refreshData($electionId)
    {
        return $this->getDashboard($electionId);
    }

    public function getAuditTrail(Request $request, $electionId = null)
    {
        try {
            $query = AuditLog::with('user');

            // If electionId is provided, filter logs related to that election
            if ($electionId) {
                $query->where(function($q) use ($electionId) {
                    $q->where('target_table', 'elections')
                      ->where('target_id', $electionId)
                      ->orWhere(function($sub) use ($electionId) {
                          $sub->whereIn('target_table', ['candidates', 'votes', 'voter_registries', 'campaign_schedules', 'campaign_schedule_requests', 'candidacy_applications', 'partylists', 'partylist_memberships'])
                              ->orWhere('target_table', 'like', '%election%');
                      })
                      ->orWhere(function($sub) use ($electionId) {
                          // Check if target_id is a string that might contain election_id
                          $sub->where('target_id', 'like', "%{$electionId}%")
                              ->whereIn('target_table', ['candidates', 'votes', 'voter_registries']);
                      });
                });
            }

            // ✅ If no electionId, show ALL logs (no filter)
            // This is the default behavior - all logs

            // Apply filters
            if ($request->has('action_type')) {
                $query->where('action_type', $request->action_type);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('from_date')) {
                $query->whereDate('timestamp', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('timestamp', '<=', $request->to_date);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('action_type', 'like', "%{$search}%")
                      ->orWhere('target_table', 'like', "%{$search}%")
                      ->orWhereHas('user', function($u) use ($search) {
                          $u->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Get all logs with pagination
            $perPage = $request->get('per_page', 50);
            $logs = $query->orderBy('timestamp', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $logs,
                'total' => $logs->total(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit trail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit trail without election filter - ALL LOGS
     */
    public function getAllAuditTrail(Request $request)
    {
        try {
            $query = AuditLog::with('user');

            // Apply filters
            if ($request->has('action_type')) {
                $query->where('action_type', $request->action_type);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('target_table')) {
                $query->where('target_table', $request->target_table);
            }

            if ($request->has('from_date')) {
                $query->whereDate('timestamp', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('timestamp', '<=', $request->to_date);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('action_type', 'like', "%{$search}%")
                      ->orWhere('target_table', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%")
                      ->orWhereHas('user', function($u) use ($search) {
                          $u->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%");
                      });
                });
            }

            $perPage = $request->get('per_page', 50);
            $logs = $query->orderBy('timestamp', 'desc')
                ->paginate($perPage);

            // Get statistics
            $stats = [
                'total' => AuditLog::count(),
                'by_action' => AuditLog::select('action_type', DB::raw('count(*) as count'))
                    ->groupBy('action_type')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get(),
                'by_table' => AuditLog::select('target_table', DB::raw('count(*) as count'))
                    ->whereNotNull('target_table')
                    ->groupBy('target_table')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get(),
                'today' => AuditLog::whereDate('timestamp', today())->count(),
                'last_hour' => AuditLog::where('timestamp', '>=', now()->subHour())->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $logs,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit trail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get audit trail for a specific user
     */
    public function getUserAuditTrail(Request $request, $userId)
    {
        try {
            $query = AuditLog::with('user')
                ->where('user_id', $userId);

            if ($request->has('from_date')) {
                $query->whereDate('timestamp', '>=', $request->from_date);
            }

            if ($request->has('to_date')) {
                $query->whereDate('timestamp', '<=', $request->to_date);
            }

            $perPage = $request->get('per_page', 50);
            $logs = $query->orderBy('timestamp', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user audit trail: ' . $e->getMessage()
            ], 500);
        }
    }
}