<?php

namespace Database\Factories;

use App\Models\ArMeasurement;
use App\Models\ArMeasurementSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ArMeasurement>
 */
class ArMeasurementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ar_measurement_session_id' => ArMeasurementSession::factory(),
            'product_id' => null,
            'object_type' => 'window',
            'model_id' => 'test-window',
            'label' => 'Test Window',
            'segments_cm' => [120.0],
            'width_cm' => 120,
            'height_cm' => 100,
            'depth_cm' => 10,
            'confidence' => 'high',
            'points_count' => 4,
            'metadata' => null,
            'sort_order' => 0,
        ];
    }
}
