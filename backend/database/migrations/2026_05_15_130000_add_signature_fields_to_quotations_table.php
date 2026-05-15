<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->timestamp('customer_signed_at')->nullable()->after('notes');
            $table->string('customer_signature_name')->nullable()->after('customer_signed_at');
            $table->string('customer_signature_path')->nullable()->after('customer_signature_name');
            $table->string('customer_signature_hash')->nullable()->after('customer_signature_path');
            $table->string('customer_signature_ip')->nullable()->after('customer_signature_hash');
            $table->text('customer_signature_user_agent')->nullable()->after('customer_signature_ip');
            $table->timestamp('signature_invalidated_at')->nullable()->after('customer_signature_user_agent');
            $table->string('signature_invalidated_reason')->nullable()->after('signature_invalidated_at');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn([
                'customer_signed_at',
                'customer_signature_name',
                'customer_signature_path',
                'customer_signature_hash',
                'customer_signature_ip',
                'customer_signature_user_agent',
                'signature_invalidated_at',
                'signature_invalidated_reason',
            ]);
        });
    }
};
