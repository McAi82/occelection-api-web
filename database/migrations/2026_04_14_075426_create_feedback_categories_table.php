<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_categories', function (Blueprint $table) {
            $table->id('category_id');
            $table->string('category_name', 50)->unique();
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('display_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_categories');
    }
};