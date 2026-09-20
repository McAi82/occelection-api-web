<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('digital_receipts', function (Blueprint $table) {
            $table->id('receipt_id');
            
            $table->foreignId('voter_registry_id')
                ->constrained('voter_registries', 'voter_registry_id')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->string('receipt_code', 64)->unique();
            $table->string('sent_to_email', 100);
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();
            
            // Indexes
            $table->index('receipt_code');
            $table->index('sent_to_email');
            $table->index('generated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('digital_receipts');
    }
};