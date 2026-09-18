# Railing models

All five Rail catalog photos have standalone GLBs. Regenerate with
`python3 backend/database/seeders/assets/models/build_railings.py` from the repo
root. This also writes `railing-models.json` for `Railing3DModelSeeder`.

Dimensions are approximate, in meters, Y-up. The assumed handrail height is
1.1 m above mounting level. Balcony 01 is a user-requested L-shaped design with
a 4 m main run (four glass sections) and 2 m return (two glass sections).
Landing 03 spans 2 m with four glass sections,
stair railings 02 and 05 have 2 m and 2.4 m horizontal runs with assumed slopes.
Black balcony 04 includes a 1.2 m perpendicular return (three sections) on a
2.4 m main run (four sections).
Straight assemblies have 0.12 m overall depth at mounting plates, with 0.05 m
posts; the corner model's greater depth is its return, not thick framing.

Glass, square posts, rectangular handrails, clamps, rubber pads, mounting feet,
and fasteners are modeled. Stairs, slabs, walls, and surrounding architecture
are excluded. These are visualization approximations, not structural designs,
safety certifications, or fabrication measurements. Site measurements, glass
specification, mounting and hardware design must be confirmed independently.

Seed after RailSeeder using `php artisan db:seed --class=Railing3DModelSeeder`
from backend. DatabaseSeeder includes this order. Seeding is repeatable and
preserves product descriptions, prices and photos. The existing GLB validator
checks geometry and binary structure; the feature test checks all five assets,
repeat seeding, serving, and thin-profile versus corner-return bounds.
