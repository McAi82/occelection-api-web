<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CampaignPost extends Model
{
    use HasFactory;

    protected $primaryKey = 'post_id';

    protected $fillable = [
        'candidate_id',
        'election_id',
        'content',
        'type',
        'title',
        'is_pinned',
        'is_active',
        'views',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_active' => 'boolean',
        'views' => 'integer',
    ];

    // Relationships
    public function candidate()
    {
        return $this->belongsTo(Candidate::class, 'candidate_id', 'candidate_id');
    }

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function comments()
    {
        return $this->hasMany(PostComment::class, 'post_id', 'post_id')
            ->where('is_visible', true)
            ->orderBy('created_at', 'desc');
    }

    public function allComments()
    {
        return $this->hasMany(PostComment::class, 'post_id', 'post_id');
    }

    public function reactions()
    {
        return $this->hasMany(PostReaction::class, 'post_id', 'post_id');
    }

    public function likes()
    {
        return $this->hasMany(PostReaction::class, 'post_id', 'post_id')
            ->where('type', 'like');
    }

    public function insightful()
    {
        return $this->hasMany(PostReaction::class, 'post_id', 'post_id')
            ->where('type', 'insightful');
    }

    public function helpful()
    {
        return $this->hasMany(PostReaction::class, 'post_id', 'post_id')
            ->where('type', 'helpful');
    }

    public function userReaction($userId)
    {
        return $this->hasOne(PostReaction::class, 'post_id', 'post_id')
            ->where('user_id', $userId);
    }

    // Helper methods
    public function getCommentCountAttribute()
    {
        return $this->comments()->count();
    }

    public function getReactionCountAttribute()
    {
        return $this->reactions()->count();
    }

    public function getLikeCountAttribute()
    {
        return $this->likes()->count();
    }
}