<?php

namespace App\Http\Controllers\ArMeasurements;

use App\Enums\ArMeasurementSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ArMeasurements\StoreArMeasurementSessionRequest;
use App\Http\Resources\ArMeasurementSessionResource;
use App\Http\Resources\ArMeasurementSummaryResource;
use App\Models\Appointment;
use App\Models\ArMeasurementSession;
use App\Services\ArMeasurements\ArMeasurementAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArMeasurementSessionController extends Controller
{
    private const RELATIONS = [
        'appointment',
        'creator',
        'reviewer',
        'measurements',
    ];

    public function __construct(
        private readonly ArMeasurementAccess $access
    ) {}

    public function indexForAppointment(
        Request $request,
        Appointment $appointment
    ): JsonResponse {
        $this->access->abortUnlessAppointmentAccessible(
            $request->user(),
            $appointment
        );

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $sessions = $appointment->arMeasurementSessions()
            ->with(self::RELATIONS)
            ->withCount('measurements')
            ->latest('captured_at')
            ->paginate($perPage);

        return response()->json([
            'data' => ArMeasurementSessionResource::collection(
                $sessions->getCollection()
            )->resolve($request),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
                'from' => $sessions->firstItem(),
                'to' => $sessions->lastItem(),
            ],
        ]);
    }

    public function store(
        StoreArMeasurementSessionRequest $request
    ): JsonResponse {
        $data = $request->validated();
        $appointment = Appointment::query()->findOrFail($data['appointment_id']);
        $user = $request->user();

        $this->access->abortUnlessAppointmentAccessible($user, $appointment);

        $session = DB::transaction(function () use ($data, $appointment, $user) {
            $objects = collect($data['objects'])
                ->values()
                ->map(fn (array $object) => [
                    ...$object,
                    'confidence' => $object['confidence']
                        ?? $data['overall_confidence'],
                ]);

            $session = ArMeasurementSession::query()->create([
                'appointment_id' => $appointment->id,
                'customer_id' => $appointment->user_id,
                'created_by_user_id' => $user->id,
                'source' => $this->access->sourceFor($user),
                'status' => ArMeasurementSessionStatus::Submitted,
                'capture_version' => $data['capture_version'],
                'capture_mode' => $data['capture_mode'],
                'overall_confidence' => $this->weakestConfidence(
                    $objects->pluck('confidence')->all()
                ),
                'device_metadata' => $data['device_metadata'] ?? null,
                'captured_at' => $data['captured_at'],
            ]);

            $session->measurements()->createMany(
                $objects
                    ->map(fn (array $object, int $index) => [
                        'product_id' => $object['product_id'] ?? null,
                        'object_type' => $object['object_type'],
                        'model_id' => $object['model_id'] ?? null,
                        'label' => $object['label'],
                        'segments_cm' => array_map(
                            static fn ($segment) => (float) $segment,
                            $object['segments_cm']
                        ),
                        'width_cm' => (float) $object['width_cm'],
                        'height_cm' => (float) $object['height_cm'],
                        'depth_cm' => isset($object['depth_cm'])
                            ? (float) $object['depth_cm']
                            : null,
                        'confidence' => $object['confidence'],
                        'points_count' => $object['points_count'] ?? null,
                        'metadata' => $object['metadata'] ?? null,
                        'sort_order' => $index,
                    ])
                    ->all()
            );

            return $session;
        });

        $session->load(self::RELATIONS)->loadCount('measurements');

        return response()->json([
            'message' => 'AR measurement session saved.',
            'data' => new ArMeasurementSessionResource($session),
        ], 201);
    }

    public function show(
        Request $request,
        ArMeasurementSession $arMeasurementSession
    ): JsonResponse {
        $this->access->abortUnlessSessionAccessible(
            $request->user(),
            $arMeasurementSession
        );

        $arMeasurementSession
            ->load(self::RELATIONS)
            ->loadCount('measurements');

        return response()->json([
            'data' => new ArMeasurementSessionResource($arMeasurementSession),
        ]);
    }

    public function summary(
        Request $request,
        ArMeasurementSession $arMeasurementSession
    ): JsonResponse {
        $this->access->abortUnlessSessionAccessible(
            $request->user(),
            $arMeasurementSession
        );

        $arMeasurementSession->load(self::RELATIONS);

        return response()->json([
            'data' => new ArMeasurementSummaryResource($arMeasurementSession),
        ]);
    }

    /**
     * @param  array<int, string>  $confidences
     */
    private function weakestConfidence(array $confidences): string
    {
        $rank = [
            'none' => 0,
            'weak' => 1,
            'medium' => 2,
            'high' => 3,
        ];

        return collect($confidences)
            ->sortBy(fn (string $confidence) => $rank[$confidence])
            ->first();
    }
}
