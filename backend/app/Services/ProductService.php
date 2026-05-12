<?php
// app/Services/ProductService.php

namespace App\Services;

use App\Models\Product;
use App\Models\QuotationItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductService
{
    public function create(array $data, array $files = []): Product
    {
        return DB::transaction(function () use ($data, $files) {

            // 1 — Create product
            $product = Product::create([
                'name'           => $data['name'],
                'description'    => $data['description'],
                'unit'           => $data['unit'],
                'price_per_unit' => $data['price_per_unit'],
                'is_active'      => $data['is_active'] ?? true,
            ]);

            // 2 — Attach categories
            if (!empty($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            // 3 — Upload product images
            if (!empty($files['images'])) {
                foreach ($files['images'] as $image) {
                    $path = $image->store("products/{$product->id}", 'public');
                    $product->product_images()->create(['image_path' => $path]);
                }
            }

            // 4 — Create variants with their images
            if (!empty($data['variants'])) {
                foreach ($data['variants'] as $index => $variantData) {
                    $variant = $product->product_variants()->create([
                        'width'     => $variantData['width'],
                        'height'    => $variantData['height'],
                        'price'     => $variantData['price'],
                        'is_active' => $variantData['is_active'] ?? true,
                    ]);

                    if (!empty($files['variants'][$index]['images'])) {
                        foreach ($files['variants'][$index]['images'] as $image) {
                            $path = $image->store(
                                "products/{$product->id}/variants/{$variant->id}",
                                'public'
                            );
                            $variant->product_variant_images()->create([
                                'image_path' => $path,
                            ]);
                        }
                    }
                }
            }

            // 5 — Create option groups with options
            if (!empty($data['option_groups'])) {
                foreach ($data['option_groups'] as $groupData) {
                    $group = $product->product_option_groups()->create([
                        'name'        => $groupData['name'],
                        'is_required' => $groupData['is_required'] ?? false,
                        'sort_order'  => $groupData['sort_order'] ?? 0,
                    ]);

                    if (!empty($groupData['options'])) {
                        foreach ($groupData['options'] as $option) {
                            $group->product_options()->create([
                                'name'           => $option['name'],
                                'price_modifier' => $option['price_modifier'],
                                'sort_order'     => $option['sort_order'] ?? 0,
                                'is_active'      => $option['is_active'] ?? true,
                            ]);
                        }
                    }
                }
            }

            return $product->load([
                'categories',
                'product_images',
                'product_variants.product_variant_images',
                'product_option_groups.product_options',
            ]);
        });
    }

    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update(array_filter([
                'name'           => $data['name'] ?? null,
                'description'    => $data['description'] ?? null,
                'unit'           => $data['unit'] ?? null,
                'price_per_unit' => $data['price_per_unit'] ?? null,
                'is_active'      => $data['is_active'] ?? null,
            ], fn($v) => !is_null($v)));

            if (isset($data['category_ids'])) {
                $product->categories()->sync($data['category_ids']);
            }

            return $product->load([
                'categories',
                'product_images',
                'product_variants.product_variant_images',
                'product_option_groups.product_options',
            ]);
        });
    }

    public function addImages(Product $product, array $images): Product
    {
        foreach ($images as $image) {
            $path = $image->store("products/{$product->id}", 'public');
            $product->product_images()->create(['image_path' => $path]);
        }

        return $product->load('product_images');
    }

    public function deleteImage(int $productId, int $imageId): void
    {
        $image = \App\Models\ProductImage::where('product_id', $productId)
            ->findOrFail($imageId);

        Storage::disk('public')->delete($image->image_path);
        $image->delete();
    }

    public function delete(Product $product): void
    {
        // Delete all images from storage
        foreach ($product->product_images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $product->delete();
    }
}
