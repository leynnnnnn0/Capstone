<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class QuotationItem extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\QuotationItemFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'quotation_id',
        'product_id',
        'name',
        'description',
        'width',
        'height',
        'thickness',
        'amount_per_piece',
        'options_amount',    // ← sum of all selected price_modifiers
        'total_amount',      // ← (amount_per_piece + options_amount) * pieces
        'pieces',
        'status',
        'notes',
    ];

    public function options()
    {
        return $this->hasMany(QuotationItemOption::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function images()
    {
        return $this->hasMany(QuotationItemImage::class)->orderBy('sort_order');
    }

    public function before_images()
    {
        return $this->hasMany(QuotationItemImage::class)->where('type', 'before')->orderBy('sort_order');
    }

    public function after_images()
    {
        return $this->hasMany(QuotationItemImage::class)->where('type', 'after')->orderBy('sort_order');
    }
}
