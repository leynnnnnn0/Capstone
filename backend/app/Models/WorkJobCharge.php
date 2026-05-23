<?php

namespace App\Models;

use App\Enums\WorkJobChargeStatus;
use App\Enums\WorkJobChargeType;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJobCharge extends Model implements AuditableContract
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'charge_number',
        'work_job_id',
        'created_by',
        'approved_by',
        'title',
        'description',
        'type',
        'status',
        'amount',
        'currency',
        'requires_customer_approval',
        'approved_at',
        'customer_approved_at',
        'metadata',
    ];

    protected $casts = [
        'type' => WorkJobChargeType::class,
        'status' => WorkJobChargeStatus::class,
        'amount' => 'decimal:2',
        'requires_customer_approval' => 'boolean',
        'approved_at' => 'datetime',
        'customer_approved_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (WorkJobCharge $charge) {
            $charge->updateQuietly([
                'charge_number' => sprintf('CHG-%06d-%s', $charge->id, now()->format('Ymd')),
            ]);
        });
    }

    public function workJob()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payableAmount(): float
    {
        if (! $this->status->isPayable()) {
            return 0.0;
        }

        $amount = (float) $this->amount;

        return $this->type->isDiscount() ? -$amount : $amount;
    }
}
