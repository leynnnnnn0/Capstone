<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotation_item_images', function (Blueprint $table) {
            $table->foreignId('uploaded_by_id')
                ->nullable()
                ->after('quotation_item_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quotation_item_images', function (Blueprint $table) {
            $table->dropConstrainedForeignId('uploaded_by_id');
        });
    }
};
