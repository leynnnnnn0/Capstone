<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'username' => 'admin',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@gmail.com',
            'phone_number' => '09899883983',
            'password' => bcrypt('password')
        ]);

        User::factory()->create([
            'username' => 'customer',
            'first_name' => 'Customer',
            'last_name' => 'User',
            'email' => 'customer@gmail.com',
            'phone_number' => '0987654321',
            'password' => bcrypt('password')
        ]);
    }
}
