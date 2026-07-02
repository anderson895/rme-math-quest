"""
split_walk.py — slice the user's walking-animation packs
(boy_walking_pack.png / girl_walking_pack.png, 4 frames each)
into transparent frames with aligned feet so the walk cycle
doesn't jitter.

Usage:  python tools/split_walk.py
Output: public/icons/game/walk/{boy,girl}-walk-{0..3}.png
"""

import pathlib

from PIL import Image

from slice_packs import bg_color, transparentize

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
OUT = ICONS / "game" / "walk"

FRAMES = 4


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("boy", "girl"):
        src = ICONS / f"{name}_walking_pack.png"
        img = Image.open(src)
        bg = bg_color(img)
        w, h = img.size

        # slice, transparentize, trim each frame
        trimmed: list[Image.Image] = []
        for i in range(FRAMES):
            frame = transparentize(img.crop((w * i // FRAMES, 0, w * (i + 1) // FRAMES, h)), bg)
            bbox = frame.split()[3].getbbox()
            trimmed.append(frame.crop(bbox) if bbox else frame)

        # common canvas, feet aligned to the bottom edge (no jitter)
        mw = max(f.width for f in trimmed)
        mh = max(f.height for f in trimmed)
        for i, f in enumerate(trimmed):
            canvas = Image.new("RGBA", (mw, mh), (0, 0, 0, 0))
            canvas.paste(f, ((mw - f.width) // 2, mh - f.height), f)
            canvas.save(OUT / f"{name}-walk-{i}.png")
        print(f"{name}: {FRAMES} frames ({mw}x{mh}, bg={bg})")


if __name__ == "__main__":
    main()
