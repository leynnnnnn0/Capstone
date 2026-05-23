<?php

use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_job_charges', function (Blueprint $table) {
            $table->id();
            $table->string('charge_number')->nullable()->unique();
            $table->foreignId('work_job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default(WorkJobChargeType::ServiceFee->value);
            $table->string('status')->default(WorkJobChargeStatus::Approved->value);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('PHP');
            $table->boolean('requires_customer_approval')->default(true);
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('customer_approved_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['work_job_id', 'status']);
            $table->index(['work_job_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_job_charges');
    }
};
