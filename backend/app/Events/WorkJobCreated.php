<?php

namespace App\Events;

use App\Models\User;
use App\Models\WorkJob;
use Illuminate\Foundation\Events\Dispatchable;

class WorkJobCreated
{
    use Dispatchable;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly ?User $actor = null,
    ) {}
}
