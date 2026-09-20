<?php
// app/Models/CampaignSchedule.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CampaignSchedule extends Model
{
    protected $primaryKey = 'schedule_id';
    
    protected $fillable = [
        'election_id',
        'section_id',
        'start_time',
        'end_time',
        'candidate_id',
        'notes',
        'status',
        'created_by_user_id',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id', 'section_id');
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class, 'candidate_id', 'candidate_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id', 'user_id');
    }
}