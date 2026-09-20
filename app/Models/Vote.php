<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    protected $primaryKey = 'vote_id';
    
    protected $fillable = [
        'voter_registry_id',
        'candidate_id',
        'position_id',
        'election_id',
        'timestamp',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public $timestamps = false;

    public function voterRegistry()
{
    return $this->belongsTo(VoterRegistry::class, 'voter_registry_id', 'voter_registry_id');
}

public function candidate()
{
    return $this->belongsTo(Candidate::class, 'candidate_id', 'candidate_id');
}

public function position()
{
    return $this->belongsTo(Position::class, 'position_id', 'position_id');
}

public function election()
{
    return $this->belongsTo(Election::class, 'election_id', 'election_id');
}
}