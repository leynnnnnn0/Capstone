<?php

namespace Database\Factories;

use App\Enums\ArMeasurementSessionStatus;
use App\Models\Appointment;
use App\Models\ArMeasurementSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ArMeasurementSession>
 */
class ArMeasurementSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'appointment_id' => Appointment::factory(),
            'customer_id' => null,
            'created_by_user_id' => User::factory(),
            'source' => 'staff',
            'status' => ArMeasurementSessionStatus::Submitted,
            'capture_version' => 'v3',
            'capture_mode' => 'webxr',
            'overall_confidence' => 'high',
            'device_metadata' => [
                'platform' => 'test',
                'user_agent' => 'Laravel feature test',
            ],
            'captured_at' => now(),
        ];
    }
}
