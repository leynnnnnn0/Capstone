<?php

namespace App\Listeners;

use App\Events\AppointmentBooked;
use App\Events\AppointmentCancelled;
use App\Events\AppointmentConfirmed;
use App\Events\AppointmentRescheduled;
use App\Events\AppointmentStatusChanged;
use App\Events\AppointmentUpdated;
use App\Events\PaymentRecorded;
use App\Events\PaymentRefunded;
use App\Events\QuotationChanged;
use App\Events\QuotationSigned;
use App\Events\QuotationSignatureInvalidated;
use App\Events\WorkJobChanged;
use App\Services\Realtime\RealtimeNotificationService;

class DispatchRealtimeNotification
{
    public function __construct(
        private readonly RealtimeNotificationService $realtime
    ) {}

    public function handle(object $event): void
    {
        match (true) {
            $event instanceof AppointmentBooked => $this->realtime->appointmentChanged(
                $event->appointment,
                'booked',
                'A new appointment was booked.',
                $event->actor
            ),
            $event instanceof AppointmentConfirmed => $this->realtime->appointmentChanged(
                $event->appointment,
                'confirmed',
                'Appointment confirmed and scheduled.',
                $event->actor
            ),
            $event instanceof AppointmentCancelled => $this->realtime->appointmentChanged(
                $event->appointment,
                'cancelled',
                'Appointment cancelled.',
                $event->actor
            ),
            $event instanceof AppointmentRescheduled => $this->realtime->appointmentChanged(
                $event->appointment,
                'rescheduled',
                'Appointment rescheduled.',
                $event->actor
            ),
            $event instanceof AppointmentStatusChanged => $this->realtime->appointmentChanged(
                $event->appointment,
                $event->status->value,
                $event->message,
                $event->actor
            ),
            $event instanceof AppointmentUpdated => $this->realtime->appointmentChanged(
                $event->appointment,
                'updated',
                $event->message,
                $event->actor
            ),
            $event instanceof WorkJobChanged => $this->realtime->workJobChanged(
                $event->workJob,
                $event->action,
                $event->message,
                $event->actor
            ),
            $event instanceof PaymentRecorded => $this->realtime->paymentRecorded(
                $event->payment,
                $event->workJob,
                $event->message,
                $event->actor
            ),
            $event instanceof PaymentRefunded => $this->realtime->paymentRefunded(
                $event->payment,
                $event->refund,
                $event->workJob,
                $event->message,
                $event->actor
            ),
            $event instanceof QuotationChanged => $this->realtime->quotationChanged(
                $event->quotation,
                $event->action,
                $event->message,
                $event->actor
            ),
            $event instanceof QuotationSigned => $this->realtime->quotationChanged(
                $event->quotation,
                'signed',
                'Customer signed the quotation.',
                $event->actor
            ),
            $event instanceof QuotationSignatureInvalidated => $this->realtime->quotationChanged(
                $event->quotation,
                'signature_invalidated',
                $event->reason,
                $event->actor
            ),
            default => null,
        };
    }
}
