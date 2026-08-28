/* =========================================================================
   hm-face.js — anatomical head for the Ashbound husk
   -------------------------------------------------------------------------
   The previous head was hm-actor-skin's generic sphere with about fifteen
   operators layered on it, and it read as an ovoid with two dark bars stuck
   on the front. Three reasons, all fixable:

     RESOLUTION. A 40x30 sphere is roughly 6 mm between vertices across the
     face. A nasolabial fold is 2 mm deep and 4 mm wide; a lid crease is
     thinner than that. Detail below the sampling limit does not get softened,
     it gets DELETED, and what is left is a smooth egg. This head is 96x72
     over the same volume, concentrated where the face is.

     PROPORTION. Landmarks were placed by eye on a sphere whose axes were
     chosen by eye. Here every landmark is placed from canonical facial
     proportion — eyes at the vertical midpoint of crown-to-chin, nose base a
     third of the way up from the chin, mouth a third of the way from nose
     base to chin, interpupillary distance one eye-width, bizygomatic width
     0.66 of head height — and the base ellipsoid is solved to put the chin
     where the plate's chin actually is.

     ORDER. Operators were applied in an arbitrary order, so a broad cheek
     sweep would flatten a nose built before it. Here the pass order is
     skull -> masses -> features -> folds -> asymmetry -> skin, each pass
     working on a surface the previous one has finished with, which is how a
     sculptor works and for the same reason.

   The husk's eyes are CLOSED, so the lid is the visible surface: a dome
   pushed out by the globe beneath, a crease above it, a lash seam at its
   margin, and the lower lid ridge under that. Modelling that as a bulge on
   the face rather than as a bead sitting on it is the whole difference.

   Everything is in head-local space: origin at the head joint, +Y up, +Z
   forward. Multiply by S at the call site.
   ========================================================================= */

import * as THREE from 'three';
import { sculpt } from './hm-actor-skin.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* Canonical proportions, as fractions of crown-to-chin height (HH).
   Values are the standard adult anthropometric means; the husk's own
   gauntness is applied as a modifier, never by moving a landmark. */
export const PROP = {
  HH: 0.225,           // crown to chin, adult male mean
  bizygomatic: 0.66,   // face width / HH
  headDepth: 0.86,     // glabella to occiput / HH
  eyeLine: 0.50,       // eyes sit at the vertical midpoint
  noseBase: 0.335,     // above chin
  mouthLine: 0.215,    // above chin
  browLine: 0.585,     // above chin
  eyeSep: 0.135,       // pupil to midline / HH
  eyeWidth: 0.125,     // palpebral fissure width / HH
  earTop: 0.575,
  earBottom: 0.355,
};

/**
 * @param {object} o
 * @param {number} o.S        head scale multiplier
 * @param {number} o.gaunt    0..1, depth of the submalar and temporal hollows
 * @param {number} o.asym     0..1, how far off symmetric
 * @param {number} o.age      0..1, depth of the folds and lines
 * @param {number} o.detail   0..1, skin micro-relief
 */
