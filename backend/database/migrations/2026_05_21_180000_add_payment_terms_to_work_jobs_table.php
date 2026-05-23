<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table->boolean('is_down_payment_required')->default(false)->after('status');
            $table->decimal('down_payment_percentage', 5, 2)->default(20)->after('is_down_payment_required');
        });
    }

    public function down(): void
    {
        Schema::table('work_jobs', function (Blueprint $table) {
            $table->dropColumn(['is_down_payment_required', 'down_payment_percentage']);
        });
    }
};
