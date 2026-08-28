/* =========================================================================
   hm-husk-layers.js — the garment layer stack
   -------------------------------------------------------------------------
   WHY THIS EXISTS. Every garment's radius was typed by hand, tuned against
   the plate's silhouette one section at a time. That fixes the OUTSIDE of the
   figure and says nothing about the relationship between layers, so the
   inner ones drifted straight through the outer ones:

     rust apron          45 mm outside the mantle that should cover it
     tunic cross-drape   69 mm outside it
     tunic under-column   9 mm outside the mantle under-layer
     sash                 inner wall 54 mm inside the robe it wraps

   Tuning those numbers individually is what produced the problem; doing it
   again more carefully would produce it again the moment any station moved.
   So the stack is now derived:

     THE PLATE FIXES THE OUTERMOST SURFACE. Everything inside is that surface
     minus a declared gap. An inner layer cannot escape its outer one because
     its radius is computed from it.

   THE GAP HAS TO BE HONEST ABOUT WHAT A SURFACE ACTUALLY OCCUPIES. A station
   radius is not the surface: clothLoft's drape folds scale it by
   (1 +/- amp*t), the crease and crack passes displace along the normal, and a
   wrapCoil is a TUBE whose centreline is the radius and whose wall is
   thickness beyond it. The measured mantle reaches 13 mm past its own station
   for exactly these reasons. GAP below is therefore sized against the real
   excursion, and `sashR` adds tube thickness explicitly rather than hoping.

   A sash also does something a layer table cannot express on its own: it
   CINCHES. Cloth pulled in at the waist is narrower there, not wider, so the
   robe is pinched through the sash band and its folds are gathered rather
   than billowing. That is both what a belt does and what keeps the sash from
   needing to stand 56 mm off the body like a hoop.
   ========================================================================= */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** The plate-measured outer robe station, top to bottom. This is the one
 *  table in the stack taken from the art; everything else derives from it. */
export const ROBE = [
  [1.500, 0.112], [1.470, 0.158], [1.430, 0.188], [1.330, 0.196],
  [1.200, 0.202], [1.060, 0.212], [0.900, 0.228], [0.700, 0.240],
  [0.540, 0.248], [0.460, 0.250],
];

/** rz / rx for the robe. A torso is not circular and neither is its cloth. */
export const DEPTH = 0.74;

/** The waist pinch under the sash. */
export const CINCH = { top: 1.190, bottom: 1.010, peak: 1.096, amount: 0.026 };

/** Radial inset of each layer from the outer robe surface, in metres.
 *
 *  NOT a uniform gap. A uniform 32 mm looked principled and was arithmetically
 *  impossible: four layers inside a robe of radius 0.21 leaves the innermost at
 *  0.11, while the thighs of even a gaunt figure reach 0.16 — so the trousers
 *  burst through the tunic by 68 mm. The stack has to be sized against what is
 *  actually inside it, which means the inner gaps are tighter than the outer
 *  ones and the rust tunic's apron and column share one depth, because on the
 *  plate they are one garment.
 *
 *  Each gap still clears the ~14 mm that folds, crease and crack push a
 *  surface past its own station, on both sides. */
export const INSET = {
  mantleOuter: 0,
  mantleUnder: 0.038,
  tunic: 0.066,
  trouser: 0.096,
};
/** Kept as the nominal spacing for anything that asks. */
export const GAP = 0.030;

/** @deprecated names retained so a caller asking for the old layer still works */
export const LAYER = INSET;

/** Station radius of the outer robe at a height, with the cinch applied.
 *
 *  Sampled from a table built the way clothLoft ACTUALLY interpolates — by
 *  station index with a smoothstep — rather than by interpolating the station
 *  list against y. Those two are not the same function whenever the stations
 *  are unevenly spaced in y, which the robe's are (three of them inside the
 *  top 70 mm). The disagreement peaked right where the harness crosses the
 *  shoulder and left the strap 10 mm inside a surface the stack believed it
 *  had cleared. Deriving the table from the same formula the mesh uses makes
 *  them agree by construction instead of by coincidence. */
const ROBE_TABLE = (() => {
  const N = 240;
  const ys = new Float64Array(N + 1), rs = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const f = t * (ROBE.length - 1);
    const j = Math.min(ROBE.length - 2, Math.floor(f));
    const k = smooth(f - j);
    const [y0, r0] = ROBE[j], [y1, r1] = ROBE[j + 1];
    ys[i] = y0 + (y1 - y0) * k;
    rs[i] = r0 + (r1 - r0) * k;
  }
  return { ys, rs, N };
})();

export function robeR(y) {
  const { ys, rs, N } = ROBE_TABLE;
  let r;
  if (y >= ys[0]) r = rs[0];
  else if (y <= ys[N]) r = rs[N];
  else {
    r = rs[N];
    // ys descends; find the bracketing pair.
    let lo = 0, hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ys[mid] > y) lo = mid; else hi = mid;
    }
    const span = ys[lo] - ys[hi];
    const k = span > 1e-9 ? (ys[lo] - y) / span : 0;
    r = rs[lo] + (rs[hi] - rs[lo]) * k;
  }
  if (y < CINCH.top && y > CINCH.bottom) {
    const half = y > CINCH.peak ? CINCH.top - CINCH.peak : CINCH.peak - CINCH.bottom;
    const d = Math.abs(y - CINCH.peak) / half;
    r -= CINCH.amount * smooth(1 - d);
  }
  return r;
}

