<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Product extends Model implements AuditableContract
{
    use Auditable;

    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'unit',           // sqm, meter, piece, set
        'price_per_unit',
        'is_active',
    ];

    protected $casts = [
        'price_per_unit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    public function product_images()
    {
        return $this->hasMany(ProductImage::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function product_variants()
    {
        return $this->hasMany(ProductVariant::class)->orderBy('price');
    }

    public function product_option_groups()
    {
        return $this->hasMany(ProductOptionGroup::class)->orderBy('sort_order');
    }

    public function product_3d_model()
    {
        return $this->hasOne(Product3DModel::class);
    }

    public function product_warranty()
    {
        return $this->hasOne(ProductWarranty::class);
    }

    // Cover image convenience accessor
    public function getCoverImageAttribute(): ?string
    {
        return $this->product_images->first()?->image_path;
    }
}
