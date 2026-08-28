/* =========================================================================
   hm-husk-cloth.js — ash-cured cloth machinery
   -------------------------------------------------------------------------
   The Ashbound plates are not "a figure in a robe". They are a figure inside
   a crust: cloth that was soaked, ash-fouled and then dried until it cracked,
   so every garment reads as ONE continuous stiff surface with a torn,
   pendant hem. That is why the previous husk failed — twenty separate
   extruded slabs arranged on a circle cannot read as a hanging surface at any
   angle, and from the front they read as a lampshade.

   Everything here builds a SURFACE:

     clothLoft   a cape / robe / bell sleeve as one lofted skin, with a front
                 opening that can widen as it descends, vertical drape folds,
                 and a hem torn into pendant tongues (the Ashbound silhouette
                 is the hem, so the hem is geometry, never a texture).
     tornPanel   a flat hanging layer — the rust apron, a tabard, a sash tail.
     wrapCoil    a wound band — the throat cowl, the waist sash. A helix
                 swept with a tube, so a wrap goes round the body once and
                 arrives back where it started, instead of being three tori.
     crease      coherent wrinkle / ash-crust displacement along normals.
     crackRidge  the crazed plate network as shallow relief, so the crust
                 catches the raking key instead of relying on albedo alone.
     wearColours value gradient into the colour attribute: hems soil, uppers
                 stay pale. Same idea as hm-actor-skin's wearAt, applied to
                 garment sections rather than a skinned actor.

   Metres. +Y up, sole at y = 0, figure faces +Z. Angles measured from +Z
   (the front) toward +X, so a front opening is symmetric about theta = 0.
   ========================================================================= */

import * as THREE from 'three';
import { sculpt } from './hm-actor-skin.js';

export const T2 = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** Deterministic stream — same husk, same tears, every reload. */
export function rnd(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash3 = (x, y, z, s) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 13.113) * 43758.5453;
  return n - Math.floor(n);
};

/** Smooth value noise. Cheap, deterministic, good enough for crust. */
export function noise3(x, y, z, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d, s);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

/* ----------------------------------------------------------------- hems
   A pendant tongue has a POINT, so its profile must arrive at the tip with a
   corner. cos^n gives a rounded tip and reads as a scallop — decorative,
   wrong family. A power below 1 on (1 - d/w) gives the cusp the plates show.
*/
/**
 * @returns {(theta:number)=>number} extra drop in metres at that angle.
 */
export function tornHem({
  count = 5, depth = 0.18, vary = 0.42, tipPow = 0.78,
  width = 1, jag = 0.010, seed = 7, phase = 0,
} = {}) {
  const rand = rnd(seed);
  const tongues = [];
  for (let i = 0; i < count; i++) {
    tongues.push({
      a: phase + ((i + (rand() - 0.5) * 0.55) / count) * T2,
      d: depth * (1 - vary * rand()),
      w: (Math.PI / count) * width * (0.78 + rand() * 0.5),
    });
  }
  const p1 = rand() * T2, p2 = rand() * T2;
  return (theta) => {
    let d = 0;
    for (const t of tongues) {
      const da = Math.abs(((theta - t.a + Math.PI * 3) % T2) - Math.PI);
      if (da < t.w) d = Math.max(d, t.d * Math.pow(1 - da / t.w, tipPow));
    }
    return d + jag * (0.55 + 0.45 * Math.sin(theta * 13 + p1) + 0.30 * Math.sin(theta * 31 + p2));
  };
}

/** Same idea across a flat panel: u in [-1, 1] -> drop. */
export function tornEdge({ count = 4, depth = 0.14, vary = 0.4, tipPow = 0.8, jag = 0.008, seed = 11 } = {}) {
  const rand = rnd(seed);
  const t = [];
  for (let i = 0; i < count; i++) {
    t.push({
      u: -1 + ((i + 0.5 + (rand() - 0.5) * 0.6) / count) * 2,
      d: depth * (1 - vary * rand()),
      w: (2 / count) * (0.7 + rand() * 0.6),
    });
  }
  const p1 = rand() * 6.28;
  return (u) => {
    let d = 0;
    for (const g of t) {
      const du = Math.abs(u - g.u);
      if (du < g.w) d = Math.max(d, g.d * Math.pow(1 - du / g.w, tipPow));
    }
    return d + jag * (0.5 + 0.5 * Math.sin(u * 17 + p1));
  };
}

/* --------------------------------------------------------------- surfaces */

