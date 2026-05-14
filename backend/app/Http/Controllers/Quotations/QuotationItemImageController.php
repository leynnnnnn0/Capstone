<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationItemImageResource;
use App\Models\QuotationItem;
use App\Models\QuotationItemImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuotationItemImageController extends Controller
{
    public function store(Request $request, QuotationItem $quotationItem): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:before,after'],
            'caption' => ['nullable', 'string', 'max:255'],
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $created = collect($request->file('images'))->map(function ($image, $index) use ($quotationItem, $validated) {
            $path = $image->store('quotation-item-images', 'public');

            return $quotationItem->images()->create([
                'image_path' => $path,
                'type' => $validated['type'],
                'caption' => $validated['caption'] ?? null,
                'sort_order' => $index,
            ]);
        });

        return response()->json([
            'message' => 'Images uploaded successfully.',
            'data' => QuotationItemImageResource::collection($created),
        ], 201);
    }

    public function destroy(QuotationItemImage $quotationItemImage): JsonResponse
    {
        Storage::disk('public')->delete($quotationItemImage->image_path);
        $quotationItemImage->delete();

        return response()->json([
            'message' => 'Image deleted successfully.',
        ]);
    }
}
