<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostReaction extends Model
{
    use HasFactory;

    protected $primaryKey = 'reaction_id';

    protected $fillable = [
        'post_id',
        'user_id',
        'type',
    ];

    // Relationships
    public function post()
    {
        return $this->belongsTo(CampaignPost::class, 'post_id', 'post_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
