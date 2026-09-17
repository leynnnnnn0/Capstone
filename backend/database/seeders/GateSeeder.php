<?php

namespace Database\Seeders;

class GateSeeder extends PhotoCatalogSeeder
{
    protected string $category = 'Gate';

    protected string $assetFolder = 'gates';

    protected function products(): array
    {
        return [
            ['Black Frame Wood-Finish Panel Gate', 'Black-framed gate with warm wood-look upper panels, open horizontal lower bars, and a pedestrian entry section.', 6500],
            ['Wood-Grain Horizontal Panel Gate', 'Dark-framed entrance gate with alternating wood-grain panels and open horizontal gaps.', 6500],
            ['Black Spear-Top Vertical Bar Gate', 'Black vertical-bar gate with decorative spear-top details and an open grille layout.', 4500],
            ['Black Horizontal Slat Geometric Gate', 'Black horizontal-slat gate with an angled geometric grille band across the middle.', 5500],
            ['Silver Geometric Double Entry Gate', 'Polished silver-finish double entry gate with rectangular geometric grilles and solid lower panels.', 7500],
            ['Dark Louvered Panel Gate', 'Dark-finish entry gate with horizontal louvered upper sections and solid lower panels.', 6000],
            ['Black Open-Bar Entry Gate', 'Black entry gate with horizontal bars, vertical framing, and an open rectangular pattern.', 4500],
            ['Terracotta Grille and Solid Panel Gate', 'Terracotta-finish gate design combining horizontal grille sections with solid lower panels.', 5000],
            ['Red Alternating Horizontal Panel Gate', 'Red-finish gate with broad horizontal panels alternating with slim open bars.', 5000],
            ['Black Frame Brown Accent Gate', 'Black-framed gate with brown horizontal accent panels and open bar sections.', 5500],
            ['Silver Multi-Panel Grille Gate', 'Polished silver-finish multi-panel gate with open upper bars and enclosed lower sections.', 7500],
            ['Silver Floral Wood-Accent Gate', 'Silver-finish double gate with wood-look horizontal panels, floral side grilles, and decorative finials.', 8500],
            ['Red Solid Privacy Gate', 'Red solid-panel privacy gate with slim metallic accent strips and an open upper grille.', 5500],
            ['Black Vertical Bar Lattice Gate', 'Black vertical-bar gate with closely spaced lattice bands at the top and bottom.', 5000],
            ['White Rectangular Geometric Gate', 'White-finish gate with an open geometric pattern of elongated rectangular bars.', 5000],
        ];
    }
}
