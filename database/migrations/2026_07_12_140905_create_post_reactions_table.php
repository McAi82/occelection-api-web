<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_reactions', function (Blueprint $table) {
            $table->id('reaction_id');

            $table->foreignId('post_id')
                ->constrained('campaign_posts', 'post_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->enum('type', ['like', 'heart', 'laugh', 'wow', 'sad', 'angry', 'insightful', 'helpful'])->default('like');
            $table->timestamps();

            $table->unique(['post_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_reactions');
    }
};
