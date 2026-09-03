<?php

namespace App\Mail\WorkJobs;

use App\Enums\WorkJobStatus;
use App\Models\WorkJob;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkJobStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly WorkJobStatus $status,
        public readonly string $statusMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Work Job {$this->workJob->work_job_number}: {$this->status->label()}",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.work-jobs.status-changed');
    }
}
