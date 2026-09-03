<?php

namespace App\Listeners;

use App\Events\WorkJobStatusChanged;
use App\Mail\WorkJobs\WorkJobStatusChangedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendWorkJobStatusChangedNotification implements ShouldQueue
{
    public function handle(WorkJobStatusChanged $event): void
    {
        if (! $event->workJob->email) {
            return;
        }

        Mail::to($event->workJob->email)->queue(new WorkJobStatusChangedMail(
            $event->workJob,
            $event->status,
            $event->message,
        ));
    }
}
