"""
extract_named.py — build the final game asset set from the user's
AI-generated packs into public/icons/game/<name>.png.

Sources:
  • copy  — an already-sliced sprite (public/icons/mN/sprite_XX.png)
  • crop  — a manual box on the original sheet (for items the auto
            slicer merged into clusters), made transparent
  • half  — left/right half of a sliced sprite (e.g. the boy+girl pair)

Usage:  python tools/extract_named.py
Also writes public/icons/game_contact.png for review.
"""

import pathlib
import shutil

from PIL import Image

from slice_packs import bg_color, transparentize, contact_sheet

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
OUT = ICONS / "game"

# name -> ("copy", pack, sprite_index)
COPY = {
    "tatay-ben":      (1, 1),
    "manang-lalay":   (1, 2),
    "check":          (1, 6),
    "wrong":          (1, 8),
    "festival-stall": (1, 11),
    "coin":           (1, 12),
    "palay":          (1, 13),
    "bg-farm":        (1, 18),
    "road-flag":      (1, 22),
    "trophy":         (1, 23),
    "medal":          (1, 24),
    "banderitas-sign": (1, 34),
    "sardinas":       (2, 1),
    "milo":           (2, 9),
    "coke":           (2, 10),
    "lola":           (2, 13),
    "worker":         (2, 14),
    "correct":        (2, 23),
    "try-again":      (2, 24),
    "times-up":       (2, 25),
    "star":           (2, 26),
    "basket":         (2, 30),
    "plants":         (3, 1),
    "flower-box":     (3, 2),
    "balloons":       (3, 3),
    "signpost":       (3, 5),
    "complete":       (3, 9),
    "gift":           (3, 12),
}

# name -> ("crop", pack, (x0, y0, x1, y1)) on the original 1536x1024 sheet
CROP = {
    "bunso":            (1, (405, 130, 530, 400)),
    "tree":             (1, (35, 443, 170, 630)),
    "cart":             (1, (265, 545, 425, 655)),
    "bahay-kubo":       (1, (440, 455, 670, 670)),
    "sari-sari-store":  (1, (725, 468, 912, 670)),
    "scale":            (2, (750, 415, 912, 658)),
    "kuya-onyok":       (3, (545, 20, 732, 350)),
    "banderitas":       (3, (35, 392, 592, 464)),
    "parol":            (3, (35, 468, 143, 645)),
    "stage":            (3, (762, 455, 1117, 670)),
    "church":           (3, (1132, 545, 1360, 848)),
}

# name -> ("half", pack, sprite_index, "left"|"right")
HALF = {
    "boy":  (2, 12, "left"),
    "girl": (2, 12, "right"),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    names: list[str] = []
    sprites: list[Image.Image] = []

    for name, (pack, idx) in COPY.items():
        src = ICONS / f"m{pack}" / f"sprite_{idx:02d}.png"
        shutil.copyfile(src, OUT / f"{name}.png")
        names.append(name)
        sprites.append(Image.open(OUT / f"{name}.png").convert("RGBA"))
        print(f"  copy {name:<16} <- m{pack}/sprite_{idx:02d}")

    sheets = {n: Image.open(ICONS / f"module{n}_pack.png") for n in (1, 2, 3)}
    bgs = {n: bg_color(img) for n, img in sheets.items()}
    for name, (pack, box) in CROP.items():
        crop = transparentize(sheets[pack].crop(box), bgs[pack])
        crop.save(OUT / f"{name}.png")
        names.append(name)
        sprites.append(crop)
        print(f"  crop {name:<16} <- module{pack}_pack {box}")

    for name, (pack, idx, side) in HALF.items():
        im = Image.open(ICONS / f"m{pack}" / f"sprite_{idx:02d}.png").convert("RGBA")
        w, h = im.size
        half = im.crop((0, 0, w // 2, h)) if side == "left" else im.crop((w // 2, 0, w, h))
        half.save(OUT / f"{name}.png")
        names.append(name)
        sprites.append(half)
        print(f"  half {name:<16} <- m{pack}/sprite_{idx:02d} ({side})")

    # numbered review sheet (index order = names order)
    contact_sheet(sprites, ICONS / "game_contact.png")
    for i, n in enumerate(names):
        print(f"  #{i:02d} = {n}")


if __name__ == "__main__":
    main()
