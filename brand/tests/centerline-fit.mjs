// Derive the animated reveal's centerline from the master — Session 89.
//
// app-web/src/lib/logoCenterline.ts holds the strokes that follow the centre of the
// filled mark, so the reveal can draw the mark as two threads and then crossfade into
// the real artwork (Session 90: two threads, split at the junction). This script is
// how those strokes were made, so they can be re-made if the master changes:
//
//   1. start from a ROUGH path per stroke (below, read off a gridded render);
//   2. sample it every 3 units, and move each sample to the midpoint between the
//      fill's two edges along its normal (not at crossings: a side wider than 20 units
//      means another stroke, so the sample stays put);
//   3. smooth, repeat, trim FREE ends by 7 units (never an end another piece joins),
//      STRAIGHTEN the ends marked so (below), keep every 6th point, and write a
//      smooth curve through them;
//   4. join the pieces a thread passes between with two CONNECTORS, built from the
//      ends and their directions so the thread runs on without a kink: `notch`
//      (through the junction, bar to inner bar) and `crossing` (the stem passing
//      under the lower bar). They are not in the mark — the reveal fades them out;
//   5. measure how much of the mark the pieces cover, and how much of the stroke
//      falls outside it, at the master's 22-unit stroke (connectors excluded).
//
// Usage: node centerline-fit.mjs [--write]   (needs `npx playwright install chromium`)
// --write replaces the paths in logoCenterline.ts; without it, only measures.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = join(BRAND, "..", "app-web", "src", "lib", "logoCenterline.ts");
const MARK = readFileSync(join(BRAND, "fit-passport-mark-master.svg"), "utf8").match(/<path[^>]*\sd="([^"]+)"/)[1];

