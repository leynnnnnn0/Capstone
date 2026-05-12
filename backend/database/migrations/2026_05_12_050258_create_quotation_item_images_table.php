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
        Schema::create('quotation_item_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_item_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->enum('type', ['before', 'after']);
            $table->integer('sort_order')->default(0);
            $table->string('caption')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_item_images');
    }
};
