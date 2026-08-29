/* =========================================================================
   hm-husk-sections.js — the Ashbound husk, one generator per section
   -------------------------------------------------------------------------
   WHY THIS FILE EXISTS. The first Ash Husk was one function that emitted
   about forty primitives in one pass. When it came out wrong there was no
   part of it you could look at on its own, and no statement anywhere of what
   any measurement was taken from. Every number was a guess wearing a comment.

   So the subject is cut into ELEVEN generators, each of which owns one
   section of the plate, declares its own variant axes, and can be built,
   soloed and measured alone. The viewer lists them; you can switch any one
   off and see what it was carrying.

   AUTHORITY. Every dimension in PLATE below was measured off
   assets/enemies/ash-husk-v1.png by scanning the silhouette — crown at row
   82, sole at row 1441, so 1359 px spans the declared 1.74 m and one
   centimetre is 7.8 px. Where a number is a measurement it says what it
   measured. Where the plate cannot show a number (front-to-back depth, from
   a single orthographic view) the generator says DERIVED and gives the ratio
   it used. Nothing here is "tuned until it looked right".

   Metres, +Y up, sole at y = 0, figure faces +Z, angles from +Z toward +X.
   The figure's LEFT is +X — a plate read left-to-right is mirrored.
   ========================================================================= */

import * as THREE from 'three';
import { buildHead } from './hm-actor-skin.js';
import {
  buildHuskFace, buildLashSeam, buildMouthSeam, buildNostril, buildBrowRidge,
} from './hm-face.js';
import {
  DEPTH, layerR, layerZ, layerZMin, layerStations, sashR, robeR,
} from './hm-husk-layers.js';
import {
  clothLoft, tornPanel, tornHem, tornEdge, wrapCoil, crease, crackRidge,
  wearColours, sculptGeo, cutFaces, mergeGeos, poseGeo, rnd, lerp, smooth, clamp, T2, tris,
} from './hm-husk-cloth.js';

/* ============================================================= measurement
   Heights are metres above the sole. `px` keeps the row the number came from
   so a reviewer can re-measure rather than trust this table. */
export const PLATE = {
  file: '../assets/enemies/ash-husk-v1.png',
  scale: { crownPx: 82, solePx: 1441, centrePx: 509.8, mmPerPx: 1.28, height: 1.74 },

  crown: 1.740,            // px 82
  headBreadth: 0.172,      // px rows 142–182, widest of the ash wrap
  chin: 1.530,             // px ~243
  browY: 1.630,            // px ~167, closed lids just under it

  cowl: { top: 1.530, bottom: 1.405, span: 0.300 },   // px 243–319, width 246 px
  shoulderY: 1.445,        // px ~300
  shoulderSpan: 0.430,     // px rows 282–302: 330–339 px

  tablet: { cx: -0.013, cy: 1.289, w: 0.246, h: 0.215, rim: 0.020, proud: 0.022 },
  ember: { yFrom: 1.172, yTo: 1.388, xFrom: -0.151, xTo: 0.114 },   // warm-pixel bbox

  sash: { top: 1.160, bottom: 1.030, centre: 1.096 },
  waistY: 1.096,

  elbowY: 1.100, wristY: 0.836, handY: 0.770,
  handOut: { R: -0.303, L: 0.206 },       // plate is asymmetric; kept asymmetric
  sleeveWidest: { y: 0.665, span: 0.834, outer: 0.417 },
  sleeveTip: 0.360,        // lowest sleeve tongue, px ~1160

  mantle: { hemBase: 0.460, tip: 0.300, spanAtHem: 0.501 },   // px 1205–1250 width 0.50
  tunic: { top: 1.100, tip: 0.330, width: 0.230 },

  hipY: 0.920, kneeY: 0.490, ankleY: 0.115,
  boot: { len: 0.245, height: 0.115, outerSpan: 0.521, toeOutL: -0.318, toeOutR: 0.203 },

  /* Total silhouette width at height, measured row by row. The model measures
     its own and the viewer prints the difference — a claim of fidelity that
     is checked rather than asserted.

     `tongue` rows sit in the hem region, where which pendant tongue a row
     crosses decides the number: the plate itself swings 300 mm between rows
     20 px apart there. Those rows are printed and not counted, because
     counting them would score tongue phase rather than fidelity. */
  silhouette: [
    [1.71, 0.128, 'hard'], [1.66, 0.172, 'hard'], [1.56, 0.252, 'hard'],
    [1.51, 0.315, 'soft'], [1.46, 0.423, 'hard'], [1.41, 0.465, 'hard'],
    [1.36, 0.511, 'hard'], [1.31, 0.526, 'hard'], [1.20, 0.595, 'hard'],
    [1.10, 0.635, 'hard'], [1.00, 0.717, 'hard'], [0.90, 0.755, 'hard'],
    [0.79, 0.791, 'hard'], [0.69, 0.818, 'hard'], [0.64, 0.834, 'hard'],
    [0.56, 0.809, 'soft'], [0.46, 0.438, 'tongue'], [0.36, 0.648, 'tongue'],
    [0.30, 0.501, 'soft'], [0.20, 0.517, 'tongue'], [0.15, 0.461, 'tongue'],
    [0.05, 0.521, 'hard'],
  ],
};

/** Rest joints, derived from PLATE. The figure is posed from these. */
export const JOINTS = {
  pelvis: [0, PLATE.hipY, 0],
  spine: [0, 1.060, 0],
  chest: [0, 1.260, 0],
  neck: [0, 1.430, 0.004],
  head: [0, 1.632, -0.004],
  /* Shoulder half-separation 0.150: the plate is 0.423 m across at 1.46 m,
     and the sleeve cap adds its own radius on top of the joint. Wrists keep
     the plate's asymmetry — 0.206 m out on the left, 0.303 m on the right. */
  shoulderL: [0.150, PLATE.shoulderY, 0],
  shoulderR: [-0.150, PLATE.shoulderY, 0],
  elbowL: [0.182, PLATE.elbowY, 0.014],
  elbowR: [-0.196, PLATE.elbowY, 0.014],
  wristL: [0.212, PLATE.wristY, 0.022],
  wristR: [-0.288, PLATE.wristY, 0.022],
  hipL: [0.086, PLATE.hipY, 0],
  hipR: [-0.092, PLATE.hipY, 0],
  kneeL: [0.096, PLATE.kneeY, 0.010],
  kneeR: [-0.112, PLATE.kneeY, 0.010],
  ankleL: [0.112, PLATE.ankleY, 0.020],
  ankleR: [-0.155, PLATE.ankleY, -0.030],
};

/** Foot yaw, read off the plate: the right boot is turned right out (its toe
 *  tip lands at -0.318 m, which no forward-facing foot at this stance width
 *  can reach), the left is nearly forward. Symmetric feet are the tell of a
 *  model nobody looked at. */
export const FOOT_YAW = { L: 0.22, R: -1.12 };

/* Variant resolution. Same contract as hm-steam.js's axesOf — kept local so
   this page does not pull the whole steam kit to build one enemy.

   CONVENTION, and the fix for a real defect: index 0 on EVERY axis is the
   plate as drawn. Index 1 is the lighter reading, index 2 the heavier. It used
   to be lo/mid/hi with optional parts gated `if (axis > 0)`, which meant
   variant 0 — the default the viewer builds and the one every screenshot shows
   — silently omitted the tablet harness, the mantle under-layer, the cowl
   fold, the tunic column and cross drape, the sash tail and the boot soles,
   while the conformance panel claimed all of them were built. An axis may vary
   a form; it may not decide whether the subject's own plate is honoured. */
