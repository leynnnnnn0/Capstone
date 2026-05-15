<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public const PERMISSIONS = [
        'dashboard.view',
        'users.view',
        'users.create',
        'users.update',
        'users.delete',
        'roles.view',
        'roles.manage',
        'products.view',
        'products.manage',
        'appointments.view',
        'appointments.create',
        'appointments.update',
        'appointments.cancel',
        'appointments.status',
        'quotations.view',
        'quotations.manage',
        'work-jobs.view',
        'work-jobs.create',
        'work-jobs.update',
        'work-jobs.status',
        'calendar.view',
        'reports.view',
    ];

    public const ROLES = [
        'admin' => self::PERMISSIONS,
        'sub_admin' => [
            'dashboard.view',
            'users.view',
            'products.view',
            'products.manage',
            'appointments.view',
            'appointments.create',
            'appointments.update',
            'appointments.cancel',
            'appointments.status',
            'quotations.view',
            'quotations.manage',
            'work-jobs.view',
            'work-jobs.create',
            'work-jobs.update',
            'work-jobs.status',
            'calendar.view',
            'reports.view',
        ],
        'worker' => [
            'dashboard.view',
            'appointments.view',
            'appointments.status',
            'quotations.view',
            'work-jobs.view',
            'work-jobs.update',
            'work-jobs.status',
            'calendar.view',
        ],
        'customer' => [],
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::ROLES as $roleName => $permissions) {
            Role::findOrCreate($roleName, 'web')->syncPermissions($permissions);
        }

        User::query()->each(function (User $user) {
            $role = $user->role ?: 'customer';

            if (array_key_exists($role, self::ROLES) && ! $user->hasRole($role)) {
                $user->assignRole($role);
            }
        });
    }
}
