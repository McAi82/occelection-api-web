<?php
// app/Models/PartylistMembership.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartylistMembership extends Model
{
    protected $primaryKey = 'membership_id';
    
    protected $table = 'partylist_memberships';
    
    protected $fillable = [
        'partylist_id',
        'candidate_id',
        'status',
        'approved_at',
        'approved_by_user_id',
        'is_active',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function partylist()
    {
        return $this->belongsTo(Partylist::class, 'partylist_id', 'partylist_id');
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class, 'candidate_id', 'candidate_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id', 'user_id');
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

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}