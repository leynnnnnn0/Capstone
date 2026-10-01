<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StaffAndAdminUserSeeder extends Seeder
{
    /**
     * Seed the shared staff and administrator test accounts.
     */
    public function run(): void
    {
        $users = [
            [
                'email' => 'cj.worker@gmail.com',
                'username' => 'cj.worker',
                'first_name' => 'CJ',
                'last_name' => 'Worker',
                'role' => 'staff',
            ],
            [
                'email' => 'celine.worker@gmail.com',
                'username' => 'celine.worker',
                'first_name' => 'Celine',
                'last_name' => 'Worker',
                'role' => 'staff',
            ],
            [
                'email' => 'nathaniel.worker@gmail.com',
                'username' => 'nathaniel.worker',
                'first_name' => 'Nathaniel',
                'last_name' => 'Worker',
                'role' => 'staff',
            ],
            [
                'email' => 'cj.admin@gmail.com',
                'username' => 'cj.admin',
                'first_name' => 'CJ',
                'last_name' => 'Admin',
                'role' => 'admin',
            ],
            [
                'email' => 'celine.admin@gmail.com',
                'username' => 'celine.admin',
                'first_name' => 'Celine',
                'last_name' => 'Admin',
                'role' => 'admin',
            ],
            [
                'email' => 'nathaniel.admin@gmail.com',
                'username' => 'nathaniel.admin',
                'first_name' => 'Nathaniel',
                'last_name' => 'Admin',
                'role' => 'admin',
            ],
        ];

        foreach ($users as $attributes) {
            $user = User::updateOrCreate(
                ['email' => $attributes['email']],
                [
                    ...$attributes,
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                ],
            );

            $user->syncRoles([$attributes['role']]);
        }
    }
}
