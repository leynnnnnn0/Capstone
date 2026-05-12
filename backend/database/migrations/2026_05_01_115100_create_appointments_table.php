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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('appointment_number')->nullable()->unique();

            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone_number');

            $table->string('address');
            $table->string('address_pinned')->nullable();
            $table->decimal('address_lat', 10, 7)->nullable();
            $table->decimal('address_lng', 10, 7)->nullable();

            $table->string('service_type');
            $table->string('service_type_other')->nullable();

            $table->date('preferred_date');
            $table->enum('preferred_time', ['morning', 'afternoon']);

            $table->date('appointment_date')->nullable();
            $table->string('appointment_time_from')->nullable();
            $table->string('appointment_time_until')->nullable();

            $table->text('additional_notes')->nullable();

            $table->string('status')->default('pending');

            $table->boolean('consent')->default(false);
            $table->timestamp('consent_given_at')->required();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