export function buildHuskFace(o = {}) {
  const S = o.S ?? 1;
  const gaunt = o.gaunt ?? 0.8;
  const asym = o.asym ?? 0.45;
  const age = o.age ?? 0.7;
  const detail = o.detail ?? 1;

  const HH = PROP.HH;
  /* Solve the base ellipsoid so crown lands at +HH/2 and chin at -HH/2 once
     the chin operator has pulled it down. The sphere is deliberately SHORT of
     the chin: the mandible is built, not inherited from a sphere. */
  const rx = HH * PROP.bizygomatic * 0.5 * 1.02;
  const ry = HH * 0.455;
  const rz = HH * PROP.headDepth * 0.5;

  const geo = new THREE.SphereGeometry(1, 96, 72);
  geo.scale(rx * S, ry * S, rz * S);

  const pos = geo.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i++) verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));

  // Landmarks, in head-local metres, measured from the head centre.
  const cy = 0;                                  // sphere centre
  const chinY = -HH * 0.50;
  const y = (fracAboveChin) => chinY + HH * fracAboveChin;
  const eyeY = y(PROP.eyeLine);
  const browY = y(PROP.browLine);
  const noseBaseY = y(PROP.noseBase);
  const mouthY = y(PROP.mouthLine);
  const eyeX = HH * PROP.eyeSep;
  const V = (px, py, pz) => new THREE.Vector3(px * S, py * S, pz * S);
  const F = rz;                                  // face front, for readability

  /* ---------------------------------------------------------- pass 1: skull
     Get the cranial mass right before a single feature is placed. A face
     built on a wrong skull cannot be rescued by better features. */
  sculpt(verts, [
    // Occiput flattened and drawn down; the back of a head is not a hemisphere.
    { c: V(0, 0.02, -F * 0.92), r: 0.085 * S, dir: V(0, 0, 1).normalize(), strength: 0.011 * S, sharp: 1.2 },
    { c: V(0, -0.055, -F * 0.72), r: 0.055 * S, dir: V(0, 0, 1).normalize(), strength: 0.010 * S },
    // Parietal narrowing above the ears, and a slight sagittal crown.
    { c: V(rx * 0.94, 0.055, -0.010), r: 0.052 * S, dir: 'lateral', strength: -0.010 * S, mirror: true },
    { c: V(0, ry * 0.96, -0.012), r: 0.050 * S, dir: V(0, 1, 0), strength: 0.004 * S },
    // Temporal fossa — the hollow at the side of the forehead. On a gaunt
    // subject this is a real depression and it is most of "starved".
    { c: V(rx * 0.86, browY + 0.030, F * 0.30), r: 0.040 * S, dir: 'lateral', strength: -0.009 * S * gaunt, mirror: true },
    // Frontal eminence and the forehead's backward slope.
    { c: V(0.026, browY + 0.055, F * 0.72), r: 0.045 * S, dir: V(0, 0.25, 1).normalize(), strength: 0.004 * S, mirror: true },
    { c: V(0, ry * 0.80, F * 0.52), r: 0.055 * S, dir: V(0, 0, -1), strength: 0.005 * S },
  ]);

  /* --------------------------------------------------- pass 2: facial masses
     Zygomatic arch, malar eminence, maxilla, mandible. These carry the
     silhouette; features sit on top of them. */
  sculpt(verts, [
    // Zygomatic arch, running back toward the ear.
    { c: V(rx * 0.90, eyeY - 0.014, F * 0.34), r: 0.034 * S, dir: 'lateral', strength: 0.006 * S, mirror: true },
    // Malar eminence (cheekbone proper).
    { c: V(eyeX + 0.026, eyeY - 0.026, F * 0.62), r: 0.032 * S, dir: 'normal', strength: 0.0085 * S, mirror: true },
    // Submalar hollow beneath it.
    { c: V(eyeX + 0.022, mouthY + 0.020, F * 0.58), r: 0.030 * S, dir: 'normal', strength: -0.0115 * S * gaunt, mirror: true },
    // Maxilla — the muzzle mass carrying the upper lip.
    { c: V(0, mouthY + 0.014, F * 0.86), r: 0.040 * S, dir: V(0, 0, 1), strength: 0.005 * S, sharp: 1.3 },
    // Mandible: body, gonial angle, and the ramus up to the ear.
    { c: V(0, chinY + 0.028, F * 0.66), r: 0.042 * S, dir: V(0, -0.55, 1).normalize(), strength: 0.014 * S, sharp: 1.25 },
    { c: V(rx * 0.80, chinY + 0.046, F * 0.18), r: 0.036 * S, dir: 'lateral', strength: 0.0065 * S, mirror: true },
    { c: V(rx * 0.86, chinY + 0.086, -0.006), r: 0.030 * S, dir: 'lateral', strength: 0.004 * S, mirror: true },
    // Masseter, filling the gap between arch and gonial angle.
    { c: V(rx * 0.88, mouthY + 0.004, F * 0.20), r: 0.032 * S, dir: 'lateral', strength: 0.0045 * S, mirror: true },
    // Jaw underside, so the head has a floor rather than a sphere bottom.
    { c: V(0, chinY + 0.020, F * 0.06), r: 0.050 * S, dir: V(0, 1, 0), strength: 0.010 * S },
  ]);

  /* -------------------------------------------------------- pass 3: features */
  sculpt(verts, [
    // Brow ridge: superciliary arches with a glabella between them.
    { c: V(eyeX * 0.86, browY, F * 0.80), r: 0.030 * S, dir: V(0, 0.12, 1).normalize(), strength: 0.0115 * S, sharp: 1.45, mirror: true },
    { c: V(0, browY + 0.004, F * 0.86), r: 0.020 * S, dir: V(0, 0, 1), strength: 0.0060 * S, sharp: 1.3 },
    // Supraorbital margin: cut back UNDER the brow, which is what creates the
    // shadow line that makes a brow read at any distance.
    { c: V(eyeX, browY - 0.013, F * 0.80), r: 0.021 * S, dir: V(0, 0, -1), strength: 0.0090 * S, sharp: 1.5, mirror: true },
    // Orbital socket: recess the whole eye region before building the lid.
    { c: V(eyeX, eyeY + 0.002, F * 0.76), r: 0.030 * S, dir: V(0, 0, -1), strength: 0.0105 * S, sharp: 1.15, mirror: true },
    // Lateral orbital rim, so the socket has an outer wall.
    { c: V(eyeX + 0.024, eyeY + 0.006, F * 0.68), r: 0.017 * S, dir: 'normal', strength: 0.0045 * S, mirror: true },

    // CLOSED UPPER LID: the globe pushes a dome out of the socket floor.
    { c: V(eyeX, eyeY + 0.001, F * 0.74), r: 0.021 * S, dir: V(0, -0.10, 1).normalize(), strength: 0.0135 * S, sharp: 1.0, mirror: true },
    // Lid crease above the dome.
    { c: V(eyeX, eyeY + 0.014, F * 0.73), r: 0.013 * S, dir: V(0, -0.35, 1).normalize(), strength: -0.0052 * S, sharp: 1.4, mirror: true },
    // Lower lid ridge and the tear trough under it.
    { c: V(eyeX, eyeY - 0.014, F * 0.74), r: 0.013 * S, dir: V(0, 0, 1), strength: 0.0038 * S, mirror: true },
    { c: V(eyeX - 0.002, eyeY - 0.022, F * 0.72), r: 0.013 * S, dir: V(0, 0.2, 1).normalize(), strength: -0.0040 * S * age, mirror: true },
    // Medial canthus (tear duct) pulled in toward the nose.
    { c: V(eyeX - 0.019, eyeY - 0.003, F * 0.70), r: 0.010 * S, dir: V(0, 0, -1), strength: 0.0036 * S, mirror: true },

    // Nose. Root first, then dorsum, then tip, then the alae around it.
    { c: V(0, eyeY + 0.010, F * 0.86), r: 0.015 * S, dir: V(0, 0, -1), strength: 0.0052 * S, sharp: 1.4 },
    { c: V(0, eyeY - 0.014, F * 0.90), r: 0.017 * S, dir: V(0, 0, 1), strength: 0.0125 * S, sharp: 1.7 },
    { c: V(0, noseBaseY + 0.016, F * 0.94), r: 0.017 * S, dir: V(0, 0, 1), strength: 0.0175 * S, sharp: 1.7 },
    // Pronasale: the tip, pushed forward and slightly down.
    { c: V(0, noseBaseY + 0.008, F * 0.96), r: 0.013 * S, dir: V(0, -0.22, 1).normalize(), strength: 0.0125 * S, sharp: 1.9 },
    // Alae (nostril wings) and the sill beneath each.
    { c: V(0.013, noseBaseY + 0.003, F * 0.86), r: 0.0105 * S, dir: 'normal', strength: 0.0052 * S, mirror: true },
    { c: V(0.011, noseBaseY - 0.004, F * 0.86), r: 0.0068 * S, dir: V(0, 0, -1), strength: 0.0034 * S, mirror: true },
    // Alar crease, separating wing from cheek.
    { c: V(0.018, noseBaseY + 0.004, F * 0.82), r: 0.0080 * S, dir: V(0, 0, -1), strength: 0.0030 * S, mirror: true },
    // Columella and the septum under the tip.
    { c: V(0, noseBaseY - 0.003, F * 0.90), r: 0.0072 * S, dir: V(0, 0, 1), strength: 0.0042 * S },

    // Mouth. Philtrum ridges with the groove between, then the lips.
    { c: V(0.005, mouthY + 0.017, F * 0.88), r: 0.0062 * S, dir: V(0, 0, 1), strength: 0.0026 * S, mirror: true },
    { c: V(0, mouthY + 0.017, F * 0.88), r: 0.0048 * S, dir: V(0, 0, -1), strength: 0.0030 * S, sharp: 1.4 },
    // Upper lip body and the cupid's bow at its crest.
    { c: V(0, mouthY + 0.007, F * 0.90), r: 0.0135 * S, dir: V(0, 0, 1), strength: 0.0056 * S, sharp: 1.3 },
    { c: V(0.006, mouthY + 0.010, F * 0.91), r: 0.0055 * S, dir: V(0, 0, 1), strength: 0.0022 * S, mirror: true },
    // The mouth SEAM: pressed shut, so a groove not a gap.
    { c: V(0, mouthY, F * 0.92), r: 0.0125 * S, dir: V(0, 0, -1), strength: 0.0044 * S, sharp: 1.6 },
    // Lower lip, fuller, and the mentolabial sulcus below it.
    { c: V(0, mouthY - 0.010, F * 0.90), r: 0.0125 * S, dir: V(0, 0, 1), strength: 0.0062 * S, sharp: 1.25 },
    { c: V(0, mouthY - 0.021, F * 0.86), r: 0.0115 * S, dir: V(0, 0, -1), strength: 0.0046 * S, sharp: 1.3 },
    // Mouth corners, tucked back into the cheek.
    { c: V(0.021, mouthY - 0.001, F * 0.84), r: 0.0085 * S, dir: V(0, 0, -1), strength: 0.0040 * S, mirror: true },
    // Mental protuberance — the chin button.
    { c: V(0, chinY + 0.020, F * 0.80), r: 0.017 * S, dir: V(0, -0.15, 1).normalize(), strength: 0.0072 * S, sharp: 1.3 },
  ]);

  /* ------------------------------------------------------- pass 4: the folds
     Skin, not bone. These are what separate a living face from a mannequin,
     and on an ash-cured corpse they are deeper than usual, not shallower. */
  sculpt(verts, [
    // Nasolabial fold, from the alar crease down past the mouth corner.
    { c: V(0.022, mouthY + 0.020, F * 0.80), r: 0.0110 * S, dir: V(0, 0, -1), strength: 0.0044 * S * age, mirror: true },
    { c: V(0.026, mouthY + 0.004, F * 0.78), r: 0.0105 * S, dir: V(0, 0, -1), strength: 0.0040 * S * age, mirror: true },
    // Marionette line, below the corner.
    { c: V(0.024, mouthY - 0.017, F * 0.76), r: 0.0090 * S, dir: V(0, 0, -1), strength: 0.0026 * S * age, mirror: true },
    // Crow's feet at the outer canthus.
    { c: V(eyeX + 0.026, eyeY + 0.006, F * 0.62), r: 0.0090 * S, dir: V(0, 0, -1), strength: 0.0020 * S * age, mirror: true },
    { c: V(eyeX + 0.026, eyeY - 0.008, F * 0.62), r: 0.0080 * S, dir: V(0, 0, -1), strength: 0.0017 * S * age, mirror: true },
    // Two forehead lines and the glabellar frown between the brows.
    { c: V(0, browY + 0.030, F * 0.82), r: 0.0115 * S, dir: V(0, 0, -1), strength: 0.0022 * S * age },
    { c: V(0, browY + 0.048, F * 0.78), r: 0.0105 * S, dir: V(0, 0, -1), strength: 0.0017 * S * age },
    { c: V(0.005, browY + 0.010, F * 0.84), r: 0.0055 * S, dir: V(0, 0, -1), strength: 0.0022 * S * age, mirror: true },
    // Hollow at the temple/eye junction, and the sunken cheek plane.
    { c: V(eyeX + 0.030, eyeY + 0.024, F * 0.52), r: 0.0180 * S, dir: 'normal', strength: -0.0038 * S * gaunt, mirror: true },
  ]);

  /* -------------------------------------------------- pass 5: asymmetry
     Applied last so it perturbs finished anatomy instead of being averaged
     away by later broad operators. A perfectly symmetric face is the single
     most reliable tell of a generated one. */
  sculpt(verts, [
    { c: V(0.052, eyeY - 0.010, F * 0.55), r: 0.036 * S, dir: 'normal', strength: 0.0034 * S * asym },
    { c: V(-0.046, mouthY + 0.010, F * 0.58), r: 0.032 * S, dir: 'normal', strength: -0.0028 * S * asym },
    { c: V(0.010, noseBaseY + 0.012, F * 0.90), r: 0.014 * S, dir: V(1, 0, 0.2).normalize(), strength: 0.0016 * S * asym },
    { c: V(-0.020, browY - 0.002, F * 0.78), r: 0.020 * S, dir: V(0, 1, 0), strength: 0.0020 * S * asym },
    { c: V(0.030, chinY + 0.030, F * 0.70), r: 0.022 * S, dir: 'normal', strength: 0.0018 * S * asym },
  ]);

  for (let i = 0; i < verts.length; i++) pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z);
  geo.computeVertexNormals();

  /* --------------------------------------------------- pass 6: skin relief
     Fine enough to be a normal-map's job on a hero asset, but this subject is
     seen at two metres and the crust has to catch a raking key, so it is
     geometry. Masked away from the lids and lips, where it would eat the
     features pass 3 just built. */
  if (detail > 0) skinRelief(geo, { S, amp: 0.00042 * detail, eyeX, eyeY, mouthY, F, seed: 41 });

  return { geo, landmarks: { chinY, eyeY, browY, noseBaseY, mouthY, eyeX, rx, ry, rz, HH } };
}

