<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_comments', function (Blueprint $table) {
            $table->id('comment_id');
            
            $table->foreignId('post_id')
                ->constrained('campaign_posts', 'post_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->text('content');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index('post_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_comments');
    }
};