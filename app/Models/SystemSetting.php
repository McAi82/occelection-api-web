<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    protected $primaryKey = 'setting_id';

    protected $fillable = ['setting_key', 'setting_value', 'setting_type', 'description', 'updated_by'];

    protected $casts = [
        'setting_value' => 'json',
    ];
}