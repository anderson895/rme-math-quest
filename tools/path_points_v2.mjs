// Plan the EXPANDED map trail (viewBox 2000×1200) — longer serpentine
// road so stop points are farther apart. Prints station positions,
// stop-dot gaps, and path extremes for bounds checking.
// Usage: node tools/path_points_v2.mjs

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
for (const c of CURVES) {
  for (let i = 0; i <= 400; i++) pts.push(bez(c, i / 400));
}
const cum = [0];
for (let i = 1; i < pts.length; i++) {
  const dx = pts[i][0] - pts[i - 1][0];
  const dy = pts[i][1] - pts[i - 1][1];
  cum.push(cum[i - 1] + Math.hypot(dx, dy));
}
const L = cum[cum.length - 1];

const at = (f) => {
  const target = f * L;
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return pts[lo].map((v) => Math.round(v));
};

console.log("total length:", Math.round(L));
console.log("start f=0.02 ->", at(0.02).join(", "));
for (const f of [0.34, 0.67, 1.0]) {
  console.log(`station f=${f} ->`, at(f).join(", "));
}

// stop-dot spacing per module (15 lessons per segment)
const F = [0.34, 0.67, 1.0];
for (let m = 0; m < 3; m++) {
  const start = m === 0 ? 0.02 : F[m - 1];
  const seg = F[m] - start;
  const a = at(start + seg / 15);
  const b = at(start + (2 * seg) / 15);
  console.log(`module ${m + 1} dot gap ~`, Math.round(Math.hypot(a[0] - b[0], a[1] - b[1])));
}

// bounds check
let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (const [x, y] of pts) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
console.log("extent:", Math.round(minX), Math.round(minY), "to", Math.round(maxX), Math.round(maxY));
