<?php

namespace App\Mail\Appointments;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentStatusChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Appointment $appointment,
        public readonly AppointmentStatus $status,
        public readonly string $statusMessage,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Appointment {$this->appointment->appointment_number}: {$this->status->label()}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointments.status-changed',
        );
    }
}
