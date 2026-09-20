<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id('position_id');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->string('title', 100);
            $table->enum('position_type', ['executive', 'secretary', 'senator', 'governor', 'finance', 'other'])->default('other');
            $table->string('category', 50);
            $table->integer('order_in_ballot');
            $table->integer('max_winners')->default(1);
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['election_id', 'title'], 'uk_election_position');
            
            // Indexes
            $table->index('category');
            $table->index('order_in_ballot');
            $table->index('position_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};