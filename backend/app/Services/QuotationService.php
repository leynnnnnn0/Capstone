<?php
namespace App\Services;

use App\Events\QuotationChanged;
use App\Events\QuotationSignatureInvalidated;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\QuotationItemOption;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class QuotationService
{
    public function create(array $data, ?User $actor = null): Quotation
    {
        $quotation = DB::transaction(function () use ($data) {
            $quotation = Quotation::create([
                'appointment_id' => $data['appointment_id'],
                'notes'          => $data['notes'] ?? null,
                'discount'       => $data['discount'] ?? 0,
            ]);

            $this->syncItems($quotation, $data['items']);

            return $quotation->load([
                'appointment',
                'quotation_items.options',
                'quotation_items.before_images',
                'quotation_items.after_images',
            ]);
        });

        QuotationChanged::dispatch($quotation, 'created', 'Quotation created.', $actor);

        return $quotation;
    }

    public function update(Quotation $quotation, array $data, ?User $actor = null): Quotation
    {
        $quotation = DB::transaction(function () use ($quotation, $data) {
            $quotation->update([
                'notes'    => $data['notes'] ?? null,
                'discount' => $data['discount'] ?? 0,
            ]);

            // Wipe and re-sync items — quotation items are
            // replaced entirely on every update
            $quotation->quotation_items()->delete();
            $this->syncItems($quotation, $data['items']);

            return $quotation->load([
                'appointment',
                'quotation_items.options',
                'quotation_items.before_images',
                'quotation_items.after_images',
            ]);
        });

        if ($quotation->invalidateSignature('Quotation updated. Please review and sign again.')) {
            QuotationSignatureInvalidated::dispatch($quotation->fresh(['appointment', 'quotation_items.options']), 'Quotation updated. Please review and sign again.', $actor);
        }

        QuotationChanged::dispatch($quotation, 'updated', 'Quotation updated.', $actor);

        return $quotation;
    }

    public function updateItemStatus(QuotationItem $item, string $status, ?User $actor = null): QuotationItem
    {
        $item->update(['status' => $status]);
        $item = $item->fresh(['quotation.appointment']);
        $reason = "Quotation item {$item->name} was updated. Please review and sign again.";
        if ($item->quotation->invalidateSignature($reason)) {
            QuotationSignatureInvalidated::dispatch($item->quotation->fresh(['appointment', 'quotation_items.options']), $reason, $actor);
        }

        QuotationChanged::dispatch(
            $item->quotation,
            "item_{$status}",
            "{$item->name} is now ".str_replace('_', ' ', $status).'.',
            $actor
        );

        return $item;
    }

    private function syncItems(Quotation $quotation, array $items): void
    {
        foreach ($items as $itemData) {
            $item = QuotationItem::create([
                'quotation_id'     => $quotation->id,
                'product_id'       => $itemData['product_id'],
                'name'             => $itemData['name'],
                'description'      => $itemData['description'] ?? null,
                'width'            => $itemData['width'] ?? null,
                'height'           => $itemData['height'] ?? null,
                'thickness'        => $itemData['thickness'] ?? null,
                'pieces'           => $itemData['pieces'],
                'amount_per_piece' => $itemData['amount_per_piece'],
                'options_amount'   => $itemData['options_amount'] ?? 0,
                'total_amount'     => $itemData['total_amount'],
                'notes'            => $itemData['notes'] ?? null,
                'status'           => 'for_acceptance',
            ]);

            foreach ($itemData['selected_options'] ?? [] as $optionData) {
                QuotationItemOption::create([
                    'quotation_item_id'       => $item->id,
                    'product_option_group_id' => $optionData['product_option_group_id'],
                    'product_option_id'       => $optionData['product_option_id'],
                    'group_name'              => $optionData['group_name'],
                    'option_name'             => $optionData['option_name'],
                    'price_modifier'          => $optionData['price_modifier'],
                ]);
            }
        }
    }
}
