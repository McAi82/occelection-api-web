<?php
// app/Models/LiveComment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveComment extends Model
{
    protected $primaryKey = 'comment_id';
    
    protected $fillable = [
        'election_id',
        'user_id',
        'comment_text',
        'is_visible',
        'moderated_by_user_id',
        'moderated_at',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
        'moderated_at' => 'datetime',
    ];

    public function election()
    {
        return $this->belongsTo(Election::class, 'election_id', 'election_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by_user_id', 'user_id');
    }

    // Scopes
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeHidden($query)
    {
        return $query->where('is_visible', false);
    }
}