<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class QuotationItemImage extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\QuotationItemImageFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'quotation_item_id',
        'image_path',
        'type',         // 'before' | 'after'
        'sort_order',
        'caption',
    ];

    public function quotation_item()
    {
        return $this->belongsTo(QuotationItem::class);
    }
}
