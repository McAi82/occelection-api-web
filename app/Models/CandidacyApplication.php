<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidacyApplication extends Model
{
    use HasFactory;

    protected $primaryKey = 'application_id';

    protected $fillable = [
        'user_id',
        'election_id',
        'form_data',
        'selected_partylist_id',
        'admin_status',
        'admin_approved_at',
        'admin_approved_by_user_id',
        'admin_remarks',
        'recommendation_letter_path',
        'letter_generated',
    ];

    protected $casts = [
        'form_data' => 'array',
        'admin_approved_at' => 'datetime',
        'letter_generated' => 'boolean',
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

    public function adminApprovedBy()
    {
        return $this->belongsTo(User::class, 'admin_approved_by_user_id', 'user_id');
    }
public function selectedPartylist()
    {
        return $this->belongsTo(Partylist::class, 'selected_partylist_id', 'partylist_id');
    }
    // Scopes
    public function scopeAdminPending($query)
    {
        return $query->where('admin_status', 'pending');
        }
}