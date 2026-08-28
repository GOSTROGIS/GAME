/* Settled landscape — boundaries, water, burial, apiary, crops.
 *
 * The five things a worked countryside cannot do without, and the five this
 * kit was still missing. Without a field boundary the land has no ownership;
 * without a well a settlement has no reason to be where it is; without graves
 * it has no past; without hives and crops the fields are just green terrain.
 *
 * Each is a repeating unit rather than a one-off: a fence is a run of bays, a
 * crop stand is a patch that tiles, so a field is built by instancing one
 * generator along a spline rather than by authoring a field.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat, sg, cnt, setLod, getLod } from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
/* LOD-aware tube. Stems are tubes and there are hundreds of them, so the
   radial and tubular segment counts have to answer to the LOD level or a
   distant crop patch costs the same as a near one. */
const tube = (pts, r, rad = 6) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))),
    Math.max(3, sg(Math.max(6, pts.length * 3))), r, Math.max(3, sg(rad)), false,
  );

const M = (name, color, rough, metal = 0, extra) => {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: rough, metalness: metal }, extra || {}));
  m.name = name;
  return m;
};
export const LAND = {
  rail: M('split-rail', '#4a3f30', 0.9, 0.01),
  railPale: M('split-rail-weathered', '#6b5b46', 0.92, 0.01),
  wattle: M('wattle-withy', '#5c4a33', 0.93, 0.0),
  straw: M('straw-skep', '#8a7c52', 0.95, 0.0),
  grain: M('ripe-grain', '#8a7a4a', 0.92, 0.0),
  grainGreen: M('green-grain', '#54603c', 0.9, 0.0),
  leafCrop: M('crop-leaf', '#3f5138', 0.88, 0.0, { side: THREE.DoubleSide }),
  soil: M('turned-soil', '#33291f', 0.97, 0.0),
  flax: M('flax-stem', '#6d7358', 0.9, 0.0),
  hide: M('cured-hide', '#4b3a2b', 0.92, 0.01),
};

