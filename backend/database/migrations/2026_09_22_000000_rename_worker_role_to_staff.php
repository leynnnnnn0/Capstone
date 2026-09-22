<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $this->renameRole('worker', 'staff');
    }

    public function down(): void
    {
        $this->renameRole('staff', 'worker');
    }

    private function renameRole(string $from, string $to): void
    {
        DB::transaction(function () use ($from, $to) {
            DB::table('users')->where('role', $from)->update(['role' => $to]);
            DB::table('ar_measurement_sessions')->where('source', $from)->update(['source' => $to]);

            $source = DB::table('roles')->where('name', $from)->where('guard_name', 'web')->first();
            $target = DB::table('roles')->where('name', $to)->where('guard_name', 'web')->first();

            if (! $source) {
                return;
            }

            if (! $target) {
                DB::table('roles')->where('id', $source->id)->update(['name' => $to]);

                return;
            }

            DB::table('role_has_permissions')
                ->where('role_id', $source->id)
                ->get()
                ->each(fn ($row) => DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $row->permission_id,
                    'role_id' => $target->id,
                ]));

            DB::table('model_has_roles')
                ->where('role_id', $source->id)
                ->get()
                ->each(fn ($row) => DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $target->id,
                    'model_type' => $row->model_type,
                    'model_id' => $row->model_id,
                ]));

            DB::table('model_has_roles')->where('role_id', $source->id)->delete();
            DB::table('role_has_permissions')->where('role_id', $source->id)->delete();
            DB::table('roles')->where('id', $source->id)->delete();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
