<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Queue\SerializesModels;

class SystemNotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly DatabaseNotification $notification,
        public readonly int $unreadCount
    ) {}

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("users.{$this->userId}")];
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => [
                'id' => $this->notification->id,
                ...$this->notification->data,
                'read_at' => $this->notification->read_at?->toISOString(),
                'created_at' => $this->notification->created_at?->toISOString(),
            ],
            'unread_count' => $this->unreadCount,
        ];
    }
}