/* ---------------------------------------------------------------- FIELD FENCE */
export const FENCE_AXES = { form: 5, length: 4, gate: 3, lean: 3, repair: 2, cap: 2 };
export function fieldFence(variant = 0) {
  const A = axesOf(variant, FENCE_AXES);
  const rand = rnd(variant * 1063 + 3);
  const g = new THREE.Group();
  const bays = 2 + A.length;
  const bayW = 1.35;
  const H = 1.0 + (A.form === 3 ? 0.15 : 0);
  const span = bays * bayW;
  const x0 = -span / 2;
  const gateBay = A.gate ? Math.floor(bays / 2) : -1;

  if (A.form === 2) {
    // Drystone wall: coursed rubble, battered inward, with a coping course.
    const courses = 5;
    for (let c = 0; c < courses; c++) {
      const cy = 0.09 + c * 0.16;
      const batter = 1 - c * 0.1;
      const n = Math.floor(span / (0.28 - c * 0.015));
      for (let i = 0; i < n; i++) {
        const x = x0 + (span / n) * (i + 0.5) + (c % 2 ? span / n * 0.35 : 0);
        if (x > span / 2 + x0 * -1) continue;
        if (gateBay >= 0 && Math.abs(x - (x0 + bayW * (gateBay + 0.5))) < bayW * 0.4) continue;
        const sw = (span / n) * 0.92, sh = 0.15, sd = 0.42 * batter;
        const s = box(sw, sh, sd, 1, 1, 1);
        jitter(s, sh * 0.22, rand);
        g.add(part(s, i % 3 === 0 ? MAT.wetSlate : MAT.slateDry, 'stone-' + c + '-' + i, {
          pos: [x, cy, (rand() - 0.5) * 0.03], rot: [(rand() - 0.5) * 0.05, (rand() - 0.5) * 0.14, (rand() - 0.5) * 0.05],
        }));
      }
    }
    if (A.cap) for (let i = 0; i < Math.floor(span / 0.22); i++) {
      const x = x0 + 0.11 + i * 0.22;
      if (gateBay >= 0 && Math.abs(x - (x0 + bayW * (gateBay + 0.5))) < bayW * 0.4) continue;
      const cs = box(0.2, 0.24, 0.3);
      jitter(cs, 0.03, rand);
      g.add(part(cs, MAT.springStone, 'coping-' + i, { pos: [x, 0.98, 0], rot: [0, 0, 0.42 + (rand() - 0.5) * 0.2] }));
    }
  } else {
    // Post-set fences: post-and-rail, hurdle, zigzag, wattle.
    const zig = A.form === 3;
    for (let i = 0; i <= bays; i++) {
      const px = x0 + i * bayW;
      const pz = zig ? (i % 2 ? 0.28 : -0.28) : 0;
      const tilt = (rand() - 0.5) * 0.04 * A.lean;
      const postGeo = A.form === 4 ? limb(0.035, 0.05, H * 0.92, 6, 3) : box(0.085, H, 0.085, 1, 3, 1);
      jitter(postGeo, 0.005, rand);
      g.add(part(postGeo, i % 3 === 0 ? LAND.railPale : LAND.rail, 'post-' + i, { pos: [px, (A.form === 4 ? H * 0.46 : H / 2), pz], rot: [tilt * 0.6, rand() * 0.2, tilt] }));
      if (A.cap && A.form !== 4) g.add(part(cone(0.06, 0.07, 4), LAND.rail, 'post-cap-' + i, { pos: [px, H + 0.035, pz] }));
      g.add(part(lathe([[0.1, 0], [0.08, 0.04], [0, 0.05]], 8), MAT.slateDry, 'post-packing-' + i, { pos: [px, 0, pz] }));
    }
    for (let b = 0; b < bays; b++) {
      const bx = x0 + bayW * (b + 0.5);
      const isGate = b === gateBay;
      const zA = zig ? (b % 2 ? 0.28 : -0.28) : 0;
      const zB = zig ? (b % 2 ? -0.28 : 0.28) : 0;
      if (isGate) {
        // A gate is a diagonal-braced hurdle on a pair of iron hinges.
        const gw = bayW * 0.92, gh = H * 0.82;
        const swing = A.gate === 2 ? 0.7 : A.gate === 1 ? 0.2 : 0;
        const gate = new THREE.Group();
        for (let r = 0; r < 4; r++) gate.add(part(box(gw, 0.05, 0.035), LAND.railPale, 'gate-rail-' + r, { pos: [gw / 2, 0.1 + r * (gh / 4), 0] }));
        [0, 1].forEach((k) => gate.add(part(box(0.06, gh, 0.04), LAND.railPale, 'gate-stile-' + k, { pos: [k ? gw : 0, gh / 2, 0] })));
        gate.add(part(box(Math.sqrt(gw * gw + gh * gh) * 0.95, 0.045, 0.03), LAND.railPale, 'gate-brace', { pos: [gw / 2, gh / 2, 0.02], rot: [0, 0, Math.atan2(gh, gw)] }));
        gate.position.set(bx - gw / 2, 0, zA);
        gate.rotation.y = swing;
        g.add(gate);
        for (let k = 0; k < 2; k++) {
          g.add(part(box(0.12, 0.03, 0.02), MAT.pittedIron, 'hinge-' + k, { pos: [bx - gw / 2 + 0.05, gh * (0.25 + k * 0.5), zA], rot: [0, swing * 0.5, 0] }));
          g.add(part(cyl(0.008, 0.008, 0.05, 6), MAT.pittedIron, 'hinge-pin-' + k, { pos: [bx - gw / 2, gh * (0.25 + k * 0.5), zA] }));
        }
        g.add(part(torus(0.03, 0.005, 4, 12), MAT.pittedIron, 'gate-latch-ring', { pos: [bx + gw / 2 - 0.02, gh * 0.6, zA + Math.sin(swing) * gw], rot: [Math.PI / 2, 0, 0] }));
      } else if (A.form === 0) {
        for (let r = 0; r < 3; r++) {
          const ry = H * (0.28 + r * 0.26);
          const rail = box(bayW * 1.02, 0.055, 0.04, 2, 1, 1);
          jitter(rail, 0.004, rand);
          g.add(part(rail, r % 2 ? LAND.rail : LAND.railPale, 'rail-' + b + '-' + r, { pos: [bx, ry + (rand() - 0.5) * 0.02, zA + (rand() - 0.5) * 0.01], rot: [0, 0, (rand() - 0.5) * 0.02] }));
        }
      } else if (A.form === 1) {
        // Woven hurdle panel: uprights with withies threaded through.
        const uprights = 5;
        for (let u = 0; u < uprights; u++) {
          const ux = bx - bayW * 0.4 + (bayW * 0.8 / (uprights - 1)) * u;
          g.add(part(limb(0.014, 0.02, H * 0.78, 5, 2), LAND.wattle, 'hurdle-upright-' + b + '-' + u, { pos: [ux, H * 0.39, zA] }));
        }
        for (let w = 0; w < 7; w++) {
          const wy = H * (0.12 + w * 0.1);
          const pts = [];
          for (let u = 0; u < uprights; u++) {
            const ux = bx - bayW * 0.4 + (bayW * 0.8 / (uprights - 1)) * u;
            pts.push([ux, wy, zA + ((u + w) % 2 ? 0.022 : -0.022)]);
          }
          g.add(part(tube(pts, 0.008, 5), w % 2 ? LAND.wattle : LAND.railPale, 'withy-' + b + '-' + w, {}));
        }
      } else if (A.form === 3) {
        for (let r = 0; r < 4; r++) {
          const ry = 0.14 + r * 0.24;
          g.add(part(limb(0.038, 0.048, bayW * 1.12, 6, 2), r % 2 ? LAND.rail : LAND.railPale, 'zig-rail-' + b + '-' + r, {
            pos: [bx, ry, (zA + zB) / 2],
            rot: [0, Math.atan2(zB - zA, bayW), Math.PI / 2],
          }));
        }
      } else {
        // Wattle-and-stake: dense vertical stakes, three binding withies.
        const stakes = 9;
        for (let s = 0; s < stakes; s++) {
          const sx = bx - bayW * 0.44 + (bayW * 0.88 / (stakes - 1)) * s;
          g.add(part(limb(0.011, 0.017, H * (0.68 + rand() * 0.2), 5, 2), s % 3 === 0 ? LAND.railPale : LAND.wattle, 'stake-' + b + '-' + s, {
            pos: [sx, H * 0.38, zA + (rand() - 0.5) * 0.02], rot: [0, 0, (rand() - 0.5) * 0.06],
          }));
        }
        for (let w = 0; w < 3; w++) g.add(part(tube([[bx - bayW * 0.46, H * (0.22 + w * 0.24), zA - 0.02], [bx, H * (0.24 + w * 0.24), zA + 0.03], [bx + bayW * 0.46, H * (0.22 + w * 0.24), zA - 0.02]], 0.009, 5), LAND.wattle, 'binder-' + b + '-' + w, {}));
      }
      if (A.repair && b % 2 === 1 && !isGate) {
        g.add(part(limb(0.018, 0.026, H * 0.7, 5, 2), LAND.railPale, 'prop-' + b, { pos: [bx + bayW * 0.3, H * 0.34, zA + 0.14], rot: [0.4, 0, 0.1] }));
        for (let k = 0; k < 2; k++) g.add(part(torus(0.024, 0.004, 3, 10), MAT.ropeHemp, 'lashing-' + b + '-' + k, { pos: [bx + bayW * 0.3, H * (0.5 + k * 0.12), zA + 0.06], rot: [0.3, 0, 0] }));
      }
    }
  }
  if (A.repair) {
    for (let i = 0; i < 4; i++) {
      const a = rand() * T;
      g.add(part(cone(0.03, 0.11, 5), MAT.reedPale, 'verge-tuft-' + i, { pos: [x0 + rand() * span, 0.04, (rand() - 0.5) * 0.7], rot: [rand() * 0.3, a, 0] }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------------- WELL */
export const WELL_AXES = { form: 4, roof: 4, winch: 3, bucket: 3, wall: 2, trough: 2 };
export function well(variant = 0) {
  const A = axesOf(variant, WELL_AXES);
  const rand = rnd(variant * 971 + 9);
  const g = new THREE.Group();
  const R = 0.55 + A.form * 0.06;
  const wallH = 0.55 + A.wall * 0.16;
  // The shaft head: coursed ring, or squared, or a rough kerb.
  if (A.form === 3) {
    // Derelict: collapsed ring, capped with boards.
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * T;
      if (i % 5 === 3) continue;
      const s = box(R * 0.44, 0.15 + rand() * 0.06, 0.3);
      jitter(s, 0.03, rand);
      g.add(part(s, i % 3 ? MAT.slateDry : MAT.wetSlate, 'kerb-' + i, {
        pos: [Math.cos(a) * R, 0.08 + (i % 3 === 0 ? 0.14 : 0), Math.sin(a) * R], rot: [(rand() - 0.5) * 0.14, -a, (rand() - 0.5) * 0.14],
      }));
    }
    for (let k = 0; k < 4; k++) g.add(part(box(R * 2.1, 0.03, R * 0.4), MAT.weatheredTimber, 'cap-board-' + k, { pos: [0, 0.24 + k * 0.004, -R * 0.6 + k * R * 0.42], rot: [0, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.03] }));
  } else {
    const courses = 3 + A.wall;
    for (let c = 0; c < courses; c++) {
      const cy = (wallH / courses) * (c + 0.5);
      const n = A.form === 1 ? 4 : 12 + A.form * 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * T + (c % 2 ? Math.PI / n : 0);
        const w = A.form === 1 ? R * 1.5 : (T * R) / n * 0.94;
        const s = box(w, wallH / courses * 0.9, 0.26);
        jitter(s, 0.016, rand);
        g.add(part(s, (i + c) % 3 === 0 ? MAT.springStone : MAT.slateDry, 'ring-stone-' + c + '-' + i, {
          pos: [Math.cos(a) * R, cy, Math.sin(a) * R], rot: [0, -a, (rand() - 0.5) * 0.03],
        }));
      }
    }
    g.add(part(lathe([[R * 0.86, 0], [R * 1.16, 0], [R * 1.16, 0.07], [R * 0.86, 0.07]], A.form === 1 ? 4 : 22), MAT.springStone, 'coping-ring', { pos: [0, wallH, 0], rot: [0, A.form === 1 ? Math.PI / 4 : 0, 0] }));
  }
  // The shaft itself: dark water far down, not a black disc.
  g.add(part(lathe([[R * 0.85, 0], [R * 0.85, -0.5], [0, -0.55]], 16), MAT.wetSlate, 'shaft-lining', { pos: [0, wallH * 0.9, 0] }));
  g.add(part(lathe([[R * 0.8, 0], [R * 0.5, -0.01], [0, -0.015]], 14), MAT.blackwater, 'water-surface', { pos: [0, wallH * 0.9 - 0.42, 0] }));
  // Frame and winch.
  const postH = 1.35 + A.roof * 0.1;
  if (A.roof < 3) {
    [-1, 1].forEach((s, i) => {
      const geo = A.roof === 0 ? limb(0.05, 0.07, postH, 7, 3) : box(0.09, postH, 0.09, 1, 3, 1);
      jitter(geo, 0.005, rand);
      g.add(part(geo, MAT.weatheredTimber, 'frame-post-' + i, { pos: [s * R * 0.95, wallH + postH / 2, 0], rot: [0, 0, s * 0.02] }));
      g.add(part(box(0.14, 0.05, 0.14), MAT.pittedIron, 'post-shoe-' + i, { pos: [s * R * 0.95, wallH + 0.03, 0] }));
    });
    g.add(part(cyl(0.05, 0.05, R * 2.3, 8), MAT.weatheredTimber, 'head-beam', { pos: [0, wallH + postH, 0], rot: [0, 0, Math.PI / 2] }));
    if (A.winch) {
      const dr = 0.09 + A.winch * 0.014;
      g.add(part(cyl(dr, dr, R * 1.5, 12), MAT.darkOak, 'winch-drum', { pos: [0, wallH + postH * 0.82, 0], rot: [0, 0, Math.PI / 2] }));
      for (let k = 0; k < 8; k++) g.add(part(torus(dr * 1.04, 0.008, 3, 14), MAT.ropeHemp, 'drum-rope-' + k, { pos: [-R * 0.6 + k * 0.09, wallH + postH * 0.82, 0], rot: [0, Math.PI / 2, 0] }));
      [-1, 1].forEach((s, i) => g.add(part(cyl(0.014, 0.014, 0.12, 8), MAT.pittedIron, 'winch-axle-' + i, { pos: [s * R * 0.86, wallH + postH * 0.82, 0], rot: [0, 0, Math.PI / 2] })));
      // Crank handle: a bent iron rod with a wooden grip.
      const cx = R * 1.02;
      g.add(part(cyl(0.012, 0.012, 0.16, 7), MAT.pittedIron, 'crank-arm', { pos: [cx, wallH + postH * 0.82 + 0.08, 0], rot: [0, 0, 0] }));
      g.add(part(cyl(0.011, 0.011, 0.13, 7), MAT.pittedIron, 'crank-throw', { pos: [cx, wallH + postH * 0.82 + 0.16, 0.065], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(cyl(0.019, 0.021, 0.11, 9), MAT.heartwood, 'crank-grip', { pos: [cx, wallH + postH * 0.82 + 0.16, 0.13], rot: [Math.PI / 2, 0, 0] }));
      if (A.winch > 1) for (let k = 0; k < 10; k++) g.add(part(box(0.014, 0.03, 0.012), MAT.darkOak, 'ratchet-tooth-' + k, { pos: [-R * 0.68, wallH + postH * 0.82 + Math.sin((k / 10) * T) * dr * 1.1, Math.cos((k / 10) * T) * dr * 1.1], rot: [-(k / 10) * T, 0, 0] }));
    }
  } else {
    // Windlass under a small roof on four posts.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * T + Math.PI / 4;
      g.add(part(box(0.07, postH, 0.07, 1, 3, 1), MAT.weatheredTimber, 'roof-post-' + i, { pos: [Math.cos(a) * R * 1.05, wallH + postH / 2, Math.sin(a) * R * 1.05] }));
    }
    const rr = R * 1.5;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * T + Math.PI / 4;
      g.add(part(box(rr * 1.3, 0.02, rr * 0.9), MAT.slateDry, 'roof-slope-' + i, {
        pos: [Math.cos(a) * rr * 0.42, wallH + postH + 0.16, Math.sin(a) * rr * 0.42],
        rot: [Math.sin(a) * 0.6, -a, -Math.cos(a) * 0.6],
      }));
    }
    g.add(part(cone(0.09, 0.14, 6), MAT.pittedIron, 'roof-finial', { pos: [0, wallH + postH + 0.3, 0] }));
    g.add(part(cyl(0.1, 0.1, R * 1.4, 11), MAT.darkOak, 'windlass', { pos: [0, wallH + postH * 0.7, 0], rot: [0, 0, Math.PI / 2] }));
  }
  // Bucket, on the rope or on the coping.
  if (A.bucket) {
    const br = 0.13;
    const onRope = A.bucket > 1;
    const by = onRope ? wallH + 0.42 : wallH + br * 0.7;
    const bx = onRope ? 0 : R * 0.75;
    g.add(part(lathe([[br * 0.78, 0], [br, br * 1.2], [br * 1.02, br * 1.3]], 13), MAT.darkOak, 'bucket', { pos: [bx, by, 0] }));
    for (let k = 0; k < 2; k++) g.add(part(torus(br * (1.0 - k * 0.16), 0.008, 3, 14), MAT.pittedIron, 'bucket-hoop-' + k, { pos: [bx, by + br * (0.25 + k * 0.75), 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(torus(br * 0.85, 0.006, 3, 14, Math.PI), MAT.pittedIron, 'bucket-bail', { pos: [bx, by + br * 1.35, 0] }));
    if (onRope) g.add(part(tube([[0, wallH + (A.roof < 3 ? postH * 0.78 : postH * 0.66), 0], [0, by + br * 1.4, 0]], 0.007, 5), MAT.ropeHemp, 'draw-rope', {}));
    if (A.bucket === 3) g.add(part(lathe([[br * 0.9, 0], [br * 0.5, -0.006], [0, -0.01]], 12), MAT.blackwater, 'bucket-water', { pos: [bx, by + br * 1.15, 0] }));
  }
  if (A.trough) {
    const tw = 1.1, tx = -R * 1.9;
    g.add(part(box(tw, 0.24, 0.42), MAT.springStone, 'trough', { pos: [tx, 0.12, 0] }));
    g.add(part(box(tw * 0.9, 0.16, 0.32), MAT.wetSlate, 'trough-basin', { pos: [tx, 0.16, 0] }));
    g.add(part(box(tw * 0.86, 0.02, 0.28), MAT.blackwater, 'trough-water', { pos: [tx, 0.21, 0] }));
    for (let k = 0; k < 3; k++) g.add(part(lathe([[0.06, 0], [0.045, 0.008], [0, 0.011]], 9), MAT.graveMoss, 'trough-moss-' + k, { pos: [tx + (k - 1) * tw * 0.34, 0.24, 0.2] }));
    g.add(part(tube([[-R * 1.0, wallH * 0.7, 0], [tx * 0.7, wallH * 0.35, 0], [tx + tw * 0.4, 0.26, 0]], 0.028, 7), MAT.weatheredTimber, 'launder-channel', {}));
  }
  return seat(g);
}

/* ------------------------------------------------------------- GRAVE MARKERS */
export const GRAVE_AXES = { form: 5, count: 4, offering: 3, lean: 3, moss: 2, kerb: 2 };
export function graveMarkers(variant = 0) {
  const A = axesOf(variant, GRAVE_AXES);
  const rand = rnd(variant * 1087 + 15);
  const g = new THREE.Group();
  const n = 1 + A.count;
  const sp = 0.55;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * sp;
    const z = (rand() - 0.5) * 0.12;
    const tilt = (rand() - 0.5) * 0.12 * A.lean;
    const H = 0.42 + rand() * 0.28;
    if (A.form === 0) {
      // Slab headstone, round-topped.
      const W = H * 0.62;
      const slab = box(W, H, 0.09, 2, 3, 1);
      const p = slab.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const ty = (p.getY(v) + H / 2) / H;
        if (ty > 0.76) p.setX(v, p.getX(v) * (1 - (ty - 0.76) * 1.7));
      }
      p.needsUpdate = true; slab.computeVertexNormals();
      jitter(slab, 0.008, rand);
      g.add(part(slab, i % 3 === 0 ? MAT.wetSlate : MAT.springStone, 'headstone-' + i, { pos: [x, H / 2, z], rot: [tilt * 0.7, rand() * 0.3, tilt] }));
      for (let l = 0; l < 3; l++) g.add(part(box(W * 0.58, 0.014, 0.006), MAT.wetSlate, 'inscription-' + i + '-' + l, { pos: [x, H * (0.62 - l * 0.14), z + 0.048], rot: [tilt * 0.7, 0, tilt] }));
    } else if (A.form === 1) {
      // Timber cross, pegged.
      g.add(part(box(0.07, H * 1.2, 0.06), MAT.weatheredTimber, 'cross-stem-' + i, { pos: [x, H * 0.6, z], rot: [tilt * 0.7, 0, tilt] }));
      g.add(part(box(H * 0.56, 0.06, 0.055), MAT.weatheredTimber, 'cross-arm-' + i, { pos: [x, H * 0.92, z], rot: [tilt * 0.7, 0, tilt] }));
      g.add(part(cyl(0.008, 0.008, 0.08, 6), MAT.pittedIron, 'cross-peg-' + i, { pos: [x, H * 0.92, z], rot: [Math.PI / 2 + tilt * 0.7, 0, 0] }));
      if (A.offering) g.add(part(torus(0.05, 0.008, 4, 12), MAT.ropeHemp, 'cross-wreath-' + i, { pos: [x, H * 0.92, z + 0.04], rot: [0.2, 0, 0] }));
    } else if (A.form === 2) {
      // Cairn: a stacked pile, smaller stones upward.
      const stones = 6 + Math.floor(rand() * 5);
      for (let k = 0; k < stones; k++) {
        const t = k / stones;
        const sr = 0.11 * (1 - t * 0.6);
        const s = ico(sr, 1);
        jitter(s, sr * 0.3, rand);
        s.scale(1, 0.62 + rand() * 0.3, 1);
        const a = rand() * T, d = (1 - t) * 0.09;
        g.add(part(s, k % 3 === 0 ? MAT.wetSlate : MAT.slateDry, 'cairn-stone-' + i + '-' + k, {
          pos: [x + Math.cos(a) * d, sr * 0.7 + t * H * 0.95, z + Math.sin(a) * d], rot: [rand() * 0.3, rand() * T, rand() * 0.3],
        }));
      }
    } else if (A.form === 3) {
      // Carved stone with a recessed panel and a shaped shoulder.
      const W = H * 0.7;
      g.add(part(box(W * 1.24, 0.11, 0.34), MAT.springStone, 'plinth-' + i, { pos: [x, 0.055, z] }));
      const body = box(W, H, 0.13, 2, 3, 1);
      jitter(body, 0.006, rand);
      g.add(part(body, MAT.springStone, 'stele-' + i, { pos: [x, 0.11 + H / 2, z], rot: [tilt * 0.5, 0, tilt * 0.6] }));
      g.add(part(box(W * 0.7, H * 0.6, 0.02), MAT.wetSlate, 'panel-' + i, { pos: [x, 0.11 + H * 0.52, z + 0.06], rot: [tilt * 0.5, 0, tilt * 0.6] }));
      g.add(part(lathe([[W * 0.5, 0], [W * 0.42, H * 0.08], [W * 0.2, H * 0.13], [0, H * 0.14]], 11), MAT.springStone, 'stele-cap-' + i, { pos: [x, 0.11 + H, z], rot: [tilt * 0.5, 0, tilt * 0.6] }));
      for (let l = 0; l < 2; l++) g.add(part(box(W * 0.44, 0.012, 0.006), MAT.blackIron, 'stele-line-' + i + '-' + l, { pos: [x, 0.11 + H * (0.6 - l * 0.16), z + 0.072], rot: [tilt * 0.5, 0, tilt * 0.6] }));
    } else {
      // Wooden stake with a clay name tablet — the Hearthmere way.
      g.add(part(limb(0.028, 0.04, H * 1.1, 6, 3), MAT.weatheredTimber, 'stake-' + i, { pos: [x, H * 0.55, z], rot: [tilt * 0.7, rand(), tilt] }));
      g.add(part(box(0.14, 0.1, 0.02), MAT.firedClay, 'name-tablet-' + i, { pos: [x, H * 0.92, z + 0.03], rot: [tilt * 0.7, 0, tilt + (rand() - 0.5) * 0.1] }));
      for (let l = 0; l < 2; l++) g.add(part(box(0.09, 0.008, 0.004), MAT.wetSlate, 'tablet-mark-' + i + '-' + l, { pos: [x, H * (0.94 - l * 0.03), z + 0.041], rot: [tilt * 0.7, 0, tilt] }));
      g.add(part(tube([[x - 0.06, H * 0.98, z + 0.02], [x, H * 1.0, z + 0.04], [x + 0.06, H * 0.98, z + 0.02]], 0.004, 4), MAT.ropeHemp, 'tablet-cord-' + i, {}));
    }
    if (A.kerb) {
      const kw = sp * 0.82, kd = 0.9;
      for (let k = 0; k < 4; k++) {
        const along = k < 2;
        g.add(part(box(along ? kw : 0.06, 0.06, along ? 0.06 : kd), MAT.slateDry, 'kerb-' + i + '-' + k, {
          pos: [x + (along ? 0 : (k === 2 ? -kw / 2 : kw / 2)), 0.03, z + (along ? (k ? kd / 2 : -kd / 2) : 0) + kd * 0.45],
        }));
      }
      for (let k = 0; k < 5; k++) g.add(part(ico(0.02, 0), MAT.slateDry, 'kerb-fill-' + i + '-' + k, { pos: [x + (rand() - 0.5) * kw * 0.7, 0.015, z + kd * 0.45 + (rand() - 0.5) * kd * 0.7] }));
    }
    if (A.offering) {
      const oy = 0.03;
      if (A.offering >= 1) for (let k = 0; k < 3; k++) g.add(part(cone(0.012, 0.05, 4), MAT.heatherBloom, 'sprig-' + i + '-' + k, { pos: [x + (k - 1) * 0.04, oy + 0.02, z + 0.16], rot: [1.2, rand() * T, 0] }));
      if (A.offering >= 2) {
        g.add(part(lathe([[0.026, 0], [0.032, 0.014], [0.026, 0.04], [0.028, 0.044]], 11), MAT.firedClay, 'votive-cup-' + i, { pos: [x + 0.1, oy, z + 0.18] }));
        g.add(part(ico(0.012, 0), MAT.ember, 'votive-ember-' + i, { pos: [x + 0.1, oy + 0.04, z + 0.18] }));
      }
    }
    if (A.moss) {
      for (let k = 0; k < 4; k++) {
        const a = rand() * T;
        g.add(part(lathe([[0.035, 0], [0.026, 0.007], [0, 0.009]], 8), MAT.graveMoss, 'moss-' + i + '-' + k, { pos: [x + Math.cos(a) * 0.13, 0.02 + rand() * H * 0.5, z + Math.sin(a) * 0.09] }));
      }
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------------- BEEHIVE */
export const BEEHIVE_AXES = { form: 4, count: 4, stand: 3, cover: 3, smoker: 2 };
export function beehive(variant = 0) {
  const A = axesOf(variant, BEEHIVE_AXES);
  const rand = rnd(variant * 619 + 21);
  const g = new THREE.Group();
  const n = 1 + A.count;
  const sp = 0.5;
  let standY = 0;
  if (A.stand === 1) {
    const W = sp * n + 0.2;
    g.add(part(box(W, 0.05, 0.42), MAT.weatheredTimber, 'bench-top', { pos: [0, 0.28, 0] }));
    [-1, 1].forEach((s, i) => g.add(part(box(0.07, 0.28, 0.34), MAT.weatheredTimber, 'bench-leg-' + i, { pos: [s * W * 0.42, 0.14, 0] })));
    standY = 0.305;
  } else if (A.stand === 2) {
    standY = 0.34;
  }
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * sp;
    const z = (rand() - 0.5) * 0.04;
    if (A.stand === 2) {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * T + Math.PI / 4;
        g.add(part(limb(0.02, 0.028, standY, 5, 2), MAT.weatheredTimber, 'stool-leg-' + i + '-' + k, { pos: [x + Math.cos(a) * 0.11, standY / 2, z + Math.sin(a) * 0.11], rot: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12] }));
      }
      g.add(part(box(0.34, 0.03, 0.34), MAT.weatheredTimber, 'stool-top-' + i, { pos: [x, standY, z] }));
    }
    const H = 0.34 + rand() * 0.08;
    if (A.form === 0) {
      // Straw skep: coiled rope of straw, lathed with visible coils.
      const R = H * 0.52;
      g.add(part(lathe([[R, 0], [R * 0.98, H * 0.3], [R * 0.82, H * 0.62], [R * 0.42, H * 0.9], [0, H]], 15), LAND.straw, 'skep-' + i, { pos: [x, standY, z] }));
      const coils = 7;
      for (let k = 0; k < coils; k++) {
        const t = k / coils;
        const cr = R * (1 - Math.pow(t, 1.7) * 0.95);
        g.add(part(torus(cr, R * 0.045, 4, 16), LAND.straw, 'skep-coil-' + i + '-' + k, { pos: [x, standY + t * H * 0.95, z], rot: [Math.PI / 2, 0, 0] }));
      }
      g.add(part(box(R * 0.36, R * 0.16, 0.03), MAT.weatheredTimber, 'skep-entrance-' + i, { pos: [x, standY + H * 0.08, z + R * 0.92] }));
    } else if (A.form === 1) {
      // Box hive: stacked supers with a landing board.
      const W = 0.32;
      const supers = 2 + (i % 2);
      for (let s = 0; s < supers; s++) {
        g.add(part(box(W, H / supers * 0.94, W * 0.86), MAT.darkOak, 'super-' + i + '-' + s, { pos: [x, standY + (H / supers) * (s + 0.5), z] }));
        for (let k = 0; k < 2; k++) g.add(part(box(W * 1.04, 0.012, 0.012), MAT.weatheredTimber, 'super-lip-' + i + '-' + s + '-' + k, { pos: [x, standY + (H / supers) * (s + (k ? 0.9 : 0.1)), z + W * 0.44] }));
      }
      g.add(part(box(W * 1.1, 0.02, W * 0.4), MAT.weatheredTimber, 'landing-board-' + i, { pos: [x, standY + 0.01, z + W * 0.58], rot: [-0.12, 0, 0] }));
      g.add(part(box(W * 0.5, 0.014, 0.02), MAT.blackIron, 'entrance-slot-' + i, { pos: [x, standY + 0.03, z + W * 0.44] }));
    } else if (A.form === 2) {
      // Log hive: a hollowed trunk section, standing.
      const R = H * 0.4;
      const trunk = limb(R * 0.94, R, H, 11, 3);
      jitter(trunk, R * 0.09, rand);
      g.add(part(trunk, MAT.pineBark, 'log-hive-' + i, { pos: [x, standY + H / 2, z] }));
      g.add(part(lathe([[R * 0.92, 0], [R * 0.6, 0.02], [R * 0.55, 0.03]], 12), MAT.heartwood, 'log-hollow-' + i, { pos: [x, standY + H, z] }));
      g.add(part(cyl(R * 0.9, R * 0.9, 0.04, 12), MAT.weatheredTimber, 'log-lid-' + i, { pos: [x, standY + H + 0.02, z] }));
      g.add(part(ico(R * 0.16, 0), MAT.slateDry, 'lid-weight-' + i, { pos: [x, standY + H + 0.06, z] }));
      for (let k = 0; k < 3; k++) g.add(part(box(0.02, 0.012, 0.02), MAT.blackIron, 'log-entrance-' + i + '-' + k, { pos: [x + (k - 1) * 0.04, standY + H * 0.16, z + R * 0.95] }));
    } else {
      // Wall niche (bee bole): a stone recess holding a skep.
      const W = 0.42;
      g.add(part(box(W * 1.5, H * 1.5, 0.3), MAT.slateDry, 'bole-wall-' + i, { pos: [x, standY + H * 0.75, z - 0.1] }));
      g.add(part(box(W * 0.8, H * 0.9, 0.2), MAT.wetSlate, 'bole-recess-' + i, { pos: [x, standY + H * 0.6, z + 0.02] }));
      g.add(part(lathe([[W * 0.34, 0], [W * 0.3, H * 0.5], [0, H * 0.72]], 13), LAND.straw, 'bole-skep-' + i, { pos: [x, standY + H * 0.2, z + 0.05] }));
      g.add(part(lathe([[W * 0.44, 0], [W * 0.44, 0.05], [W * 0.3, 0.06]], 13), MAT.springStone, 'bole-arch-' + i, { pos: [x, standY + H * 1.05, z + 0.02], rot: [Math.PI / 2, 0, 0] }));
    }
    if (A.cover === 1) {
      g.add(part(cone(H * 0.5, H * 0.34, 12), LAND.straw, 'straw-hackle-' + i, { pos: [x, standY + H + H * 0.16, z] }));
      g.add(part(torus(H * 0.2, 0.008, 4, 12), MAT.ropeHemp, 'hackle-tie-' + i, { pos: [x, standY + H + H * 0.1, z], rot: [Math.PI / 2, 0, 0] }));
    } else if (A.cover === 2) {
      g.add(part(box(0.44, 0.02, 0.4), MAT.slateDry, 'stone-cover-' + i, { pos: [x, standY + H + 0.02, z], rot: [0, rand() * 0.3, 0.03] }));
      g.add(part(ico(0.05, 1), MAT.slateDry, 'cover-weight-' + i, { pos: [x, standY + H + 0.06, z] }));
    }
  }
  if (A.smoker) {
    const sx = (n / 2) * sp + 0.28;
    g.add(part(lathe([[0.05, 0], [0.058, 0.03], [0.055, 0.13], [0.03, 0.16], [0.026, 0.19]], 12), MAT.pittedIron, 'smoker-body', { pos: [sx, 0, 0] }));
    g.add(part(cone(0.03, 0.06, 9), MAT.pittedIron, 'smoker-nozzle', { pos: [sx, 0.21, 0] }));
    g.add(part(box(0.07, 0.06, 0.04), LAND.hide, 'smoker-bellows', { pos: [sx + 0.08, 0.08, 0] }));
    g.add(part(box(0.075, 0.012, 0.045), MAT.darkOak, 'bellows-board', { pos: [sx + 0.08, 0.115, 0], rot: [0, 0, 0.2] }));
    g.add(part(cyl(0.008, 0.008, 0.07, 6), MAT.pittedIron, 'bellows-pipe', { pos: [sx + 0.04, 0.09, 0], rot: [0, 0, Math.PI / 2] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- CROP STAND */
export const CROP_AXES = { crop: 5, rows: 4, height: 3, stakes: 3, gaps: 2, scale: 2 };
export function cropStand(variant = 0) {
  const A = axesOf(variant, CROP_AXES);
  const rand = rnd(variant * 757 + 27);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.3;
  const rows = 2 + A.rows;
  const patchW = 1.5 * s;
  const rowGap = patchW / rows;
  // Turned soil ridges — a crop stand is a field surface, not floating plants.
  for (let r = 0; r < rows; r++) {
    const z = -patchW / 2 + rowGap * (r + 0.5);
    const ridge = box(patchW * 1.05, 0.05 * s, rowGap * 0.8, 8, 1, 2);
    const p = ridge.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const tz = Math.abs(p.getZ(v)) / (rowGap * 0.4);
      p.setY(v, p.getY(v) - tz * 0.02 * s + Math.sin(p.getX(v) * 7) * 0.006 * s);
    }
    p.needsUpdate = true; ridge.computeVertexNormals();
    g.add(part(ridge, LAND.soil, 'soil-ridge-' + r, { pos: [0, 0.025 * s, z] }));
  }
  const H = (0.3 + A.height * 0.22) * s;
  for (let r = 0; r < rows; r++) {
    const z = -patchW / 2 + rowGap * (r + 0.5);
    const perRow = Math.max(2, cnt(5 + A.rows));
    for (let i = 0; i < perRow; i++) {
      if (A.gaps && (i + r) % 5 === 4) continue;
      const x = -patchW * 0.46 + (patchW * 0.92 / (perRow - 1)) * i + (rand() - 0.5) * 0.03;
      const y = 0.045 * s;
      const jx = (rand() - 0.5) * 0.02;
      if (A.crop === 0) {
        // Grain: stems with a nodding ear.
        const stems = cnt(4 + Math.floor(rand() * 3));
        for (let k = 0; k < stems; k++) {
          const a = rand() * T, sp2 = rand() * 0.03 * s;
          const bend = 0.05 + rand() * 0.06;
          const pts = [[x + jx, y, z], [x + jx + Math.cos(a) * sp2, y + H * 0.6, z + Math.sin(a) * sp2], [x + jx + Math.cos(a) * (sp2 + bend), y + H, z + Math.sin(a) * (sp2 + bend)]];
          g.add(part(tube(pts, 0.0035 * s, 4), LAND.grainGreen, 'stem-' + r + '-' + i + '-' + k, {}));
          const ear = cone(0.012 * s, 0.075 * s, 5);
          g.add(part(ear, LAND.grain, 'ear-' + r + '-' + i + '-' + k, { pos: [x + jx + Math.cos(a) * (sp2 + bend), y + H + 0.03 * s, z + Math.sin(a) * (sp2 + bend)], rot: [0.5, a, 0] }));
          for (let b = 0; b < cnt(3); b++) g.add(part(cone(0.001 * s, 0.05 * s, 3), LAND.grain, 'awn-' + r + '-' + i + '-' + k + '-' + b, { pos: [x + jx + Math.cos(a) * (sp2 + bend), y + H + 0.07 * s, z + Math.sin(a) * (sp2 + bend)], rot: [0.3 + b * 0.2, a + b, 0] }));
        }
      } else if (A.crop === 1) {
        // Root crop: a rosette of broad leaves and a shouldered root.
        const leaves = cnt(5 + Math.floor(rand() * 3));
        for (let k = 0; k < leaves; k++) {
          const a = (k / leaves) * T + rand() * 0.3;
          const L = H * (0.5 + rand() * 0.5);
          const lf = box(0.05 * s, 0.004, L, 2, 1, 3);
          const lp = lf.attributes.position;
          for (let v = 0; v < lp.count; v++) {
            const t = (lp.getZ(v) + L / 2) / L;
            lp.setX(v, lp.getX(v) * (0.4 + Math.sin(t * Math.PI) * 1.2));
            lp.setY(v, lp.getY(v) + Math.sin(t * 2.4) * L * 0.16);
          }
          lp.needsUpdate = true; lf.computeVertexNormals();
          g.add(part(lf, k % 2 ? LAND.leafCrop : LAND.grainGreen, 'leaf-' + r + '-' + i + '-' + k, { pos: [x + jx + Math.cos(a) * L * 0.35, y + L * 0.3, z + Math.sin(a) * L * 0.35], rot: [0, -a + Math.PI / 2, -0.5] }));
        }
        g.add(part(lathe([[0.032 * s, 0], [0.036 * s, -0.02 * s], [0.02 * s, -0.06 * s], [0, -0.09 * s]], 10), MAT.firedClay, 'root-shoulder-' + r + '-' + i, { pos: [x + jx, y + 0.02 * s, z] }));
      } else if (A.crop === 2) {
        // Beans on a stake: a climbing spiral.
        const sh = H * 1.3;
        g.add(part(limb(0.006 * s, 0.009 * s, sh, 5, 2), MAT.weatheredTimber, 'bean-stake-' + r + '-' + i, { pos: [x + jx, y + sh / 2, z] }));
        const pts = [];
        const vinePts = cnt(10);
        for (let k = 0; k <= vinePts; k++) {
          const t = k / vinePts;
          const a = t * 7;
          pts.push([x + jx + Math.cos(a) * 0.022 * s, y + t * sh, z + Math.sin(a) * 0.022 * s]);
        }
        g.add(part(tube(pts, 0.0035 * s, 4), LAND.grainGreen, 'bean-vine-' + r + '-' + i, {}));
        for (let k = 0; k < cnt(6); k++) {
          const t = 0.2 + k * 0.13, a = t * 7;
          g.add(part(box(0.038 * s, 0.003, 0.024 * s), LAND.leafCrop, 'bean-leaf-' + r + '-' + i + '-' + k, { pos: [x + jx + Math.cos(a) * 0.042 * s, y + t * sh, z + Math.sin(a) * 0.042 * s], rot: [0.2, a, 0.3] }));
          if (k % 2) g.add(part(cyl(0.005 * s, 0.004 * s, 0.05 * s, 5), LAND.grainGreen, 'bean-pod-' + r + '-' + i + '-' + k, { pos: [x + jx + Math.cos(a) * 0.03 * s, y + t * sh - 0.03 * s, z + Math.sin(a) * 0.03 * s], rot: [0.3, a, 0.2] }));
        }
      } else if (A.crop === 3) {
        // Brassica: a tight head inside outer leaves.
        const R = H * 0.3;
        const head = ico(R * 0.7, 1);
        head.scale(1, 0.85, 1);
        g.add(part(head, LAND.leafCrop, 'head-' + r + '-' + i, { pos: [x + jx, y + R * 0.6, z] }));
        for (let k = 0; k < cnt(6); k++) {
          const a = (k / 6) * T + rand() * 0.3;
          const lf = lathe([[0.004, 0], [R * 0.7, R * 0.4], [R * 0.9, R * 0.85], [R * 0.3, R]], 7);
          lf.scale(1, 1, 0.4);
          g.add(part(lf, k % 2 ? LAND.grainGreen : LAND.leafCrop, 'wrap-leaf-' + r + '-' + i + '-' + k, {
            pos: [x + jx + Math.cos(a) * R * 0.5, y, z + Math.sin(a) * R * 0.5], rot: [1.1, a, 0],
          }));
        }
      } else {
        // Flax: fine stems with a small terminal flower.
        const stems = cnt(7 + Math.floor(rand() * 4));
        for (let k = 0; k < stems; k++) {
          const a = rand() * T, sp2 = rand() * 0.035 * s;
          g.add(part(tube([[x + jx, y, z], [x + jx + Math.cos(a) * sp2 * 0.5, y + H * 0.55, z + Math.sin(a) * sp2 * 0.5], [x + jx + Math.cos(a) * sp2, y + H, z + Math.sin(a) * sp2]], 0.0022 * s, 4), LAND.flax, 'flax-stem-' + r + '-' + i + '-' + k, {}));
          if (k % 3 === 0) g.add(part(ico(0.008 * s, 0), MAT.heatherBloom, 'flax-flower-' + r + '-' + i + '-' + k, { pos: [x + jx + Math.cos(a) * sp2, y + H + 0.008 * s, z + Math.sin(a) * sp2] }));
        }
      }
    }
  }
  // Row stakes and a marker at the headland — how a field is actually worked.
  for (let k = 0; k < A.stakes; k++) {
    const sx = -patchW * 0.5 + k * patchW * 0.5;
    g.add(part(limb(0.012 * s, 0.018 * s, 0.3 * s, 5, 2), MAT.weatheredTimber, 'row-stake-' + k, { pos: [sx, 0.15 * s, -patchW / 2 - 0.06 * s], rot: [0, 0, (rand() - 0.5) * 0.1] }));
    if (k === 0) {
      g.add(part(box(0.09 * s, 0.06 * s, 0.008), MAT.firedClay, 'row-tablet', { pos: [sx, 0.28 * s, -patchW / 2 - 0.05 * s] }));
      for (let l = 0; l < 2; l++) g.add(part(box(0.06 * s, 0.005, 0.003), MAT.wetSlate, 'tablet-mark-' + l, { pos: [sx, 0.29 * s - l * 0.016 * s, -patchW / 2 - 0.045 * s] }));
    }
    if (A.stakes > 1 && k > 0) g.add(part(tube([[-patchW * 0.5, 0.26 * s, -patchW / 2 - 0.06 * s], [sx, 0.24 * s, -patchW / 2 - 0.06 * s]], 0.0022 * s, 4), MAT.ropeHemp, 'row-line-' + k, {}));
  }
  return seat(g);
}

/* ------------------------------------------------------------ CROP FIELD
 * A crop stand is a TILE, and a field is hundreds of them. Built naively that
 * is tens of thousands of meshes and a stall, which is why the standalone
 * patch was flagged as hero-weight wearing a standard label.
 *
 * This composer instances instead. One InstancedMesh per part of a single
 * prototype patch covers every tile at once, so the draw-call count equals the
 * PART count of one patch and is independent of how many tiles there are. A
 * 10x10 field costs the same number of draw calls as a 2x2 one.
 *
 * Two anti-tiling measures, because instancing a patch verbatim reads as
 * wallpaper: each tile gets a deterministic quarter-turn and a sub-tile
 * positional jitter, both baked into the instance matrix at no runtime cost.
 *
 * The prototype is built at a caller-chosen LOD, so a distant field can be
 * composed from LOD2 patches while the one at the player's feet uses LOD0.
 *
 * TWO HONEST LIMITS, because instancing is often oversold:
 *   1. This saves DRAW CALLS, not triangles. Triangle count still scales
 *      linearly with tile count (a 6x6 LOD1 field is ~65k tris) and the GPU
 *      still transforms every one. Only a lower proto LOD reduces that.
 *   2. An InstancedMesh frustum-culls as ONE object, so a large field is
 *      either fully drawn or fully skipped. For anything bigger than roughly
 *      8x8, call this once per region and let each chunk cull on its own
 *      rather than composing one field across the whole map.
 *
 * Returns the group with userData.fieldStats for honest reporting.
 */
export function cropField(variant = 0, tilesX = 4, tilesZ = 4, lod = 1) {
  const prev = getLod();
  setLod(lod);
  const proto = cropStand(variant);
  setLod(prev);
  proto.updateMatrixWorld(true);

  const bb = new THREE.Box3().setFromObject(proto);
  const size = bb.getSize(new THREE.Vector3());
  const pitchX = Math.max(0.2, size.x * 0.98);
  const pitchZ = Math.max(0.2, size.z * 0.98);
  const n = Math.max(1, tilesX * tilesZ);
  const rand = rnd(variant * 6151 + tilesX * 31 + tilesZ * 7);

  const parts = [];
  proto.traverse((o) => {
    if (o.isMesh && o.geometry) parts.push({ geo: o.geometry, mat: o.material, m: o.matrixWorld.clone(), name: o.name });
  });

  const g = new THREE.Group();
  g.name = 'crop-field-' + tilesX + 'x' + tilesZ;
  const tileM = new THREE.Matrix4();
  const rotM = new THREE.Matrix4();
  const outM = new THREE.Matrix4();
  // Per-tile transforms computed once and reused for every part, so all parts
  // of a tile stay registered to each other.
  const tiles = [];
  for (let tx = 0; tx < tilesX; tx++) {
    for (let tz = 0; tz < tilesZ; tz++) {
      const quarter = Math.floor(rand() * 4) * (Math.PI / 2);
      const jx = (rand() - 0.5) * pitchX * 0.08;
      const jz = (rand() - 0.5) * pitchZ * 0.08;
      tileM.makeTranslation((tx - (tilesX - 1) / 2) * pitchX + jx, 0, (tz - (tilesZ - 1) / 2) * pitchZ + jz);
      rotM.makeRotationY(quarter);
      tiles.push(new THREE.Matrix4().multiplyMatrices(tileM, rotM));
    }
  }

  let tris = 0;
  parts.forEach((p) => {
    const im = new THREE.InstancedMesh(p.geo, p.mat, n);
    im.name = 'field-' + p.name;
    for (let k = 0; k < n; k++) {
      outM.multiplyMatrices(tiles[k], p.m);
      im.setMatrixAt(k, outM);
    }
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = true;
    im.receiveShadow = true;
    g.add(im);
    const idx = p.geo.index, pos = p.geo.attributes.position;
    tris += (idx ? idx.count / 3 : (pos ? pos.count / 3 : 0)) * n;
  });

  g.userData.fieldStats = {
    tiles: n,
    drawCalls: parts.length,
    naiveDrawCalls: parts.length * n,
    triangles: Math.round(tris),
    protoLod: lod,
    pitch: [+pitchX.toFixed(3), +pitchZ.toFixed(3)],
  };
  return g;
}

export const LAND_GENERATORS = [
  { id: 'land.fence', name: 'Field fence', axes: FENCE_AXES, build: fieldFence, domain: 'world', budgetClass: 'standard' },
  { id: 'land.well', name: 'Well', axes: WELL_AXES, build: well, domain: 'world', budgetClass: 'hero' },
  { id: 'land.graves', name: 'Grave markers', axes: GRAVE_AXES, build: graveMarkers, domain: 'world', budgetClass: 'standard' },
  { id: 'land.beehive', name: 'Beehive / bee bole', axes: BEEHIVE_AXES, build: beehive, domain: 'world', budgetClass: 'standard' },
  { id: 'land.crop', name: 'Crop stand', axes: CROP_AXES, build: cropStand, domain: 'flora', budgetClass: 'hero' },
];
