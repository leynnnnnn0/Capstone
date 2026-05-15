<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductVariant extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductVariantFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_id',
        'width',
        'height',
        'thickness',
        'price',
        'is_active',
    ];

    protected $casts = [
        'width'     => 'decimal:2',
        'height'    => 'decimal:2',
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function product_variant_images()
    {
        return $this->hasMany(ProductVariantImage::class);
    }
}
