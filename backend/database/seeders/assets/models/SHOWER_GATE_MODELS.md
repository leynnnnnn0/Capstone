# Shower enclosure and straight gate models

Run `python3 backend/database/seeders/assets/models/build_showers_and_gates.py`
from the repository root to regenerate all 33 self-contained GLBs and
`shower-gate-models.json`. Uses standard-library Python and the existing geometry
helpers; importing shared helpers also deterministically rebuilds Hanaloque 01.

The manifest contains all shower products 01–18 and gate products
01–15. Gate assemblies are planar (all leaves closed),
without L-shaped fence returns. Shower corner/curved layouts are retained.

Dimensions are illustrative, not site-measured: most shower heights are 2 m,
with a taller transom on 16; widths vary with the reference configuration.
Gates are nominally 2 m tall, mostly 3.2 m wide; pedestrian designs 05 and 10
are narrower. Actual bounds are embedded in each GLB's extras. Glass thickness,
frame profiles and hidden hardware are approximations, not fabrication specs.
Frosted glass uses a translucent rough material; clear glass uses alpha blending
for mobile compatibility. Glass stripes are geometry, wood textures are embedded.
Doors are static, not animated. Walls, fixtures, fencing and building structures
are intentionally omitted. Existing product images and pricing are unchanged.

Run `python3 backend/database/seeders/assets/models/validate_glbs.py` to validate
geometry and binary layout. Run `php artisan db:seed --class=ShowerGate3DModelSeeder`
from backend to attach the models after GateSeeder and ShowerEnclosureSeeder.
DatabaseSeeder already calls these in the correct order. Re-seeding updates the
same model records. All seven previously unselected gates are now included.

September 19 photo corrections: shower 04 uses cylindrical perimeter and pane
profiles; shower 16 has a two-leaf sliding section beside a single fixed panel.
New gate floral motifs and finials are simplified modeled curves, not exact
fabrication patterns. Surrounding fence runs in the photos remain excluded.

September 20 annotated-photo revisions are implemented in
`gate_photo_refinements.py`, called by the same builder. Gates 03, 05–15
(except unchanged 04) were revised: alternating tall/spear bars; mirrored
geometric grilles; two louvered leaves with horizontal pulls; open side margins;
aligned solid panel rows and a raised curved header; botanical side grilles,
wood-edge trim and sculpted finials; a three-leaf privacy gate with a physical
diagonal slot; interrupted lattice pickets; opposing geometric returns.
Gate 14 is now nominally 4.8 m wide. Gate 03 is 2.3 m tall.

Uncertain photo details are explicit modeling assumptions: gate 07 is two
operable leaves with two narrow fixed sidelights; gate 08 is four leaves.
Gate 11 uses a shallow segmental crown over its central pair. These choices
are visual interpretations, not confirmed fabrication specifications.
