<?php

namespace App\Http\Controllers\Api\Web\Campaign;

use App\Http\Controllers\Controller;
use App\Models\CampaignSchedule;
use App\Models\CourseSection;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class CampaignScheduleController extends Controller
{
    public function index(Request $request, $electionId)
    {
        $perPage = $request->get('per_page', 20);
        $page = $request->get('page', 1);
        
        $schedules = CampaignSchedule::where('election_id', $electionId)
            ->with(['candidate.user', 'candidate.position', 'section.course'])
            ->orderBy('start_time')
            ->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function getByCourse($electionId, $courseSection)
    {
        $schedules = CampaignSchedule::where('election_id', $electionId)
            ->where('course_section', $courseSection)
            ->with(['candidate.user', 'candidate.position'])
            ->orderBy('start_time')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function getCandidateSchedules($candidateId)
    {
        $schedules = CampaignSchedule::where('candidate_id', $candidateId)
            ->with('election')
            ->orderBy('start_time')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function store(Request $request, $electionId)
{
    $validator = Validator::make($request->all(), [
        'section_id' => 'required|exists:course_sections,section_id',
        'start_time' => 'required|date|after:now',
        'end_time' => 'required|date|after:start_time',
        'candidate_id' => 'nullable|exists:candidates,candidate_id',
        'notes' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // ✅ Parse and keep the time as-is
    $startTime = Carbon::parse($request->start_time)->setTimezone('Asia/Manila');
    $endTime = Carbon::parse($request->end_time)->setTimezone('Asia/Manila');

    // Check for overlapping schedules for the same section
    $overlap = CampaignSchedule::where('election_id', $electionId)
        ->where('section_id', $request->section_id)
        ->where(function($q) use ($startTime, $endTime) {
            $q->whereBetween('start_time', [
                $startTime->format('Y-m-d H:i:s'), 
                $endTime->format('Y-m-d H:i:s')
            ])
              ->orWhereBetween('end_time', [
                $startTime->format('Y-m-d H:i:s'), 
                $endTime->format('Y-m-d H:i:s')
              ]);
        })
        ->exists();

    if ($overlap) {
        return response()->json([
            'success' => false,
            'message' => 'Schedule overlaps with an existing schedule for this section'
        ], 422);
    }

    $userId = $request->user()->user_id;

    $schedule = CampaignSchedule::create([
        'election_id' => $electionId,
        'section_id' => $request->section_id,
        'start_time' => $startTime->format('Y-m-d H:i:s'),
        'end_time' => $endTime->format('Y-m-d H:i:s'),
        'candidate_id' => $request->candidate_id,
        'notes' => $request->notes,
        'status' => 'pending',
        'created_by_user_id' => $userId,
    ]);

    AuditLog::create([
        'user_id' => $userId,
        'action_type' => 'CREATE_CAMPAIGN_SCHEDULE',
        'target_table' => 'campaign_schedules',
        'target_id' => $schedule->schedule_id,
        'new_value' => json_encode($schedule->toArray()),
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Campaign schedule created successfully',
        'data' => $schedule->load(['candidate.user', 'section.course'])
    ], 201);
}

    public function update(Request $request, $id)
    {
        $schedule = CampaignSchedule::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'section_id' => 'sometimes|exists:course_sections,section_id',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'candidate_id' => 'nullable|exists:candidates,candidate_id',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:pending,ongoing,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldData = $schedule->toArray();
        
        $updateData = $request->only(['section_id', 'start_time', 'end_time', 'candidate_id', 'notes', 'status']);
        $schedule->update($updateData);

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'UPDATE_CAMPAIGN_SCHEDULE',
            'target_table' => 'campaign_schedules',
            'target_id' => $schedule->schedule_id,
            'old_value' => json_encode($oldData),
            'new_value' => json_encode($schedule->toArray()),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign schedule updated successfully',
            'data' => $schedule->load(['candidate.user', 'section.course'])
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $schedule = CampaignSchedule::findOrFail($id);
        $schedule->delete();

        AuditLog::create([
            'user_id' => $request->user()->user_id,
            'action_type' => 'DELETE_CAMPAIGN_SCHEDULE',
            'target_table' => 'campaign_schedules',
            'target_id' => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign schedule deleted successfully'
        ]);
    }

    public function bulkStore(Request $request, $electionId)
{
    $validator = Validator::make($request->all(), [
        'schedules' => 'required|array',
        'schedules.*.section_id' => 'required|exists:course_sections,section_id',
        'schedules.*.start_time' => 'required|date|after:now',
        'schedules.*.end_time' => 'required|date|after:start_time',
        'schedules.*.candidate_id' => 'nullable|exists:candidates,candidate_id',
        'schedules.*.notes' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $userId = $request->user()->user_id;
    $created = [];
    $errors = [];

    foreach ($request->schedules as $scheduleData) {
        // ✅ Convert to UTC properly
        $startTime = Carbon::parse($scheduleData['start_time'])->utc();
        $endTime = Carbon::parse($scheduleData['end_time'])->utc();

        $overlap = CampaignSchedule::where('election_id', $electionId)
            ->where('section_id', $scheduleData['section_id'])
            ->where(function($q) use ($startTime, $endTime) {
                $q->whereBetween('start_time', [$startTime, $endTime])
                  ->orWhereBetween('end_time', [$startTime, $endTime]);
            })
            ->exists();

        if ($overlap) {
            $errors[] = [
                'section_id' => $scheduleData['section_id'],
                'message' => 'Schedule overlaps with existing schedule'
            ];
            continue;
        }

        $schedule = CampaignSchedule::create([
            'election_id' => $electionId,
            'section_id' => $scheduleData['section_id'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'candidate_id' => $scheduleData['candidate_id'] ?? null,
            'notes' => $scheduleData['notes'] ?? null,
            'status' => 'pending',
            'created_by_user_id' => $userId,
        ]);
        $created[] = $schedule;
    }

    AuditLog::create([
        'user_id' => $userId,
        'action_type' => 'BULK_CREATE_CAMPAIGN_SCHEDULES',
        'target_table' => 'campaign_schedules',
        'new_value' => json_encode(['count' => count($created)]),
        'ip_address' => $request->ip(),
    ]);

    return response()->json([
        'success' => true,
        'message' => count($created) . ' schedules created successfully',
        'data' => $created,
        'errors' => $errors
    ], 201);
}

    public function getSections(Request $request)
    {
        $query = CourseSection::with('course')->where('is_active', true);
        
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        
        if ($request->has('year_level')) {
            $query->where('year_level', $request->year_level);
        }
        
        $sections = $query->orderBy('course_id')
            ->orderBy('year_level')
            ->orderBy('section_code')
            ->get()
            ->map(function($section) {
                return [
                    'section_id' => $section->section_id,
                    'name' => $section->course->course_code . ' - Year ' . $section->year_level . ' Section ' . $section->section_code,
                    'course_code' => $section->course->course_code,
                    'year_level' => $section->year_level,
                    'section_code' => $section->section_code,
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $sections
        ]);
    }
}