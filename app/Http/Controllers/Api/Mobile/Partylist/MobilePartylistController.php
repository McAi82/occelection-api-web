<?php

namespace App\Http\Controllers\Api\Mobile\Partylist;

use App\Http\Controllers\Controller;
use App\Models\Partylist;
use Illuminate\Http\Request;

class MobilePartylistController extends Controller
{
    /**
     * Get All Partylists
     * GET /api/mobile/partylists
     */
    public function index(Request $request)
    {
        $electionId = $request->get('election_id');
        
        $query = Partylist::withCount(['candidates' => function($q) {
            $q->where('is_approved', true);
        }]);
        
        if ($electionId) {
            $query->where('election_id', $electionId);
        }
        
        $partylists = $query->get()->map(function($partylist) {
            return [
                'partylist_id' => $partylist->partylist_id,
                'name' => $partylist->name,
                'description' => $partylist->description,
                'logo_url' => $partylist->logo_url,
                'candidates_count' => $partylist->candidates_count,
            ];
        });
        
        return response()->json([
            'success' => true,
            'partylists' => $partylists
        ]);
    }

    /**
     * Get Partylist Details
     * GET /api/mobile/partylists/{id}
     */
    public function show($id)
    {
        $partylist = Partylist::with(['candidates' => function($q) {
                $q->where('is_approved', true)->with(['user', 'position']);
            }, 'election'])
            ->withCount(['candidates' => function($q) {
                $q->where('is_approved', true);
            }])
            ->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'partylist' => [
                'partylist_id' => $partylist->partylist_id,
                'name' => $partylist->name,
                'description' => $partylist->description,
                'logo_url' => $partylist->logo_url,
                'candidates_count' => $partylist->candidates_count,
                'election' => [
                    'election_id' => $partylist->election->election_id,
                    'title' => $partylist->election->title,
                ],
                'candidates' => $partylist->candidates->map(function($candidate) {
                    return [
                        'candidate_id' => $candidate->candidate_id,
                        'name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                        'photo_url' => $candidate->photo_url,
                        'position' => $candidate->position->title,
                    ];
                })
            ]
        ]);
    }
}