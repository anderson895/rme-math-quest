"""
slice_packs.py — cut the user's AI-generated asset pack sheets
(public/icons/moduleN_pack.png) into individual transparent sprites.

Method: detect the cream background color from the corners, mask
foreground pixels, find connected components (on a downscaled mask
for speed), merge overlapping boxes, then crop each sprite from the
full-res sheet with an edge flood-fill to make its background
transparent. Also writes a numbered contact sheet per pack for
easy identification.

Usage:  python tools/slice_packs.py
Output: public/icons/m{1,2,3}/sprite_NN.png  +  m{N}_contact.png
"""

import pathlib
from collections import deque

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"

TOL = 38          # color distance from background to count as foreground
PAD = 5           # padding around each detected sprite (full-res px)
MIN_AREA = 500    # ignore specks smaller than this (full-res px^2)
MAX_FRac = 0.30   # drop giant components (sheet frame / background scenes)
DETECT_W = 640    # downscale width for component detection


def _median(samples: list) -> tuple[int, int, int]:
    meds = []
    for c in range(3):
        vals = sorted(s[c] for s in samples)
        meds.append(vals[len(vals) // 2])
    return tuple(meds)  # type: ignore


def bg_color(img: Image.Image) -> tuple[int, int, int]:
    """Two candidates — sheet corners, and a ring just inside the edge
    (for sheets with decorative frames). The lighter one wins, since
    these sheets all use light cream/white backgrounds."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    corners = _median([rgb.getpixel(p) for p in [(3, 3), (w - 4, 3), (3, h - 4), (w - 4, h - 4)]])
    ring_samples = []
    for f in range(4, 97, 4):
        ring_samples.append(rgb.getpixel((w * f // 100, h * 6 // 100)))
        ring_samples.append(rgb.getpixel((w * f // 100, h * 94 // 100)))
        ring_samples.append(rgb.getpixel((w * 6 // 100, h * f // 100)))
        ring_samples.append(rgb.getpixel((w * 94 // 100, h * f // 100)))
    ring = _median(ring_samples)
    return corners if sum(corners) >= sum(ring) else ring


def is_fg(p, bg) -> bool:
    return max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2])) > TOL


def find_boxes(img: Image.Image, bg) -> list[list[int]]:
    """Connected components on a downscaled copy; boxes in full-res coords."""
    w, h = img.size
    scale = max(1.0, w / DETECT_W)
    dw, dh = int(w / scale), int(h / scale)
    small = img.convert("RGB").resize((dw, dh), Image.BILINEAR)
    px = small.load()

    seen = bytearray(dw * dh)
    boxes: list[list[int]] = []
    for sy in range(dh):
        for sx in range(dw):
            if seen[sy * dw + sx] or not is_fg(px[sx, sy], bg):
                continue
            # BFS one component
            q = deque([(sx, sy)])
            seen[sy * dw + sx] = 1
            x0, y0, x1, y1 = sx, sy, sx, sy
            while q:
                x, y = q.popleft()
                x0, y0 = min(x0, x), min(y0, y)
                x1, y1 = max(x1, x), max(y1, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < dw and 0 <= ny < dh and not seen[ny * dw + nx] and is_fg(px[nx, ny], bg):
                        seen[ny * dw + nx] = 1
                        q.append((nx, ny))
            boxes.append([
                max(0, int(x0 * scale) - PAD), max(0, int(y0 * scale) - PAD),
                min(w, int((x1 + 1) * scale) + PAD), min(h, int((y1 + 1) * scale) + PAD),
            ])

    # drop giant components (decorative frame, whole-sheet blobs) BEFORE merging
    max_area = w * h * MAX_FRac
    boxes = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) < max_area]

    # merge overlapping boxes until stable
    merged = True
    while merged:
        merged = False
        out: list[list[int]] = []
        for b in boxes:
            for o in out:
                if b[0] < o[2] and b[2] > o[0] and b[1] < o[3] and b[3] > o[1]:
                    o[0], o[1] = min(o[0], b[0]), min(o[1], b[1])
                    o[2], o[3] = max(o[2], b[2]), max(o[3], b[3])
                    merged = True
                    break
            else:
                out.append(list(b))
        boxes = out

    boxes = [b for b in boxes if (b[2] - b[0]) * (b[3] - b[1]) >= MIN_AREA]

    # reading order: bucket into rows, then left→right
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows: list[list[list[int]]] = []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        for row in rows:
            rcy = sum((r[1] + r[3]) / 2 for r in row) / len(row)
            if abs(cy - rcy) < 55:
                row.append(b)
                break
        else:
            rows.append([b])
    ordered: list[list[int]] = []
    for row in rows:
        ordered.extend(sorted(row, key=lambda b: b[0]))
    return ordered


def transparentize(im: Image.Image, bg) -> Image.Image:
    """Edge flood-fill: background connected to the crop border → alpha 0."""
    img = im.convert("RGBA")
    px = img.load()
    w, h = img.size
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
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


def contact_sheet(sprites: list[Image.Image], path: pathlib.Path, cols: int = 8, cell: int = 110) -> None:
    rows = (len(sprites) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * (cell + 18)), (255, 255, 255))
    draw = ImageDraw.Draw(sheet)
    for i, sp in enumerate(sprites):
        thumb = sp.copy()
        thumb.thumbnail((cell - 8, cell - 8))
        cx, cy = (i % cols) * cell, (i // cols) * (cell + 18)
        sheet.paste(thumb, (cx + (cell - thumb.width) // 2, cy + 16 + (cell - 8 - thumb.height) // 2), thumb)
        draw.text((cx + 4, cy + 2), f"#{i:02d}", fill=(200, 0, 0))
        draw.rectangle([cx, cy, cx + cell - 1, cy + cell + 16], outline=(220, 220, 220))
    sheet.save(path)


def main() -> None:
    for n in (1, 2, 3):
        src = ICONS / f"module{n}_pack.png"
        if not src.exists():
            print(f"skip: {src.name} not found")
            continue
        img = Image.open(src)
        bg = bg_color(img)
        out_dir = ICONS / f"m{n}"
        out_dir.mkdir(parents=True, exist_ok=True)
        boxes = find_boxes(img, bg)
        sprites = []
        for i, b in enumerate(boxes):
            crop = transparentize(img.crop(tuple(b)), bg)
            crop.save(out_dir / f"sprite_{i:02d}.png")
            sprites.append(crop)
        contact_sheet(sprites, ICONS / f"m{n}_contact.png")
        print(f"module{n}_pack.png ({img.size[0]}x{img.size[1]}, bg={bg}): {len(boxes)} sprites -> {out_dir}")


if __name__ == "__main__":
    main()
