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

    /**
     * List products for both admin and public/AR consumers.
     *
     * Filters are deliberately query-string driven so the frontend can reuse the
     * same endpoint for catalog search, active products, and category tabs.
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with([
                'categories',
                'product_images',
                'product_3d_model',
                'product_warranty',
                'product_variants.product_variant_images',
                'product_option_groups.product_options',
            ])
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

    /**
     * Create a product and all nested product data in one request.
     *
     * The controller only validates and handles HTTP responses; ProductService
     * owns the transaction, file storage, 3D model, variants, warranty, and
     * option group sync.
     */
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

    /**
     * Show one product with the same nested relationships needed by details,
     * quote builder, model-viewer fallback, and AR.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load([
            'categories',
            'product_images',
            'product_3d_model',
            'product_warranty',
            'product_variants.product_variant_images',
            'product_option_groups.product_options',
        ]);

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Update product metadata and nested records.
     *
     * Laravel cannot PUT multipart uploads cleanly in every client, so the
     * frontend may send POST + _method=PUT. The validated payload is normalized
     * here before ProductService performs the actual sync.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['deleted_image_ids'] = $request->input('deleted_image_ids', []);

            foreach ($request->input('variants', []) as $index => $variant) {
                if (isset($variant['deleted_image_ids'])) {
                    $data['variants'][$index]['deleted_image_ids'] = $variant['deleted_image_ids'];
                }
            }

            $product = $this->productService->update(
                $product,
                $data,
                $request->allFiles()
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

    /**
     * Delete product records and let ProductService clean related storage.
     */
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
