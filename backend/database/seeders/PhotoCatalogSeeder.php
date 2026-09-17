<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

abstract class PhotoCatalogSeeder extends Seeder
{
    protected string $category;

    protected string $assetFolder;

    protected string $unit = 'sqm';

    /** @return array<int, array{0: string, 1: string, 2: int}> */
    abstract protected function products(): array;

    public function run(): void
    {
        $items = [];
        foreach ($this->products() as $index => [$name, $description, $price]) {
            $number = sprintf('%02d', $index + 1);
            $folder = 'products/'.$this->assetFolder.'/product-'.$number;
            $sources = glob(database_path('seeders/assets/'.$folder).'/*') ?: [];
            $sources = array_values(array_filter($sources, fn ($path) => is_file($path)
                && in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'webp'], true)));
            natsort($sources);
            if ($sources === []) {
                throw new \RuntimeException('Missing catalog images: '.$folder);
            }
            foreach ($sources as $source) {
                if (! is_readable($source) || getimagesize($source) === false) {
                    throw new \RuntimeException('Invalid catalog image: '.$source);
                }
            }
            $items[] = [$name.' '.$number, $description, $price, $folder, array_values($sources)];
        }

        $disk = Storage::disk('public');
        DB::transaction(function () use ($items, $disk) {
            $category = Category::firstOrCreate(
                ['name' => $this->category],
                ['remarks' => 'Made-to-measure '.$this->category.' designs. Final specifications and prices are confirmed by quotation.'],
            );
            foreach ($items as [$name, $description, $price, $folder, $sources]) {
                $basis = $this->unit === 'meter' ? 'linear meter' : 'square meter';
                $product = Product::updateOrCreate(['name' => $name], [
                    'description' => $description.' Estimated starting price per '.$basis.'; final quotation depends on site measurements, materials, finish, hardware, and installation requirements. Surrounding structures, fixtures, and accessories in the photo are not included unless specified in the quotation.',
                    'unit' => $this->unit,
                    'price_per_unit' => $price,
                    'is_active' => true,
                ]);
                $product->categories()->syncWithoutDetaching([$category->id]);
                foreach ($sources as $sortOrder => $source) {
                    $path = $folder.'/'.basename($source);
                    if (! $disk->put($path, file_get_contents($source))) {
                        throw new \RuntimeException('Unable to store catalog image: '.$path);
                    }
                    $product->product_images()->updateOrCreate(
                        ['image_path' => $path],
                        ['sort_order' => $sortOrder],
                    );
                }
                // Keep any manually added photos and category assignments.
            }
        });
    }
}