// Each piece, with whether its start / end is FREE (an end of the mark) or a JOINT
// (another piece of the same thread continues from it — not trimmed).
const ROUGH = {
  entryBar: { d: "M 10 26 C 40 80, 100 140, 190 145 L 268 145", trim: [true, false] },
  innerCurl: { d: "M 290 146 L 420 146 C 452 146, 466 120, 461 102 C 455 80, 425 70, 398 77 C 380 82, 366 96, 357 112", trim: [false, true] },
  lowerLoop: { d: "M 386 273 C 368 305, 335 316, 295 318 C 240 320, 170 333, 125 362 C 95 382, 88 420, 92 445 C 97 475, 120 492, 145 490 C 175 488, 192 465, 205 438 C 220 405, 230 365, 236 333", trim: [true, false] },
  // The spine: up the stem, through the junction, round the big upper loop.
  // Its start is the stem's cut end above the lower bar, cut at a slant: within a
  // stroke's width of it the snap reads the slanted cut as an edge and bent the
  // thread there (the founder saw the kink, Session 92d). So that end is
  // straightened: the last 16 units are dropped and redrawn along the stem.
  spineUp: { d: "M 245 290 C 252 245, 262 195, 269 150 C 285 100, 320 35, 400 14 C 470 4, 528 50, 526 110 C 524 160, 482 204, 420 208 L 316 208", trim: [false, true], straighten: [16, 0] },
};
/** Connectors, as [from piece's end, to piece's start]. */
const CONNECT = { notch: ["entryBar", "innerCurl"], crossing: ["lowerLoop", "spineUp"] };
const STROKE = 22;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><html><body></body></html>");
const result = await page.evaluate(({ mark, rough, connect, stroke }) => {
  const K = 4, W = Math.ceil(536.03 * K), H = Math.ceil(501.64 * K);
  const canvas = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.setTransform(K, 0, 0, K, 0, 0); return x; };
  const fx = canvas(); fx.fill(new Path2D(mark));
  const fill = fx.getImageData(0, 0, W, H).data;
  const inside = (px, py) => { const i = Math.round(py * K), j = Math.round(px * K); return i >= 0 && j >= 0 && i < H && j < W && fill[(i * W + j) * 4 + 3] > 127; };
  const svgPath = (d) => { const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); return p; };
  const sample = (d, step) => { const p = svgPath(d), L = p.getTotalLength(), n = Math.max(2, Math.round(L / step)); return Array.from({ length: n + 1 }, (_, i) => { const q = p.getPointAtLength((L * i) / n); return [q.x, q.y]; }); };
  const snap = (pts, maxHalf) => pts.map((P, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx;
    if (!inside(P[0], P[1])) return P;
    let d1 = 0, d2 = 0;
    while (d1 < maxHalf && inside(P[0] + nx * d1, P[1] + ny * d1)) d1 += 0.25;
    while (d2 < maxHalf && inside(P[0] - nx * d2, P[1] - ny * d2)) d2 += 0.25;
    if (d1 >= maxHalf || d2 >= maxHalf) return P;
    const s = (d1 - d2) / 2; return [P[0] + nx * s, P[1] + ny * s];
  });
  const smooth = (pts, r) => pts.map((P, i) => {
    if (i === 0 || i === pts.length - 1) return P;
    let sx = 0, sy = 0, n = 0;
    for (let k = -r; k <= r; k++) { const q = pts[Math.min(pts.length - 1, Math.max(0, i + k))]; sx += q[0]; sy += q[1]; n++; }
    return [sx / n, sy / n];
  });
  const f = (v) => Math.round(v * 10) / 10;
  const curve = (pts) => {
    let s = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      s += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return s;
  };
  const trim = (pts, by, [atStart, atEnd]) => {
    let s = 0, a = 0; while (atStart && a < pts.length - 1 && s < by) { s += Math.hypot(pts[a + 1][0] - pts[a][0], pts[a + 1][1] - pts[a][1]); a++; }
    let e = 0, b = pts.length - 1; while (atEnd && b > 0 && e < by) { e += Math.hypot(pts[b][0] - pts[b - 1][0], pts[b][1] - pts[b - 1][1]); b--; }
    return pts.slice(a, b + 1);
  };
  // Redraw the last `by` units of a run of points straight along the direction of
  // the 12 units before them, so a misread end continues its piece without a kink.
  const straightenEnd = (pts, by) => {
    if (!by) return pts;
    const d = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
    let cut = 0, b = pts.length - 1;
    while (b > 0 && cut < by) { cut += d(pts[b], pts[b - 1]); b--; }
    let back = 0, a = b;
    while (a > 0 && back < 12) { back += d(pts[a], pts[a - 1]); a--; }
    const l = d(pts[a], pts[b]) || 1, dir = [(pts[b][0] - pts[a][0]) / l, (pts[b][1] - pts[a][1]) / l];
    const kept = pts.slice(0, b + 1), n = Math.max(1, Math.round(cut / 3));
    for (let i = 1; i <= n; i++) kept.push([pts[b][0] + dir[0] * (cut * i) / n, pts[b][1] + dir[1] * (cut * i) / n]);
    return kept;
  };
  const straighten = (pts, [atStart, atEnd] = [0, 0]) =>
    straightenEnd(straightenEnd(pts, atEnd).reverse(), atStart).reverse();
  const fitted = {};
  const ends = {};
  for (const [k, { d, trim: t, straighten: st }] of Object.entries(rough)) {
    let pts = sample(d, 3);
    for (let i = 0; i < 10; i++) pts = smooth(snap(pts, 20), 3);
    const kept = straighten(trim(pts, 7, t), st);
    const thin = kept.filter((_, i) => i % 6 === 0 || i === kept.length - 1);
    fitted[k] = curve(thin);
    const dir = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    ends[k] = { start: thin[0], startDir: dir(thin[0], thin[1]), end: thin[thin.length - 1], endDir: dir(thin[thin.length - 2], thin[thin.length - 1]) };
  }
  // A connector leaves one piece the way it was going and arrives at the next the way
  // that one sets off: a cubic with handles a third of the gap long along each tangent.
  const connectors = {};
  for (const [k, [from, to]] of Object.entries(connect)) {
    const a = ends[from].end, ad = ends[from].endDir, b = ends[to].start, bd = ends[to].startDir;
    const h = Math.hypot(b[0] - a[0], b[1] - a[1]) / 3;
    connectors[k] = `M${f(a[0])} ${f(a[1])}C${f(a[0] + ad[0] * h)} ${f(a[1] + ad[1] * h)} ${f(b[0] - bd[0] * h)} ${f(b[1] - bd[1] * h)} ${f(b[0])} ${f(b[1])}`;
  }
  const sx = canvas(); sx.lineWidth = stroke; sx.lineCap = "round"; sx.lineJoin = "round";
  for (const d of Object.values(fitted)) sx.stroke(new Path2D(d));
  const s = sx.getImageData(0, 0, W, H).data;
  let inFill = 0, both = 0, out = 0;
  for (let i = 3; i < fill.length; i += 4) { const a = fill[i] > 127, b = s[i] > 127; if (a) inFill++; if (a && b) both++; if (b && !a) out++; }
  return { fitted, connectors, coverage: (100 * both / inFill).toFixed(1), spill: (100 * out / (both + out)).toFixed(1) };
}, { mark: MARK, rough: ROUGH, connect: CONNECT, stroke: STROKE });
await browser.close();

console.log(`coverage ${result.coverage}% of the mark, spill ${result.spill}% of the stroke (stroke ${STROKE})`);
if (process.argv.includes("--write")) {
  let src = readFileSync(MODULE, "utf8");
  for (const [k, d] of Object.entries({ ...result.fitted, ...result.connectors })) {
    if (!new RegExp(`  ${k}: "`).test(src)) throw new Error(`logoCenterline.ts has no "${k}" to replace`);
    src = src.replace(new RegExp(`(  ${k}: ")[^"]*(")`), `$1${d}$2`);
  }
  writeFileSync(MODULE, src);
  console.log(`wrote ${MODULE}`);
}
