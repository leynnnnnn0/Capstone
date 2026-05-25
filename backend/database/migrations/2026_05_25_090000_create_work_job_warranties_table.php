<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_job_warranties', function (Blueprint $table) {
            $table->id();
            $table->string('warranty_number')->nullable()->unique();
            $table->foreignId('work_job_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('starts_at');
            $table->date('expires_at');
            $table->unsignedSmallInteger('duration_months')->default(12);
            $table->string('status')->default('active');
            $table->text('coverage')->nullable();
            $table->text('terms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_job_warranties');
    }
};
