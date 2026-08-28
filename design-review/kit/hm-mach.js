/* Machines, transit, furniture and containers — parametric.
 *
 * The `form` axis on each of these changes the BUILD PATH, not a parameter:
 * a pump and a loom share this file and nothing else. That is what makes the
 * axis honest under the counting rule — eight forms is eight silhouettes.
 *
 * Transit is grounded in the Reach's own logistics. worldAssets declares
 * ore_cart_tipped, chain_lift_tower and mire_boat_flat; world.js has a
 * causeway raised over a drowned parish and a broken_cart_narrow on the
 * March. Rail, carts and flat-bottomed boats belong here. Nothing rides.
 */
import { THREE, MAT, rnd, jitter, lean, bow, part, lathe, limb, torus, cone, cyl, ico, seat, thin } from './hm-core.js';
import { STEAM, axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;

/* A toothed wheel. Gears are the single most legible "this is a machine"
   signal and they cost almost nothing. */
function gear(r, teeth, thick, mat, rand, name, g, pos, rot) {
  g.add(part(lathe([[r * 0.16, 0], [r * 0.9, thick * 0.2], [r * 0.92, thick * 0.8], [r * 0.16, thick]], 16), mat, name + '-disc', { pos, rot }));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * T;
    const m = part(box(r * 0.2, r * 0.22, thick * 0.9), mat, name + '-tooth-' + i, { pos, rot });
    m.position.x += Math.cos(a) * r * 0.96 * (rot && Math.abs(rot[2]) > 1 ? 0 : 1);
    m.position.y += Math.sin(a) * r * 0.96;
    if (rot && Math.abs(rot[2]) > 1) m.position.z += Math.cos(a) * r * 0.96;
    m.rotation.z += a;
    g.add(m);
  }
}

