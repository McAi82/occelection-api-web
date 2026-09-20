<?php
// app/Models/FeedbackCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackCategory extends Model
{
    use HasFactory;

    protected $primaryKey = 'category_id';
    
    protected $fillable = [
        'category_name',
        'description',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function feedback()
    {
        return $this->hasMany(Feedback::class, 'category_id', 'category_id');
    }
}