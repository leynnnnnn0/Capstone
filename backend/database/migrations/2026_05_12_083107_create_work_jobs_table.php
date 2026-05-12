<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('work_job_number')->nullable()->unique();

            // ── Origin ────────────────────────────────────────────────────────
            // Nullable so a work job can be created independently of an appointment
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();

            // Reuse the existing quotation (nullable — estimate may come later)
            $table->foreignId('quotation_id')->nullable()->constrained()->nullOnDelete();

            // ── Customer info (denormalized for standalone work jobs) ──────────
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone_number');
            $table->string('email')->nullable();

            // ── Location ──────────────────────────────────────────────────────
            $table->text('address')->nullable();
            $table->string('address_pinned')->nullable();
            $table->decimal('address_lat', 10, 7)->nullable();
            $table->decimal('address_lng', 10, 7)->nullable();

            // ── Service ───────────────────────────────────────────────────────
            $table->string('service_type');
            $table->string('service_type_other')->nullable();

            // ── Scheduling ────────────────────────────────────────────────────
            $table->date('scheduled_date');
            $table->time('scheduled_time_from');
            $table->time('scheduled_time_until');

            // ── Status ────────────────────────────────────────────────────────
            // pending → in_progress → completed | cancelled
            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])
                ->default('pending');

            // ── Notes ─────────────────────────────────────────────────────────
            $table->text('notes')->nullable();

            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('work_jobs');
    }
};
