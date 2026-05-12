<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariantImage extends Model
{
    /** @use HasFactory<\Database\Factories\ProductVariantImageFactory> */
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'image_path',
    ];

    public function product_variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
