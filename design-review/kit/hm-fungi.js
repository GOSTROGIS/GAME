/* Fungal, parasitic and canopy growth — parametric families.
 *
 * This module exists because the flora built so far is temperate ridge cover:
 * blackpine, heather, cold reed, wall lichen. A world with a wet lowland and a
 * steam-fed undercroft needs decay and canopy growth as its own vocabulary —
 * things that grow ON other things. Every family here attaches to a host
 * (trunk, root, stone, branch) rather than standing in soil, which is what
 * makes them dressing for existing geometry instead of more standalone props.
 *
 * Axes are structural only: species, tier counts, branch order, spread,
 * breakage. Biome tint and wear are applied downstream by hm-biome.js and are
 * deliberately NOT counted toward the unique total.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const tube = (pts, r, rad = 6) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), Math.max(6, pts.length * 3), r, rad, false);

/* Fungal flesh is matte and never metallic. Hues are pulled toward the kit's
   existing clay / bone / moss anchors so a mushroom sits beside a blackpine
   without introducing a new palette. */
const M = (name, color, rough) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: 0, side: THREE.DoubleSide });
  m.name = name;
  return m;
};
export const FUNGI = {
  cap: M('fungal-cap', '#6b4a3a', 0.88),
  capPale: M('fungal-cap-pale', '#8a7c62', 0.9),
  capDark: M('fungal-cap-dark', '#3b2f2b', 0.9),
  gill: M('fungal-gill', '#a9a291', 0.94),
  stem: M('fungal-stem', '#7d7361', 0.92),
  flesh: M('fungal-flesh', '#5d4a44', 0.9),
  spore: M('spore-dust', '#4a4740', 0.98),
  bracket: M('bracket-shelf', '#4d3b2c', 0.9),
  crust: M('fungal-crust', '#2e2a25', 0.95),
  vine: M('vine-woody', '#3a3227', 0.92),
  leaf: M('canopy-leaf', '#33463a', 0.86),
  leafPale: M('canopy-leaf-pale', '#48594a', 0.88),
  root: M('aerial-root', '#4a3f30', 0.93),
};

/* ---------------------------------------------------------- SHELF FUNGUS */
export const SHELF_AXES = { host: 3, tiers: 4, spread: 3, curl: 3, notch: 2, scale: 3 };
export function shelfFungus(variant = 0) {
  const A = axesOf(variant, SHELF_AXES);
  const rand = rnd(variant * 977 + 13);
  const g = new THREE.Group();
  const s = 0.78 + A.scale * 0.34;
  const hostR = [0.13, 0.21, 0.33][A.host] * s;
  const hostH = [1.15, 1.75, 0.6][A.host] * s;
  const trunk = limb(hostR * 0.9, hostR, hostH, 10, 3);
  jitter(trunk, hostR * 0.14, rand);
  g.add(part(trunk, MAT.pineBark, 'host-trunk', { pos: [0, hostH / 2, 0] }));
  if (A.host === 2) {
    g.add(part(cyl(hostR * 0.95, hostR * 0.95, 0.024, 12), FUNGI.crust, 'cut-face', { pos: [0, hostH, 0] }));
    for (let i = 0; i < 4; i++) g.add(part(ico(hostR * 0.16, 0), FUNGI.crust, 'rot-pocket-' + i, { pos: [(rand() - 0.5) * hostR, hostH - 0.02, (rand() - 0.5) * hostR] }));
  }
  const tiers = 2 + A.tiers;
  for (let i = 0; i < tiers; i++) {
    const t = tiers > 1 ? i / (tiers - 1) : 0;
    const y = hostH * (0.15 + t * 0.68) + (rand() - 0.5) * 0.05;
    const ang = rand() * T;
    const rad = (0.15 + A.spread * 0.075) * s * (0.66 + rand() * 0.55);
    const th = rad * (0.13 + A.curl * 0.045);
    const prof = [[0.012, 0], [rad * 0.46, th * 0.34], [rad * 0.86, th * 0.72], [rad, th * 0.92], [rad * 0.96, th * 1.04], [rad * 0.46, th * 1.1], [0.012, th * 0.88]];
    const cap = lathe(prof, A.notch ? 9 : 15);
    cap.scale(1, 1, 0.52 + A.curl * 0.13);
    const m = part(cap, i % 2 ? FUNGI.bracket : FUNGI.capDark, 'bracket-' + i, {
      pos: [Math.cos(ang) * hostR * 0.85, y, Math.sin(ang) * hostR * 0.85],
      rot: [0.1 + A.curl * 0.12, -ang, 0],
    });
    g.add(m);
    const gill = lathe([[0.01, 0], [rad * 0.5, -th * 0.1], [rad * 0.92, -th * 0.18], [0.01, -th * 0.05]], A.notch ? 9 : 15);
    gill.scale(1, 1, 0.52 + A.curl * 0.13);
    g.add(part(gill, FUNGI.gill, 'gill-' + i, { pos: [Math.cos(ang) * hostR * 0.85, y - 0.004, Math.sin(ang) * hostR * 0.85], rot: [0.1 + A.curl * 0.12, -ang, 0] }));
    if (A.spread > 1) g.add(part(torus(rad * 0.55, th * 0.16, 4, A.notch ? 9 : 14), FUNGI.crust, 'growth-ring-' + i, { pos: [Math.cos(ang) * hostR * 0.9, y + th * 0.9, Math.sin(ang) * hostR * 0.9], rot: [Math.PI / 2 + 0.1, 0, -ang] }));
  }
  return seat(g);
}

