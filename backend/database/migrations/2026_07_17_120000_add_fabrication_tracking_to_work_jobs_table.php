<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table->string('fabrication_status')->default('not_required')->after('status');
            $table->date('fabrication_expected_completion_date')->nullable()->after('fabrication_status');
            $table->timestamp('fabrication_started_at')->nullable()->after('fabrication_expected_completion_date');
            $table->timestamp('fabrication_completed_at')->nullable()->after('fabrication_started_at');
            $table->text('fabrication_notes')->nullable()->after('fabrication_completed_at');
            $table->timestamp('fabrication_updated_at')->nullable()->after('fabrication_notes');
        });

        DB::table('work_jobs')
            ->whereNull('parent_work_job_id')
            ->whereIn('service_type', ['installation', 'quotation'])
            ->where('status', '!=', 'completed')
            ->update([
                'fabrication_status' => 'pending',
                'fabrication_updated_at' => now(),
            ]);

        DB::table('work_jobs')
            ->whereNull('parent_work_job_id')
            ->whereIn('service_type', ['installation', 'quotation'])
            ->where('status', 'completed')
            ->update([
                'fabrication_status' => 'ready_for_installation',
                'fabrication_completed_at' => DB::raw('updated_at'),
                'fabrication_updated_at' => DB::raw('updated_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'fabrication_status',
                'fabrication_expected_completion_date',
                'fabrication_started_at',
                'fabrication_completed_at',
                'fabrication_notes',
                'fabrication_updated_at',
            ]);
        });
    }
};
