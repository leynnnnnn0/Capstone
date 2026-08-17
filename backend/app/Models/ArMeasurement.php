<?php

namespace App\Models;

use Database\Factories\ArMeasurementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArMeasurement extends Model
{
    /** @use HasFactory<ArMeasurementFactory> */
    use HasFactory;

    protected $fillable = [
        'ar_measurement_session_id',
        'product_id',
        'object_type',
        'model_id',
        'label',
        'segments_cm',
        'width_cm',
        'height_cm',
        'depth_cm',
        'confidence',
        'points_count',
        'metadata',
        'sort_order',
    ];

    protected $casts = [
        'segments_cm' => 'array',
        'width_cm' => 'float',
        'height_cm' => 'float',
        'depth_cm' => 'float',
        'points_count' => 'integer',
        'metadata' => 'array',
        'sort_order' => 'integer',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ArMeasurementSession::class, 'ar_measurement_session_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function areaSquareMeters(): float
    {
        return round(($this->width_cm * $this->height_cm) / 10_000, 4);
    }

    public function linearMeters(): float
    {
        return round($this->width_cm / 100, 4);
    }
}
