<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackHelpfulVote extends Model
{
    use HasFactory;

    protected $primaryKey = 'vote_id';
    
    protected $fillable = [
        'feedback_id',
        'user_id',
    ];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class, 'feedback_id', 'feedback_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}