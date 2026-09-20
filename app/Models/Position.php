<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $primaryKey = 'position_id';
    
    protected $fillable = [
        'election_id',
    'title',
    'position_type',
    'category',
    'order_in_ballot',
    'max_winners',
    'description',
    ];

    protected $casts = [
        'order_in_ballot' => 'integer',
        'max_winners' => 'integer',
    ];

    // Relationships
    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class, 'position_id', 'position_id');
    }

    public function votes()
    {
        return $this->hasMany(Vote::class, 'position_id', 'position_id');
    }
}