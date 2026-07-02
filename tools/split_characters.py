"""
split_characters.py — cut the user's own AI-generated 3-character
badge image into separate icon files for the game.

Usage: python tools/split_characters.py "<path-to-combined-image>"
Output: public/icons/farmer-ben.png, storekeeper-lalay.png, organizer-onyok.png
"""

import pathlib
import sys
from collections import deque

from PIL import Image, ImageChops

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "icons"

SLUGS = ["farmer-ben", "storekeeper-lalay", "organizer-onyok"]


def trim_white(im: Image.Image, pad: int = 14) -> Image.Image:
    """Crop away the (near-)white border around a badge."""
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg).convert("L")
    mask = diff.point(lambda p: 255 if p > 18 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return im
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(im.width, right + pad)
    bottom = min(im.height, bottom + pad)
    return im.crop((left, top, right, bottom))


def remove_background(im: Image.Image, tol: int = 228) -> Image.Image:
    """Make the white background transparent via flood fill from the
    edges — white areas INSIDE the artwork (eyes, paper) are kept."""
    img = im.convert("RGBA")
    px = img.load()
    w, h = img.size

    def is_bg(p) -> bool:
        return p[0] >= tol and p[1] >= tol and p[2] >= tol

    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]):
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]):
                q.append((x, y))

    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        p = px[x, y]
        if not is_bg(p):
            continue
        px[x, y] = (p[0], p[1], p[2], 0)
        if x > 0:
            q.append((x - 1, y))
        if x < w - 1:
            q.append((x + 1, y))
        if y > 0:
            q.append((x, y - 1))
        if y < h - 1:
            q.append((x, y + 1))
    return img


def squareize(im: Image.Image) -> Image.Image:
    """Pad to a square transparent canvas so icons render centered."""
    s = max(im.size)
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    canvas.paste(im, ((s - im.width) // 2, (s - im.height) // 2), im)
    return canvas


def main() -> None:
    src = pathlib.Path(sys.argv[1])
    img = Image.open(src)
    w, h = img.size
    print(f"Source: {src.name} ({w}x{h})")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for i, slug in enumerate(SLUGS):
        third = img.crop((w * i // 3, 0, w * (i + 1) // 3, h))
        badge = squareize(remove_background(trim_white(third)))
        out = OUT_DIR / f"{slug}.png"
        badge.save(out)
        print(f"  ok  {slug}.png  ({badge.width}x{badge.height}, transparent bg)")


if __name__ == "__main__":
    main()
