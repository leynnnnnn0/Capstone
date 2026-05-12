<?php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductImageController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    // Add more images after product creation
    public function store(StoreProductImageRequest $request, Product $product): JsonResponse
    {
        try {
            $product = $this->productService->addImages(
                $product,
                $request->file('images')
            );

            return response()->json([
                'message' => 'Images uploaded successfully.',
                'data'    => ProductImageResource::collection(
                    $product->product_images
                ),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to upload product images', [
                'product_id' => $product->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while uploading images.',
            ], 500);
        }
    }

    // Delete a specific image
    public function destroy(Product $product, int $image): JsonResponse
    {
        try {
            $this->productService->deleteImage($product->id, $image);

            return response()->json([
                'message' => 'Image deleted successfully.',
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to delete product image', [
                'product_id' => $product->id,
                'image_id'   => $image,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while deleting the image.',
            ], 500);
        }
    }
}
