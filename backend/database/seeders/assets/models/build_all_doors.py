"""Generate GLB models for every SOG screen-door catalog product.

The product photos do not include measurements, so the models use a nominal
900 x 2100 mm opening. Geometry is selected from the product filename: full
screen, side-panel, multi-panel, sliding-panel, and several louver layouts.
Existing hand-detailed models are intentionally preserved.

Run with Python 3 from any directory. Only the standard library is required.
"""
import json
import math
import struct
from pathlib import Path

import build_screen_door as core


HERE = Path(__file__).resolve().parent
PRODUCTS = HERE.parent / "products"
PRESERVED = {
    "premium-black-hanaloque-screen-door-01",
    "white-side-panel-screen-door-03",
    "wood-finish-side-panel-screen-door-01",
}


def product_name(path):
    slug = path.stem
    if path.parent.name == "screen-door":
        number = slug.rsplit("-", 1)[-1]
        if number == "03":
            return "Premium Black Sliding Panel Screen Door 03"
        return f"Premium Black Hanaloque Screen Door {number}"
    return " ".join(word if word.isnumeric() else word.capitalize() for word in slug.split("-"))


def slugify(name):
    return name.lower().replace(" ", "-")


def finish_for(name):
    lowered = name.lower()
    if "wood finish" in lowered:
        return "wood"
    if lowered.startswith("white"):
        return "white"
    return "black"


def layout_for(name):
    lowered = name.lower()
    for layout in (
        "diagonal louver", "double louver", "multi panel louver",
        "louver panel", "sliding panel", "side panel", "multi panel",
        "horizontal rail",
    ):
        if layout in lowered:
            return layout.replace(" ", "-")
    return "hanaloque"


def add_frame(beam, label, left, right, bottom, top, width, depth, z, material=0):
    beam(label, material, (left, bottom, z), (left, top, z), width, depth, .0015)
    beam(label, material, (right, bottom, z), (right, top, z), width, depth, .0015)
    beam(label, material, (left-width/2, bottom, z), (right+width/2, bottom, z), width, depth, .0015)
    beam(label, material, (left-width/2, top, z), (right+width/2, top, z), width, depth, .0015)


def add_screen(face, rod, label, left, right, bottom, top, z=.006):
    face(label + " insect mesh", 4, [
        (left, bottom, z), (right, bottom, z), (right, top, z), (left, top, z),
    ])
    # Real open diagonal security grille, clipped to the panel rectangle.
    for slope in (-1.42, 1.42):
        for n in range(-16, 48):
            intercept = n * .112
            hits = []
            for x in (left, right):
                y = slope*x + intercept
                if bottom <= y <= top:
                    hits.append((x, y, .029))
            for y in (bottom, top):
                x = (y-intercept)/slope
                if left < x < right:
                    hits.append((x, y, .029))
            if len(hits) == 2:
                rod(label + " security grille", 1, hits[0], hits[1], .0018, 8)


def add_louvers(beam, label, left, right, bottom, top):
    count = max(3, round((top-bottom)/.085))
    for index in range(count):
        y = bottom + (index+.5)*(top-bottom)/count
        # Slats project forward and overlap slightly in elevation.
        beam(label + " slat", 5, (left, y-.012, .018), (right, y-.012, .018), .058, .040, .002)


def add_panel(beam, rod, face, label, left, right, bottom, top, kind="screen"):
    add_frame(beam, label + " trim", left, right, bottom, top, .014, .019, .024, 1)
    inset = .012
    if kind == "louver":
        add_louvers(beam, label, left+inset, right-inset, bottom+inset, top-inset)
    else:
        add_screen(face, rod, label, left+inset, right-inset, bottom+inset, top-inset)