/** Pore and crease micro-relief, attenuated over the delicate features. */
function skinRelief(geo, { S, amp, eyeX, eyeY, mouthY, F, seed }) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const h = (x, y, z, s) => {
    const n = Math.sin(x * 431.7 + y * 289.3 + z * 173.1 + s * 7.13) * 43758.5453;
    return n - Math.floor(n);
  };
  const band = (v, c, r) => smooth(1 - Math.min(1, Math.abs(v - c) / r));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // Protect lids and lips.
    const lid = band(y, eyeY * S, 0.020 * S) * band(Math.abs(x), eyeX * S, 0.024 * S);
    const lip = band(y, mouthY * S, 0.016 * S) * band(Math.abs(x), 0, 0.026 * S);
    const mask = 1 - clamp(lid + lip, 0, 1);
    if (mask < 0.02) continue;
    const f = 1 / (0.004 * S);
    const d = ((h(Math.floor(x * f), Math.floor(y * f), Math.floor(z * f), seed) - 0.5)
      + (h(Math.floor(x * f * 2.7), Math.floor(y * f * 2.7), Math.floor(z * f * 2.7), seed + 3) - 0.5) * 0.5)
      * amp * mask * (z > 0 ? 1 : 0.5);
    pos.setXYZ(i, x + nrm.getX(i) * d, y + nrm.getY(i) * d, z + nrm.getZ(i) * d);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/**
 * The lash seam: the dark line where the closed lids meet. It is a separate
 * thin piece because it must stay dark regardless of how the light falls, and
 * a groove in the surface goes light-side-up under a key from above.
 */
