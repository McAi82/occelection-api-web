<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id('vote_id');
            
            $table->foreignId('voter_registry_id')
                ->constrained('voter_registries', 'voter_registry_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('candidate_id')
                ->constrained('candidates', 'candidate_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('position_id')
                ->constrained('positions', 'position_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->timestamp('timestamp')->useCurrent();
            $table->timestamps();
            
            // Unique constraint - one vote per voter per position
            $table->unique(['voter_registry_id', 'position_id'], 'uk_voter_position');
            
            // Indexes
            $table->index('timestamp');
            $table->index('candidate_id');
            $table->index('position_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};