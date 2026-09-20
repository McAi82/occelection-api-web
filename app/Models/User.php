<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'user_id';
    
    protected $fillable = [
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'student_id',
        'course_id',
        'section_id',
        'year_level',
        'face_reference_photo',
        'is_face_registered',
        'role',
        'is_active',
        'email_verified_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_face_registered' => 'boolean',
        'is_active' => 'boolean',
        'course_id' => 'integer',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Relationships
    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function section()
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function candidates()
    {
        return $this->hasMany(Candidate::class, 'user_id');
    }

    public function voterRegistries()
    {
        return $this->hasMany(VoterRegistry::class, 'user_id');
    }
}