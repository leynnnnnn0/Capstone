<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class QuotationItemOption extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\QuotationItemOptionFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'quotation_item_id',
        'product_option_group_id',  // e.g. "Screen Type"
        'product_option_id',        // e.g. "Aluminum Screen"

        // Snapshots — critical so old quotes don't change if prices update
        'group_name',               // "Screen Type"
        'option_name',              // "Aluminum Screen"
        'price_modifier',           // 500.00 — locked at time of quoting
    ];

    public function quotation_item()
    {
        return $this->belongsTo(QuotationItem::class);
    }

    public function product_option()
    {
        return $this->belongsTo(ProductOption::class);
    }

    public function product_option_group()
    {
        return $this->belongsTo(ProductOptionGroup::class);
    }
}
