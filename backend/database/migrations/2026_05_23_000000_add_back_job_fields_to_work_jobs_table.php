<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table
                ->foreignId('parent_work_job_id')
                ->nullable()
                ->after('quotation_id')
                ->constrained('work_jobs')
                ->nullOnDelete();

            $table->string('back_job_reason')->nullable()->after('status');
            $table->string('back_job_reason_other')->nullable()->after('back_job_reason');
            $table->text('back_job_details')->nullable()->after('back_job_reason_other');
            $table->index(['parent_work_job_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table->dropIndex(['parent_work_job_id', 'status']);
            $table->dropConstrainedForeignId('parent_work_job_id');
            $table->dropColumn([
                'back_job_reason',
                'back_job_reason_other',
                'back_job_details',
            ]);
        });
    }
};
