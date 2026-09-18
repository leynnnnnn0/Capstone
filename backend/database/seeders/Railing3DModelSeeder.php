<?php

namespace Database\Seeders;

use App\Models\Product;

class Railing3DModelSeeder extends Product3DModelSeeder
{
    public function run(): void
    {
        $models = json_decode(file_get_contents(database_path('seeders/assets/models/railing-models.json')), true, 512, JSON_THROW_ON_ERROR);
        $products = [];
        foreach ($models as $name => $filename) {
            if (basename($filename) !== $filename || ! is_file(database_path('seeders/assets/models/'.$filename))) {
                throw new \RuntimeException('Missing or invalid railing model: '.$filename);
            }
            $products[$name] = Product::where('name', $name)->firstOrFail();
        }
        foreach ($models as $name => $filename) {
            $this->seedModel($products[$name], $filename);
        }
    }
}