export function axesOf(variant, axes) {
  const out = {};
  let v = Math.max(0, variant | 0);
  for (const k of Object.keys(axes)) { out[k] = v % axes[k]; v = Math.floor(v / axes[k]); }
  return out;
}
const A3 = (a, asDrawn, lighter, heavier) => [asDrawn, lighter, heavier][clamp(a, 0, 2)];
/** Two-state axis: index 0 keeps the part the plate shows. */
const A2 = (a) => a === 0;

/* Which bones each garment is allowed to bind to. Declared per section
   because the skirt ring and the sleeve drape share the volume around the
   hip: on distance alone the bell sleeve gave a quarter of its weight to
   skirt bones and stopped following the elbow entirely. `*` is a prefix. */
export const BIND_SETS = {
  sleeveL: ['chest', 'shoulderL', 'elbowL', 'wristL', 'drapeAL', 'drapeBL'],
  sleeveR: ['chest', 'shoulderR', 'elbowR', 'wristR', 'drapeAR', 'drapeBR'],
  mantle: ['pelvis', 'spine', 'chest', 'shoulderL', 'shoulderR', 'skirt*'],
  tunic: ['pelvis', 'spine', 'chest', 'skirt*'],
  sash: ['pelvis', 'spine', 'sashTail'],
  cowl: ['chest', 'neck', 'head', 'cowlFold'],
  neck: ['chest', 'neck', 'head'],
  legL: ['pelvis', 'hipL', 'kneeL', 'ankleL'],
  legR: ['pelvis', 'hipR', 'kneeR', 'ankleR'],
};

/* A flat strap swept along a path — the tablet harness, and nothing else in
   the kit had one. Two rings per sample, so it is a band and not a cord.

   The band's frame is built from the OUTWARD RADIAL direction, not from world
   up. A strap crossing the shoulder crest has a near-vertical tangent there,
   and `tan x up` collapses exactly at that point — so the frame flipped, the
   band's corners swung inward, and the mantle came through the harness laid
   over it. The radial direction is never parallel to the path of something
   lying ON a torso, which is the whole reason to use it. */
