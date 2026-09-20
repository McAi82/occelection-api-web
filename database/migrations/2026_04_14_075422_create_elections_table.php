<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('elections', function (Blueprint $table) {
            $table->id('election_id');
            $table->string('title', 100);
            $table->enum('election_type', ['CSG', 'SBO'])->default('CSG');
            $table->integer('year')->nullable();
            $table->text('description')->nullable();
            $table->datetime('voting_start');
            $table->datetime('voting_end');
            $table->boolean('is_active')->default(false);
            
            // Foreign keys with consistent naming
            $table->foreignId('created_by_user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('course_id')
                ->nullable()
                ->constrained('courses', 'course_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamps();
            
            // Indexes
            $table->index('is_active');
            $table->index('election_type');
            $table->index(['voting_start', 'voting_end']);
            $table->index('created_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('elections');
    }
};