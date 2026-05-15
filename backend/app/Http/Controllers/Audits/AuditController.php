<?php

namespace App\Http\Controllers\Audits;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OwenIt\Auditing\Models\Audit;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $audits = Audit::query()
            ->with('user')
            ->when($request->string('event')->toString(), fn ($query, $event) => $query->where('event', $event))
            ->when($request->string('auditable_type')->toString(), fn ($query, $type) => $query->where('auditable_type', $type))
            ->latest()
            ->paginate((int) $request->integer('per_page', 25));

        return response()->json([
            'data' => $audits->getCollection()->map(fn (Audit $audit) => [
                'id' => $audit->id,
                'event' => $audit->event,
                'auditable_type' => class_basename($audit->auditable_type),
                'auditable_id' => $audit->auditable_id,
                'user' => $audit->user ? [
                    'id' => $audit->user->id,
                    'name' => trim(($audit->user->first_name ?? '') . ' ' . ($audit->user->last_name ?? '')) ?: $audit->user->email,
                    'email' => $audit->user->email,
                ] : null,
                'old_values' => $audit->old_values,
                'new_values' => $audit->new_values,
                'ip_address' => $audit->ip_address,
                'url' => $audit->url,
                'created_at' => $audit->created_at,
            ]),
            'meta' => [
                'current_page' => $audits->currentPage(),
                'last_page' => $audits->lastPage(),
                'per_page' => $audits->perPage(),
                'total' => $audits->total(),
            ],
        ]);
    }

    public function show(Audit $audit): JsonResponse
    {
        $audit->load('user');

        return response()->json([
            'data' => $this->serialize($audit),
        ]);
    }

    private function serialize(Audit $audit): array
    {
        return [
            'id' => $audit->id,
            'event' => $audit->event,
            'auditable_type' => class_basename($audit->auditable_type),
            'auditable_id' => $audit->auditable_id,
            'user' => $audit->user ? [
                'id' => $audit->user->id,
                'name' => trim(($audit->user->first_name ?? '') . ' ' . ($audit->user->last_name ?? '')) ?: $audit->user->email,
                'email' => $audit->user->email,
            ] : null,
            'old_values' => $audit->old_values,
            'new_values' => $audit->new_values,
            'ip_address' => $audit->ip_address,
            'url' => $audit->url,
            'user_agent' => $audit->user_agent,
            'created_at' => $audit->created_at,
        ];
    }
}
