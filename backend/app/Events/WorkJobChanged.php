<?php

namespace App\Events;

use App\Models\WorkJob;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkJobChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly string $action,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
