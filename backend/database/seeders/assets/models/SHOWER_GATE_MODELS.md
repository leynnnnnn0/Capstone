# Shower enclosure and straight gate models

Run `python3 backend/database/seeders/assets/models/build_showers_and_gates.py`
from the repository root to regenerate all 26 self-contained GLBs and
`shower-gate-models.json`. Uses standard-library Python and the existing geometry
helpers; importing shared helpers also deterministically rebuilds Hanaloque 01.

The manifest contains all shower products 01–18 and gate products
01, 02, 03, 05, 06, 10, 14, 15. Gate assemblies are planar (all leaves closed),
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
same model records. It does not attach models to the seven unselected gates.
