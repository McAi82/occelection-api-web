<?php

namespace App\Http\Controllers\Api\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Election;
use App\Models\Candidate;
use App\Models\VoterRegistry;
use App\Models\Position;
use App\Models\Partylist;
use App\Traits\HasApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class RecordsController extends Controller
{
    use HasApiResponse;

    /**
     * Get all years that have election records
     */
    public function getYears()
    {
        $years = Election::select(DB::raw('DISTINCT year'))
            ->whereNotNull('year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // If no years found, use created_at as fallback
        if (empty($years)) {
            $years = Election::select(DB::raw('YEAR(created_at) as year'))
                ->distinct()
                ->orderBy('year', 'desc')
                ->pluck('year')
                ->toArray();
        }

        return $this->successResponse($years);
    }


    /**
     * Get all records for a specific year
     */
    public function getYearRecords($year)
    {
        // ✅ Use the year column
        $elections = Election::where('year', $year)
            ->orWhereYear('created_at', $year)
            ->with(['course', 'positions'])
            ->get();

        $totalVoters = 0;
        $totalVotesCast = 0;

        $electionData = $elections->map(function ($election) use (&$totalVoters, &$totalVotesCast) {
            $voters = VoterRegistry::where('election_id', $election->election_id);
            $total = $voters->count();
            $voted = $voters->where('has_voted', true)->count();

            $candidatesCount = Candidate::where('election_id', $election->election_id)
                ->where('is_approved', true)
                ->count();

            $totalVoters += $total;
            $totalVotesCast += $voted;

            return [
                'election_id' => $election->election_id,
                'title' => $election->title,
                'election_type' => $election->election_type,
                'year' => $election->year, // ✅ Added year
                'description' => $election->description,
                'voting_start' => $election->voting_start,
                'voting_end' => $election->voting_end,
                'created_at' => $election->created_at,
                'status' => $this->getStatus($election),
                'positions_count' => $election->positions->count(),
                'candidates_count' => $candidatesCount,
                'voters_total' => $total,
                'voters_voted' => $voted,
                'turnout_percentage' => $total > 0 ? round(($voted / $total) * 100, 2) : 0,
                'has_results' => $voted > 0,
                'course' => $election->course ? [
                    'course_id' => $election->course->course_id,
                    'course_code' => $election->course->course_code,
                    'course_name' => $election->course->course_name,
                ] : null,
            ];
        });

        $avgTurnout = $electionData->count() > 0
            ? round($electionData->avg('turnout_percentage'), 2)
            : 0;

        return $this->successResponse([
            'year' => $year,
            'elections' => $electionData,
            'total_elections' => $electionData->count(),
            'total_voters' => $totalVoters,
            'total_votes_cast' => $totalVotesCast,
            'avg_turnout' => $avgTurnout,
        ]);
    }

    /**
     * Get yearly statistics for dashboard
     */
    public function getYearlyStats()
    {
        // ✅ Use year column
        $years = Election::select(DB::raw('DISTINCT year'))
            ->whereNotNull('year')
            ->orderBy('year', 'desc')
            ->get()
            ->pluck('year');

        // Fallback to created_at
        if ($years->isEmpty()) {
            $years = Election::select(DB::raw('YEAR(created_at) as year'))
                ->distinct()
                ->orderBy('year', 'desc')
                ->get()
                ->pluck('year');
        }

        $stats = [];
        foreach ($years as $year) {
            $elections = Election::where('year', $year)
                ->orWhereYear('created_at', $year)
                ->get();
                
            $totalVoters = 0;
            $totalVotesCast = 0;
            $csgCount = 0;
            $sboCount = 0;

            foreach ($elections as $election) {
                $voters = VoterRegistry::where('election_id', $election->election_id);
                $totalVoters += $voters->count();
                $totalVotesCast += $voters->where('has_voted', true)->count();

                if ($election->election_type === 'CSG') $csgCount++;
                else $sboCount++;
            }

            $stats[] = [
                'year' => $year,
                'elections_count' => $elections->count(),
                'total_voters' => $totalVoters,
                'total_votes_cast' => $totalVotesCast,
                'avg_turnout' => $totalVoters > 0 ? round(($totalVotesCast / $totalVoters) * 100, 2) : 0,
                'csg_count' => $csgCount,
                'sbo_count' => $sboCount,
            ];
        }

        return $this->successResponse($stats);
    }

    /**
     * Get detailed election record
     */
    public function getElectionDetail($electionId)
    {
        $election = Election::with(['positions', 'course'])
            ->findOrFail($electionId);

        // Get positions with candidates and votes
        $positions = Position::where('election_id', $electionId)
            ->with(['candidates' => function ($query) {
                $query->where('is_approved', true)
                    ->with(['user', 'partylist']);
            }])
            ->get()
            ->map(function ($position) {
                $candidates = $position->candidates->map(function ($candidate) use ($position) {
                    $votes = \App\Models\Vote::where('candidate_id', $candidate->candidate_id)->count();
                    return [
                        'candidate_id' => $candidate->candidate_id,
                        'user_id' => $candidate->user_id,
                        'first_name' => $candidate->user->first_name,
                        'last_name' => $candidate->user->last_name,
                        'student_id' => $candidate->user->student_id,
                        'partylist_name' => $candidate->partylist ? $candidate->partylist->name : null,
                        'votes' => $votes,
                        'winner' => false, // Will calculate later
                    ];
                });

                // Sort by votes descending and mark winner
                $sorted = $candidates->sortByDesc('votes')->values();
                if ($sorted->count() > 0) {
                    $sorted[0]['winner'] = true;
                }

                return [
                    'position_id' => $position->position_id,
                    'title' => $position->title,
                    'category' => $position->category,
                    'candidates' => $sorted,
                ];
            });

        // Get voters list
        $voters = VoterRegistry::where('election_id', $electionId)
            ->with('user')
            ->get()
            ->map(function ($registry) {
                return [
                    'voter_registry_id' => $registry->voter_registry_id,
                    'user_id' => $registry->user_id,
                    'first_name' => $registry->user->first_name,
                    'last_name' => $registry->user->last_name,
                    'student_id' => $registry->user->student_id,
                    'has_voted' => $registry->has_voted,
                    'voted_at' => $registry->voted_at,
                ];
            });

        // Get partylists with candidate count
        $partylists = Partylist::where('election_id', $electionId)
            ->withCount(['candidates' => function ($query) {
                $query->where('is_approved', true);
            }])
            ->get()
            ->map(function ($partylist) {
                return [
                    'partylist_id' => $partylist->partylist_id,
                    'name' => $partylist->name,
                    'description' => $partylist->description,
                    'logo_url' => $partylist->logo_url,
                    'candidates_count' => $partylist->candidates_count,
                ];
            });

        // Build timeline
        $timeline = [
            ['date' => $election->created_at->toDateString(), 'event' => 'Election Created', 'description' => 'Election was created by admin'],
            ['date' => $election->voting_start, 'event' => 'Voting Started', 'description' => 'Voting period began'],
            ['date' => $election->voting_end, 'event' => 'Voting Ended', 'description' => 'Voting period concluded'],
        ];

        // Check if results were generated (has any votes)
        $hasVotes = VoterRegistry::where('election_id', $electionId)
            ->where('has_voted', true)
            ->exists();

        if ($hasVotes) {
            $timeline[] = ['date' => now()->toDateString(), 'event' => 'Results Available', 'description' => 'Election results are available'];
        }

        return $this->successResponse([
            'election_id' => $election->election_id,
            'title' => $election->title,
            'election_type' => $election->election_type,
            'description' => $election->description,
            'voting_start' => $election->voting_start,
            'voting_end' => $election->voting_end,
            'created_at' => $election->created_at,
            'status' => $this->getStatus($election),
            'positions' => $positions,
            'voters_list' => $voters,
            'partylists' => $partylists,
            'timeline' => $timeline,
            'course' => $election->course ? [
                'course_id' => $election->course->course_id,
                'course_code' => $election->course->course_code,
                'course_name' => $election->course->course_name,
            ] : null,
        ]);
    }

    /**
     * Export year records
     */
    public function exportYearRecords(Request $request, $year)
    {
        $format = $request->get('format', 'csv');

        $records = $this->getYearRecords($year);
        $data = $records->getData()->data;

        if ($format === 'csv') {
            return $this->exportCSV($data, "election_records_{$year}");
        }

        return $this->exportPDF($data, "election_records_{$year}");
    }

    /**
     * Export single election
     */
    public function exportElection(Request $request, $electionId)
    {
        $format = $request->get('format', 'csv');

        $detail = $this->getElectionDetail($electionId);
        $data = $detail->getData()->data;

        if ($format === 'csv') {
            return $this->exportElectionCSV($data);
        }

        return $this->exportElectionPDF($data);
    }

    private function exportCSV($data, $filename)
    {
        $headers = ['Election ID', 'Title', 'Type', 'Status', 'Voters Total', 'Votes Cast', 'Turnout %'];

        $rows = collect($data->elections)->map(function ($election) {
            return [
                $election['election_id'],
                $election['title'],
                $election['election_type'],
                $election['status'],
                $election['voters_total'],
                $election['voters_voted'],
                $election['turnout_percentage'] . '%',
            ];
        });

        $csvContent = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csvContent .= implode(',', $row) . "\n";
        }

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}.csv",
        ]);
    }

    private function exportPDF($data, $filename)
    {
        $pdf = Pdf::loadView('pdf.election_records', ['data' => $data, 'year' => $data->year]);
        $pdf->setPaper('a4', 'landscape');

        return $pdf->download("{$filename}.pdf");
    }

    private function exportElectionCSV($data)
    {
        // Build CSV for election details
        $headers = ['Position', 'Candidate', 'Partylist', 'Votes', 'Winner'];

        $rows = [];
        foreach ($data->positions as $position) {
            foreach ($position->candidates as $candidate) {
                $rows[] = [
                    $position->title,
                    $candidate['first_name'] . ' ' . $candidate['last_name'],
                    $candidate['partylist_name'] ?? 'Independent',
                    $candidate['votes'],
                    $candidate['winner'] ? 'Yes' : 'No',
                ];
            }
        }

        $csvContent = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $csvContent .= implode(',', $row) . "\n";
        }

        // Add summary
        $csvContent .= "\n\nSummary\n";
        $csvContent .= "Title: {$data->title}\n";
        $csvContent .= "Type: {$data->election_type}\n";
        $csvContent .= "Status: {$data->status}\n";

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=election_{$data->election_id}_results.csv",
        ]);
    }

    private function exportElectionPDF($data)
    {
        $pdf = Pdf::loadView('pdf.election_results', ['data' => $data]);
        $pdf->setPaper('a4', 'landscape');

        return $pdf->download("election_{$data->election_id}_results.pdf");
    }

    private function getStatus($election)
    {
        $now = now();
        if ($now < $election->voting_start) return 'upcoming';
        if ($now > $election->voting_end) return 'ended';
        return 'ongoing';
    }
}