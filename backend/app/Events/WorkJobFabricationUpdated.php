<?php

namespace App\Events;

use App\Enums\FabricationStatus;
use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkJobFabricationUpdated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly FabricationStatus $status,
        public readonly string $message,
        public readonly ?User $actor = null,
    ) {}
}
