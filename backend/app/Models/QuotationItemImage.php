<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationItemImage extends Model
{
    /** @use HasFactory<\Database\Factories\QuotationItemImageFactory> */
    use HasFactory;

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
