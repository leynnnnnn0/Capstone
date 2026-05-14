<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Database\Eloquent\Factories\Factory;

class WorkJobRemarkFactory extends Factory
{
    public function definition(): array
    {
        return [
            'work_job_id' => WorkJob::factory(),
            'user_id' => User::factory(),
            'action' => 'pending',
            'message' => $this->faker->sentence(),
        ];
    }
}
