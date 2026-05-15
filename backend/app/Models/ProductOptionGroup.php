<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductOptionGroup extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductOptionGroupFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_id',
        'name',        // e.g. "Screen Type", "Glass Type", "Aluminum Frame"
        'is_required', // whether client must pick one
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function product_options()
    {
        return $this->hasMany(ProductOption::class)->orderBy('sort_order');
    }
}
