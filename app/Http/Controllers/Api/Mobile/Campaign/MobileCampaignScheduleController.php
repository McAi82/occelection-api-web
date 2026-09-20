<?php

namespace App\Http\Controllers\Api\Mobile\Campaign;

use App\Http\Controllers\Controller;
use App\Models\CampaignSchedule;
use App\Models\Candidate;
use Illuminate\Http\Request;

class MobileCampaignScheduleController extends Controller
{
    /**
     * Get schedules for a specific candidate (VIEW ONLY)
     * GET /mobile/campaign-schedules/candidate/{candidateId}
     */
    public function getCandidateSchedules($candidateId)
    {
        try {
            $candidate = Candidate::findOrFail($candidateId);

            $schedules = CampaignSchedule::where('candidate_id', $candidateId)
                ->with('election')
                ->orderBy('start_time')
                ->get()
                ->map(function($schedule) {
                    return [
                        'schedule_id' => $schedule->schedule_id,
                        'election' => [
                            'election_id' => $schedule->election->election_id,
                            'title' => $schedule->election->title,
                        ],
                        'course_section' => $schedule->course_section,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'status' => $schedule->status,
                        'notes' => $schedule->notes,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'candidate' => [
                        'candidate_id' => $candidate->candidate_id,
                        'name' => $candidate->user->first_name . ' ' . $candidate->user->last_name,
                    ],
                    'schedules' => $schedules,
                    'total' => $schedules->count(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidate schedules'
            ], 500);
        }
    }
}