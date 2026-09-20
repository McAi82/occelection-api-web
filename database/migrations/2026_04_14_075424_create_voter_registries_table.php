<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voter_registries', function (Blueprint $table) {
            $table->id('voter_registry_id');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->boolean('has_voted')->default(false);
            $table->timestamp('voted_at')->nullable();
            $table->boolean('sanction_eligible')->default(false);
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['election_id', 'user_id'], 'uk_election_voter');
            
            // Indexes
            $table->index('has_voted');
            $table->index('sanction_eligible');
            $table->index('voted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voter_registries');
    }
};