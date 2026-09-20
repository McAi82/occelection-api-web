<?php

namespace App\Http\Controllers\Api\Web\Partylist;

use App\Http\Controllers\Controller;
use App\Models\Partylist;
use Illuminate\Http\Request;

class WebPartylistController extends Controller
{
    /**
     * Get partylists for web (public view)
     * GET /web/partylists
     */
    public function index(Request $request)
    {
        try {
            $electionId = $request->input('election_id');
            
            $query = Partylist::withCount(['candidates' => function($q) {
                $q->where('is_approved', true);
            }]);
            
            if ($electionId) {
                $query->where('election_id', $electionId);
            }
            
            $partylists = $query->orderBy('name')->get();
            
            return response()->json([
                'success' => true,
                'data' => $partylists
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partylists'
            ], 500);
        }
    }

    /**
     * Get single partylist details
     * GET /web/partylists/{id}
     */
    public function show($id)
    {
        try {
            $partylist = Partylist::with([
                'candidates' => function($q) {
                    $q->where('is_approved', true)
                      ->with(['user', 'position']);
                },
                'election'
            ])
            ->withCount(['candidates' => function($q) {
                $q->where('is_approved', true);
            }])
            ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $partylist
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partylist not found'
            ], 404);
        }
    }
}