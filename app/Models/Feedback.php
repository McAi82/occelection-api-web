<?php
// app/Models/Feedback.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $primaryKey = 'feedback_id';

    protected $fillable = [
        'user_id',
        'election_id',
        'category_id',
        'rating',
        'title',
        'comment',
        'is_public',
        'is_anonymous',
        'admin_response',
        'responded_by',
        'responded_at',
        'helpful_count',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_anonymous' => 'boolean',
        'responded_at' => 'datetime',
        'rating' => 'integer',
        'helpful_count' => 'integer',
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

    public function category()
    {
        return $this->belongsTo(FeedbackCategory::class, 'category_id', 'category_id');
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by', 'user_id');
    }

    public function helpfulVotes()
    {
        return $this->hasMany(FeedbackHelpfulVote::class, 'feedback_id', 'feedback_id');
    }

    // ✅ Check if user has already submitted feedback for an election
    public static function hasSubmitted($userId, $electionId): bool
    {
        return self::where('user_id', $userId)
            ->where('election_id', $electionId)
            ->exists();
    }

    // ✅ Get user's feedback for an election
    public static function getUserFeedback($userId, $electionId): ?self
    {
        return self::where('user_id', $userId)
            ->where('election_id', $electionId)
            ->first();
    }

    // Accessor for display name (handles anonymous)
    public function getDisplayNameAttribute()
    {
        if ($this->is_anonymous) {
            return 'Anonymous User';
        }
        return $this->user ? $this->user->full_name : 'Deleted User';
    }

    // ✅ Scope for public feedback
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}