/* ------------------------------------------------------ TOADSTOOL CLUSTER */
export const TOADSTOOL_AXES = { species: 5, count: 4, capForm: 3, stemForm: 3, ring: 2, scale: 3 };
export function toadstoolCluster(variant = 0) {
  const A = axesOf(variant, TOADSTOOL_AXES);
  const rand = rnd(variant * 613 + 41);
  const g = new THREE.Group();
  const s = 0.7 + A.scale * 0.4;
  const n = 2 + A.count * 2;
  const capMat = [FUNGI.cap, FUNGI.capPale, FUNGI.capDark, FUNGI.flesh, FUNGI.capPale][A.species];
  const litter = lathe([[0.34 * s, 0], [0.3 * s, 0.012], [0, 0.016]], 12);
  g.add(part(litter, FUNGI.spore, 'litter-mat'));
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * T + rand() * 0.7;
    const dist = rand() * 0.2 * s;
    const h = (0.09 + rand() * 0.16) * s * (0.7 + A.scale * 0.2);
    const cr = h * (0.4 + A.capForm * 0.18);
    const px = Math.cos(ang) * dist;
    const pz = Math.sin(ang) * dist;
    const tilt = (rand() - 0.5) * 0.34;
    const stemR = h * (0.09 + A.stemForm * 0.035);
    const stem = A.stemForm === 2
      ? lathe([[stemR * 1.5, 0], [stemR * 0.9, h * 0.4], [stemR * 0.8, h], [stemR * 0.7, h]], 8)
      : limb(stemR * 0.85, stemR * (A.stemForm ? 1.35 : 1), h, 8, 2);
    lean(stem, tilt * 0.5, tilt * 0.3, 2);
    g.add(part(stem, FUNGI.stem, 'stem-' + i, { pos: [px, A.stemForm === 2 ? 0 : h / 2, pz], rot: [0, ang, 0] }));
    // cap profile: conical, domed, flat-with-lip
    const cp = A.capForm === 0
      ? [[0.004, cr * 0.9], [cr * 0.55, cr * 0.4], [cr, 0], [cr * 0.94, -cr * 0.08], [0.004, -cr * 0.05]]
      : A.capForm === 1
        ? [[0.004, cr * 0.62], [cr * 0.5, cr * 0.5], [cr * 0.9, cr * 0.2], [cr, 0], [cr * 0.9, -cr * 0.12], [0.004, -cr * 0.08]]
        : [[0.004, cr * 0.3], [cr * 0.6, cr * 0.26], [cr, cr * 0.06], [cr * 1.06, -cr * 0.04], [cr * 0.85, -cr * 0.16], [0.004, -cr * 0.1]];
    g.add(part(lathe(cp, 14), capMat, 'cap-' + i, { pos: [px + tilt * h * 0.3, h, pz], rot: [0, rand() * T, tilt * 0.6] }));
    const gills = lathe([[0.004, -cr * 0.02], [cr * 0.5, -cr * 0.1], [cr * 0.9, -cr * 0.16], [cr * 0.92, -cr * 0.14]], 14);
    g.add(part(gills, FUNGI.gill, 'gills-' + i, { pos: [px + tilt * h * 0.3, h - 0.002, pz], rot: [0, 0, tilt * 0.6] }));
    if (A.ring) g.add(part(torus(stemR * 1.9, stemR * 0.4, 4, 10), FUNGI.gill, 'annulus-' + i, { pos: [px, h * 0.66, pz], rot: [Math.PI / 2, 0, 0] }));
    if (A.species === 4) for (let w = 0; w < 5; w++) {
      const wa = rand() * T, wr = rand() * cr * 0.8;
      g.add(part(ico(cr * 0.07, 0), FUNGI.gill, 'wart-' + i + '-' + w, { pos: [px + Math.cos(wa) * wr, h + cr * (A.capForm === 0 ? 0.42 : 0.3), pz + Math.sin(wa) * wr] }));
    }
  }
  return seat(g);
}

