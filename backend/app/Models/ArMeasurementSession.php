<?php

namespace App\Models;

use App\Enums\ArMeasurementSessionStatus;
use Database\Factories\ArMeasurementSessionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ArMeasurementSession extends Model implements AuditableContract
{
    use Auditable;

    /** @use HasFactory<ArMeasurementSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'reference',
        'appointment_id',
        'customer_id',
        'created_by_user_id',
        'source',
        'status',
        'capture_version',
        'capture_mode',
        'overall_confidence',
        'device_metadata',
        'captured_at',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'status' => ArMeasurementSessionStatus::class,
        'device_metadata' => 'array',
        'captured_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (ArMeasurementSession $session) {
            $session->reference ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'reference';
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(ArMeasurement::class)->orderBy('sort_order');
    }
}
