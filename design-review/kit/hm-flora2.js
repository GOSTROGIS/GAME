/* Flora families — parametric.
 *
 * The Hearthmere flora in hm-flora.js was authored as specific manifest rows:
 * one blackpine, one heather, one reed clump. Correct for a manifest, useless
 * as a catalogue — twenty-five assets that are each exactly one object.
 *
 * These are FAMILIES. Every generator resolves a flat variant index against
 * declared axes, and an axis is only declared when it changes silhouette or
 * material. The `form` axis on each is doing most of the work: a conifer and
 * a mangrove built from the same generator share code, not appearance.
 *
 * Palette is the design system's, unchanged — pine bark, needle, moss,
 * heather, reed, bone. New hues would have to be justified against
 * tokens/colors.css and none of these need one.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, cone, cyl, ico, seat, thin } from './hm-core.js';
import { axesOf, spaceOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const M = (name, color, rough) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: 0 });
  m.name = name;
  return m;
};

/* Flora is never shiny. Roughness floors at 0.82 across this whole file —
   wet leaves are a lighting result, not a material property. */
export const FLORA = {
  barkDark: M('bark-dark', '#2a2521', 0.95),
  barkPale: M('bark-pale', '#4a4034', 0.93),
  barkDead: M('bark-dead', '#5a5348', 0.96),
  barkGlass: M('bark-glasswood', '#2b3033', 0.62),   // cinderward glasswood
  leafDeep: M('leaf-deep', '#2b3a31', 0.88),
  leafPale: M('leaf-pale', '#4e6247', 0.86),
  leafDry: M('leaf-dry', '#6b5a3c', 0.9),
  needle: M('needle', '#26332c', 0.88),
  moss: M('moss', '#52665c', 0.9),
  heather: M('heather-bloom', '#5d3b39', 0.93),
  reed: M('reed-pale', '#6d6549', 0.93),
  bloomBone: M('bloom-bone', '#a9a291', 0.9),
  bloomGold: M('bloom-gold', '#8a6f36', 0.9),
  bloomBlood: M('bloom-blood', '#5e2a2a', 0.91),
  capPale: M('fungus-cap-pale', '#8d8371', 0.9),
  capDark: M('fungus-cap-dark', '#3d3630', 0.92),
  stemPale: M('fungus-stem', '#9a9384', 0.94),
};

/* A squashed low-poly blob: the whole trick behind stylised foliage mass. */
function mass(r, detail, rand, flat) {
  const g = ico(r, detail);
  g.scale(1.1 + rand() * 0.35, flat, 1.1 + rand() * 0.35);
  jitter(g, r * 0.34, rand);
  return g;
}

/* Place a mass so its outer edge droops. A ring of level discs is the single
   thing that makes procedural foliage look procedural. */
function bough(g, name, geo, mat, a, rad, y, droop, off) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(Math.cos(a) * rad + off[0], y, Math.sin(a) * rad + off[1]);
  m.rotation.set(Math.sin(a) * droop, a, -Math.cos(a) * droop);
  g.add(m);
}

/* ------------------------------------------------------------------- TREE
 * Five forms, and the form axis changes construction rather than parameters:
 * a conifer tiers, a broadleaf domes, a dead tree has no canopy at all, a
 * glasswood grows in fused vitreous shards, a mangrove stands on stilt roots.
 */