function finish(geo, { crease: cr, crack, wear, seed = 3 } = {}) {
  if (cr) crease(geo, { seed, ...cr });
  if (crack) crackRidge(geo, { seed: seed + 91, ...crack });
  geo.computeVertexNormals();
  if (wear) wearColours(geo, wear);
  return geo;
}

/**
 * One lofted garment surface: robe, cape, bell sleeve, trouser drape.
 *
 * stations  [{ y, rx, rz, cx?, cz? }] top -> bottom. Cross-section is an
 *           ellipse of half-widths rx (lateral) and rz (front-to-back),
 *           centred on (cx, cz) so a drape can drift outward as it falls.
 * gapAt     t -> half-angle of the front opening in radians. 0 keeps the ring
 *           closed; a rising function opens the robe below the chest, which is
 *           exactly how the plate shows the rust underlayer.
 * hem       theta -> pendant drop, from tornHem().
 * fold      { count, amp, phase } vertical drape folds; amplitude grows with t.
 */
export function clothLoft({
  stations, columns = 44, ringsPer = 3, gapAt = null, gapMid = 0, hem = null, hemRings = 5,
  hemPull = 0.05, fold = null, capTop = false, seed = 3,
  crease: cr = null, crack = null, wear = null,
}) {
  const rings = (stations.length - 1) * ringsPer + 1;
  const at = (t) => {
    const f = clamp(t, 0, 1) * (stations.length - 1);
    const i = Math.min(stations.length - 2, Math.floor(f));
    const k = smooth(f - i);
    const a = stations[i], b = stations[i + 1];
    return {
      y: lerp(a.y, b.y, k), rx: lerp(a.rx, b.rx, k), rz: lerp(a.rz, b.rz, k),
      cx: lerp(a.cx ?? 0, b.cx ?? 0, k), cz: lerp(a.cz ?? 0, b.cz ?? 0, k),
    };
  };

  const open = !!gapAt;
  const cols = open ? columns : columns;            // wrap handled in indexing
  const pos = [], uv = [], idx = [];
  const total = rings + (hem ? hemRings : 0);

  /* `gapMid` turns the opening away from dead front — a bell sleeve's drape is
     missing from its front-INNER quadrant, not symmetrically about the nose. */
  const mid = typeof gapMid === 'function' ? gapMid : () => gapMid;
  const thetaOf = (j, g, t) => (open
    ? mid(t) + g + (j / (cols - 1)) * (T2 - 2 * g)
    : -Math.PI + (j / cols) * T2);

  const foldOf = (theta, t) => (fold
    ? 1 + fold.amp * t * Math.sin(fold.count * theta + (fold.phase ?? 0))
    : 1);

  for (let r = 0; r < total; r++) {
    const onHem = hem && r >= rings;
    const t = onHem ? 1 : r / (rings - 1);
    const s = at(t);
    const g = open ? gapAt(t) : 0;
    const hk = onHem ? (r - rings + 1) / hemRings : 0;
    for (let j = 0; j < cols; j++) {
      const theta = thetaOf(j, g, t);
      const f = foldOf(theta, t) * (onHem ? lerp(1, 1 - hemPull, hk) : 1);
      const drop = onHem ? hem(theta) * hk : 0;
      pos.push(
        s.cx + s.rx * f * Math.sin(theta),
        s.y - drop,
        s.cz + s.rz * f * Math.cos(theta)
      );
      uv.push(j / (cols - 1), 1 - r / (total - 1));
    }
  }

  const colsWrap = open ? cols - 1 : cols;
  for (let r = 0; r < total - 1; r++) {
    for (let j = 0; j < colsWrap; j++) {
      const a = r * cols + j;
      const b = r * cols + ((j + 1) % cols);
      const c = (r + 1) * cols + ((j + 1) % cols);
      const d = (r + 1) * cols + j;
      idx.push(a, b, c, a, c, d);
    }
  }

  if (capTop) {
    const s = at(0);
    const centre = pos.length / 3;
    pos.push(s.cx, s.y + 0.004, s.cz);
    uv.push(0.5, 1);
    for (let j = 0; j < colsWrap; j++) idx.push(centre, (j + 1) % cols, j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return finish(geo, { crease: cr, crack, wear, seed });
}

/** A flat hanging layer with a torn bottom edge and a bow across its width. */
export function tornPanel({
  w, y0, y1, z = 0, bow = 0.05, cols = 22, rows = 14, hem = null,
  fold = null, seed = 5, crease: cr = null, crack = null, wear = null, sway = 0,
}) {
  const pos = [], uv = [], idx = [];
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    for (let j = 0; j < cols; j++) {
      const u = -1 + (j / (cols - 1)) * 2;
      const drop = hem ? hem(u) * t * t : 0;
      const ripple = fold ? fold.amp * t * Math.sin(fold.count * u * Math.PI + (fold.phase ?? 0)) : 0;
      pos.push(
        (u * w) / 2 + sway * t * t,
        lerp(y0, y1, t) - drop,
        z + bow * (1 - u * u) + ripple
      );
      uv.push((u + 1) / 2, 1 - t);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = r * cols + j;
      idx.push(a, a + 1, a + cols + 1, a, a + cols + 1, a + cols);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return finish(geo, { crease: cr, crack, wear, seed });
}

/**
 * A band wound round the body: cowl, sash, ankle wrap.
 * One helical sweep, so the wrap arrives back where it started with a real
 * overlap — three separate tori always read as three separate tori.
 */
export function wrapCoil({
  y0, y1, rx, rz, turns = 2.2, phase = 0, thick = 0.026, tilt = 0.012,
  cx = 0, cz = 0, bias = 0, sides = 0, flatten = 1,
  along = 110, radial = 9, wobble = 0.05, seed = 9,
  crease: cr = null, crack = null, wear = null,
}) {
  const pts = [];
  const mid = (y0 + y1) / 2;
  /* The section is flattened after sweeping (a wound band, not a rope), and
     that scale hits the PATH as well — so every height authored here came out
     compressed toward the midpoint, and a flank lifted to 1.565 arrived at
     1.545. Pre-divide the path's vertical excursion so y0, y1, tilt, bias and
     sides all mean exactly what they say once the section is squashed. */
  const inv = flatten !== 0 ? 1 / flatten : 1;
  for (let i = 0; i <= along; i++) {
    const s = i / along;
    const a = phase + s * turns * T2;
    const f = 1 + wobble * Math.sin(a * 3 + phase) + wobble * 0.5 * Math.sin(a * 7);
    /* `bias` drops the FRONT of the wrap and lifts the back — a scarf's top
       edge sits under the chin and rides up behind the nape.
       `sides` lifts BOTH flanks and neither front nor back. `tilt` cannot do
       this: being odd in the angle it raises one side while dropping the
       other, so a cowl asked for width beside the face got it on one side
       only and measured 131 mm narrow. |sin| is even, so both flanks rise. */
    const y = lerp(y0, y1, s) + tilt * Math.sin(a) - bias * Math.cos(a) + sides * Math.abs(Math.sin(a));
    pts.push(new THREE.Vector3(
      cx + rx * f * Math.sin(a),
      mid + (y - mid) * inv,
      cz + rz * f * Math.cos(a)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
  const geo = new THREE.TubeGeometry(curve, Math.round(along * 0.8), thick, radial, false);
  /* Wound CLOTH is a flat band, not a rope. Squashing the swept section is the
     difference between a wrapped sash and a rolled towel. The path was
     pre-compensated above, so only the section actually flattens. */
  if (flatten !== 1) {
    geo.translate(0, -mid, 0);
    geo.scale(1, flatten, 1);
    geo.translate(0, mid, 0);
  }
  return finish(geo, { crease: cr, crack, wear, seed });
}

/* ------------------------------------------------------------ displacement */

/** Coherent wrinkle along vertex normals. `bands` adds cloth's horizontal
 *  crush; `drape` adds the vertical fold noise a hanging surface carries. */
export function crease(geo, { amp = 0.005, freq = 22, bands = 0, bandFreq = 40, drape = 0, seed = 3 } = {}) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let d = (noise3(x * freq, y * freq, z * freq, seed) - 0.5) * 2 * amp;
    if (bands) d += Math.sin(y * bandFreq + noise3(x * 6, y * 3, z * 6, seed) * 4) * bands;
    if (drape) d += Math.sin(Math.atan2(x, z) * 11 + y * 3) * drape;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  p.needsUpdate = true;
  return geo;
}

/** The crazed plate network as shallow relief: broad cells pushed out, their
 *  boundaries pulled in. Reads as fired clay under a raking key. */
export function crackRidge(geo, { amp = 0.004, cell = 34, sharp = 3.2, seed = 5 } = {}) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = noise3(x * cell, y * cell, z * cell, seed);
    const b = noise3(x * cell * 1.7 + 3.1, y * cell * 1.7, z * cell * 1.7, seed + 17);
    // ridged: distance from the nearest "seam" of the two fields
    const seam = Math.abs(a - b);
    const d = (Math.pow(clamp(seam * 2.4, 0, 1), 1 / sharp) - 0.55) * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  p.needsUpdate = true;
  return geo;
}

/** Height-graded value into the colour attribute. Hems soil, uppers dust. */
export function wearColours(geo, { top = 1.0, hem = 0.78, y0 = null, y1 = null, blotch = 0.12, seed = 13 } = {}) {
  const p = geo.attributes.position;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; }
  const a = y0 ?? lo, b = y1 ?? hi;
  const col = new Float32Array(p.count * 3);
  const rand = rnd(seed);
  const jitters = [];
  for (let i = 0; i < 24; i++) jitters.push(1 - blotch * rand());
  for (let i = 0; i < p.count; i++) {
    const t = clamp((p.getY(i) - a) / Math.max(b - a, 1e-5), 0, 1);
    const v = lerp(hem, top, Math.pow(t, 0.85)) * jitters[i % jitters.length];
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/* --------------------------------------------------------------- utilities */

/** Rotate a finished garment piece about a PIVOT of its own, then move it.
 *
 *  geo.rotateZ() turns about the geometry's origin, which for a piece authored
 *  in figure space is the floor — so a 0.10 rad tilt on a panel hanging at
 *  1.4 m swings it 139 mm sideways. That is how the cowl's hanging fold ended
 *  up 74 mm outside the plate's silhouette while its own numbers looked right.
 *  Always pose cloth about the point it hangs from. */
export function poseGeo(geo, { pivot = [0, 0, 0], rx = 0, ry = 0, rz = 0, move = [0, 0, 0] } = {}) {
  const [px, py, pz] = pivot;
  geo.translate(-px, -py, -pz);
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  geo.translate(px + move[0], py + move[1], pz + move[2]);
  return geo;
}

/** hm-actor-skin's sculpt operators, applied to a BufferGeometry. */
export function sculptGeo(geo, ops) {
  const p = geo.attributes.position;
  const verts = [];
  for (let i = 0; i < p.count; i++) verts.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
  sculpt(verts, ops);
  for (let i = 0; i < verts.length; i++) p.setXYZ(i, verts[i].x, verts[i].y, verts[i].z);
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Drop triangles whose vertices all fall inside a test — how the ash wrap
 *  gets its face opening without a second boundary surface. */
export function cutFaces(geo, inside) {
  const p = geo.attributes.position, idx = geo.index;
  const flag = [];
  for (let i = 0; i < p.count; i++) flag.push(inside(p.getX(i), p.getY(i), p.getZ(i)));
  const keep = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    if (flag[a] && flag[b] && flag[c]) continue;
    keep.push(a, b, c);
  }
  geo.setIndex(keep);
  return geo;
}

/** Merge geometries that share a material. Keeps draw calls near the section
 *  count rather than the primitive count. */
export function mergeGeos(list) {
  const geos = list.filter(Boolean);
  if (geos.length === 1) return geos[0];
  let n = 0, ni = 0;
  for (const g of geos) {
    if (!g.attributes.normal) g.computeVertexNormals();
    n += g.attributes.position.count;
    ni += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of geos) {
    const gp = g.attributes.position, gn = g.attributes.normal;
    const gu = g.attributes.uv, gc = g.attributes.color;
    for (let i = 0; i < gp.count; i++) {
      pos[(vo + i) * 3] = gp.getX(i); pos[(vo + i) * 3 + 1] = gp.getY(i); pos[(vo + i) * 3 + 2] = gp.getZ(i);
      nrm[(vo + i) * 3] = gn.getX(i); nrm[(vo + i) * 3 + 1] = gn.getY(i); nrm[(vo + i) * 3 + 2] = gn.getZ(i);
      uv[(vo + i) * 2] = gu ? gu.getX(i) : 0; uv[(vo + i) * 2 + 1] = gu ? gu.getY(i) : 0;
      const c = gc ? gc.getX(i) : 1;
      col[(vo + i) * 3] = c; col[(vo + i) * 3 + 1] = gc ? gc.getY(i) : c; col[(vo + i) * 3 + 2] = gc ? gc.getZ(i) : c;
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.getX(i) + vo;
    else for (let i = 0; i < gp.count; i++) idx[io + i] = i + vo;
    io += g.index ? g.index.count : gp.count;
    vo += gp.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

/** Triangle count of a geometry, measured. */
export const tris = (g) => Math.round((g.index ? g.index.count : g.attributes.position.count) / 3);
