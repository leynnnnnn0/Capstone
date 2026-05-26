<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_warranties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('duration_months')->default(12);
            $table->boolean('is_active')->default(true);
            $table->text('coverage')->nullable();
            $table->text('terms')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });

        DB::table('products')->select('id')->orderBy('id')->chunkById(100, function ($products) {
            $now = now();

            foreach ($products as $product) {
                DB::table('product_warranties')->updateOrInsert(
                    ['product_id' => $product->id],
                    [
                        'duration_months' => 12,
                        'is_active' => true,
                        'coverage' => 'Covers workmanship concerns found after installation or service completion.',
                        'terms' => 'Warranty claims are subject to SOG Glass & Aluminum inspection and do not cover misuse, accidental damage, or third-party alterations.',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ],
                );
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_warranties');
    }
};
