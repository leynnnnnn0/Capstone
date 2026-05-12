<?php
// app/Jobs/SendSmsJob.php

namespace App\Jobs;

use App\Services\UniSmsService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendSmsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $recipient,
        public string $message
    ) {}

    public function handle(UniSmsService $sms): void
    {
        $sms->send($this->recipient, $this->message);
    }
}
