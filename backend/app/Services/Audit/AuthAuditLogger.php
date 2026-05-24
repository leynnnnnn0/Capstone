<?php

namespace App\Services\Audit;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;

class AuthAuditLogger
{
    public function log(
        Request $request,
        string $event,
        Model $auditable,
        ?User $actor = null,
        array $oldValues = [],
        array $newValues = [],
        string $tags = 'auth'
    ): Audit {
        $actor ??= $this->resolveActor($request, $auditable);

        return Audit::create([
            'user_type' => $actor?->getMorphClass(),
            'user_id' => $actor?->getKey(),
            'event' => $event,
            'auditable_type' => $auditable->getMorphClass(),
            'auditable_id' => $auditable->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1023),
            'tags' => $tags,
        ]);
    }

    private function resolveActor(Request $request, Model $auditable): ?User
    {
        $requestUser = $request->user();

        if ($requestUser instanceof User) {
            return $requestUser;
        }

        if ($auditable instanceof User) {
            return $auditable;
        }

        return null;
    }
}
