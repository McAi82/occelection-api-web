<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('section_id')
                ->constrained('course_sections', 'section_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->datetime('start_time');
            $table->datetime('end_time');
            
            $table->foreignId('candidate_id')
                ->nullable()
                ->constrained('candidates', 'candidate_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'ongoing', 'completed', 'cancelled'])->default('pending');
            
            $table->foreignId('created_by_user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['section_id', 'start_time'], 'uk_section_schedule');
            
            // Indexes
            $table->index('section_id');
            $table->index(['start_time', 'end_time']);
            $table->index('status');
            $table->index('candidate_id');
            $table->index('created_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_schedules');
    }
};