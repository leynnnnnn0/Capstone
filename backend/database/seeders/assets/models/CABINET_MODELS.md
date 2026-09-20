# Cabinet models

September 19 corrections: pantry lower-right bay has no table, countertop,
or supporting leg. The louvered overhead cabinet retains its native 0.85 m
height; the public preview no longer imposes a generic 2 m cabinet height
when the product has no explicit dimensions.

These are photo-referenced visualization assets, not fabrication drawings or
measured digital twins. Units are meters, Y is up, front is +Z. All dimensions
are assumed. Hidden geometry is inferred. Products remain priced per meter;
model dimensions do not change their pricing or specification.

Run `python3 backend/database/seeders/assets/models/build_remaining_cabinets.py`
from the project root to regenerate the ten remaining cabinets. The earlier
pantry uses `build_pantry_cabinet.py`. Builders use only Python's standard
library. Importing the shared door geometry also regenerates the original
Hanaloque model deterministically.

Run `python3 backend/database/seeders/assets/models/validate_glbs.py` to check
binary structure, accessors, indices, normals, texture embedding and metadata.
Models are self-contained, with no network texture dependencies.

## Interpretation notes

- Under-stair: angled fronts and one partially extended drawer. Staircase excluded.
- White L-shaped kitchen: overhead storage with open appliance niche, base storage,
  and representative counters. Countertop is a layout aid, not an included quote item.
- Two-tone: reddish wood-finish base, three-drawer module and white overhead run.
  No finished countertop, following the installation reference.
- Analoque wardrobe: closed side towers, drawers and two-tier overhead bridge.
- Louvered overhead: L-shaped run with actual angled slats and gold pulls. The
  model retains an assumed 1.5 m mounting elevation above its floor origin.
- Glossy black: L-shaped storage layout and raised central overhead section.
- Handleless white: U-shaped bases, finger-pull rails and a glass overhead panel.
- Entertainment: lower run, upper bridge, glass tower and cable opening; no TV.
- Sliding glass: two levels, tracks and partially opened panes exposing shelves.
- Customized: representative white wardrobe from the collage, with hanging rail,
  organizer shelves and an extended drawer. This does not define or limit the
  custom-design service.

Room walls, appliances and belongings are excluded. Drawer and door positions
are static, not animated. Dimensions and interpretation notes are also embedded
in each generated GLB's `extras` metadata. Cabinet seed data must run before
`Product3DModelSeeder` (already ordered in `DatabaseSeeder`).
