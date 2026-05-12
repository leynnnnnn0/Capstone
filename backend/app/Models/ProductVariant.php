<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    /** @use HasFactory<\Database\Factories\ProductVariantFactory> */
    use HasFactory;

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
