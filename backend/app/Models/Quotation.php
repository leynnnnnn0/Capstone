<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    /** @use HasFactory<\Database\Factories\QuotationFactory> */
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'discount',
        'notes',
    ];

    public function quotation_items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
