<?php

use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

it('creates an owner with all web permissions through the Sanctum API', function () {
    $this->seed(RoleAndPermissionSeeder::class);
    $admin = User::factory()->create(['role' => 'admin']);
    $admin->assignRole('admin');
    Sanctum::actingAs($admin);

    $this->mock(UncompromisedVerifier::class)
        ->shouldReceive('verify')
        ->andReturn(true);

    Permission::findOrCreate('test.other-guard', 'sanctum');

    $this->postJson('/api/v1/users', [
        'username' => 'new-owner',
        'first_name' => 'New',
        'last_name' => 'Owner',
        'email' => 'owner@example.com',
        'password' => 'Example!Password123',
        'role' => 'owner',
    ])->assertOk();

    $owner = User::query()->where('username', 'new-owner')->firstOrFail();

    expect($owner->getRoleNames()->all())->toBe(['owner'])
        ->and($owner->getDirectPermissions()->pluck('name')->all())
        ->toEqualCanonicalizing(RoleAndPermissionSeeder::PERMISSIONS);
});
