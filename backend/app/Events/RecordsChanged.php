<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecordsChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    /**
     * @param array<int, string> $channels
     * @param array<string, mixed> $payload
     */
    public function __construct(
        public readonly array $channels,
        public readonly array $payload
    ) {}

    public function broadcastAs(): string
    {
        return 'records.changed';
    }

    public function broadcastOn(): array
    {
        return collect($this->channels)
            ->unique()
            ->values()
            ->map(fn (string $channel) => new PrivateChannel($channel))
            ->all();
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
