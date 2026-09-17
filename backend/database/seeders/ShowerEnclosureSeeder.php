<?php

namespace Database\Seeders;

class ShowerEnclosureSeeder extends PhotoCatalogSeeder
{
    protected string $category = 'Shower Enclosure';

    protected string $assetFolder = 'shower-enclosures';

    protected function products(): array
    {
        return [
            ['Black Frame Frosted Sliding Shower Enclosure', 'Black-framed sliding shower enclosure with full-height frosted privacy panels.', 6000],
            ['White Frame Privacy-Band Shower Enclosure', 'White-framed shower enclosure with a frosted privacy band and a clear upper section.', 5500],
            ['Frameless Clear Roller Sliding Shower Enclosure', 'Clear glass shower enclosure with exposed top rollers, a silver-finish rail, and a circular recessed pull.', 8500],
            ['Silver Frame Striped Privacy Shower Enclosure', 'Silver-framed shower enclosure with fine vertical stripes and a broad frosted privacy band.', 6500],
            ['White Frame Full-Frosted Shower Enclosure', 'White-framed sliding shower enclosure with full frosted glass panels.', 5500],
            ['White Frame Frosted Corner Shower Enclosure', 'Corner shower enclosure with white framing, frosted panels, and a side entry door.', 6500],
            ['Frameless Clear Hinged Shower Enclosure', 'Clear glass shower enclosure with visible hinges and a silver-finish towel-bar style handle.', 8000],
            ['Frameless Frosted Hinged Shower Enclosure', 'Frosted glass shower enclosure with minimal visible hardware and a vertical pull handle.', 8500],
            ['Black Trim Clear Shower Screen', 'Clear shower screen with slim black perimeter trim for an open walk-in layout.', 6500],
            ['Compact Clear Roller Sliding Shower Enclosure', 'Compact clear glass shower enclosure with exposed rollers and a silver-finish top rail.', 8500],
            ['Frameless Privacy-Band Shower Door', 'Clear hinged shower door with a frosted middle band and silver-finish pull handle.', 8000],
            ['Frameless Frosted Roller Shower Enclosure', 'Frosted glass sliding shower enclosure with exposed top hardware and a circular pull.', 9000],
            ['Frameless Clear Corner Shower Enclosure', 'Clear corner shower enclosure with a fixed return panel, hinged door, and minimal silver-finish hardware.', 9000],
            ['Black Grid Glass Shower Partition', 'Clear glass shower partition with a black rectangular grid frame.', 6000],
            ['Silver Corner Sliding Shower Enclosure', 'Silver-framed corner shower enclosure with sliding panels, striped privacy detailing, and tall pull handles.', 7500],
            ['White Frame Frosted Bathroom Partition', 'Wide white-framed frosted bathroom partition with sliding panels and overhead transom panels.', 5500],
            ['Curved Corner Glass Shower Enclosure', 'Curved corner shower enclosure with silver-finish tracks, sliding glass panels, and decorative privacy detailing.', 9500],
            ['White Grid Frosted Shower Partition', 'White grid-framed shower partition with frosted rectangular glass panels.', 5500],
        ];
    }
}