function ribbon(points, w, t, seed = 3, depth = DEPTH) {
  const pos = [], uv = [], idx = [];
  const n = points.length;
  const nor = new THREE.Vector3(), side = new THREE.Vector3(), tan = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const p = points[i];
    tan.subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]).normalize();
    nor.set(p.x, 0, p.z / depth);
    if (nor.lengthSq() < 1e-8) nor.set(0, 0, 1);
    nor.normalize();
    side.crossVectors(tan, nor);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();
    for (let k = 0; k < 4; k++) {
      const sx = (k === 0 || k === 3) ? -0.5 : 0.5;
      const sy = (k < 2) ? 0.5 : -0.5;
      pos.push(
        p.x + side.x * sx * w + nor.x * sy * t,
        p.y + side.y * sx * w + nor.y * sy * t,
        p.z + side.z * sx * w + nor.z * sy * t
      );
      uv.push(k / 3, i / (n - 1));
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + ((k + 1) % 4);
      idx.push(a, b, b + 4, a, b + 4, a + 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  crease(g, { amp: 0.0025, freq: 90, seed });
  wearColours(g, { top: 1.0, hem: 0.86 });
  return g;
}

/** A swept tube with an elliptical, per-station section — fingers, palms,
 *  wrinkle rolls. `digit` is the circular special case of this. */
function sweep(pathPts, rx, rz, radial = 9) {
  const pos = [], uv = [], idx = [];
  const n = pathPts.length;
  for (let i = 0; i < n; i++) {
    const p = pathPts[i];
    const tan = pathPts[Math.min(n - 1, i + 1)].clone().sub(pathPts[Math.max(0, i - 1)]).normalize();
    const ref = Math.abs(tan.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(tan, ref).normalize();
    const v = new THREE.Vector3().crossVectors(u, tan).normalize();
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * T2;
      const ca = Math.cos(a) * rx[i], sa = Math.sin(a) * rz[i];
      pos.push(p.x + u.x * ca + v.x * sa, p.y + u.y * ca + v.y * sa, p.z + u.z * ca + v.z * sa);
      uv.push(j / radial, i / (n - 1));
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j, b = i * radial + ((j + 1) % radial);
      idx.push(a, b, b + radial, a, b + radial, a + radial);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ======================================================== 01 · head + face
   The plate's head is the whole reason this subject is not a monster: an
   ordinary human face, eyes closed, chin down, under a cracked ash wrap that
   covers the cranium and leaves an oval opening. Both surfaces carry the same
   crazing, because the ash cured over the skin as well as the cloth. */
export const HEAD_AXES = { wrapCut: 3, crust: 3, gaunt: 3 };
export function huskHead(ctx, variant = 0) {
  const a = axesOf(variant, HEAD_AXES);
  const S = 1.18;                       // ash wrap scale; it measures right against the plate
  const crust = A3(a.crust, 0.0026, 0.0016, 0.0038);
  const parts = [];

  /* The wrap is still built on hm-actor-skin's proportions, squeezed to a
     skull rather than an egg. The FACE no longer is — see below. */
  const SQ = [0.88, 1.06, 0.98];
  const sq = (g) => { g.scale(SQ[0], SQ[1], SQ[2]); return g; };
  const V = (x, y, z) => new THREE.Vector3(x * S, y * S, z * S);

  /* Face: kit/hm-face.js, which builds the head from canonical facial
     proportion at 96x72 instead of stacking operators on a 40x30 sphere.
     FS solves the chin: buildHuskFace puts it at -HH/2 = -0.1125 head units,
     the head joint is at 1.632, and PLATE.chin is 1.530, so FS = 0.102/0.1125.
     The 12 mm forward shift seats the facial plane in the wrap's opening —
     cheeks flush with the crust, nose and brow proud of it. */
  const FS = 0.907;
  const { geo: face, landmarks: lm } = buildHuskFace({
    S: FS,
    gaunt: A3(a.gaunt, 0.88, 0.66, 1.0),
    asym: 0.45, age: 0.78, detail: 1,
  });
  face.translate(0, 0, 0.012 * FS);
  /* Crazing on the face is a tenth of what the cloth carries. The ash cured
     over skin too, but at 3 mm cells it ate the lid creases and the nasolabial
     fold — the exact features that stop a head reading as an ovoid. */
  crackRidge(face, { amp: crust * 0.10, cell: 320, sharp: 2.4, seed: 12 });
  face.computeVertexNormals();
  wearColours(face, { top: 1.02, hem: 0.9, blotch: 0.06 });
  parts.push({ name: 'husk-face', joint: 'head', local: true, rigid: true, geometry: face, material: 'skin' });

  /* Brow relief, one ridge per side. */
  const brows = [buildBrowRidge(lm, FS, -1), buildBrowRidge(lm, FS, 1)];
  const browGeo = mergeGeos(brows);
  browGeo.translate(0, 0, 0.012 * FS);
  wearColours(browGeo, { top: 0.86, hem: 0.8 });
  parts.push({ name: 'husk-brow-ridges', joint: 'head', local: true, rigid: true, geometry: browGeo, material: 'skin' });

  /* Lash and mouth seams stay separate pieces so they read dark under a key
     from above; a groove in the surface lights its own upper wall and
     disappears. Nostrils are inset for the same reason. */
  const seams = [
    buildLashSeam(lm, FS, -1), buildLashSeam(lm, FS, 1),
    buildMouthSeam(lm, FS),
    buildNostril(lm, FS, -1), buildNostril(lm, FS, 1),
  ];
  const seamGeo = mergeGeos(seams);
  seamGeo.translate(0, 0, 0.012 * FS);
  parts.push({ name: 'husk-face-seams', joint: 'head', local: true, rigid: true, geometry: seamGeo, material: 'dark' });

  /* Ash wrap: a full shell with the face oval and the neck hole cut out of
     it, so it is one crust over the skull rather than a cap sitting on top. */
  const openW = A3(a.wrapCut, 0.050, 0.055, 0.060) * S;
  const openH = A3(a.wrapCut, 0.058, 0.064, 0.070) * S;
  const wrap = new THREE.SphereGeometry(1, 44, 32);
  /* 2 mm proud of the face, not 7: the wrap is ash cured ONTO the skin, and a
     shell standing off it turns the exposed face into a cave. Breadth 0.178 m
     against the plate's 0.172 at its widest row, and the lateral flare below
     answers the plate's 0.252 m at 1.56 m — the band the cowl used to be
     pushed up into. */
  wrap.scale(0.0762 * S, 0.0895 * S, 0.0845 * S);
  wrap.translate(0, 0.004 * S, -0.004 * S);
  cutFaces(wrap, (x, y, z) => {
    if (y < -0.070 * S) return true;                              // neck hole
    const u = x / openW;
    const dy = y + 0.010 * S;
    const v = dy / (dy > 0 ? openH : openH * 0.92);
    /* The opening stops at the jaw. Cutting below it opened a hole under the
       chin that looked straight into the inside of the shell. */
    return z > 0.014 * S && y > -0.060 * S && u * u + v * v < 1;
  });
  sculptGeo(wrap, [
    /* Skull, not egg: flatten the occiput, narrow the crown, hold the temples,
     * shelf the mandible and roll the nape. An ellipsoid with a hole in it
     * reads as an egg with a hole in it from every angle. */
    { c: V(0, 0.030, -0.078), r: 0.052, dir: V(0, 0, 1).normalize(), strength: 0.010 * S, sharp: 1.2 },
    { c: V(0, 0.086, 0), r: 0.046, dir: 'lateral', strength: -0.008 * S, mirror: true },
    { c: V(0.072, 0.030, 0.004), r: 0.030, dir: 'lateral', strength: 0.004 * S, mirror: true },
    { c: V(0.062, -0.040, 0.010), r: 0.030, dir: 'lateral', strength: -0.007 * S, mirror: true },
    { c: V(0.058, -0.026, -0.012), r: 0.024, dir: 'normal', strength: 0.005 * S, mirror: true },
    { c: V(0, -0.052, -0.062), r: 0.040, dir: 'normal', strength: 0.008 * S },
    { c: V(0.068, -0.004, 0.010), r: 0.026, dir: 'lateral', strength: 0.005 * S, mirror: true },
    { c: V(0, 0.092, -0.010), r: 0.038, dir: V(0, -1, 0), strength: 0.004 * S },
  ]);
  crease(wrap, { amp: 0.0012, freq: 190, seed: 31 });
  crackRidge(wrap, { amp: crust * 0.9, cell: 56, sharp: 3.2, seed: 7 });
  crackRidge(wrap, { amp: crust * 0.45, cell: 190, sharp: 2.6, seed: 19 });
  sq(wrap);
  wrap.computeVertexNormals();
  wearColours(wrap, { top: 1.04, hem: 0.88, blotch: 0.1 });
  parts.push({ name: 'ash-wrap-skullcap', joint: 'head', local: true, rigid: true, geometry: wrap, material: 'crust' });

  /* The rolled edge of the opening. It must trace the CUT and nothing else:
     built on its own slightly larger ellipse with a 4.2 mm tube it stood off
     the hole and arced over the forehead, reading as a headphone band. Now it
     shares openW / openH / the jaw clamp with cutFaces above, and the tube is
     thin enough to be a lip on a crust rather than a hoop. */
  {
    const A = 0.0762 * S, B = 0.0895 * S, C = 0.0845 * S;
    const yFloor = -0.060 * S;
    const pts = [];
    for (let i = 0; i < 44; i++) {
      const t = (i / 44) * T2;
      const ct = Math.cos(t), stt = Math.sin(t);
      const x = openW * ct;
      const dy = stt >= 0 ? openH * stt : openH * 0.92 * stt;
      const y = Math.max(yFloor, -0.010 * S + dy);
      const u = x / A, w = (y - 0.004 * S) / B;
      const z = -0.004 * S + C * Math.sqrt(Math.max(0.02, 1 - u * u - w * w));
      pts.push(new THREE.Vector3(x, y, z));
    }
    const lip = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.3), 72, 0.0021 * S, 5, true);
    lip.computeVertexNormals();
    wearColours(lip, { top: 1.02, hem: 0.9 });
    parts.push({ name: 'ash-wrap-opening-lip', joint: 'head', local: true, rigid: true, geometry: sq(lip), material: 'crust' });
  }

  /* Neck. There was none: the head sat above the cowl over open air, and the
     face opening looked through the skull into the inside of the wrap. */
  const neck = clothLoft({
    stations: [
      { y: 1.548, rx: 0.058, rz: 0.056 }, { y: 1.470, rx: 0.055, rz: 0.054 },
      { y: 1.400, rx: 0.058, rz: 0.058 }, { y: 1.330, rx: 0.070, rz: 0.068 },
    ],
    columns: 20, ringsPer: 2,
    crease: { amp: 0.0016, freq: 120, seed: 37 },
    crack: { amp: 0.0012, cell: 200 },
    wear: { top: 0.96, hem: 0.86 },
  });
  parts.push({ name: 'husk-neck', joint: 'neck', bind: BIND_SETS.neck, geometry: neck, material: 'skin' });

  return { parts };
}

/* ======================================================= 02 · throat cowl
   Not a collar. The plate wraps a heavy scarf twice round the throat, and its
   bulk is what separates the bowed head from the shoulders. Built as helical
   wraps so each pass overlaps the one under it. */
export const COWL_AXES = { wraps: 3, bulk: 3, fold: 2 };
export function huskCowl(ctx, variant = 0) {
  const a = axesOf(variant, COWL_AXES);
  const bulk = A3(a.bulk, 1.0, 0.88, 1.14);
  const g = [];

  const coil = (y0, y1, rx, thick, turns, phase, bias = 0, cz = 0, sides = 0) => wrapCoil({
    y0, y1, rx: rx * bulk, rz: rx * bulk * 0.86, thick: thick * bulk, cz, flatten: 0.78,
    turns, phase, bias, sides, along: 96, radial: 8, wobble: 0.055,
    crease: { amp: 0.003, freq: 60, bands: 0.0016, bandFreq: 220, seed: 17 },
    crack: { amp: 0.0022, cell: 90 },
    wear: { top: 1.0, hem: 0.9, blotch: 0.1 },
  });

  /* A helix exists at only ONE angle at its own top, so a pass whose y0 is
     the height you need covered contributes a single tube crossing there.
     Each pass therefore starts ABOVE its band, at the BACK (phase pi), with a
     front bias: low under the chin, bunched behind the nape.

     HEIGHTS ARE PINNED TO PLATE.cowl (1.405–1.530). They were raised four
     times chasing the plate's 0.252 m width at 1.56 m and ended up topping out
     at 1.625 — 95 mm above the declared band — which swallowed the jaw and the
     lower face, the single worst thing in the render. That width belongs
     BESIDE the face, not over it, so it is answered with `sides`, which lifts
     both flanks and leaves front and back alone. The front clears PLATE.chin
     at 1.530 by about 70 mm. */
  g.push(coil(1.496, 1.462, 0.128, 0.026, 1.00, Math.PI, 0.038, -0.014, 0.062));
  g.push(coil(1.478, 1.430, 0.124, 0.030, 1.15, Math.PI + 0.7, 0.030, -0.012, 0.036));
  const wrapCount = A3(a.wraps, 4, 3, 2);
  if (wrapCount > 2) g.push(coil(1.440, 1.400, 0.128, 0.032, 1.25, 0.4, 0.014));
  if (wrapCount > 3) g.push(coil(1.404, 1.372, 0.132, 0.028, 0.90, 2.4));

  const parts = [{ name: 'cowl-wraps', joint: 'neck', bind: BIND_SETS.cowl, geometry: mergeGeos(g), material: 'crust' }];

  /* The hanging fold, on the figure's LEFT as the plate shows it (+X). */
  if (A2(a.fold)) {
    const flap = tornPanel({
      w: 0.115, y0: 1.446, y1: 1.318, z: 0.052, bow: 0.030, cols: 14, rows: 12,
      hem: tornEdge({ count: 2, depth: 0.045, seed: 23 }),
      fold: { count: 3, amp: 0.012 },
      crease: { amp: 0.0035, freq: 70, seed: 29 }, crack: { amp: 0.002, cell: 90 },
      wear: { top: 1.0, hem: 0.84 },
    });
    poseGeo(flap, { pivot: [0, 1.446, 0.052], ry: 0.5, rz: -0.10, move: [0.086, 0.026, 0.028] });
    parts.push({ name: 'cowl-hanging-fold', joint: 'neck', bind: BIND_SETS.cowl, geometry: flap, material: 'crust' });
  }
  return { parts };
}

/* ====================================================== 03 · mantle / robe
   The silhouette. Measured: 0.423 m across at the shoulder, widening to
   0.501 m at the hem, hem tongues bottoming at 0.30 m above the sole. Front
   closed to the waist, then opening over the rust underlayer. ONE lofted
   surface plus one shorter under-layer, because the plate's hem is several
   torn edges at different heights and a single edge reads as a costume. */
export const MANTLE_AXES = { tongues: 3, flare: 3, folds: 3, underLayer: 2 };
export function huskMantle(ctx, variant = 0) {
  const a = axesOf(variant, MANTLE_AXES);
  const flare = A3(a.flare, 1.0, 0.94, 1.07);
  const nT = A3(a.tongues, 9, 7, 11);
  const folds = A3(a.folds, 13, 11, 16);
  const dz = DEPTH;

  /* Stations come from the layer stack, which derives from the plate rather
     than restating it. The cinch through the sash band lives in robeR(). */
  const HY = [1.500, 1.470, 1.430, 1.330, 1.200, 1.060, 0.900, 0.700, 0.540, 0.460];
  const outer = clothLoft({
    stations: layerStations('mantleOuter', HY, { scale: flare, depth: dz }),
    columns: 54, ringsPer: 3, capTop: true,
    gapAt: (t) => (t < 0.42 ? 0 : smooth((t - 0.42) / 0.58) * 0.55),
    /* Depth 0.26 with vary 0.62 spreads the tips from 0.20 m to 0.46 m. The
       plate keeps a continuous ~0.50 m silhouette all the way down to 0.15 m,
       and that is long thin tongues, not the body of the robe. */
    hem: tornHem({ count: nT, depth: 0.260, vary: 0.62, tipPow: 1.15, width: 1.15, jag: 0.008, seed: 21 }),
    hemRings: 6, hemPull: 0.045,
    /* Fold amplitude is halved through the cinch: cloth pulled in at the waist
       gathers, it does not billow, and a billowing fold there is what pushed
       the mantle 13 mm past its own station into the sash. */
    fold: { count: folds, amp: 0.052, phase: 0.7 },
    crease: { amp: 0.004, freq: 46, drape: 0.0022, seed: 33 },
    crack: { amp: 0.0032, cell: 52, sharp: 3.0 },
    wear: { top: 1.02, hem: 0.74, blotch: 0.14 },
  });
  const parts = [{ name: 'mantle-outer', joint: 'chest', bind: BIND_SETS.mantle, geometry: outer, material: 'crust' }];

  if (A2(a.underLayer)) {
    const under = clothLoft({
      stations: layerStations('mantleUnder', [1.330, 1.140, 0.940, 0.740, 0.600, 0.520], { depth: dz }),
      columns: 40, ringsPer: 3,
      gapAt: (t) => (t < 0.30 ? 0 : smooth((t - 0.30) / 0.70) * 0.42),
      hem: tornHem({ count: nT - 2, depth: 0.200, vary: 0.50, tipPow: 1.05, width: 1.2, jag: 0.007, seed: 47, phase: 0.6 }),
      hemRings: 5,
      fold: { count: folds - 3, amp: 0.048, phase: 2.2 },
      crease: { amp: 0.0035, freq: 44, seed: 51 },
      crack: { amp: 0.0026, cell: 56 },
      wear: { top: 0.96, hem: 0.7, blotch: 0.16 },
    });
    parts.push({ name: 'mantle-under-layer', joint: 'chest', bind: BIND_SETS.mantle, geometry: under, material: 'mantle' });
  }
  return { parts };
}

/* ======================================================= 04 · bell sleeves
   The plate's most distinctive section and the one the old model missed
   completely: the drape hangs 0.74 m from the elbow, reaching 0.417 m out
   from the centreline at 0.665 m above the sole, and its FRONT is open — the
   hand hangs clear of the cloth and you see the dark inside of the sleeve
   behind it. A closed cone hides the hands and kills the read. */
export const SLEEVE_AXES = { tongues: 3, volume: 3, mouth: 3 };
export function huskSleeve(ctx, variant = 0, side = 1) {
  const a = axesOf(variant, SLEEVE_AXES);
  const vol = A3(a.volume, 1.0, 0.92, 1.08);
  const mouth = A3(a.mouth, 1.15, 0.95, 1.35);
  const key = side > 0 ? 'L' : 'R';
  const dz = 0.82;                     // DERIVED: sleeve section is rounder than the robe
  /* The plate is asymmetric: the right arm hangs 0.303 m out, the left 0.206.
     Keeping that is most of why the stance reads as a body and not a mirror. */
  const reach = side > 0 ? 0.93 : 1.05;

  const st = (y, rx, cx) => ({ y, rx: rx * vol, rz: rx * vol * dz, cx: side * cx * reach });
  const geo = clothLoft({
    /* Ten stations, each solved against the plate's own width at that height:
       0.465 m at 1.41, 0.595 m at 1.20, 0.717 m at 1.00, 0.834 m at 0.64. The
       drape's centre walks outward as it falls, which is why the hand ends up
       at the inner edge of the cloth rather than in the middle of it. The top
       three stations are deliberately tight — carrying the shoulder cap out to
       0.172 m put the 1.41 and 1.36 bands 97 mm and 60 mm over the plate. */
    stations: [
      st(1.500, 0.078, 0.140), st(1.430, 0.082, 0.146), st(1.330, 0.088, 0.156),
      st(1.200, 0.108, 0.190), st(1.100, 0.122, 0.212), st(1.000, 0.134, 0.242),
      st(0.900, 0.144, 0.254), st(0.790, 0.152, 0.264), st(0.690, 0.158, 0.270),
      st(0.560, 0.156, 0.270), st(0.500, 0.146, 0.264),
    ],
    columns: 40, ringsPer: 3, capTop: true,
    /* The drape's front-inner quadrant is missing below the elbow, which is
       what lets the hand hang clear of the cloth with the sleeve's dark
       interior behind it — the plate's read, and the one v1 lost entirely. */
    gapAt: (t) => (t < 0.28 ? 0 : smooth((t - 0.28) / 0.45) * mouth),
    gapMid: -side * 0.55,
    hem: tornHem({ count: A3(a.tongues, 4, 3, 5), depth: 0.158, vary: 0.34, tipPow: 1.0, width: 1.3, jag: 0.008, seed: side > 0 ? 61 : 67 }),
    hemRings: 6, hemPull: 0.06,
    fold: { count: 9, amp: 0.062, phase: side > 0 ? 0.4 : 2.6 },
    crease: { amp: 0.0038, freq: 48, drape: 0.0026, seed: side > 0 ? 71 : 73 },
    crack: { amp: 0.003, cell: 54 },
    wear: { top: 1.02, hem: 0.76, blotch: 0.13 },
  });
  return {
    parts: [{ name: 'bell-sleeve-' + key, joint: 'shoulder' + key, bind: side > 0 ? BIND_SETS.sleeveL : BIND_SETS.sleeveR, geometry: geo, material: 'crust' }],
  };
}

/* ==================================================== 05 · the name tablet
   The subject. A blank clay plaque 0.246 x 0.215 m fired into the chest at
   1.289 m, inside a raised rim, carried on two straps over the shoulders,
   with the ember burning BEHIND it: the warm pixels on the plate sit outside
   the plaque's edges, not on its face, so the light is between plaque and
   body. The face stays blank — the unfinished name is the whole character. */
export const TABLET_AXES = { harness: 3, emberSpread: 3, rim: 2 };
export function huskTablet(ctx, variant = 0) {
  const a = axesOf(variant, TABLET_AXES);
  const T = PLATE.tablet;
  /* The chest surface, from the layer stack plus the mantle's own excursion,
     so the frame's back face clears the robe instead of sinking into it. */
  const z0 = layerR('mantleOuter', T.cy) * DEPTH + 0.026;
  const rim = T.rim * (a.rim ? 1.15 : 1);
  const parts = [];

  /* Rim: one extruded rounded frame with a hole, not four bars. */
  const round = (w, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  const frameShape = round(T.w, T.h, 0.018);
  frameShape.holes.push(round(T.w - rim * 2, T.h - rim * 2, 0.010));
  const frame = new THREE.ExtrudeGeometry(frameShape, {
    depth: T.proud + 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003,
    bevelSegments: 2, curveSegments: 3,
  });
  frame.translate(T.cx, T.cy, z0 - 0.010);
  crackRidge(frame, { amp: 0.0016, cell: 130, seed: 5 });
  crease(frame, { amp: 0.0018, freq: 90, seed: 15 });   // a clay lip, not a picture frame
  frame.computeVertexNormals();
  wearColours(frame, { top: 1.0, hem: 0.9, blotch: 0.08 });
  parts.push({ name: 'tablet-frame-iron', joint: 'chest', rigid: true, geometry: frame, material: 'frame' });

  /* Field: a slab with a slight outward dome and the crazing that covers it. */
  const field = new THREE.BoxGeometry(T.w - rim * 1.7, T.h - rim * 1.7, 0.026, 26, 24, 2);
  const fp = field.attributes.position;
  for (let i = 0; i < fp.count; i++) {
    const x = fp.getX(i), y = fp.getY(i), z = fp.getZ(i);
    if (z > 0) fp.setZ(i, z + 0.006 * (1 - (x / (T.w / 2)) ** 2) * (1 - (y / (T.h / 2)) ** 2));
  }
  field.translate(T.cx, T.cy, z0 + T.proud * 0.5);
  crackRidge(field, { amp: 0.0022, cell: 150, sharp: 3.4, seed: 9 });
  field.computeVertexNormals();
  wearColours(field, { top: 1.04, hem: 0.94, blotch: 0.05 });
  parts.push({ name: 'name-tablet-blank', joint: 'chest', rigid: true, geometry: field, material: 'clay' });

  /* Ember: slivers behind the rim, plus the hot spill under the bottom edge
     the plate shows running down onto the tunic. */
  const spread = A3(a.emberSpread, 1.0, 0.8, 1.25);
  const seams = [];
  const bar = (w, h, x, y) => {
    const g = new THREE.BoxGeometry(w, h, 0.006);
    g.translate(T.cx + x, T.cy + y, z0 - 0.008);
    return g;
  };
  seams.push(bar(T.w * 0.90 * spread, 0.008, 0, -T.h / 2 - 0.002));
  seams.push(bar(0.008, T.h * 0.76 * spread, T.w / 2 + 0.002, 0.004));
  seams.push(bar(0.007, T.h * 0.40 * spread, -T.w / 2 - 0.002, -0.03));
  const spill = new THREE.BoxGeometry(0.040 * spread, 0.010, 0.005);
  spill.translate(T.cx + 0.03, T.cy - T.h / 2 - 0.010, z0 + 0.001);
  seams.push(spill);
  parts.push({ name: 'ember-seam', joint: 'chest', rigid: true, geometry: mergeGeos(seams), material: 'ember' });

  /* Harness: two straps from the rim's top corners over the shoulders. This is
     the stated fix for v1's "tablet unmounted" fault, so it is present at
     variant 0 and only a deliberate variant takes it away. */
  const harness = A3(a.harness, 2, 1, 0);
  if (harness > 0) {
    const straps = [];
    /* Every control point is projected out onto the robe's own surface plus a
       margin. The margin has to cover the mantle's ~14 mm excursion past its
       station, the strap's own 5 mm half-thickness, and the couple of
       millimetres a 46 mm flat band's corners dip when it is laid across a
       curved surface. At 15 mm it did not, and the mantle came 37 mm through
       the harness buckled over it. */
    const onRobe = (x, y, z, off = 0.026) => {
      const r = Math.hypot(x, z / DEPTH) || 1e-4;
      const k = (layerR('mantleOuter', y) + off) / r;
      return new THREE.Vector3(x * k, y, z * k);
    };
    for (const side of [-1, 1]) {
      const pts = [
        onRobe(T.cx + side * T.w * 0.42, T.cy + T.h * 0.42, z0 + 0.012, 0.034),
        onRobe(T.cx + side * 0.115, 1.360, 0.140, 0.030),
        onRobe(side * 0.150, 1.432, 0.086, 0.048),
        onRobe(side * 0.166, 1.462, -0.010, 0.052),
        onRobe(side * 0.150, 1.436, -0.096, 0.048),
      ];
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
      straps.push(ribbon(curve.getPoints(26), 0.046, 0.010, 13 + side));
      if (harness > 1) {
        const buckle = new THREE.BoxGeometry(0.030, 0.026, 0.014);
        const b = onRobe(T.cx + side * T.w * 0.42, T.cy + T.h * 0.40, z0 + 0.020, 0.040);
        buckle.translate(b.x, b.y, b.z);
        straps.push(buckle);
      }
    }
    parts.push({ name: 'tablet-harness', joint: 'chest', rigid: true, geometry: mergeGeos(straps), material: 'frame' });
  }
  return { parts };
}

/* ========================================================= 06 · waist sash
   Four wound passes between 1.030 and 1.160 m, a knot bunch, and one hanging
   end. Tori at three radii were the old version; a torus cannot overlap
   itself, which is the only thing a wrapped sash does. */
export const SASH_AXES = { passes: 3, tail: 3, knot: 2 };
export function huskSash(ctx, variant = 0) {
  const a = axesOf(variant, SASH_AXES);
  const S = PLATE.sash;
  const g = [];
  const pass = (y0, y1, thick, turns, phase) => wrapCoil({
    /* Centreline from sashR(), which adds the tube's own wall thickness to the
       robe's real outer surface. Typing a radius here is what put the sash's
       inner wall 54 mm inside the robe it is supposed to wrap. */
    y0, y1, rx: sashR((y0 + y1) / 2, thick), rz: sashR((y0 + y1) / 2, thick) * 0.76,
    thick, turns, phase, along: 120, radial: 8, wobble: 0.020,
    flatten: 0.52,
    crease: { amp: 0.0032, freq: 54, bands: 0.0018, bandFreq: 260, seed: 77 },
    crack: { amp: 0.0024, cell: 70 },
    wear: { top: 1.0, hem: 0.88, blotch: 0.12 },
  });
  g.push(pass(S.top - 0.006, S.top - 0.044, 0.030, 1.25, 0.3));
  g.push(pass(S.top - 0.038, S.bottom + 0.040, 0.034, 1.35, 2.5));
  const passCount = A3(a.passes, 4, 3, 2);
  if (passCount > 2) g.push(pass(S.bottom + 0.046, S.bottom + 0.006, 0.030, 1.20, 4.4));
  if (passCount > 3) g.push(pass(S.centre + 0.010, S.centre - 0.024, 0.026, 0.95, 1.4));

  if (A2(a.knot)) {
    const knot = new THREE.IcosahedronGeometry(0.040, 1);
    knot.scale(1.0, 0.72, 0.62);
    knot.translate(0.070, S.centre - 0.006, sashR(S.centre, 0.034) * 0.70);
    crease(knot, { amp: 0.006, freq: 42, seed: 83 });
    knot.computeVertexNormals();
    g.push(knot);
  }
  const parts = [{ name: 'sash-wraps', joint: 'pelvis', bind: BIND_SETS.sash, geometry: mergeGeos(g), material: 'sash' }];

  {
    const len = A3(a.tail, 0.22, 0.14, 0.30);
    const tail = tornPanel({
      w: 0.098, y0: S.centre - 0.010, y1: S.centre - 0.010 - len,
      z: sashR(S.centre, 0.034) * 0.72, bow: 0.022,
      cols: 12, rows: 14, sway: -0.018,
      hem: tornEdge({ count: 2, depth: 0.06, seed: 89 }),
      fold: { count: 3, amp: 0.010 },
      crease: { amp: 0.003, freq: 66, seed: 91 }, crack: { amp: 0.002, cell: 80 },
      wear: { top: 0.98, hem: 0.8 },
    });
    tail.translate(-0.010, 0, 0);
    parts.push({ name: 'sash-hanging-end', joint: 'pelvis', bind: BIND_SETS.sash, geometry: tail, material: 'sash' });
  }
  return { parts };
}

/* ==================================================== 07 · rust inner tunic
   The only second colour on the plate: a rust-ochre apron down the centre
   front, 0.23 m wide, torn to points at 0.33 m, with a grey drape crossing
   it and a darker column behind so the opening is not a hole. */
export const TUNIC_AXES = { tips: 3, crossDrape: 2, column: 2 };
export function huskTunic(ctx, variant = 0) {
  const a = axesOf(variant, TUNIC_AXES);
  const U = PLATE.tunic;
  const parts = [];

  const apron = tornPanel({
    /* z from the layer stack, and bow kept small: a 52 mm bow on a panel whose
       plane already sat near the mantle's inner surface is what drove the
       apron 45 mm THROUGH the robe covering it. */
    w: U.width * 0.82, y0: U.top, y1: U.tip + 0.150,
    z: layerZMin('tunic', U.tip + 0.150, U.top) - 0.014, bow: 0.014, cols: 24, rows: 18,
    hem: tornEdge({ count: A3(a.tips, 3, 2, 4), depth: 0.150, vary: 0.4, tipPow: 1.05, seed: 41 }),
    fold: { count: 3, amp: 0.016, phase: 0.4 },
    crease: { amp: 0.004, freq: 50, seed: 43 }, crack: { amp: 0.003, cell: 60 },
    wear: { top: 1.0, hem: 0.72, blotch: 0.16 },
  });
  parts.push({ name: 'rust-apron', joint: 'pelvis', bind: BIND_SETS.tunic, geometry: apron, material: 'tunic' });

  if (A2(a.column)) {
    const column = clothLoft({
      stations: layerStations('tunic', [1.120, 0.940, 0.760, 0.640], { depth: DEPTH }),
      columns: 34, ringsPer: 3,
      hem: tornHem({ count: 5, depth: 0.120, vary: 0.5, tipPow: 1.0, seed: 45 }),
      hemRings: 4, fold: { count: 8, amp: 0.04 },
      crease: { amp: 0.003, freq: 46, seed: 49 }, crack: { amp: 0.0024, cell: 58 },
      wear: { top: 0.92, hem: 0.66, blotch: 0.18 },
    });
    parts.push({ name: 'tunic-under-column', joint: 'pelvis', bind: BIND_SETS.tunic, geometry: column, material: 'dark' });
  }

  if (A2(a.crossDrape)) {
    const drape = tornPanel({
      w: 0.150, y0: 1.086, y1: 0.760,
      z: layerZMin('tunic', 0.760, 1.086) - 0.024, bow: 0.012, cols: 16, rows: 16, sway: 0.030,
      hem: tornEdge({ count: 2, depth: 0.10, seed: 53 }),
      fold: { count: 3, amp: 0.012 },
      crease: { amp: 0.0035, freq: 56, seed: 57 }, crack: { amp: 0.0026, cell: 66 },
      wear: { top: 1.0, hem: 0.76 },
    });
    poseGeo(drape, { pivot: [0, 1.086, 0.150], rz: 0.06, move: [-0.062, 0, 0.006] });
    parts.push({ name: 'tunic-cross-drape', joint: 'pelvis', bind: BIND_SETS.tunic, geometry: drape, material: 'mantle' });
  }
  return { parts };
}

/* ========================================================= 08 · hands
   Gaunt, long-fingered, hanging open and slightly curled — visible on the
   plate because the sleeve front is open.

   Orientation matters more than detail here. A relaxed hanging hand shows the
   camera its THUMB EDGE, with the palm facing the thigh; built facing forward
   it reads as a paddle, which is what the first pass produced. So the section
   is swept with its thickness across X and its width front-to-back, and the
   fingers curl toward the palm's own normal. */
export const HAND_AXES = { curl: 3, gaunt: 3 };
export function huskHand(ctx, variant = 0, side = 1) {
  const a = axesOf(variant, HAND_AXES);
  const curl = A3(a.curl, 0.30, 0.18, 0.44);
  const thin = A3(a.gaunt, 0.98, 1.06, 0.90);
  const key = side > 0 ? 'L' : 'R';
  const palmDir = -side;                 // the palm faces the body's centreline
  const g = [];

  /* Palm: swept from the wrist to the knuckle line, elliptical section, so it
     has a back and an edge instead of four flat sides. */
  const pp = [], prx = [], prz = [];
  for (let k = 0; k <= 5; k++) {
    const t = k / 5;
    pp.push(new THREE.Vector3(palmDir * 0.004 * t, -0.008 - t * 0.080, 0.004 + t * 0.006));
    prx.push((0.0135 + 0.0035 * Math.sin(t * Math.PI)) * thin);
    prz.push((0.026 + 0.012 * t) * thin);
  }
  g.push(sweep(pp, prx, prz, 10));

  /* Four fingers, spaced front to back: index forward, little finger aft. */
  for (let i = 0; i < 4; i++) {
    const z = 0.010 + (1.5 - i) * 0.019 * thin;
    const len = (0.082 - Math.abs(i - 1.1) * 0.009) * thin;
    const r0 = (0.0092 - i * 0.0004) * thin;
    const bend = curl * (0.85 + i * 0.10);
    const pts = [], rx = [], rz = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const ang = bend * t * t;
      pts.push(new THREE.Vector3(
        palmDir * (0.006 + Math.sin(ang) * len * t),
        -0.088 - Math.cos(ang) * len * t,
        z + t * 0.002
      ));
      const taper = (1 - 0.26 * t) * (k === 6 ? 0.72 : 1);
      rx.push(r0 * taper);
      rz.push(r0 * taper * 0.88);
    }
    g.push(sweep(pts, rx, rz, 8));
    const kn = new THREE.SphereGeometry(r0 * 1.22, 8, 6);
    kn.translate(palmDir * 0.006, -0.086, z);
    g.push(kn);
  }

  /* Thumb: forward of the palm, angled across it, as a hanging hand does. */
  const tp = [], trx = [], trz = [];
  for (let k = 0; k <= 5; k++) {
    const t = k / 5;
    tp.push(new THREE.Vector3(
      palmDir * (0.008 + t * 0.020),
      -0.030 - t * 0.052,
      0.030 + t * 0.014
    ));
    trx.push(0.0110 * thin * (1 - 0.30 * t));
    trz.push(0.0098 * thin * (1 - 0.30 * t));
  }
  g.push(sweep(tp, trx, trz, 8));

  const geo = mergeGeos(g);
  crease(geo, { amp: 0.0011, freq: 220, seed: 97 });
  crackRidge(geo, { amp: 0.0010, cell: 300, seed: 101 });
  geo.computeVertexNormals();
  wearColours(geo, { top: 0.92, hem: 0.80, blotch: 0.08 });
  return { parts: [{ name: 'husk-hand-' + key, joint: 'wrist' + key, local: true, rigid: true, geometry: geo, material: 'skin' }] };
}

/* ==================================================== 09 · wrapped legs
   Baggy ash-crusted trousers with the concentric wrinkle rolls the plate
   shows stacked above each boot. Two pieces per leg so a knee can bend. */
export const LEG_AXES = { bag: 3, rolls: 3 };
export function huskLeg(ctx, variant = 0, side = 1) {
  const a = axesOf(variant, LEG_AXES);
  const bag = A3(a.bag, 1.0, 0.92, 1.10);
  const key = side > 0 ? 'L' : 'R';
  /* Narrowed from 0.086/0.098: the old thigh reached 0.184 m from the
     centreline, wider than the tunic that is worn over it, and burst through
     it by 68 mm. A gaunt figure's trouser is not that fat, and none of this is
     on the plate's silhouette — the sleeves and hem own every band here. */
  const hx = side * 0.072, kx = side * 0.086, ax = side * (side > 0 ? 0.106 : 0.110);
  const parts = [];

  const thigh = clothLoft({
    stations: [
      { y: 0.980, rx: 0.076 * bag, rz: 0.078 * bag, cx: hx },
      { y: 0.820, rx: 0.073 * bag, rz: 0.075 * bag, cx: lerp(hx, kx, 0.2) },
      { y: 0.640, rx: 0.070 * bag, rz: 0.072 * bag, cx: lerp(hx, kx, 0.6) },
      { y: 0.500, rx: 0.067 * bag, rz: 0.069 * bag, cx: kx },
    ],
    columns: 22, ringsPer: 2, capTop: true,
    fold: { count: 6, amp: 0.05 },
    crease: { amp: 0.0035, freq: 52, bands: 0.0022, bandFreq: 120, seed: 103 },
    crack: { amp: 0.0024, cell: 62 },
    wear: { top: 0.96, hem: 0.82, blotch: 0.14 },
  });
  parts.push({ name: 'trouser-thigh-' + key, joint: 'hip' + key, bind: side > 0 ? BIND_SETS.legL : BIND_SETS.legR, geometry: thigh, material: 'dark' });

  const shin = clothLoft({
    stations: [
      { y: 0.520, rx: 0.078 * bag, rz: 0.080 * bag, cx: kx },
      { y: 0.400, rx: 0.072 * bag, rz: 0.074 * bag, cx: lerp(kx, ax, 0.3) },
      { y: 0.260, rx: 0.066 * bag, rz: 0.068 * bag, cx: lerp(kx, ax, 0.7) },
      { y: 0.150, rx: 0.058 * bag, rz: 0.060 * bag, cx: ax },
    ],
    columns: 22, ringsPer: 2,
    fold: { count: 6, amp: 0.045 },
    crease: { amp: 0.0035, freq: 52, bands: 0.003, bandFreq: 150, seed: 107 },
    crack: { amp: 0.0024, cell: 62 },
    wear: { top: 0.92, hem: 0.74, blotch: 0.16 },
  });
  parts.push({ name: 'trouser-shin-' + key, joint: 'knee' + key, bind: side > 0 ? BIND_SETS.legL : BIND_SETS.legR, geometry: shin, material: 'dark' });

  const nRolls = A3(a.rolls, 3, 2, 4);
  const rolls = [];
  for (let i = 0; i < nRolls; i++) {
    const y = 0.150 + i * 0.036;
    rolls.push(wrapCoil({
      y0: y + 0.006, y1: y - 0.006, rx: (0.058 + i * 0.004) * bag, rz: (0.060 + i * 0.004) * bag,
      thick: 0.0095, turns: 1.05, phase: i * 2.2, along: 60, radial: 6, wobble: 0.05, flatten: 0.8,
      crease: { amp: 0.0016, freq: 120, seed: 109 + i },
      wear: { top: 0.9, hem: 0.78 },
    }));
  }
  const rollGeo = mergeGeos(rolls);
  rollGeo.translate(ax, 0, 0.012);
  parts.push({ name: 'ankle-wrinkle-rolls-' + key, joint: 'knee' + key, bind: side > 0 ? BIND_SETS.legL : BIND_SETS.legR, geometry: rollGeo, material: 'dark' });

  return { parts };
}

/* ========================================================= 10 · soft boots
   0.245 m long, 0.115 m tall, flat-soled, blunt-pointed, and one of them
   turned right out on the plate. Built as a lofted last: the toe length
   shortens with height so the vamp slopes back to the ankle. */
export const BOOT_AXES = { toe: 3, sole: 2 };
export function huskBoot(ctx, variant = 0, side = 1) {
  const a = axesOf(variant, BOOT_AXES);
  const key = side > 0 ? 'L' : 'R';
  const B = PLATE.boot;
  const toeK = A3(a.toe, 1.0, 0.92, 1.10);

  /* Outline of the last at height h (0 sole, 1 ankle opening). The toe pulls
     back with h^1.6, not linearly: the plate's boots are flat with the toe box
     right at the ground, and a linearly tapering last measured 98 mm narrower
     than the plate across the stance. */
  const ring = (h, cols) => {
    const L = lerp(B.len * 0.80 * toeK, B.len * 0.30, smooth(Math.pow(h, 1.6)));
    const back = lerp(B.len * 0.30, B.len * 0.26, h);
    const W = lerp(0.058, 0.046, h);
    const out = [];
    for (let j = 0; j < cols; j++) {
      const t = (j / cols) * T2;
      const c = Math.cos(t), s = Math.sin(t);
      const z = c > 0 ? c * L : c * back;
      const w = W * (0.74 + 0.26 * (1 - Math.abs(c)));
      out.push([s * w, z]);
    }
    return out;
  };

  const cols = 22, rows = 7;
  const pos = [], uv = [], idx = [];
  for (let r = 0; r < rows; r++) {
    const h = r / (rows - 1);
    const y = -PLATE.ankleY + 0.008 + h * (B.height - 0.006);
    const o = ring(h, cols);
    for (let j = 0; j < cols; j++) pos.push(o[j][0], y, o[j][1]);
    for (let j = 0; j < cols; j++) uv.push(j / cols, h);
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let j = 0; j < cols; j++) {
      const A0 = r * cols + j, B0 = r * cols + ((j + 1) % cols);
      idx.push(A0, B0, B0 + cols, A0, B0 + cols, A0 + cols);
    }
  }
  // Sole fan and ankle fan, so the boot is a closed solid.
  const soleC = pos.length / 3;
  pos.push(0, -PLATE.ankleY + 0.008, 0.02); uv.push(0.5, 0);
  for (let j = 0; j < cols; j++) idx.push(soleC, (j + 1) % cols, j);
  const topC = pos.length / 3;
  const topRow = (rows - 1) * cols;
  pos.push(0, -PLATE.ankleY + 0.002 + B.height, 0.006); uv.push(0.5, 1);
  for (let j = 0; j < cols; j++) idx.push(topC, topRow + j, topRow + ((j + 1) % cols));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  crease(geo, { amp: 0.0022, freq: 86, seed: 113 });
  crackRidge(geo, { amp: 0.0022, cell: 110, seed: 117 });
  geo.computeVertexNormals();
  wearColours(geo, { top: 0.94, hem: 0.72, blotch: 0.14 });

  const parts = [{ name: 'soft-boot-' + key, joint: 'ankle' + key, local: true, rigid: true, geometry: geo, material: 'boot' }];

  if (A2(a.sole)) {
    const sole = [];
    const o = ring(0, cols);
    const y = -PLATE.ankleY;
    const c0 = 0;
    for (let j = 0; j < cols; j++) sole.push(o[j]);
    const sp = [], si = [];
    for (let j = 0; j < cols; j++) { sp.push(o[j][0] * 1.06, y + 0.008, o[j][1] * 1.04); }
    for (let j = 0; j < cols; j++) { sp.push(o[j][0] * 1.04, y, o[j][1] * 1.02); }
    for (let j = 0; j < cols; j++) {
      const A0 = j, B0 = (j + 1) % cols;
      si.push(A0, B0, B0 + cols, A0, B0 + cols, A0 + cols);
    }
    const centre = sp.length / 3;
    sp.push(0, y, 0.02);
    for (let j = 0; j < cols; j++) si.push(centre, cols + ((j + 1) % cols), cols + j);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.setIndex(si);
    sg.computeVertexNormals();
    wearColours(sg, { top: 0.8, hem: 0.66 });
    parts.push({ name: 'boot-sole-' + key, joint: 'ankle' + key, local: true, rigid: true, geometry: sg, material: 'frame' });
  }
  return { parts };
}

/* ========================================================= 11 · smoke veil
   The plate's figure smokes: pale plumes off both shoulders, the crown and
   the hem. It is part of the silhouette, so it is built, and it is the one
   section that is deliberately not solid geometry. */
export const SMOKE_AXES = { plumes: 3, reach: 3 };
export function huskSmoke(ctx, variant = 0) {
  const a = axesOf(variant, SMOKE_AXES);
  const n = A3(a.plumes, 8, 6, 10);
  const reach = A3(a.reach, 0.34, 0.26, 0.44);
  const rand = rnd(131);
  const parts = [];
  const anchors = [
    [0.20, 1.44, -0.02], [-0.20, 1.44, -0.02], [0.0, 1.72, -0.05],
    [0.13, 1.50, 0.05], [-0.13, 1.50, 0.05], [0.24, 1.38, -0.06],
    [-0.24, 1.38, -0.06], [0.0, 1.46, -0.14], [0.10, 1.66, -0.02], [-0.10, 1.66, -0.02],
  ];
  for (let i = 0; i < n; i++) {
    const [x, y, z] = anchors[i % anchors.length];
    const w = 0.13 + rand() * 0.09;
    const g = new THREE.PlaneGeometry(w, reach * (0.7 + rand() * 0.6), 3, 6);
    g.translate(0, reach * 0.4, 0);
    parts.push({
      name: 'smoke-plume-' + i, joint: 'chest', geometry: g, material: 'smoke',
      offset: [x, y, z], billboard: true, seed: i * 1.37 + rand(),
    });
  }
  return { parts };
}

/* ==================================================== the section registry
   The viewer builds this list, not a hard-coded model. Each row states what
   on the plate it answers for, so a wrong section is findable. */
export const HUSK_SECTIONS = [
  {
    id: 'husk.head', name: 'Ash-cured head + face', axes: HEAD_AXES, build: huskHead,
    reads: 'Crown 1.740 m, wrap breadth 0.172 m, chin 1.530 m. Face exposed, eyes closed, chin down.',
    method: 'Face from kit/hm-face.js: 96×72 over the head, landmarks placed from canonical facial proportion, six ordered passes (skull, masses, features, folds, asymmetry, skin relief). Closed lids are a globe-pushed dome with a crease above and a lash seam at the margin. Under a cut ash shell with the face oval and neck hole removed.',
  },
  {
    id: 'husk.cowl', name: 'Throat cowl', axes: COWL_AXES, build: huskCowl,
    reads: 'Wrapped scarf 1.405–1.530 m, 0.300 m across, one hanging fold on the figure\u2019s left.',
    method: 'Helical wraps swept as tubes, so each pass overlaps the last.',
  },
  {
    id: 'husk.mantle', name: 'Mantle + robe', axes: MANTLE_AXES, build: huskMantle,
    reads: '0.423 m at the shoulder to 0.501 m at the hem; tongues bottom at 0.300 m; front opens below the waist.',
    method: 'One lofted surface with a widening front gap, drape folds, and a torn pendant hem, plus a shorter under-layer. Skinned to spine and chest above the waist and to eight two-segment spring chains below, which is what lets the hem lag and settle.',
  },
  {
    id: 'husk.sleeves', name: 'Bell sleeves', axes: SLEEVE_AXES, build: (c, v) => ({
      parts: [...huskSleeve(c, v, 1).parts, ...huskSleeve(c, v, -1).parts],
    }),
    reads: 'Outer edge 0.417 m from centre at 0.665 m; lowest tongue 0.360 m; front of the drape open so the hands read.',
    method: 'Lofted drape along the arm with the centre drifting outward as it falls; front-inner quadrant opens below the elbow. Skinned across shoulder, elbow and wrist so it bends with the arm, plus a two-bone spring chain per side for swing.',
  },
  {
    id: 'husk.tablet', name: 'Name tablet + harness', axes: TABLET_AXES, build: huskTablet,
    reads: 'Blank plaque 0.246 \u00d7 0.215 m at 1.289 m in a raised rim; warm pixels 1.172–1.388 m sit OUTSIDE the plaque.',
    method: 'Extruded rounded rim with a hole, domed field, ember slivers behind the rim, two swept straps over the shoulders.',
  },
  {
    id: 'husk.sash', name: 'Waist sash', axes: SASH_AXES, build: huskSash,
    reads: 'Wound band 1.030–1.160 m with a knot bunch and one hanging end.',
    method: 'Four helical passes at different radii and phases.',
  },
  {
    id: 'husk.tunic', name: 'Rust inner tunic', axes: TUNIC_AXES, build: huskTunic,
    reads: 'The only second colour: rust apron 0.230 m wide, torn to 0.330 m, a grey drape across it.',
    method: 'Bowed torn panel over a darker lofted column, with a crossing drape.',
  },
  {
    id: 'husk.hands', name: 'Hands', axes: HAND_AXES, build: (c, v) => ({
      parts: [...huskHand(c, v, 1).parts, ...huskHand(c, v, -1).parts],
    }),
    reads: 'Wrists at 0.836 m, hands hanging 0.206 m and 0.303 m out from centre — the plate is asymmetric.',
    method: 'Sculpted palm with four swept three-segment fingers and a thumb; hands hang open, slightly curled.',
  },
  {
    id: 'husk.legs', name: 'Wrapped legs', axes: LEG_AXES, build: (c, v) => ({
      parts: [...huskLeg(c, v, 1).parts, ...huskLeg(c, v, -1).parts],
    }),
    reads: 'Baggy trousers, concentric wrinkle rolls stacked above each boot.',
    method: 'Two lofts per leg so the knee bends, plus wound rolls at the ankle.',
  },
  {
    id: 'husk.boots', name: 'Soft boots', axes: BOOT_AXES, build: (c, v) => ({
      parts: [...huskBoot(c, v, 1).parts, ...huskBoot(c, v, -1).parts],
    }),
    reads: '0.245 m long, 0.115 m tall, flat sole, blunt point; outer span 0.521 m with one foot turned right out.',
    method: 'Lofted last whose toe length shortens with height, closed with sole and ankle fans, plus a sole lip.',
  },
  {
    id: 'husk.smoke', name: 'Smoke veil', axes: SMOKE_AXES, build: huskSmoke,
    reads: 'Pale plumes off both shoulders and the crown, part of the plate\u2019s silhouette.',
    method: 'Billboarded alpha plumes rising and dissipating. The one section that is not solid.',
  },
];

export const SECTION_BY_ID = Object.fromEntries(HUSK_SECTIONS.map((s) => [s.id, s]));
export { tris };