export function buildLashSeam(lm, S, side) {
  const { eyeX, eyeY } = lm;
  const pts = [];
  const w = 0.0145;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const u = (t - 0.5) * 2;                      // -1 inner .. +1 outer
    const x = side * (eyeX + u * w);
    // The seam dips at the middle and lifts at both canthi.
    const yy = eyeY - 0.0016 - 0.0034 * (1 - u * u) + 0.0012 * u;
    const z = (lm.rz * 0.755) - Math.abs(u) * 0.0060 - 0.0018;
    pts.push(new THREE.Vector3(x * S, yy * S, z * S));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  return new THREE.TubeGeometry(curve, 22, 0.00098 * S, 5, false);
}

/** The mouth seam, same reasoning as the lash line. */
export function buildMouthSeam(lm, S) {
  const { mouthY, rz } = lm;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = (i / 16 - 0.5) * 2;
    const x = u * 0.0225;
    // Cupid's bow gives the seam a shallow double curve, not a straight bar.
    const yy = mouthY + 0.0016 * Math.cos(u * Math.PI * 2) * (1 - Math.abs(u)) - 0.0022 * u * u;
    const z = rz * 0.915 - Math.abs(u) * 0.0135 - u * u * 0.0065;
    pts.push(new THREE.Vector3(x * S, yy * S, z * S));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  return new THREE.TubeGeometry(curve, 28, 0.00105 * S, 5, false);
}

