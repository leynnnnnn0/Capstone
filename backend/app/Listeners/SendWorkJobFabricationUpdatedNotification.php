<?php

namespace App\Listeners;

use App\Events\WorkJobFabricationUpdated;
use App\Mail\WorkJobs\WorkJobFabricationUpdatedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendWorkJobFabricationUpdatedNotification implements ShouldQueue
{
    public function handle(WorkJobFabricationUpdated $event): void
    {
        if (! $event->workJob->email) {
            return;
        }

        Mail::to($event->workJob->email)->queue(new WorkJobFabricationUpdatedMail(
            $event->workJob,
            $event->status,
            $event->message,
        ));
    }
}