def build_geometry(name):
    core.groups.clear()
    beam, rod, face = core.beam, core.rod, core.face
    layout = layout_for(name)

    add_frame(beam, "Outer jamb", -.429, .429, .021, 2.079, .042, .062, 0)
    add_frame(beam, "Weather seal", -.403, .403, .047, 2.053, .010, .018, .004, 2)
    add_frame(beam, "Door leaf", -.381, .381, .069, 2.031, .036, .041, .015)

    x0, x1, y0, y1 = -.357, .357, .091, 2.009
    if layout == "hanaloque":
        add_panel(beam, rod, face, "Full height", x0, x1, y0, y1)
    elif layout == "horizontal-rail":
        add_panel(beam, rod, face, "Upper screen", x0, x1, 1.055, y1)
        add_panel(beam, rod, face, "Lower screen", x0, x1, y0, 1.015)
        beam("Wide horizontal rail", 0, (x0, 1.035, .015), (x1, 1.035, .015), .055, .042, .002)
    elif layout in {"side-panel", "multi-panel"}:
        columns = 3 if layout == "side-panel" else 4
        gap = .030
        width = (x1-x0-gap*(columns-1))/columns
        for index in range(columns):
            left = x0+index*(width+gap)
            right = left+width
            add_panel(beam, rod, face, f"Panel {index+1}", left, right, y0, y1)
            if index < columns-1:
                x = right+gap/2
                beam("Vertical mullions", 0, (x, y0, .015), (x, y1, .015), .035, .041, .002)
    elif layout == "sliding-panel":
        # Two slightly offset framed leaves make the sliding construction legible in AR.
        middle = .015
        add_panel(beam, rod, face, "Left sliding leaf", x0, middle+.11, y0, y1)
        add_panel(beam, rod, face, "Right sliding leaf", middle-.11, x1, y0, y1)
        beam("Top sliding track", 3, (x0, 1.993, .058), (x1, 1.993, .058), .030, .075, .003)
        beam("Bottom sliding track", 3, (x0, .107, .058), (x1, .107, .058), .025, .075, .003)
    elif layout == "louver-panel":
        add_panel(beam, rod, face, "Upper screen", x0, x1, .735, y1)
        add_panel(beam, rod, face, "Lower louvers", x0, x1, y0, .695, "louver")
        beam("Louver divider", 0, (x0, .715, .015), (x1, .715, .015), .045, .042, .002)
    elif layout == "double-louver":
        add_panel(beam, rod, face, "Upper screen", x0, x1, 1.035, y1)
        for index, (left, right) in enumerate(((x0, -.015), (.015, x1))):
            add_panel(beam, rod, face, f"Lower louver bank {index+1}", left, right, y0, .995, "louver")
        beam("Center louver mullion", 0, (0, y0, .015), (0, .995, .015), .030, .041, .002)
    elif layout == "diagonal-louver":
        add_panel(beam, rod, face, "Upper screen", x0, x1, .79, y1)
        add_panel(beam, rod, face, "Lower louvers", x0, x1, y0, .75, "louver")
        beam("Diagonal accent", 1, (x0, .75, .043), (x1, 1.22, .043), .035, .024, .002)
    elif layout == "multi-panel-louver":
        rows = ((y0, .615, "louver"), (.655, 1.315, "screen"), (1.355, y1, "screen"))
        for index, (bottom, top, kind) in enumerate(rows):
            add_panel(beam, rod, face, f"Panel row {index+1}", x0, x1, bottom, top, kind)
            if index < 2:
                beam("Horizontal panel rails", 0, (x0, top+.02, .015), (x1, top+.02, .015), .040, .041, .002)

    # Hinges and a two-sided lever lockset are shared across the product family.
    for y in (.25, 1.05, 1.85):
        beam("Hinge leaves", 3, (.391, y-.036, .041), (.391, y+.036, .041), .032, .008, .002)
        rod("Hinge barrels", 3, (.406, y-.042, .050), (.406, y+.042, .050), .0065, 14)
    for direction in (-1, 1):
        z = .015+direction*.028
        beam("Lock backplate", 3, (-.379, .974, z), (-.379, 1.088, z), .027, .009, .002)
        rod("Lever spindle", 3, (-.379, 1.045, z), (-.379, 1.045, z+direction*.025), .007, 14)
        beam("Lever handle", 3, (-.379, 1.045, z+direction*.025), (-.295, 1.045, z+direction*.025), .014, .017, .003)
        rod("Lock cylinder", 3, (-.379, 1.000, z), (-.379, 1.000, z+direction*.006), .009, 16)


def materials(finish):
    if finish == "white":
        frame, trim, hardware = ([.86, .88, .84, 1], [.72, .75, .71, 1], [.43, .46, .44, 1])
    elif finish == "wood":
        frame, trim, hardware = ([.55, .25, .09, 1], [.31, .12, .035, 1], [.10, .07, .05, 1])
    else:
        frame, trim, hardware = ([.027, .034, .039, 1], [.09, .105, .11, 1], [.48, .51, .52, 1])
    values = [
        ("Powder-coated aluminum frame", frame, .62, .33),
        ("Security grille and panel trim", trim, .46, .39),
        ("Weather seal", [.015, .019, .019, 1], 0, .88),
        ("Door hardware", hardware, .78, .27),
        ("Fine woven insect mesh", [.07, .08, .08, .72], 0, .92),
        ("Angled aluminum louvers", frame, .58, .40),
    ]
    return [{
        "name": label,
        "doubleSided": True,
        "pbrMetallicRoughness": {
            "baseColorFactor": color, "metallicFactor": metal, "roughnessFactor": rough,
        },
        **({"alphaMode": "BLEND"} if index == 4 else {}),
    } for index, (label, color, metal, rough) in enumerate(values)]


