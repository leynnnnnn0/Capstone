<?php

namespace App\Events;

use App\Enums\WorkJobStatus;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkJobStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly WorkJobStatus $status,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
