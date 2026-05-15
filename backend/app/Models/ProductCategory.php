<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductCategory extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductCategoryFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'category_id',
        'product_id'
    ];
}
