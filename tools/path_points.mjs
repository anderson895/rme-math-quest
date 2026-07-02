// Compute points along the map trail (same beziers as TRAIL_D in
// MainMenu.tsx) so station/decor positions can be planned precisely.
// Usage: node tools/path_points.mjs

const CURVES = [
  [[100, 195], [280, 125], [500, 110], [670, 155]],
  [[670, 155], [830, 200], [850, 275], [700, 312]],
  [[700, 312], [500, 358], [320, 305], [260, 385]],
  [[260, 385], [210, 452], [350, 522], [560, 502]],
  [[560, 502], [720, 487], [830, 432], [900, 352]],
];

const bez = (p, t) => {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
};

// sample the whole path
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
for (const f of [0.02, 0.3467, 0.6733, 1.0]) {
  console.log(`f=${f}  ->`, at(f).join(", "));
}
// spacing check: stop dots every (0.3267/15) between stations
const s = (1 - 0.02) / 3;
for (let m = 0; m < 3; m++) {
  const start = 0.02 + m * s;
  const a = at(start + s / 15);
  const b = at(start + (2 * s) / 15);
  console.log(`module ${m + 1} dot gap ~`, Math.round(Math.hypot(a[0] - b[0], a[1] - b[1])));
}
