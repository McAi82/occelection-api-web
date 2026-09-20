<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_posts', function (Blueprint $table) {
            $table->id('post_id');
            
            // ✅ Make candidate_id nullable for admin/system posts
            $table->foreignId('candidate_id')
                ->nullable()
                ->constrained('candidates', 'candidate_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->text('content');
            $table->string('type')->default('survey');
            $table->string('title')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('views')->default(0);
            $table->timestamps();
            
            // Indexes
            $table->index('candidate_id');
            $table->index('election_id');
            $table->index('type');
            $table->index('is_pinned');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_posts');
    }
};