<?php
// app/Http/Controllers/Products/ProductController.php

namespace App\Http\Controllers\Products;

use App\Http\Controllers\Controller;
use App\Http\Requests\Products\StoreProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['categories', 'product_images'])
            ->when(
                $request->search,
                fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
            )
            ->when(
                $request->has('is_active'),
                fn($q) =>
                $q->where('is_active', $request->boolean('is_active'))
            )
            ->when(
                $request->category_id,
                fn($q) =>
                $q->whereHas(
                    'categories',
                    fn($q) =>
                    $q->where('categories.id', $request->category_id)
                )
            )
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json(ProductResource::collection($products));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = $this->productService->create(
                $request->validated(),
                $request->allFiles()
            );

            return response()->json([
                'message' => 'Product created successfully.',
                'data'    => new ProductResource($product),
            ], 201);
        } catch (Throwable $e) {
            Log::error('Failed to create product', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while creating the product.',
            ], 500);
        }
    }

    public function show(Product $product): JsonResponse
    {
        $product->load([
            'categories',
            'product_images',
            'product_variants.product_variant_images',
            'product_option_groups.product_options',
        ]);

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $product = $this->productService->update(
                $product,
                $request->validated()
            );

            return response()->json([
                'message' => 'Product updated successfully.',
                'data'    => new ProductResource($product),
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to update product', [
                'product_id' => $product->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while updating the product.',
            ], 500);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $this->productService->delete($product);

            return response()->json([
                'message' => 'Product removed successfully.',
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to delete product', [
                'product_id' => $product->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Something went wrong while removing the product.',
            ], 500);
        }
    }
}
