<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_sections', function (Blueprint $table) {
            $table->id('section_id');
            $table->foreignId('course_id')
                ->constrained('courses', 'course_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->string('section_code', 10);
            $table->string('section_name', 50);
            $table->integer('year_level')->unsigned();
            $table->integer('capacity')->default(60);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['course_id', 'section_code', 'year_level'], 'uk_course_section_year');
            
            // Indexes
            $table->index(['course_id', 'year_level']);
            $table->index('section_code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_sections');
    }
};