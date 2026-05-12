<?php
namespace App\Services;

use App\Models\Appointment;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\QuotationItemOption;
use Illuminate\Support\Facades\DB;

class QuotationService
{
    public function create(array $data): Quotation
    {
        return DB::transaction(function () use ($data) {
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
    }

    public function update(Quotation $quotation, array $data): Quotation
    {
        return DB::transaction(function () use ($quotation, $data) {
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
    }

    public function updateItemStatus(QuotationItem $item, string $status): QuotationItem
    {
        $item->update(['status' => $status]);
        return $item->fresh();
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
