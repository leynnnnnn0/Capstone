<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleAndPermissionSeeder::class);

        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'username' => 'admin',
                'first_name' => 'Admin',
                'last_name' => 'User',
                'phone_number' => '09899883983',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ],
        );

        $admin->assignRole('admin');

        $customer = User::updateOrCreate(
            ['email' => 'customer@gmail.com'],
            [
                'username' => 'customer',
                'first_name' => 'Customer',
                'last_name' => 'User',
                'phone_number' => '0987654321',
                'password' => Hash::make('password'),
                'role' => 'customer',
            ],
        );

        $customer->assignRole('customer');
    }
}
