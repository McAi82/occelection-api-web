<?php

namespace App\Http\Controllers\Api\Mobile\Election;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Election;
use App\Models\Position;
use App\Models\VoterRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MobileCandidateController extends Controller
{
    /**
     * Get Candidates by Election
     * GET /api/mobile/candidates/election/{electionId}
     */
    public function getByElection($electionId)
    {
        try {
            $candidates = Candidate::where('election_id', $electionId)
                ->where('is_approved', true)
                ->with(['user', 'position', 'partylist'])
                ->get()
                ->map(function($candidate) {
                    return [
                        'candidate_id' => $candidate->candidate_id,
                        'user' => [
                            'first_name' => $candidate->user->first_name,
                            'last_name' => $candidate->user->last_name,
                            'student_id' => $candidate->user->student_id,
                            'year_level' => $candidate->user->year_level,
                            'email' => $candidate->user->email,
                            'course' => $candidate->user->course ? [
                                'course_id' => $candidate->user->course->course_id,
                                'course_code' => $candidate->user->course->course_code,
                                'course_name' => $candidate->user->course->course_name,
                            ] : null,
                            'face_reference_photo' => $candidate->user->face_reference_photo,
                        ],
                        'position' => [
                            'position_id' => $candidate->position->position_id,
                            'title' => $candidate->position->title,
                            'category' => $candidate->position->category,
                        ],
                        'partylist' => $candidate->partylist ? [
                            'partylist_id' => $candidate->partylist->partylist_id,
                            'name' => $candidate->partylist->name,
                            'logo_url' => $candidate->partylist->logo_url,
                        ] : null,
                        'platform' => $candidate->platform,
                        'qualifications' => $candidate->qualifications,
                        'is_approved' => $candidate->is_approved,
                        'photo_url' => $candidate->photo_url,
                    ];
                });
            
            return response()->json([
                'success' => true,
                'candidates' => $candidates
            ]);
        } catch (\Exception $e) {
            Log::error('Get candidates error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidates'
            ], 500);
        }
    }

    /**
     * Get Candidate by ID
     * GET /api/mobile/candidates/{id}
     */
    public function getById($id)
    {
        try {
            $candidate = Candidate::with(['user', 'position', 'partylist', 'election'])
                ->findOrFail($id);
            
            $voteCount = \App\Models\Vote::where('candidate_id', $id)->count();
            
            $photoUrl = $candidate->photo_url;
            if ($photoUrl && !str_starts_with($photoUrl, 'http')) {
                $photoUrl = asset($photoUrl);
            }
            
            return response()->json([
                'success' => true,
                'candidate' => [
                    'candidate_id' => $candidate->candidate_id,
                    'first_name' => $candidate->user->first_name,
                    'last_name' => $candidate->user->last_name,
                    'student_id' => $candidate->user->student_id,
                    'email' => $candidate->user->email,
                    'year_level' => $candidate->user->year_level,
                    'course' => $candidate->user->course ? [
                        'course_id' => $candidate->user->course->course_id,
                        'course_code' => $candidate->user->course->course_code,
                        'course_name' => $candidate->user->course->course_name,
                    ] : null,
                    'photo_url' => $photoUrl,
                    'face_reference_photo' => $candidate->user->face_reference_photo,
                    'position' => [
                        'position_id' => $candidate->position->position_id,
                        'title' => $candidate->position->title,
                        'category' => $candidate->position->category,
                    ],
                    'partylist' => $candidate->partylist ? [
                        'partylist_id' => $candidate->partylist->partylist_id,
                        'name' => $candidate->partylist->name,
                        'description' => $candidate->partylist->description,
                        'logo_url' => $candidate->partylist->logo_url,
                    ] : null,
                    'platform' => $candidate->platform,
                    'qualifications' => $candidate->qualifications,
                    'is_approved' => $candidate->is_approved,
                    'votes' => $voteCount,
                    'election' => [
                        'election_id' => $candidate->election->election_id,
                        'title' => $candidate->election->title,
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get candidate by ID error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Candidate not found'
            ], 404);
        }
    }

public function getBallot($electionId, Request $request)
{
    try {
        Log::info('Get ballot called for election: ' . $electionId);
        
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }
        
        // Check if user is registered for this election
        $voterRegistry = VoterRegistry::where('election_id', $electionId)
            ->where('user_id', $user->user_id)
            ->first();
            
        if (!$voterRegistry) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered for this election'
            ], 403);
        }
        
        // Check if already voted
        if ($voterRegistry->has_voted) {
            return response()->json([
                'success' => false,
                'message' => 'You have already voted in this election'
            ], 403);
        }
        
        // Get election
        $election = Election::find($electionId);
        if (!$election) {
            return response()->json([
                'success' => false,
                'message' => 'Election not found'
            ], 404);
        }
        
        // Check if election is ongoing
        if (!$election->isOngoing()) {
            return response()->json([
                'success' => false,
                'message' => 'Election is not ongoing'
            ], 403);
        }
        
        // Get positions with their candidates
        $positions = \App\Models\Position::where('election_id', $electionId)
            ->orderBy('order_in_ballot')
            ->get();
        
        $ballot = [];
        
        foreach ($positions as $position) {
            // Get approved candidates for this position
            $candidates = Candidate::where('election_id', $electionId)
                ->where('position_id', $position->position_id)
                ->where('is_approved', true)
                ->with(['user', 'partylist'])
                ->get();
            
            // Only include positions that have candidates
            if ($candidates->count() > 0) {
                $candidateList = [];
                foreach ($candidates as $candidate) {
                    $candidateList[] = [
                        'candidate_id' => $candidate->candidate_id,
                        'user' => [
                            'first_name' => $candidate->user->first_name,
                            'last_name' => $candidate->user->last_name,
                            'year_level' => $candidate->user->year_level,
                            'course' => $candidate->user->course ? [
                                'course_code' => $candidate->user->course->course_code,
                            ] : null,
                        ],
                        'partylist' => $candidate->partylist ? [
                            'name' => $candidate->partylist->name,
                        ] : null,
                        'platform' => $candidate->platform,
                        'photo_url' => $candidate->photo_url,
                    ];
                }
                
                $ballot[] = [
                    'position_id' => $position->position_id,
                    'title' => $position->title,
                    'category' => $position->category ?? 'General',
                    'max_winners' => $position->max_winners,
                    'order_in_ballot' => $position->order_in_ballot,
                    'candidates' => $candidateList,
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'election' => [
                'election_id' => $election->election_id,
                'title' => $election->title,
                'voting_end' => $election->voting_end,
            ],
            'ballot' => $ballot
        ]);
        
    } catch (\Exception $e) {
        Log::error('Get ballot error: ' . $e->getMessage());
        Log::error($e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to load ballot: ' . $e->getMessage()
        ], 500);
    }
}
}