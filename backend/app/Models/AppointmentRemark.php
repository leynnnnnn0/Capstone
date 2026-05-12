<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentRemark extends Model
{
    protected $fillable = [
        'appointment_id',
        'user_id',
        'action',
        'message',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
