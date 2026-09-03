<?php

namespace App\Http\Controllers\Quotations;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuotationItemImageResource;
use App\Models\QuotationItem;
use App\Models\QuotationItemImage;
use App\Models\WorkJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class QuotationItemImageController extends Controller
{
    public function store(Request $request, QuotationItem $quotationItem): JsonResponse
    {
        $this->authorizeWorkerForQuotationItem($request, $quotationItem);

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
        $this->authorizeWorkerForQuotationItem(request(), $quotationItemImage->quotation_item);
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

    private function authorizeWorkerForQuotationItem(Request $request, QuotationItem $quotationItem): void
    {
        $quotationItem->loadMissing('quotation.appointment.workers');
        $user = $request->user();

        if (! $user?->isWorker() || $user->isOperationsAdmin()) {
            return;
        }

        $assignedToAppointment = $quotationItem->quotation->appointment?->workers->contains('id', $user->id) ?? false;
        $assignedToWorkJob = WorkJob::query()
            ->where('quotation_id', $quotationItem->quotation_id)
            ->whereHas('workers', fn ($query) => $query->whereKey($user->id))
            ->exists();

        abort_unless(
            $assignedToAppointment || $assignedToWorkJob,
            Response::HTTP_FORBIDDEN,
            'This quotation item is not assigned to you.'
        );
    }
}
