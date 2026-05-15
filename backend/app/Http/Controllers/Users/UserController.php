<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->with('roles', 'permissions')
            ->when($request->string('search')->toString(), function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->when($request->string('role')->toString(), fn ($query, string $role) => $query
                ->where(fn ($query) => $query
                    ->where('role', $role)
                    ->orWhereHas('roles', fn ($query) => $query->where('name', $role))))
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return UserResource::collection($users)->response()->getData(true);
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'username' => $data['username'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone_number' => $data['phone_number'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        $this->syncAccess($user, $data);

        return UserResource::make($user->fresh(['roles', 'permissions']));
    }

    public function show(User $user)
    {
        abort_unless(auth()->user()?->can('users.view'), 403);

        return UserResource::make($user->load('roles', 'permissions'));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        $user->fill([
            'username' => $data['username'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone_number' => $data['phone_number'] ?? null,
            'role' => $data['role'],
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $this->syncAccess($user, $data);

        return UserResource::make($user->fresh(['roles', 'permissions']));
    }

    public function destroy(User $user)
    {
        abort_unless(auth()->user()?->can('users.delete'), 403);

        abort_if($user->is(auth()->user()), 422, 'You cannot delete your own account.');

        $user->delete();

        return response()->noContent();
    }

    public function options()
    {
        abort_unless(auth()->user()?->can('roles.view'), 403);

        return response()->json([
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'permissions' => Permission::query()->orderBy('name')->pluck('name'),
        ]);
    }

    private function syncAccess(User $user, array $data): void
    {
        $user->syncRoles([$data['role']]);
        $user->syncPermissions($data['permissions'] ?? []);
    }
}
