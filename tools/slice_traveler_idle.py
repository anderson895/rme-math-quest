"""
slice_traveler_idle.py — slice the traveler IDLE packs (boy/girl) into
transparent, feet-aligned frames.

Unlike split_idle.py (uniform dark bg), these packs sit on a smooth
amber-glow GRADIENT. Background removal: flood fill from the borders
that only spreads across SMOOTH color steps — it stops at the sharp
character outlines, so the gradient (dark corners AND bright glow) is
eaten while the character survives.

Usage:
  python tools/slice_traveler_idle.py <sheet.png> <slug> <cols> <rows>
Output:
  public/icons/game/idle/<slug>-{0..cols*rows-1}.png
"""

import pathlib
import sys
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons" / "game" / "idle"

STEP_TOL = 13   # max per-channel step between neighboring bg pixels


def is_warm(p) -> bool:
    """The amber-glow gradient is always warm (R >= B); cool pixels
    (blue shorts!) can never be background — stops shadow leaks."""
    return p[0] >= p[2] - 8


def remove_gradient_bg(im: Image.Image) -> Image.Image:
    img = im.convert("RGBA")
    px = img.load()
    w, h = img.size
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    for x, y in q:
        seen[y * w + x] = 1
    while q:
        x, y = q.popleft()
        p = px[x, y]
        px[x, y] = (p[0], p[1], p[2], 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if seen[i]:
                    continue
                n = px[nx, ny]
                if is_warm(n) and max(abs(n[0] - p[0]), abs(n[1] - p[1]), abs(n[2] - p[2])) <= STEP_TOL:
                    seen[i] = 1
                    q.append((nx, ny))
    return img


def main() -> None:
    src = pathlib.Path(sys.argv[1])
    slug = sys.argv[2]
    cols = int(sys.argv[3])
    rows = int(sys.argv[4])

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    cw, ch = w // cols, h // rows

    trimmed: list[Image.Image] = []
    for r in range(rows):
        for c in range(cols):
            cell = img.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            cell = remove_gradient_bg(cell)
            bbox = cell.split()[3].getbbox()
            trimmed.append(cell.crop(bbox) if bbox else cell)

    mw = max(f.width for f in trimmed)
    mh = max(f.height for f in trimmed)
    OUT.mkdir(parents=True, exist_ok=True)
    for i, f in enumerate(trimmed):
        canvas = Image.new("RGBA", (mw, mh), (0, 0, 0, 0))
        canvas.paste(f, ((mw - f.width) // 2, mh - f.height), f)  # feet-aligned
        canvas.save(OUT / f"{slug}-{i}.png")
    print(f"{slug}: {cols * rows} idle frames ({mw}x{mh}) from {src.name} ({w}x{h})")


if __name__ == "__main__":
    main()
