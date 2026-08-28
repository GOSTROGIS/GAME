/* Camp, expedition and field kit — parametric families.
 *
 * The gap this closes: an open world is mostly the space BETWEEN settlements,
 * and that space is dressed with camps. Every road, ruin approach and hunting
 * ground needs the same vocabulary — somewhere to sleep, something to cook on,
 * a pile of split wood, a rope, a line of washing. Without it the wilderness
 * reads as empty terrain rather than as travelled country.
 *
 * These are also the cheapest storytelling objects in the kit: a bedroll with
 * two packs and one cold fire says who was here and how many, with no dialogue
 * and no quest marker.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const tube = (pts, r, rad = 6) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), Math.max(6, pts.length * 3), r, rad, false);

const M = (name, color, rough, metal = 0, extra) => {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: rough, metalness: metal }, extra || {}));
  m.name = name;
  return m;
};
export const CAMP = {
  canvas: M('tent-canvas', '#7b7466', 0.95, 0, { side: THREE.DoubleSide }),
  canvasDark: M('tent-canvas-weathered', '#5b5347', 0.95, 0, { side: THREE.DoubleSide }),
  canvasPatch: M('canvas-patch', '#683f37', 0.95, 0, { side: THREE.DoubleSide }),
  blanket: M('wool-blanket', '#4a3b38', 0.96, 0, { side: THREE.DoubleSide }),
  blanketPale: M('wool-blanket-pale', '#6d6549', 0.96, 0, { side: THREE.DoubleSide }),
  hide: M('cured-hide', '#4b3a2b', 0.92, 0.01),
  charcoal: M('charcoal', '#1e1c1a', 0.96, 0),
  fireash: M('fire-ash', '#5f5c56', 0.98, 0),
  emberHot: M('live-ember', '#5a2a17', 0.68, 0, { emissive: new THREE.Color('#bd6135'), emissiveIntensity: 2.1 }),
  flame: M('camp-flame', '#7a3a1c', 0.6, 0, { emissive: new THREE.Color('#bd6135'), emissiveIntensity: 2.6, transparent: true, opacity: 0.85 }),
  splitWood: M('split-wood', '#6f5b40', 0.88, 0.01),
  bark: M('log-bark', '#332b23', 0.94, 0),
};

/* A canvas sheet stretched between two ridge points, with real slack: the
   catenary is baked into the vertices, not faked with a rotation. */
function canvasSheet(w, l, sagAmt, segW = 6, segL = 8) {
  const geo = box(w, 0.003, l, segW, 1, segL);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const tx = (p.getX(i) + w / 2) / w;
    const tz = (p.getZ(i) + l / 2) / l;
    p.setY(i, p.getY(i) - Math.sin(tx * Math.PI) * Math.sin(tz * Math.PI) * sagAmt);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* -------------------------------------------------------------------- TENT */
export const TENT_AXES = { form: 4, size: 3, flap: 3, guys: 3, patch: 2, awning: 2 };
export function tent(variant = 0) {
  const A = axesOf(variant, TENT_AXES);
  const rand = rnd(variant * 1031 + 3);
  const g = new THREE.Group();
  const L = 1.5 + A.size * 0.55;
  const W = L * (0.62 + A.form * 0.05);
  const H = L * (A.form === 2 ? 0.42 : 0.56);
  const mat = A.patch ? CAMP.canvasDark : CAMP.canvas;
  if (A.form === 3) {
    // Conical: a single pole with a lathed cone of canvas.
    g.add(part(limb(0.016, 0.024, H * 1.06, 7, 3), MAT.weatheredTimber, 'centre-pole', { pos: [0, H * 0.53, 0] }));
    const cone0 = lathe([[W * 0.5, 0], [W * 0.4, H * 0.32], [W * 0.22, H * 0.7], [0.02, H]], 14);
    g.add(part(cone0, mat, 'tent-cone'));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * T;
      g.add(part(tube([[Math.cos(a) * W * 0.5, 0.02, Math.sin(a) * W * 0.5], [Math.cos(a) * W * 0.28, H * 0.6, Math.sin(a) * W * 0.28], [0, H * 0.98, 0]], 0.004, 4), MAT.ropeHemp, 'seam-cord-' + i, {}));
    }
    g.add(part(cone(0.05, 0.09, 7), MAT.pittedIron, 'smoke-cap', { pos: [0, H + 0.03, 0] }));
  } else {
    const ridgeY = H;
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.015, 0.024, ridgeY * 1.05, 7, 3), MAT.weatheredTimber, 'end-pole-' + i, { pos: [0, ridgeY * 0.52, s * L / 2], rot: [0, 0, 0] }));
    });
    g.add(part(cyl(0.012, 0.012, L + 0.1, 7), MAT.weatheredTimber, 'ridge-pole', { pos: [0, ridgeY, 0], rot: [Math.PI / 2, 0, 0] }));
    const slopeL = Math.sqrt(Math.pow(W / 2, 2) + Math.pow(ridgeY, 2));
    [-1, 1].forEach((s, i) => {
      const sheet = canvasSheet(L, slopeL, A.form === 1 ? 0.05 : 0.025, 7, 5);
      g.add(part(sheet, mat, 'canvas-slope-' + i, {
        pos: [s * W / 4, ridgeY / 2, 0],
        rot: [0, Math.PI / 2, s * Math.atan2(W / 2, ridgeY)],
      }));
    });
    if (A.form === 2) {
      // Wall tent: vertical side walls under the slopes.
      [-1, 1].forEach((s, i) => g.add(part(box(0.004, ridgeY * 0.34, L), mat, 'side-wall-' + i, { pos: [s * W * 0.5, ridgeY * 0.17, 0] })));
      [-1, 1].forEach((s, i) => g.add(part(cyl(0.012, 0.014, ridgeY * 0.34, 6), MAT.weatheredTimber, 'wall-post-' + i, { pos: [s * W * 0.5, ridgeY * 0.17, L / 2 - 0.05] })));
    }
    // End gable + door flap.
    [-1, 1].forEach((s, i) => {
      if (s > 0 && A.flap) return;
      const tri = new THREE.BufferGeometry();
      const v = new Float32Array([-W / 2, 0, 0, W / 2, 0, 0, 0, ridgeY, 0]);
      tri.setAttribute('position', new THREE.BufferAttribute(v, 3));
      tri.computeVertexNormals();
      g.add(part(tri, mat, 'gable-' + i, { pos: [0, 0, s * L / 2], rot: [0, s > 0 ? 0 : Math.PI, 0] }));
    });
    if (A.flap) {
      const fw = W * 0.42;
      if (A.flap === 1) {
        g.add(part(canvasSheet(fw, ridgeY * 0.9, 0.03, 4, 5), mat, 'door-flap', { pos: [-fw * 0.5, ridgeY * 0.45, L / 2 + 0.02], rot: [Math.PI / 2, 0, 0.2] }));
      } else {
        [-1, 1].forEach((s, i) => g.add(part(canvasSheet(fw, ridgeY * 0.92, 0.04, 4, 5), mat, 'door-flap-' + i, {
          pos: [s * fw * 0.62, ridgeY * 0.46, L / 2 + 0.03],
          rot: [Math.PI / 2, 0, s * 0.5],
        })));
      }
      for (let k = 0; k < 3; k++) g.add(part(tube([[0, ridgeY * (0.7 - k * 0.22), L / 2], [0.02, ridgeY * (0.68 - k * 0.22), L / 2 + 0.03]], 0.0022, 4), MAT.ropeHemp, 'flap-tie-' + k, {}));
    }
  }
  const guys = 2 + A.guys * 2;
  for (let i = 0; i < guys; i++) {
    const a = (i / guys) * T + 0.3;
    const anchorX = Math.cos(a) * (W * 0.5 + 0.4), anchorZ = Math.sin(a) * (L * 0.5 + 0.35);
    const topX = Math.cos(a) * W * 0.24, topZ = Math.sin(a) * L * 0.42;
    g.add(part(tube([[topX, H * 0.92, topZ], [(topX + anchorX) / 2, H * 0.5, (topZ + anchorZ) / 2], [anchorX, 0.03, anchorZ]], 0.0035, 4), MAT.ropeHemp, 'guy-line-' + i, {}));
    g.add(part(cyl(0.008, 0.012, 0.16, 6), MAT.weatheredTimber, 'stake-' + i, { pos: [anchorX, 0.04, anchorZ], rot: [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3] }));
    if (A.guys > 1) g.add(part(box(0.02, 0.016, 0.006), MAT.weatheredTimber, 'tensioner-' + i, { pos: [(topX + anchorX) * 0.6, H * 0.4, (topZ + anchorZ) * 0.6] }));
  }
  if (A.patch) {
    for (let i = 0; i < 3; i++) {
      const a = rand() * T;
      g.add(part(box(0.12 + rand() * 0.08, 0.004, 0.1 + rand() * 0.06), CAMP.canvasPatch, 'patch-' + i, {
        pos: [Math.cos(a) * W * 0.3, H * (0.3 + rand() * 0.5), Math.sin(a) * L * 0.3],
        rot: [rand() * 0.6 - 0.3, a, rand() * 0.5],
      }));
    }
  }
  if (A.awning) {
    const aw = W * 0.9, al = 0.6;
    g.add(part(canvasSheet(aw, al, 0.05, 5, 4), mat, 'awning', { pos: [0, H * 0.72, L / 2 + al / 2], rot: [0.28, 0, 0] }));
    [-1, 1].forEach((s, i) => g.add(part(limb(0.011, 0.015, H * 0.62, 6, 2), MAT.weatheredTimber, 'awning-pole-' + i, { pos: [s * aw * 0.46, H * 0.31, L / 2 + al] })));
  }
  return seat(g);
}