def write_glb(name, slug, reference):
    build_geometry(name)
    doc = {
        "asset": {"version": "2.0", "generator": "SOG catalog door procedural builder"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": name, "children": []}],
        "meshes": [],
        "materials": materials(finish_for(name)),
        "buffers": [], "bufferViews": [], "accessors": [],
        "extras": {
            "dimensionsMeters": [.9, 2.1, .13], "dimensionsAssumed": True,
            "reference": reference, "layout": layout_for(name), "upAxis": "Y",
            "modelingNotes": "Photo-referenced visualization; verify dimensions before fabrication.",
        },
    }
    core.doc = doc
    core.binary = bytearray()

    for (label, material), (positions, normals, indices) in core.groups.items():
        attributes = {
            "POSITION": core.accessor(positions, "f", 5126, "VEC3", 34962),
            "NORMAL": core.accessor(normals, "f", 5126, "VEC3", 34962),
        }
        index_accessor = core.accessor(indices, "I", 5125, "SCALAR", 34963)
        mesh_index = len(doc["meshes"])
        doc["meshes"].append({
            "name": label,
            "primitives": [{"attributes": attributes, "indices": index_accessor, "material": material}],
        })
        doc["nodes"][0]["children"].append(len(doc["nodes"]))
        doc["nodes"].append({"name": label, "mesh": mesh_index})

    while len(core.binary) % 4:
        core.binary.append(0)
    doc["buffers"] = [{"byteLength": len(core.binary)}]
    metadata = json.dumps(doc, separators=(",", ":")).encode()
    metadata += b" " * ((-len(metadata)) % 4)
    glb = (
        struct.pack("<4sII", b"glTF", 2, 28+len(metadata)+len(core.binary))
        + struct.pack("<I4s", len(metadata), b"JSON") + metadata
        + struct.pack("<I4s", len(core.binary), b"BIN\0") + core.binary
    )
    target = HERE / f"{slug}.glb"
    target.write_bytes(glb)
    return target


def build_metal_style_door():
    name, slug = "Metal Style Door", "metal-style-door"
    core.groups.clear()
    beam, rod = core.beam, core.rod
    add_frame(beam, "Outer steel jamb", -.429, .429, .021, 2.079, .045, .072, 0)
    add_frame(beam, "Metal door leaf", -.382, .382, .068, 2.032, .042, .052, .016)
    for index in range(15):
        y = .115 + index*.125
        beam("Horizontal steel slats", 0, (-.357, y, .016), (.357, y, .016), .105, .046, .003)
    for x in (-.34, .34):
        beam("Reinforcing stiles", 1, (x, .095, .044), (x, 2.005, .044), .028, .025, .002)
    for y in (.25, 1.05, 1.85):
        rod("Hinge barrels", 3, (.408, y-.043, .052), (.408, y+.043, .052), .007, 14)
    for direction in (-1, 1):
        z = .016+direction*.033
        beam("Lever handle", 3, (-.36, 1.04, z), (-.275, 1.04, z), .016, .020, .003)
    write_glb_from_current_geometry(name, slug, "No catalog reference image; modeled from product name.")


def write_glb_from_current_geometry(name, slug, note):
    # Metal Style Door uses the same writer without rebuilding screen-door geometry.
    original = build_geometry
    try:
        globals()["build_geometry"] = lambda unused: None
        write_glb(name, slug, note)
    finally:
        globals()["build_geometry"] = original


def main():
    paths = sorted((PRODUCTS / "screen-door").glob("*.png"))
    paths += sorted((PRODUCTS / "screen-doors").rglob("*.png"))
    manifest = {}
    generated = 0
    for path in paths:
        name = product_name(path)
        slug = slugify(name)
        manifest[name] = f"{slug}.glb"
        if slug not in PRESERVED:
            relative = path.relative_to(PRODUCTS).as_posix()
            target = write_glb(name, slug, relative)
            print(f"BUILT {target.name}: {target.stat().st_size:,} bytes")
            generated += 1

    build_metal_style_door()
    manifest["Metal Style Door"] = "metal-style-door.glb"
    (HERE / "door-models.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{len(manifest)} door mappings; {generated+1} GLBs generated; {len(PRESERVED)} preserved")


if __name__ == "__main__":
    main()
