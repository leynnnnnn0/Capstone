<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

class Quotation extends Model implements AuditableContract
{
    /** @use HasFactory<\Database\Factories\QuotationFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'appointment_id',
        'discount',
        'notes',
        'customer_signed_at',
        'customer_signature_name',
        'customer_signature_path',
        'customer_signature_hash',
        'customer_signature_ip',
        'customer_signature_user_agent',
        'signature_invalidated_at',
        'signature_invalidated_reason',
    ];

    protected $casts = [
        'customer_signed_at' => 'datetime',
        'signature_invalidated_at' => 'datetime',
    ];

    public function quotation_items()
    {
        return $this->hasMany(QuotationItem::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function approvedSignatureHash(): string
    {
        $items = $this->relationLoaded('quotation_items')
            ? $this->quotation_items
            : $this->quotation_items()->with('options')->get();

        $payload = $items
            ->where('status', 'approved')
            ->sortBy('id')
            ->map(fn (QuotationItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->name,
                'description' => $item->description,
                'width' => (string) $item->width,
                'height' => (string) $item->height,
                'thickness' => (string) $item->thickness,
                'pieces' => (int) $item->pieces,
                'amount_per_piece' => (string) $item->amount_per_piece,
                'options_amount' => (string) $item->options_amount,
                'total_amount' => (string) $item->total_amount,
                'options' => $item->options
                    ->sortBy('id')
                    ->map(fn (QuotationItemOption $option) => [
                        'group' => $option->group_name,
                        'option' => $option->option_name,
                        'price_modifier' => (string) $option->price_modifier,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        return hash('sha256', json_encode([
            'discount' => (string) ($this->discount ?? 0),
            'items' => $payload,
        ], JSON_THROW_ON_ERROR));
    }

    public function signatureStatus(): string
    {
        if (! $this->customer_signed_at) {
            return 'unsigned';
        }

        if ($this->customer_signature_hash !== $this->approvedSignatureHash()) {
            return 'needs_resign';
        }

        if ($this->signature_invalidated_at && $this->signature_invalidated_at->greaterThan($this->customer_signed_at)) {
            return 'needs_resign';
        }

        return 'signed';
    }

    public function invalidateSignature(string $reason): bool
    {
        if (! $this->customer_signed_at) {
            return false;
        }

        $fresh = $this->fresh(['quotation_items.options']);

        if ($fresh->customer_signature_hash === $fresh->approvedSignatureHash()) {
            return false;
        }

        $fresh->forceFill([
            'signature_invalidated_at' => now(),
            'signature_invalidated_reason' => $reason,
        ])->save();

        $this->setRawAttributes($fresh->getAttributes(), true);

        return true;
    }
}