export const TREE_AXES = { form: 5, height: 4, canopy: 4, trunk: 3, lean: 3, bark: 3, damage: 3, understory: 2 };
export function tree(variant = 0) {
  const A = axesOf(variant, TREE_AXES);
  const rand = rnd(0x71ee + variant * 7919);
  const g = new THREE.Group();
  const forms = ['conifer', 'broadleaf', 'dead', 'glasswood', 'mangrove'];
  const form = forms[A.form];
  g.name = 'tree-' + form;

  const H = [4.5, 7, 10, 14][A.height];
  const girth = [0.055, 0.075, 0.1][A.trunk] * H;
  const leanK = [0, 0.05, 0.13][A.lean] * H;
  const bark = form === 'dead' ? FLORA.barkDead : form === 'glasswood' ? FLORA.barkGlass
    : [FLORA.barkDark, FLORA.barkPale, FLORA.barkDead][A.bark];
  const leaf = form === 'conifer' ? FLORA.needle
    : [FLORA.leafDeep, FLORA.leafPale, FLORA.leafDry, FLORA.moss][A.canopy];

  // Trunk. Mangroves start above the waterline on stilts.
  const trunkBase = form === 'mangrove' ? H * 0.22 : 0;
  const trunkH = H * (form === 'dead' ? 0.7 : 0.86) - trunkBase;
  const tg = limb(girth * 0.34, girth, trunkH, 12, 8);
  lean(tg, leanK, leanK * 0.4, 2.1);
  jitter(tg, girth * 0.13, rand);
  g.add(part(tg, bark, 'trunk', { pos: [0, trunkBase + trunkH / 2, 0] }));

  if (form === 'mangrove') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * T + rand() * 0.3;
      const r = limb(girth * 0.16, girth * 0.3, H * 0.4, 6, 3);
      lean(r, -Math.cos(a) * H * 0.14, -Math.sin(a) * H * 0.14, 1.5);
      jitter(r, 0.03, rand);
      g.add(part(r, bark, 'stilt-root-' + i, { pos: [Math.cos(a) * girth * 1.4, H * 0.2, Math.sin(a) * girth * 1.4] }));
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * T + 0.4;
      const r = cone(girth * 0.5, H * 0.1, 6, 2);
      jitter(r, 0.03, rand);
      g.add(part(r, bark, 'root-flare-' + i, {
        pos: [Math.cos(a) * girth * 0.8, H * 0.03, Math.sin(a) * girth * 0.8],
        rot: [Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6],
      }));
    }
  }

  // Limbs. Dead trees get more of them and no foliage, which is the point.
  const limbCount = form === 'dead' ? 9 : form === 'broadleaf' ? 7 : 6;
  for (let i = 0; i < limbCount; i++) {
    const a = rand() * T;
    const y = H * (0.3 + (i / limbCount) * 0.5);
    const len = H * (0.16 + rand() * 0.2);
    const br = limb(girth * 0.12, girth * 0.34, len, 6, 3);
    lean(br, 0, H * 0.03, 1.6);
    jitter(br, 0.03, rand);
    const m = new THREE.Mesh(br, bark);
    m.name = 'limb-' + i;
    m.rotation.set(0, -a, Math.PI / 2 + (form === 'dead' ? -0.2 : -0.42));
    m.position.set(Math.cos(a) * len * 0.4 + leanK * 0.5, y, Math.sin(a) * len * 0.4);
    g.add(m);
  }

  // Canopy by form.
  if (form === 'conifer') {
    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const f = t / tiers;
      const y = H * (0.5 + f * 0.45);
      const rad = H * 0.24 * (1 - f * 0.75);
      const n = 8 - t;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * T + t * 0.6;
        bough(g, 'needle-mass-' + t + '-' + i, mass(H * (0.075 - f * 0.03), i < 4 ? 1 : 0, rand, 0.28),
          leaf, a, rad * (0.6 + rand() * 0.4), y, 0.5, [leanK * 0.7, 0]);
      }
    }
  } else if (form === 'broadleaf' || form === 'mangrove') {
    const shells = form === 'mangrove' ? 9 : 13;
    for (let i = 0; i < shells; i++) {
      const a = rand() * T;
      const rad = H * 0.2 * rand();
      const y = H * (0.72 + rand() * 0.26);
      g.add(part(mass(H * (0.09 + rand() * 0.05), rand() > 0.4 ? 1 : 0, rand, 0.72), leaf, 'canopy-' + i, {
        pos: [Math.cos(a) * rad + leanK * 0.8, y, Math.sin(a) * rad],
        rot: [rand() * 0.4, rand() * T, rand() * 0.4],
      }));
    }
  } else if (form === 'glasswood') {
    // Fused vitreous shards instead of leaves — Cinderward's iron trees.
    for (let i = 0; i < 16; i++) {
      const a = rand() * T;
      const y = H * (0.45 + rand() * 0.5);
      g.add(part(cone(H * 0.02, H * (0.1 + rand() * 0.14), 4, 1), FLORA.barkGlass, 'shard-' + i, {
        pos: [Math.cos(a) * H * 0.13 + leanK * 0.7, y, Math.sin(a) * H * 0.13],
        rot: [(rand() - 0.5) * 1.6, rand() * T, (rand() - 0.5) * 1.6],
      }));
    }
  }

  // Damage: snapped leader, lightning scar, or a woodcutting face.
  if (A.damage === 1) {
    g.add(part(limb(girth * 0.1, girth * 0.3, H * 0.1, 6, 1), bark, 'snapped-leader', { pos: [leanK, H * 0.9, 0] }));
  } else if (A.damage === 2) {
    const cut = box(girth * 1.5, H * 0.06, girth * 0.9, 2, 1, 1);
    jitter(cut, 0.02, rand);
    g.add(part(cut, MAT.heartwood, 'woodcut-face', { pos: [girth * 0.5, H * 0.07, girth * 0.5], rot: [0, 0.4, 0.1] }));
  }
  // Understory: moss and litter at the foot.
  if (A.understory) {
    for (let i = 0; i < 6; i++) {
      const a = rand() * T;
      g.add(part(mass(girth * (0.5 + rand() * 0.6), 0, rand, 0.3), FLORA.moss, 'moss-pad-' + i, {
        pos: [Math.cos(a) * girth * 2.2, 0.02, Math.sin(a) * girth * 2.2], rot: [0, rand() * T, 0],
      }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------------ SHRUB */
export const SHRUB_AXES = { form: 4, size: 3, density: 4, leaf: 3, berry: 3, dead: 2 };
export function shrub(variant = 0) {
  const A = axesOf(variant, SHRUB_AXES);
  const rand = rnd(0x5b1b + variant * 6151);
  const g = new THREE.Group();
  const forms = ['mound', 'thorn-brake', 'upright', 'sprawl'];
  g.name = 'shrub-' + forms[A.form];
  const S = [0.6, 1.0, 1.6][A.size];
  const leaf = [FLORA.leafDeep, FLORA.leafPale, FLORA.leafDry][A.leaf];
  const stems = 5 + A.density * 3;

  for (let i = 0; i < stems; i++) {
    const a = (i / stems) * T + rand() * 0.5;
    const tilt = forms[A.form] === 'upright' ? 0.12 : forms[A.form] === 'sprawl' ? 0.9 : 0.45;
    const len = S * (0.6 + rand() * 0.5);
    const st = limb(0.008 * S, 0.022 * S, len, 5, 2);
    lean(st, S * 0.1, 0, 1.4);
    jitter(st, 0.008, rand);
    const m = new THREE.Mesh(st, A.dead && i % 3 === 0 ? FLORA.barkDead : FLORA.barkDark);
    m.name = 'stem-' + i;
    m.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    m.position.set(Math.cos(a) * S * 0.1, len * 0.45, Math.sin(a) * S * 0.1);
    g.add(m);
    // Foliage mass at the stem tip, unless it is a thorn brake.
    if (forms[A.form] !== 'thorn-brake') {
      g.add(part(mass(S * (0.13 + rand() * 0.1), i % 3 ? 0 : 1, rand, 0.66), leaf, 'leaf-mass-' + i, {
        pos: [Math.cos(a) * (S * 0.1 + len * tilt), len * 0.95, Math.sin(a) * (S * 0.1 + len * tilt)],
        rot: [rand() * 0.4, rand() * T, rand() * 0.4],
      }));
    } else {
      for (let t = 0; t < 3; t++) {
        g.add(part(cone(0.008 * S, 0.06 * S, 4, 1), FLORA.barkDead, 'thorn-' + i + '-' + t, {
          pos: [Math.cos(a) * (S * 0.1 + len * tilt * (0.4 + t * 0.3)), len * (0.4 + t * 0.25), Math.sin(a) * (S * 0.1 + len * tilt * (0.4 + t * 0.3))],
          rot: [(rand() - 0.5) * 1.4, 0, (rand() - 0.5) * 1.4],
        }));
      }
    }
  }
  // Berries or hips.
  if (A.berry > 0) {
    const bm = [FLORA.bloomBlood, FLORA.bloomGold, FLORA.bloomBone][A.berry - 1];
    for (let i = 0; i < 9; i++) {
      const a = rand() * T;
      g.add(part(ico(0.016 * S, 0), bm, 'berry-' + i, {
        pos: [Math.cos(a) * S * 0.34, S * (0.35 + rand() * 0.5), Math.sin(a) * S * 0.34],
      }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------- FLOWER */
export const FLOWER_AXES = { species: 6, bloom: 4, count: 4, height: 3, stage: 3 };
export function flower(variant = 0) {
  const A = axesOf(variant, FLOWER_AXES);
  const rand = rnd(0xf10 + variant * 4409);
  const g = new THREE.Group();
  const species = ['spire', 'umbel', 'bell', 'star', 'thistle', 'trumpet'];
  const sp = species[A.species];
  g.name = 'flower-' + sp;
  const H = [0.28, 0.5, 0.85][A.height];
  const bloomMat = [FLORA.bloomBone, FLORA.bloomGold, FLORA.bloomBlood, FLORA.heather][A.bloom];
  const stalks = 1 + A.count * 2;

  for (let s = 0; s < stalks; s++) {
    const off = s === 0 ? 0 : 0.05 + rand() * 0.09;
    const oa = rand() * T;
    const ox = Math.cos(oa) * off, oz = Math.sin(oa) * off;
    const h = H * (0.75 + rand() * 0.4);
    const st = limb(0.004, 0.008, h, 4, 2);
    lean(st, 0.04, 0.02, 1.4);
    g.add(part(st, FLORA.leafPale, 'stalk-' + s, { pos: [ox, h / 2, oz] }));
    // Basal leaves.
    for (let l = 0; l < 3; l++) {
      const la = rand() * T;
      const lf = ico(0.03 + rand() * 0.02, 0);
      lf.scale(2.4, 0.16, 0.9);
      g.add(part(lf, FLORA.leafPale, 'leaf-' + s + '-' + l, {
        pos: [ox + Math.cos(la) * 0.05, 0.02, oz + Math.sin(la) * 0.05], rot: [0, la, 0.2],
      }));
    }
    if (A.stage === 0) continue; // bud stage: stalk and leaves only
    const petals = A.stage === 1 ? 4 : 6;
    const bs = A.stage === 1 ? 0.7 : 1;

    if (sp === 'spire' || sp === 'thistle') {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const r = (sp === 'thistle' ? 0.03 : 0.022) * bs * (1 - t * 0.5);
        g.add(part(ico(r, 0), bloomMat, 'floret-' + s + '-' + i, { pos: [ox, h * (0.6 + t * 0.4), oz] }));
      }
    } else if (sp === 'umbel') {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * T;
        g.add(part(ico(0.014 * bs, 0), bloomMat, 'floret-' + s + '-' + i, {
          pos: [ox + Math.cos(a) * 0.05, h, oz + Math.sin(a) * 0.05],
        }));
      }
    } else if (sp === 'bell' || sp === 'trumpet') {
      const prof = sp === 'bell'
        ? [[0.006, 0], [0.02, 0.02], [0.028, 0.05], [0.022, 0.062]]
        : [[0.005, 0], [0.014, 0.03], [0.03, 0.07], [0.038, 0.08]];
      for (let i = 0; i < Math.min(3, 1 + A.stage); i++) {
        g.add(part(lathe(prof.map(([r, y]) => [r * bs, y * bs]), 10), bloomMat, 'bell-' + s + '-' + i, {
          pos: [ox + (rand() - 0.5) * 0.03, h - i * 0.07, oz + (rand() - 0.5) * 0.03], rot: [Math.PI + 0.2, 0, 0],
        }));
      }
    } else {
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * T;
        const p = ico(0.018 * bs, 0);
        p.scale(1.9, 0.2, 0.8);
        g.add(part(p, bloomMat, 'petal-' + s + '-' + i, {
          pos: [ox + Math.cos(a) * 0.022, h, oz + Math.sin(a) * 0.022], rot: [0, a, 0.25],
        }));
      }
      g.add(part(ico(0.01 * bs, 0), FLORA.bloomGold, 'centre-' + s, { pos: [ox, h + 0.004, oz] }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------- FUNGUS */
export const FUNGUS_AXES = { form: 5, size: 4, count: 3, cap: 3, glow: 2 };
export function fungus(variant = 0) {
  const A = axesOf(variant, FUNGUS_AXES);
  const rand = rnd(0xfa6 + variant * 3313);
  const g = new THREE.Group();
  const forms = ['cap', 'bracket', 'cluster', 'puffball', 'coral'];
  const form = forms[A.form];
  g.name = 'fungus-' + form;
  const S = [0.1, 0.2, 0.36, 0.6][A.size];
  const capMat = A.glow
    ? (() => { const m = FLORA.capPale.clone(); m.name = 'fungus-cap-lit'; m.emissive = new THREE.Color('#658e9e'); m.emissiveIntensity = 0.9; return m; })()
    : [FLORA.capPale, FLORA.capDark, FLORA.moss][A.cap];
  const n = 1 + A.count * 2;

  for (let i = 0; i < n; i++) {
    const a = rand() * T;
    const off = i === 0 ? 0 : S * (0.5 + rand() * 1.1);
    const ox = Math.cos(a) * off, oz = Math.sin(a) * off;
    const s = S * (0.6 + rand() * 0.6);
    if (form === 'bracket') {
      const b = ico(s, 1);
      b.scale(1.7, 0.3, 1.0);
      jitter(b, s * 0.16, rand);
      g.add(part(b, capMat, 'bracket-' + i, { pos: [ox, s * (0.6 + i * 0.7), oz], rot: [0.2, a, 0] }));
    } else if (form === 'puffball') {
      g.add(part(jitter(ico(s * 0.8, 1), s * 0.14, rand), capMat, 'puff-' + i, { pos: [ox, s * 0.7, oz] }));
    } else if (form === 'coral') {
      for (let b = 0; b < 6; b++) {
        const ba = (b / 6) * T;
        g.add(part(limb(s * 0.05, s * 0.12, s * 1.3, 5, 2), capMat, 'branch-' + i + '-' + b, {
          pos: [ox + Math.cos(ba) * s * 0.2, s * 0.7, oz + Math.sin(ba) * s * 0.2],
          rot: [Math.sin(ba) * 0.4, 0, -Math.cos(ba) * 0.4],
        }));
      }
    } else {
      g.add(part(limb(s * 0.16, s * 0.24, s * 1.1, 8, 2), FLORA.stemPale, 'stem-' + i, { pos: [ox, s * 0.55, oz] }));
      const cap = lathe([[0, 0], [s * 0.45, s * 0.06], [s * 0.7, s * 0.26], [s * 0.72, s * 0.34], [s * 0.3, s * 0.4], [0, s * 0.42]], 14);
      jitter(cap, s * 0.04, rand);
      g.add(part(cap, capMat, 'cap-' + i, { pos: [ox, s * 1.0, oz] }));
      // Gills read at inspect scale and cost twelve triangles.
      for (let k = 0; k < 6; k++) {
        g.add(part(box(s * 0.6, s * 0.02, s * 0.02), FLORA.stemPale, 'gill-' + i + '-' + k, {
          pos: [ox, s * 1.02, oz], rot: [0, (k / 6) * Math.PI, 0],
        }));
      }
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------------- VINE */
export const VINE_AXES = { form: 4, length: 4, leaf: 3, flower: 3, density: 3 };
export function vine(variant = 0) {
  const A = axesOf(variant, VINE_AXES);
  const rand = rnd(0x1e0 + variant * 2711);
  const g = new THREE.Group();
  const forms = ['hanging', 'climbing', 'ground-creep', 'wreath'];
  g.name = 'vine-' + forms[A.form];
  const L = [0.8, 1.6, 2.6, 4.0][A.length];
  const leaf = [FLORA.leafDeep, FLORA.leafPale, FLORA.moss][A.leaf];
  const segs = Math.round(L * 4);
  const runs = 1 + A.density;

  for (let r = 0; r < runs; r++) {
    const phase = rand() * T;
    const ox = (rand() - 0.5) * 0.3, oz = (rand() - 0.5) * 0.3;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      let x = ox, y = 0, z = oz;
      if (forms[A.form] === 'hanging') { y = L - t * L; x += Math.sin(phase + t * 7) * 0.12; z += Math.cos(phase + t * 6) * 0.1; }
      else if (forms[A.form] === 'climbing') { y = t * L; x += Math.sin(phase + t * 5) * 0.16; z += Math.cos(phase + t * 5) * 0.06; }
      else if (forms[A.form] === 'ground-creep') { y = 0.03; x += Math.cos(phase + t * 4) * t * L * 0.5; z += Math.sin(phase + t * 4) * t * L * 0.5; }
      else { const a = phase + t * T; y = L * 0.4; x += Math.cos(a) * L * 0.3; z += Math.sin(a) * L * 0.3; }
      g.add(part(limb(0.01, 0.014, (L / segs) * 1.3, 5, 1), FLORA.barkDark, 'stem-' + r + '-' + i, {
        pos: [x, y, z], rot: [(rand() - 0.5) * 0.7, rand() * T, (rand() - 0.5) * 0.7],
      }));
      if (i % 2 === 0) {
        const lf = ico(0.035 + rand() * 0.025, 0);
        lf.scale(1.7, 0.2, 1.1);
        g.add(part(lf, leaf, 'leaf-' + r + '-' + i, { pos: [x, y, z], rot: [(rand() - 0.5) * 0.9, rand() * T, (rand() - 0.5) * 0.9] }));
      }
      if (A.flower > 0 && i % 5 === 2) {
        g.add(part(ico(0.017, 0), [FLORA.bloomBone, FLORA.bloomBlood, FLORA.bloomGold][A.flower - 1], 'bloom-' + r + '-' + i, { pos: [x, y - 0.03, z] }));
      }
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- GRASS TUSSOCK */
export const GRASS_AXES = { form: 4, size: 3, blades: 4, seed: 3, colour: 3 };
export function grassTussock(variant = 0) {
  const A = axesOf(variant, GRASS_AXES);
  const rand = rnd(0x67a + variant * 1871);
  const g = new THREE.Group();
  const forms = ['tussock', 'fan', 'reed', 'sedge'];
  g.name = 'grass-' + forms[A.form];
  const S = [0.3, 0.6, 1.2][A.size];
  const n = 6 + A.blades * 5;
  const mat = [FLORA.reed, FLORA.leafDry, FLORA.leafPale][A.colour];

  for (let i = 0; i < n; i++) {
    const a = rand() * T;
    const rad = rand() * S * 0.16;
    const len = S * (0.6 + rand() * 0.6);
    const bl = box(0.016 * S, len, 0.004, 1, 4, 1);
    const p = bl.attributes.position;
    const bend = forms[A.form] === 'fan' ? 0.4 : forms[A.form] === 'reed' ? 0.12 : 0.26;
    for (let v = 0; v < p.count; v++) {
      const t = (p.getY(v) + len / 2) / len;
      p.setX(v, p.getX(v) * (1 - t * 0.8));
      p.setZ(v, p.getZ(v) + t * t * bend * S);
    }
    p.needsUpdate = true;
    bl.computeVertexNormals();
    g.add(part(bl, mat, 'blade-' + i, { pos: [Math.cos(a) * rad, len / 2, Math.sin(a) * rad], rot: [0, a, (rand() - 0.5) * 0.2] }));
  }
  if (A.seed > 0) {
    for (let i = 0; i < A.seed * 2; i++) {
      const a = rand() * T;
      const sh = ico(0.018 * S, 0);
      sh.scale(0.7, 2.8, 0.7);
      g.add(part(sh, FLORA.bloomBone, 'seed-head-' + i, { pos: [Math.cos(a) * S * 0.12, S * (0.7 + rand() * 0.4), Math.sin(a) * S * 0.12], rot: [0.3, rand() * T, 0.2] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- DEADFALL */
export const DEADFALL_AXES = { form: 4, size: 3, rot: 3, growth: 3, split: 2 };
export function deadfall(variant = 0) {
  const A = axesOf(variant, DEADFALL_AXES);
  const rand = rnd(0xdea + variant * 1439);
  const g = new THREE.Group();
  const forms = ['log', 'stump', 'snag', 'root-plate'];
  const form = forms[A.form];
  g.name = 'deadfall-' + form;
  const S = [0.8, 1.6, 2.8][A.size];
  const bark = [FLORA.barkDead, FLORA.barkDark, FLORA.barkPale][A.rot];

  if (form === 'log') {
    const lg = limb(S * 0.14, S * 0.17, S * 2.2, 12, 4);
    jitter(lg, S * 0.03, rand);
    g.add(part(lg, bark, 'log', { pos: [0, S * 0.16, 0], rot: [0, rand() * T, Math.PI / 2] }));
    if (A.split) {
      g.add(part(limb(S * 0.09, S * 0.12, S * 0.9, 8, 2), MAT.heartwood, 'split-half', { pos: [S * 0.4, S * 0.3, S * 0.2], rot: [0, 0.4, Math.PI / 2 + 0.2] }));
    }
  } else if (form === 'stump') {
    const st = limb(S * 0.3, S * 0.38, S * 0.6, 14, 3);
    jitter(st, S * 0.04, rand);
    g.add(part(st, bark, 'stump', { pos: [0, S * 0.3, 0] }));
    const face = ico(S * 0.28, 1);
    face.scale(1.1, 0.14, 1.1);
    jitter(face, S * 0.05, rand);
    g.add(part(face, MAT.heartwood, 'shear-face', { pos: [0, S * 0.6, 0] }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * T;
      g.add(part(cone(S * 0.11, S * 0.5, 6, 2), bark, 'root-' + i, {
        pos: [Math.cos(a) * S * 0.3, S * 0.1, Math.sin(a) * S * 0.3], rot: [Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1],
      }));
    }
  } else if (form === 'snag') {
    const sn = limb(S * 0.08, S * 0.3, S * 2.4, 10, 5);
    lean(sn, S * 0.3, S * 0.1, 1.8);
    jitter(sn, S * 0.05, rand);
    g.add(part(sn, bark, 'snag', { pos: [0, S * 1.2, 0] }));
    for (let i = 0; i < 4; i++) {
      const a = rand() * T;
      g.add(part(limb(S * 0.03, S * 0.08, S * 0.7, 5, 2), bark, 'broken-limb-' + i, {
        pos: [Math.cos(a) * S * 0.2, S * (0.7 + rand() * 1.2), Math.sin(a) * S * 0.2], rot: [0, -a, 1.2],
      }));
    }
  } else {
    // Root plate: a fallen tree's upended disc of roots and soil.
    const pl = ico(S * 0.9, 1);
    pl.scale(1.0, 0.22, 1.0);
    jitter(pl, S * 0.1, rand);
    g.add(part(pl, bark, 'root-plate', { pos: [0, S * 0.5, 0], rot: [1.3, 0, 0.2] }));
    for (let i = 0; i < 9; i++) {
      const a = rand() * T;
      g.add(part(limb(S * 0.02, S * 0.06, S * 0.6, 4, 2), bark, 'torn-root-' + i, {
        pos: [Math.cos(a) * S * 0.5, S * (0.4 + rand() * 0.6), Math.sin(a) * S * 0.3],
        rot: [(rand() - 0.5) * 2, rand() * T, (rand() - 0.5) * 2],
      }));
    }
  }
  // What has moved in since it fell.
  if (A.growth > 0) {
    const gm = [FLORA.moss, FLORA.capPale, FLORA.leafPale][A.growth - 1];
    for (let i = 0; i < A.growth * 4; i++) {
      const a = rand() * T;
      g.add(part(mass(S * (0.08 + rand() * 0.08), 0, rand, 0.3), gm, 'growth-' + i, {
        pos: [Math.cos(a) * S * 0.6, S * (0.1 + rand() * 0.4), Math.sin(a) * S * 0.5], rot: [0, rand() * T, 0],
      }));
    }
  }
  return seat(g);
}

export const FLORA_GENERATORS = [
  { id: 'flora.tree', name: 'Tree', axes: TREE_AXES, build: tree, domain: 'world', budgetClass: 'hero' },
  { id: 'flora.shrub', name: 'Shrub', axes: SHRUB_AXES, build: shrub, domain: 'world', budgetClass: 'standard' },
  { id: 'flora.flower', name: 'Flower', axes: FLOWER_AXES, build: flower, domain: 'world', budgetClass: 'minor' },
  { id: 'flora.fungus', name: 'Fungus', axes: FUNGUS_AXES, build: fungus, domain: 'dungeon', budgetClass: 'minor' },
  { id: 'flora.vine', name: 'Vine', axes: VINE_AXES, build: vine, domain: 'world', budgetClass: 'standard' },
  { id: 'flora.grass-tussock', name: 'Grass tussock', axes: GRASS_AXES, build: grassTussock, domain: 'world', budgetClass: 'minor' },
  { id: 'flora.deadfall', name: 'Deadfall', axes: DEADFALL_AXES, build: deadfall, domain: 'world', budgetClass: 'standard' },
];
