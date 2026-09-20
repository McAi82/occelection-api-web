<?php
// database/migrations/2026_07_13_000000_create_partylist_memberships_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if partylists table exists, if not create it
        if (!Schema::hasTable('partylists')) {
            Schema::create('partylists', function (Blueprint $table) {
                $table->id('partylist_id');
                $table->foreignId('election_id')->constrained('elections', 'election_id')->onDelete('cascade');
                $table->string('name', 100);
                $table->text('description')->nullable();
                $table->text('logo_url')->nullable();
                $table->foreignId('created_by_user_id')->constrained('users', 'user_id')->onDelete('cascade');
                $table->foreignId('approved_by_user_id')->constrained('users', 'user_id')->onDelete('cascade');
                $table->timestamps();
                
                $table->unique(['election_id', 'name']);
                $table->index('created_by_user_id');
                $table->index('approved_by_user_id');
            });
        }

        // Create partylist_memberships table
        if (!Schema::hasTable('partylist_memberships')) {
            Schema::create('partylist_memberships', function (Blueprint $table) {
                $table->id('membership_id');
                $table->foreignId('partylist_id')->constrained('partylists', 'partylist_id')->onDelete('cascade');
                $table->foreignId('candidate_id')->constrained('candidates', 'candidate_id')->onDelete('cascade');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('approved_by_user_id')->nullable()->constrained('users', 'user_id')->onDelete('set null');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                
                $table->unique(['partylist_id', 'candidate_id']);
                $table->index('partylist_id');
                $table->index('candidate_id');
                $table->index('status');
                $table->index('is_active');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('partylist_memberships');
        Schema::dropIfExists('partylists');
    }
};