<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductVariantImage extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductVariantImageFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_variant_id',
        'image_path',
    ];

    public function product_variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
