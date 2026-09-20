<?php
// database/migrations/2026_04_14_075426_create_feedback_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id('feedback_id');

            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreignId('election_id')
                ->constrained('elections', 'election_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreignId('category_id')
                ->nullable()
                ->constrained('feedback_categories', 'category_id')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->integer('rating')->unsigned();
            $table->string('title', 255)->nullable();
            $table->text('comment');
            $table->boolean('is_public')->default(true); // ✅ Default true
            $table->boolean('is_anonymous')->default(false);
            $table->text('admin_response')->nullable();

            $table->foreignId('responded_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');

            $table->timestamp('responded_at')->nullable();
            $table->integer('helpful_count')->default(0);
            $table->timestamps();

            // ✅ Add indexes for performance
            $table->index('rating');
            $table->index('is_public');
            $table->index('created_at');
            $table->index('election_id');
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
