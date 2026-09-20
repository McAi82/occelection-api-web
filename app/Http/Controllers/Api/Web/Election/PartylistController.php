<?php
// app/Http/Controllers/Api/Web/Election/PartylistController.php

namespace App\Http\Controllers\Api\Web\Election;

use App\Http\Controllers\Controller;
use App\Models\Partylist;
use App\Models\PartylistMembership;
use App\Models\Candidate;
use App\Models\Position;
use App\Services\NotificationService;
use App\Models\AuditLog;
use App\Models\Election;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PartylistController extends Controller
{
    // ==================== PUBLIC VIEW METHODS ====================

    /**
     * Get available years from database
     */
    public function getAvailableYears()
    {
        try {
            // Get distinct years from partylists created_at
            $years = Partylist::select(DB::raw('DISTINCT YEAR(created_at) as year'))
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->toArray();

            // If no partylists exist, use current year
            if (empty($years)) {
                $currentYear = date('Y');
                $years = [$currentYear];
            }

            return response()->json([
                'success' => true,
                'data' => $years
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available years: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available years: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get partylists by year
     */
    public function index(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            $electionId = $request->get('election_id');

            $query = Partylist::with([
                'creator',
                'activeMemberships' => function ($query) {
                    $query->where('status', 'approved')
                        ->where('is_active', true)
                        ->with(['candidate.user', 'candidate.position']);
                }
            ])
                ->withCount([
                    'activeMemberships as candidates_count' => function ($query) {
                        $query->where('status', 'approved')
                            ->where('is_active', true);
                    }
                ]);

            // ✅ Filter by year
            $query->whereYear('created_at', $year);

            if ($electionId) {
                $query->where('election_id', $electionId);
            }

            $partylists = $query->orderBy('name', 'asc')->get();

            // Transform the data
            $transformed = $partylists->map(function ($partylist) {
                return [
                    'partylist_id' => $partylist->partylist_id,
                    'name' => $partylist->name,
                    'description' => $partylist->description,
                    'logo_url' => $partylist->logo_url,
                    'election_id' => $partylist->election_id,
                    'candidates_count' => $partylist->candidates_count ?? 0,
                    'created_by_user_id' => $partylist->created_by_user_id,
                    'created_at' => $partylist->created_at,
                    'creator' => $partylist->creator ? [
                        'user_id' => $partylist->creator->user_id,
                        'first_name' => $partylist->creator->first_name,
                        'last_name' => $partylist->creator->last_name,
                        'email' => $partylist->creator->email,
                        'student_id' => $partylist->creator->student_id,
                    ] : null,
                    'active_memberships' => $partylist->activeMemberships->map(function ($membership) {
                        return [
                            'membership_id' => $membership->membership_id,
                            'status' => $membership->status,
                            'approved_at' => $membership->approved_at,
                            'candidate' => [
                                'candidate_id' => $membership->candidate->candidate_id ?? null,
                                'user' => $membership->candidate->user ? [
                                    'user_id' => $membership->candidate->user->user_id,
                                    'first_name' => $membership->candidate->user->first_name,
                                    'last_name' => $membership->candidate->user->last_name,
                                    'email' => $membership->candidate->user->email,
                                    'student_id' => $membership->candidate->user->student_id,
                                ] : null,
                                'position' => $membership->candidate->position ? [
                                    'position_id' => $membership->candidate->position->position_id,
                                    'title' => $membership->candidate->position->title,
                                    'category' => $membership->candidate->position->category,
                                ] : null,
                            ],
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformed,
                'meta' => [
                    'year' => $year,
                    'total' => $transformed->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching partylists: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylists: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single partylist details
     */
    public function show($id)
    {
        try {
            $partylist = Partylist::with([
                'creator',
                'activeMemberships' => function ($query) {
                    $query->where('status', 'approved')
                        ->where('is_active', true)
                        ->with(['candidate.user', 'candidate.position']);
                },
                'election'
            ])
                ->withCount([
                    'activeMemberships as candidates_count' => function ($query) {
                        $query->where('status', 'approved')
                            ->where('is_active', true);
                    }
                ])
                ->findOrFail($id);

            $response = [
                'partylist_id' => $partylist->partylist_id,
                'name' => $partylist->name,
                'description' => $partylist->description,
                'logo_url' => $partylist->logo_url,
                'election_id' => $partylist->election_id,
                'candidates_count' => $partylist->candidates_count ?? 0,
                'created_by_user_id' => $partylist->created_by_user_id,
                'created_at' => $partylist->created_at,
                'creator' => $partylist->creator ? [
                    'user_id' => $partylist->creator->user_id,
                    'first_name' => $partylist->creator->first_name,
                    'last_name' => $partylist->creator->last_name,
                    'email' => $partylist->creator->email,
                    'student_id' => $partylist->creator->student_id,
                    'course' => $partylist->creator->course ? [
                        'course_code' => $partylist->creator->course->course_code,
                        'course_name' => $partylist->creator->course->course_name,
                    ] : null,
                    'year_level' => $partylist->creator->year_level,
                    'face_reference_photo' => $partylist->creator->face_reference_photo,
                ] : null,
                'active_memberships' => $partylist->activeMemberships->map(function ($membership) {
                    return [
                        'membership_id' => $membership->membership_id,
                        'status' => $membership->status,
                        'approved_at' => $membership->approved_at,
                        'candidate' => [
                            'candidate_id' => $membership->candidate->candidate_id ?? null,
                            'user' => $membership->candidate->user ? [
                                'user_id' => $membership->candidate->user->user_id,
                                'first_name' => $membership->candidate->user->first_name,
                                'last_name' => $membership->candidate->user->last_name,
                                'email' => $membership->candidate->user->email,
                                'student_id' => $membership->candidate->user->student_id,
                                'course' => $membership->candidate->user->course ? [
                                    'course_code' => $membership->candidate->user->course->course_code,
                                    'course_name' => $membership->candidate->user->course->course_name,
                                ] : null,
                                'year_level' => $membership->candidate->user->year_level,
                                'face_reference_photo' => $membership->candidate->user->face_reference_photo,
                            ] : null,
                            'position' => $membership->candidate->position ? [
                                'position_id' => $membership->candidate->position->position_id,
                                'title' => $membership->candidate->position->title,
                                'category' => $membership->candidate->position->category,
                            ] : null,
                        ],
                    ];
                }),
                'election' => $partylist->election ? [
                    'election_id' => $partylist->election->election_id,
                    'title' => $partylist->election->title,
                    'election_type' => $partylist->election->election_type,
                    'year' => $partylist->election->year,
                    'voting_start' => $partylist->election->voting_start,
                    'voting_end' => $partylist->election->voting_end,
                    'course' => $partylist->election->course ? [
                        'course_id' => $partylist->election->course->course_id,
                        'course_code' => $partylist->election->course->course_code,
                        'course_name' => $partylist->election->course->course_name,
                    ] : null,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'data' => $response
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching partylist: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get partylists by election with year filtering
     */
    public function getByElection($electionId)
    {
        try {
            $election = Election::find($electionId);
            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Election not found'
                ], 404);
            }

            $year = $election->year ?? Carbon::parse($election->voting_start)->year;

            $partylists = Partylist::where('election_id', $electionId)
                ->whereYear('created_at', $year)
                ->with([
                    'creator',
                    'activeMemberships' => function ($query) {
                        $query->where('status', 'approved')
                            ->where('is_active', true)
                            ->with(['candidate.user', 'candidate.position']);
                    }
                ])
                ->withCount([
                    'activeMemberships as candidates_count' => function ($query) {
                        $query->where('status', 'approved')
                            ->where('is_active', true);
                    }
                ])
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($partylist) {
                    return [
                        'partylist_id' => $partylist->partylist_id,
                        'name' => $partylist->name,
                        'description' => $partylist->description,
                        'logo_url' => $partylist->logo_url,
                        'election_id' => $partylist->election_id,
                        'candidates_count' => $partylist->candidates_count ?? 0,
                        'created_by_user_id' => $partylist->created_by_user_id,
                        'created_at' => $partylist->created_at,
                        'creator' => $partylist->creator ? [
                            'user_id' => $partylist->creator->user_id,
                            'first_name' => $partylist->creator->first_name,
                            'last_name' => $partylist->creator->last_name,
                        ] : null,
                        'active_memberships' => $partylist->activeMemberships->map(function ($membership) {
                            return [
                                'membership_id' => $membership->membership_id,
                                'candidate' => [
                                    'candidate_id' => $membership->candidate->candidate_id ?? null,
                                    'user' => $membership->candidate->user ? [
                                        'first_name' => $membership->candidate->user->first_name,
                                        'last_name' => $membership->candidate->user->last_name,
                                    ] : null,
                                    'position' => $membership->candidate->position ? [
                                        'title' => $membership->candidate->position->title,
                                    ] : null,
                                ],
                            ];
                        }),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $partylists,
                'meta' => [
                    'year' => $year,
                    'election_id' => $electionId,
                    'total' => $partylists->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching partylists by election: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylists: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current year partylists (for application form)
     */
    public function getCurrentYearPartylists(Request $request)
    {
        try {
            $electionId = $request->get('election_id');

            // Get the election to determine the year
            $election = null;
            $year = date('Y'); // Default to current year

            if ($electionId) {
                $election = Election::find($electionId);
                if ($election) {
                    $year = $election->year ?? Carbon::parse($election->voting_start)->year;
                }
            }

            // Query partylists for the specific year
            $query = Partylist::with(['creator', 'activeMemberships']);

            if ($electionId) {
                $query->where('election_id', $electionId);
            }

            $partylists = $query->whereYear('created_at', $year)
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($partylist) {
                    $memberCount = PartylistMembership::where('partylist_id', $partylist->partylist_id)
                        ->where('status', 'approved')
                        ->where('is_active', true)
                        ->count();

                    return [
                        'partylist_id' => $partylist->partylist_id,
                        'name' => $partylist->name,
                        'description' => $partylist->description,
                        'logo_url' => $partylist->logo_url,
                        'election_id' => $partylist->election_id,
                        'member_count' => $memberCount,
                        'creator' => $partylist->creator ? [
                            'user_id' => $partylist->creator->user_id,
                            'first_name' => $partylist->creator->first_name,
                            'last_name' => $partylist->creator->last_name,
                        ] : null,
                        'created_at' => $partylist->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $partylists,
                'meta' => [
                    'year' => $year,
                    'election_id' => $electionId,
                    'total' => $partylists->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current year partylists: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylists: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== CANDIDATE PARTYLIST METHODS ====================

    /**
     * Check if candidate can create a partylist (highest position only)
     */
    private function canCreatePartylist($candidate, $electionId)
    {
        try {
            $topPosition = Position::where('election_id', $electionId)
                ->orderBy('order_in_ballot')
                ->first();

            if (!$topPosition) {
                return ['can' => false, 'message' => 'No positions found for this election'];
            }

            if ($candidate->position_id !== $topPosition->position_id) {
                return [
                    'can' => false,
                    'message' => 'Only candidates running for ' . $topPosition->title . ' can create a partylist.'
                ];
            }

            return ['can' => true];
        } catch (\Exception $e) {
            Log::error('Error checking partylist creation permission: ' . $e->getMessage());
            return ['can' => false, 'message' => 'Error checking permissions'];
        }
    }

    /**
     * Candidate creates a partylist (only highest position)
     */
    public function candidateCreate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'election_id' => 'required|exists:elections,election_id',
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
                'logo' => 'nullable|image|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = $request->user();
            $electionId = $request->election_id;
            $election = Election::find($electionId);
            $year = $election ? ($election->year ?? Carbon::parse($election->voting_start)->year) : date('Y');

            // Check if user is a candidate in this election
            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $electionId)
                ->where('is_approved', true)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'message' => 'You are not an approved candidate in this election'
                ], 403);
            }

            // Check if candidate is already in a partylist
            $existingMembership = PartylistMembership::where('candidate_id', $candidate->candidate_id)
                ->where('status', 'approved')
                ->where('is_active', true)
                ->first();

            if ($existingMembership) {
                return response()->json([
                    'message' => 'You are already a member of a partylist'
                ], 400);
            }

            // Check if candidate can create a partylist
            $canCreate = $this->canCreatePartylist($candidate, $electionId);
            if (!$canCreate['can']) {
                return response()->json([
                    'message' => $canCreate['message']
                ], 403);
            }

            // Check if a partylist already exists for this election year
            $existingPartylist = Partylist::where('election_id', $electionId)
                ->whereYear('created_at', $year)
                ->first();

            if ($existingPartylist) {
                return response()->json([
                    'message' => 'A partylist already exists for this election year'
                ], 400);
            }

            // Upload logo
            $logoUrl = null;
            if ($request->hasFile('logo')) {
                $logo = $request->file('logo');
                $filename = time() . '_partylist_' . uniqid() . '.' . $logo->getClientOriginalExtension();
                $path = $logo->storeAs('partylist_logos', $filename, 'public');
                $logoUrl = asset('storage/' . $path);
            }

            // Create partylist
            $partylist = Partylist::create([
                'election_id' => $electionId,
                'name' => $request->name,
                'description' => $request->description,
                'logo_url' => $logoUrl,
                'created_by_user_id' => $user->user_id,
                'approved_by_user_id' => $user->user_id,
            ]);

            // Create membership for the creator
            PartylistMembership::create([
                'partylist_id' => $partylist->partylist_id,
                'candidate_id' => $candidate->candidate_id,
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by_user_id' => $user->user_id,
                'is_active' => true,
            ]);

            AuditLog::create([
                'user_id' => $user->user_id,
                'action_type' => 'CANDIDATE_CREATE_PARTYLIST',
                'target_table' => 'partylists',
                'target_id' => $partylist->partylist_id,
                'new_value' => json_encode($partylist->toArray()),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Partylist created successfully',
                'data' => $partylist
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating partylist: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create partylist: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get partylists for candidates to join
     */
    public function candidateGetAvailableLists(Request $request, $electionId)
    {
        try {
            $user = $request->user();
            $election = Election::find($electionId);

            if (!$election) {
                return response()->json([
                    'success' => false,
                    'message' => 'Election not found'
                ], 404);
            }

            $year = $election->year ?? Carbon::parse($election->voting_start)->year;

            // Get user's candidate record
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

            // Check if candidate is already in a partylist
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

            // Check if candidate can create (highest position) or only join
            $canCreate = $this->canCreatePartylist($userCandidate, $electionId);

            // Get all existing partylists for this election year
            $partylists = Partylist::where('election_id', $electionId)
                ->whereYear('created_at', $year)
                ->withCount([
                    'activeMemberships as members_count' => function ($query) {
                        $query->where('status', 'approved')
                            ->where('is_active', true);
                    }
                ])
                ->with(['creator'])
                ->get()
                ->map(function ($partylist) use ($userCandidate) {
                    // Check if user has a pending request
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
                    'can_create' => $canCreate['can'],
                    'create_message' => $canCreate['can'] ?
                        'You can create a new partylist as you are running for the highest position.' :
                        $canCreate['message'],
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
     * Candidate applies to join a partylist (for non-highest positions)
     */
    public function candidateApply(Request $request, $partylistId)
    {
        try {
            $user = $request->user();

            // Find partylist
            $partylist = Partylist::findOrFail($partylistId);

            // Find candidate
            $candidate = Candidate::where('user_id', $user->user_id)
                ->where('election_id', $partylist->election_id)
                ->where('is_approved', true)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'message' => 'You are not an approved candidate in this election'
                ], 403);
            }

            // Check if already in a partylist
            $existingMembership = PartylistMembership::where('candidate_id', $candidate->candidate_id)
                ->where('status', 'approved')
                ->where('is_active', true)
                ->first();

            if ($existingMembership) {
                return response()->json([
                    'message' => 'You are already a member of a partylist'
                ], 400);
            }

            // Check if already applied
            $existingRequest = PartylistMembership::where('partylist_id', $partylistId)
                ->where('candidate_id', $candidate->candidate_id)
                ->where('status', 'pending')
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'message' => 'You already have a pending application for this partylist'
                ], 400);
            }

            // Check if previously rejected
            $rejectedRequest = PartylistMembership::where('partylist_id', $partylistId)
                ->where('candidate_id', $candidate->candidate_id)
                ->where('status', 'rejected')
                ->first();

            if ($rejectedRequest) {
                return response()->json([
                    'message' => 'Your previous application was rejected'
                ], 400);
            }

            // Create membership request
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
    public function candidateGetRequests(Request $request)
    {
        try {
            $user = $request->user();

            // Find partylist where this user is the creator
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
     * Handle partylist request (approve/reject) - Creator only
     */
    public function candidateHandleRequest(Request $request, $membershipId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:approve,reject',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $user = $request->user();
            $action = $request->action;

            // Find the membership request
            $membership = PartylistMembership::with(['partylist', 'candidate'])
                ->findOrFail($membershipId);

            // Verify ownership (only creator can approve/reject)
            if ($membership->partylist->created_by_user_id !== $user->user_id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify status is pending
            if ($membership->status !== 'pending') {
                return response()->json([
                    'message' => 'This request has already been processed'
                ], 400);
            }

            $notificationService = app(NotificationService::class);
            $partylistName = $membership->partylist->name;
            $candidateName = $membership->candidate->user->first_name . ' ' . $membership->candidate->user->last_name;

            if ($action === 'approve') {
                $membership->status = 'approved';
                $membership->approved_at = now();
                $membership->approved_by_user_id = $user->user_id;
                $membership->is_active = true;
                $membership->save();

                $message = 'Candidate approved and added to partylist';

                $notificationService->partylistMembershipApproved(
                    $membership->candidate->user_id,
                    $partylistName
                );

                // ✅ Also notify the creator (optional)
                $notificationService->send(
                    $membership->partylist->created_by_user_id,
                    '✅ New Member Joined',
                    "{$candidateName} has joined your partylist \"{$partylistName}\"",
                    'system',
                    ['candidate' => $candidateName, 'partylist' => $partylistName]
                );
            } else {
                $membership->status = 'rejected';
                $membership->is_active = false;
                $membership->save();

                $message = 'Application rejected';

                $notificationService->partylistMembershipRejected(
                    $membership->candidate->user_id,
                    $partylistName
                );
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
}
