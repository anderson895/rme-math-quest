// One-off layout audit: verify no fixed decoration overlaps the new
// TRAIL_D road (viewBox 2000×1200). Usage: node tools/check_clearance.mjs
const CURVES = [
  [[140, 260], [420, 140], [820, 120], [1200, 190]],
  [[1200, 190], [1560, 250], [1760, 380], [1620, 520]],
  [[1620, 520], [1480, 655], [1000, 560], [700, 640]],
  [[700, 640], [420, 715], [280, 820], [420, 950]],
  [[420, 950], [560, 1075], [1000, 1105], [1350, 1040]],
  [[1350, 1040], [1650, 985], [1830, 870], [1880, 700]],
];
const bez = (p, t) => {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
};
const pts = [];
for (const c of CURVES) for (let i = 0; i <= 600; i++) pts.push(bez(c, i / 600));

const distToRect = (px, py, r) => {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
};

const items = {
  "bahay-kubo": { x: 85, y: 48, w: 140, h: 128 },
  "festival-stall": { x: 1755, y: 205, w: 128, h: 102 },
  "church": { x: 970, y: 670, w: 195, h: 230 },
  "flower-box": { x: 1075, y: 915, w: 60, h: 38 },
  "cart": { x: 1095, y: 450, w: 128, h: 88 },
  "trophy": { x: 1908, y: 630, w: 40, h: 44 },
  "road-flag": { x: 1902, y: 565, w: 44, h: 57 },
  "tree1": { x: 42, y: 140, w: 60, h: 84 }, "tree2": { x: 330, y: 52, w: 54, h: 76 },
  "tree3": { x: 740, y: 36, w: 56, h: 78 }, "tree4": { x: 1050, y: 60, w: 52, h: 72 },
  "tree5": { x: 1460, y: 70, w: 54, h: 76 }, "tree6": { x: 1830, y: 110, w: 52, h: 72 },
  "tree7": { x: 95, y: 560, w: 56, h: 78 }, "tree8": { x: 250, y: 700, w: 50, h: 70 },
  "tree9": { x: 180, y: 1040, w: 56, h: 78 }, "tree10": { x: 560, y: 420, w: 56, h: 78 },
  "tree11": { x: 890, y: 300, w: 50, h: 70 }, "tree12": { x: 1240, y: 290, w: 52, h: 72 },
  "tree13": { x: 1530, y: 690, w: 52, h: 72 }, "tree14": { x: 690, y: 860, w: 54, h: 76 },
  "tree15": { x: 1690, y: 1040, w: 54, h: 76 },
  // scattered DECOR scenery
  "d-palay1": { x: 1280, y: 330, w: 60, h: 80 },
  "d-palay2": { x: 1360, y: 385, w: 52, h: 70 },
  "d-palay3": { x: 1305, y: 430, w: 48, h: 64 },
  "d-signpost1": { x: 1180, y: 280, w: 50, h: 66 },
  "d-kubo2": { x: 300, y: 300, w: 115, h: 105 },
  "d-flowerbox1": { x: 255, y: 415, w: 52, h: 34 },
  "d-plants1": { x: 860, y: 420, w: 56, h: 40 },
  "d-basket1": { x: 700, y: 545, w: 38, h: 32 },
  "d-palay4": { x: 110, y: 690, w: 56, h: 74 },
  "d-basket2": { x: 255, y: 1075, w: 40, h: 34 },
  "d-flowerbox2": { x: 900, y: 855, w: 55, h: 34 },
  "d-plants2": { x: 1190, y: 845, w: 52, h: 38 },
  "d-signpost2": { x: 700, y: 940, w: 48, h: 64 },
  "d-palay5": { x: 1600, y: 760, w: 56, h: 74 },
  "d-plants3": { x: 1450, y: 820, w: 52, h: 38 },
  // station decor at nodes: s1(1664,441) s2(441,966) s3(1880,700)
  "s1-palay": { x: 1664 + 50, y: 441 - 46, w: 56, h: 72 },
  "s1-npc": { x: 1664 + 85 - 55, y: 441 - 12 - 55, w: 110, h: 110 },
  "s2-store": { x: 441 - 230, y: 966 - 76, w: 92, h: 104 },
  "s2-scale": { x: 441 - 180, y: 966 + 30, w: 34, h: 44 },
  "s2-basket": { x: 441 - 134, y: 966 + 36, w: 30, h: 26 },
  "s2-npc": { x: 441 + 80 - 55, y: 966 - 75 - 55, w: 110, h: 110 },
  "s3-npc": { x: 1880 - 100 - 50, y: 700 - 45 - 50, w: 100, h: 100 },
  "s3-stage": { x: 1880 - 110, y: 700 + 250, w: 128, h: 88 },
  "s3-balloons": { x: 1880 - 160, y: 700 + 270, w: 40, h: 54 },
  "s3-plants": { x: 1880 + 20, y: 700 + 280, w: 44, h: 32 },
  "s3-gift": { x: 1880 - 20, y: 700 + 310, w: 32, h: 32 },
};

const ROAD = 20; // half of the 40px road stroke
for (const [name, r] of Object.entries(items)) {
  let min = 1e9;
  for (const [px, py] of pts) min = Math.min(min, distToRect(px, py, r));
  const clear = min - ROAD;
  const tag = clear < 0 ? "OVERLAP " : clear < 8 ? "TIGHT   " : "ok      ";
  console.log(tag + name + "  clearance=" + Math.round(clear));
}
