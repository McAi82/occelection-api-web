<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partylists', function (Blueprint $table) {
            $table->id('partylist_id');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->string('name', 100);
            $table->text('logo_url')->nullable();
            $table->text('description')->nullable();
            $table->text('platform')->nullable();
            
            $table->foreignId('created_by_user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('approved_by_user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['election_id', 'name'], 'uk_election_partylist');
            
            // Indexes
            $table->index('name');
            $table->index('created_by_user_id');
            $table->index('approved_by_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partylists');
    }
};