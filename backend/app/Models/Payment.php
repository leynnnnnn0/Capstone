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
}
