<?php

use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows admins to list audit records', function () {
    $this->seed(RoleAndPermissionSeeder::class);
    $admin = User::factory()->create(['role' => 'admin']);
    $admin->assignRole('admin');

    $this->actingAs($admin)->getJson('/api/v1/audits')->assertOk();
});

it('denies owners access to audit records even with a stale permission grant', function () {
    $this->seed(RoleAndPermissionSeeder::class);
    $owner = User::factory()->create(['role' => 'owner']);
    $owner->assignRole('owner');

    expect($owner->hasPermissionTo('audits.view'))->toBeFalse();

    $owner->givePermissionTo('audits.view');

    $this->actingAs($owner)->getJson('/api/v1/audits')->assertForbidden();
});
