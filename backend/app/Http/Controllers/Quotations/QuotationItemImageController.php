<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Concerns\AuthorizesAssignedWork;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationItemImageResource;
use App\Models\QuotationItem;
use App\Models\QuotationItemImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuotationItemImageController extends Controller
{
    use AuthorizesAssignedWork;

    public function store(Request $request, QuotationItem $quotationItem): JsonResponse
    {
        $quotationItem->loadMissing('quotation.appointment');
        $this->abortIfWorkerNotAssignedToAppointment($request, $quotationItem->quotation->appointment);

        $validated = $request->validate([
            'type' => ['required', 'in:before,after'],
            'caption' => ['nullable', 'string', 'max:255'],
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $created = collect($request->file('images'))->map(function ($image, $index) use ($quotationItem, $validated, $request) {
            $path = $image->store('quotation-item-images', 'public');

            return $quotationItem->images()->create([
                'uploaded_by_id' => $request->user()?->id,
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
        $quotationItemImage->loadMissing('quotation_item.quotation.appointment');
        $this->abortIfWorkerNotAssignedToAppointment(request(), $quotationItemImage->quotation_item->quotation->appointment);
        abort_unless($this->canDeleteImage($quotationItemImage), Response::HTTP_FORBIDDEN, 'You can only delete photos that you uploaded.');

        Storage::disk('public')->delete($quotationItemImage->image_path);
        $quotationItemImage->delete();

        return response()->json([
            'message' => 'Image deleted successfully.',
        ]);
    }

    private function canDeleteImage(QuotationItemImage $quotationItemImage): bool
    {
        $user = request()->user();

        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $quotationItemImage->uploaded_by_id === $user->id;
    }
}
