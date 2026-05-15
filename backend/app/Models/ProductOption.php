<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductOption extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductOptionFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_option_group_id',
        'name',
        'price_modifier',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'price_modifier' => 'decimal:2',
        'is_active'      => 'boolean',
    ];

    public function group()
    {
        return $this->belongsTo(ProductOptionGroup::class, 'product_option_group_id');
    }
}
