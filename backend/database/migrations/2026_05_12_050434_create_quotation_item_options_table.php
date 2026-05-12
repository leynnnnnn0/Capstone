<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quotation_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_option_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_option_id')->constrained()->cascadeOnDelete();

            $table->string('group_name');
            $table->string('option_name');
            $table->double('price_modifier');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_item_options');
    }
};