/** Nostril: a real hole's worth of shadow, as a small dark inset. */
export function buildNostril(lm, S, side) {
  const { noseBaseY, rz } = lm;
  const g = new THREE.SphereGeometry(1, 12, 10);
  g.scale(0.0042 * S, 0.0030 * S, 0.0052 * S);
  g.rotateX(0.45);
  g.translate(side * 0.0072 * S, (noseBaseY - 0.0035) * S, rz * 0.875 * S);
  return g;
}

/**
 * Ear, built from its own landmarks: helix rim, antihelix fork, concha bowl,
 * tragus and lobe. hm-actor-skin's buildEar is a sculpted blob, which is the
 * right call at its budget but not when the brief is "needs more detail".
 */
export function buildHuskEar(lm, S, side) {
  const { rx, HH } = lm;
  const top = lm.chinY + HH * PROP.earTop;
  const bot = lm.chinY + HH * PROP.earBottom;
  const midY = (top + bot) / 2;
  const g = new THREE.SphereGeometry(1, 24, 20);
  g.scale(0.0092 * S, (top - bot) * 0.5 * S, 0.0150 * S);

  const pos = g.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i++) verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  const h = (top - bot);
  const V = (a, b, c) => new THREE.Vector3(a * S, b * S, c * S);
  sculpt(verts, [
    // Concha: the bowl. Everything else is a rim around this.
    { c: V(0.004, 0, 0.002), r: 0.0135 * S, dir: V(-1, 0, 0).normalize(), strength: 0.0082 * S, sharp: 1.3 },
    // Helix: the rolled outer rim, heavier at the top.
    { c: V(0, h * 0.42, 0.001), r: 0.0105 * S, dir: 'normal', strength: 0.0032 * S },
    { c: V(0, h * 0.16, -0.011), r: 0.0090 * S, dir: 'normal', strength: 0.0028 * S },
    // Antihelix: the inner fork, standing proud of the bowl.
    { c: V(-0.002, h * 0.10, 0.005), r: 0.0080 * S, dir: 'normal', strength: 0.0026 * S },
    { c: V(-0.002, h * 0.26, 0.006), r: 0.0062 * S, dir: 'normal', strength: 0.0020 * S },
    // Tragus, in front of the canal.
    { c: V(0, -h * 0.06, 0.012), r: 0.0052 * S, dir: V(0, 0, 1), strength: 0.0030 * S },
    // Lobe: soft, pendant, no cartilage.
    { c: V(0, -h * 0.46, 0.003), r: 0.0075 * S, dir: V(0, -0.5, 1).normalize(), strength: 0.0032 * S },
  ]);
  for (let i = 0; i < verts.length; i++) pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z);
  g.computeVertexNormals();

  g.rotateY(side * -0.30);
  g.rotateX(-0.10);
  g.rotateZ(side * 0.14);                       // ears rake back, they do not stand square
  g.translate(side * rx * 0.965 * S, midY * S, -lm.rz * 0.16 * S);
  return g;
}

/** Brow hair as relief, not as strands: a low ridge following the arch. */
export function buildBrowRidge(lm, S, side) {
  const { eyeX, browY, rz } = lm;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = (i / 10 - 0.5) * 2;
    const x = side * (eyeX + u * 0.019);
    const yy = browY - 0.0035 + 0.0030 * (1 - u * u) - 0.0016 * u;
    const z = rz * 0.775 - Math.abs(u) * 0.0075 - 0.0010;
    pts.push(new THREE.Vector3(x * S, yy * S, z * S));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  const g = new THREE.TubeGeometry(curve, 20, 0.0026 * S, 6, false);
  g.scale(1, 0.55, 0.7);
  g.translate(0, browY * S * 0.45, 0);
  return g;
}
