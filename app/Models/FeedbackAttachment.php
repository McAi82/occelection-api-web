<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackAttachment extends Model
{
    protected $table = 'feedback_attachments';
    protected $primaryKey = 'attachment_id';

    protected $fillable = ['feedback_id', 'file_url', 'file_type', 'file_size'];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class, 'feedback_id', 'feedback_id');
    }
}