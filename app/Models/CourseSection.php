<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseSection extends Model
{
    use HasFactory;

    protected $primaryKey = 'section_id';
    
    protected $fillable = [
        'course_id',
        'section_code',
        'section_name',
        'year_level',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function campaignSchedules()
    {
        return $this->hasMany(CampaignSchedule::class, 'section_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'section_id');
    }
}