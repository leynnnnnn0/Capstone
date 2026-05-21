<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Product3DModel extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\Product3DModelFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $table = 'product_3d_models';

    protected $fillable = [
        'product_id',
        'file_path',
        'original_name',
        'file_size',
        'mime_type',
        'is_default',
        'material_targets',
    ];

    protected $casts = [
        'file_size'        => 'integer',
        'is_default'       => 'boolean',
        'material_targets' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
