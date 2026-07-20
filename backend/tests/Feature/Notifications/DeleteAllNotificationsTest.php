<?php

use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('deletes only the authenticated admin notifications', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);

    $admin->notify(new SystemNotification(notificationPayload('Admin notification one')));
    $admin->notify(new SystemNotification(notificationPayload('Admin notification two')));
    $customer->notify(new SystemNotification(notificationPayload('Customer notification')));

    $this->actingAs($admin)
        ->deleteJson('/api/v1/notifications')
        ->assertOk()
        ->assertExactJson([
            'data' => [],
            'unread_count' => 0,
        ]);

    expect($admin->notifications()->count())->toBe(0)
        ->and($customer->notifications()->count())->toBe(1);
});

it('deletes only the authenticated customer notifications', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);

    $admin->notify(new SystemNotification(notificationPayload('Admin notification')));
    $customer->notify(new SystemNotification(notificationPayload('Customer notification one')));
    $customer->notify(new SystemNotification(notificationPayload('Customer notification two')));

    $this->actingAs($customer)
        ->deleteJson('/api/v1/notifications')
        ->assertOk()
        ->assertExactJson([
            'data' => [],
            'unread_count' => 0,
        ]);

    expect($customer->notifications()->count())->toBe(0)
        ->and($admin->notifications()->count())->toBe(1);
});

it('requires authentication to delete all notifications', function () {
    $this->deleteJson('/api/v1/notifications')->assertUnauthorized();
});

function notificationPayload(string $title): array
{
    return [
        'type' => 'appointment',
        'action' => 'updated',
        'title' => $title,
        'message' => 'Notification test message.',
    ];
}
