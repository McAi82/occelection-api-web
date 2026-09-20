<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_comments', function (Blueprint $table) {
            $table->id('comment_id');
            
            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->text('comment_text');
            $table->boolean('is_visible')->default(true);
            
            $table->foreignId('moderated_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamp('moderated_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('is_visible');
            $table->index('created_at');
            $table->index('election_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_comments');
    }
};