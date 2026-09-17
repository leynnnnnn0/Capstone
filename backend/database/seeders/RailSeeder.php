<?php

namespace Database\Seeders;

class RailSeeder extends PhotoCatalogSeeder
{
    protected string $category = 'Rail';

    protected string $assetFolder = 'rails';

    protected string $unit = 'meter';

    protected function products(): array
    {
        return [
            ['Silver Post Glass Balcony Railing', 'Clear glass balcony railing with polished silver-finish posts and a continuous rectangular top rail.', 7500],
            ['Silver Glass Stair Railing with Cross Brace', 'Glass stair railing with a silver-finish handrail, glass clamps, and a diagonal metal accent.', 8500],
            ['Silver Frame Glass Landing Railing', 'Clear glass landing railing with rectangular silver-finish posts, top rail, and visible glass clamps.', 7500],
            ['Black Frame Glass Balcony Railing', 'Clear glass balcony railing with black framing and contrasting silver-finish glass clamps.', 7000],
            ['Silver Glass Staircase Railing', 'Clear glass staircase railing with a sloping silver-finish handrail and rectangular support posts.', 8000],
        ];
    }
}
