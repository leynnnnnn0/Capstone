<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Services\Pdf\BrowsershotConfigurator;
use Spatie\LaravelPdf\Facades\Pdf;

class QuotationPdfController extends Controller
{
    public function __invoke(Quotation $quotation)
    {
        $quotation->load([
            'appointment',
            'quotation_items.options',
        ]);

        $approvedItems = $quotation->quotation_items
            ->where('status', 'approved')
            ->values();

        $subtotal = $approvedItems->sum(fn ($item) => (float) $item->total_amount);
        $discount = min((float) ($quotation->discount ?? 0), $subtotal);
        $total = $subtotal - $discount;

        return Pdf::view('pdf.quotation', [
            'quotation' => $quotation,
            'appointment' => $quotation->appointment,
            'items' => $approvedItems,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $total,
        ])
            ->format('a4')
            ->margins(16, 16, 16, 16)
            ->withBrowsershot(fn ($browsershot) => app(BrowsershotConfigurator::class)->configure($browsershot))
            ->download("quotation-{$quotation->id}.pdf");
    }
}
