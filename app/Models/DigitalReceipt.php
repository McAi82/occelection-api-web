<?php
// app/Models/DigitalReceipt.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DigitalReceipt extends Model
{
    protected $primaryKey = 'receipt_id';
    
    protected $fillable = [
        'voter_registry_id',
        'receipt_code',
        'sent_to_email',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function voterRegistry()
    {
        return $this->belongsTo(VoterRegistry::class, 'voter_registry_id', 'voter_registry_id');
    }
}