/* --------------------------------------------------------- PUFFBALL COLONY */
export const PUFFBALL_AXES = { count: 4, size: 4, burst: 3, crust: 3, cluster: 2, scale: 2 };
export function puffballColony(variant = 0) {
  const A = axesOf(variant, PUFFBALL_AXES);
  const rand = rnd(variant * 331 + 7);
  const g = new THREE.Group();
  const s = 0.8 + A.scale * 0.45;
  const n = 2 + A.count * 2;
  const base = 0.05 + A.size * 0.045;
  g.add(part(lathe([[0.3 * s, 0], [0.27 * s, 0.01], [0, 0.014]], 12), FUNGI.spore, 'mycelium-mat'));
  for (let i = 0; i < n; i++) {
    const ang = A.cluster ? (i / n) * T * 0.4 + rand() * 0.3 : rand() * T;
    const dist = rand() * (A.cluster ? 0.1 : 0.22) * s;
    const r = base * s * (0.6 + rand() * 0.7);
    const burst = i < A.burst;
    const px = Math.cos(ang) * dist, pz = Math.sin(ang) * dist;
    if (burst) {
      const cup = lathe([[r * 0.28, 0], [r * 0.9, r * 0.5], [r, r * 0.95], [r * 0.86, r], [r * 0.8, r * 0.6], [r * 0.2, r * 0.1]], 12);
      jitter(cup, r * 0.1, rand);
      g.add(part(cup, FUNGI.crust, 'burst-cup-' + i, { pos: [px, 0, pz] }));
      g.add(part(lathe([[r * 0.7, 0], [r * 0.4, r * 0.1], [0, r * 0.14]], 10), FUNGI.spore, 'spore-mass-' + i, { pos: [px, r * 0.35, pz] }));
    } else {
      const b = ico(r, A.crust > 1 ? 2 : 1);
      jitter(b, r * (0.06 + A.crust * 0.05), rand);
      b.scale(1, 0.82 + rand() * 0.24, 1);
      g.add(part(b, i % 3 === 0 ? FUNGI.capPale : FUNGI.flesh, 'puffball-' + i, { pos: [px, r * 0.78, pz] }));
      g.add(part(cyl(r * 0.34, r * 0.5, r * 0.3, 8), FUNGI.stem, 'foot-' + i, { pos: [px, r * 0.15, pz] }));
      if (A.crust === 2) for (let k = 0; k < 6; k++) {
        const ka = rand() * T, kp = rand() * Math.PI * 0.4;
        g.add(part(cone(r * 0.1, r * 0.16, 4), FUNGI.crust, 'scale-' + i + '-' + k, {
          pos: [px + Math.cos(ka) * r * 0.8, r * 0.78 + Math.cos(kp) * r * 0.7, pz + Math.sin(ka) * r * 0.8],
          rot: [kp, ka, 0],
        }));
      }
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------ CORAL FUNGUS */
export const CORAL_AXES = { order: 3, splits: 4, density: 3, tipForm: 3, lean: 2, scale: 3 };
export function coralFungus(variant = 0) {
  const A = axesOf(variant, CORAL_AXES);
  const rand = rnd(variant * 449 + 29);
  const g = new THREE.Group();
  const s = 0.7 + A.scale * 0.38;
  const H = (0.14 + A.density * 0.05) * s;
  let idx = 0;
  const grow = (x, y, z, dir, len, r, depth) => {
    const tipx = x + dir[0] * len, tipy = y + len, tipz = z + dir[2] * len;
    const seg = tube([[x, y, z], [x + dir[0] * len * 0.4, y + len * 0.45, z + dir[2] * len * 0.4], [tipx, tipy, tipz]], r, 5);
    g.add(part(seg, depth === 0 ? FUNGI.stem : FUNGI.capPale, 'branch-' + idx++, {}));
    if (depth >= 1 + A.order) {
      if (A.tipForm === 0) g.add(part(ico(r * 1.5, 1), FUNGI.gill, 'tip-knob-' + idx, { pos: [tipx, tipy, tipz] }));
      else if (A.tipForm === 1) g.add(part(cone(r * 1.3, r * 4, 5), FUNGI.gill, 'tip-spike-' + idx, { pos: [tipx, tipy + r * 2, tipz] }));
      else for (let f = 0; f < 3; f++) {
        const fa = (f / 3) * T + rand();
        g.add(part(cone(r * 0.7, r * 3, 4), FUNGI.gill, 'tip-fork-' + idx + '-' + f, { pos: [tipx + Math.cos(fa) * r, tipy + r * 1.4, tipz + Math.sin(fa) * r], rot: [0.3, fa, 0] }));
      }
      return;
    }
    const k = 2 + (A.splits > 2 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      const a = (i / k) * T + rand() * 1.2;
      const spread = 0.3 + A.splits * 0.09;
      grow(tipx, tipy, tipz, [Math.cos(a) * spread + (A.lean ? 0.14 : 0), 1, Math.sin(a) * spread], len * 0.72, r * 0.74, depth + 1);
    }
  };
  const trunks = 1 + A.density;
  for (let t = 0; t < trunks; t++) {
    const ta = (t / trunks) * T + rand();
    const td = rand() * 0.05 * s;
    grow(Math.cos(ta) * td, 0, Math.sin(ta) * td, [0, 1, 0], H, 0.014 * s, 0);
  }
  g.add(part(lathe([[0.13 * s, 0], [0.1 * s, 0.012], [0, 0.016]], 10), FUNGI.spore, 'base-pad'));
  return seat(g);
}

/* -------------------------------------------------------------- SPORE STALK */
export const SPORESTALK_AXES = { height: 4, headForm: 4, collar: 3, rings: 3, lean: 2, scale: 2 };
export function sporeStalk(variant = 0) {
  const A = axesOf(variant, SPORESTALK_AXES);
  const rand = rnd(variant * 727 + 53);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.4;
  const H = (0.24 + A.height * 0.13) * s;
  const r = H * 0.045;
  const stalk = limb(r * 0.7, r * 1.5, H, 9, 5);
  if (A.lean) lean(stalk, 0.1, 0.05, 2);
  jitter(stalk, r * 0.16, rand);
  g.add(part(stalk, FUNGI.stem, 'stalk', { pos: [0, H / 2, 0] }));
  g.add(part(lathe([[r * 2.6, 0], [r * 2.1, r * 0.6], [r * 1.4, r * 1.1], [r * 1.5, r * 1.2]], 10), FUNGI.crust, 'volva', { pos: [0, 0, 0] }));
  const hy = H * (A.lean ? 0.98 : 1);
  const hx = A.lean ? H * 0.06 : 0;
  const hr = r * (2.4 + A.headForm * 0.7);
  if (A.headForm === 0) g.add(part(lathe([[0.004, hr * 2.4], [hr * 0.7, hr * 1.4], [hr, hr * 0.4], [hr * 0.8, 0], [0.004, -hr * 0.1]], 12), FUNGI.flesh, 'club-head', { pos: [hx, hy, 0] }));
  else if (A.headForm === 1) { const b = ico(hr, 2); jitter(b, hr * 0.1, rand); g.add(part(b, FUNGI.capDark, 'ball-head', { pos: [hx, hy + hr * 0.8, 0] })); }
  else if (A.headForm === 2) g.add(part(cone(hr * 0.8, hr * 3.4, 9, 3), FUNGI.cap, 'spike-head', { pos: [hx, hy + hr * 1.7, 0] }));
  else for (let i = 0; i < 7; i++) {
    const a = (i / 7) * T;
    g.add(part(tube([[hx, hy, 0], [hx + Math.cos(a) * hr, hy + hr * 0.8, Math.sin(a) * hr], [hx + Math.cos(a) * hr * 1.5, hy - hr * 0.4, Math.sin(a) * hr * 1.5]], r * 0.4, 4), FUNGI.gill, 'tassel-' + i, {}));
  }
  for (let i = 0; i < A.collar; i++) g.add(part(torus(r * (2 + i * 0.4), r * 0.4, 4, 11), FUNGI.gill, 'collar-' + i, { pos: [0, H * (0.5 + i * 0.12), 0], rot: [Math.PI / 2, 0, 0] }));
  for (let i = 0; i < A.rings; i++) g.add(part(torus(r * 1.7, r * 0.22, 3, 9), FUNGI.crust, 'scar-ring-' + i, { pos: [0, H * (0.18 + i * 0.1), 0], rot: [Math.PI / 2, 0, 0] }));
  return seat(g);
}

/* ------------------------------------------------------------------ MOLD MAT */
export const MOLDMAT_AXES = { extent: 4, lobes: 4, thickness: 3, fringe: 3, holes: 2, pustule: 2 };
export function moldMat(variant = 0) {
  const A = axesOf(variant, MOLDMAT_AXES);
  const rand = rnd(variant * 197 + 61);
  const g = new THREE.Group();
  const R = 0.16 + A.extent * 0.11;
  const th = 0.008 + A.thickness * 0.009;
  const lobes = 3 + A.lobes;
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * T + rand() * 0.5;
    const d = R * (0.2 + rand() * 0.6);
    const lr = R * (0.3 + rand() * 0.35);
    if (A.holes && i % 3 === 2) continue;
    const blob = lathe([[lr, 0], [lr * 0.95, th * 0.6], [lr * 0.7, th], [lr * 0.3, th * 1.15], [0, th * 1.2]], 11);
    jitter(blob, lr * 0.09, rand);
    g.add(part(blob, i % 2 ? FUNGI.spore : FUNGI.capPale, 'lobe-' + i, { pos: [Math.cos(a) * d, 0, Math.sin(a) * d] }));
    if (A.fringe) for (let f = 0; f < 3 + A.fringe * 2; f++) {
      const fa = rand() * T;
      g.add(part(cone(th * 0.5, th * (1.6 + A.fringe * 0.6), 4), FUNGI.gill, 'fringe-' + i + '-' + f, {
        pos: [Math.cos(a) * d + Math.cos(fa) * lr * 0.9, th * 0.6, Math.sin(a) * d + Math.sin(fa) * lr * 0.9],
        rot: [Math.PI * 0.42, fa, 0],
      }));
    }
    if (A.pustule) for (let p = 0; p < 4; p++) {
      const pa = rand() * T, pd = rand() * lr * 0.7;
      g.add(part(ico(th * 0.8, 1), FUNGI.flesh, 'pustule-' + i + '-' + p, { pos: [Math.cos(a) * d + Math.cos(pa) * pd, th * 1.1, Math.sin(a) * d + Math.sin(pa) * pd] }));
    }
  }
  return seat(g);
}

/* --------------------------------------------------------------- ROOT TUMOUR */
export const TUMOUR_AXES = { size: 4, lobes: 4, split: 3, crust: 3, roots: 3, scale: 2 };
export function rootTumour(variant = 0) {
  const A = axesOf(variant, TUMOUR_AXES);
  const rand = rnd(variant * 859 + 17);
  const g = new THREE.Group();
  const s = 0.8 + A.scale * 0.45;
  const R = (0.1 + A.size * 0.055) * s;
  const core = ico(R, 2);
  jitter(core, R * 0.2, rand);
  core.scale(1, 0.82, 0.94);
  g.add(part(core, FUNGI.root, 'gall-core', { pos: [0, R * 0.85, 0] }));
  for (let i = 0; i < 1 + A.lobes; i++) {
    const a = rand() * T, e = rand() * 0.9;
    const lr = R * (0.35 + rand() * 0.4);
    const b = ico(lr, 1);
    jitter(b, lr * 0.24, rand);
    g.add(part(b, i % 2 ? FUNGI.flesh : FUNGI.root, 'lobe-' + i, { pos: [Math.cos(a) * R * 0.8, R * 0.85 + Math.sin(e) * R * 0.6, Math.sin(a) * R * 0.8] }));
  }
  for (let i = 0; i < A.split; i++) {
    const a = rand() * T;
    g.add(part(box(R * 0.06, R * 1.3, R * 0.5, 1, 3, 1), FUNGI.crust, 'fissure-' + i, { pos: [Math.cos(a) * R * 0.8, R * 0.9, Math.sin(a) * R * 0.8], rot: [0, -a, 0.2] }));
  }
  if (A.crust) for (let i = 0; i < A.crust * 4; i++) {
    const a = rand() * T, e = rand() * Math.PI * 0.5;
    g.add(part(lathe([[R * 0.16, 0], [R * 0.12, R * 0.06], [0, R * 0.08]], 6), FUNGI.crust, 'crust-plate-' + i, {
      pos: [Math.cos(a) * Math.cos(e) * R, R * 0.85 + Math.sin(e) * R * 0.8, Math.sin(a) * Math.cos(e) * R],
      rot: [e, a, 0],
    }));
  }
  const roots = 2 + A.roots * 2;
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * T + rand() * 0.4;
    const L = R * (1.2 + rand() * 1.1);
    g.add(part(tube([[Math.cos(a) * R * 0.6, R * 0.4, Math.sin(a) * R * 0.6], [Math.cos(a) * (R + L * 0.5), R * 0.12, Math.sin(a) * (R + L * 0.5)], [Math.cos(a) * (R + L), 0.006, Math.sin(a) * (R + L)]], R * 0.09, 5), FUNGI.root, 'root-' + i, {}));
  }
  return seat(g);
}

/* ---------------------------------------------------------- HANGING MOSS */
export const HANGMOSS_AXES = { width: 4, length: 4, density: 4, gaps: 3, anchor: 2, strand: 2 };
export function hangingMoss(variant = 0) {
  const A = axesOf(variant, HANGMOSS_AXES);
  const rand = rnd(variant * 383 + 71);
  const g = new THREE.Group();
  const W = 0.3 + A.width * 0.28;
  const L = 0.35 + A.length * 0.4;
  const branch = limb(0.028, 0.038, W * 1.15, 8, 3);
  jitter(branch, 0.006, rand);
  g.add(part(branch, MAT.pineBark, 'host-branch', { pos: [0, L + 0.05, 0], rot: [0, 0, Math.PI / 2] }));
  if (A.anchor) {
    g.add(part(limb(0.014, 0.022, W * 0.5, 6, 2), MAT.pineBark, 'host-twig', { pos: [W * 0.35, L + 0.11, 0.04], rot: [0, 0.4, 1.1] }));
    g.add(part(cone(0.02, 0.05, 5), FUNGI.leaf, 'twig-tuft', { pos: [W * 0.55, L + 0.16, 0.06] }));
  }
  const n = 5 + A.density * 5;
  for (let i = 0; i < n; i++) {
    if (A.gaps && i % (5 - A.gaps) === 0) continue;
    const x = -W / 2 + (W / (n - 1)) * i + (rand() - 0.5) * 0.02;
    const z = (rand() - 0.5) * 0.05;
    const len = L * (0.35 + rand() * 0.65);
    const sway = (rand() - 0.5) * 0.09;
    const r = 0.0055 + rand() * 0.005;
    const pts = [[x, L + 0.03, z], [x + sway * 0.4, L - len * 0.4, z + sway * 0.2], [x + sway, L - len * 0.86, z + sway * 0.5], [x + sway * 1.25, L - len, z + sway * 0.7]];
    g.add(part(tube(pts, r, A.strand ? 5 : 4), i % 3 === 0 ? FUNGI.leafPale : MAT.graveMoss, 'strand-' + i, {}));
    if (A.strand) {
      const tufts = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < tufts; k++) {
        const t = 0.3 + (k / tufts) * 0.6;
        g.add(part(cone(r * 2.4, r * 7, 4), MAT.graveMoss, 'tuft-' + i + '-' + k, { pos: [x + sway * t, L + 0.03 - len * t, z + sway * t * 0.6], rot: [rand(), rand() * T, 0] }));
      }
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- LIANA BUNDLE */
export const LIANA_AXES = { strands: 4, twist: 3, loops: 3, span: 4, leaf: 3, scale: 2 };
export function lianaBundle(variant = 0) {
  const A = axesOf(variant, LIANA_AXES);
  const rand = rnd(variant * 541 + 83);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.35;
  const H = (0.9 + A.span * 0.45) * s;
  const n = 1 + A.strands;
  for (let i = 0; i < n; i++) {
    const phase = (i / n) * T + rand();
    const amp = (0.03 + A.twist * 0.035) * s;
    const pts = [];
    for (let k = 0; k <= 7; k++) {
      const t = k / 7;
      const a = phase + t * (1.6 + A.twist * 1.7);
      pts.push([Math.cos(a) * amp * (0.4 + t * 0.8), t * H, Math.sin(a) * amp * (0.4 + t * 0.8)]);
    }
    g.add(part(tube(pts, (0.011 + rand() * 0.007) * s, 6), FUNGI.vine, 'liana-' + i, {}));
    if (A.leaf) {
      const leaves = 2 + A.leaf * 3;
      for (let k = 0; k < leaves; k++) {
        const t = 0.15 + rand() * 0.8;
        const a = phase + t * (1.6 + A.twist * 1.7);
        const px = Math.cos(a) * amp * (0.4 + t * 0.8), pz = Math.sin(a) * amp * (0.4 + t * 0.8);
        const lf = box(0.05 * s, 0.004, 0.024 * s, 2, 1, 1);
        g.add(part(lf, k % 2 ? FUNGI.leaf : FUNGI.leafPale, 'leaf-' + i + '-' + k, { pos: [px + Math.cos(a) * 0.028 * s, t * H, pz + Math.sin(a) * 0.028 * s], rot: [rand() * 0.5, a, 0.3] }));
      }
    }
  }
  for (let i = 0; i < A.loops; i++) {
    const y = H * (0.25 + i * 0.24);
    const lr = (0.05 + rand() * 0.05) * s;
    g.add(part(torus(lr, 0.01 * s, 5, 12, T * 0.72), FUNGI.vine, 'loop-' + i, { pos: [(rand() - 0.5) * 0.05, y, (rand() - 0.5) * 0.05], rot: [1.2 + rand() * 0.4, rand() * T, 0] }));
  }
  g.add(part(cyl(0.05 * s, 0.07 * s, 0.05 * s, 9), MAT.pineBark, 'host-stub', { pos: [0, 0.025 * s, 0] }));
  return seat(g);
}

/* ------------------------------------------------------------ BUTTRESS ROOT */
export const BUTTRESS_AXES = { fins: 4, height: 3, flare: 3, gnarl: 3, hollow: 2, scale: 3 };
export function buttressRoot(variant = 0) {
  const A = axesOf(variant, BUTTRESS_AXES);
  const rand = rnd(variant * 1091 + 97);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.4;
  const H = (0.7 + A.height * 0.45) * s;
  const coreR = 0.16 * s;
  const trunk = limb(coreR * 0.8, coreR * 1.25, H, 11, 4);
  jitter(trunk, coreR * (0.08 + A.gnarl * 0.05), rand);
  g.add(part(trunk, MAT.pineBark, 'trunk-core', { pos: [0, H / 2, 0] }));
  const fins = 3 + A.fins;
  for (let i = 0; i < fins; i++) {
    const a = (i / fins) * T + rand() * 0.3;
    const reach = coreR * (1.6 + A.flare * 0.7) * (0.75 + rand() * 0.5);
    const fh = H * (0.32 + rand() * 0.24);
    const fin = box(reach, fh, 0.05 * s, 3, 4, 1);
    const p = fin.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const tx = (p.getX(v) + reach / 2) / reach;
      const ty = (p.getY(v) + fh / 2) / fh;
      p.setY(v, p.getY(v) * (1 - tx * 0.82));
      p.setZ(v, p.getZ(v) * (1 + (1 - ty) * (0.6 + A.flare * 0.5)));
    }
    p.needsUpdate = true;
    fin.computeVertexNormals();
    jitter(fin, 0.012 * (1 + A.gnarl) * s, rand);
    g.add(part(fin, MAT.pineBark, 'buttress-fin-' + i, { pos: [Math.cos(a) * reach * 0.5, fh / 2, Math.sin(a) * reach * 0.5], rot: [0, -a, 0] }));
    const toe = ico(0.045 * s, 1);
    jitter(toe, 0.014 * s, rand);
    g.add(part(toe, FUNGI.root, 'root-toe-' + i, { pos: [Math.cos(a) * reach, 0.022 * s, Math.sin(a) * reach] }));
    if (A.gnarl > 1) g.add(part(tube([[Math.cos(a) * reach * 0.9, 0.03 * s, Math.sin(a) * reach * 0.9], [Math.cos(a + 0.4) * reach * 1.3, 0.02 * s, Math.sin(a + 0.4) * reach * 1.3], [Math.cos(a + 0.8) * reach * 1.7, 0.01 * s, Math.sin(a + 0.8) * reach * 1.7]], 0.016 * s, 5), FUNGI.root, 'surface-root-' + i, {}));
  }
  if (A.hollow) {
    const a = rand() * T;
    g.add(part(lathe([[0.02, 0], [0.075 * s, 0.05], [0.08 * s, 0.16], [0.03, 0.22]], 9), FUNGI.crust, 'hollow-mouth', { pos: [Math.cos(a) * coreR * 0.95, H * 0.12, Math.sin(a) * coreR * 0.95], rot: [1.5, 0, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------- EPIPHYTE CLUMP */
export const EPIPHYTE_AXES = { species: 4, rosettes: 4, spike: 3, pups: 3, tilt: 2, scale: 2 };
export function epiphyteClump(variant = 0) {
  const A = axesOf(variant, EPIPHYTE_AXES);
  const rand = rnd(variant * 673 + 11);
  const g = new THREE.Group();
  const s = 0.8 + A.scale * 0.45;
  const mount = lathe([[0.11 * s, 0], [0.1 * s, 0.03], [0.06 * s, 0.05]], 10);
  jitter(mount, 0.01 * s, rand);
  g.add(part(mount, MAT.pineBark, 'bark-mount'));
  const rosettes = 1 + A.rosettes;
  for (let ri = 0; ri < rosettes; ri++) {
    const ra = (ri / rosettes) * T + rand() * 0.6;
    const rd = ri === 0 ? 0 : 0.05 * s * (0.6 + rand() * 0.6);
    const cx = Math.cos(ra) * rd, cz = Math.sin(ra) * rd;
    const leaves = 6 + A.species * 2;
    const LL = (0.1 + A.species * 0.03) * s * (ri === 0 ? 1 : 0.7);
    for (let i = 0; i < leaves; i++) {
      const a = (i / leaves) * T + rand() * 0.25;
      const arch = A.tilt ? 0.75 : 0.45;
      const lf = A.species === 3
        ? tube([[cx, 0.05, cz], [cx + Math.cos(a) * LL * 0.5, 0.05 + LL * 0.7, cz + Math.sin(a) * LL * 0.5], [cx + Math.cos(a) * LL, 0.05 + LL * arch, cz + Math.sin(a) * LL]], 0.005 * s, 4)
        : box(0.016 * s, 0.004, LL, 1, 1, 3);
      if (A.species !== 3) {
        const p = lf.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = (p.getZ(v) + LL / 2) / LL;
          p.setX(v, p.getX(v) * (1 - t * 0.75));
          p.setY(v, p.getY(v) + Math.sin(t * Math.PI) * LL * 0.12 * (A.tilt ? 1 : 0.4));
        }
        p.needsUpdate = true;
        lf.computeVertexNormals();
      }
      g.add(part(lf, i % 3 === 0 ? FUNGI.leafPale : FUNGI.leaf, 'leaf-' + ri + '-' + i, {
        pos: A.species === 3 ? [0, 0, 0] : [cx + Math.cos(a) * LL * 0.5, 0.055 + LL * 0.1, cz + Math.sin(a) * LL * 0.5],
        rot: A.species === 3 ? [0, 0, 0] : [0, -a + Math.PI / 2, -0.35 - A.tilt * 0.2],
      }));
    }
  }
  if (A.spike) {
    const sh = (0.07 + A.spike * 0.05) * s;
    g.add(part(limb(0.006 * s, 0.009 * s, sh, 6, 2), FUNGI.stem, 'spike-stem', { pos: [0, 0.05 + sh / 2, 0] }));
    for (let i = 0; i < 3 + A.spike * 2; i++) {
      const a = rand() * T;
      g.add(part(cone(0.011 * s, 0.026 * s, 5), FUNGI.flesh, 'bract-' + i, { pos: [Math.cos(a) * 0.012 * s, 0.05 + sh * (0.35 + rand() * 0.6), Math.sin(a) * 0.012 * s], rot: [1.1, a, 0] }));
    }
  }
  for (let i = 0; i < A.pups; i++) {
    const a = rand() * T;
    g.add(part(cone(0.018 * s, 0.04 * s, 6), FUNGI.leaf, 'pup-' + i, { pos: [Math.cos(a) * 0.085 * s, 0.045, Math.sin(a) * 0.085 * s], rot: [0.3, a, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------- PITCHER PLANT */
export const PITCHER_AXES = { count: 4, form: 3, lid: 3, height: 3, mouth: 3, scale: 2 };
export function pitcherPlant(variant = 0) {
  const A = axesOf(variant, PITCHER_AXES);
  const rand = rnd(variant * 787 + 19);
  const g = new THREE.Group();
  const s = 0.8 + A.scale * 0.45;
  g.add(part(lathe([[0.09 * s, 0], [0.075 * s, 0.014], [0, 0.02]], 11), FUNGI.spore, 'peat-pad'));
  const n = 2 + A.count;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * T + rand() * 0.5;
    const d = 0.03 * s * (0.4 + rand() * 0.9);
    const H = (0.09 + A.height * 0.05) * s * (0.7 + rand() * 0.5);
    const R = H * (0.2 + A.form * 0.06);
    const px = Math.cos(a) * d, pz = Math.sin(a) * d;
    const prof = A.form === 0
      ? [[R * 0.2, 0], [R * 0.85, H * 0.25], [R, H * 0.55], [R * 0.72, H * 0.9], [R * 0.8, H]]
      : A.form === 1
        ? [[R * 0.25, 0], [R * 0.6, H * 0.3], [R * 0.95, H * 0.62], [R * 1.05, H * 0.86], [R * 0.95, H]]
        : [[R * 0.3, 0], [R, H * 0.2], [R * 0.62, H * 0.5], [R * 0.7, H * 0.82], [R * 0.86, H]];
    g.add(part(lathe(prof, 13), i % 2 ? FUNGI.flesh : FUNGI.cap, 'pitcher-' + i, { pos: [px, 0, pz], rot: [0, a, 0] }));
    g.add(part(torus(R * (0.82 + A.mouth * 0.08), R * 0.09, 4, 13), FUNGI.gill, 'peristome-' + i, { pos: [px, H, pz] }));
    if (A.mouth > 1) g.add(part(lathe([[R * 0.78, 0], [R * 0.5, -H * 0.1], [0, -H * 0.14]], 12), FUNGI.spore, 'fluid-' + i, { pos: [px, H - H * 0.06, pz] }));
    if (A.lid) {
      const lidR = R * (0.9 + A.lid * 0.15);
      const lid = lathe([[0.004, 0], [lidR * 0.6, lidR * 0.1], [lidR, lidR * 0.06], [lidR * 0.9, 0]], 12);
      g.add(part(lid, FUNGI.capPale, 'lid-' + i, { pos: [px - Math.cos(a) * R * 0.5, H + R * 0.24, pz - Math.sin(a) * R * 0.5], rot: [0, a, -0.5 - A.lid * 0.18] }));
    }
    const stem = tube([[px, 0.01, pz], [px * 1.9, H * 0.12, pz * 1.9], [px * 2.6, 0.012, pz * 2.6]], R * 0.12, 5);
    g.add(part(stem, FUNGI.vine, 'tendril-' + i, {}));
  }
  return seat(g);
}

/* ------------------------------------------------------------ STRANGLER CAGE */
export const STRANGLER_AXES = { ribs: 4, gaps: 3, host: 3, height: 3, crown: 3, hollow: 2 };
export function stranglerCage(variant = 0) {
  const A = axesOf(variant, STRANGLER_AXES);
  const rand = rnd(variant * 1279 + 23);
  const g = new THREE.Group();
  const H = 1.5 + A.height * 0.75;
  const R = 0.2 + A.host * 0.09;
  if (!A.hollow) {
    const host = limb(R * 0.55, R * 0.78, H * 0.92, 10, 3);
    jitter(host, R * 0.1, rand);
    g.add(part(host, FUNGI.crust, 'dead-host', { pos: [0, H * 0.46, 0] }));
  }
  const ribs = 4 + A.ribs * 2;
  for (let i = 0; i < ribs; i++) {
    if (A.gaps && i % (5 - A.gaps) === 0) continue;
    const a0 = (i / ribs) * T;
    const twist = 0.5 + rand() * 1.4;
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const a = a0 + t * twist;
      const rr = R * (1 - t * 0.28) * (0.9 + Math.sin(t * 5 + i) * 0.1);
      pts.push([Math.cos(a) * rr, t * H, Math.sin(a) * rr]);
    }
    g.add(part(tube(pts, R * (0.1 - A.ribs * 0.012), 6), FUNGI.vine, 'rib-' + i, {}));
    const flare = ico(R * 0.14, 1);
    jitter(flare, R * 0.05, rand);
    g.add(part(flare, FUNGI.root, 'rib-foot-' + i, { pos: [Math.cos(a0) * R, R * 0.07, Math.sin(a0) * R] }));
  }
  for (let i = 0; i < 2 + A.host; i++) {
    const y = H * (0.2 + i * 0.2);
    g.add(part(torus(R * (0.95 - i * 0.06), R * 0.055, 5, 14, T * (0.55 + rand() * 0.4)), FUNGI.vine, 'girdle-' + i, { pos: [0, y, 0], rot: [Math.PI / 2, 0, rand() * T] }));
  }
  const crown = 2 + A.crown * 2;
  for (let i = 0; i < crown; i++) {
    const a = (i / crown) * T + rand() * 0.4;
    const reach = R * (1.2 + rand() * 0.9);
    g.add(part(tube([[Math.cos(a) * R * 0.6, H, Math.sin(a) * R * 0.6], [Math.cos(a) * reach, H + R * 0.5, Math.sin(a) * reach], [Math.cos(a) * reach * 1.4, H + R * 0.35, Math.sin(a) * reach * 1.4]], R * 0.05, 5), FUNGI.vine, 'crown-limb-' + i, {}));
    for (let k = 0; k < 3; k++) g.add(part(box(0.075, 0.005, 0.036, 2, 1, 1), k % 2 ? FUNGI.leaf : FUNGI.leafPale, 'crown-leaf-' + i + '-' + k, {
      pos: [Math.cos(a) * reach * (1 + k * 0.16), H + R * (0.42 - k * 0.04), Math.sin(a) * reach * (1 + k * 0.16)],
      rot: [rand() * 0.6, a, 0.25],
    }));
  }
  return seat(g);
}

export const FUNGI_GENERATORS = [
  { id: 'fungi.shelf', name: 'Shelf fungus, on host', axes: SHELF_AXES, build: shelfFungus, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.toadstool', name: 'Toadstool cluster', axes: TOADSTOOL_AXES, build: toadstoolCluster, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.puffball', name: 'Puffball colony', axes: PUFFBALL_AXES, build: puffballColony, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.coral', name: 'Coral fungus', axes: CORAL_AXES, build: coralFungus, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.spore-stalk', name: 'Spore stalk', axes: SPORESTALK_AXES, build: sporeStalk, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.mold-mat', name: 'Mould mat', axes: MOLDMAT_AXES, build: moldMat, domain: 'flora', budgetClass: 'minor' },
  { id: 'fungi.root-tumour', name: 'Root tumour', axes: TUMOUR_AXES, build: rootTumour, domain: 'flora', budgetClass: 'minor' },
  { id: 'flora.hanging-moss', name: 'Hanging moss curtain', axes: HANGMOSS_AXES, build: hangingMoss, domain: 'flora', budgetClass: 'standard' },
  { id: 'flora.liana', name: 'Liana bundle', axes: LIANA_AXES, build: lianaBundle, domain: 'flora', budgetClass: 'standard' },
  { id: 'flora.buttress-root', name: 'Buttress root mass', axes: BUTTRESS_AXES, build: buttressRoot, domain: 'flora', budgetClass: 'standard' },
  { id: 'flora.epiphyte', name: 'Epiphyte clump', axes: EPIPHYTE_AXES, build: epiphyteClump, domain: 'flora', budgetClass: 'minor' },
  { id: 'flora.pitcher', name: 'Pitcher plant', axes: PITCHER_AXES, build: pitcherPlant, domain: 'flora', budgetClass: 'minor' },
  { id: 'flora.strangler', name: 'Strangler cage', axes: STRANGLER_AXES, build: stranglerCage, domain: 'flora', budgetClass: 'hero' },
];
