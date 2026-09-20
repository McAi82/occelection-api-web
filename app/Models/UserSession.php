<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSession extends Model
{
    protected $table = 'user_sessions';
    protected $primaryKey = 'session_id';

    protected $fillable = [
        'user_id', 'session_token', 'ip_address', 'user_agent',
        'device_type', 'login_time', 'logout_time', 'is_active'
    ];

    protected $casts = [
        'login_time' => 'datetime',
        'logout_time' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}