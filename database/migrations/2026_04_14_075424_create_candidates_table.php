<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id('candidate_id');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('position_id')
                ->constrained('positions', 'position_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->text('platform');
            $table->text('qualifications');
            $table->text('photo_url')->nullable();
            $table->boolean('is_approved')->default(false);
            
            $table->foreignId('approved_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['user_id', 'election_id'], 'uk_user_election');
            
            // Indexes
            $table->index('is_approved');
            $table->index('position_id');
            $table->index('approved_by_user_id');
            $table->index('election_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};