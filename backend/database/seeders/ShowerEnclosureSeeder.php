<?php

namespace Database\Seeders;

class ShowerEnclosureSeeder extends PhotoCatalogSeeder
{
    protected string $category = 'Shower Enclosure';

    protected string $assetFolder = 'shower-enclosures';

    protected string $unit = 'set';

    protected function products(): array
    {
        return [
            ['Black Frame Frosted Sliding Shower Enclosure', 'Black-framed sliding shower enclosure with full-height frosted privacy panels.', 24000],
            ['White Frame Privacy-Band Shower Enclosure', 'White-framed shower enclosure with a frosted privacy band and a clear upper section.', 20000],
            ['Frameless Clear Roller Sliding Shower Enclosure', 'Clear glass shower enclosure with exposed top rollers, a silver-finish rail, and a circular recessed pull.', 30000],
            ['Silver Frame Striped Privacy Shower Enclosure', 'Silver-framed shower enclosure with fine vertical stripes and a broad frosted privacy band.', 22000],
            ['White Frame Full-Frosted Shower Enclosure', 'White-framed sliding shower enclosure with full frosted glass panels.', 20000],
            ['White Frame Frosted Corner Shower Enclosure', 'Corner shower enclosure with white framing, frosted panels, and a side entry door.', 26000],
            ['Frameless Clear Hinged Shower Enclosure', 'Clear glass shower enclosure with visible hinges and a silver-finish towel-bar style handle.', 26000],
            ['Frameless Frosted Hinged Shower Enclosure', 'Frosted glass shower enclosure with minimal visible hardware and a vertical pull handle.', 28000],
            ['Black Trim Clear Shower Screen', 'Clear shower screen with slim black perimeter trim for an open walk-in layout.', 12000],
            ['Compact Clear Roller Sliding Shower Enclosure', 'Compact clear glass shower enclosure with exposed rollers and a silver-finish top rail.', 24000],
            ['Frameless Privacy-Band Shower Door', 'Clear hinged shower door with a frosted middle band and silver-finish pull handle.', 22000],
            ['Frameless Frosted Roller Shower Enclosure', 'Frosted glass sliding shower enclosure with exposed top hardware and a circular pull.', 30000],
            ['Frameless Clear Corner Shower Enclosure', 'Clear corner shower enclosure with a fixed return panel, hinged door, and minimal silver-finish hardware.', 32000],
            ['Black Grid Glass Shower Partition', 'Clear glass shower partition with a black rectangular grid frame.', 18000],
            ['Silver Corner Sliding Shower Enclosure', 'Silver-framed corner shower enclosure with sliding panels, striped privacy detailing, and tall pull handles.', 28000],
            ['White Frame Frosted Bathroom Partition', 'Wide white-framed frosted bathroom partition with sliding panels and overhead transom panels.', 24000],
            ['Curved Corner Glass Shower Enclosure', 'Curved corner shower enclosure with silver-finish tracks, sliding glass panels, and decorative privacy detailing.', 34000],
            ['White Grid Frosted Shower Partition', 'White grid-framed shower partition with frosted rectangular glass panels.', 20000],
        ];
    }
}
