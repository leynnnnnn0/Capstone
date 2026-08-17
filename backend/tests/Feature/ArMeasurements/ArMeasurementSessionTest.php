<?php

use App\Enums\ArMeasurementSessionStatus;
use App\Models\Appointment;
use App\Models\ArMeasurement;
use App\Models\ArMeasurementSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function arMeasurementPayload(
    Appointment $appointment,
    array $overrides = []
): array {
    return array_replace_recursive([
        'appointment_id' => $appointment->id,
        'capture_version' => 'v3',
        'capture_mode' => 'webxr',
        'overall_confidence' => 'high',
        'captured_at' => now()->subMinute()->toIso8601String(),
        'device_metadata' => [
            'user_agent' => 'Mobile Safari',
            'platform' => 'iPhone',
            'viewport_width' => 390,
            'viewport_height' => 844,
            'pixel_ratio' => 3,
        ],
        'objects' => [
            [
                'object_type' => 'window',
                'model_id' => 'sliding-window',
                'label' => 'Sliding Window',
                'segments_cm' => [60.25, 59.75],
                'width_cm' => 120,
                'height_cm' => 100,
                'depth_cm' => 10,
                'confidence' => 'high',
                'points_count' => 4,
                'metadata' => ['anchor_tracking' => 'anchored'],
            ],
            [
                'object_type' => 'door',
                'model_id' => 'metal-door',
                'label' => 'Metal Door',
                'segments_cm' => [90],
                'width_cm' => 90,
                'height_cm' => 210,
                'confidence' => 'medium',
                'points_count' => 4,
            ],
        ],
    ], $overrides);
}

function createArSession(
    Appointment $appointment,
    User $creator,
    array $attributes = []
): ArMeasurementSession {
    $session = ArMeasurementSession::factory()->create([
        'appointment_id' => $appointment->id,
        'customer_id' => $appointment->user_id,
        'created_by_user_id' => $creator->id,
        ...$attributes,
    ]);

    ArMeasurement::factory()->create([
        'ar_measurement_session_id' => $session->id,
    ]);

    return $session;
}

it('lets a customer save a measurement session for their appointment', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create([
        'user_id' => $customer->id,
    ]);
    $product = Product::factory()->create();
    $payload = arMeasurementPayload($appointment);
    $payload['objects'][0]['product_id'] = $product->id;
    unset($payload['objects'][0]['confidence']);
    $payload['customer_id'] = User::factory()->create(['role' => 'customer'])->id;
    $payload['source'] = 'staff';
    $payload['status'] = 'approved';

    $response = $this->actingAs($customer)
        ->postJson('/api/v1/ar-measurement-sessions', $payload)
        ->assertCreated()
        ->assertJsonPath('message', 'AR measurement session saved.')
        ->assertJsonPath('data.appointment_id', $appointment->id)
        ->assertJsonPath('data.customer_id', $customer->id)
        ->assertJsonPath('data.created_by.id', $customer->id)
        ->assertJsonPath('data.source', 'customer')
        ->assertJsonPath('data.status', 'submitted')
        ->assertJsonPath('data.capture_version', 'v3')
        ->assertJsonPath('data.capture_mode', 'webxr')
        ->assertJsonPath('data.overall_confidence', 'medium')
        ->assertJsonPath('data.measurements_count', 2)
        ->assertJsonPath('data.measurements.0.product_id', $product->id)
        ->assertJsonPath('data.measurements.0.confidence', 'high')
        ->assertJsonPath('data.measurements.0.segments_cm.0', 60.25)
        ->assertJsonPath('data.measurements.0.width_cm', 120)
        ->assertJsonPath('data.measurements.0.area_sqm', 1.2);

    $reference = $response->json('data.reference');

    expect($reference)->toBeString()->not->toBeEmpty();

    $this->assertDatabaseHas('ar_measurement_sessions', [
        'reference' => $reference,
        'appointment_id' => $appointment->id,
        'customer_id' => $customer->id,
        'created_by_user_id' => $customer->id,
        'source' => 'customer',
        'status' => 'submitted',
        'overall_confidence' => 'medium',
    ]);
    $this->assertDatabaseCount('ar_measurements', 2);
});

