<?php

namespace App\Http\Controllers\Api\Web\Election;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Services\NotificationService;
use App\Models\Position;
use App\Models\AuditLog;
use App\Models\Vote;
use App\Models\Candidate;
use App\Models\Partylist;
use App\Models\VoterRegistry;
use App\Models\PartylistMembership;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Traits\HasApiResponse;
use Carbon\Carbon;

class ElectionController extends Controller
{
    use HasApiResponse;

    public function show($id)
    {
        try {
            $election = Election::with(['positions', 'course', 'creator'])
                ->find($id);

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Election not found'
                ], 404);
            }

            // Get partylists with members count
            $partylists = Partylist::where('election_id', $id)
                ->withCount(['activeMemberships as candidates_count'])
                ->get()
                ->map(function($partylist) {
                    return [
                        'partylist_id' => $partylist->partylist_id,
                        'name' => $partylist->name,
                        'description' => $partylist->description,
                        'logo_url' => $partylist->logo_url,
                        'platform' => $partylist->platform,
                        'candidates_count' => $partylist->candidates_count ?? 0,
                    ];
                });

            // Get candidates with partylist information
            $candidates = Candidate::where('election_id', $id)
                ->where('is_approved', true)
                ->with(['user.course', 'position'])
                ->get()
                ->map(function($candidate) {
                    $partylist = null;
                    $membership = PartylistMembership::where('candidate_id', $candidate->candidate_id)
                        ->where('status', 'approved')
                        ->where('is_active', true)
                        ->with('partylist')
                        ->first();
                        
                    if ($membership) {
                        $partylist = $membership->partylist;
                    }

                    return [
                        'candidate_id' => $candidate->candidate_id,
                        'user_id' => $candidate->user_id,
                        'position_id' => $candidate->position_id,
                        'platform' => $candidate->platform,
                        'qualifications' => $candidate->qualifications,
                        'is_approved' => $candidate->is_approved,
                        'user' => $candidate->user ? [
                            'user_id' => $candidate->user->user_id,
                            'first_name' => $candidate->user->first_name,
                            'last_name' => $candidate->user->last_name,
                            'email' => $candidate->user->email,
                            'student_id' => $candidate->user->student_id,
                            'year_level' => $candidate->user->year_level,
                            'face_reference_photo' => $candidate->user->face_reference_photo,
                            'course' => $candidate->user->course ? [
                                'course_id' => $candidate->user->course->course_id,
                                'course_code' => $candidate->user->course->course_code,
                                'course_name' => $candidate->user->course->course_name,
                            ] : null,
                        ] : null,
                        'position' => $candidate->position ? [
                            'position_id' => $candidate->position->position_id,
                            'title' => $candidate->position->title,
                            'category' => $candidate->position->category,
                        ] : null,
                        'partylist' => $partylist ? [
                            'partylist_id' => $partylist->partylist_id,
                            'name' => $partylist->name,
                            'description' => $partylist->description,
                            'logo_url' => $partylist->logo_url,
                        ] : null,
                    ];
                });

            $responseData = [
                'election_id' => $election->election_id,
                'title' => $election->title,
                'election_type' => $election->election_type,
                'year' => $election->year, // ✅ Added year
                'description' => $election->description,
                'voting_start' => $election->voting_start,
                'voting_end' => $election->voting_end,
                'is_active' => $election->is_active,
                'status' => $this->getStatus($election),
                'is_ongoing' => $election->isOngoing(),
                'course' => $election->course ? [
                    'course_id' => $election->course->course_id,
                    'course_code' => $election->course->course_code,
                    'course_name' => $election->course->course_name,
                ] : null,
                'positions' => $election->positions ? $election->positions->map(function($position) {
                    return [
                        'position_id' => $position->position_id,
                        'title' => $position->title,
                        'category' => $position->category,
                        'order_in_ballot' => $position->order_in_ballot,
                        'max_winners' => $position->max_winners,
                        'description' => $position->description,
                    ];
                }) : [],
                'partylists' => $partylists,
                'candidates' => $candidates,
                'created_by' => $election->creator ? [
                    'user_id' => $election->creator->user_id,
                    'first_name' => $election->creator->first_name,
                    'last_name' => $election->creator->last_name,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch election: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch election: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all elections
     */
    public function index(Request $request)
    {
        try {
            $query = Election::with(['positions', 'course']);

            if ($request->has('election_type')) {
                $query->where('election_type', $request->election_type);
            }

            if ($request->has('course_id')) {
                $query->where('course_id', $request->course_id);
            }

            if ($request->has('year')) {
                $query->where('year', $request->year); // ✅ Filter by year
            }

            $elections = $query->orderBy('created_at', 'desc')->get();

            foreach ($elections as $election) {
                $election->status = $this->getStatus($election);
                $election->is_ongoing = $election->isOngoing();
            }

            return response()->json($elections);
        } catch (\Exception $e) {
            Log::error('Failed to fetch elections: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch elections'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:100',
                'election_type' => 'required|in:CSG,SBO',
                'description' => 'nullable|string',
                'voting_start' => 'required|date',
                'voting_end' => 'required|date|after:voting_start',
                'course_id' => 'required_if:election_type,SBO|exists:courses,course_id|nullable',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Parse the datetime
            $votingStart = Carbon::parse($request->voting_start);
            $votingEnd = Carbon::parse($request->voting_end);

            // Set timezone
            $votingStart->setTimezone('Asia/Manila');
            $votingEnd->setTimezone('Asia/Manila');

            // ✅ Extract year from voting_start
            $year = $votingStart->year;

            $election = Election::create([
                'title' => $request->title,
                'election_type' => $request->election_type,
                'year' => $year, // ✅ Store the year
                'description' => $request->description,
                'voting_start' => $votingStart->format('Y-m-d H:i:s'),
                'voting_end' => $votingEnd->format('Y-m-d H:i:s'),
                'created_by_user_id' => $request->user()->user_id,
                'course_id' => $request->election_type === 'SBO' ? $request->course_id : null,
                'is_active' => true,
            ]);

            // Create predefined positions
            $predefinedPositions = $this->getPredefinedPositions($request->election_type);
            
            foreach ($predefinedPositions as $positionData) {
                Position::create([
                    'election_id' => $election->election_id,
                    'title' => $positionData['title'],
                    'category' => $positionData['category'],
                    'order_in_ballot' => $positionData['order'],
                    'max_winners' => $positionData['max_winners'],
                    'position_type' => $positionData['position_type'] ?? 'other',
                ]);
            }

            AuditLog::create([
                'user_id' => $request->user()->user_id,
                'action_type' => 'CREATE_ELECTION',
                'target_table' => 'elections',
                'target_id' => $election->election_id,
                'new_value' => json_encode($election->toArray()),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Election created successfully',
                'election' => $election->load('positions', 'course')
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Failed to create election: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create election: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get live results
     */
    public function getLiveResults($id)
    {
        try {
            $election = Election::findOrFail($id);

            $liveResults = [];
            foreach ($election->positions as $position) {
                $candidates = Candidate::where('election_id', $id)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'memberships.partylist'])
                    ->get();

                foreach ($candidates as $candidate) {
                    $voteCount = Vote::where('election_id', $id)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();

                    $partylist = $candidate->memberships->first()?->partylist;

                    $liveResults[$position->title][] = [
                        'candidate_name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                        'partylist' => $partylist ? $partylist->name : 'Independent',
                        'votes' => $voteCount,
                    ];
                }
            }

            return response()->json([
                'election' => $election,
                'is_ongoing' => $election->isOngoing(),
                'live_results' => $liveResults,
                'total_votes_cast' => VoterRegistry::where('election_id', $id)
                    ->where('has_voted', true)
                    ->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch live results: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch results'], 500);
        }
    }

    /**
     * Get final results
     */
    public function getResults($id)
    {
        try {
            $election = Election::findOrFail($id);

            $user = auth()->user();
            $isAdmin = $user->role === 'admin' || $user->role === 'comelec';

            if (!$election->isFinished() && !$isAdmin) {
                return response()->json(['message' => 'Results not available yet'], 403);
            }

            $results = [];
            foreach ($election->positions as $position) {
                $candidates = Candidate::where('election_id', $id)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user', 'memberships.partylist'])
                    ->get();

                $positionResults = [];
                foreach ($candidates as $candidate) {
                    $voteCount = Vote::where('election_id', $id)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();

                    $partylist = $candidate->memberships->first()?->partylist;

                    $positionResults[] = [
                        'candidate' => $candidate,
                        'votes' => $voteCount,
                        'partylist_name' => $partylist ? $partylist->name : 'Independent',
                    ];
                }

                usort($positionResults, function($a, $b) {
                    return $b['votes'] - $a['votes'];
                });

                $results[$position->title] = $positionResults;
            }

            return response()->json([
                'election' => $election,
                'results' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch results: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to fetch results'], 500);
        }
    }

    /**
     * Get winners for an election
     */
    public function getWinners($id)
    {
        try {
            $election = Election::findOrFail($id);

            // Get all positions with their candidates and vote counts
            $positions = Position::where('election_id', $id)->get();
            $winners = [];

            foreach ($positions as $position) {
                $candidates = Candidate::where('election_id', $id)
                    ->where('position_id', $position->position_id)
                    ->where('is_approved', true)
                    ->with(['user.course', 'memberships.partylist'])
                    ->get();

                $candidateResults = [];
                foreach ($candidates as $candidate) {
                    $voteCount = Vote::where('election_id', $id)
                        ->where('candidate_id', $candidate->candidate_id)
                        ->count();

                    $partylist = $candidate->memberships->first()?->partylist;

                    $candidateResults[] = [
                        'candidate' => $candidate,
                        'votes' => $voteCount,
                        'partylist_name' => $partylist ? $partylist->name : null,
                    ];
                }

                // Sort by votes descending
                usort($candidateResults, function($a, $b) {
                    return $b['votes'] - $a['votes'];
                });

                // Get top winners based on max_winners
                $maxWinners = $position->max_winners;
                $winnersList = array_slice($candidateResults, 0, $maxWinners);

                // Calculate total votes for percentage
                $totalVotes = array_sum(array_column($candidateResults, 'votes'));

                foreach ($winnersList as $index => $result) {
                    $candidate = $result['candidate'];
                    $user = $candidate->user;
                    $winners[] = [
                        'position_id' => $position->position_id,
                        'position_title' => $position->title,
                        'position_category' => $position->category,
                        'candidate_id' => $candidate->candidate_id,
                        'user_id' => $user->user_id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'student_id' => $user->student_id,
                        'email' => $user->email,
                        'course' => $user->course ? $user->course->course_code : 'N/A',
                        'year_level' => $user->year_level,
                        'face_reference_photo' => $user->face_reference_photo,
                        'partylist_name' => $result['partylist_name'],
                        'votes' => $result['votes'],
                        'total_votes' => $totalVotes,
                        'percentage' => $totalVotes > 0 ? round(($result['votes'] / $totalVotes) * 100, 2) : 0,
                        'is_winner' => true,
                        'rank' => $index + 1,
                        'election_title' => $election->title,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $winners
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch winners: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch winners: ' . $e->getMessage()
            ], 500);
        }
    }

    // Get active election (ongoing or upcoming)
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
                return response()->noContent();
            }
            
            $election->is_ongoing = $election->isOngoing();
            $election->status = $this->getStatus($election);
            
            return response()->json($election);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to fetch active election'], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $election = Election::findOrFail($id);
        $election->delete();

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'DELETE_ELECTION',
            'target_table' => 'elections',
            'target_id' => $election->election_id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Election deleted successfully'
        ]);
    }

     public function update(Request $request, $id)
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
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldValue = $election->toArray();
        
        // ✅ If voting_start is updated, update year as well
        if ($request->has('voting_start')) {
            $votingStart = Carbon::parse($request->voting_start);
            $election->year = $votingStart->year;
        }
        
        $election->update($request->only(['title', 'description', 'voting_start', 'voting_end', 'is_active']));

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'UPDATE_ELECTION',
            'target_table' => 'elections',
            'target_id' => $election->election_id,
            'old_value' => json_encode($oldValue),
            'new_value' => json_encode($election->toArray()),
            'ip_address' => $request->ip(),
        ]);

        return response()->json($election->load('positions', 'course'));
    }


    /**
     * Get predefined positions for election type
     */
    private function getPredefinedPositions($electionType)
    {
        switch ($electionType) {
            case 'CSG':
                return [
                    ['title' => 'CSG President', 'category' => 'Executive', 'order' => 1, 'max_winners' => 1, 'position_type' => 'executive'],
                    ['title' => 'CSG Vice President', 'category' => 'Executive', 'order' => 2, 'max_winners' => 1, 'position_type' => 'executive'],
                    ['title' => 'General Secretary', 'category' => 'Secretariat', 'order' => 3, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Secretary of Budget and Finance', 'category' => 'Secretariat', 'order' => 4, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Secretary of Sports', 'category' => 'Secretariat', 'order' => 5, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Secretary of Press and Publication', 'category' => 'Secretariat', 'order' => 6, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Secretary of External Affairs', 'category' => 'Secretariat', 'order' => 7, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Senate President Chair on Budget and Appropriation', 'category' => 'Senate', 'order' => 8, 'max_winners' => 1, 'position_type' => 'senator'],
                    ['title' => 'Senator Chair on Publication', 'category' => 'Senate', 'order' => 9, 'max_winners' => 1, 'position_type' => 'senator'],
                    ['title' => 'Senator Chair on Cultural Music and Arts', 'category' => 'Senate', 'order' => 10, 'max_winners' => 1, 'position_type' => 'senator'],
                    ['title' => 'Senator Chair on Sports', 'category' => 'Senate', 'order' => 11, 'max_winners' => 1, 'position_type' => 'senator'],
                    ['title' => 'Senator Chair on Literary', 'category' => 'Senate', 'order' => 12, 'max_winners' => 1, 'position_type' => 'senator'],
                    ['title' => 'Senator Chair on Student\'s Welfare and Environment', 'category' => 'Senate', 'order' => 13, 'max_winners' => 1, 'position_type' => 'senator'],
                ];
            case 'SBO':
                return [
                    ['title' => 'Governor', 'category' => 'Executive', 'order' => 1, 'max_winners' => 1, 'position_type' => 'executive'],
                    ['title' => 'Vice Governor', 'category' => 'Executive', 'order' => 2, 'max_winners' => 1, 'position_type' => 'executive'],
                    ['title' => 'Secretary', 'category' => 'Secretariat', 'order' => 3, 'max_winners' => 1, 'position_type' => 'secretary'],
                    ['title' => 'Treasurer', 'category' => 'Finance', 'order' => 4, 'max_winners' => 1, 'position_type' => 'finance'],
                    ['title' => 'Auditor', 'category' => 'Finance', 'order' => 5, 'max_winners' => 1, 'position_type' => 'finance'],
                ];
            default:
                return [];
        }
    }

    private function getStatus($election)
    {
        $now = now();
        if ($now < $election->voting_start) return 'upcoming';
        if ($now > $election->voting_end) return 'ended';
        return 'ongoing';
    }

public function notifyElectionStarted($electionId)
{
    try {
        $election = Election::find($electionId);
        if (!$election) return;
        
        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->electionStarted($electionId, $election->title);
        
        Log::info("Election started notification sent to {$sentCount} non-voters");
    } catch (\Exception $e) {
        Log::warning('Failed to send election started notification: ' . $e->getMessage());
    }
}

/**
 * Send election reminder - ONLY NON-VOTERS
 */
public function sendElectionReminder($electionId)
{
    try {
        $election = Election::find($electionId);
        if (!$election) return;
        
        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->sendElectionReminder(
            $electionId,
            $election->title,
            $election->voting_start
        );
        
        Log::info("Election reminder sent to {$sentCount} non-voters");
    } catch (\Exception $e) {
        Log::warning('Failed to send election reminder: ' . $e->getMessage());
    }
}

/**
 * Send election ending soon - ONLY NON-VOTERS
 */
public function notifyElectionEndingSoon($electionId)
{
    try {
        $election = Election::find($electionId);
        if (!$election) return;
        
        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->electionEndingSoon(
            $electionId,
            $election->title,
            $election->voting_end
        );
        
        Log::info("Election ending soon notification sent to {$sentCount} non-voters");
    } catch (\Exception $e) {
        Log::warning('Failed to send election ending soon notification: ' . $e->getMessage());
    }
}

/**
 * Send notifications when election ends - ALL VOTERS
 */
public function notifyElectionEnded($electionId)
{
    try {
        $election = Election::find($electionId);
        if (!$election) return;
        
        $notificationService = app(NotificationService::class);
        $sentCount = $notificationService->electionEnded($electionId, $election->title);
        
        Log::info("Election ended notification sent to {$sentCount} voters");
    } catch (\Exception $e) {
        Log::warning('Failed to send election ended notification: ' . $e->getMessage());
    }
}
}