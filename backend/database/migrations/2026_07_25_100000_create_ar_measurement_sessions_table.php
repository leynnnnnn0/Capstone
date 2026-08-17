<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ar_measurement_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference')->unique();
            $table->foreignId('appointment_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('source', 30);
            $table->string('status', 30)->default('submitted');
            $table->string('capture_version', 10);
            $table->string('capture_mode', 50);
            $table->string('overall_confidence', 20);
            $table->json('device_metadata')->nullable();
            $table->timestamp('captured_at');
            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();

            $table->index(['appointment_id', 'captured_at']);
            $table->index(['customer_id', 'captured_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ar_measurement_sessions');
    }
};
