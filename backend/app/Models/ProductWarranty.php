<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductWarranty extends Model implements AuditableContract
{
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_id',
        'duration_months',
        'is_active',
        'coverage',
        'terms',
    ];

    protected $casts = [
        'duration_months' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
