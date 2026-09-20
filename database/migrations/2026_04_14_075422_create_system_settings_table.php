<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id('setting_id');
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value')->nullable();
            $table->enum('setting_type', ['string', 'integer', 'boolean', 'json', 'array'])->default('string');
            $table->text('description')->nullable();
            
            $table->foreignId('updated_by_user_id')
                ->nullable()
                ->constrained('users', 'user_id')
                ->onDelete('set null')
                ->onUpdate('cascade');
            
            $table->timestamps();
            
            $table->index('setting_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};