<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ProductSeeder extends Seeder
{
    private const SCREEN_DOOR_ASSET_ROOT = 'products';

    private const LEGACY_GROUPED_PRODUCT_NAMES = [
        'Screen Door',
        'Screen Door with Sliding Panel',
        'Black Screen Door with Side Panels',
        'Black Multi-Panel Screen Door',
        'Black Screen Door with Lower Louver Panel',
        'White Hanaloque Screen Door',
        'White Screen Door with Sliding Panel',
        'White Screen Door with Lower Louver Panel',
        'White Double Louver Screen Door',
        'White Multi-Panel Screen Door',
        'White Screen Door with Side Panels',
        'Wood Finish Hanaloque Screen Door',
        'Wood Finish Screen Door with Side Panels',
        'Wood Finish Screen Door with Lower Louver Panel',
        'Wood Finish Screen Door with Sliding Panel',
    ];

    /**
     * Seed one product per cropped screen door image.
     */
    public function run(): void
    {
        $doorCategory = Category::firstOrCreate(
            ['name' => 'Door'],
            ['remarks' => 'Door products and accessories.'],
        );

        Product::whereIn('name', self::LEGACY_GROUPED_PRODUCT_NAMES)->delete();

        $disk = Storage::disk('public');

        foreach ($this->productImages() as $imagePath) {
            $product = Product::updateOrCreate(
                ['name' => $this->productName($imagePath)],
                [
                    'description' => $this->productDescription($imagePath),
                    'unit' => 'piece',
                    'price_per_unit' => 6000,
                    'is_active' => true,
                ],
            );

            $product->categories()->syncWithoutDetaching([$doorCategory->id]);
            $this->syncSingleProductImage($product, $imagePath, $disk);
        }
    }

    /**
     * @return array<int, string>
     */
    private function productImages(): array
    {
        $root = database_path('seeders/assets/'.self::SCREEN_DOOR_ASSET_ROOT);
        $paths = [];

        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));

        foreach ($files as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'png') {
                continue;
            }

            $relativePath = str_replace(
                database_path('seeders/assets').DIRECTORY_SEPARATOR,
                '',
                $file->getPathname(),
            );

            $relativePath = str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
            // Other photo catalogs may also contain PNGs; they are not doors.
            if (str_starts_with($relativePath, 'products/screen-door/')
                || str_starts_with($relativePath, 'products/screen-doors/')) {
                $paths[] = $relativePath;
            }
        }

        sort($paths);

        return $paths;
    }

    private function productName(string $imagePath): string
    {
        $filename = pathinfo($imagePath, PATHINFO_FILENAME);

        if (preg_match('/^screen-door-(\d+)$/', $filename, $matches)) {
            return match ($matches[1]) {
                '03' => 'Premium Black Sliding Panel Screen Door 03',
                default => 'Premium Black Hanaloque Screen Door '.$matches[1],
            };
        }

        return $this->titleFromSlug($filename);
    }

    private function productDescription(string $imagePath): string
    {
        $slug = pathinfo($imagePath, PATHINFO_FILENAME);
        $finish = $this->finishLabel($slug);
        $design = $this->designLabel($slug);

        return "{$finish} {$design} made with durable glass and aluminum framing for a secure, polished door opening. This individual design features a protective diamond-pattern screen that supports airflow and visibility while helping add an extra layer of protection for residential or commercial spaces.";
    }

    private function finishLabel(string $slug): string
    {
        if (str_contains($slug, 'wood-finish')) {
            return 'Wood finish';
        }

        if (str_contains($slug, 'white')) {
            return 'White';
        }

        return 'Black';
    }

    private function designLabel(string $slug): string
    {
        if (str_contains($slug, 'double-louver')) {
            return 'double louver screen door';
        }

        if (str_contains($slug, 'diagonal-louver')) {
            return 'diagonal louver screen door';
        }

        if (str_contains($slug, 'multi-panel-louver')) {
            return 'multi-panel louver screen door';
        }

        if (str_contains($slug, 'louver-panel')) {
            return 'screen door with lower louver panel';
        }

        if (str_contains($slug, 'sliding-panel')) {
            return 'screen door with sliding panel';
        }

        if (str_contains($slug, 'side-panel')) {
            return 'screen door with side panels';
        }

        if (str_contains($slug, 'multi-panel')) {
            return 'multi-panel screen door';
        }

        if (str_contains($slug, 'horizontal-rail')) {
            return 'screen door with horizontal rail';
        }

        return 'Hanaloque screen door';
    }

    private function titleFromSlug(string $slug): string
    {
        $title = str_replace('-', ' ', $slug);

        return implode(' ', array_map(
            fn (string $word): string => is_numeric($word) ? $word : ucfirst($word),
            explode(' ', $title),
        ));
    }

    private function syncSingleProductImage(Product $product, string $imagePath, $disk): void
    {
        $sourcePath = database_path("seeders/assets/{$imagePath}");

        if (file_exists($sourcePath)) {
            $disk->put($imagePath, file_get_contents($sourcePath));
        }

        $product->product_images()
            ->where('image_path', '!=', $imagePath)
            ->delete();

        $product->product_images()->updateOrCreate(
            ['image_path' => $imagePath],
            ['sort_order' => 0],
        );
    }
}
