<?php
// app/Models/CampaignScheduleRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampaignScheduleRequest extends Model
{
    protected $primaryKey = 'request_id';
    
    protected $table = 'campaign_schedule_requests';
    
    protected $fillable = [
        'candidate_id',
        'election_id',
        'section_id',
        'preferred_date',
        'preferred_start_time',
        'preferred_end_time',
        'message',
        'status',
        'admin_remarks',
        'processed_by_user_id',
        'processed_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'preferred_start_time' => 'string', // ✅ Store as string
        'preferred_end_time' => 'string',   // ✅ Store as string
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function candidate()
    {
        return $this->belongsTo(Candidate::class, 'candidate_id', 'candidate_id');
    }

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id', 'section_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by_user_id', 'user_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeForElection($query, $electionId)
    {
        return $query->where('election_id', $electionId);
    }
}