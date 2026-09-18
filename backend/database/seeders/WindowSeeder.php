<?php

namespace Database\Seeders;

class WindowSeeder extends PhotoCatalogSeeder
{
    protected string $category = 'Window';
    protected string $assetFolder = 'windows';

    protected function products(): array
    {
        return [
            ['Black Double Casement Glass Window', 'Black-framed twin casement glass window with outward-opening leaves.', 6500],
            ['White Six-Panel Awning Window with Screens', 'White three-bay window with six awning glass panels and full-height screen leaves.', 7500],
            ['Black Glass Window with Lower Screen', 'Tall black-framed window with an upper glass panel and lower mesh screen.', 5500],
            ['Black Sliding Window with Transom and Sill Lights', 'Black sliding center window with paired fixed glass panels above and below.', 6000],
            ['Black Twin-Bay Glass Jalousie Window', 'Black two-bay frame with horizontal glass louver blades.', 4500],
            ['Wood Finish Sliding Glass Window', 'Wood-finish sliding glass window. Adjacent door and furniture are excluded.', 6500],
            ['White Triple Awning Glass Window', 'Three white-framed top-hinged awning glass panels in a horizontal assembly.', 6500],
            ['White Arched Transom Sliding Window', 'White sliding glass window topped by a segmented arched fanlight.', 7500],
            ['White Grid Sliding Window with Transom', 'Wide white multi-panel sliding window with decorative grid divisions and upper fixed lights.', 7000],
            ['Black Sliding Glass Window with Screen', 'Black sliding glass window with a separate insect screen track.', 5500],
        ];
    }
}
