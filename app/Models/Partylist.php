<?php
// app/Models/Partylist.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partylist extends Model
{
    protected $primaryKey = 'partylist_id';
    
    protected $table = 'partylists';
    
    protected $fillable = [
        'election_id',
        'name',
        'description',
        'logo_url',
        'created_by_user_id',
        'approved_by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id', 'user_id');
    }

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function memberships()
    {
        return $this->hasMany(PartylistMembership::class, 'partylist_id', 'partylist_id');
    }

    public function activeMemberships()
    {
        return $this->memberships()
            ->where('status', 'approved')
            ->where('is_active', true);
    }

    public function candidates()
    {
        return $this->hasManyThrough(
            Candidate::class,
            PartylistMembership::class,
            'partylist_id',
            'candidate_id',
            'partylist_id',
            'candidate_id'
        );
    }
}