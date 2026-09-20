<?php
// database/migrations/2026_07_01_081812_create_candidacy_applications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidacy_applications', function (Blueprint $table) {
            $table->id('application_id');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Form data stored as JSON
            $table->json('form_data');

            $table->foreignId('selected_partylist_id')->nullable()->constrained('partylists', 'partylist_id')->onDelete('set null');
            
            // ✅ Only admin status (removed comelec_status)
            $table->enum('admin_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('admin_approved_at')->nullable();
            
            $table->foreignId('admin_approved_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            // Recommendation letter
            $table->string('recommendation_letter_path')->nullable();
            $table->boolean('letter_generated')->default(false);
            
            $table->text('admin_remarks')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['election_id', 'admin_status']);
            $table->unique(['user_id', 'election_id'], 'uk_user_election_application');
            $table->index('user_id');
            $table->index('election_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidacy_applications');
    }
};