<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ar_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ar_measurement_session_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->string('object_type', 50);
            $table->string('model_id', 150)->nullable();
            $table->string('label', 150);
            $table->json('segments_cm');
            $table->decimal('width_cm', 10, 2);
            $table->decimal('height_cm', 10, 2);
            $table->decimal('depth_cm', 10, 2)->nullable();
            $table->string('confidence', 20);
            $table->unsignedSmallInteger('points_count')->nullable();
            $table->json('metadata')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(
                ['ar_measurement_session_id', 'sort_order'],
                'ar_measurements_session_sort_unique'
            );
            $table->index(['object_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ar_measurements');
    }
};
