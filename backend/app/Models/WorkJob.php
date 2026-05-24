<?php
// app/Models/WorkJob.php

namespace App\Models;

use App\Enums\WorkJobBackJobReason;
use App\Enums\WorkJobStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJob extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'work_job_number',
        'user_id',
        'appointment_id',
        'quotation_id',
        'parent_work_job_id',
        'first_name',
        'last_name',
        'phone_number',
        'email',
        'address',
        'address_pinned',
        'address_lat',
        'address_lng',
        'service_type',
        'service_type_other',
        'scheduled_date',
        'scheduled_time_from',
        'scheduled_time_until',
        'status',
        'back_job_reason',
        'back_job_reason_other',
        'back_job_details',
        'notes',
        'is_down_payment_required',
        'down_payment_percentage',
    ];

    protected $casts = [
        'status' => WorkJobStatus::class,
        'back_job_reason' => WorkJobBackJobReason::class,
        'is_down_payment_required' => 'boolean',
        'down_payment_percentage' => 'decimal:2',
    ];

    protected $appends = ['full_name'];

    // ── Boot ──────────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (WorkJob $workJob) {
            $workJob->updateQuietly([
                'work_job_number' => sprintf(
                    'WJ-%06d-%s',
                    $workJob->id,
                    now()->format('Ymd')
                ),
            ]);
        });
    }

    // ── Accessors ─────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    // ── Relationships ─────────────────────────────────────────────

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function parentWorkJob()
    {
        return $this->belongsTo(self::class, 'parent_work_job_id');
    }

    public function backJobs()
    {
        return $this->hasMany(self::class, 'parent_work_job_id');
    }

    public function workers()
    {
        return $this->belongsToMany(User::class, 'work_job_workers');
    }

    public function remarks()
    {
        return $this->hasMany(WorkJobRemark::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function charges()
    {
        return $this->hasMany(WorkJobCharge::class);
    }

    public function rating()
    {
        return $this->hasOne(WorkJobRating::class);
    }
}
