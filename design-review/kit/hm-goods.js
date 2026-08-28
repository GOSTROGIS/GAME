/* Trade goods, consumables and records — parametric families.
 *
 * The gap this closes: the world had furniture and containers but nothing to
 * put IN them. A market stall with no sacks, an apothecary with no vials and a
 * ledger house with no ledgers all read as unfinished no matter how good the
 * building is. These are the small-object layer — the things a player walks up
 * to, and the things a looting system needs a mesh for.
 *
 * Grounded in the world's own economy: Hearthmere keeps clay name tablets and
 * an ember ledger, so records are clay, wax and tallow rather than parchment
 * and gold. Cinderward is a foundry, so ingots and reagent crates belong to it.
 * Nothing here is a generic treasure chest of coins.
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
/* Glass is the one transparent material in the kit. It is declared here rather
   than in hm-core because OBJ export drops alpha — the download is a solid
   vessel, which is the honest result and is noted in the install doc. */
export const GOODS = {
  glass: M('vial-glass', '#5f7a80', 0.14, 0.02, { transparent: true, opacity: 0.5 }),
  glassGreen: M('vial-glass-green', '#4a6350', 0.16, 0.02, { transparent: true, opacity: 0.55 }),
  tincture: M('tincture', '#5c3a2e', 0.3, 0.0),
  tinctureAsh: M('tincture-ash', '#4b5150', 0.32, 0.0),
  cork: M('cork-stopper', '#7d6242', 0.92, 0.0),
  wax: M('seal-wax', '#6e2525', 0.6, 0.0),
  tallow: M('tallow', '#a9a291', 0.78, 0.0),
  linen: M('sack-linen', '#7b7466', 0.95, 0.0, { side: THREE.DoubleSide }),
  linenDark: M('sack-linen-dark', '#5b5347', 0.95, 0.0, { side: THREE.DoubleSide }),
  crust: M('bread-crust', '#6b4a2c', 0.9, 0.0),
  crumb: M('bread-crumb', '#8a7c62', 0.92, 0.0),
  rind: M('cheese-rind', '#7e7042', 0.86, 0.0),
  cured: M('cured-meat', '#4e2a26', 0.82, 0.0),
  fish: M('dried-fish', '#6a6a5c', 0.8, 0.0),
  fruit: M('bruised-fruit', '#4a3a30', 0.78, 0.0),
  parch: M('parchment', '#9a9080', 0.94, 0.0, { side: THREE.DoubleSide }),
  leather: M('book-leather', '#3d2f26', 0.9, 0.01),
  ink: M('iron-gall-ink', '#1b1e21', 0.5, 0.0),
  gem: M('cut-gem', '#3c5157', 0.1, 0.1, { transparent: true, opacity: 0.75 }),
  gemWarm: M('cut-gem-warm', '#6b4326', 0.12, 0.1, { transparent: true, opacity: 0.75 }),
  straw: M('packing-straw', '#6d6549', 0.95, 0.0),
};

