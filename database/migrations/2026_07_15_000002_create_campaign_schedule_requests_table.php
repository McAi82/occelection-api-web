<?php
// database/migrations/2026_07_15_000002_create_campaign_schedule_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_schedule_requests', function (Blueprint $table) {
            $table->id('request_id');
            
            $table->foreignId('candidate_id')
                ->constrained('candidates', 'candidate_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('section_id')
                ->constrained('course_sections', 'section_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // ✅ Use date and time types separately
            $table->date('preferred_date');
            $table->time('preferred_start_time');
            $table->time('preferred_end_time');
            $table->text('message')->nullable();
            
            $table->enum('status', ['pending', 'approved', 'rejected', 'rescheduled'])->default('pending');
            $table->text('admin_remarks')->nullable();
            
            $table->foreignId('processed_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('candidate_id');
            $table->index('election_id');
            $table->index('section_id');
            $table->index('status');
            $table->index('preferred_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_schedule_requests');
    }
};