<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_helpful_votes', function (Blueprint $table) {
            $table->id('vote_id');
            
            $table->foreignId('feedback_id')
                ->constrained('feedback', 'feedback_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['feedback_id', 'user_id'], 'uk_user_feedback');
            
            $table->index('feedback_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_helpful_votes');
    }
};