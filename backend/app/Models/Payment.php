<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Payment extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'payment_number',
        'work_job_id',
        'quotation_id',
        'payer_id',
        'created_by',
        'type',
        'method',
        'status',
        'amount',
        'currency',
        'provider',
        'provider_order_id',
        'provider_capture_id',
        'provider_payer_id',
        'provider_payer_email',
        'paid_at',
        'remarks',
        'metadata',
    ];

    protected $casts = [
        'type' => PaymentType::class,
        'method' => PaymentMethod::class,
        'status' => PaymentStatus::class,
        'paid_at' => 'datetime',
        'metadata' => 'array',
        'amount' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (Payment $payment) {
            $payment->updateQuietly([
                'payment_number' => sprintf('PAY-%06d-%s', $payment->id, now()->format('Ymd')),
            ]);
        });
    }

    public function workJob()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function payer()
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function refunds()
    {
        return $this->hasMany(PaymentRefund::class);
    }

    public function completedRefunds()
    {
        return $this->hasMany(PaymentRefund::class)
            ->where('status', PaymentRefund::STATUS_COMPLETED);
    }

    public function capturedForRevenue(): bool
    {
        return in_array($this->status, [
            PaymentStatus::Paid,
            PaymentStatus::PartiallyRefunded,
            PaymentStatus::Refunded,
        ], true);
    }

    public function refundedAmount(): float
    {
        $refunds = $this->relationLoaded('refunds')
            ? $this->refunds
            : $this->completedRefunds()->get();

        return (float) $refunds
            ->filter(fn (PaymentRefund $refund) => $refund->status === PaymentRefund::STATUS_COMPLETED)
            ->sum(fn (PaymentRefund $refund) => (float) $refund->amount);
    }

    public function netAmount(): float
    {
        if (! $this->capturedForRevenue()) {
            return 0;
        }

        return max((float) $this->amount - $this->refundedAmount(), 0);
    }

    public function refundableAmount(): float
    {
        return $this->capturedForRevenue()
            ? $this->netAmount()
            : 0;
    }

    public function canRefund(): bool
    {
        return $this->refundableAmount() > 0;
    }
}
