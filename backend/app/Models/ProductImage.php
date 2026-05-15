<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class ProductImage extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\ProductImageFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'product_id',
        'image_path',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
