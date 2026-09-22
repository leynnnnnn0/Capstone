<?php

use App\Models\User;
use App\Services\DatabaseBackupService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

function databaseAdmin(bool $confirmed = true): User
{
    test()->seed(RoleAndPermissionSeeder::class);

    $admin = User::factory()->create(['role' => 'admin']);
    $admin->assignRole('admin');

    if ($confirmed) {
        Cache::put("settings-password-confirmed:user:{$admin->id}:session", true, now()->addMinutes(15));
    }

    return $admin;
}

it('lists database backups for a password-confirmed admin', function () {
    $admin = databaseAdmin();
    $backup = [
        'id' => 'sog-backup-20260921-120000-a1b2c3d4.sql',
        'filename' => 'sog-backup-20260921-120000-a1b2c3d4.sql',
        'size' => 2048,
        'driver' => 'mysql',
        'reason' => 'manual',
        'created_at' => '2026-09-21T12:00:00+08:00',
    ];

    $this->mock(DatabaseBackupService::class)
        ->shouldReceive('all')
        ->once()
        ->andReturn([$backup]);

    $this->actingAs($admin)
        ->getJson('/api/v1/database/backups')
        ->assertOk()
        ->assertJsonPath('data.0.filename', $backup['filename']);
});

it('requires recent password confirmation for database tools', function () {
    $admin = databaseAdmin(false);

    $this->actingAs($admin)
        ->getJson('/api/v1/database/backups')
        ->assertStatus(423)
        ->assertJsonPath('message', 'Please confirm your password before continuing.');
});

it('prevents non-admin accounts from using database tools', function () {
    test()->seed(RoleAndPermissionSeeder::class);
    $subAdmin = User::factory()->create(['role' => 'sub_admin']);
    $subAdmin->assignRole('sub_admin');

    $this->actingAs($subAdmin)
        ->getJson('/api/v1/database/backups')
        ->assertForbidden();
});

it('creates a safety backup before restoring', function () {
    $admin = databaseAdmin();
    $filename = 'sog-backup-20260921-120000-a1b2c3d4.sql';

    $this->mock(DatabaseBackupService::class)
        ->shouldReceive('restoreWithSafetyBackup')
        ->once()
        ->with($filename)
        ->andReturn([
            'id' => 'sog-backup-20260921-130000-d4c3b2a1.sql',
            'reason' => 'pre_restore',
        ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/database/backups/{$filename}/restore", ['confirmation' => 'RESTORE'])
        ->assertOk()
        ->assertJsonPath('message', 'Database restored successfully.')
        ->assertJsonPath('safety_backup.reason', 'pre_restore');
});

it('rejects restore requests without the explicit confirmation phrase', function () {
    $admin = databaseAdmin();

    $this->actingAs($admin)
        ->postJson('/api/v1/database/backups/sog-backup-20260921-120000-a1b2c3d4.sql/restore', [
            'confirmation' => 'restore',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('confirmation');
});
