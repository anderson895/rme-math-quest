"""
straighten_banderitas.py — the banderitas sprite's string slopes,
so repeated tiles look zigzag. This measures the string line (the
topmost opaque pixel per column), fits a straight line, and shears
the image so the string becomes perfectly horizontal.

Usage:  python tools/straighten_banderitas.py
Edits:  public/icons/game/banderitas.png  (in place; keeps a .bak)
"""

import pathlib
import shutil

from PIL import Image

SRC = pathlib.Path(__file__).resolve().parent.parent / "public" / "icons" / "game" / "banderitas.png"


def main() -> None:
    shutil.copyfile(SRC, SRC.with_suffix(".png.bak"))
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    alpha = img.split()[3].load()

    # topmost opaque pixel per column ≈ the string's y position
    xs: list[int] = []
    ys: list[int] = []
    for x in range(0, w, 4):
        for y in range(h):
            if alpha[x, y] > 40:
                xs.append(x)
                ys.append(y)
                break

    # least-squares line fit: y = m*x + b
    n = len(xs)
    sx, sy = sum(xs), sum(ys)
    sxx = sum(x * x for x in xs)
    sxy = sum(x * y for x, y in zip(xs, ys))
    m = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    print(f"string slope: {m:.4f} ({m * w:.1f}px drift over {w}px)")

    # shear vertically to cancel the slope (pad so nothing clips)
    pad = int(abs(m) * w) + 2
    canvas = Image.new("RGBA", (w, h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (0, pad), img)
    sheared = canvas.transform(
        canvas.size, Image.AFFINE, (1, 0, 0, -m, 1, m * w / 2), resample=Image.BICUBIC
    )
    bbox = sheared.split()[3].getbbox()
    result = sheared.crop(bbox) if bbox else sheared
    result.save(SRC)
    print(f"straightened: {result.width}x{result.height} -> {SRC.name}")


if __name__ == "__main__":
    main()
