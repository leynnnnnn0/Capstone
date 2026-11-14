<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $owner = Role::query()->where('name', 'owner')->where('guard_name', 'web')->first();

        if (! $owner) {
            return;
        }

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', ['audits.view', 'database.manage'])
            ->get();

        $permissions->each(fn (Permission $permission) => $owner->revokePermissionTo($permission));
    }

    public function down(): void
    {
        Role::query()->where('name', 'owner')->where('guard_name', 'web')->first()
            ?->givePermissionTo(Permission::findOrCreate('audits.view', 'web'));
    }
};
