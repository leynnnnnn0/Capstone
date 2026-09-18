# Window catalog

Ten original PNG references are stored under `../products/windows/product-01` through `product-10`. Numbering matches the supplied Glass window folders. No reference photos were altered.

`WindowSeeder` creates the Window category and ten products. Prices (PHP 4,500–7,500 per square meter) are provisional catalog starting estimates, not researched market prices or binding quotations. Confirm pricing before publishing.

`Window3DModelSeeder` attaches the GLBs listed in `window-models.json`. Both seeders can be rerun without duplicating their records; manually added photos and category assignments are retained.

Rebuild with `python3 backend/database/seeders/assets/models/build_windows.py`, validate with `python3 backend/database/seeders/assets/models/validate_glbs.py`. The shared geometry import also deterministically rebuilds the original screen-door GLB.

Models use meters and Y-up. Overall widths are assumed: 1.4, 1.8, 0.75, 1.1, 1.2, 1.3, 1.95, 1.8, 3.2, and 1.4 meters, respectively. Frame depth is approximately 70 mm; handles, offset tracks, and partly open leaves extend beyond it. These are static visualizations, not measured fabrication drawings. Open casement and awning panels deliberately project beyond the shallow jambs.

Designs reproduce the main visible divisions and finishes, with simplified mesh and hardware. Product 6 models the window only, excluding the adjacent door. Walls, grilles behind windows, furniture, scenery, photo overlays, and ornamental wall trim are excluded. Product 9 represents a six-leaf grid assembly; its photo crops the outer installation.

Seed from `backend`:

```sh
php artisan db:seed --class=WindowSeeder
php artisan db:seed --class=Window3DModelSeeder
```
