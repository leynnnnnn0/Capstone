<?php
// app/Services/ProductService.php

namespace App\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductService
{
    private const DEFAULT_WARRANTY_DURATION_MONTHS = 12;
    private const DEFAULT_WARRANTY_COVERAGE = 'Covers workmanship concerns found after installation or service completion.';
    private const DEFAULT_WARRANTY_TERMS = 'Warranty claims are subject to SOG Glass & Aluminum inspection and do not cover misuse, accidental damage, or third-party alterations.';

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

            $this->syncWarranty($product, $data['warranty'] ?? []);

            // 3 — Upload product images
            if (!empty($files['images'])) {
                foreach ($files['images'] as $image) {
                    $path = $image->store("products/{$product->id}", 'public');
                    $product->product_images()->create(['image_path' => $path]);
                }
            }

            if (!empty($files['model_3d'])) {
                $this->sync3DModel($product, $files['model_3d']);
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

            return $product->load($this->productRelations());
        });
    }

    public function update(Product $product, array $data, array $files = []): Product
    {
        return DB::transaction(function () use ($product, $data, $files) {
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

            if (array_key_exists('warranty', $data)) {
                $this->syncWarranty($product, $data['warranty'] ?? []);
            }

            if (!empty($files['images'])) {
                foreach ($files['images'] as $image) {
                    $path = $image->store("products/{$product->id}", 'public');
                    $product->product_images()->create(['image_path' => $path]);
                }
            }

            if (!empty($data['deleted_image_ids'])) {
                foreach ($data['deleted_image_ids'] as $imageId) {
                    $this->deleteImage($product->id, $imageId);
                }
            }

            if (!empty($data['delete_3d_model'])) {
                $this->delete3DModel($product);
            }

            if (!empty($files['model_3d'])) {
                $this->sync3DModel($product, $files['model_3d']);
            }

            if (array_key_exists('variants', $data)) {
                $this->syncVariants($product, $data['variants'] ?? [], $files['variants'] ?? []);
            }

            if (array_key_exists('option_groups', $data)) {
                $this->syncOptionGroups($product, $data['option_groups'] ?? []);
            }

            return $product->load($this->productRelations());
        });
    }

    private function syncVariants(Product $product, array $variants, array $variantFiles = []): void
    {
        $keptIds = collect($variants)
            ->pluck('id')
            ->filter()
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $variantsToDelete = $product->product_variants()
            ->when($keptIds, fn($query) => $query->whereNotIn('id', $keptIds))
            ->with('product_variant_images')
            ->get();

        foreach ($variantsToDelete as $variant) {
            foreach ($variant->product_variant_images as $image) {
                Storage::disk('public')->delete($image->image_path);
            }
            $variant->delete();
        }

        foreach ($variants as $index => $variantData) {
            $variant = isset($variantData['id'])
                ? $product->product_variants()->whereKey($variantData['id'])->firstOrFail()
                : $product->product_variants()->make();

            $variant->fill([
                'width'     => $variantData['width'],
                'height'    => $variantData['height'],
                'price'     => $variantData['price'],
                'is_active' => $variantData['is_active'] ?? true,
            ]);
            $variant->save();

            if (!empty($variantData['deleted_image_ids'])) {
                $imagesToDelete = $variant->product_variant_images()
                    ->whereIn('id', $variantData['deleted_image_ids'])
                    ->get();

                foreach ($imagesToDelete as $image) {
                    Storage::disk('public')->delete($image->image_path);
                    $image->delete();
                }
            }

            if (!empty($variantFiles[$index]['images'])) {
                foreach ($variantFiles[$index]['images'] as $image) {
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

    private function syncOptionGroups(Product $product, array $optionGroups): void
    {
        $keptGroupIds = collect($optionGroups)
            ->pluck('id')
            ->filter()
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $product->product_option_groups()
            ->when($keptGroupIds, fn($query) => $query->whereNotIn('id', $keptGroupIds))
            ->delete();

        foreach ($optionGroups as $groupData) {
            $group = isset($groupData['id'])
                ? $product->product_option_groups()->whereKey($groupData['id'])->firstOrFail()
                : $product->product_option_groups()->make();

            $group->fill([
                'name'        => $groupData['name'],
                'is_required' => $groupData['is_required'] ?? false,
                'sort_order'  => $groupData['sort_order'] ?? 0,
            ]);
            $group->save();

            $options = $groupData['options'] ?? [];
            $keptOptionIds = collect($options)
                ->pluck('id')
                ->filter()
                ->map(fn($id) => (int) $id)
                ->values()
                ->all();

            $group->product_options()
                ->when($keptOptionIds, fn($query) => $query->whereNotIn('id', $keptOptionIds))
                ->delete();

            foreach ($options as $option) {
                $productOption = isset($option['id'])
                    ? $group->product_options()->whereKey($option['id'])->firstOrFail()
                    : $group->product_options()->make();

                $productOption->fill([
                    'name'           => $option['name'],
                    'price_modifier' => $option['price_modifier'],
                    'sort_order'     => $option['sort_order'] ?? 0,
                    'is_active'      => $option['is_active'] ?? true,
                ]);
                $productOption->save();
            }
        }
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
        $product->loadMissing('product_images', 'product_3d_model');

        // Delete all images from storage
        foreach ($product->product_images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $this->delete3DModel($product);

        $product->delete();
    }

    private function sync3DModel(Product $product, mixed $file): void
    {
        if (!$file instanceof UploadedFile) {
            return;
        }

        $this->delete3DModel($product);

        $path = $file->store("products/{$product->id}/models", 'public');

        $product->product_3d_model()->create([
            'file_path'     => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_size'     => $file->getSize(),
            'mime_type'     => $file->getClientMimeType(),
            'is_default'    => true,
        ]);
    }

    private function delete3DModel(Product $product): void
    {
        $model = $product->product_3d_model()->first();

        if (!$model) {
            return;
        }

        Storage::disk('public')->delete($model->file_path);
        $model->delete();
    }

    private function syncWarranty(Product $product, array $data = []): void
    {
        $active = filter_var(
            $data['is_active'] ?? true,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        $product->product_warranty()->updateOrCreate(
            ['product_id' => $product->id],
            [
                'duration_months' => (int) ($data['duration_months'] ?? self::DEFAULT_WARRANTY_DURATION_MONTHS),
                'is_active' => $active ?? true,
                'coverage' => $data['coverage'] ?? self::DEFAULT_WARRANTY_COVERAGE,
                'terms' => $data['terms'] ?? self::DEFAULT_WARRANTY_TERMS,
            ],
        );
    }

    private function productRelations(): array
    {
        return [
            'categories',
            'product_images',
            'product_3d_model',
            'product_warranty',
            'product_variants.product_variant_images',
            'product_option_groups.product_options',
        ];
    }
}
