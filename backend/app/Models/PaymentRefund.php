<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class PaymentRefund extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'refund_number',
        'payment_id',
        'work_job_id',
        'created_by',
        'method',
        'status',
        'amount',
        'currency',
        'provider',
        'provider_refund_id',
        'provider_capture_id',
        'reason',
        'refunded_at',
        'metadata',
    ];

    protected $casts = [
        'method' => PaymentMethod::class,
        'amount' => 'decimal:2',
        'refunded_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (PaymentRefund $refund) {
            $refund->updateQuietly([
                'refund_number' => sprintf('REF-%06d-%s', $refund->id, now()->format('Ymd')),
            ]);
        });
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function workJob()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completed(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }
}