/* ---------------------------------------------------------------- MACHINE */
export const MACHINE_AXES = { form: 8, size: 4, drive: 4, instrument: 3, plumbing: 3, state: 3 };
export function machine(variant = 0) {
  const A = axesOf(variant, MACHINE_AXES);
  const rand = rnd(0x9ac + variant * 7919);
  const g = new THREE.Group();
  const forms = ['pump', 'press', 'loom', 'mill', 'crusher', 'boiler', 'lathe', 'winch'];
  const form = forms[A.form];
  g.name = 'machine-' + form;
  const S = [0.8, 1.3, 2.0, 3.0][A.size];
  const frame = [STEAM.sootIron, MAT.darkOak, STEAM.coolIron, MAT.weatheredTimber][A.drive];
  const live = A.state === 2;

  // Every machine sits on a bed. Skipping the bed is what makes procedural
  // machinery look like it is floating.
  g.add(part(jitter(box(S * 1.2, S * 0.14, S * 0.9, 3, 1, 2), S * 0.012, rand), STEAM.sootIron, 'bed-plate', { pos: [0, S * 0.07, 0] }));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    g.add(part(box(S * 0.12, S * 0.14, S * 0.12), STEAM.firebrick, 'foot-' + i, { pos: [sx * S * 0.5, S * 0.07, sz * S * 0.36] }));
  });
  const bedY = S * 0.14;

  if (form === 'pump') {
    g.add(part(lathe([[S * 0.22, 0], [S * 0.24, S * 0.06], [S * 0.2, S * 0.5], [S * 0.24, S * 0.56], [S * 0.18, S * 0.6]], 16), STEAM.copper, 'cylinder', { pos: [0, bedY, 0] }));
    g.add(part(limb(S * 0.05, S * 0.05, S * (live ? 0.5 : 0.28), 10, 1), STEAM.brass, 'piston-rod', { pos: [0, bedY + S * 0.6 + S * (live ? 0.25 : 0.14), 0] }));
    g.add(part(box(S * 0.7, S * 0.09, S * 0.12), frame, 'walking-beam', { pos: [S * 0.1, bedY + S * (live ? 1.1 : 0.9), 0], rot: [0, 0, live ? 0.16 : -0.12] }));
    g.add(part(limb(S * 0.05, S * 0.06, S * 0.55, 8, 1), frame, 'beam-post', { pos: [-S * 0.3, bedY + S * 0.62, 0] }));
  } else if (form === 'press') {
    [-1, 1].forEach((s, i) => g.add(part(box(S * 0.1, S * 1.0, S * 0.1), frame, 'upright-' + i, { pos: [s * S * 0.34, bedY + S * 0.5, 0] })));
    g.add(part(box(S * 0.85, S * 0.12, S * 0.4), frame, 'head', { pos: [0, bedY + S, 0] }));
    g.add(part(limb(S * 0.07, S * 0.07, S * (live ? 0.3 : 0.6), 10, 1), STEAM.brass, 'screw', { pos: [0, bedY + S * (live ? 0.85 : 0.7), 0] }));
    g.add(part(box(S * 0.6, S * 0.1, S * 0.35), STEAM.sootIron, 'platen', { pos: [0, bedY + S * (live ? 0.66 : 0.36), 0] }));
    g.add(part(torus(S * 0.2, S * 0.02, 5, 16), STEAM.brass, 'hand-wheel', { pos: [0, bedY + S * 1.1, 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (form === 'loom') {
    [-1, 1].forEach((s, i) => {
      g.add(part(box(S * 0.09, S * 0.95, S * 0.09), frame, 'post-' + i, { pos: [s * S * 0.45, bedY + S * 0.48, -S * 0.3] }));
      g.add(part(box(S * 0.09, S * 0.7, S * 0.09), frame, 'front-post-' + i, { pos: [s * S * 0.45, bedY + S * 0.35, S * 0.3] }));
    });
    g.add(part(limb(S * 0.06, S * 0.06, S * 0.92, 10, 1), frame, 'warp-beam', { pos: [0, bedY + S * 0.9, -S * 0.3], rot: [0, 0, Math.PI / 2] }));
    g.add(part(limb(S * 0.06, S * 0.06, S * 0.92, 10, 1), frame, 'cloth-beam', { pos: [0, bedY + S * 0.3, S * 0.3], rot: [0, 0, Math.PI / 2] }));
    // Warp threads: the read that says loom rather than frame.
    for (let i = 0; i < 14; i++) {
      g.add(part(box(S * 0.008, S * 0.008, S * 0.66), MAT.canvasBone, 'warp-' + i, { pos: [-S * 0.4 + i * (S * 0.8 / 13), bedY + S * (0.62 - i * 0.002), 0], rot: [0.6, 0, 0] }));
    }
    g.add(part(box(S * 0.86, S * 0.06, S * 0.05), frame, 'beater', { pos: [0, bedY + S * 0.66, S * 0.05], rot: [0.2, 0, 0] }));
  } else if (form === 'mill') {
    g.add(part(lathe([[0, 0], [S * 0.42, S * 0.03], [S * 0.44, S * 0.14], [0, S * 0.16]], 18), MAT.springStone, 'bed-stone', { pos: [0, bedY, 0] }));
    g.add(part(lathe([[S * 0.05, 0], [S * 0.4, S * 0.02], [S * 0.4, S * 0.12], [S * 0.06, S * 0.14]], 18), MAT.springStone, 'runner-stone', { pos: [0, bedY + S * 0.17, 0] }));
    g.add(part(limb(S * 0.05, S * 0.055, S * 0.5, 10, 1), frame, 'spindle', { pos: [0, bedY + S * 0.45, 0] }));
    gear(S * 0.26, 12, S * 0.07, STEAM.brass, rand, 'crown-gear', g, [0, bedY + S * 0.68, 0], [Math.PI / 2, 0, 0]);
    g.add(part(lathe([[S * 0.3, 0], [S * 0.32, S * 0.04], [S * 0.1, S * 0.3], [S * 0.12, S * 0.34]], 12), MAT.weatheredTimber, 'hopper', { pos: [0, bedY + S * 0.36, S * 0.36], rot: [Math.PI, 0, 0] }));
  } else if (form === 'crusher') {
    g.add(part(lathe([[S * 0.42, 0], [S * 0.44, S * 0.1], [S * 0.24, S * 0.5], [S * 0.26, S * 0.56]], 14), STEAM.sootIron, 'hopper', { pos: [0, bedY + S * 0.2, 0], rot: [Math.PI, 0, 0] }));
    [-1, 1].forEach((s, i) => {
      g.add(part(box(S * 0.1, S * 0.4, S * 0.5), STEAM.sootIron, 'jaw-' + i, { pos: [s * S * 0.16, bedY + S * 0.2, 0], rot: [0, 0, s * (live ? 0.2 : 0.06)] }));
    });
    gear(S * 0.3, 14, S * 0.09, STEAM.brass, rand, 'flywheel', g, [S * 0.55, bedY + S * 0.4, 0], [0, 0, 1.5708]);
    g.add(part(limb(S * 0.04, S * 0.04, S * 0.5, 8, 1), STEAM.brass, 'eccentric-rod', { pos: [S * 0.3, bedY + S * 0.35, 0], rot: [0, 0, 1.1] }));
  } else if (form === 'boiler') {
    g.add(part(limb(S * 0.36, S * 0.36, S * 1.0, 16, 1), STEAM.sootIron, 'shell', { pos: [0, bedY + S * 0.36, 0], rot: [0, 0, Math.PI / 2] }));
    for (let i = 0; i < 4; i++) g.add(part(torus(S * 0.37, S * 0.02, 4, 18), STEAM.sootIron, 'band-' + i, { pos: [-S * 0.36 + i * S * 0.24, bedY + S * 0.36, 0], rot: [0, Math.PI / 2, 0] }));
    g.add(part(lathe([[S * 0.34, 0], [S * 0.36, S * 0.04], [S * 0.3, S * 0.1]], 16), STEAM.sootIron, 'end-plate', { pos: [S * 0.5, bedY + S * 0.36, 0], rot: [0, 0, -1.5708] }));
    g.add(part(box(S * 0.3, S * 0.24, S * 0.3), STEAM.hotSlag, 'fire-door', { pos: [-S * 0.55, bedY + S * 0.3, 0] }));
    g.add(part(lathe([[S * 0.1, 0], [S * 0.12, S * 0.04], [S * 0.07, S * 0.3], [S * 0.1, S * 0.34]], 12), STEAM.sootIron, 'stack', { pos: [S * 0.2, bedY + S * 0.7, 0] }));
  } else if (form === 'lathe') {
    g.add(part(box(S * 1.0, S * 0.1, S * 0.24), frame, 'ways', { pos: [0, bedY + S * 0.3, 0] }));
    g.add(part(box(S * 0.2, S * 0.4, S * 0.3), STEAM.sootIron, 'headstock', { pos: [-S * 0.4, bedY + S * 0.4, 0] }));
    g.add(part(box(S * 0.14, S * 0.3, S * 0.26), STEAM.sootIron, 'tailstock', { pos: [S * 0.42, bedY + S * 0.35, 0] }));
    g.add(part(limb(S * 0.04, S * 0.04, S * 0.6, 10, 1), STEAM.brass, 'workpiece', { pos: [0, bedY + S * 0.45, 0], rot: [0, 0, Math.PI / 2] }));
    gear(S * 0.22, 12, S * 0.06, STEAM.brass, rand, 'drive-pulley', g, [-S * 0.55, bedY + S * 0.45, 0], [0, 0, 1.5708]);
    g.add(part(box(S * 0.1, S * 0.16, S * 0.1), STEAM.sootIron, 'tool-post', { pos: [S * 0.05, bedY + S * 0.42, S * 0.2] }));
  } else {
    // Winch.
    [-1, 1].forEach((s, i) => g.add(part(box(S * 0.12, S * 0.6, S * 0.12), frame, 'stand-' + i, { pos: [s * S * 0.4, bedY + S * 0.3, 0] })));
    g.add(part(limb(S * 0.16, S * 0.16, S * 0.76, 14, 1), MAT.darkOak, 'drum', { pos: [0, bedY + S * 0.6, 0], rot: [0, 0, Math.PI / 2] }));
    for (let i = 0; i < 9; i++) g.add(part(torus(S * 0.18, S * 0.012, 4, 14), MAT.ropeHemp, 'rope-turn-' + i, { pos: [-S * 0.3 + i * S * 0.075, bedY + S * 0.6, 0], rot: [0, Math.PI / 2, 0] }));
    gear(S * 0.24, 14, S * 0.07, STEAM.brass, rand, 'ratchet', g, [S * 0.46, bedY + S * 0.6, 0], [0, 0, 1.5708]);
    g.add(part(box(S * 0.06, S * 0.24, S * 0.04), STEAM.sootIron, 'pawl', { pos: [S * 0.46, bedY + S * 0.85, 0], rot: [0, 0, 0.4] }));
    g.add(part(limb(S * 0.035, S * 0.035, S * 0.4, 8, 1), STEAM.sootIron, 'crank', { pos: [-S * 0.5, bedY + S * 0.75, 0], rot: [0, 0, 0.8] }));
  }

  // Instrumentation and plumbing — shared across every form.
  if (A.instrument > 0) {
    for (let i = 0; i < A.instrument; i++) {
      g.add(part(lathe([[0, 0], [S * 0.07, S * 0.008], [S * 0.07, S * 0.03], [0, S * 0.034]], 14), STEAM.brass, 'gauge-' + i, { pos: [-S * 0.4 + i * S * 0.18, bedY + S * 0.72, S * 0.4], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(box(S * 0.05, S * 0.006, S * 0.006), STEAM.copper, 'needle-' + i, { pos: [-S * 0.4 + i * S * 0.18 + S * 0.015, bedY + S * 0.72, S * 0.42], rot: [0, 0, live ? 1.1 : -0.7] }));
    }
  }
  if (A.plumbing > 0) {
    for (let i = 0; i < A.plumbing; i++) {
      g.add(part(limb(S * 0.045, S * 0.045, S * 0.8, 10, 1), STEAM.copper, 'pipe-' + i, { pos: [S * 0.5, bedY + S * (0.3 + i * 0.22), -S * 0.3], rot: [0, 0, Math.PI / 2] }));
      g.add(part(lathe([[S * 0.05, 0], [S * 0.07, S * 0.012], [S * 0.05, S * 0.026]], 12), STEAM.copper, 'union-' + i, { pos: [S * 0.1, bedY + S * (0.3 + i * 0.22), -S * 0.3], rot: [0, 0, Math.PI / 2] }));
    }
    g.add(part(torus(S * 0.09, S * 0.02, 5, 14), STEAM.brass, 'stop-valve', { pos: [S * 0.55, bedY + S * 0.3, -S * 0.3], rot: [0, Math.PI / 2, 0] }));
  }
  if (live) {
    g.add(part(limb(S * 0.1, S * 0.1, S * 0.05, 12, 1), STEAM.hotSlag, 'glow-vent', { pos: [0, bedY + S * 0.02, S * 0.4] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- TRANSIT */
export const TRANSIT_AXES = { form: 6, size: 4, wheels: 4, load: 3, wear: 3, fitting: 3 };
export function transit(variant = 0) {
  const A = axesOf(variant, TRANSIT_AXES);
  const rand = rnd(0x7a5 + variant * 6151);
  const g = new THREE.Group();
  const forms = ['ore-cart', 'hand-barrow', 'dray-wagon', 'flat-boat', 'rail-truck', 'sledge'];
  const form = forms[A.form];
  g.name = 'transit-' + form;
  const S = [0.7, 1.0, 1.4, 2.0][A.size];
  const timber = [MAT.darkOak, MAT.weatheredTimber, STEAM.firebrick][A.wear];
  const iron = A.wear === 2 ? STEAM.verdigris : STEAM.sootIron;
  const wheelR = S * [0.16, 0.22, 0.3, 0.4][A.wheels];

  const bodyW = S * 0.8, bodyL = S * 1.3, bodyH = S * 0.4;

  if (form === 'flat-boat') {
    // A punt: flat bottom, raked ends, ribs inside.
    const hull = box(bodyW, S * 0.22, bodyL * 1.5, 3, 1, 6);
    const p = hull.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = Math.abs(p.getZ(i)) / (bodyL * 0.75);
      p.setX(i, p.getX(i) * (1 - t * t * 0.45));
      p.setY(i, p.getY(i) + (p.getY(i) > 0 ? t * t * S * 0.1 : 0));
    }
    p.needsUpdate = true;
    hull.computeVertexNormals();
    g.add(part(hull, timber, 'hull', { pos: [0, S * 0.11, 0] }));
    for (let i = 0; i < 5; i++) g.add(part(box(bodyW * 0.94, S * 0.05, S * 0.05), timber, 'rib-' + i, { pos: [0, S * 0.2, -bodyL * 0.6 + i * (bodyL * 1.2 / 4)] }));
    [-1, 1].forEach((s, i) => g.add(part(box(S * 0.05, S * 0.16, bodyL * 1.4), timber, 'gunwale-' + i, { pos: [s * bodyW * 0.48, S * 0.28, 0] })));
    if (A.fitting > 0) g.add(part(limb(S * 0.025, S * 0.03, S * 2.2, 7, 2), timber, 'punt-pole', { pos: [bodyW * 0.3, S * 0.4, 0], rot: [0.2, 0, 0.1] }));
    if (A.load > 0) for (let i = 0; i < A.load * 2; i++) g.add(part(jitter(box(S * 0.24, S * 0.2, S * 0.24), 0.01, rand), MAT.canvasBone, 'crate-' + i, { pos: [(rand() - 0.5) * bodyW * 0.5, S * 0.32, (rand() - 0.5) * bodyL] }));
    return seat(g);
  }

  // Wheeled and sledge bodies share a tub.
  const tub = box(bodyW, bodyH, bodyL, 3, 2, 4);
  jitter(tub, S * 0.012, rand);
  g.add(part(tub, form === 'ore-cart' || form === 'rail-truck' ? iron : timber, 'tub', { pos: [0, wheelR + bodyH * 0.55, 0] }));
  for (let i = 0; i < 3; i++) g.add(part(box(bodyW * 1.04, S * 0.045, S * 0.045), iron, 'strap-' + i, { pos: [0, wheelR + bodyH * (0.2 + i * 0.35), 0] }));

  if (form === 'sledge') {
    [-1, 1].forEach((s, i) => {
      const r = box(S * 0.08, S * 0.1, bodyL * 1.2, 1, 1, 4);
      const p = r.attributes.position;
      for (let v = 0; v < p.count; v++) { const t = p.getZ(v) / (bodyL * 0.6); if (t > 0.6) p.setY(v, p.getY(v) + (t - 0.6) * S * 0.3); }
      p.needsUpdate = true;
      r.computeVertexNormals();
      g.add(part(r, timber, 'runner-' + i, { pos: [s * bodyW * 0.42, S * 0.05, 0] }));
    });
  } else {
    const axles = form === 'hand-barrow' ? 1 : 2;
    for (let a = 0; a < axles; a++) {
      const z = axles === 1 ? bodyL * 0.3 : -bodyL * 0.32 + a * bodyL * 0.64;
      [-1, 1].forEach((s, i) => {
        // Spoked wheel: rim, hub, spokes. A disc reads as a toy.
        g.add(part(torus(wheelR, wheelR * 0.11, 5, 16), iron, 'rim-' + a + '-' + i, { pos: [s * bodyW * 0.58, wheelR, z], rot: [0, Math.PI / 2, 0] }));
        g.add(part(limb(wheelR * 0.18, wheelR * 0.2, S * 0.1, 10, 1), timber, 'hub-' + a + '-' + i, { pos: [s * bodyW * 0.58, wheelR, z], rot: [0, 0, Math.PI / 2] }));
        const spokes = 6 + A.wheels;
        for (let k = 0; k < spokes; k++) {
          g.add(part(box(wheelR * 0.09, wheelR * 1.7, wheelR * 0.09), timber, 'spoke-' + a + '-' + i + '-' + k, { pos: [s * bodyW * 0.58, wheelR, z], rot: [0, 0, (k / spokes) * Math.PI] }));
        }
      });
      g.add(part(limb(S * 0.035, S * 0.035, bodyW * 1.24, 8, 1), iron, 'axle-' + a, { pos: [0, wheelR, z], rot: [0, 0, Math.PI / 2] }));
    }
    if (form === 'hand-barrow') {
      [-1, 1].forEach((s, i) => g.add(part(limb(S * 0.028, S * 0.035, bodyL * 1.1, 7, 1), timber, 'handle-' + i, { pos: [s * bodyW * 0.4, wheelR + bodyH * 0.5, -bodyL * 0.65], rot: [0.24, 0, 0] })));
    } else if (form === 'dray-wagon') {
      g.add(part(box(S * 0.07, S * 0.07, bodyL * 0.9), timber, 'shaft-pole', { pos: [0, wheelR * 0.9, bodyL * 0.85] }));
      [-1, 1].forEach((s, i) => g.add(part(box(S * 0.05, S * 0.05, bodyL * 0.7), timber, 'shaft-' + i, { pos: [s * bodyW * 0.22, wheelR * 0.9, bodyL * 0.8], rot: [0, s * 0.06, 0] })));
    } else if (form === 'rail-truck' || form === 'ore-cart') {
      g.add(part(torus(S * 0.06, S * 0.014, 4, 12), iron, 'coupling', { pos: [0, wheelR * 0.8, -bodyL * 0.56], rot: [0, Math.PI / 2, 0] }));
      if (form === 'ore-cart') g.add(part(box(bodyW * 0.9, S * 0.04, S * 0.16), iron, 'tipping-trunnion', { pos: [0, wheelR + bodyH * 0.9, 0] }));
    }
  }
  // Load.
  if (A.load > 0) {
    const lm = [null, MAT.wetSlate, STEAM.firebrick][A.load];
    for (let i = 0; i < A.load * 4; i++) {
      const r = S * (0.05 + rand() * 0.07);
      const b = ico(r, 0);
      jitter(b, r * 0.3, rand);
      g.add(part(b, lm, 'load-' + i, { pos: [(rand() - 0.5) * bodyW * 0.7, wheelR + bodyH * 0.9 + rand() * S * 0.1, (rand() - 0.5) * bodyL * 0.7], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- FURNITURE */
export const FURN_AXES = { form: 10, size: 3, material: 4, wear: 3, dressing: 3 };
export function furniture(variant = 0) {
  const A = axesOf(variant, FURN_AXES);
  const rand = rnd(0xf04 + variant * 4409);
  const g = new THREE.Group();
  const forms = ['table', 'stool', 'chair', 'bench', 'chest', 'shelf', 'bed', 'cabinet', 'lectern', 'trestle'];
  const form = forms[A.form];
  g.name = 'furniture-' + form;
  const S = [0.8, 1.1, 1.5][A.size];
  const wood = [MAT.darkOak, MAT.weatheredTimber, MAT.heartwood, STEAM.firebrick][A.material];
  const iron = A.wear === 2 ? STEAM.verdigris : MAT.pittedIron;

  const legs = (w, d, h, r) => {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const L = box(r, h, r, 1, 2, 1);
      jitter(L, r * 0.1, rand);
      g.add(part(L, wood, 'leg-' + i, { pos: [sx * (w / 2 - r), h / 2, sz * (d / 2 - r)], rot: [0, 0, (i % 2 ? 1 : -1) * 0.012] }));
    });
  };

  if (form === 'table' || form === 'trestle') {
    const w = S * 1.5, d = S * 0.8, h = S * 0.72;
    for (let i = 0; i < 4; i++) {
      const p = box(w, S * 0.05, d / 4 * 0.94, 4, 1, 1);
      bow(p, S * 0.006, 'z');
      jitter(p, 0.005, rand);
      g.add(part(p, wood, 'top-plank-' + i, { pos: [0, h, -d / 2 + (d / 4) * (i + 0.5)] }));
    }
    if (form === 'trestle') {
      [-1, 1].forEach((s, i) => {
        g.add(part(box(S * 0.08, h, S * 0.6), wood, 'trestle-' + i, { pos: [s * w * 0.34, h / 2, 0] }));
        g.add(part(box(S * 0.4, S * 0.07, S * 0.07), wood, 'trestle-foot-' + i, { pos: [s * w * 0.34, S * 0.035, 0], rot: [0, 1.5708, 0] }));
      });
      g.add(part(box(w * 0.8, S * 0.07, S * 0.07), wood, 'stretcher', { pos: [0, h * 0.3, 0] }));
    } else {
      legs(w, d, h, S * 0.07);
      g.add(part(box(w * 0.86, S * 0.06, S * 0.06), wood, 'stretcher', { pos: [0, h * 0.3, 0] }));
    }
  } else if (form === 'stool' || form === 'chair') {
    const h = S * 0.45;
    g.add(part(lathe([[S * 0.2, 0], [S * 0.21, S * 0.03], [S * 0.19, S * 0.05]], 14), wood, 'seat', { pos: [0, h, 0] }));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(limb(S * 0.025, S * 0.035, h, 7, 1), wood, 'leg-' + i, { pos: [Math.cos(a) * S * 0.13, h / 2, Math.sin(a) * S * 0.13], rot: [Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14] }));
    }
    if (form === 'chair') {
      [-1, 1].forEach((s, i) => g.add(part(limb(S * 0.02, S * 0.025, S * 0.5, 6, 1), wood, 'back-post-' + i, { pos: [s * S * 0.14, h + S * 0.25, -S * 0.14], rot: [-0.1, 0, 0] })));
      for (let i = 0; i < 2; i++) g.add(part(box(S * 0.3, S * 0.05, S * 0.02), wood, 'back-slat-' + i, { pos: [0, h + S * (0.2 + i * 0.18), -S * 0.15], rot: [-0.1, 0, 0] }));
    }
  } else if (form === 'bench') {
    const w = S * 1.6, h = S * 0.44;
    g.add(part(jitter(box(w, S * 0.07, S * 0.34, 5, 1, 1), 0.006, rand), wood, 'seat', { pos: [0, h, 0] }));
    [-1, 1].forEach((s, i) => g.add(part(box(S * 0.1, h, S * 0.3), wood, 'end-slab-' + i, { pos: [s * w * 0.4, h / 2, 0] })));
    g.add(part(box(w * 0.8, S * 0.06, S * 0.05), wood, 'stretcher', { pos: [0, h * 0.4, 0] }));
  } else if (form === 'chest' || form === 'cabinet') {
    const w = S * 0.9, d = S * 0.5, h = form === 'cabinet' ? S * 1.3 : S * 0.5;
    g.add(part(jitter(box(w, h, d, 3, 2, 2), 0.006, rand), wood, 'carcass', { pos: [0, h / 2, 0] }));
    if (form === 'chest') {
      g.add(part(lathe([[0, 0], [d * 0.5, 0], [d * 0.5, 0.001]], 4), wood, 'lid-seam'));
      g.add(part(box(w * 1.02, S * 0.06, d * 1.02), wood, 'lid', { pos: [0, h + S * 0.03, 0] }));
      for (let i = 0; i < 3; i++) g.add(part(box(w * 1.04, S * 0.04, S * 0.03), iron, 'band-' + i, { pos: [0, h * (0.2 + i * 0.35), d / 2 + 0.005] }));
      g.add(part(box(S * 0.1, S * 0.14, S * 0.03), iron, 'hasp', { pos: [0, h * 0.9, d / 2 + 0.01] }));
    } else {
      for (let i = 0; i < 2; i++) g.add(part(box(w * 0.46, h * 0.44, S * 0.02), wood, 'door-' + i, { pos: [(i ? 1 : -1) * w * 0.24, h * 0.7, d / 2 + 0.012] }));
      g.add(part(torus(S * 0.03, S * 0.008, 4, 10), iron, 'pull', { pos: [w * 0.05, h * 0.7, d / 2 + 0.03], rot: [0.4, 0, 0] }));
    }
  } else if (form === 'shelf') {
    const w = S * 1.1, h = S * 1.6, d = S * 0.34;
    [-1, 1].forEach((s, i) => g.add(part(box(S * 0.07, h, d), wood, 'upright-' + i, { pos: [s * w / 2, h / 2, 0] })));
    for (let i = 0; i < 4; i++) g.add(part(jitter(box(w, S * 0.045, d, 3, 1, 1), 0.005, rand), wood, 'shelf-' + i, { pos: [0, h * (0.18 + i * 0.26), 0] }));
  } else if (form === 'bed') {
    const w = S * 0.95, l = S * 1.9, h = S * 0.4;
    legs(w, l, h, S * 0.07);
    g.add(part(box(w, S * 0.06, l), wood, 'frame', { pos: [0, h, 0] }));
    for (let i = 0; i < 5; i++) g.add(part(box(w * 0.94, S * 0.03, l / 6), MAT.canvasBone, 'straw-tick-' + i, { pos: [0, h + S * 0.06, -l / 2 + (l / 5) * (i + 0.5)] }));
    g.add(part(box(w, S * 0.5, S * 0.05), wood, 'headboard', { pos: [0, h + S * 0.25, -l / 2] }));
  } else {
    // Lectern: a sloped desk on a pillar — the abbey reads from these.
    g.add(part(lathe([[S * 0.28, 0], [S * 0.3, S * 0.05], [S * 0.09, S * 0.12], [S * 0.07, S * 0.9]], 14), wood, 'pillar', { pos: [0, 0, 0] }));
    g.add(part(box(S * 0.55, S * 0.05, S * 0.42, 2, 1, 2), wood, 'desk', { pos: [0, S * 0.95, 0], rot: [-0.42, 0, 0] }));
    g.add(part(box(S * 0.55, S * 0.05, S * 0.05), wood, 'book-stop', { pos: [0, S * 0.86, S * 0.18] }));
  }
  // Dressing.
  if (A.dressing > 0) {
    const top = form === 'shelf' ? S * 1.2 : form === 'cabinet' ? S * 1.35 : form === 'lectern' ? S * 1.0 : S * 0.78;
    if (A.dressing >= 1) for (let i = 0; i < 3; i++) g.add(part(box(S * 0.12, S * 0.16, S * 0.02), MAT.firedClay, 'tablet-' + i, { pos: [(rand() - 0.5) * S * 0.7, top + S * 0.08, (rand() - 0.5) * S * 0.2], rot: [1.4, (rand() - 0.5) * 0.5, 0] }));
    if (A.dressing >= 2) {
      g.add(part(lathe([[S * 0.03, 0], [S * 0.05, S * 0.02], [S * 0.04, S * 0.1], [S * 0.06, S * 0.12]], 12), MAT.pittedIron, 'candle-stick', { pos: [S * 0.35, top, -S * 0.1] }));
      g.add(part(ico(S * 0.018, 0), MAT.ember, 'flame', { pos: [S * 0.35, top + S * 0.16, -S * 0.1] }));
    }
  }
  if (A.wear === 2) for (let i = 0; i < 4; i++) g.add(part(ico(S * 0.03, 0), MAT.graveMoss, 'rot-' + i, { pos: [(rand() - 0.5) * S, rand() * S * 0.3, (rand() - 0.5) * S * 0.5] }));
  return seat(g);
}

/* -------------------------------------------------------------- CONTAINER */
export const CONT_AXES = { form: 6, size: 4, material: 3, state: 3, contents: 4, band: 3 };
export function container(variant = 0) {
  const A = axesOf(variant, CONT_AXES);
  const rand = rnd(0xc04 + variant * 3313);
  const g = new THREE.Group();
  const forms = ['barrel', 'crate', 'sack', 'urn', 'basket', 'strongbox'];
  const form = forms[A.form];
  g.name = 'container-' + form;
  const S = [0.4, 0.6, 0.9, 1.3][A.size];
  const body = [MAT.weatheredTimber, MAT.firedClay, MAT.canvasBone][A.material];
  const band = [MAT.pittedIron, STEAM.brass, STEAM.verdigris][A.band];
  const open = A.state >= 1;

  if (form === 'barrel') {
    const staves = 12;
    for (let i = 0; i < staves; i++) {
      const a = (i / staves) * T;
      const st = box(S * 0.28, S, S * 0.1, 1, 4, 1);
      bow(st, S * 0.07, 'z');
      jitter(st, S * 0.008, rand);
      g.add(part(st, body, 'stave-' + i, { pos: [Math.cos(a) * S * 0.42, S * 0.5, Math.sin(a) * S * 0.42], rot: [0, -a + 1.5708, 0] }));
    }
    [0.12, 0.5, 0.88].forEach((t, i) => g.add(part(torus(S * (t === 0.5 ? 0.5 : 0.44), S * 0.03, 5, 16), band, 'hoop-' + i, { pos: [0, S * t, 0], rot: [Math.PI / 2, 0, 0] })));
    if (!open) g.add(part(limb(S * 0.4, S * 0.4, S * 0.04, 16, 1), body, 'lid', { pos: [0, S * 0.99, 0] }));
  } else if (form === 'crate') {
    for (let f = 0; f < (open ? 5 : 6); f++) {
      const dims = [[S, S * 0.04, S * 0.8], [S, S * 0.04, S * 0.8], [S * 0.04, S * 0.7, S * 0.8], [S * 0.04, S * 0.7, S * 0.8], [S, S * 0.7, S * 0.04], [S, S * 0.7, S * 0.04]][f];
      const pos = [[0, 0.02, 0], [0, S * 0.68, 0], [-S * 0.48, S * 0.35, 0], [S * 0.48, S * 0.35, 0], [0, S * 0.35, -S * 0.38], [0, S * 0.35, S * 0.38]][f];
      // Slatted, not solid — a crate reads by its gaps.
      const slats = f < 2 ? 4 : 3;
      for (let s = 0; s < slats; s++) {
        const sd = [...dims];
        if (f < 2) sd[2] = (S * 0.8) / slats * 0.86; else if (f < 4) sd[1] = (S * 0.7) / slats * 0.86; else sd[1] = (S * 0.7) / slats * 0.86;
        const sp = [...pos];
        if (f < 2) sp[2] = -S * 0.4 + ((S * 0.8) / slats) * (s + 0.5); else sp[1] = pos[1] - S * 0.3 + ((S * 0.7) / slats) * (s + 0.5);
        g.add(part(jitter(box(sd[0], sd[1], sd[2]), S * 0.006, rand), body, 'slat-' + f + '-' + s, { pos: sp }));
      }
    }
    for (let i = 0; i < 4; i++) g.add(part(box(S * 0.05, S * 0.72, S * 0.05), band, 'corner-' + i, { pos: [(i % 2 ? 1 : -1) * S * 0.47, S * 0.35, (i < 2 ? 1 : -1) * S * 0.37] }));
  } else if (form === 'sack') {
    const s1 = ico(S * 0.36, 1);
    s1.scale(1, 1.4, 0.9);
    jitter(s1, S * 0.06, rand);
    g.add(part(s1, MAT.canvasBone, 'sack-body', { pos: [0, S * 0.5, 0] }));
    g.add(part(lathe([[S * 0.16, 0], [S * 0.1, S * 0.08], [S * 0.14, S * 0.16]], 12), MAT.canvasBone, 'neck', { pos: [0, S * 0.95, 0] }));
    g.add(part(torus(S * 0.1, S * 0.018, 4, 12), MAT.ropeHemp, 'tie', { pos: [0, S * 1.02, 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (form === 'urn') {
    g.add(part(lathe([[S * 0.14, 0], [S * 0.3, S * 0.12], [S * 0.38, S * 0.42], [S * 0.3, S * 0.72], [S * 0.2, S * 0.86], [S * 0.24, S * 0.92], [open ? S * 0.2 : 0, S * 0.94]], 20), MAT.firedClay, 'urn-body'));
    if (!open) g.add(part(lathe([[S * 0.22, 0], [S * 0.24, S * 0.03], [S * 0.1, S * 0.1], [0, S * 0.12]], 14), MAT.firedClay, 'urn-lid', { pos: [0, S * 0.94, 0] }));
    for (let i = 0; i < A.band; i++) g.add(part(torus(S * 0.33, S * 0.014, 4, 20), band, 'urn-band-' + i, { pos: [0, S * (0.3 + i * 0.2), 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (form === 'basket') {
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const t = r / rows;
      const rad = S * (0.24 + t * 0.16);
      g.add(part(torus(rad, S * 0.018, 4, 14), MAT.reedPale, 'weave-' + r, { pos: [0, S * (0.05 + t * 0.7), 0], rot: [Math.PI / 2, 0, 0] }));
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * T;
      g.add(part(box(S * 0.02, S * 0.78, S * 0.02), MAT.reedPale, 'stake-' + i, { pos: [Math.cos(a) * S * 0.34, S * 0.4, Math.sin(a) * S * 0.34], rot: [Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16] }));
    }
  } else {
    g.add(part(jitter(box(S * 0.9, S * 0.5, S * 0.6, 3, 2, 2), S * 0.006, rand), STEAM.sootIron, 'box-body', { pos: [0, S * 0.25, 0] }));
    g.add(part(lathe([[S * 0.45, 0], [S * 0.45, S * 0.001]], 4), STEAM.sootIron, 'seam'));
    g.add(part(box(S * 0.92, S * 0.08, S * 0.62), STEAM.sootIron, 'lid', { pos: [0, S * (open ? 0.62 : 0.54), open ? -S * 0.2 : 0], rot: [open ? -0.9 : 0, 0, 0] }));
    for (let i = 0; i < 3; i++) g.add(part(box(S * 0.94, S * 0.05, S * 0.04), band, 'strap-' + i, { pos: [-S * 0.3 + i * S * 0.3, S * 0.25, S * 0.31] }));
    g.add(part(box(S * 0.14, S * 0.16, S * 0.05), band, 'lock', { pos: [0, S * 0.4, S * 0.32] }));
  }
  // Contents, only if open.
  if (open && A.contents > 0) {
    const cm = [null, MAT.wetSlate, MAT.reedPale, MAT.bellBronze][A.contents];
    for (let i = 0; i < A.contents * 3; i++) {
      const r = S * (0.05 + rand() * 0.06);
      g.add(part(jitter(ico(r, 0), r * 0.3, rand), cm, 'contents-' + i, { pos: [(rand() - 0.5) * S * 0.4, S * (0.7 + rand() * 0.12), (rand() - 0.5) * S * 0.4], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  if (A.state === 2) {
    // Broken: staves sprung, contents spilled.
    for (let i = 0; i < 4; i++) g.add(part(jitter(box(S * 0.22, S * 0.7, S * 0.08), S * 0.01, rand), body, 'sprung-' + i, { pos: [(rand() - 0.5) * S * 1.4, S * 0.05, (rand() - 0.5) * S * 1.4], rot: [1.5, rand() * T, rand() * 0.5] }));
  }
  return seat(g);
}

export const MACH_GENERATORS = [
  { id: 'mach.machine', name: 'Machine', axes: MACHINE_AXES, build: machine, domain: 'dungeon', budgetClass: 'hero' },
  { id: 'mach.transit', name: 'Transit', axes: TRANSIT_AXES, build: transit, domain: 'world', budgetClass: 'standard' },
  { id: 'mach.furniture', name: 'Furniture', axes: FURN_AXES, build: furniture, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'mach.container', name: 'Container', axes: CONT_AXES, build: container, domain: 'items', budgetClass: 'minor' },
];
