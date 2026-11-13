<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('migrates legacy owners and preserves their permissions', function (bool $ownerRoleExists) {
    $legacyRole = Role::findOrCreate('sub_admin', 'web');
    $legacyRole->givePermissionTo(Permission::findOrCreate('products.view', 'web'));
    $legacyOwner = User::factory()->create(['role' => 'sub_admin']);
    $legacyOwner->assignRole($legacyRole);
    $legacyOwner->givePermissionTo(Permission::findOrCreate('products.manage', 'web'));

    if ($ownerRoleExists) {
        $ownerRole = Role::findOrCreate('owner', 'web');
        $ownerRole->givePermissionTo(Permission::findOrCreate('calendar.view', 'web'));
        $existingOwner = User::factory()->create(['role' => 'owner']);
        $existingOwner->assignRole($ownerRole);
    }

    $migration = require database_path('migrations/2026_11_13_000000_rename_sub_admin_role_to_owner.php');
    $migration->up();

    $legacyOwner->refresh();
    expect($legacyOwner->role)->toBe('owner')
        ->and($legacyOwner->getRoleNames()->all())->toBe(['owner'])
        ->and($legacyOwner->can('products.view'))->toBeTrue()
        ->and($legacyOwner->hasDirectPermission('products.manage'))->toBeTrue();

    $this->assertDatabaseMissing('roles', ['name' => 'sub_admin', 'guard_name' => 'web']);

    if ($ownerRoleExists) {
        expect($existingOwner->fresh()->getRoleNames()->all())->toBe(['owner'])
            ->and($existingOwner->fresh()->can('calendar.view'))->toBeTrue();
    }
})->with([false, true]);
