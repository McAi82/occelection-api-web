<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    use HasFactory;

    protected $primaryKey = 'candidate_id';

    protected $fillable = [
        'user_id',
        'election_id',
        'position_id',
        'platform',
        'qualifications',
        'photo_url',
        'is_approved',
        'approved_by_user_id',
        'approved_at',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function position()
    {
        return $this->belongsTo(Position::class, 'position_id', 'position_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id', 'user_id');
    }

    // ✅ Relationship to partylist through memberships
    public function memberships()
    {
        return $this->hasMany(PartylistMembership::class, 'candidate_id', 'candidate_id');
    }

    // ✅ Get active membership (approved and active)
    public function activeMembership()
    {
        return $this->hasOne(PartylistMembership::class, 'candidate_id', 'candidate_id')
            ->where('status', 'approved')
            ->where('is_active', true);
    }

    public function partylist()
    {
        return $this->hasOneThrough(
            Partylist::class,
            PartylistMembership::class,
            'candidate_id',  // Foreign key on partylist_memberships
            'partylist_id',   // Foreign key on partylists
            'candidate_id',   // Local key on candidates
            'partylist_id'    // Local key on partylist_memberships
        )->where('partylist_memberships.status', 'approved')
         ->where('partylist_memberships.is_active', true);
    }

    // Helper to get active partylist name
    public function getPartylistNameAttribute()
    {
        return $this->partylist?->name ?? 'Independent';
    }

    // Helper to check if candidate has a partylist
    public function hasPartylist()
    {
        return $this->partylist()->exists();
    }

    // Votes relationship
    public function votes()
    {
        return $this->hasMany(Vote::class, 'candidate_id', 'candidate_id');
    }

    // Get vote count
    public function getVoteCountAttribute()
    {
        return $this->votes()->count();
    }
}