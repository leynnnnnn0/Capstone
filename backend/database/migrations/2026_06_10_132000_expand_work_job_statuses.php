<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE work_jobs MODIFY status ENUM('pending', 'confirmed', 'rescheduled', 'on_the_way', 'in_progress', 'completed', 'cancelled', 'reopened', 'no_show') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("UPDATE work_jobs SET status = 'cancelled' WHERE status IN ('no_show')");
        DB::statement("UPDATE work_jobs SET status = 'pending' WHERE status IN ('confirmed', 'rescheduled', 'on_the_way', 'reopened')");
        DB::statement("ALTER TABLE work_jobs MODIFY status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};
