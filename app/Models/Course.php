<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $primaryKey = 'course_id';
    
    protected $fillable = [
        'course_code',
        'course_name',
        'department',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'course_id');
    }

    public function sections()
    {
        return $this->hasMany(CourseSection::class, 'course_id');
    }

    public function elections()
    {
        return $this->hasMany(Election::class, 'course_id');
    }
}