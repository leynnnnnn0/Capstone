<?php

namespace App\Models;

use App\Enums\WorkJobWarrantyStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class WorkJobWarranty extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'warranty_number',
        'work_job_id',
        'user_id',
        'issued_by',
        'starts_at',
        'expires_at',
        'duration_months',
        'status',
        'coverage',
        'terms',
        'notes',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'expires_at' => 'date',
        'duration_months' => 'integer',
        'status' => WorkJobWarrantyStatus::class,
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (WorkJobWarranty $warranty) {
            $warranty->updateQuietly([
                'warranty_number' => sprintf(
                    'WTY-%06d-%s',
                    $warranty->id,
                    now()->format('Ymd')
                ),
            ]);
        });
    }

    public function workJob()
    {
        return $this->belongsTo(WorkJob::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
