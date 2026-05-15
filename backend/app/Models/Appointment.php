<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Appointment extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\AppointmentFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'user_id',
        'appointment_number',
        'first_name',
        'last_name',
        'phone_number',
        'email', // nullable

        'address',
        'address_pinned', // nullable
        'address_lat', // nullable
        'address_lng', // nullable

        'preferred_date',
        'preferred_time', // morning, afternoon

        'service_type',
        'service_type_other', // nullable

        'additional_notes', // nullable

        'appointment_date', // nullable 
        'appointment_time_from', // nullable
        'appointment_time_until', // nullable

        'status', // default 'pending'
        'consent', // boolean true

        'consent_given_at'
    ];

    protected $casts = [
        'status' => AppointmentStatus::class,
    ];

    public function remarks()
    {
        return $this->hasMany(AppointmentRemark::class)->latest();
    }

    public function workers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'appointment_workers');
    }

    public function quotation()
    {
        return $this->hasOne(Quotation::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (Appointment $appointment) {
            $appointment->updateQuietly([
                'appointment_number' => sprintf(
                    'APT-%06d-%s',
                    $appointment->id,
                    now()->format('Ymd')
                ),
            ]);
        });
    }
}
