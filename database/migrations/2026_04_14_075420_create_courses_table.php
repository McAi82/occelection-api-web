<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id('course_id');
            $table->string('course_code', 20)->unique();
            $table->string('course_name', 100);
            $table->string('department', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes
            $table->index('course_code');
            $table->index('department');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};