it('keeps customer appointment measurement records private', function () {
    $owner = User::factory()->create(['role' => 'customer']);
    $otherCustomer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $owner->id]);
    $session = createArSession($appointment, $owner, ['source' => 'customer']);

    $this->actingAs($otherCustomer)
        ->postJson(
            '/api/v1/ar-measurement-sessions',
            arMeasurementPayload($appointment)
        )
        ->assertNotFound();

    $this->actingAs($otherCustomer)
        ->getJson("/api/v1/customer/appointments/{$appointment->id}/measurement-sessions")
        ->assertNotFound();

    $this->actingAs($otherCustomer)
        ->getJson("/api/v1/ar-measurement-sessions/{$session->reference}")
        ->assertNotFound();

    $this->actingAs($otherCustomer)
        ->getJson("/api/v1/ar-measurement-sessions/{$session->reference}/summary")
        ->assertNotFound();
});

it('lists measurement sessions only for the requested accessible appointment', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $otherAppointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $older = createArSession($appointment, $customer, [
        'source' => 'customer',
        'captured_at' => now()->subHour(),
    ]);
    $newer = createArSession($appointment, $customer, [
        'source' => 'customer',
        'captured_at' => now(),
    ]);
    createArSession($otherAppointment, $customer, ['source' => 'customer']);

    $this->actingAs($customer)
        ->getJson("/api/v1/customer/appointments/{$appointment->id}/measurement-sessions")
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.reference', $newer->reference)
        ->assertJsonPath('data.1.reference', $older->reference)
        ->assertJsonPath('meta.total', 2);
});

it('allows an assigned worker to save, list, and review measurements', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $worker = User::factory()->create(['role' => 'worker']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $appointment->workers()->attach($worker);

    $storeResponse = $this->actingAs($worker)
        ->postJson(
            '/api/v1/ar-measurement-sessions',
            arMeasurementPayload($appointment)
        )
        ->assertCreated()
        ->assertJsonPath('data.source', 'worker')
        ->assertJsonPath('data.customer_id', $customer->id);

    $reference = $storeResponse->json('data.reference');

    $this->actingAs($worker)
        ->getJson("/api/v1/appointments/{$appointment->id}/measurement-sessions")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.reference', $reference);

    $this->actingAs($worker)
        ->patchJson("/api/v1/ar-measurement-sessions/{$reference}/review", [
            'status' => 'approved',
            'review_notes' => 'Dimensions are consistent with the site opening.',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Measurement review saved.')
        ->assertJsonPath('data.status', 'approved')
        ->assertJsonPath('data.reviewed_by.id', $worker->id)
        ->assertJsonPath(
            'data.review_notes',
            'Dimensions are consistent with the site opening.'
        );

    $this->assertDatabaseHas('ar_measurement_sessions', [
        'reference' => $reference,
        'status' => ArMeasurementSessionStatus::Approved->value,
        'reviewed_by_user_id' => $worker->id,
    ]);
});

it('prevents an unassigned worker from accessing or reviewing a measurement session', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $creator = User::factory()->create(['role' => 'worker']);
    $unassignedWorker = User::factory()->create(['role' => 'worker']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $appointment->workers()->attach($creator);
    $session = createArSession($appointment, $creator, ['source' => 'worker']);

    $this->actingAs($unassignedWorker)
        ->postJson(
            '/api/v1/ar-measurement-sessions',
            arMeasurementPayload($appointment)
        )
        ->assertForbidden();

    $this->actingAs($unassignedWorker)
        ->getJson("/api/v1/appointments/{$appointment->id}/measurement-sessions")
        ->assertForbidden();

    $this->actingAs($unassignedWorker)
        ->getJson("/api/v1/ar-measurement-sessions/{$session->reference}")
        ->assertForbidden();

    $this->actingAs($unassignedWorker)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'approved',
        ])
        ->assertForbidden();
});

it('allows operations staff to access and review any appointment measurement', function (string $role) {
    $customer = User::factory()->create(['role' => 'customer']);
    $staff = User::factory()->create(['role' => $role]);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $session = createArSession($appointment, $customer, ['source' => 'customer']);

    $this->actingAs($staff)
        ->getJson("/api/v1/appointments/{$appointment->id}/measurement-sessions")
        ->assertOk()
        ->assertJsonPath('data.0.reference', $session->reference);

    $this->actingAs($staff)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'reviewed',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'reviewed')
        ->assertJsonPath('data.reviewed_by.id', $staff->id);
})->with(['admin', 'sub_admin']);

