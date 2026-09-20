<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoterRegistry extends Model
{
    use HasFactory;

    protected $primaryKey = 'voter_registry_id';
    
    protected $fillable = [
        'election_id',
        'user_id',
        'has_voted',
        'voted_at',
        'sanction_eligible',
    ];

    protected $casts = [
        'has_voted' => 'boolean',
        'sanction_eligible' => 'boolean',
        'voted_at' => 'datetime',
    ];

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function votes()
    {
        return $this->hasMany(Vote::class, 'voter_registry_id', 'voter_registry_id');
    }

    public function digitalReceipt()
    {
        return $this->hasOne(DigitalReceipt::class, 'voter_registry_id', 'voter_registry_id');
    }
}