/** Radius for a named layer at a height. */
export function layerR(name, y) {
  const n = INSET[name];
  if (n === undefined) throw new Error('hm-husk-layers: unknown layer ' + name);
  return Math.max(0.02, robeR(y) - n);
}

/** Front-facing z for a layer — what a flat hanging panel needs. */
export const layerZ = (name, y) => layerR(name, y) * DEPTH;

/**
 * The TIGHTEST front z a layer reaches anywhere across a vertical span.
 *
 * A hanging panel is one flat plane but the surface covering it is not: the
 * robe is cinched at the waist, so a panel sized from its own mid-height still
 * pushed through the mantle 27 mm higher up. A panel must clear the narrowest
 * point it spans, not the average one.
 */
export function layerZMin(name, y0, y1, samples = 9) {
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
  let z = Infinity;
  for (let i = 0; i < samples; i++) {
    z = Math.min(z, layerZ(name, lo + ((hi - lo) * i) / (samples - 1)));
  }
  return z;
}

/**
 * Centreline radius for the sash, which is worn OVER the robe.
 *
 * A wrapCoil is a tube: its wall reaches `thick` beyond the centreline on the
 * way in as well as out, so the centreline has to clear the robe's real outer
 * surface by the tube's own thickness plus a margin. This is the calculation
 * whose absence put the sash's inner wall 54 mm inside the robe.
 */
export function sashR(y, thick) {
  /* 30 mm of excursion allowance, not 14: the measured mantle reaches further
     past its station than the fold amplitude alone predicts once crease and
     crack displacement are on it, and at 14 mm the mantle still came 15 mm
     through the sash's inner wall. */
  const outerSurface = robeR(y) + 0.030;
  return outerSurface + thick + 0.008;
}

/** Stations for clothLoft at a named layer, from a list of heights. */
export function layerStations(name, heights, { scale = 1, depth = DEPTH } = {}) {
  return heights.map((y) => {
    const r = layerR(name, y) * scale;
    return { y, rx: r, rz: r * depth };
  });
}

/* ------------------------------------------------------------------ audit
   The stack is a claim; this measures it. Surfaces are binned by height AND
   ANGLE, and compared only in bins where both actually have geometry.

   Height alone is not enough, and the failure is instructive: a shoulder strap
   exists at two narrow angles, so comparing its minimum radius against the
   mantle's maximum anywhere in the same height band measured the strap against
   the side of the body it never crosses — and reported 43 mm of penetration
   that does not exist. Two surfaces can only be compared where they overlap.

   Penetration is reported in millimetres and the viewer prints it, the same
   discipline as the silhouette table and for the same reason. */
export function radialProfile(mesh, opts = {}) {
  const { y0 = 0.30, y1 = 1.60, bins = 26, abins = 24, depth = DEPTH, skinner = null } = opts;
  const p = mesh.geometry.attributes.position;
  const n = bins * abins;
  const min = new Float32Array(n).fill(Infinity);
  const max = new Float32Array(n).fill(-Infinity);
  const cnt = new Uint32Array(n);
  const TAU = Math.PI * 2;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (skinner) { const v = skinner(mesh, i); x = v.x; y = v.y; z = v.z; }
    const b = Math.floor(((y - y0) / (y1 - y0)) * bins);
    if (b < 0 || b >= bins) continue;
    let th = Math.atan2(x, z);
    if (th < 0) th += TAU;
    const a = Math.min(abins - 1, Math.floor((th / TAU) * abins));
    const k = b * abins + a;
    const r = Math.hypot(x, z / depth);
    if (r < min[k]) min[k] = r;
    if (r > max[k]) max[k] = r;
    cnt[k]++;
  }
  return { min, max, cnt, y0, y1, bins, abins };
}

/**
 * @param {{inner:string, outer:string, label:string, tol?:number}[]} pairs
 */
export function layerAudit(profiles, pairs) {
  const out = [];
  for (const pr of pairs) {
    const A = profiles[pr.inner], B = profiles[pr.outer];
    const tol = pr.tol ?? 0;
    if (!A || !B) { out.push({ label: pr.label, worstMm: null, atY: null, ok: true, tol, missing: true }); continue; }
    let worst = -Infinity, atY = null, shared = 0;
    for (let b = 0; b < A.bins; b++) {
      for (let a = 0; a < A.abins; a++) {
        const k = b * A.abins + a;
        if (!A.cnt[k] || !B.cnt[k]) continue;
        shared++;
        const pen = A.max[k] - B.min[k];
        if (pen > worst) {
          worst = pen;
          atY = A.y0 + ((b + 0.5) / A.bins) * (A.y1 - A.y0);
        }
      }
    }
    if (!shared) { out.push({ label: pr.label, worstMm: null, atY: null, ok: true, tol, missing: true }); continue; }
    const mm = Math.round(worst * 1000);
    out.push({ label: pr.label, worstMm: mm, atY: +atY.toFixed(2), ok: mm <= tol, tol, bins: shared });
  }
  return out;
}
