<?php

namespace App\Listeners;

use App\Events\WorkJobCreated;
use App\Services\UniSmsService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendWorkJobCreatedNotification implements ShouldQueue
{
    public function __construct(protected UniSmsService $sms) {}

    public function handle(WorkJobCreated $event): void
    {
        $workJob = $event->workJob;

        try {
            if ($workJob->phone_number) {
                $this->sms->send(
                    $workJob->phone_number,
                    sprintf(
                        'Hi %s, your work job (Ref: %s) has been scheduled for %s, from %s to %s. Please contact us if you need to make any changes. Thank you!',
                        $workJob->first_name,
                        $workJob->work_job_number,
                        $this->formatDate($workJob->scheduled_date),
                        $this->formatTime($workJob->scheduled_time_from),
                        $this->formatTime($workJob->scheduled_time_until),
                    )
                );
            }
        } catch (Throwable $e) {
            Log::warning('Failed to send work job creation SMS.', [
                'work_job_id' => $workJob->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function formatDate(mixed $value): string
    {
        return CarbonImmutable::parse($value)->format('M j, Y');
    }

    private function formatTime(mixed $value): string
    {
        return CarbonImmutable::parse($value)->format('g:i A');
    }
}