/* ------------------------------------------------------------------ BEDROLL */
export const BEDROLL_AXES = { form: 4, roll: 3, blanket: 3, pillow: 2, frame: 3, scatter: 2 };
export function bedroll(variant = 0) {
  const A = axesOf(variant, BEDROLL_AXES);
  const rand = rnd(variant * 641 + 9);
  const g = new THREE.Group();
  const L = 1.65, W = 0.6;
  let baseY = 0;
  if (A.frame === 1) {
    for (let i = 0; i < 7; i++) g.add(part(limb(0.02, 0.026, W, 6, 2), MAT.weatheredTimber, 'pole-bed-' + i, { pos: [0, 0.026, -L / 2 + (L / 6) * i], rot: [0, 0, Math.PI / 2] }));
    baseY = 0.05;
  } else if (A.frame === 2) {
    g.add(part(box(L, 0.05, W), MAT.weatheredTimber, 'plank-bed', { pos: [0, 0.06, 0] }));
    [-1, 1].forEach((s, i) => [-1, 1].forEach((s2, j) => g.add(part(box(0.06, 0.09, 0.06), MAT.darkOak, 'bed-foot-' + i + '-' + j, { pos: [s * L * 0.42, 0.045, s2 * W * 0.38] }))));
    baseY = 0.085;
  } else {
    for (let i = 0; i < 9; i++) g.add(part(cone(0.03, 0.14, 4), MAT.reedPale, 'bracken-' + i, { pos: [(rand() - 0.5) * L * 0.9, 0.02, (rand() - 0.5) * W * 0.9], rot: [1.45, rand() * T, 0] }));
    baseY = 0.03;
  }
  if (A.form === 3) {
    // Rolled and tied, not laid out.
    const r = 0.13;
    g.add(part(cyl(r, r, W * 0.95, 14), CAMP.blanket, 'rolled-bedroll', { pos: [0, baseY + r, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(part(cyl(r * 0.7, r * 0.7, W * 0.99, 12), CAMP.canvasDark, 'roll-core', { pos: [0, baseY + r, 0], rot: [0, 0, Math.PI / 2] }));
    for (let k = 0; k < 2 + A.roll; k++) g.add(part(torus(r * 1.03, 0.008, 4, 14), MAT.ropeHemp, 'roll-strap-' + k, { pos: [(k - A.roll * 0.5) * 0.16, baseY + r, 0], rot: [0, Math.PI / 2, 0] }));
    if (A.pillow) g.add(part(ico(0.09, 1), CAMP.blanketPale, 'stuffed-sack', { pos: [0.3, baseY + 0.08, 0.1] }));
  } else {
    const pad = box(L * 0.94, 0.05, W * 0.9, 8, 1, 4);
    const p = pad.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const tx = p.getX(i) / (L * 0.94);
      p.setY(i, p.getY(i) + Math.sin(tx * 9) * 0.008 + (Math.abs(tx) > 0.3 ? 0.006 : 0));
    }
    p.needsUpdate = true; pad.computeVertexNormals();
    g.add(part(pad, CAMP.canvasDark, 'ground-pad', { pos: [0, baseY + 0.025, 0] }));
    const bl = A.form === 0 ? L * 0.62 : L * 0.9;
    const blanket = box(bl, 0.035, W * 0.88, 7, 1, 4);
    const bp = blanket.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const tz = bp.getZ(i) / (W * 0.88);
      const tx = bp.getX(i) / bl;
      bp.setY(i, bp.getY(i) + Math.sin(tz * 8 + tx * 4) * 0.012 * (1 + A.blanket * 0.4));
    }
    bp.needsUpdate = true; blanket.computeVertexNormals();
    g.add(part(blanket, A.blanket === 2 ? CAMP.blanketPale : CAMP.blanket, 'blanket', {
      pos: [A.form === 0 ? -L * 0.14 : 0, baseY + 0.068, 0],
      rot: [0, A.form === 1 ? 0.06 : 0, 0],
    }));
    if (A.blanket) {
      const fold = box(bl * 0.3, 0.04, W * 0.9, 3, 1, 3);
      g.add(part(fold, CAMP.blanketPale, 'turned-fold', { pos: [bl * 0.32, baseY + 0.1, 0], rot: [0, 0, -0.12] }));
    }
    if (A.pillow) {
      const pil = ico(0.1, 1);
      pil.scale(1.3, 0.62, 1);
      g.add(part(pil, CAMP.canvas, 'pillow-sack', { pos: [L * 0.38, baseY + 0.09, 0], rot: [0, 0.3, 0] }));
      g.add(part(torus(0.03, 0.008, 4, 10), MAT.ropeHemp, 'pillow-tie', { pos: [L * 0.45, baseY + 0.09, 0], rot: [0, Math.PI / 2, 0] }));
    }
    if (A.roll) {
      const r = 0.075;
      g.add(part(cyl(r, r, W * 0.7, 11), CAMP.blanketPale, 'spare-roll', { pos: [-L * 0.42, baseY + r + 0.03, 0], rot: [0, 0, Math.PI / 2] }));
      for (let k = 0; k < A.roll; k++) g.add(part(torus(r * 1.05, 0.006, 3, 11), MAT.ropeHemp, 'spare-strap-' + k, { pos: [-L * 0.42 + (k - 0.5) * 0.14, baseY + r + 0.03, 0], rot: [0, Math.PI / 2, 0] }));
    }
  }
  if (A.scatter) {
    g.add(part(lathe([[0.03, 0], [0.036, 0.02], [0.03, 0.05], [0.032, 0.055]], 11), MAT.firedClay, 'cup', { pos: [L * 0.3, baseY + 0.02, W * 0.55] }));
    g.add(part(cyl(0.012, 0.012, 0.2, 7), MAT.weatheredTimber, 'walking-staff', { pos: [-L * 0.1, baseY + 0.012, -W * 0.62], rot: [0, 0.4, Math.PI / 2] }));
    for (let k = 0; k < 3; k++) g.add(part(ico(0.014, 0), MAT.slateDry, 'pebble-' + k, { pos: [(rand() - 0.5) * L, baseY * 0.4 + 0.01, (rand() - 0.5) * W * 1.6] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- CAMPFIRE */
export const CAMPFIRE_AXES = { ring: 4, logs: 4, state: 3, spit: 3, pot: 2 };
export function campfire(variant = 0) {
  const A = axesOf(variant, CAMPFIRE_AXES);
  const rand = rnd(variant * 373 + 15);
  const g = new THREE.Group();
  const R = 0.32 + A.ring * 0.05;
  if (A.ring === 0) {
    g.add(part(lathe([[R * 0.9, 0], [R * 0.8, 0.01], [0, 0.014]], 14), CAMP.fireash, 'scorch-ring'));
  } else {
    const n = 7 + A.ring * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * T + rand() * 0.2;
      const sr = R * (0.09 + rand() * 0.05);
      const s = ico(sr, A.ring > 2 ? 1 : 0);
      jitter(s, sr * 0.24, rand);
      s.scale(1, 0.7 + rand() * 0.4, 1);
      g.add(part(s, i % 3 === 0 ? MAT.wetSlate : MAT.slateDry, 'ring-stone-' + i, { pos: [Math.cos(a) * R, sr * 0.55, Math.sin(a) * R], rot: [rand() * 0.4, rand() * T, rand() * 0.3] }));
    }
  }
  g.add(part(lathe([[R * 0.78, 0], [R * 0.6, 0.012], [R * 0.2, 0.024], [0, 0.026]], 13), CAMP.fireash, 'ash-bed'));
  const logs = 2 + A.logs;
  for (let i = 0; i < logs; i++) {
    const a = (i / logs) * T + rand() * 0.4;
    const L = R * (0.9 + rand() * 0.6);
    const lr = 0.028 + rand() * 0.018;
    const burnt = A.state > 0;
    const log = cyl(lr, lr * 1.1, L, 8, 2);
    jitter(log, lr * 0.12, rand);
    const tipUp = A.state === 2 ? 0.5 : 0.16;
    g.add(part(log, burnt ? CAMP.charcoal : CAMP.bark, 'log-' + i, {
      pos: [Math.cos(a) * R * 0.2, 0.03 + lr + Math.sin(tipUp) * L * 0.3, Math.sin(a) * R * 0.2],
      rot: [0, -a, Math.PI / 2 - tipUp],
    }));
    if (!burnt) g.add(part(cyl(lr * 0.8, lr * 0.8, 0.008, 8), CAMP.splitWood, 'log-end-' + i, {
      pos: [Math.cos(a) * (R * 0.2 + L * 0.48), 0.03 + lr + Math.sin(tipUp) * L * 0.3, Math.sin(a) * (R * 0.2 + L * 0.48)],
      rot: [0, -a, Math.PI / 2 - tipUp],
    }));
  }
  if (A.state > 0) {
    const n = 5 + A.state * 3;
    for (let i = 0; i < n; i++) {
      const a = rand() * T, d = rand() * R * 0.5;
      g.add(part(ico(0.016 + rand() * 0.012, 0), A.state === 2 ? CAMP.emberHot : CAMP.charcoal, 'coal-' + i, { pos: [Math.cos(a) * d, 0.035 + rand() * 0.01, Math.sin(a) * d] }));
    }
  }
  if (A.state === 2) {
    for (let i = 0; i < 5; i++) {
      const fh = 0.1 + rand() * 0.16;
      const a = rand() * T, d = rand() * R * 0.3;
      g.add(part(cone(0.035 - i * 0.004, fh, 5), CAMP.flame, 'flame-' + i, { pos: [Math.cos(a) * d, 0.05 + fh / 2, Math.sin(a) * d], rot: [(rand() - 0.5) * 0.3, rand() * T, (rand() - 0.5) * 0.3] }));
    }
  }
  if (A.spit) {
    const sh = 0.42 + A.spit * 0.05;
    [-1, 1].forEach((s, i) => {
      if (A.spit === 1) g.add(part(limb(0.012, 0.018, sh, 6, 2), MAT.weatheredTimber, 'spit-post-' + i, { pos: [s * R * 1.05, sh / 2, 0], rot: [0, 0, s * 0.12] }));
      else {
        g.add(part(cyl(0.008, 0.01, sh, 7), MAT.pittedIron, 'spit-iron-' + i, { pos: [s * R * 1.05, sh / 2, 0] }));
        g.add(part(torus(0.02, 0.004, 3, 10, Math.PI), MAT.pittedIron, 'spit-crook-' + i, { pos: [s * R * 1.05, sh, 0], rot: [0, Math.PI / 2, 0] }));
      }
    });
    g.add(part(cyl(0.007, 0.007, R * 2.4, 7), MAT.pittedIron, 'spit-bar', { pos: [0, sh, 0], rot: [0, 0, Math.PI / 2] }));
    if (A.spit > 1) {
      g.add(part(torus(0.024, 0.005, 3, 10), MAT.pittedIron, 'spit-crank', { pos: [R * 1.2, sh, 0], rot: [0, Math.PI / 2, 0] }));
      const roast = ico(0.08, 1);
      roast.scale(1.5, 0.9, 0.9);
      g.add(part(roast, MAT.firedClay, 'roast', { pos: [0, sh, 0], rot: [0, 0, Math.PI / 2] }));
    }
    if (A.pot) {
      const pr = 0.09;
      g.add(part(lathe([[pr * 0.4, 0], [pr, pr * 0.5], [pr * 0.95, pr * 1.1], [pr * 0.78, pr * 1.25], [pr * 0.82, pr * 1.32]], 13), MAT.blackIron, 'pot', { pos: [0, sh - pr * 1.6, 0] }));
      g.add(part(torus(pr * 0.75, pr * 0.06, 4, 12, Math.PI), MAT.pittedIron, 'pot-bail', { pos: [0, sh - pr * 0.32, 0], rot: [0, 0, 0] }));
      g.add(part(torus(0.014, 0.003, 3, 9), MAT.pittedIron, 'pot-hook', { pos: [0, sh - 0.016, 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  return seat(g);
}

/* --------------------------------------------------------------- COOK TRIPOD */
export const TRIPOD_AXES = { legs: 3, potForm: 4, hang: 3, height: 3, kettle: 2, chain: 2 };
export function cookTripod(variant = 0) {
  const A = axesOf(variant, TRIPOD_AXES);
  const rand = rnd(variant * 823 + 21);
  const g = new THREE.Group();
  const H = 0.85 + A.height * 0.22;
  const spread = H * 0.34;
  const legs = 3 + (A.legs > 1 ? 1 : 0);
  const mat = A.legs === 2 ? MAT.pittedIron : MAT.weatheredTimber;
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * T;
    const geo = A.legs === 2 ? cyl(0.009, 0.012, H, 7) : limb(0.013, 0.02, H, 6, 3);
    if (A.legs !== 2) jitter(geo, 0.004, rand);
    g.add(part(geo, mat, 'leg-' + i, {
      pos: [Math.cos(a) * spread * 0.5, H / 2, Math.sin(a) * spread * 0.5],
      rot: [Math.sin(a) * 0.34, 0, -Math.cos(a) * 0.34],
    }));
    g.add(part(ico(0.022, 0), MAT.slateDry, 'leg-stone-' + i, { pos: [Math.cos(a) * spread, 0.015, Math.sin(a) * spread] }));
  }
  g.add(part(torus(0.03, 0.008, 4, 12), MAT.pittedIron, 'apex-ring', { pos: [0, H - 0.02, 0], rot: [Math.PI / 2, 0, 0] }));
  for (let k = 0; k < 2; k++) g.add(part(torus(0.045, 0.005, 3, 12), MAT.ropeHemp, 'apex-lashing-' + k, { pos: [0, H - 0.06 - k * 0.03, 0], rot: [Math.PI / 2, 0, 0] }));
  const hangL = 0.16 + A.hang * 0.09;
  if (A.chain) {
    for (let k = 0; k < 4 + A.hang; k++) {
      const t = k / (4 + A.hang);
      g.add(part(torus(0.014, 0.0035, 3, 9), MAT.pittedIron, 'chain-' + k, { pos: [0, H - 0.04 - t * hangL, 0], rot: [k % 2 ? 0 : Math.PI / 2, 0, 0] }));
    }
  } else {
    g.add(part(tube([[0, H - 0.03, 0], [0.004, H - 0.03 - hangL * 0.5, 0], [0, H - 0.03 - hangL, 0]], 0.004, 5), MAT.ropeHemp, 'hang-cord', {}));
  }
  const y = H - 0.05 - hangL;
  const pr = 0.075 + A.potForm * 0.015;
  const prof = A.potForm === 0
    ? [[pr * 0.4, 0], [pr, pr * 0.5], [pr * 0.94, pr * 1.1], [pr * 0.76, pr * 1.24], [pr * 0.8, pr * 1.3]]
    : A.potForm === 1
      ? [[pr * 0.85, 0], [pr * 0.95, pr * 0.6], [pr * 0.9, pr * 1.15], [pr * 0.92, pr * 1.2]]
      : A.potForm === 2
        ? [[pr * 0.2, 0], [pr * 0.9, pr * 0.4], [pr * 1.05, pr * 0.9], [pr * 0.6, pr * 1.2], [pr * 0.64, pr * 1.26]]
        : [[pr * 0.5, 0], [pr * 1.02, pr * 0.35], [pr * 0.98, pr * 0.85], [pr * 0.5, pr * 1.1], [pr * 0.54, pr * 1.16]];
  const potH = prof[prof.length - 1][1];
  g.add(part(lathe(prof, 14), MAT.blackIron, 'pot', { pos: [0, y - potH, 0] }));
  g.add(part(torus(prof[prof.length - 1][0] * 1.06, pr * 0.05, 4, 14), MAT.pittedIron, 'pot-rim', { pos: [0, y - 0.004, 0] }));
  g.add(part(torus(pr * 0.7, pr * 0.055, 4, 14, Math.PI), MAT.pittedIron, 'pot-bail', { pos: [0, y - potH * 0.06, 0] }));
  if (A.potForm === 3) g.add(part(lathe([[pr * 0.52, 0], [pr * 0.46, pr * 0.1], [pr * 0.14, pr * 0.16], [0, pr * 0.18]], 12), MAT.blackIron, 'pot-lid', { pos: [0, y - 0.002, 0] }));
  if (A.kettle) {
    const kx = spread * 0.85;
    g.add(part(lathe([[0.045, 0], [0.055, 0.03], [0.05, 0.07], [0.03, 0.085], [0.032, 0.09]], 12), MAT.pittedIron, 'kettle', { pos: [kx, 0, 0] }));
    g.add(part(tube([[kx + 0.045, 0.05, 0], [kx + 0.075, 0.07, 0], [kx + 0.085, 0.055, 0]], 0.008, 6), MAT.pittedIron, 'kettle-spout', {}));
    g.add(part(torus(0.03, 0.005, 3, 11, Math.PI), MAT.pittedIron, 'kettle-bail', { pos: [kx, 0.095, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------- TRAVELER PACK */
export const PACK_AXES = { form: 4, straps: 3, bedroll: 2, tools: 4, slump: 3, count: 2 };
export function travelerPack(variant = 0) {
  const A = axesOf(variant, PACK_AXES);
  const rand = rnd(variant * 967 + 27);
  const g = new THREE.Group();
  const n = 1 + A.count;
  for (let pi = 0; pi < n; pi++) {
    const px = pi * 0.34, pz = pi * 0.1;
    const rot = pi * 0.6;
    const H = 0.34 + A.form * 0.05;
    const W = H * 0.72, D = H * 0.5;
    const slump = 0.06 + A.slump * 0.05;
    let bodyGeo;
    if (A.form === 3) {
      bodyGeo = lathe([[W * 0.32, 0], [W * 0.5, H * 0.3], [W * 0.46, H * 0.72], [W * 0.24, H * 0.94], [W * 0.2, H]], 13);
      jitter(bodyGeo, W * slump * 0.4, rand);
    } else {
      bodyGeo = box(W, H, D, 3, 4, 3);
      const p = bodyGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const ty = (p.getY(i) + H / 2) / H;
        const bulge = Math.sin(ty * Math.PI) * slump;
        p.setX(i, p.getX(i) * (1 + bulge));
        p.setZ(i, p.getZ(i) * (1 + bulge * 1.3));
      }
      p.needsUpdate = true; bodyGeo.computeVertexNormals();
      jitter(bodyGeo, W * 0.012, rand);
    }
    g.add(part(bodyGeo, pi % 2 ? CAMP.hide : CAMP.canvasDark, 'pack-body-' + pi, { pos: [px, A.form === 3 ? 0 : H / 2, pz], rot: [0, rot, A.slump === 2 ? 0.1 : 0] }));
    // Flap and closure.
    if (A.form !== 3) {
      const flap = box(W * 1.04, D * 0.9, 0.006, 3, 3, 1);
      const fp = flap.attributes.position;
      for (let i = 0; i < fp.count; i++) { const ty = (fp.getY(i) + D * 0.45) / (D * 0.9); fp.setZ(i, fp.getZ(i) - (1 - ty) * D * 0.2); }
      fp.needsUpdate = true; flap.computeVertexNormals();
      g.add(part(flap, pi % 2 ? CAMP.hide : CAMP.canvas, 'pack-flap-' + pi, { pos: [px, H * 0.94, pz + D * 0.4], rot: [1.1, rot, 0] }));
      g.add(part(box(0.02, 0.06, 0.005), CAMP.hide, 'flap-tongue-' + pi, { pos: [px, H * 0.72, pz + D * 0.62], rot: [0.2, rot, 0] }));
      g.add(part(torus(0.011, 0.003, 3, 10), MAT.warmBrass, 'flap-buckle-' + pi, { pos: [px, H * 0.66, pz + D * 0.6], rot: [0, rot, 0] }));
    }
    for (let s = 0; s < A.straps; s++) {
      const sy = H * (0.26 + s * 0.24);
      g.add(part(box(W * 1.12, 0.022, 0.005), CAMP.hide, 'strap-' + pi + '-' + s, { pos: [px, sy, pz + D * 0.56], rot: [0, rot, 0] }));
      g.add(part(torus(0.009, 0.0026, 3, 9), MAT.pittedIron, 'strap-ring-' + pi + '-' + s, { pos: [px + W * 0.4, sy, pz + D * 0.56], rot: [0, rot, 0] }));
    }
    // Shoulder straps, which are what makes it a pack and not a bag.
    [-1, 1].forEach((s, si) => {
      g.add(part(tube([[px + s * W * 0.26, H * 0.94, pz - D * 0.3], [px + s * W * 0.34, H * 0.55, pz - D * 0.55], [px + s * W * 0.2, H * 0.12, pz - D * 0.36]], 0.011, 5), CAMP.hide, 'shoulder-strap-' + pi + '-' + si, {}));
    });
    if (A.bedroll) {
      const r = 0.055;
      g.add(part(cyl(r, r, W * 1.15, 11), CAMP.blanketPale, 'lashed-roll-' + pi, { pos: [px, H * 1.02 + r, pz - D * 0.1], rot: [0, rot, Math.PI / 2] }));
      for (let k = 0; k < 2; k++) g.add(part(torus(r * 1.06, 0.005, 3, 11), MAT.ropeHemp, 'roll-lash-' + pi + '-' + k, { pos: [px + (k ? 1 : -1) * W * 0.3, H * 1.02 + r, pz - D * 0.1], rot: [0, Math.PI / 2 + rot, 0] }));
    }
    for (let t = 0; t < A.tools; t++) {
      const kind = (t + pi) % 4;
      const tx = px + (t % 2 ? 1 : -1) * W * 0.5, ty = H * (0.3 + t * 0.14), tz = pz - D * 0.45;
      if (kind === 0) {
        g.add(part(cyl(0.008, 0.009, 0.26, 6), MAT.weatheredTimber, 'tool-haft-' + pi + '-' + t, { pos: [tx, ty, tz], rot: [0.2, rot, 0.1] }));
        g.add(part(box(0.05, 0.03, 0.012), MAT.pittedIron, 'tool-head-' + pi + '-' + t, { pos: [tx + 0.01, ty + 0.13, tz], rot: [0.2, rot, 0.1] }));
      } else if (kind === 1) {
        g.add(part(lathe([[0.022, 0], [0.03, 0.02], [0.028, 0.07], [0.016, 0.085]], 11), MAT.firedClay, 'waterskin-neck-' + pi + '-' + t, { pos: [tx, ty, tz], rot: [0, rot, 0.2] }));
      } else if (kind === 2) {
        for (let k = 0; k < 3; k++) g.add(part(cone(0.006, 0.05, 4), MAT.reedPale, 'herb-sprig-' + pi + '-' + t + '-' + k, { pos: [tx, ty + 0.03, tz + k * 0.008], rot: [0.3, rot + k * 0.3, 0.2] }));
      } else {
        g.add(part(box(0.05, 0.035, 0.014), CAMP.hide, 'pouch-' + pi + '-' + t, { pos: [tx, ty, tz], rot: [0, rot, 0.1] }));
        g.add(part(torus(0.007, 0.002, 3, 8), MAT.warmBrass, 'pouch-ring-' + pi + '-' + t, { pos: [tx, ty + 0.02, tz], rot: [0, rot, 0] }));
      }
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------- FIELD DRYING RACK */
export const FIELDRACK_AXES = { frame: 3, rows: 4, hangs: 4, lean: 3, cloth: 2 };
export function fieldDryingRack(variant = 0) {
  const A = axesOf(variant, FIELDRACK_AXES);
  const rand = rnd(variant * 691 + 33);
  const g = new THREE.Group();
  const W = 0.9 + A.rows * 0.1;
  const H = 0.95 + A.frame * 0.2;
  const tri = A.frame === 2;
  if (tri) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(limb(0.014, 0.022, H, 6, 3), MAT.weatheredTimber, 'tripod-leg-' + i, {
        pos: [Math.cos(a) * W * 0.22, H / 2, Math.sin(a) * W * 0.22],
        rot: [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4],
      }));
    }
    g.add(part(torus(0.04, 0.006, 4, 12), MAT.ropeHemp, 'tripod-lash', { pos: [0, H - 0.05, 0], rot: [Math.PI / 2, 0, 0] }));
  } else {
    [-1, 1].forEach((s, i) => {
      g.add(part(limb(0.018, 0.026, H, 7, 3), MAT.weatheredTimber, 'upright-' + i, { pos: [s * W / 2, H / 2, 0], rot: [0, 0, s * (A.lean - 1) * 0.04] }));
      if (A.frame) g.add(part(limb(0.012, 0.016, H * 0.6, 6, 2), MAT.weatheredTimber, 'foot-brace-' + i, { pos: [s * (W / 2 - 0.06), H * 0.3, 0.1], rot: [0.55, 0, s * 0.12] }));
      g.add(part(box(0.14, 0.02, 0.14), MAT.slateDry, 'foot-plate-' + i, { pos: [s * W / 2, 0.01, 0] }));
    });
    g.add(part(cyl(0.012, 0.012, W + 0.06, 7), MAT.weatheredTimber, 'top-bar', { pos: [0, H, 0], rot: [0, 0, Math.PI / 2] }));
  }
  const rows = 1 + A.rows;
  for (let r = 0; r < rows; r++) {
    const y = H * (0.42 + r * (0.52 / rows));
    if (!tri) g.add(part(tube([[-W / 2, y, 0], [0, y - 0.03 - r * 0.01, 0], [W / 2, y, 0]], 0.0035, 5), MAT.ropeHemp, 'line-' + r, {}));
    else g.add(part(torus(W * 0.24, 0.0035, 4, 14), MAT.ropeHemp, 'ring-line-' + r, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
    const n = 2 + A.hangs;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = tri ? Math.cos(t * T) * W * 0.24 : -W * 0.44 + t * W * 0.88;
      const z = tri ? Math.sin(t * T) * W * 0.24 : 0;
      const ly = tri ? y : y - Math.sin(t * Math.PI) * (0.03 + r * 0.01);
      const kind = (i + r) % 3;
      if (kind === 0) {
        for (let k = 0; k < 4; k++) g.add(part(cone(0.008, 0.07, 4), MAT.reedPale, 'herb-' + r + '-' + i + '-' + k, { pos: [x + (k - 1.5) * 0.008, ly - 0.045, z], rot: [Math.PI + (rand() - 0.5) * 0.2, rand() * T, 0] }));
        g.add(part(torus(0.012, 0.0025, 3, 9), MAT.ropeHemp, 'herb-tie-' + r + '-' + i, { pos: [x, ly - 0.012, z], rot: [Math.PI / 2, 0, 0] }));
      } else if (kind === 1) {
        const strip = box(0.03, 0.1, 0.006, 1, 3, 1);
        const p = strip.attributes.position;
        for (let v = 0; v < p.count; v++) p.setZ(v, p.getZ(v) + Math.sin((p.getY(v) + 0.05) * 30) * 0.006);
        p.needsUpdate = true; strip.computeVertexNormals();
        g.add(part(strip, CAMP.hide, 'hide-strip-' + r + '-' + i, { pos: [x, ly - 0.055, z], rot: [0, rand() * 0.4, 0] }));
      } else {
        const r0 = 0.02 + rand() * 0.012;
        g.add(part(ico(r0, 1), MAT.firedClay, 'root-' + r + '-' + i, { pos: [x, ly - 0.03 - r0, z] }));
        g.add(part(tube([[x, ly, z], [x, ly - 0.028, z]], 0.0016, 4), MAT.ropeHemp, 'root-cord-' + r + '-' + i, {}));
      }
    }
  }
  if (A.cloth) {
    g.add(part(canvasSheet(W * 0.7, 0.3, 0.05, 5, 4), CAMP.canvas, 'draped-cloth', { pos: [0, H * 0.42 - 0.03, 0.02], rot: [1.45, 0, 0] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- SURVEY STAND */
export const SURVEY_AXES = { legs: 3, headForm: 4, scope: 3, chain: 2, caseOpt: 3, height: 2 };
export function surveyStand(variant = 0) {
  const A = axesOf(variant, SURVEY_AXES);
  const rand = rnd(variant * 1051 + 39);
  const g = new THREE.Group();
  const H = 1.15 + A.height * 0.2;
  const spread = H * 0.3;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * T;
    const legMat = A.legs === 2 ? MAT.pittedIron : MAT.darkOak;
    g.add(part(A.legs === 0 ? limb(0.012, 0.018, H, 6, 3) : box(0.022, H, 0.014, 1, 3, 1), legMat, 'leg-' + i, {
      pos: [Math.cos(a) * spread * 0.5, H / 2, Math.sin(a) * spread * 0.5],
      rot: [Math.sin(a) * 0.28, -a, -Math.cos(a) * 0.28],
    }));
    g.add(part(cone(0.008, 0.05, 5), MAT.pittedIron, 'leg-spike-' + i, { pos: [Math.cos(a) * spread, 0.02, Math.sin(a) * spread], rot: [Math.PI, 0, 0] }));
    if (A.legs) g.add(part(box(0.026, 0.03, 0.02), MAT.warmBrass, 'leg-clamp-' + i, { pos: [Math.cos(a) * spread * 0.7, H * 0.5, Math.sin(a) * spread * 0.7], rot: [0, -a, 0] }));
  }
  g.add(part(cyl(0.05, 0.055, 0.022, 12), MAT.darkOak, 'head-plate', { pos: [0, H, 0] }));
  g.add(part(cyl(0.02, 0.024, 0.03, 10), MAT.warmBrass, 'head-boss', { pos: [0, H + 0.024, 0] }));
  const hy = H + 0.04;
  if (A.headForm === 0) {
    g.add(part(box(0.09, 0.05, 0.06), MAT.pittedIron, 'instrument-body', { pos: [0, hy + 0.025, 0] }));
    g.add(part(torus(0.038, 0.006, 4, 16), MAT.warmBrass, 'azimuth-ring', { pos: [0, hy + 0.006, 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.headForm === 1) {
    g.add(part(lathe([[0.03, 0], [0.036, 0.02], [0.03, 0.05], [0.022, 0.06]], 12), MAT.warmBrass, 'theodolite-column', { pos: [0, hy, 0] }));
    g.add(part(torus(0.032, 0.005, 4, 14), MAT.warmBrass, 'vertical-circle', { pos: [0, hy + 0.06, 0], rot: [0, 0, 0] }));
  } else if (A.headForm === 2) {
    g.add(part(box(0.11, 0.014, 0.11), MAT.darkOak, 'plane-table', { pos: [0, hy + 0.007, 0] }));
    g.add(part(box(0.09, 0.002, 0.07), MAT.boneLinen, 'field-sheet', { pos: [0, hy + 0.015, 0], rot: [0, 0.1, 0] }));
    g.add(part(box(0.07, 0.004, 0.008), MAT.warmBrass, 'alidade', { pos: [0, hy + 0.018, 0], rot: [0, 0.4, 0] }));
  } else {
    g.add(part(cyl(0.026, 0.026, 0.07, 12), MAT.pittedIron, 'drum-housing', { pos: [0, hy + 0.035, 0] }));
    g.add(part(cyl(0.03, 0.03, 0.006, 12), MAT.warmBrass, 'drum-dial', { pos: [0, hy + 0.072, 0] }));
    for (let k = 0; k < 6; k++) g.add(part(box(0.002, 0.001, 0.008), MAT.blackIron, 'dial-tick-' + k, { pos: [Math.cos((k / 6) * T) * 0.022, hy + 0.076, Math.sin((k / 6) * T) * 0.022], rot: [0, -(k / 6) * T, 0] }));
  }
  if (A.scope) {
    const sl = 0.11 + A.scope * 0.03;
    g.add(part(cyl(0.011, 0.013, sl, 10), MAT.pittedIron, 'scope-tube', { pos: [0, hy + 0.07, 0], rot: [0, 0.5, Math.PI / 2] }));
    g.add(part(cyl(0.015, 0.015, 0.008, 10), MAT.warmBrass, 'scope-objective', { pos: [Math.cos(0.5) * sl * 0.5, hy + 0.07, -Math.sin(0.5) * sl * 0.5], rot: [0, 0.5, Math.PI / 2] }));
    g.add(part(cyl(0.009, 0.009, 0.006, 8), MAT.blackIron, 'scope-eyepiece', { pos: [-Math.cos(0.5) * sl * 0.5, hy + 0.07, Math.sin(0.5) * sl * 0.5], rot: [0, 0.5, Math.PI / 2] }));
    if (A.scope > 1) g.add(part(box(0.03, 0.02, 0.008), MAT.warmBrass, 'scope-cradle', { pos: [0, hy + 0.056, 0], rot: [0, 0.5, 0] }));
  }
  if (A.chain) {
    g.add(part(tube([[0, H * 0.5, spread * 0.4], [0.06, H * 0.3, spread * 0.7], [0.02, 0.02, spread * 1.1]], 0.003, 5), MAT.ropeHemp, 'plumb-cord', {}));
    g.add(part(cone(0.012, 0.05, 8), MAT.pittedIron, 'plumb-bob', { pos: [0.02, 0.03, spread * 1.1], rot: [Math.PI, 0, 0] }));
  }
  if (A.caseOpt) {
    const cx = spread * 1.5;
    g.add(part(box(0.24, 0.08, 0.1), A.caseOpt === 2 ? CAMP.hide : MAT.darkOak, 'instrument-case', { pos: [cx, 0.04, 0], rot: [0, 0.3, 0] }));
    g.add(part(box(0.24, 0.012, 0.1), MAT.pittedIron, 'case-strap', { pos: [cx, 0.082, 0], rot: [0, 0.3, 0] }));
    if (A.caseOpt > 1) {
      g.add(part(box(0.05, 0.03, 0.02), MAT.warmBrass, 'case-clasp', { pos: [cx + 0.1, 0.05, 0.04], rot: [0, 0.3, 0] }));
      for (let k = 0; k < 3; k++) g.add(part(cyl(0.006, 0.006, 0.2, 6), MAT.weatheredTimber, 'ranging-rod-' + k, { pos: [cx - 0.02 + k * 0.012, 0.09, 0], rot: [0, 0.3, Math.PI / 2] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------------- WOODPILE */
export const WOODPILE_AXES = { form: 4, count: 4, split: 3, bind: 3, cover: 2 };
export function woodpile(variant = 0) {
  const A = axesOf(variant, WOODPILE_AXES);
  const rand = rnd(variant * 577 + 45);
  const g = new THREE.Group();
  const logLen = 0.42;
  const lr = 0.045 - A.split * 0.008;
  const rows = 2 + A.count;
  if (A.form === 0) {
    // Stacked rick between two stakes.
    const perRow = 3 + A.count;
    for (let r = 0; r < rows; r++) for (let i = 0; i < perRow; i++) {
      const x = (i - (perRow - 1) / 2) * lr * 2.1 + (r % 2 ? lr : 0);
      const geo = A.split ? box(lr * 1.7, lr * 1.7, logLen, 1, 1, 2) : cyl(lr, lr * 1.05, logLen, 9, 2);
      jitter(geo, lr * 0.1, rand);
      g.add(part(geo, A.split && i % 2 === 0 ? CAMP.splitWood : CAMP.bark, 'log-' + r + '-' + i, { pos: [x, lr + r * lr * 2, (rand() - 0.5) * 0.02], rot: [0, 0, 0] }));
      if (A.split) g.add(part(box(lr * 1.7, lr * 1.7, 0.006), CAMP.splitWood, 'log-face-' + r + '-' + i, { pos: [x, lr + r * lr * 2, logLen / 2] }));
      else g.add(part(cyl(lr * 0.94, lr * 0.94, 0.006, 9), CAMP.splitWood, 'log-face-' + r + '-' + i, { pos: [x, lr + r * lr * 2, logLen / 2] }));
    }
    [-1, 1].forEach((s, i) => g.add(part(limb(0.018, 0.024, lr * 2 * rows + 0.15, 6, 2), MAT.weatheredTimber, 'stake-' + i, { pos: [s * ((3 + A.count) * lr * 1.1), (lr * 2 * rows + 0.15) / 2, 0] })));
  } else if (A.form === 1) {
    // Round holz-hausen.
    const R = 0.3 + A.count * 0.05;
    for (let r = 0; r < rows; r++) {
      const n = Math.max(6, Math.floor(T * R / (lr * 2.2)) - r);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * T + r * 0.3;
        const geo = A.split ? box(lr * 1.6, lr * 1.6, logLen * 0.8, 1, 1, 2) : cyl(lr, lr, logLen * 0.8, 8, 1);
        g.add(part(geo, i % 3 === 0 ? CAMP.splitWood : CAMP.bark, 'ring-log-' + r + '-' + i, {
          pos: [Math.cos(a) * R, lr + r * lr * 1.9, Math.sin(a) * R],
          rot: [0, -a + Math.PI / 2, 0.06],
        }));
      }
    }
  } else if (A.form === 2) {
    // Loose heap.
    const n = 8 + A.count * 5;
    for (let i = 0; i < n; i++) {
      const a = rand() * T, d = Math.sqrt(rand()) * (0.28 + A.count * 0.05);
      const y = lr + (1 - d / (0.28 + A.count * 0.05)) * lr * 2.4 * rows * 0.4;
      const geo = A.split ? box(lr * 1.5, lr * 1.5, logLen * (0.5 + rand() * 0.6), 1, 1, 2) : cyl(lr * 0.9, lr, logLen * (0.5 + rand() * 0.6), 7, 1);
      g.add(part(geo, i % 3 === 0 ? CAMP.splitWood : CAMP.bark, 'heap-log-' + i, {
        pos: [Math.cos(a) * d, y, Math.sin(a) * d],
        rot: [rand() * 0.5, rand() * T, rand() * 0.5],
      }));
    }
  } else {
    // Bound faggots.
    const bundles = 1 + A.count;
    for (let b = 0; b < bundles; b++) {
      const bx = (b - (bundles - 1) / 2) * 0.17;
      const rowY = b % 2 === 0 ? 0.07 : 0.2;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * T;
        g.add(part(cyl(0.008, 0.01, logLen, 5), CAMP.bark, 'faggot-stick-' + b + '-' + i, {
          pos: [bx + Math.cos(a) * 0.028, rowY + Math.sin(a) * 0.028, 0],
          rot: [Math.PI / 2, 0, 0],
        }));
      }
      for (let k = 0; k < 1 + A.bind; k++) g.add(part(torus(0.036, 0.005, 4, 12), MAT.ropeHemp, 'faggot-bind-' + b + '-' + k, { pos: [bx, rowY, -logLen * 0.3 + k * logLen * 0.3], rot: [0, 0, 0] }));
    }
  }
  if (A.bind && A.form !== 3) {
    for (let k = 0; k < A.bind; k++) g.add(part(tube([[-0.3, lr * 2 * rows * 0.8, 0], [0, lr * 2 * rows * 0.85, 0.05], [0.3, lr * 2 * rows * 0.8, 0]], 0.004, 5), MAT.ropeHemp, 'tie-line-' + k, {}));
  }
  if (A.cover) {
    const cw = 0.8, cl = 0.5;
    g.add(part(canvasSheet(cw, cl, 0.04, 6, 5), CAMP.canvasDark, 'tarpaulin', { pos: [0, lr * 2 * rows + 0.04, 0], rot: [0, 0, 0.05] }));
    for (let k = 0; k < 3; k++) g.add(part(ico(0.03, 0), MAT.slateDry, 'weight-stone-' + k, { pos: [-cw * 0.35 + k * cw * 0.35, lr * 2 * rows + 0.07, (k % 2 ? 1 : -1) * cl * 0.35] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- WASH STAND */
export const WASHSTAND_AXES = { form: 4, basin: 3, jug: 3, cloth: 2, mirror: 2, legs: 3 };
export function washStand(variant = 0) {
  const A = axesOf(variant, WASHSTAND_AXES);
  const rand = rnd(variant * 883 + 51);
  const g = new THREE.Group();
  const H = 0.72 + A.form * 0.06;
  const W = 0.4 + A.form * 0.05;
  const D = W * 0.7;
  if (A.legs === 0) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(limb(0.014, 0.02, H, 6, 3), MAT.darkOak, 'leg-' + i, { pos: [Math.cos(a) * W * 0.26, H / 2, Math.sin(a) * W * 0.26], rot: [Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16] }));
    }
    g.add(part(torus(W * 0.22, 0.008, 4, 14), MAT.darkOak, 'leg-stretcher', { pos: [0, H * 0.3, 0], rot: [Math.PI / 2, 0, 0] }));
  } else {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
      g.add(part(A.legs === 2 ? box(0.028, H, 0.028) : limb(0.014, 0.02, H, 6, 2), MAT.darkOak, 'leg-' + i, { pos: [c[0] * W * 0.42, H / 2, c[1] * D * 0.4] }));
    });
    [-1, 1].forEach((s, i) => g.add(part(box(W * 0.9, 0.018, 0.02), MAT.darkOak, 'apron-' + i, { pos: [0, H * 0.24, s * D * 0.4] })));
    if (A.legs === 2) g.add(part(box(W * 0.82, 0.014, D * 0.72), MAT.weatheredTimber, 'lower-shelf', { pos: [0, H * 0.24, 0] }));
  }
  g.add(part(box(W, 0.022, D), MAT.heartwood, 'top', { pos: [0, H, 0] }));
  g.add(part(box(W * 1.02, 0.012, 0.016), MAT.darkOak, 'top-edge', { pos: [0, H + 0.014, D * 0.49] }));
  const br = 0.11 + A.basin * 0.015;
  const basinProf = A.basin === 2
    ? [[br * 0.44, 0], [br * 0.9, br * 0.24], [br, br * 0.42], [br * 0.94, br * 0.5]]
    : [[br * 0.5, 0], [br * 0.86, br * 0.2], [br * 0.98, br * 0.4], [br * 1.04, br * 0.46]];
  g.add(part(lathe(basinProf, 16), A.basin ? MAT.pittedIron : MAT.clayPale, 'basin', { pos: [-W * 0.12, H + 0.012, 0] }));
  g.add(part(lathe([[br * 0.85, 0], [br * 0.5, -0.004], [0, -0.006]], 14), MAT.blackwater, 'basin-water', { pos: [-W * 0.12, H + 0.012 + br * 0.38, 0] }));
  if (A.jug) {
    const jr = 0.05;
    const jx = W * 0.28;
    g.add(part(lathe([[jr * 0.6, 0], [jr, jr * 0.5], [jr * 0.94, jr * 1.3], [jr * 0.5, jr * 1.7], [jr * 0.56, jr * 1.8]], 14), A.jug === 2 ? MAT.pittedIron : MAT.firedClay, 'jug', { pos: [jx, H + 0.012, 0] }));
    g.add(part(torus(jr * 0.42, jr * 0.09, 4, 12, Math.PI * 1.1), A.jug === 2 ? MAT.pittedIron : MAT.firedClay, 'jug-handle', { pos: [jx + jr * 0.75, H + 0.012 + jr * 1.2, 0], rot: [0, Math.PI / 2, 1.4] }));
    if (A.jug > 1) g.add(part(lathe([[jr * 0.5, 0], [jr * 0.3, jr * 0.16], [0, jr * 0.2]], 11), MAT.pittedIron, 'jug-lid', { pos: [jx, H + 0.012 + jr * 1.8, 0] }));
  }
  if (A.cloth) {
    const towel = box(0.1, 0.2, 0.006, 3, 5, 1);
    const p = towel.attributes.position;
    for (let v = 0; v < p.count; v++) p.setZ(v, p.getZ(v) + Math.sin((p.getY(v) + 0.1) * 22) * 0.007);
    p.needsUpdate = true; towel.computeVertexNormals();
    g.add(part(towel, MAT.boneLinen, 'towel', { pos: [W * 0.46, H - 0.08, D * 0.2], rot: [0, 1.5, 0.04] }));
    g.add(part(cyl(0.006, 0.006, 0.1, 6), MAT.pittedIron, 'towel-rail', { pos: [W * 0.5, H + 0.02, D * 0.2], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.mirror) {
    g.add(part(box(0.13, 0.17, 0.012), MAT.darkOak, 'mirror-frame', { pos: [-W * 0.12, H + 0.11, -D * 0.42], rot: [-0.16, 0, 0] }));
    g.add(part(box(0.1, 0.14, 0.003), MAT.wetSlate, 'mirror-glass', { pos: [-W * 0.12, H + 0.11, -D * 0.42 + 0.008], rot: [-0.16, 0, 0] }));
    g.add(part(box(0.02, 0.09, 0.014), MAT.darkOak, 'mirror-stay', { pos: [-W * 0.12, H + 0.035, -D * 0.38], rot: [0.3, 0, 0] }));
    g.add(part(lathe([[0.014, 0], [0.017, 0.008], [0.014, 0.03]], 10), MAT.clayPale, 'soap-dish', { pos: [W * 0.05, H + 0.012, -D * 0.28] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------------- SNARE */
export const SNARE_AXES = { form: 4, stakes: 3, bait: 3, sprung: 2, cord: 3, count: 2 };
export function snareSet(variant = 0) {
  const A = axesOf(variant, SNARE_AXES);
  const rand = rnd(variant * 743 + 57);
  const g = new THREE.Group();
  const n = 1 + A.count;
  for (let si = 0; si < n; si++) {
    const ox = si * 0.42, oz = si * 0.16;
    if (A.form === 0) {
      // Bent-sapling spring snare.
      const sh = 0.72;
      const bend = A.sprung ? 0.2 : 0.72;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        pts.push([ox + t * bend * 0.6, t * sh * (1 - bend * 0.4), oz + t * 0.05]);
      }
      g.add(part(tube(pts, 0.012 - 0.004, 6), MAT.pineBark, 'sapling-' + si, {}));
      g.add(part(cone(0.02, 0.06, 5), MAT.pineNeedle, 'sapling-tip-' + si, { pos: [pts[6][0], pts[6][1] + 0.02, pts[6][2]] }));
      const tipY = pts[6][1];
      g.add(part(tube([[pts[6][0], tipY, pts[6][2]], [pts[6][0], tipY * 0.4, pts[6][2] + 0.02], [ox + 0.05, A.sprung ? 0.16 : 0.03, oz]], 0.0026, 4), MAT.ropeHemp, 'snare-cord-' + si, {}));
      if (!A.sprung) g.add(part(torus(0.045, 0.0026, 4, 14), MAT.ropeHemp, 'noose-' + si, { pos: [ox + 0.05, 0.03, oz], rot: [Math.PI / 2, 0, 0] }));
      else g.add(part(torus(0.02, 0.0026, 4, 12), MAT.ropeHemp, 'noose-closed-' + si, { pos: [ox + 0.05, 0.16, oz], rot: [Math.PI / 2 + 0.4, 0, 0] }));
    } else if (A.form === 1) {
      // Peg-and-noose ground snare on a run.
      g.add(part(torus(0.05, 0.003, 4, 16), MAT.ropeHemp, 'noose-' + si, { pos: [ox, 0.035, oz], rot: [1.2, 0.3, 0] }));
      for (let k = 0; k < 2; k++) g.add(part(cyl(0.005, 0.007, 0.11, 5), MAT.weatheredTimber, 'guide-peg-' + si + '-' + k, { pos: [ox + (k ? 0.06 : -0.06), 0.04, oz], rot: [0, 0, (k ? 1 : -1) * 0.16] }));
      g.add(part(tube([[ox, 0.03, oz], [ox - 0.1, 0.02, oz - 0.06], [ox - 0.2, 0.015, oz - 0.08]], 0.0026, 4), MAT.ropeHemp, 'anchor-cord-' + si, {}));
      g.add(part(cyl(0.008, 0.011, 0.14, 6), MAT.weatheredTimber, 'anchor-stake-' + si, { pos: [ox - 0.2, 0.05, oz - 0.08], rot: [0.2, 0, 0.1] }));
    } else if (A.form === 2) {
      // Deadfall: propped slab.
      const slab = box(0.24, 0.035, 0.18, 2, 1, 2);
      jitter(slab, 0.008, rand);
      g.add(part(slab, MAT.slateDry, 'deadfall-slab-' + si, { pos: [ox, A.sprung ? 0.018 : 0.14, oz], rot: A.sprung ? [0, 0.2, 0.03] : [0, 0.2, 0.5] }));
      if (!A.sprung) {
        g.add(part(cyl(0.006, 0.008, 0.17, 5), MAT.weatheredTimber, 'prop-stick-' + si, { pos: [ox - 0.08, 0.085, oz], rot: [0, 0, 0.18] }));
        g.add(part(cyl(0.005, 0.006, 0.09, 5), MAT.weatheredTimber, 'trigger-stick-' + si, { pos: [ox - 0.03, 0.045, oz + 0.03], rot: [0.4, 0.3, 1.2] }));
      }
    } else {
      // Basket fish trap.
      const L = 0.3, R = 0.09;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * T;
        g.add(part(tube([[ox + Math.cos(a) * R, R + Math.sin(a) * R * 0.7, oz - L / 2], [ox + Math.cos(a) * R * 1.1, R + Math.sin(a) * R * 0.8, oz], [ox + Math.cos(a) * R * 0.5, R + Math.sin(a) * R * 0.35, oz + L / 2]], 0.0035, 4), MAT.reedPale, 'trap-rib-' + si + '-' + i, {}));
      }
      for (let k = 0; k < 4; k++) g.add(part(torus(R * (1.05 - k * 0.12), 0.0035, 4, 16), MAT.reedPale, 'trap-hoop-' + si + '-' + k, { pos: [ox, R, oz - L / 2 + (L / 3) * k], rot: [0, 0, 0] }));
      g.add(part(lathe([[R * 0.9, 0], [R * 0.4, R * 0.5], [R * 0.3, R * 0.6]], 12), MAT.reedPale, 'trap-funnel-' + si, { pos: [ox, R, oz - L / 2], rot: [Math.PI / 2, 0, 0] }));
    }
    for (let k = 0; k < A.stakes; k++) {
      const a = rand() * T;
      g.add(part(cyl(0.005, 0.007, 0.09, 5), MAT.weatheredTimber, 'marker-stake-' + si + '-' + k, { pos: [ox + Math.cos(a) * 0.16, 0.04, oz + Math.sin(a) * 0.16], rot: [0, 0, (rand() - 0.5) * 0.3] }));
    }
    if (A.bait) {
      const bx = ox + 0.02, bz = oz + 0.02;
      if (A.bait === 1) for (let k = 0; k < 4; k++) g.add(part(ico(0.008, 0), MAT.firedClay, 'bait-grain-' + si + '-' + k, { pos: [bx + (rand() - 0.5) * 0.04, 0.008, bz + (rand() - 0.5) * 0.04] }));
      else { g.add(part(ico(0.018, 1), MAT.firedClay, 'bait-lump-' + si, { pos: [bx, 0.016, bz] })); g.add(part(cone(0.006, 0.03, 4), MAT.reedPale, 'bait-sprig-' + si, { pos: [bx + 0.02, 0.014, bz], rot: [1.2, 0.4, 0] })); }
    }
    for (let k = 0; k < A.cord; k++) {
      const a = rand() * T;
      g.add(part(tube([[ox, 0.01, oz], [ox + Math.cos(a) * 0.12, 0.008, oz + Math.sin(a) * 0.12], [ox + Math.cos(a) * 0.26, 0.006, oz + Math.sin(a) * 0.2]], 0.0018, 4), MAT.ropeHemp, 'slack-cord-' + si + '-' + k, {}));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- SIGNAL BEACON */
export const BEACON_AXES = { form: 4, fuel: 3, frame: 3, height: 3, ladder: 2, hood: 2 };
export function signalBeacon(variant = 0) {
  const A = axesOf(variant, BEACON_AXES);
  const rand = rnd(variant * 1123 + 63);
  const g = new THREE.Group();
  const H = 1.6 + A.height * 0.55;
  const R = 0.3 + A.form * 0.045;
  if (A.form === 0) {
    // Iron cresset on a post.
    g.add(part(limb(0.055, 0.075, H, 9, 3), MAT.weatheredTimber, 'beacon-post', { pos: [0, H / 2, 0] }));
    g.add(part(box(0.34, 0.08, 0.34), MAT.slateDry, 'post-base', { pos: [0, 0.04, 0] }));
    const basketR = R * 0.62;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * T;
      g.add(part(tube([[Math.cos(a) * basketR * 0.4, H, Math.sin(a) * basketR * 0.4], [Math.cos(a) * basketR, H + basketR * 0.5, Math.sin(a) * basketR], [Math.cos(a) * basketR * 1.05, H + basketR * 0.9, Math.sin(a) * basketR * 1.05]], 0.008, 5), MAT.pittedIron, 'basket-rib-' + i, {}));
    }
    for (let k = 0; k < 2; k++) g.add(part(torus(basketR * (0.75 + k * 0.3), 0.007, 4, 18), MAT.pittedIron, 'basket-ring-' + k, { pos: [0, H + basketR * (0.35 + k * 0.5), 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(lathe([[basketR * 0.45, 0], [basketR * 0.3, 0.02], [0, 0.026]], 12), MAT.pittedIron, 'basket-floor', { pos: [0, H, 0] }));
  } else if (A.form === 1) {
    // Log pyre.
    const layers = 3 + A.height;
    for (let l = 0; l < layers; l++) {
      const n = 4 + (l % 2);
      const lr = R * (1 - l * 0.1);
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * (lr * 2 / n) * 1.6;
        const geo = cyl(0.038, 0.042, lr * 2, 8, 1);
        jitter(geo, 0.006, rand);
        g.add(part(geo, i % 3 === 0 ? CAMP.splitWood : CAMP.bark, 'pyre-log-' + l + '-' + i, {
          pos: [l % 2 ? off : 0, 0.04 + l * 0.082, l % 2 ? 0 : off],
          rot: [0, l % 2 ? 0 : Math.PI / 2, Math.PI / 2],
        }));
      }
    }
  } else if (A.form === 2) {
    // Braced tripod brazier.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(limb(0.03, 0.045, H, 7, 3), MAT.weatheredTimber, 'tripod-leg-' + i, {
        pos: [Math.cos(a) * R * 0.5, H / 2, Math.sin(a) * R * 0.5],
        rot: [Math.sin(a) * 0.34, 0, -Math.cos(a) * 0.34],
      }));
      g.add(part(box(0.06, 0.03, R * 0.9), MAT.weatheredTimber, 'tripod-tie-' + i, { pos: [Math.cos(a + 1) * R * 0.4, H * 0.3, Math.sin(a + 1) * R * 0.4], rot: [0, -a - 1 + Math.PI / 2, 0] }));
    }
    g.add(part(lathe([[R * 0.7, 0], [R * 0.8, R * 0.28], [R * 0.78, R * 0.36]], 16), MAT.pittedIron, 'brazier-bowl', { pos: [0, H - R * 0.3, 0] }));
    for (let k = 0; k < 3; k++) g.add(part(torus(R * 0.79, 0.008, 4, 18), MAT.pittedIron, 'bowl-band-' + k, { pos: [0, H - R * (0.24 - k * 0.1), 0], rot: [Math.PI / 2, 0, 0] }));
  } else {
    // Stone plinth cresset.
    const ph = H * 0.7;
    for (let k = 0; k < 4; k++) {
      const s = 1 - k * 0.13;
      g.add(part(box(R * 1.5 * s, ph / 4, R * 1.5 * s), k % 2 ? MAT.slateDry : MAT.springStone, 'plinth-course-' + k, { pos: [0, ph / 8 + k * ph / 4, 0], rot: [0, k * 0.06, 0] }));
    }
    g.add(part(lathe([[R * 0.62, 0], [R * 0.7, R * 0.3], [R * 0.66, R * 0.38]], 14), MAT.pittedIron, 'stone-cresset', { pos: [0, ph, 0] }));
  }
  const fireY = A.form === 0 ? H + R * 0.3 : A.form === 1 ? 0.04 + (3 + A.height) * 0.082 : A.form === 2 ? H - R * 0.1 : H * 0.7 + R * 0.25;
  if (A.fuel > 0) {
    for (let i = 0; i < 6; i++) {
      const a = rand() * T, d = rand() * R * 0.4;
      g.add(part(ico(0.03 + rand() * 0.02, 0), A.fuel === 2 ? CAMP.emberHot : CAMP.charcoal, 'coal-' + i, { pos: [Math.cos(a) * d, fireY + 0.02, Math.sin(a) * d] }));
    }
  }
  if (A.fuel === 2) {
    for (let i = 0; i < 6; i++) {
      const fh = 0.2 + rand() * 0.3;
      const a = rand() * T, d = rand() * R * 0.3;
      g.add(part(cone(0.06 - i * 0.006, fh, 5), CAMP.flame, 'flame-' + i, { pos: [Math.cos(a) * d, fireY + fh / 2, Math.sin(a) * d], rot: [(rand() - 0.5) * 0.2, rand() * T, (rand() - 0.5) * 0.2] }));
    }
  }
  if (A.frame) {
    for (let i = 0; i < A.frame + 1; i++) {
      const a = (i / (A.frame + 1)) * T;
      g.add(part(limb(0.02, 0.03, H * 0.55, 6, 2), MAT.weatheredTimber, 'stay-' + i, {
        pos: [Math.cos(a) * R * 0.85, H * 0.28, Math.sin(a) * R * 0.85],
        rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5],
      }));
    }
  }
  if (A.ladder) {
    const lx = R * 1.1;
    [-1, 1].forEach((s, i) => g.add(part(cyl(0.012, 0.014, H * 0.95, 6), MAT.weatheredTimber, 'ladder-rail-' + i, { pos: [lx + s * 0.08, H * 0.47, R * 0.5], rot: [-0.18, 0, 0] })));
    for (let k = 0; k < 6; k++) g.add(part(cyl(0.008, 0.008, 0.17, 5), MAT.weatheredTimber, 'ladder-rung-' + k, { pos: [lx, H * (0.12 + k * 0.14), R * 0.5 + H * 0.03 - k * 0.02], rot: [0, 0, Math.PI / 2] }));
  }
  if (A.hood) {
    g.add(part(lathe([[R * 0.9, 0], [R * 0.6, R * 0.3], [R * 0.2, R * 0.45], [0, R * 0.5]], 14), MAT.pittedIron, 'smoke-hood', { pos: [0, fireY + R * 0.55, 0] }));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(cyl(0.008, 0.008, R * 0.6, 5), MAT.pittedIron, 'hood-stay-' + i, { pos: [Math.cos(a) * R * 0.6, fireY + R * 0.3, Math.sin(a) * R * 0.6] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------------ ROPE COIL */
export const ROPE_AXES = { coils: 4, form: 3, hook: 3, pile: 3, pulley: 2, count: 2 };
export function ropeCoil(variant = 0) {
  const A = axesOf(variant, ROPE_AXES);
  const rand = rnd(variant * 461 + 69);
  const g = new THREE.Group();
  const n = 1 + A.count;
  for (let ci = 0; ci < n; ci++) {
    const ox = ci * 0.3;
    const R = 0.12 + A.coils * 0.02;
    const thick = 0.014 + A.form * 0.004;
    const loops = 3 + A.coils;
    if (A.form === 0) {
      // Flat coil on the ground.
      for (let i = 0; i < loops; i++) {
        const r = R * (1 - i * (0.7 / loops));
        g.add(part(torus(r, thick * 0.5, 5, 22), MAT.ropeHemp, 'coil-' + ci + '-' + i, { pos: [ox + (rand() - 0.5) * 0.01, thick * 0.5 + i * thick * 0.55, (rand() - 0.5) * 0.01], rot: [Math.PI / 2, 0, rand() * T] }));
      }
    } else if (A.form === 1) {
      // Hank hung from a hook or peg.
      const hy = 0.55;
      for (let i = 0; i < loops; i++) {
        const w = R * (0.55 + i * 0.04);
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          const a = t * Math.PI * 2;
          pts.push([ox + Math.sin(a) * w * 0.35 + (i - loops / 2) * thick * 0.7, hy - (1 - Math.cos(a)) * 0.5 * (R * 1.6), Math.cos(a) * w * 0.16]);
        }
        g.add(part(tube(pts, thick * 0.45, 5), MAT.ropeHemp, 'hank-' + ci + '-' + i, {}));
      }
      for (let k = 0; k < 2; k++) g.add(part(torus(loops * thick * 0.45, thick * 0.4, 4, 14), MAT.ropeHemp, 'hank-whipping-' + ci + '-' + k, { pos: [ox, hy - R * (0.5 + k * 0.9), 0], rot: [0, Math.PI / 2, 0] }));
      g.add(part(cyl(0.014, 0.016, 0.1, 7), MAT.weatheredTimber, 'wall-peg-' + ci, { pos: [ox, hy + 0.02, -0.04], rot: [1.4, 0, 0] }));
    } else {
      // Cheese coil — vertical stacked cone.
      for (let i = 0; i < loops * 2; i++) {
        const t = i / (loops * 2);
        const r = R * (1 - t * 0.55);
        g.add(part(torus(r, thick * 0.5, 5, 20), MAT.ropeHemp, 'stack-coil-' + ci + '-' + i, { pos: [ox, thick * 0.5 + i * thick * 0.85, 0], rot: [Math.PI / 2, 0, t * 3] }));
      }
    }
    if (A.hook) {
      const hy = A.form === 1 ? 0.1 : R * 0.4;
      if (A.hook === 1) {
        g.add(part(torus(0.028, 0.006, 4, 12, Math.PI * 1.6), MAT.pittedIron, 'hook-' + ci, { pos: [ox + R * 0.9, hy, 0], rot: [Math.PI / 2, 0, 0.4] }));
        g.add(part(torus(0.016, 0.004, 3, 10), MAT.pittedIron, 'hook-eye-' + ci, { pos: [ox + R * 0.9, hy + 0.04, 0], rot: [Math.PI / 2, 0, 0] }));
      } else if (A.hook === 2) {
        g.add(part(box(0.04, 0.05, 0.012), MAT.pittedIron, 'shackle-plate-' + ci, { pos: [ox + R * 0.95, hy, 0] }));
        g.add(part(torus(0.018, 0.005, 4, 12), MAT.pittedIron, 'shackle-ring-' + ci, { pos: [ox + R * 0.95, hy + 0.04, 0], rot: [Math.PI / 2, 0, 0] }));
        g.add(part(cyl(0.005, 0.005, 0.04, 6), MAT.warmBrass, 'shackle-pin-' + ci, { pos: [ox + R * 0.95, hy, 0], rot: [Math.PI / 2, 0, 0] }));
      }
    }
    for (let p = 0; p < A.pile; p++) {
      const a = rand() * T;
      const d = R * (1.2 + rand() * 0.8);
      g.add(part(tube([
        [ox + Math.cos(a) * R * 0.9, thick * 0.5, Math.sin(a) * R * 0.9],
        [ox + Math.cos(a) * d, thick * 0.6, Math.sin(a) * d + 0.05],
        [ox + Math.cos(a + 0.7) * d * 1.3, thick * 0.5, Math.sin(a + 0.7) * d * 1.2],
      ], thick * 0.45, 5), MAT.ropeHemp, 'loose-end-' + ci + '-' + p, {}));
      g.add(part(cyl(thick * 0.5, thick * 0.6, thick * 1.2, 7), MAT.blackIron, 'whipped-end-' + ci + '-' + p, { pos: [ox + Math.cos(a + 0.7) * d * 1.3, thick * 0.5, Math.sin(a + 0.7) * d * 1.2], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  if (A.pulley) {
    const px = n * 0.3;
    g.add(part(lathe([[0.02, 0], [0.038, 0.006], [0.038, 0.02], [0.02, 0.026]], 14), MAT.darkOak, 'pulley-sheave', { pos: [px, 0.09, 0], rot: [Math.PI / 2, 0, 0] }));
    [-1, 1].forEach((s, i) => g.add(part(box(0.012, 0.11, 0.006), MAT.pittedIron, 'pulley-cheek-' + i, { pos: [px + s * 0.026, 0.09, 0], rot: [0, 0, 0] })));
    g.add(part(torus(0.016, 0.005, 4, 12), MAT.pittedIron, 'pulley-becket', { pos: [px, 0.155, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(0.005, 0.005, 0.06, 6), MAT.warmBrass, 'pulley-axle', { pos: [px, 0.09, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------------- WASHLINE */
export const WASHLINE_AXES = { span: 4, garments: 4, form: 3, sag: 3, prop: 2, basket: 2 };
export function washLine(variant = 0) {
  const A = axesOf(variant, WASHLINE_AXES);
  const rand = rnd(variant * 653 + 75);
  const g = new THREE.Group();
  const span = 1.6 + A.span * 0.7;
  const H = 1.6;
  const sag = 0.08 + A.sag * 0.07;
  [-1, 1].forEach((s, i) => {
    if (A.form === 2) {
      g.add(part(box(0.09, H, 0.4), MAT.slateDry, 'wall-' + i, { pos: [s * span / 2, H / 2, 0] }));
      g.add(part(cyl(0.008, 0.008, 0.06, 6), MAT.pittedIron, 'wall-eye-' + i, { pos: [s * (span / 2 - 0.05), H * 0.9, 0], rot: [0, 0, Math.PI / 2] }));
    } else {
      g.add(part(limb(0.03, 0.042, H, 7, 3), MAT.weatheredTimber, 'post-' + i, { pos: [s * span / 2, H / 2, 0], rot: [0, 0, s * 0.04] }));
      g.add(part(lathe([[0.08, 0], [0.06, 0.04], [0, 0.05]], 9), MAT.slateDry, 'post-base-' + i, { pos: [s * span / 2, 0, 0] }));
      if (A.form === 1) {
        g.add(part(cyl(0.014, 0.014, 0.3, 6), MAT.weatheredTimber, 'crossarm-' + i, { pos: [s * span / 2, H * 0.94, 0], rot: [Math.PI / 2, 0, 0] }));
        for (let k = 0; k < 2; k++) g.add(part(torus(0.01, 0.0026, 3, 9), MAT.pittedIron, 'arm-eye-' + i + '-' + k, { pos: [s * span / 2, H * 0.94, (k ? 1 : -1) * 0.14], rot: [Math.PI / 2, 0, 0] }));
      }
    }
  });
  const lines = A.form === 1 ? 2 : 1;
  for (let li = 0; li < lines; li++) {
    const z = lines === 1 ? 0 : (li ? 0.14 : -0.14);
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push([-span / 2 + t * span, H * (A.form === 2 ? 0.9 : 0.94) - Math.sin(t * Math.PI) * sag, z]);
    }
    g.add(part(tube(pts, 0.004, 5), MAT.ropeHemp, 'line-' + li, {}));
    const n = 2 + A.garments;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.6) / (n + 0.2);
      const x = -span / 2 + t * span;
      const y = H * (A.form === 2 ? 0.9 : 0.94) - Math.sin(t * Math.PI) * sag;
      const kind = (i + li) % 4;
      const gw = 0.16 + rand() * 0.1;
      const gl = 0.24 + rand() * 0.16;
      if (kind === 0) {
        // Shirt: body + two sleeves.
        const body = box(gw, gl, 0.006, 3, 5, 1);
        const p = body.attributes.position;
        for (let v = 0; v < p.count; v++) { const ty = (p.getY(v) + gl / 2) / gl; p.setZ(v, p.getZ(v) + Math.sin(p.getX(v) * 26) * 0.008 * (1 - ty * 0.4)); }
        p.needsUpdate = true; body.computeVertexNormals();
        g.add(part(body, MAT.boneLinen, 'shirt-' + li + '-' + i, { pos: [x, y - gl / 2 - 0.006, z], rot: [0, (rand() - 0.5) * 0.3, 0] }));
        [-1, 1].forEach((s, k) => g.add(part(box(gw * 0.4, 0.055, 0.005), MAT.boneLinen, 'sleeve-' + li + '-' + i + '-' + k, { pos: [x + s * gw * 0.62, y - gl * 0.28, z], rot: [0, 0, s * -0.5] })));
      } else if (kind === 1) {
        const sheet = box(gw * 1.6, gl * 1.15, 0.005, 5, 6, 1);
        const p = sheet.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const tx = p.getX(v) / (gw * 1.6);
          p.setZ(v, p.getZ(v) + Math.sin(tx * 14) * 0.012);
          p.setY(v, p.getY(v) - Math.abs(tx) * gl * 0.1);
        }
        p.needsUpdate = true; sheet.computeVertexNormals();
        g.add(part(sheet, MAT.canvasBone, 'sheet-' + li + '-' + i, { pos: [x, y - gl * 0.58 - 0.006, z] }));
      } else if (kind === 2) {
        g.add(part(box(gw * 0.7, gl * 0.55, 0.005, 3, 3, 1), CAMP.blanketPale, 'cloth-' + li + '-' + i, { pos: [x, y - gl * 0.28 - 0.006, z], rot: [0, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.14] }));
      } else {
        // Trousers: two legs from a waist.
        g.add(part(box(gw * 0.8, gl * 0.2, 0.006), CAMP.canvasDark, 'waist-' + li + '-' + i, { pos: [x, y - gl * 0.1 - 0.006, z] }));
        [-1, 1].forEach((s, k) => g.add(part(box(gw * 0.34, gl * 0.6, 0.006, 1, 4, 1), CAMP.canvasDark, 'leg-' + li + '-' + i + '-' + k, { pos: [x + s * gw * 0.22, y - gl * 0.5, z], rot: [0, 0, s * 0.05] })));
      }
      for (let k = 0; k < 2; k++) g.add(part(cyl(0.0035, 0.0035, 0.022, 5), MAT.weatheredTimber, 'peg-' + li + '-' + i + '-' + k, { pos: [x + (k ? 1 : -1) * gw * 0.3, y, z], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  if (A.prop) {
    const pl = H * 0.92;
    g.add(part(limb(0.014, 0.02, pl, 6, 2), MAT.weatheredTimber, 'prop-pole', { pos: [span * 0.1, pl / 2, 0.05], rot: [0.1, 0, 0.14] }));
    g.add(part(box(0.03, 0.03, 0.012), MAT.weatheredTimber, 'prop-notch', { pos: [span * 0.1 + 0.06, pl, 0.05] }));
  }
  if (A.basket) {
    const bx = -span * 0.3;
    g.add(part(lathe([[0.11, 0], [0.13, 0.05], [0.14, 0.12], [0.13, 0.13]], 16), MAT.ropeHemp, 'wash-basket', { pos: [bx, 0, -0.1] }));
    for (let k = 0; k < 3; k++) g.add(part(torus(0.135 - k * 0.008, 0.005, 4, 18), MAT.ropeHemp, 'basket-weave-' + k, { pos: [bx, 0.035 + k * 0.035, -0.1], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(ico(0.075, 1), MAT.boneLinen, 'wet-linen-heap', { pos: [bx, 0.13, -0.1] }));
  }
  return seat(g);
}

export const CAMP_GENERATORS = [
  { id: 'camp.tent', name: 'Tent', axes: TENT_AXES, build: tent, domain: 'camp', budgetClass: 'hero' },
  { id: 'camp.bedroll', name: 'Bedroll', axes: BEDROLL_AXES, build: bedroll, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.campfire', name: 'Campfire', axes: CAMPFIRE_AXES, build: campfire, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.cook-tripod', name: 'Cook tripod', axes: TRIPOD_AXES, build: cookTripod, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.pack', name: 'Traveler pack', axes: PACK_AXES, build: travelerPack, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.drying-rack', name: 'Field drying rack', axes: FIELDRACK_AXES, build: fieldDryingRack, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.survey-stand', name: 'Survey stand', axes: SURVEY_AXES, build: surveyStand, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.woodpile', name: 'Woodpile', axes: WOODPILE_AXES, build: woodpile, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.wash-stand', name: 'Wash stand', axes: WASHSTAND_AXES, build: washStand, domain: 'camp', budgetClass: 'standard' },
  { id: 'camp.snare', name: 'Snare and trap set', axes: SNARE_AXES, build: snareSet, domain: 'camp', budgetClass: 'minor' },
  { id: 'camp.beacon', name: 'Signal beacon', axes: BEACON_AXES, build: signalBeacon, domain: 'camp', budgetClass: 'hero' },
  { id: 'camp.rope-coil', name: 'Rope coil and tackle', axes: ROPE_AXES, build: ropeCoil, domain: 'camp', budgetClass: 'minor' },
  { id: 'camp.wash-line', name: 'Wash line', axes: WASHLINE_AXES, build: washLine, domain: 'camp', budgetClass: 'standard' },
];