/* ------------------------------------------------------------------- VIALS */
export const VIAL_AXES = { vessel: 5, stopper: 3, fill: 3, label: 2, rack: 3, count: 3 };
export function alchemicalVials(variant = 0) {
  const A = axesOf(variant, VIAL_AXES);
  const rand = rnd(variant * 419 + 3);
  const g = new THREE.Group();
  const n = 1 + A.count * 2;
  const spacing = 0.052;
  if (A.rack) {
    const W = spacing * n + 0.03;
    g.add(part(box(W, 0.014, 0.075), MAT.darkOak, 'rack-base', { pos: [0, 0.007, 0] }));
    if (A.rack > 1) {
      g.add(part(box(W, 0.05, 0.008), MAT.darkOak, 'rack-back', { pos: [0, 0.032, -0.033] }));
      for (let i = 0; i < n; i++) g.add(part(torus(0.014, 0.0035, 4, 10), MAT.pittedIron, 'rack-hoop-' + i, { pos: [-spacing * (n - 1) / 2 + i * spacing, 0.046, -0.028], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  for (let i = 0; i < n; i++) {
    const x = -spacing * (n - 1) / 2 + i * spacing;
    const H = 0.05 + (A.vessel === 4 ? 0.05 : 0.02) + rand() * 0.02;
    const R = 0.011 + (A.vessel === 1 ? 0.008 : 0.003);
    const prof = A.vessel === 0
      ? [[R * 0.6, 0], [R, H * 0.12], [R, H * 0.78], [R * 0.5, H * 0.9], [R * 0.55, H]]
      : A.vessel === 1
        ? [[R * 0.35, 0], [R, H * 0.35], [R * 0.95, H * 0.6], [R * 0.32, H * 0.86], [R * 0.36, H]]
        : A.vessel === 2
          ? [[R * 0.9, 0], [R * 0.95, H * 0.7], [R * 0.7, H * 0.82], [R * 0.42, H * 0.94], [R * 0.46, H]]
          : A.vessel === 3
            ? [[R * 0.5, 0], [R * 0.85, H * 0.2], [R * 0.7, H * 0.5], [R * 0.95, H * 0.72], [R * 0.4, H * 0.92], [R * 0.44, H]]
            : [[R * 0.4, 0], [R * 0.7, H * 0.08], [R * 0.62, H * 0.85], [R * 0.3, H * 0.95], [R * 0.34, H]];
    g.add(part(lathe(prof, 12), i % 2 ? GOODS.glass : GOODS.glassGreen, 'vessel-' + i, { pos: [x, A.rack ? 0.014 : 0, 0] }));
    if (A.fill) {
      const fh = H * (0.2 + A.fill * 0.2);
      g.add(part(lathe(prof.filter((p) => p[1] <= fh).concat([[prof[0][0] * 1.2, fh]])), i % 3 === 0 ? GOODS.tinctureAsh : GOODS.tincture, 'liquid-' + i, { pos: [x, A.rack ? 0.0145 : 0.0005, 0] }));
    }
    const sy = (A.rack ? 0.014 : 0) + H;
    if (A.stopper === 0) g.add(part(cyl(R * 0.38, R * 0.45, 0.008, 8), GOODS.cork, 'cork-' + i, { pos: [x, sy + 0.003, 0] }));
    else if (A.stopper === 1) g.add(part(lathe([[R * 0.44, 0], [R * 0.6, 0.004], [R * 0.3, 0.012], [0, 0.014]], 9), GOODS.wax, 'wax-seal-' + i, { pos: [x, sy, 0] }));
    else {
      g.add(part(cyl(R * 0.4, R * 0.46, 0.006, 8), GOODS.cork, 'cork-' + i, { pos: [x, sy + 0.003, 0] }));
      g.add(part(torus(R * 0.5, 0.0022, 3, 9), MAT.warmBrass, 'collar-' + i, { pos: [x, sy + 0.001, 0], rot: [Math.PI / 2, 0, 0] }));
    }
    if (A.label) g.add(part(box(R * 1.5, H * 0.3, 0.0012), GOODS.parch, 'label-' + i, { pos: [x, (A.rack ? 0.014 : 0) + H * 0.42, R * 1.02] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------- APOTHECARY JAR */
export const JAR_AXES = { form: 4, lid: 3, contents: 3, band: 2, count: 3, seal: 2 };
export function apothecaryJars(variant = 0) {
  const A = axesOf(variant, JAR_AXES);
  const rand = rnd(variant * 251 + 9);
  const g = new THREE.Group();
  const n = 1 + A.count;
  for (let i = 0; i < n; i++) {
    const H = 0.09 + rand() * 0.05;
    const R = H * (0.34 + A.form * 0.05);
    const x = (i - (n - 1) / 2) * R * 2.5;
    const prof = A.form === 0
      ? [[R * 0.72, 0], [R, H * 0.18], [R, H * 0.82], [R * 0.78, H * 0.94], [R * 0.8, H]]
      : A.form === 1
        ? [[R * 0.6, 0], [R * 0.98, H * 0.4], [R * 0.86, H * 0.75], [R * 0.6, H * 0.92], [R * 0.64, H]]
        : A.form === 2
          ? [[R * 0.85, 0], [R * 0.9, H * 0.6], [R * 0.72, H * 0.7], [R * 0.72, H * 0.95], [R * 0.76, H]]
          : [[R * 0.5, 0], [R * 0.62, H * 0.1], [R, H * 0.45], [R * 0.9, H * 0.8], [R * 0.7, H]];
    g.add(part(lathe(prof, 14), i % 2 ? MAT.firedClay : MAT.clayPale, 'jar-' + i, { pos: [x, 0, 0] }));
    if (A.contents) {
      const ch = H * 0.62;
      if (A.contents === 1) g.add(part(lathe([[R * 0.7, 0], [R * 0.55, 0.004], [0, 0.006]], 12), GOODS.tincture, 'contents-' + i, { pos: [x, ch, 0] }));
      else for (let k = 0; k < 5; k++) g.add(part(ico(R * 0.16, 0), k % 2 ? GOODS.rind : GOODS.crust, 'contents-' + i + '-' + k, { pos: [x + (rand() - 0.5) * R, ch + rand() * R * 0.2, (rand() - 0.5) * R] }));
    }
    if (A.lid === 0) g.add(part(lathe([[R * 0.84, 0], [R * 0.88, 0.008], [R * 0.5, 0.014], [R * 0.16, 0.022], [0, 0.024]], 13), MAT.firedClay, 'lid-' + i, { pos: [x, H, 0] }));
    else if (A.lid === 1) { g.add(part(cyl(R * 0.82, R * 0.82, 0.006, 13), GOODS.parch, 'cloth-cover-' + i, { pos: [x, H + 0.003, 0] })); g.add(part(torus(R * 0.84, 0.0025, 3, 12), MAT.ropeHemp, 'tie-' + i, { pos: [x, H - 0.004, 0], rot: [Math.PI / 2, 0, 0] })); }
    else g.add(part(lathe([[R * 0.8, 0], [R * 0.86, 0.01], [R * 0.8, 0.016]], 13), MAT.pittedIron, 'iron-lid-' + i, { pos: [x, H, 0] }));
    if (A.band) g.add(part(torus(R * 0.97, 0.003, 3, 14), MAT.pittedIron, 'band-' + i, { pos: [x, H * 0.5, 0], rot: [Math.PI / 2, 0, 0] }));
    if (A.seal) g.add(part(lathe([[R * 0.2, 0], [R * 0.26, 0.003], [0, 0.005]], 8), GOODS.wax, 'wax-mark-' + i, { pos: [x, H * 0.62, R * 0.9], rot: [Math.PI / 2, 0, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------- RETORT RACK */
export const RETORT_AXES = { slots: 4, tiers: 3, mix: 4, frame: 3, tubing: 2 };
export function retortRack(variant = 0) {
  const A = axesOf(variant, RETORT_AXES);
  const rand = rnd(variant * 907 + 33);
  const g = new THREE.Group();
  const slots = 2 + A.slots;
  const tiers = 1 + A.tiers;
  const sp = 0.062;
  const W = sp * slots + 0.04;
  const tierH = 0.11;
  const frameMat = A.frame === 2 ? MAT.pittedIron : MAT.darkOak;
  for (let t = 0; t < tiers; t++) {
    g.add(part(box(W, 0.012, 0.08), frameMat, 'shelf-' + t, { pos: [0, t * tierH + 0.006, 0] }));
  }
  [-1, 1].forEach((s, si) => {
    g.add(part(box(0.016, tierH * tiers + 0.03, 0.08), frameMat, 'upright-' + si, { pos: [s * (W / 2 - 0.008), (tierH * tiers) / 2, 0] }));
    if (A.frame) g.add(part(box(0.008, 0.008, 0.076), MAT.pittedIron, 'brace-' + si, { pos: [s * (W / 2 - 0.02), tierH * tiers - 0.01, 0], rot: [0, 0, s * 0.6] }));
  });
  for (let t = 0; t < tiers; t++) for (let i = 0; i < slots; i++) {
    const x = -sp * (slots - 1) / 2 + i * sp;
    const y = t * tierH + 0.012;
    const kind = (i + t * 2 + A.mix) % (2 + A.mix);
    const H = 0.055 + rand() * 0.02;
    const R = 0.017;
    if (kind === 0) {
      g.add(part(lathe([[R * 0.3, 0], [R, H * 0.42], [R * 0.85, H * 0.7], [R * 0.3, H * 0.92], [R * 0.34, H]], 12), GOODS.glass, 'flask-' + t + '-' + i, { pos: [x, y, 0] }));
      g.add(part(lathe([[R * 0.28, 0], [R * 0.8, H * 0.3], [0, H * 0.34]], 11), GOODS.tincture, 'flask-fill-' + t + '-' + i, { pos: [x, y + 0.001, 0] }));
    } else if (kind === 1) {
      g.add(part(lathe([[R * 0.8, 0], [R * 0.9, H * 0.5], [R * 0.9, H * 0.86], [R * 0.7, H]], 12), GOODS.glassGreen, 'beaker-' + t + '-' + i, { pos: [x, y, 0] }));
    } else if (kind === 2) {
      g.add(part(cyl(R * 0.4, R * 0.4, H, 10), GOODS.glass, 'ampoule-' + t + '-' + i, { pos: [x, y + H / 2, 0] }));
      g.add(part(cone(R * 0.4, R * 0.5, 8), GOODS.glass, 'ampoule-tip-' + t + '-' + i, { pos: [x, y + H + R * 0.25, 0] }));
    } else if (kind === 3) {
      g.add(part(lathe([[R * 0.65, 0], [R * 1.05, H * 0.35], [R * 0.6, H * 0.7], [R * 0.22, H * 0.95], [R * 0.26, H]], 12), GOODS.glass, 'retort-' + t + '-' + i, { pos: [x, y, 0] }));
      g.add(part(tube([[x + R * 0.9, y + H * 0.6, 0], [x + R * 2, y + H * 0.4, 0], [x + R * 2.4, y + H * 0.1, 0]], R * 0.14, 5), GOODS.glass, 'retort-neck-' + t + '-' + i, {}));
    } else {
      g.add(part(lathe([[R * 0.9, 0], [R * 0.95, H * 0.2], [R * 0.55, H * 0.55], [R * 0.6, H * 0.9], [R * 0.8, H]], 12), MAT.firedClay, 'crucible-' + t + '-' + i, { pos: [x, y, 0] }));
    }
  }
  if (A.tubing) {
    const y = tierH * tiers - 0.02;
    g.add(part(tube([[-W * 0.3, y, 0.02], [0, y + 0.03, 0.05], [W * 0.3, y, 0.02]], 0.004, 5), MAT.warmBrass, 'condenser-tube', {}));
  }
  return seat(g);
}

/* ------------------------------------------------------------- HERB BUNDLE */
export const HERB_AXES = { species: 5, count: 4, tie: 3, hang: 2, dry: 3, scale: 2 };
export function herbBundles(variant = 0) {
  const A = axesOf(variant, HERB_AXES);
  const rand = rnd(variant * 173 + 27);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.35;
  const n = 1 + A.count;
  const leafMat = [MAT.pineNeedle, MAT.graveMoss, MAT.reedPale, MAT.heatherBloom, MAT.lichenGrey][A.species];
  const dryMat = A.dry === 2 ? MAT.reedPale : leafMat;
  if (A.hang) {
    g.add(part(limb(0.008, 0.01, 0.34 * s * n, 7, 2), MAT.weatheredTimber, 'hang-rail', { pos: [0, 0.34 * s, 0], rot: [0, 0, Math.PI / 2] }));
  }
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.09 * s;
    const L = (0.13 + rand() * 0.07) * s;
    const topY = A.hang ? 0.33 * s : L * 0.5;
    const stems = 5 + A.count * 3;
    for (let k = 0; k < stems; k++) {
      const a = (k / stems) * T;
      const spread = (0.012 + rand() * 0.02) * s * (A.dry ? 1.3 : 1);
      const dir = A.hang ? -1 : 1;
      const pts = [[x, topY, 0], [x + Math.cos(a) * spread * 0.5, topY + dir * L * 0.5, Math.sin(a) * spread * 0.5], [x + Math.cos(a) * spread, topY + dir * L, Math.sin(a) * spread]];
      g.add(part(tube(pts, 0.0022 * s, 4), MAT.reedPale, 'stem-' + i + '-' + k, {}));
      const heads = A.species === 3 ? 3 : 2;
      for (let h = 0; h < heads; h++) {
        const t = 0.55 + h * 0.2;
        g.add(part(A.species === 4 ? ico(0.008 * s, 0) : cone(0.007 * s, 0.022 * s, 4), h ? dryMat : leafMat, 'head-' + i + '-' + k + '-' + h, {
          pos: [x + Math.cos(a) * spread * t, topY + dir * L * t, Math.sin(a) * spread * t],
          rot: [dir > 0 ? 0 : Math.PI, a, 0],
        }));
      }
    }
    for (let b = 0; b < A.tie; b++) g.add(part(torus(0.011 * s, 0.0022 * s, 3, 10), b % 2 ? MAT.ropeHemp : GOODS.linenDark, 'binding-' + i + '-' + b, { pos: [x, topY + (A.hang ? -1 : 1) * (0.012 + b * 0.016) * s, 0], rot: [Math.PI / 2, 0, 0] }));
    if (A.hang) g.add(part(tube([[x, 0.335 * s, 0], [x, 0.325 * s, 0.004]], 0.0018, 4), MAT.ropeHemp, 'hang-cord-' + i, {}));
  }
  return seat(g);
}

/* --------------------------------------------------------------------- SACKS */
export const SACK_AXES = { count: 4, form: 3, slump: 3, tie: 3, spill: 2, scale: 3 };
export function grainSacks(variant = 0) {
  const A = axesOf(variant, SACK_AXES);
  const rand = rnd(variant * 137 + 45);
  const g = new THREE.Group();
  const s = 0.8 + A.scale * 0.3;
  const n = 1 + A.count;
  for (let i = 0; i < n; i++) {
    const lying = A.form === 2 || (A.form === 1 && i % 2 === 1);
    const H = (0.2 + rand() * 0.1) * s;
    const R = H * (0.42 + A.slump * 0.09);
    const a = (i / n) * T + rand();
    const d = i === 0 ? 0 : R * (1.5 + rand() * 0.6);
    const px = Math.cos(a) * d, pz = Math.sin(a) * d;
    const prof = lying
      ? [[R * 0.5, 0], [R, H * 0.22], [R * 1.05, H * 0.6], [R * 0.7, H * 0.9], [R * 0.3, H]]
      : [[R * 0.9, 0], [R, H * 0.3], [R * 0.86, H * 0.72], [R * 0.42, H * 0.92], [R * 0.2, H]];
    const bag = lathe(prof, 13);
    jitter(bag, R * (0.04 + A.slump * 0.03), rand);
    const stack = i > 0 && A.form === 0 ? H * 0.9 : 0;
    g.add(part(bag, i % 2 ? GOODS.linen : GOODS.linenDark, 'sack-' + i, {
      pos: [px, stack, pz],
      rot: lying ? [Math.PI * 0.46, a, 0] : [0, a, (rand() - 0.5) * 0.16],
    }));
    for (let k = 0; k < A.tie; k++) {
      const ty = lying ? H * 0.2 : H * (0.86 - k * 0.08);
      g.add(part(torus(R * (0.28 + k * 0.06), R * 0.05, 4, 11), MAT.ropeHemp, 'neck-tie-' + i + '-' + k, { pos: [px, stack + ty, pz], rot: lying ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0] }));
    }
    if (A.spill && lying) {
      for (let k = 0; k < 6; k++) {
        const sa = a + (rand() - 0.5) * 1.2, sd = R * (1 + rand() * 1.1);
        g.add(part(ico(R * (0.05 + rand() * 0.05), 0), GOODS.rind, 'spill-' + i + '-' + k, { pos: [px + Math.cos(sa) * sd, R * 0.05, pz + Math.sin(sa) * sd] }));
      }
      g.add(part(lathe([[R * 0.5, 0], [R * 0.35, 0.005], [0, 0.007]], 10), GOODS.rind, 'spill-mound-' + i, { pos: [px + Math.cos(a) * R * 1.3, 0, pz + Math.sin(a) * R * 1.3] }));
    }
    if (A.slump === 2) g.add(part(box(R * 0.5, R * 0.3, 0.002), GOODS.parch, 'stencil-' + i, { pos: [px + Math.cos(a) * R * 0.92, stack + H * 0.5, pz + Math.sin(a) * R * 0.92], rot: [0, a, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------------ AMPHORA */
export const AMPHORA_AXES = { form: 4, handles: 3, count: 3, stand: 3, seal: 2, broken: 2 };
export function amphoraSet(variant = 0) {
  const A = axesOf(variant, AMPHORA_AXES);
  const rand = rnd(variant * 631 + 51);
  const g = new THREE.Group();
  const n = 1 + A.count;
  for (let i = 0; i < n; i++) {
    const H = 0.3 + rand() * 0.14;
    const R = H * (0.26 + A.form * 0.035);
    const x = (i - (n - 1) / 2) * R * 2.8;
    const broken = A.broken && i === n - 1;
    const full = A.form === 0
      ? [[R * 0.18, 0], [R * 0.7, H * 0.14], [R, H * 0.42], [R * 0.8, H * 0.68], [R * 0.34, H * 0.85], [R * 0.4, H * 0.96], [R * 0.34, H]]
      : A.form === 1
        ? [[R * 0.1, 0], [R * 0.55, H * 0.2], [R, H * 0.5], [R * 0.72, H * 0.76], [R * 0.28, H * 0.92], [R * 0.32, H]]
        : A.form === 2
          ? [[R * 0.6, 0], [R * 0.95, H * 0.25], [R * 0.92, H * 0.62], [R * 0.5, H * 0.86], [R * 0.44, H]]
          : [[R * 0.3, 0], [R * 0.85, H * 0.3], [R * 1.02, H * 0.55], [R * 0.6, H * 0.8], [R * 0.26, H * 0.95], [R * 0.3, H]];
    const prof = broken ? full.filter((p) => p[1] <= H * 0.6).concat([[R * 0.9, H * 0.62]]) : full;
    const body = lathe(prof, 15);
    if (broken) jitter(body, R * 0.03, rand);
    g.add(part(body, i % 2 ? MAT.firedClay : MAT.clayPale, 'amphora-' + i, { pos: [x, 0, 0] }));
    if (!broken) for (let h = 0; h < A.handles + 1; h++) {
      const ha = (h / (A.handles + 1)) * T;
      g.add(part(torus(R * 0.3, R * 0.07, 4, 10, Math.PI * 1.1), MAT.firedClay, 'handle-' + i + '-' + h, {
        pos: [x + Math.cos(ha) * R * 0.55, H * 0.78, Math.sin(ha) * R * 0.55],
        rot: [0, -ha, 1.2],
      }));
    }
    if (A.stand === 1) g.add(part(torus(R * 0.55, R * 0.12, 4, 12), MAT.ropeHemp, 'rope-collar-' + i, { pos: [x, R * 0.12, 0], rot: [Math.PI / 2, 0, 0] }));
    else if (A.stand === 2) {
      g.add(part(box(R * 1.9, 0.014, R * 1.9), MAT.weatheredTimber, 'crate-base-' + i, { pos: [x, 0.007, 0] }));
      for (let k = 0; k < 4; k++) g.add(part(box(R * 1.9, 0.05, 0.01), MAT.weatheredTimber, 'crate-side-' + i + '-' + k, { pos: [x + (k < 2 ? 0 : (k === 2 ? -R * 0.94 : R * 0.94)), 0.03, k < 2 ? (k ? -R * 0.94 : R * 0.94) : 0], rot: [0, k < 2 ? 0 : Math.PI / 2, 0] }));
    }
    if (!broken && A.seal) g.add(part(lathe([[R * 0.36, 0], [R * 0.4, 0.01], [R * 0.2, 0.016], [0, 0.018]], 10), GOODS.wax, 'seal-' + i, { pos: [x, H, 0] }));
    if (broken) for (let k = 0; k < 3; k++) {
      const sa = rand() * T;
      g.add(part(box(R * 0.4, 0.006, R * 0.3), MAT.firedClay, 'shard-' + i + '-' + k, { pos: [x + Math.cos(sa) * R * 1.6, 0.004, Math.sin(sa) * R * 1.6], rot: [0.1, sa, 0.2] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- FOOD BOARD */
export const FOODBOARD_AXES = { spread: 5, items: 4, board: 3, cloth: 2, stack: 3 };
export function foodBoard(variant = 0) {
  const A = axesOf(variant, FOODBOARD_AXES);
  const rand = rnd(variant * 293 + 39);
  const g = new THREE.Group();
  const W = 0.26 + A.board * 0.09;
  const D = W * 0.6;
  const bh = 0.014;
  if (A.board === 2) {
    g.add(part(lathe([[W * 0.5, 0], [W * 0.5, bh * 0.7], [W * 0.44, bh]], 16), MAT.heartwood, 'board-round'));
  } else {
    g.add(part(box(W, bh, D), A.board ? MAT.heartwood : MAT.darkOak, 'board', { pos: [0, bh / 2, 0] }));
    g.add(part(cyl(0.012, 0.012, 0.006, 8), MAT.pittedIron, 'board-peg', { pos: [W * 0.44, bh / 2, 0] }));
  }
  if (A.cloth) g.add(part(box(W * 0.7, 0.003, D * 0.85), GOODS.linen, 'cloth', { pos: [-W * 0.1, bh + 0.0015, 0], rot: [0, 0.1, 0] }));
  const items = 2 + A.items;
  for (let i = 0; i < items; i++) {
    const kind = (i + A.spread) % 5;
    const x = -W * 0.36 + (W * 0.72 / Math.max(1, items - 1)) * i;
    const z = (rand() - 0.5) * D * 0.4;
    const y = bh + 0.002;
    if (kind === 0) {
      const r = 0.03 + rand() * 0.015;
      const stack = 1 + (A.stack > 1 ? 1 : 0);
      for (let k = 0; k < stack; k++) {
        g.add(part(lathe([[r * 0.9, 0], [r, r * 0.2], [r, r * 0.62], [r * 0.86, r * 0.72]], 14), GOODS.rind, 'cheese-' + i + '-' + k, { pos: [x, y + k * r * 0.74, z] }));
      }
      if (A.spread > 2) g.add(part(box(r * 0.7, r * 0.6, 0.004), GOODS.crumb, 'cheese-cut-' + i, { pos: [x + r * 0.5, y + r * 0.3, z + r * 0.5], rot: [0, 0.6, 0.2] }));
    } else if (kind === 1) {
      const L = 0.07 + rand() * 0.04;
      const loaf = lathe([[L * 0.18, 0], [L * 0.3, L * 0.2], [L * 0.28, L * 0.6], [L * 0.14, L * 0.82], [0, L * 0.86]], 11);
      loaf.scale(1, 1, 2.3);
      g.add(part(loaf, GOODS.crust, 'loaf-' + i, { pos: [x, y, z], rot: [0, rand(), 0] }));
      for (let k = 0; k < 3; k++) g.add(part(box(L * 0.3, 0.003, L * 0.02), GOODS.crumb, 'score-' + i + '-' + k, { pos: [x, y + L * 0.3, z - L * 0.3 + k * L * 0.3] }));
    } else if (kind === 2) {
      const r = 0.017;
      for (let k = 0; k < 3 + A.stack; k++) {
        const fa = rand() * T, fd = rand() * 0.02;
        const f = ico(r * (0.7 + rand() * 0.5), 1);
        f.scale(1, 0.86, 1);
        g.add(part(f, GOODS.fruit, 'fruit-' + i + '-' + k, { pos: [x + Math.cos(fa) * fd, y + r * 0.8, z + Math.sin(fa) * fd] }));
      }
      if (A.spread > 1) g.add(part(lathe([[0.034, 0], [0.04, 0.012], [0.036, 0.02]], 12), MAT.ropeHemp, 'basket-' + i, { pos: [x, y, z] }));
    } else if (kind === 3) {
      g.add(part(lathe([[0.014, 0], [0.02, 0.006], [0.019, 0.03], [0.023, 0.036]], 12), MAT.firedClay, 'cup-' + i, { pos: [x, y, z] }));
      g.add(part(torus(0.008, 0.002, 3, 8, Math.PI), MAT.firedClay, 'cup-handle-' + i, { pos: [x + 0.021, y + 0.022, z], rot: [0, 1.57, 0.2] }));
    } else {
      const L = 0.05 + rand() * 0.03;
      g.add(part(box(L, 0.008, 0.022, 2, 1, 1), GOODS.cured, 'slab-' + i, { pos: [x, y + 0.004, z], rot: [0, rand() * 0.6, 0] }));
      g.add(part(box(L * 0.9, 0.002, 0.02), GOODS.crumb, 'fat-line-' + i, { pos: [x, y + 0.009, z], rot: [0, rand() * 0.6, 0] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- MEAT HANG */
export const MEATHANG_AXES = { count: 4, form: 3, hook: 3, rail: 3, wrap: 2 };
export function curedMeatHang(variant = 0) {
  const A = axesOf(variant, MEATHANG_AXES);
  const rand = rnd(variant * 379 + 57);
  const g = new THREE.Group();
  const n = 2 + A.count;
  const sp = 0.075;
  const W = sp * n + 0.06;
  const railY = 0.42;
  if (A.rail === 0) g.add(part(limb(0.012, 0.014, W, 8, 2), MAT.weatheredTimber, 'rail-pole', { pos: [0, railY, 0], rot: [0, 0, Math.PI / 2] }));
  else if (A.rail === 1) g.add(part(cyl(0.008, 0.008, W, 10), MAT.pittedIron, 'rail-bar', { pos: [0, railY, 0], rot: [0, 0, Math.PI / 2] }));
  else {
    g.add(part(limb(0.012, 0.014, W, 8, 2), MAT.weatheredTimber, 'rail-pole', { pos: [0, railY, 0], rot: [0, 0, Math.PI / 2] }));
    [-1, 1].forEach((s, i) => g.add(part(limb(0.014, 0.018, railY, 7, 2), MAT.weatheredTimber, 'rail-post-' + i, { pos: [s * W * 0.46, railY / 2, 0] })));
  }
  for (let i = 0; i < n; i++) {
    const x = -sp * (n - 1) / 2 + i * sp;
    const L = 0.11 + rand() * 0.09;
    const R = L * (0.16 + A.form * 0.05);
    if (A.hook === 0) g.add(part(torus(0.012, 0.0025, 3, 10, Math.PI * 1.5), MAT.pittedIron, 'hook-' + i, { pos: [x, railY - 0.014, 0], rot: [0, 0, 0.4] }));
    else if (A.hook === 1) g.add(part(tube([[x, railY, 0], [x, railY - 0.03, 0.004]], 0.0022, 4), MAT.ropeHemp, 'cord-' + i, {}));
    else { g.add(part(torus(0.01, 0.002, 3, 9), MAT.pittedIron, 'ring-' + i, { pos: [x, railY - 0.012, 0], rot: [Math.PI / 2, 0, 0] })); g.add(part(tube([[x, railY - 0.018, 0], [x, railY - 0.04, 0]], 0.002, 4), MAT.ropeHemp, 'cord-' + i, {})); }
    const top = railY - 0.045;
    const prof = A.form === 0
      ? [[R * 0.3, 0], [R * 0.9, L * 0.22], [R, L * 0.6], [R * 0.6, L * 0.9], [R * 0.2, L]]
      : A.form === 1
        ? [[R * 0.5, 0], [R * 0.95, L * 0.3], [R * 0.9, L * 0.75], [R * 0.4, L]]
        : [[R * 0.2, 0], [R * 0.7, L * 0.15], [R * 1.05, L * 0.45], [R * 0.85, L * 0.8], [R * 0.3, L]];
    const body = lathe(prof, 12);
    body.scale(1, 1, 0.7);
    g.add(part(body, i % 3 === 0 ? GOODS.cured : MAT.firedClay, 'meat-' + i, { pos: [x, top - L, 0], rot: [0, rand() * T, (rand() - 0.5) * 0.12] }));
    if (A.wrap) {
      for (let k = 0; k < 3; k++) g.add(part(torus(R * (0.7 - k * 0.1), R * 0.06, 3, 10), MAT.ropeHemp, 'twine-' + i + '-' + k, { pos: [x, top - L * (0.25 + k * 0.25), 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- FISH RACK */
export const FISHRACK_AXES = { rows: 4, count: 4, frame: 3, form: 3, net: 2 };
export function fishDryingRack(variant = 0) {
  const A = axesOf(variant, FISHRACK_AXES);
  const rand = rnd(variant * 467 + 63);
  const g = new THREE.Group();
  const rows = 1 + A.rows;
  const W = 0.85, H = 0.35 + rows * 0.16;
  [-1, 1].forEach((s, i) => {
    g.add(part(limb(0.016, 0.024, H, 7, 3), MAT.weatheredTimber, 'post-' + i, { pos: [s * W / 2, H / 2, 0], rot: [0, 0, s * 0.05] }));
    if (A.frame) g.add(part(limb(0.012, 0.016, H * 0.7, 6, 2), MAT.weatheredTimber, 'brace-' + i, { pos: [s * (W / 2 - 0.07), H * 0.35, 0.09], rot: [0.5, 0, s * 0.16] }));
    if (A.frame === 2) g.add(part(limb(0.01, 0.013, H * 0.6, 6, 2), MAT.weatheredTimber, 'brace-back-' + i, { pos: [s * (W / 2 - 0.06), H * 0.3, -0.09], rot: [-0.5, 0, s * 0.14] }));
  });
  for (let r = 0; r < rows; r++) {
    const y = 0.28 + r * 0.16;
    g.add(part(cyl(0.007, 0.007, W, 8), MAT.weatheredTimber, 'crossbar-' + r, { pos: [0, y, 0], rot: [0, 0, Math.PI / 2] }));
    const n = 2 + A.count;
    for (let i = 0; i < n; i++) {
      const x = -W * 0.42 + (W * 0.84 / Math.max(1, n - 1)) * i;
      const L = 0.075 + rand() * 0.05;
      const body = lathe(A.form === 0
        ? [[0.004, 0], [L * 0.18, L * 0.25], [L * 0.16, L * 0.6], [L * 0.06, L * 0.9], [0.004, L]]
        : A.form === 1
          ? [[0.004, 0], [L * 0.22, L * 0.35], [L * 0.14, L * 0.72], [0.004, L]]
          : [[0.004, 0], [L * 0.14, L * 0.2], [L * 0.2, L * 0.55], [L * 0.1, L * 0.85], [0.004, L]], 9);
      body.scale(1, 1, 0.36);
      g.add(part(body, i % 2 ? GOODS.fish : MAT.boneLinen, 'fish-' + r + '-' + i, { pos: [x, y - L - 0.01, 0], rot: [0, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.14] }));
      g.add(part(tube([[x, y, 0], [x, y - 0.012, 0.003]], 0.0016, 4), MAT.ropeHemp, 'gill-cord-' + r + '-' + i, {}));
      if (A.form === 2) {
        for (let f = 0; f < 2; f++) g.add(part(cone(L * 0.1, L * 0.16, 3), GOODS.fish, 'tail-' + r + '-' + i + '-' + f, { pos: [x + (f ? 0.006 : -0.006), y - L - 0.012, 0], rot: [0, 0, f ? 0.4 : -0.4] }));
      }
    }
  }
  if (A.net) {
    for (let i = 0; i < 8; i++) g.add(part(tube([[-W * 0.4, 0.26, -0.06], [-W * 0.4 + i * 0.02, 0.2 - i * 0.012, -0.05], [-W * 0.36 + i * 0.024, 0.04, -0.02]], 0.0018, 4), MAT.ropeHemp, 'net-cord-' + i, {}));
    g.add(part(ico(0.03, 1), MAT.ropeHemp, 'net-heap', { pos: [-W * 0.3, 0.02, 0.0] }));
  }
  return seat(g);
}

/* --------------------------------------------------------------- TANKARD SET */
export const TANKARD_AXES = { form: 4, count: 4, lid: 2, tray: 3, spill: 2, scale: 3 };
export function tankardSet(variant = 0) {
  const A = axesOf(variant, TANKARD_AXES);
  const rand = rnd(variant * 211 + 69);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.25;
  const n = 1 + A.count;
  let trayY = 0;
  if (A.tray) {
    const R = 0.055 * s * n;
    if (A.tray === 1) { g.add(part(lathe([[R, 0], [R, 0.008], [R * 0.94, 0.012]], 16), MAT.heartwood, 'tray-round')); trayY = 0.012; }
    else { g.add(part(box(R * 1.7, 0.012, R * 1.1), MAT.darkOak, 'tray', { pos: [0, 0.006, 0] })); trayY = 0.012; if (A.tray === 2) for (let k = 0; k < 2; k++) g.add(part(box(R * 1.7, 0.016, 0.008), MAT.darkOak, 'tray-lip-' + k, { pos: [0, 0.014, (k ? -1 : 1) * R * 0.55] })); }
  }
  for (let i = 0; i < n; i++) {
    const a = (i / n) * T + rand() * 0.5;
    const d = i === 0 && n > 1 ? 0 : 0.045 * s * (n > 2 ? 1 : 0.6);
    const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.6;
    const H = (0.055 + rand() * 0.03) * s;
    const R = H * (0.36 + A.form * 0.04);
    const prof = A.form === 0
      ? [[R * 0.86, 0], [R, H * 0.1], [R * 0.98, H * 0.9], [R * 0.94, H]]
      : A.form === 1
        ? [[R * 0.7, 0], [R * 0.9, H * 0.2], [R, H * 0.75], [R * 1.04, H]]
        : A.form === 2
          ? [[R * 0.9, 0], [R * 0.8, H * 0.4], [R * 0.94, H * 0.8], [R * 0.9, H]]
          : [[R * 0.4, 0], [R * 0.5, H * 0.12], [R * 0.36, H * 0.3], [R * 0.9, H * 0.62], [R, H]];
    g.add(part(lathe(prof, 14), i % 3 === 0 ? MAT.pittedIron : MAT.firedClay, 'vessel-' + i, { pos: [x, trayY, z] }));
    g.add(part(lathe([[R * 0.9, 0], [R * 0.6, -0.004], [0, -0.006]], 13), GOODS.tincture, 'ale-' + i, { pos: [x, trayY + H * 0.86, z] }));
    if (A.form !== 3) g.add(part(torus(R * 0.42, R * 0.1, 4, 10, Math.PI * 1.2), i % 3 === 0 ? MAT.pittedIron : MAT.firedClay, 'handle-' + i, { pos: [x + Math.cos(a) * R * 1.05, trayY + H * 0.55, z + Math.sin(a) * R * 1.05], rot: [0, -a, 1.3] }));
    for (let b = 0; b < 2; b++) g.add(part(torus(R * 1.01, R * 0.045, 3, 14), MAT.pittedIron, 'band-' + i + '-' + b, { pos: [x, trayY + H * (0.2 + b * 0.55), z], rot: [Math.PI / 2, 0, 0] }));
    if (A.lid && i === 0) {
      g.add(part(lathe([[R * 0.96, 0], [R * 0.9, 0.006], [R * 0.4, 0.012], [0, 0.014]], 13), MAT.pittedIron, 'lid-' + i, { pos: [x, trayY + H + 0.002, z], rot: [0, 0, 0.18] }));
      g.add(part(cyl(0.003, 0.003, 0.012, 6), MAT.warmBrass, 'lid-thumb-' + i, { pos: [x - R * 0.8, trayY + H + 0.01, z], rot: [0, 0, 0.4] }));
    }
    if (A.spill && i === n - 1) g.add(part(lathe([[R * 1.5, 0], [R * 1.1, 0.002], [0, 0.003]], 12), GOODS.tincture, 'spill-' + i, { pos: [x + R * 1.4, trayY + 0.0005, z + R * 0.5] }));
  }
  return seat(g);
}

/* --------------------------------------------------------------- SCROLL CASE */
export const SCROLL_AXES = { count: 4, caseForm: 3, seal: 3, unrolled: 2, ribbon: 3, stack: 3 };
export function scrollSet(variant = 0) {
  const A = axesOf(variant, SCROLL_AXES);
  const rand = rnd(variant * 557 + 75);
  const g = new THREE.Group();
  const n = 1 + A.count;
  if (A.caseForm) {
    const L = 0.2 + A.caseForm * 0.05;
    const R = 0.024;
    const mat = A.caseForm === 1 ? GOODS.leather : MAT.pittedIron;
    g.add(part(cyl(R, R, L, 12), mat, 'case-body', { pos: [0, R, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(part(cyl(R * 1.12, R * 1.12, L * 0.16, 12), mat, 'case-cap', { pos: [L * 0.44, R, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(part(torus(R * 1.05, R * 0.08, 3, 12), MAT.warmBrass, 'case-band', { pos: [-L * 0.2, R, 0], rot: [0, Math.PI / 2, 0] }));
    if (A.caseForm === 2) {
      g.add(part(tube([[-L * 0.4, R * 1.1, 0], [0, R * 2.4, -R * 0.6], [L * 0.4, R * 1.1, 0]], 0.004, 5), MAT.ropeHemp, 'case-strap', {}));
    }
  }
  const baseY = A.caseForm ? 0.05 : 0;
  for (let i = 0; i < n; i++) {
    const L = 0.14 + rand() * 0.07;
    const R = 0.011 + rand() * 0.006;
    const row = A.stack ? Math.floor(i / 2) : 0;
    const x = (i % 2 === 0 ? -1 : 1) * (n > 1 ? R * 1.4 : 0) + (rand() - 0.5) * 0.01;
    const y = baseY + R + row * R * 1.8;
    g.add(part(cyl(R, R, L, 11), GOODS.parch, 'scroll-' + i, { pos: [x, y, row * R * 0.4], rot: [0, (rand() - 0.5) * 0.5, Math.PI / 2] }));
    g.add(part(lathe([[0, 0], [R * 0.9, 0.001], [R * 0.5, 0.004], [0, 0.005]], 11), GOODS.parch, 'scroll-end-' + i, { pos: [x + L * 0.5, y, row * R * 0.4], rot: [0, 0, -Math.PI / 2] }));
    if (A.ribbon) for (let k = 0; k < A.ribbon; k++) g.add(part(torus(R * 1.06, R * 0.09, 3, 11), k % 2 ? GOODS.wax : MAT.ropeHemp, 'ribbon-' + i + '-' + k, { pos: [x + (k - 0.5) * L * 0.3, y, row * R * 0.4], rot: [0, Math.PI / 2, 0] }));
    if (A.seal && i === 0) g.add(part(lathe([[R * 0.5, 0], [R * 0.55, 0.003], [0, 0.005]], 9), GOODS.wax, 'wax-seal-' + i, { pos: [x, y + R, row * R * 0.4] }));
  }
  if (A.unrolled) {
    const sheet = box(0.16, 0.0015, 0.11, 4, 1, 3);
    const p = sheet.attributes.position;
    for (let v = 0; v < p.count; v++) p.setY(v, p.getY(v) + Math.sin((p.getX(v) + 0.08) * 14) * 0.004);
    p.needsUpdate = true;
    sheet.computeVertexNormals();
    g.add(part(sheet, GOODS.parch, 'unrolled-sheet', { pos: [0.06, baseY, 0.09], rot: [0, 0.2, 0] }));
    for (let k = 0; k < 4; k++) g.add(part(box(0.09, 0.0006, 0.002), GOODS.ink, 'ink-line-' + k, { pos: [0.06, baseY + 0.003, 0.06 + k * 0.014], rot: [0, 0.2, 0] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- TOME STACK */
export const TOME_AXES = { count: 5, size: 3, clasp: 3, lean: 3, bookmark: 2, open: 2 };
export function tomeStack(variant = 0) {
  const A = axesOf(variant, TOME_AXES);
  const rand = rnd(variant * 683 + 81);
  const g = new THREE.Group();
  const n = 1 + A.count;
  let y = 0;
  for (let i = 0; i < n; i++) {
    const W = 0.14 + A.size * 0.035 - i * 0.004;
    const D = W * 0.72;
    const th = 0.018 + rand() * 0.022;
    const rot = A.lean ? (rand() - 0.5) * 0.12 * A.lean : 0;
    g.add(part(box(W, th, D), i % 2 ? GOODS.leather : MAT.firedClay, 'cover-' + i, { pos: [0, y + th / 2, 0], rot: [0, rot, 0] }));
    g.add(part(box(W * 0.94, th * 0.72, D * 0.96), GOODS.parch, 'pages-' + i, { pos: [W * 0.03, y + th / 2, 0], rot: [0, rot, 0] }));
    g.add(part(box(th * 0.5, th, D), i % 2 ? GOODS.leather : MAT.firedClay, 'spine-' + i, { pos: [-W / 2 + th * 0.2, y + th / 2, 0], rot: [0, rot, 0] }));
    for (let b = 0; b < 2; b++) g.add(part(box(th * 0.4, th * 0.16, D * 0.9), MAT.warmBrass, 'spine-band-' + i + '-' + b, { pos: [-W / 2 + th * 0.2, y + th * (0.28 + b * 0.44), 0], rot: [0, rot, 0] }));
    if (A.clasp && i < A.clasp) {
      g.add(part(box(0.014, th * 1.1, 0.006), MAT.pittedIron, 'clasp-' + i, { pos: [W / 2 - 0.004, y + th / 2, 0], rot: [0, rot, 0] }));
      g.add(part(ico(0.004, 0), MAT.warmBrass, 'clasp-stud-' + i, { pos: [W / 2 - 0.004, y + th / 2, 0.008], rot: [0, rot, 0] }));
    }
    if (A.bookmark && i % 2 === 0) g.add(part(box(0.006, 0.001, D * 0.55), GOODS.wax, 'ribbon-' + i, { pos: [W * 0.2, y + th * 0.5, D * 0.55], rot: [0, rot, 0] }));
    y += th;
  }
  if (A.open) {
    const W = 0.15 + A.size * 0.03;
    g.add(part(box(W * 2.05, 0.012, W * 0.75), GOODS.leather, 'open-cover', { pos: [W * 1.3, y + 0.006, 0.02], rot: [0, 0.25, 0] }));
    [-1, 1].forEach((s, k) => {
      const leaf = box(W * 0.96, 0.006, W * 0.7, 4, 1, 2);
      const p = leaf.attributes.position;
      for (let v = 0; v < p.count; v++) p.setY(v, p.getY(v) + Math.abs(p.getX(v)) * 0.06 * s);
      p.needsUpdate = true;
      leaf.computeVertexNormals();
      g.add(part(leaf, GOODS.parch, 'open-leaf-' + k, { pos: [W * 1.3 + s * W * 0.52, y + 0.014, 0.02], rot: [0, 0.25, 0] }));
      for (let l = 0; l < 5; l++) g.add(part(box(W * 0.6, 0.0006, 0.0016), GOODS.ink, 'text-' + k + '-' + l, { pos: [W * 1.3 + s * W * 0.52, y + 0.018, 0.02 - W * 0.22 + l * W * 0.1], rot: [0, 0.25, 0] }));
    });
  }
  return seat(g);
}

/* ------------------------------------------------------------------- INK SET */
export const INKSET_AXES = { items: 4, well: 3, quills: 3, blotter: 2, wax: 3, tray: 2 };
export function inkAndQuillSet(variant = 0) {
  const A = axesOf(variant, INKSET_AXES);
  const rand = rnd(variant * 787 + 87);
  const g = new THREE.Group();
  let y = 0;
  if (A.tray) { g.add(part(box(0.19, 0.01, 0.11), MAT.darkOak, 'desk-tray', { pos: [0, 0.005, 0] })); y = 0.01; }
  const wr = 0.017 + A.well * 0.004;
  const wellProf = A.well === 2
    ? [[wr * 1.2, 0], [wr, wr * 0.5], [wr * 0.7, wr * 0.9], [wr * 0.8, wr * 1.05]]
    : [[wr * 0.8, 0], [wr, wr * 0.3], [wr * 0.94, wr * 0.9], [wr * 0.62, wr * 1.05], [wr * 0.66, wr * 1.15]];
  g.add(part(lathe(wellProf, 13), A.well ? MAT.pittedIron : MAT.firedClay, 'inkwell', { pos: [-0.05, y, 0] }));
  g.add(part(lathe([[wr * 0.6, 0], [wr * 0.35, 0.002], [0, 0.003]], 12), GOODS.ink, 'ink-surface', { pos: [-0.05, y + wr * 0.95, 0] }));
  if (A.well) g.add(part(lathe([[wr * 0.7, 0], [wr * 0.75, 0.005], [wr * 0.3, 0.01], [0, 0.012]], 11), MAT.pittedIron, 'well-lid', { pos: [-0.05 + wr * 1.6, y, 0], rot: [0.3, 0, 0.4] }));
  for (let i = 0; i < 1 + A.quills; i++) {
    const L = 0.1 + rand() * 0.05;
    const a = -0.5 - i * 0.25;
    const tipX = -0.05 + Math.cos(a) * 0.01, tipZ = Math.sin(a) * 0.01;
    g.add(part(tube([[tipX, y + wr * 0.9, tipZ], [tipX + L * 0.4, y + wr * 0.9 + L * 0.5, tipZ + L * 0.12], [tipX + L * 0.7, y + wr * 0.9 + L * 0.85, tipZ + L * 0.2]], 0.0022, 5), MAT.boneLinen, 'quill-shaft-' + i, {}));
    for (let f = 0; f < 6; f++) {
      const t = 0.45 + f * 0.09;
      g.add(part(box(0.016, 0.0008, 0.005), MAT.boneLinen, 'barb-' + i + '-' + f, {
        pos: [tipX + L * 0.7 * t, y + wr * 0.9 + L * 0.85 * t, tipZ + L * 0.2 * t],
        rot: [0, a, 0.9],
      }));
    }
  }
  if (A.items > 1) {
    g.add(part(box(0.05, 0.004, 0.036), GOODS.parch, 'note-sheet', { pos: [0.045, y + 0.002, 0.02], rot: [0, 0.15, 0] }));
    for (let l = 0; l < 3; l++) g.add(part(box(0.036, 0.0005, 0.0014), GOODS.ink, 'note-line-' + l, { pos: [0.045, y + 0.005, 0.01 + l * 0.01], rot: [0, 0.15, 0] }));
  }
  if (A.items > 2) {
    g.add(part(lathe([[0.008, 0], [0.011, 0.004], [0.01, 0.024], [0.007, 0.028]], 10), MAT.firedClay, 'sand-shaker', { pos: [0.075, y, -0.03] }));
    for (let k = 0; k < 3; k++) g.add(part(ico(0.0012, 0), MAT.boneLinen, 'sand-' + k, { pos: [0.075 + (rand() - 0.5) * 0.02, y + 0.001, -0.03 + (rand() - 0.5) * 0.02] }));
  }
  if (A.blotter) {
    g.add(part(lathe([[0.019, 0], [0.021, 0.006], [0.012, 0.01]], 11), MAT.heartwood, 'blotter-rocker', { pos: [0.02, y, -0.032], rot: [0, 0, 0.1] }));
    g.add(part(cyl(0.003, 0.003, 0.02, 6), MAT.heartwood, 'blotter-knob', { pos: [0.02, y + 0.018, -0.032] }));
  }
  for (let i = 0; i < A.wax; i++) {
    g.add(part(cyl(0.005, 0.005, 0.03 + rand() * 0.02, 7), GOODS.wax, 'wax-stick-' + i, { pos: [0.07, y + 0.005, 0.03 - i * 0.012], rot: [0, 0, Math.PI / 2] }));
  }
  if (A.wax > 1) g.add(part(cyl(0.009, 0.009, 0.006, 9), MAT.warmBrass, 'seal-matrix', { pos: [0.088, y + 0.003, 0.005] }));
  return seat(g);
}

/* ------------------------------------------------------------------ COIN PILE */
export const COIN_AXES = { form: 4, count: 4, spill: 3, purse: 3, denom: 2, scale: 2 };
export function coinPile(variant = 0) {
  const A = axesOf(variant, COIN_AXES);
  const rand = rnd(variant * 313 + 93);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.35;
  const cr = 0.008 * s;
  const cth = 0.0016 * s;
  const mats = [MAT.warmBrass, MAT.bellBronze, MAT.pittedIron];
  if (A.purse) {
    const R = 0.03 * s;
    const H = 0.05 * s;
    const bag = lathe([[R * 0.7, 0], [R, H * 0.35], [R * 0.9, H * 0.7], [R * 0.4, H * 0.9], [R * 0.3, H]], 13);
    jitter(bag, R * 0.06, rand);
    g.add(part(bag, A.purse === 2 ? GOODS.leather : GOODS.linenDark, 'purse', { pos: [-0.04 * s, 0, 0], rot: [0, rand(), 0] }));
    g.add(part(torus(R * 0.34, R * 0.06, 4, 11), MAT.ropeHemp, 'purse-tie', { pos: [-0.04 * s, H * 0.85, 0], rot: [Math.PI / 2, 0, 0] }));
    if (A.purse > 1) for (let k = 0; k < 3; k++) g.add(part(cyl(cr, cr, cth, 10), mats[k % 3], 'purse-coin-' + k, { pos: [-0.04 * s + (rand() - 0.5) * R, H * 0.95 + k * cth, (rand() - 0.5) * R], rot: [rand() * 0.3, rand(), 0] }));
  }
  if (A.form === 0) {
    const stacks = 1 + A.count;
    for (let st = 0; st < stacks; st++) {
      const a = (st / stacks) * T + rand();
      const d = st === 0 ? 0 : cr * (2.6 + rand() * 1.4);
      const h = 3 + Math.floor(rand() * (4 + A.count * 2));
      for (let k = 0; k < h; k++) {
        g.add(part(cyl(cr, cr, cth, 12), mats[(st + (A.denom ? k % 2 : 0)) % 3], 'coin-' + st + '-' + k, {
          pos: [Math.cos(a) * d + (rand() - 0.5) * cr * 0.1, cth / 2 + k * cth, Math.sin(a) * d + (rand() - 0.5) * cr * 0.1],
          rot: [0, rand() * T, (rand() - 0.5) * 0.04],
        }));
      }
    }
  } else {
    const n = 8 + A.count * 8;
    const R = cr * (2.4 + A.form * 0.8);
    for (let i = 0; i < n; i++) {
      const a = rand() * T;
      const d = Math.sqrt(rand()) * R;
      const layer = Math.floor((1 - d / R) * (2 + A.form));
      g.add(part(cyl(cr, cr, cth, 10), mats[(A.denom ? i % 3 : 0)], 'coin-' + i, {
        pos: [Math.cos(a) * d, cth / 2 + layer * cth * 0.9, Math.sin(a) * d],
        rot: [(rand() - 0.5) * 0.4, rand() * T, (rand() - 0.5) * 0.4],
      }));
    }
  }
  for (let i = 0; i < A.spill * 3; i++) {
    const a = rand() * T, d = cr * (4 + rand() * 5);
    g.add(part(cyl(cr, cr, cth, 9), mats[i % 3], 'stray-' + i, { pos: [Math.cos(a) * d, cth / 2, Math.sin(a) * d], rot: [0, rand() * T, 0] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- INGOT STACK */
export const INGOT_AXES = { metal: 4, count: 4, arrange: 3, stamp: 2, crate: 3, scale: 2 };
export function ingotStack(variant = 0) {
  const A = axesOf(variant, INGOT_AXES);
  const rand = rnd(variant * 991 + 99);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.3;
  const L = 0.09 * s, W = 0.038 * s, H = 0.02 * s;
  const mats = [MAT.pittedIron, MAT.bellBronze, MAT.warmBrass, MAT.blackIron];
  const mat = mats[A.metal];
  let baseY = 0;
  if (A.crate) {
    const cw = L * 1.4, cd = W * 3.4;
    g.add(part(box(cw, 0.012, cd), MAT.weatheredTimber, 'crate-floor', { pos: [0, 0.006, 0] }));
    const wallH = A.crate === 1 ? 0.03 : H * (1 + A.count) * 0.9;
    [[cw, 0.01, 0, cd / 2], [cw, 0.01, 0, -cd / 2]].forEach((p, i) => g.add(part(box(p[0], wallH, p[1]), MAT.weatheredTimber, 'crate-side-' + i, { pos: [0, wallH / 2 + 0.012, p[3]] })));
    [-1, 1].forEach((sg, i) => g.add(part(box(0.01, wallH, cd), MAT.weatheredTimber, 'crate-end-' + i, { pos: [sg * cw / 2, wallH / 2 + 0.012, 0] })));
    if (A.crate === 2) for (let k = 0; k < 5; k++) g.add(part(cone(0.004, 0.03, 4), GOODS.straw, 'straw-' + k, { pos: [(rand() - 0.5) * cw * 0.8, 0.016, (rand() - 0.5) * cd * 0.8], rot: [1.4, rand() * T, 0] }));
    baseY = 0.012;
  }
  const rows = 1 + A.count;
  for (let r = 0; r < rows; r++) {
    const perRow = A.arrange === 0 ? 2 : A.arrange === 1 ? 3 - (r % 2) : 2 + (r % 2);
    for (let i = 0; i < perRow; i++) {
      const cross = A.arrange === 2 && r % 2 === 1;
      const off = (i - (perRow - 1) / 2) * (cross ? L * 1.06 : W * 1.12);
      const ing = box(L, H, W, 2, 1, 1);
      const p = ing.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = (p.getY(v) + H / 2) / H;
        p.setX(v, p.getX(v) * (0.86 + t * 0.14));
        p.setZ(v, p.getZ(v) * (0.82 + t * 0.18));
      }
      p.needsUpdate = true;
      ing.computeVertexNormals();
      g.add(part(ing, mat, 'ingot-' + r + '-' + i, {
        pos: [cross ? off : (rand() - 0.5) * 0.002, baseY + H / 2 + r * H * 1.02, cross ? 0 : off],
        rot: [0, cross ? Math.PI / 2 : 0, 0],
      }));
      if (A.stamp && r === rows - 1) g.add(part(cyl(H * 0.22, H * 0.22, 0.0015, 8), MAT.blackIron, 'stamp-' + r + '-' + i, {
        pos: [cross ? off : 0, baseY + H * (r * 1.02 + 1), cross ? 0 : off],
      }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------- GEM PARCEL */
export const GEM_AXES = { count: 4, cut: 4, cloth: 3, scale: 2, tray: 3 };
export function gemParcel(variant = 0) {
  const A = axesOf(variant, GEM_AXES);
  const rand = rnd(variant * 149 + 105);
  const g = new THREE.Group();
  const s = 0.85 + A.scale * 0.4;
  let y = 0;
  if (A.tray === 1) { g.add(part(lathe([[0.05 * s, 0], [0.052 * s, 0.005], [0.046 * s, 0.008]], 14), MAT.darkOak, 'gem-tray')); y = 0.008; }
  else if (A.tray === 2) {
    g.add(part(box(0.1 * s, 0.012, 0.07 * s), MAT.darkOak, 'gem-box', { pos: [0, 0.006, 0] }));
    g.add(part(box(0.1 * s, 0.008, 0.07 * s), GOODS.leather, 'gem-box-lid', { pos: [0, 0.05 * s, -0.045 * s], rot: [-1.2, 0, 0] }));
    y = 0.012;
  }
  if (A.cloth) {
    const cw = 0.07 * s;
    const cloth = box(cw, 0.0025, cw * 0.8, 4, 1, 3);
    const p = cloth.attributes.position;
    for (let v = 0; v < p.count; v++) p.setY(v, p.getY(v) + Math.sin(p.getX(v) * 40) * 0.0015 + Math.cos(p.getZ(v) * 46) * 0.001);
    p.needsUpdate = true;
    cloth.computeVertexNormals();
    g.add(part(cloth, A.cloth === 2 ? GOODS.linenDark : GOODS.linen, 'parcel-cloth', { pos: [0, y + 0.0013, 0] }));
    y += 0.0025;
  }
  const n = 2 + A.count * 2;
  for (let i = 0; i < n; i++) {
    const r = (0.005 + rand() * 0.006) * s;
    const a = rand() * T, d = rand() * 0.026 * s;
    const px = Math.cos(a) * d, pz = Math.sin(a) * d;
    const cut = (i + A.cut) % 4;
    let geo;
    if (cut === 0) geo = new THREE.OctahedronGeometry(r, 0);
    else if (cut === 1) { geo = cyl(r * 0.9, r * 0.5, r * 1.4, 8); }
    else if (cut === 2) { geo = ico(r, 0); geo.scale(1, 0.7, 1); }
    else { geo = cone(r, r * 2, 6); }
    g.add(part(geo, i % 3 === 0 ? GOODS.gemWarm : GOODS.gem, 'gem-' + i, { pos: [px, y + r * 0.8, pz], rot: [rand() * 0.5, rand() * T, rand() * 0.4] }));
  }
  if (A.tray === 0) {
    for (let i = 0; i < 3; i++) g.add(part(ico(0.0025 * s, 0), MAT.boneLinen, 'grit-' + i, { pos: [(rand() - 0.5) * 0.06 * s, y + 0.001, (rand() - 0.5) * 0.05 * s] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------- REAGENT CRATE */
export const REAGENT_AXES = { size: 3, lid: 3, contents: 4, straw: 2, stencil: 3, stack: 3 };
export function reagentCrate(variant = 0) {
  const A = axesOf(variant, REAGENT_AXES);
  const rand = rnd(variant * 863 + 111);
  const g = new THREE.Group();
  const W = 0.24 + A.size * 0.09;
  const H = W * (0.5 + A.size * 0.06);
  const D = W * 0.72;
  const t = 0.012;
  const buildCrate = (yBase, scale, tag) => {
    const w = W * scale, h = H * scale, d = D * scale;
    g.add(part(box(w, t, d), MAT.weatheredTimber, tag + '-floor', { pos: [0, yBase + t / 2, 0] }));
    [-1, 1].forEach((s, i) => {
      g.add(part(box(w, h, t), MAT.weatheredTimber, tag + '-side-' + i, { pos: [0, yBase + h / 2, s * (d / 2 - t / 2)] }));
      g.add(part(box(t, h, d - t * 2), MAT.weatheredTimber, tag + '-end-' + i, { pos: [s * (w / 2 - t / 2), yBase + h / 2, 0] }));
      for (let k = 0; k < 2; k++) g.add(part(box(t * 0.6, h, t * 1.4), MAT.darkOak, tag + '-batten-' + i + '-' + k, { pos: [s * w * (0.2 + k * 0.22), yBase + h / 2, d / 2] }));
    });
    for (let c = 0; c < 4; c++) {
      const sx = c % 2 ? 1 : -1, sz = c < 2 ? 1 : -1;
      g.add(part(box(t * 1.2, h * 1.02, t * 1.2), MAT.darkOak, tag + '-corner-' + c, { pos: [sx * (w / 2 - t * 0.5), yBase + h / 2, sz * (d / 2 - t * 0.5)] }));
      g.add(part(box(t * 1.6, t * 0.5, t * 1.6), MAT.pittedIron, tag + '-corner-strap-' + c, { pos: [sx * (w / 2 - t * 0.5), yBase + h * 0.9, sz * (d / 2 - t * 0.5)] }));
    }
    return yBase + h;
  };
  let top = buildCrate(0, 1, 'crate');
  if (A.stack) for (let s = 0; s < A.stack; s++) top = buildCrate(top + 0.002, 0.86 - s * 0.08, 'crate-stacked-' + s);
  if (A.lid === 1) {
    g.add(part(box(W * 1.02, t, D * 1.02), MAT.weatheredTimber, 'lid', { pos: [0, top + t / 2, 0] }));
    g.add(part(box(W * 0.3, t * 0.5, D * 1.02), MAT.pittedIron, 'lid-strap', { pos: [0, top + t, 0] }));
  } else if (A.lid === 2) {
    g.add(part(box(W * 1.02, t, D * 1.02), MAT.weatheredTimber, 'lid-ajar', { pos: [W * 0.14, top + t * 1.6, 0], rot: [0, 0, 0.18] }));
  }
  if (A.lid !== 1) {
    const inner = W * 0.36;
    for (let i = 0; i < 1 + A.contents; i++) {
      const cx = (i % 2 ? 1 : -1) * inner * 0.5, cz = (i < 2 ? 1 : -1) * D * 0.2;
      const kind = (i + A.contents) % 4;
      if (kind === 0) {
        g.add(part(lathe([[0.02, 0], [0.026, 0.02], [0.024, 0.06], [0.014, 0.075], [0.016, 0.082]], 12), MAT.firedClay, 'jug-' + i, { pos: [cx, top * 0.62, cz] }));
        g.add(part(cyl(0.007, 0.008, 0.008, 8), GOODS.cork, 'jug-cork-' + i, { pos: [cx, top * 0.62 + 0.084, cz] }));
      } else if (kind === 1) {
        for (let k = 0; k < 3; k++) g.add(part(cyl(0.011, 0.011, 0.05, 10), GOODS.glassGreen, 'phial-' + i + '-' + k, { pos: [cx + (k - 1) * 0.026, top * 0.62 + 0.025, cz] }));
      } else if (kind === 2) {
        const b = ico(0.026, 1);
        jitter(b, 0.006, rand);
        g.add(part(b, MAT.pittedIron, 'ore-lump-' + i, { pos: [cx, top * 0.62 + 0.02, cz] }));
      } else {
        g.add(part(box(0.05, 0.03, 0.036), GOODS.linenDark, 'wrapped-parcel-' + i, { pos: [cx, top * 0.62 + 0.015, cz], rot: [0, rand() * 0.4, 0] }));
        g.add(part(box(0.052, 0.004, 0.008), MAT.ropeHemp, 'parcel-twine-' + i, { pos: [cx, top * 0.62 + 0.031, cz], rot: [0, rand() * 0.4, 0] }));
      }
    }
    if (A.straw) for (let k = 0; k < 7; k++) g.add(part(cone(0.004, 0.045, 4), GOODS.straw, 'straw-' + k, { pos: [(rand() - 0.5) * W * 0.7, top * 0.6, (rand() - 0.5) * D * 0.6], rot: [1.2 + rand() * 0.4, rand() * T, 0] }));
  }
  for (let i = 0; i < A.stencil; i++) {
    g.add(part(box(W * (0.16 + i * 0.05), H * 0.16, 0.0015), GOODS.parch, 'stencil-' + i, { pos: [-W * 0.2 + i * W * 0.2, H * (0.62 - i * 0.16), D / 2 + t * 0.6] }));
  }
  return seat(g);
}

export const GOODS_GENERATORS = [
  { id: 'goods.vials', name: 'Alchemical vials', axes: VIAL_AXES, build: alchemicalVials, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.apothecary-jar', name: 'Apothecary jars', axes: JAR_AXES, build: apothecaryJars, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.retort-rack', name: 'Retort rack', axes: RETORT_AXES, build: retortRack, domain: 'props', budgetClass: 'standard' },
  { id: 'goods.herb-bundle', name: 'Herb bundles', axes: HERB_AXES, build: herbBundles, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.sacks', name: 'Grain and spice sacks', axes: SACK_AXES, build: grainSacks, domain: 'props', budgetClass: 'minor' },
  { id: 'goods.amphora', name: 'Amphora set', axes: AMPHORA_AXES, build: amphoraSet, domain: 'props', budgetClass: 'standard' },
  { id: 'goods.food-board', name: 'Food board', axes: FOODBOARD_AXES, build: foodBoard, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.meat-hang', name: 'Cured meat hang', axes: MEATHANG_AXES, build: curedMeatHang, domain: 'props', budgetClass: 'standard' },
  { id: 'goods.fish-rack', name: 'Fish drying rack', axes: FISHRACK_AXES, build: fishDryingRack, domain: 'props', budgetClass: 'standard' },
  { id: 'goods.tankards', name: 'Tankard set', axes: TANKARD_AXES, build: tankardSet, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.scrolls', name: 'Scroll set and case', axes: SCROLL_AXES, build: scrollSet, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.tomes', name: 'Tome stack', axes: TOME_AXES, build: tomeStack, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.ink-set', name: 'Ink and quill set', axes: INKSET_AXES, build: inkAndQuillSet, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.coins', name: 'Coin pile', axes: COIN_AXES, build: coinPile, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.ingots', name: 'Ingot stack', axes: INGOT_AXES, build: ingotStack, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.gem-parcel', name: 'Gem parcel', axes: GEM_AXES, build: gemParcel, domain: 'items', budgetClass: 'minor' },
  { id: 'goods.reagent-crate', name: 'Reagent crate', axes: REAGENT_AXES, build: reagentCrate, domain: 'props', budgetClass: 'standard' },
];
