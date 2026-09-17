<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class ModularCabinetSeeder extends Seeder
{
    private const ASSET_ROOT = 'products/modular-cabinets';

    /**
     * Seed the modular cabinet catalog from the supplied SOG project photos.
     *
     * Prices are starting rates per linear meter. Final quotations may vary
     * according to measurements, finish, hardware, layout, and accessories.
     */
    public function run(): void
    {
        $category = Category::updateOrCreate(
            ['name' => 'Modular Cabinet'],
            ['remarks' => 'Custom-fit modular aluminum cabinets for kitchens, wardrobes, entertainment areas, and storage spaces.'],
        );

        $disk = Storage::disk('public');

        foreach ($this->products() as $item) {
            $product = Product::updateOrCreate(
                ['name' => $item['name']],
                [
                    'description' => $item['description'],
                    'unit' => 'meter',
                    'price_per_unit' => $item['price_per_unit'],
                    'is_active' => true,
                ],
            );

            $product->categories()->syncWithoutDetaching([$category->id]);
            $this->syncProductImages($product, $item['images'], $disk);
        }
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     description: string,
     *     price_per_unit: int,
     *     images: array<int, string>
     * }>
     */
    private function products(): array
    {
        return [
            [
                'name' => 'White Under-Stair Pull-Out Cabinet',
                'description' => 'Space-saving white aluminum storage built beneath a staircase, with multiple pull-out drawers for easy access. Starting price per linear meter; final price depends on site measurements, layout, finish, hardware, and accessories.',
                'price_per_unit' => 18000,
                'images' => ['white-under-stair-pull-out-cabinet.jpg'],
            ],
            [
                'name' => 'White L-Shaped Modular Kitchen Cabinet',
                'description' => 'An L-shaped white aluminum kitchen cabinet system with overhead storage, base cabinets, drawers, and appliance-ready spaces. Starting price per linear meter; countertop, appliances, and plumbing work are quoted separately.',
                'price_per_unit' => 18000,
                'images' => ['white-l-shaped-modular-kitchen-cabinet.jpg'],
            ],
            [
                'name' => 'Two-Tone Modular Kitchen Cabinet',
                'description' => 'A two-tone modular kitchen cabinet combining clean white overhead cabinets with warm wood-finish base storage. Starting price per linear meter; final price depends on dimensions, finish, hardware, and layout.',
                'price_per_unit' => 17000,
                'images' => ['two-tone-modular-kitchen-cabinet.jpg'],
            ],
            [
                'name' => 'Analoque Brown Walk-In Wardrobe Cabinet',
                'description' => 'A floor-to-ceiling modular wardrobe in analoque brown with overhead compartments, hanging sections, shelves, and drawers. Starting price per linear meter; final price depends on the room layout and internal organizers.',
                'price_per_unit' => 17000,
                'images' => [
                    'analoque-brown-walk-in-wardrobe-cabinet-open.jpg',
                    'analoque-brown-walk-in-wardrobe-cabinet-closed.jpg',
                ],
            ],
            [
                'name' => 'White Louvered Overhead Kitchen Cabinet',
                'description' => 'White overhead aluminum kitchen cabinets with louver-style fronts and gold-tone handles for a bright, classic finish. Starting price per linear meter; final price depends on dimensions and selected fittings.',
                'price_per_unit' => 15000,
                'images' => ['white-louvered-overhead-kitchen-cabinet.jpg'],
            ],
            [
                'name' => 'Glossy Black Modular Kitchen Cabinet',
                'description' => 'A sleek glossy black aluminum kitchen system with overhead and base storage, designed around cooking appliances and work areas. Starting price per linear meter; countertop and appliances are quoted separately.',
                'price_per_unit' => 20000,
                'images' => ['glossy-black-modular-kitchen-cabinet.jpg'],
            ],
            [
                'name' => 'Handleless White Modular Kitchen Cabinet',
                'description' => 'A modern handleless white modular kitchen with upper and lower storage and an efficient U-shaped work area. Starting price per linear meter; final price depends on site measurements, hardware, and accessories.',
                'price_per_unit' => 20000,
                'images' => ['handleless-white-modular-kitchen-cabinet.jpg'],
            ],
            [
                'name' => 'White Modular Entertainment Cabinet',
                'description' => 'A built-in white entertainment cabinet with concealed lower storage, overhead cabinets, and a glass display tower. Starting price per linear meter; television, electronics, and electrical work are not included.',
                'price_per_unit' => 18000,
                'images' => ['white-modular-entertainment-cabinet.jpg'],
            ],
            [
                'name' => 'White Sliding Glass Storage Cabinet',
                'description' => 'A tall white aluminum storage cabinet with sliding glass doors and open shelving, suitable for utility, pantry, or display use. Starting price per linear meter; final price depends on size, glass, finish, and shelf configuration.',
                'price_per_unit' => 14000,
                'images' => ['white-sliding-glass-storage-cabinet.jpg'],
            ],
            [
                'name' => 'White Glass-Front Pantry Cabinet',
                'description' => 'A white modular pantry and display cabinet with glass-front doors, enclosed overhead storage, and a central counter space. Starting price per linear meter; final price depends on dimensions, glass, hardware, and accessories.',
                'price_per_unit' => 16000,
                'images' => ['white-glass-front-pantry-cabinet.jpg'],
            ],
            [
                'name' => 'Customized Modular Cabinet',
                'description' => 'A made-to-measure modular cabinet service for any preferred look, size, layout, and storage need. Choose from powder-coated white, analoque brown, and wood finishes, with aluminum-and-glass configurations for kitchens, wardrobes, entertainment areas, under-stair storage, and more. Starting price per linear meter; the final quotation follows an ocular visit and confirmed design specifications.',
                'price_per_unit' => 18000,
                'images' => ['customized-modular-cabinet.jpg'],
            ],
        ];
    }

    /**
     * @param  array<int, string>  $filenames
     */
    private function syncProductImages(Product $product, array $filenames, FilesystemAdapter $disk): void
    {
        $imagePaths = [];

        foreach ($filenames as $sortOrder => $filename) {
            $imagePath = self::ASSET_ROOT.'/'.$filename;
            $sourcePath = database_path('seeders/assets/'.$imagePath);

            if (file_exists($sourcePath)) {
                $disk->put($imagePath, file_get_contents($sourcePath));
            }

            $product->product_images()->updateOrCreate(
                ['image_path' => $imagePath],
                ['sort_order' => $sortOrder],
            );

            $imagePaths[] = $imagePath;
        }

        $product->product_images()
            ->whereNotIn('image_path', $imagePaths)
            ->delete();
    }
}