it('requires review notes when staff requests a retake', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $session = createArSession($appointment, $customer, ['source' => 'customer']);

    $this->actingAs($admin)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'submitted',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');

    $this->actingAs($admin)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'needs_retake',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('review_notes');

    $this->actingAs($admin)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'needs_retake',
            'review_notes' => 'The upper-left corner was not anchored.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'needs_retake')
        ->assertJsonPath(
            'data.review_notes',
            'The upper-left corner was not anchored.'
        );
});

it('does not allow a customer to review their own measurement session', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $session = createArSession($appointment, $customer, ['source' => 'customer']);

    $this->actingAs($customer)
        ->patchJson("/api/v1/ar-measurement-sessions/{$session->reference}/review", [
            'status' => 'approved',
        ])
        ->assertForbidden();
});

it('generates a structured summary from stored raw measurements', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create([
        'user_id' => $customer->id,
        'first_name' => 'Maria',
        'last_name' => 'Santos',
        'service_type' => 'installation',
    ]);

    $response = $this->actingAs($customer)
        ->postJson(
            '/api/v1/ar-measurement-sessions',
            arMeasurementPayload($appointment)
        )
        ->assertCreated();
    $reference = $response->json('data.reference');

    $this->actingAs($customer)
        ->getJson("/api/v1/ar-measurement-sessions/{$reference}/summary")
        ->assertOk()
        ->assertJsonPath('data.reference', $reference)
        ->assertJsonPath('data.appointment.id', $appointment->id)
        ->assertJsonPath('data.appointment.customer_name', 'Maria Santos')
        ->assertJsonPath('data.capture.capture_version', 'v3')
        ->assertJsonPath('data.capture.overall_confidence', 'medium')
        ->assertJsonPath('data.object_count', 2)
        ->assertJsonPath('data.totals.total_linear_m', 2.1)
        ->assertJsonPath('data.totals.total_area_sqm', 3.09)
        ->assertJsonPath('data.confidence_distribution.high', 1)
        ->assertJsonPath('data.confidence_distribution.medium', 1)
        ->assertJsonPath('data.confidence_distribution.weak', 0)
        ->assertJsonPath('data.measurements.0.width_cm', 120)
        ->assertJsonPath('data.measurements.1.height_cm', 210)
        ->assertJsonCount(2, 'data.by_type');
});

it('validates measurement bounds, segment totals, object counts, and metadata size', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $payload = arMeasurementPayload($appointment, [
        'device_metadata' => ['raw' => str_repeat('x', 33_000)],
        'objects' => [
            [
                'object_type' => 'window',
                'label' => 'Invalid Window',
                'segments_cm' => [50, 50],
                'width_cm' => 150,
                'height_cm' => 1001,
                'metadata' => ['raw' => str_repeat('x', 17_000)],
            ],
        ],
    ]);

    $this->actingAs($customer)
        ->postJson('/api/v1/ar-measurement-sessions', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'device_metadata',
            'objects.0.width_cm',
            'objects.0.height_cm',
            'objects.0.metadata',
        ]);

    $this->actingAs($customer)
        ->postJson('/api/v1/ar-measurement-sessions', [
            ...arMeasurementPayload($appointment),
            'objects' => [],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('objects');

    $tooManyObjects = arMeasurementPayload($appointment);
    $tooManyObjects['objects'] = array_fill(
        0,
        51,
        $tooManyObjects['objects'][0]
    );

    $this->actingAs($customer)
        ->postJson('/api/v1/ar-measurement-sessions', $tooManyObjects)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('objects');
});

it('requires authentication for measurement endpoints', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $session = createArSession($appointment, $customer, ['source' => 'customer']);

    $this->postJson(
        '/api/v1/ar-measurement-sessions',
        arMeasurementPayload($appointment)
    )->assertUnauthorized();

    $this->getJson(
        "/api/v1/ar-measurement-sessions/{$session->reference}"
    )->assertUnauthorized();
});

it('deletes measurements when their appointment is deleted', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $appointment = Appointment::factory()->create(['user_id' => $customer->id]);
    $session = createArSession($appointment, $customer, ['source' => 'customer']);

    $appointment->delete();

    $this->assertDatabaseMissing('ar_measurement_sessions', [
        'id' => $session->id,
    ]);
    $this->assertDatabaseMissing('ar_measurements', [
        'ar_measurement_session_id' => $session->id,
    ]);
});
