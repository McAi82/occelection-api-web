<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->string('email', 100)->unique();
            $table->string('password_hash');
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('student_id', 20)->unique()->nullable();
            
            // Foreign keys with proper naming and ON DELETE actions
            $table->foreignId('course_id')
                ->nullable()
                ->constrained('courses', 'course_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->foreignId('section_id')
                ->nullable()
                ->constrained('course_sections', 'section_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Removed year_level - derived from section or stored separately
            // We'll keep it for now but it should ideally be derived
            $table->integer('year_level')->nullable();
            
            $table->text('face_reference_photo')->nullable();
            $table->json('face_encoding')->nullable();
            $table->boolean('is_face_registered')->default(false);
            $table->enum('role', ['admin', 'comelec', 'candidate', 'voter'])->default('voter');
            $table->boolean('is_active')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            // Indexes
            $table->index('email');
            $table->index('role');
            $table->index('student_id');
            $table->index('course_id');
            $table->index('section_id');
            $table->index('year_level');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};