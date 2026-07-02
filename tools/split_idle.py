"""
split_idle.py — slice a character IDLE animation sheet (frames in a
row on a dark background, with frame-number labels at the bottom)
into transparent, feet-aligned frames.

Usage:
  python tools/split_idle.py <sheet.png> <slug> [frames=4] [label_band=0.24]
  (set label_band to 0 when the sheet has no number labels)
Output:
  public/icons/game/idle/<slug>-{0..N-1}.png
"""

import pathlib
import sys
from collections import deque

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons" / "game" / "idle"

TOL = 30          # distance from the (dark) background color
LABEL_BAND = 0.24  # bottom fraction holding the "1 2 3 4" labels — cropped off


def corner_bg(img: Image.Image) -> tuple[int, int, int]:
    rgb = img.convert("RGB")
    w, h = rgb.size
    cs = [rgb.getpixel(p) for p in [(3, 3), (w - 4, 3), (3, h - 4), (w - 4, h - 4)]]
    return tuple(sorted(c[i] for c in cs)[2] for i in range(3))  # type: ignore


def is_fg(p, bg) -> bool:
    return max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2])) > TOL


def transparentize(im: Image.Image, bg) -> Image.Image:
    img = im.convert("RGBA")
    px = img.load()
    w, h = img.size
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        p = px[x, y]
        if is_fg(p, bg):
            continue
        px[x, y] = (p[0], p[1], p[2], 0)
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    return img


def main() -> None:
    src = pathlib.Path(sys.argv[1])
    slug = sys.argv[2]
    frames = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    label_band = float(sys.argv[4]) if len(sys.argv) > 4 else LABEL_BAND

    img = Image.open(src)
    w, h = img.size
    img = img.crop((0, 0, w, int(h * (1 - label_band))))  # drop the number labels
    w, h = img.size
    bg = corner_bg(img)

    trimmed: list[Image.Image] = []
    for i in range(frames):
        frame = transparentize(img.crop((w * i // frames, 0, w * (i + 1) // frames, h)), bg)
        bbox = frame.split()[3].getbbox()
        trimmed.append(frame.crop(bbox) if bbox else frame)

    mw = max(f.width for f in trimmed)
    mh = max(f.height for f in trimmed)
    OUT.mkdir(parents=True, exist_ok=True)
    for i, f in enumerate(trimmed):
        canvas = Image.new("RGBA", (mw, mh), (0, 0, 0, 0))
        canvas.paste(f, ((mw - f.width) // 2, mh - f.height), f)
        canvas.save(OUT / f"{slug}-{i}.png")
    print(f"{slug}: {frames} idle frames ({mw}x{mh}, bg={bg})")


if __name__ == "__main__":
    main()
