<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ProductSeeder extends Seeder
{
    private const SCREEN_DOOR_IMAGES_BY_COLOR = [
        'premium-black' => [
            'products/screen-door/screen-door-01.png',
            'products/screen-door/screen-door-02.png',
            'products/screen-door/screen-door-03.png',
            'products/screen-doors/black-hanaloque-screen-door/black-hanaloque-screen-door-01.png',
            'products/screen-doors/black-hanaloque-screen-door/black-horizontal-rail-screen-door-01.png',
        ],
        'black' => [
            'products/screen-doors/black-hanaloque-screen-door/black-louver-panel-screen-door-02.png',
            'products/screen-doors/black-louver-panel-screen-door/black-diagonal-louver-screen-door-01.png',
            'products/screen-doors/black-louver-panel-screen-door/black-double-louver-screen-door-01.png',
            'products/screen-doors/black-louver-panel-screen-door/black-multi-panel-louver-screen-door-01.png',
            'products/screen-doors/black-louver-panel-screen-door/black-side-panel-screen-door-03.png',
        ],
        'white' => [
            'products/screen-doors/white-hanaloque-screen-door/white-hanaloque-screen-door-01.png',
            'products/screen-doors/white-hanaloque-screen-door/white-sliding-panel-screen-door-01.png',
            'products/screen-doors/white-louver-panel-screen-door/white-diagonal-louver-screen-door-01.png',
            'products/screen-doors/white-louver-panel-screen-door/white-multi-panel-louver-screen-door-01.png',
            'products/screen-doors/white-side-panel-screen-door/white-side-panel-screen-door-03.png',
        ],
        'wood-finish' => [
            'products/screen-doors/wood-finish-louver-panel-screen-door/wood-finish-louver-panel-screen-door-01.png',
            'products/screen-doors/wood-finish-louver-panel-screen-door/wood-finish-sliding-panel-screen-door-01.png',
            'products/screen-doors/wood-finish-screen-door/wood-finish-hanaloque-screen-door-01.png',
            'products/screen-doors/wood-finish-screen-door/wood-finish-multi-panel-screen-door-01.png',
            'products/screen-doors/wood-finish-screen-door/wood-finish-side-panel-screen-door-01.png',
        ],
    ];

    private const PRODUCT_NAME_OVERRIDES = [
        'black-hanaloque-screen-door-01' => 'Premium Black Hanaloque Screen Door 03',
        'black-horizontal-rail-screen-door-01' => 'Premium Black Horizontal Rail Screen Door 01',
    ];

    private const CUSTOMIZED_DOOR_NAME = 'Customized Door';

    private const CUSTOMIZED_DOOR_IMAGE = 'products/screen-door/screen-door-01.png';

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
        $imagePaths = $this->productImages();
        $seededNames = array_map($this->productName(...), $imagePaths);
        $seededNames[] = self::CUSTOMIZED_DOOR_NAME;

        // Remove screen-door products that were seeded by older catalog versions.
        Product::whereHas('product_images', function ($query) {
            $query->where('image_path', 'like', 'products/screen-door/%')
                ->orWhere('image_path', 'like', 'products/screen-doors/%');
        })->whereNotIn('name', $seededNames)->delete();

        foreach ($imagePaths as $imagePath) {
            $product = Product::updateOrCreate(
                ['name' => $this->productName($imagePath)],
                [
                    'description' => $this->productDescription($imagePath),
                    'unit' => 'piece',
                    // Budgetary installed rate for a standard custom screen door.
                    // Final fabrication pricing is still confirmed after measurement.
                    'price_per_unit' => 7500,
                    'is_active' => true,
                ],
            );

            $product->categories()->syncWithoutDetaching([$doorCategory->id]);
            $this->syncSingleProductImage($product, $imagePath, $disk);
        }

        $customizedDoor = Product::updateOrCreate(
            ['name' => self::CUSTOMIZED_DOOR_NAME],
            [
                'description' => 'A made-to-measure door service for customers who need a custom size, color, finish, panel layout, or hardware configuration. The final design and quotation are confirmed after consultation and site measurement.',
                'unit' => 'piece',
                'price_per_unit' => 7500,
                'is_active' => true,
            ],
        );

        $customizedDoor->categories()->syncWithoutDetaching([$doorCategory->id]);
        $this->syncSingleProductImage($customizedDoor, self::CUSTOMIZED_DOOR_IMAGE, $disk);
    }

    /**
     * @return array<int, string>
     */
    private function productImages(): array
    {
        return array_merge(...array_values(self::SCREEN_DOOR_IMAGES_BY_COLOR));
    }

    private function productName(string $imagePath): string
    {
        $filename = pathinfo($imagePath, PATHINFO_FILENAME);

        if (isset(self::PRODUCT_NAME_OVERRIDES[$filename])) {
            return self::PRODUCT_NAME_OVERRIDES[$filename];
        }

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
