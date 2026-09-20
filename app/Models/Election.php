<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Election extends Model
{
    use HasFactory;

    protected $primaryKey = 'election_id';

    protected $fillable = [
        'title',
        'election_type',
        'year',
        'description',
        'voting_start',
        'voting_end',
        'is_active',
        'created_by_user_id', 
        'course_id',
    ];

    protected $casts = [
        'voting_start' => 'datetime',
        'voting_end' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function positions()
    {
        return $this->hasMany(Position::class, 'election_id', 'election_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id', 'course_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id', 'user_id');
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class, 'election_id', 'election_id');
    }

    public function partylists()
    {
        return $this->hasMany(Partylist::class, 'election_id', 'election_id');
    }

    public function voterRegistries()
    {
        return $this->hasMany(VoterRegistry::class, 'election_id', 'election_id');
    }

    public function votes()
    {
        return $this->hasMany(Vote::class, 'election_id', 'election_id');
    }

    // Helper methods
    public function isOngoing()
    {
        $now = now();
        return $now >= $this->voting_start && $now <= $this->voting_end;
    }

    public function isFinished()
    {
        return now() > $this->voting_end;
    }

    public function isUpcoming()
    {
        return now() < $this->voting_start;
    }
    public function getYearAttribute()
    {
        return $this->attributes['year'] ?? Carbon::parse($this->voting_start)->year;
    }
}