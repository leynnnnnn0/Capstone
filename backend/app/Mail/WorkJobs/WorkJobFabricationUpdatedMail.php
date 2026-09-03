<?php

namespace App\Mail\WorkJobs;

use App\Enums\FabricationStatus;
use App\Models\WorkJob;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WorkJobFabricationUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly WorkJob $workJob,
        public readonly FabricationStatus $status,
        public readonly string $statusMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Work Job {$this->workJob->work_job_number}: Fabrication {$this->status->label()}",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.work-jobs.fabrication-updated');
    }
}
