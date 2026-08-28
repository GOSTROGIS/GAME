/* Geology, volcanic and water families — parametric.
 *
 * Covers the explicitly-missing categories: rock, cliffs, caves, volcano,
 * lava, lakes, rivers, oceans, ice.
 *
 * One honest caveat carried from the gap analysis: a lake is terrain topology
 * plus a surface, not an object you place. These generators build the
 * PLACEABLE part — the basin lip, the shore, the surface patch, the falls —
 * so a level can be dressed with water without a terrain rewrite. A real
 * ocean is a horizon shader and belongs with terrain, not here.
 *
 * Likewise a volcano is a region with its own heightfield and hazard system.
 * What is here is the placeable vocabulary: vents, fumaroles, spatter cones,
 * flows, bombs and crust.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat, thin } from './hm-core.js';
import { STEAM, axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const M = (name, color, rough, metal = 0, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal, ...extra });
  m.name = name;
  return m;
};

export const GEO = {
  graniteDark: M('granite-dark', '#3c4144', 0.9),
  graniteGrey: M('granite-grey', '#575c5e', 0.88),
  limestone: M('limestone', '#68706b', 0.86),
  shale: M('shale', '#2f3436', 0.92),
  flint: M('flint', '#33393b', 0.74),
  basalt: M('basalt', '#22252a', 0.9),
  scoria: M('scoria', '#3a2620', 0.95),
  obsidian: M('obsidian', '#14151a', 0.28, 0.1),
  sulfur: M('sulfur-crust', '#8a7f46', 0.94),
  ashPale: M('ash-pale', '#5f5c56', 0.97),
  mineralWhite: M('mineral-white', '#a8a496', 0.9),
  mineralRust: M('mineral-rust', '#6b4227', 0.9),
  lavaHot: M('lava-hot', '#4a1a08', 0.62, 0, { emissive: new THREE.Color('#e8641f'), emissiveIntensity: 2.6 }),
  lavaCooling: M('lava-cooling', '#33170c', 0.74, 0, { emissive: new THREE.Color('#a83c12'), emissiveIntensity: 1.2 }),
  waterDark: M('blackwater', '#12292d', 0.16, 0.12, { transparent: true, opacity: 0.9 }),
  waterClear: M('clear-water', '#20454a', 0.1, 0.14, { transparent: true, opacity: 0.72 }),
  waterMurk: M('mire-water', '#22281f', 0.24, 0.08, { transparent: true, opacity: 0.95 }),
  foam: M('foam', '#9aa5a2', 0.9, 0, { transparent: true, opacity: 0.8 }),
  ice: M('ice', '#7f9aa4', 0.14, 0.04, { transparent: true, opacity: 0.66 }),
  snow: M('snow', '#c4cdd0', 0.93),
  moss: M('moss', '#52665c', 0.9),
  lichen: M('lichen', '#8e928b', 0.94),
};

/* An irregular boulder: an icosahedron pushed around until it stops looking
   like an icosahedron. Strata flatten it along one axis. */
function boulder(r, detail, rand, flatten) {
  const g = ico(r, detail);
  g.scale(1 + rand() * 0.5, flatten, 1 + rand() * 0.5);
  jitter(g, r * 0.3, rand);
  return g;
}

/* --------------------------------------------------------- ROCK FORMATION */
export const ROCK_AXES = { form: 6, size: 4, strata: 3, growth: 3, split: 3, stone: 3, count: 3 };
export function rockFormation(variant = 0) {
  const A = axesOf(variant, ROCK_AXES);
  const rand = rnd(0x0c1 + variant * 7919);
  const g = new THREE.Group();
  const forms = ['boulder', 'outcrop', 'stack', 'tor', 'scree', 'monolith'];
  const form = forms[A.form];
  g.name = 'rock-' + form;
  const S = [0.5, 1.2, 2.4, 4.5][A.size];
  const stone = [GEO.graniteDark, GEO.graniteGrey, GEO.limestone][A.stone];
  const flat = [0.9, 0.5, 0.3][A.strata];
  const n = form === 'scree' ? 9 + A.count * 5 : 1 + A.count;

  if (form === 'monolith') {
    const m = box(S * 0.4, S * 2.2, S * 0.32, 2, 5, 2);
    lean(m, S * 0.1, S * 0.05, 1.4);
    jitter(m, S * 0.05, rand);
    g.add(part(m, stone, 'monolith', { pos: [0, S * 1.1, 0] }));
  } else if (form === 'stack' || form === 'tor') {
    // Stacked slabs — the strata axis is doing the silhouette work here.
    let y = 0;
    const layers = 3 + A.count * 2;
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const r = S * (form === 'tor' ? 0.7 - t * 0.25 : 0.6 - t * 0.42);
      const h = S * (0.22 + rand() * 0.2) * flat * 2;
      const b = boulder(r, 1, rand, (h / r) * 0.6);
      g.add(part(b, stone, 'slab-' + i, { pos: [(rand() - 0.5) * S * 0.16, y + h / 2, (rand() - 0.5) * S * 0.16], rot: [0, rand() * T, (rand() - 0.5) * 0.1] }));
      y += h * 0.86;
    }
  } else if (form === 'scree') {
    for (let i = 0; i < n; i++) {
      const a = rand() * T, rad = rand() * S * 1.4;
      const r = S * (0.06 + rand() * 0.16);
      g.add(part(boulder(r, 0, rand, 0.7), stone, 'scree-' + i, { pos: [Math.cos(a) * rad, r * 0.55, Math.sin(a) * rad], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  } else {
    for (let i = 0; i < n; i++) {
      const a = rand() * T, rad = i === 0 ? 0 : S * (0.4 + rand() * 0.6);
      const r = S * (i === 0 ? 0.6 : 0.22 + rand() * 0.24);
      g.add(part(boulder(r, 1, rand, flat), stone, 'mass-' + i, {
        pos: [Math.cos(a) * rad, r * flat * 0.85, Math.sin(a) * rad], rot: [(rand() - 0.5) * 0.3, rand() * T, (rand() - 0.5) * 0.3],
      }));
    }
  }
  // Split: a cleft with a differently-lit interior face.
  if (A.split > 0) {
    const cl = box(S * 0.08 * A.split, S * (form === 'monolith' ? 1.6 : 0.8), S * 0.9, 1, 3, 2);
    jitter(cl, S * 0.03, rand);
    g.add(part(cl, GEO.shale, 'cleft', { pos: [S * 0.1, S * 0.5, 0], rot: [0, rand() * 0.5, 0.08] }));
  }
  // Growth: lichen, moss, or a rooted seedling.
  if (A.growth > 0) {
    const gm = A.growth === 1 ? GEO.lichen : GEO.moss;
    for (let i = 0; i < A.growth * 4; i++) {
      const a = rand() * T;
      const p = boulder(S * (0.07 + rand() * 0.07), 0, rand, 0.2);
      g.add(part(p, gm, 'growth-' + i, { pos: [Math.cos(a) * S * 0.5, S * (0.15 + rand() * 0.6), Math.sin(a) * S * 0.5], rot: [0, rand() * T, 0] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- CLIFF FACE */
export const CLIFF_AXES = { form: 4, height: 4, strata: 4, talus: 3, growth: 3, stone: 3 };
export function cliffFace(variant = 0) {
  const A = axesOf(variant, CLIFF_AXES);
  const rand = rnd(0xc11f + variant * 6151);
  const g = new THREE.Group();
  const forms = ['sheer', 'stepped', 'overhang', 'buttressed'];
  const form = forms[A.form];
  g.name = 'cliff-' + form;
  const H = [3, 6, 10, 16][A.height];
  const W = H * 1.6;
  const stone = [GEO.graniteDark, GEO.limestone, GEO.shale][A.stone];
  const bands = 3 + A.strata * 2;

  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    const bh = H / bands;
    // Overhang leans out with height; stepped recedes.
    const push = form === 'overhang' ? t * H * 0.16 : form === 'stepped' ? -t * H * 0.2 : 0;
    const b = box(W * (0.9 + rand() * 0.2), bh * 1.04, H * 0.5, 5, 1, 2);
    jitter(b, bh * 0.16, rand);
    g.add(part(b, i % 2 && A.strata >= 2 ? GEO.shale : stone, 'band-' + i, {
      pos: [(rand() - 0.5) * W * 0.05, bh * (i + 0.5), push], rot: [0, (rand() - 0.5) * 0.06, 0],
    }));
  }
  if (form === 'buttressed') {
    for (let i = 0; i < 3; i++) {
      const x = -W * 0.32 + i * W * 0.32;
      const bt = box(W * 0.16, H * 0.75, H * 0.3, 2, 4, 2);
      jitter(bt, H * 0.03, rand);
      g.add(part(bt, stone, 'buttress-' + i, { pos: [x, H * 0.37, H * 0.3] }));
    }
  }
  // Talus at the foot — a cliff without a debris cone reads as a wall.
  if (A.talus > 0) {
    for (let i = 0; i < A.talus * 8; i++) {
      const r = H * (0.02 + rand() * 0.05);
      g.add(part(boulder(r, 0, rand, 0.8), stone, 'talus-' + i, {
        pos: [(rand() - 0.5) * W, r * 0.6, H * 0.28 + rand() * H * 0.3], rot: [rand() * T, rand() * T, rand() * T],
      }));
    }
  }
  if (A.growth > 0) {
    for (let i = 0; i < A.growth * 5; i++) {
      g.add(part(boulder(H * 0.03, 0, rand, 0.25), i % 2 ? GEO.moss : GEO.lichen, 'growth-' + i, {
        pos: [(rand() - 0.5) * W, rand() * H, H * 0.25 + rand() * 0.2], rot: [1.2, rand() * T, 0],
      }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------ CAVE FEATURE */
export const CAVE_AXES = { form: 6, size: 4, mineral: 3, wet: 3, count: 3, stone: 3 };
export function caveFeature(variant = 0) {
  const A = axesOf(variant, CAVE_AXES);
  const rand = rnd(0xca7e + variant * 4409);
  const g = new THREE.Group();
  const forms = ['stalactite', 'stalagmite', 'column', 'flowstone', 'crystal-cluster', 'rimstone-pool'];
  const form = forms[A.form];
  g.name = 'cave-' + form;
  const S = [0.4, 0.9, 1.8, 3.2][A.size];
  const stone = [GEO.limestone, GEO.mineralWhite, GEO.graniteGrey][A.stone];
  const mineral = [GEO.mineralWhite, GEO.mineralRust, GEO.sulfur][A.mineral];
  const n = 1 + A.count * 2;

  if (form === 'stalactite' || form === 'stalagmite' || form === 'column') {
    for (let i = 0; i < n; i++) {
      const a = rand() * T, rad = i === 0 ? 0 : S * rand() * 0.5;
      const h = S * (i === 0 ? 1 : 0.4 + rand() * 0.5);
      const r = S * 0.1 * (h / S);
      // Dripstone profile: bulbous rings, never a smooth cone.
      const pts = [];
      const segs = 6;
      for (let k = 0; k <= segs; k++) {
        const t = k / segs;
        pts.push([r * (1 - t * 0.85) * (1 + Math.sin(t * 9) * 0.22), h * t]);
      }
      const geo = lathe(pts, 12);
      jitter(geo, r * 0.12, rand);
      const down = form === 'stalactite';
      g.add(part(geo, stone, form + '-' + i, {
        pos: [Math.cos(a) * rad, down ? h : 0, Math.sin(a) * rad], rot: [down ? Math.PI : 0, rand() * T, 0],
      }));
      if (form === 'column' && i === 0) {
        g.add(part(lathe(pts, 12), stone, 'column-upper', { pos: [0, h * 2, 0], rot: [Math.PI, 0, 0] }));
      }
    }
  } else if (form === 'flowstone') {
    for (let i = 0; i < 4 + A.count * 2; i++) {
      const t = i / (4 + A.count * 2);
      const sh = boulder(S * (0.36 - t * 0.1), 1, rand, 0.34);
      g.add(part(sh, mineral, 'flow-lobe-' + i, { pos: [(rand() - 0.5) * S * 0.3, S * t * 0.9, S * t * 0.22], rot: [0.2, rand() * T, 0] }));
    }
  } else if (form === 'crystal-cluster') {
    const cm = M('cave-crystal', A.mineral === 2 ? '#7d7a4a' : '#6f8f9b', 0.22, 0.04, { transparent: true, opacity: 0.7 });
    for (let i = 0; i < 5 + A.count * 3; i++) {
      const a = rand() * T, tilt = 0.2 + rand() * 0.9;
      g.add(part(cone(S * (0.05 + rand() * 0.06), S * (0.3 + rand() * 0.5), 5, 1), cm, 'crystal-' + i, {
        pos: [Math.cos(a) * S * 0.25, S * 0.2, Math.sin(a) * S * 0.25],
        rot: [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt],
      }));
    }
    g.add(part(boulder(S * 0.34, 1, rand, 0.5), stone, 'matrix', { pos: [0, S * 0.1, 0] }));
  } else {
    // Rimstone pool: terraced dams holding still water.
    for (let i = 0; i < 3 + A.count; i++) {
      const r = S * (0.6 - i * 0.13);
      g.add(part(lathe([[r * 0.86, 0], [r, S * 0.03], [r * 0.97, S * 0.07], [r * 0.9, S * 0.075]], 18), mineral, 'rim-' + i, { pos: [0, S * i * 0.07, 0] }));
      g.add(thin(part(new THREE.CircleGeometry(r * 0.88, 18), A.wet ? GEO.waterClear : GEO.mineralWhite, 'pool-' + i, { pos: [0, S * (i * 0.07 + 0.05), 0], rot: [-Math.PI / 2, 0, 0] })));
    }
  }
  // Wet: mineral staining and a drip.
  if (A.wet > 0) {
    for (let i = 0; i < A.wet * 3; i++) {
      g.add(part(boulder(S * 0.06, 0, rand, 0.2), mineral, 'stain-' + i, { pos: [(rand() - 0.5) * S * 0.6, rand() * S * 0.5, (rand() - 0.5) * S * 0.6], rot: [0, rand() * T, 0] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------- VOLCANIC VENT */
export const VENT_AXES = { form: 5, size: 4, activity: 4, crust: 3, ejecta: 3, sulfur: 3 };
export function volcanicVent(variant = 0) {
  const A = axesOf(variant, VENT_AXES);
  const rand = rnd(0x901c + variant * 3313);
  const g = new THREE.Group();
  const forms = ['fumarole', 'spatter-cone', 'fissure', 'lava-tube-mouth', 'crater'];
  const form = forms[A.form];
  g.name = 'volcanic-' + form;
  const S = [0.8, 1.8, 3.4, 6][A.size];
  const rock = [GEO.basalt, GEO.scoria, GEO.obsidian][A.crust];
  const hot = A.activity === 0 ? null : A.activity === 1 ? GEO.lavaCooling : GEO.lavaHot;

  if (form === 'spatter-cone' || form === 'crater') {
    // A cone built from spatter clots, not a smooth lathe — spatter is lumpy.
    const rings = 5;
    for (let r = 0; r < rings; r++) {
      const t = r / rings;
      const rad = S * (0.55 - t * 0.3);
      const y = S * t * (form === 'crater' ? 0.28 : 0.6);
      const n = Math.max(6, Math.round(14 - r * 2));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * T + r * 0.4;
        g.add(part(boulder(S * (0.09 - t * 0.03), 0, rand, 0.7), rock, 'clot-' + r + '-' + i, {
          pos: [Math.cos(a) * rad, y, Math.sin(a) * rad], rot: [rand() * T, rand() * T, rand() * T],
        }));
      }
    }
    if (hot) {
      const throatR = S * (form === 'crater' ? 0.28 : 0.2);
      g.add(thin(part(new THREE.CircleGeometry(throatR, 14), hot, 'throat', { pos: [0, S * (form === 'crater' ? 0.22 : 0.5), 0], rot: [-Math.PI / 2, 0, 0] })));
      for (let i = 0; i < 5; i++) {
        const a = rand() * T;
        g.add(part(boulder(S * 0.05, 0, rand, 0.6), hot, 'glowing-clot-' + i, { pos: [Math.cos(a) * throatR * 0.8, S * (form === 'crater' ? 0.24 : 0.52), Math.sin(a) * throatR * 0.8] }));
      }
    }
  } else if (form === 'fissure') {
    const L = S * 2.4;
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const wobble = Math.sin(t * 7) * S * 0.16;
      [-1, 1].forEach((s, j) => {
        g.add(part(boulder(S * (0.1 + rand() * 0.07), 0, rand, 0.8), rock, 'lip-' + i + '-' + j, {
          pos: [-L / 2 + t * L, S * 0.05, wobble + s * S * 0.18], rot: [rand() * T, rand() * T, rand() * T],
        }));
      });
    }
    if (hot) {
      for (let i = 0; i < 10; i++) {
        const t = i / 10;
        g.add(part(box(L / 11, 0.03, S * 0.1), hot, 'fissure-glow-' + i, { pos: [-L / 2 + t * L, S * 0.02, Math.sin(t * 7) * S * 0.16] }));
      }
    }
  } else if (form === 'lava-tube-mouth') {
    // An arched mouth of collapsed basalt.
    for (let i = 0; i < 11; i++) {
      const a = (Math.PI * (i + 0.5)) / 11;
      g.add(part(boulder(S * 0.16, 0, rand, 0.8), rock, 'mouth-' + i, {
        pos: [Math.cos(a) * S * 0.7, Math.sin(a) * S * 0.7, 0], rot: [rand() * T, rand() * T, rand() * T],
      }));
    }
    if (hot) g.add(thin(part(new THREE.PlaneGeometry(S * 1.1, S * 0.6), hot, 'tube-glow', { pos: [0, S * 0.3, -S * 0.1] })));
    for (let i = 0; i < 7; i++) {
      g.add(part(boulder(S * (0.08 + rand() * 0.08), 0, rand, 0.7), rock, 'collapse-' + i, { pos: [(rand() - 0.5) * S * 1.2, S * 0.08, S * (0.2 + rand() * 0.5)], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  } else {
    // Fumarole: a low mound with a sulfur-rimmed throat.
    g.add(part(boulder(S * 0.5, 1, rand, 0.42), rock, 'mound', { pos: [0, S * 0.1, 0] }));
    g.add(part(lathe([[S * 0.14, 0], [S * 0.18, S * 0.04], [S * 0.13, S * 0.09]], 14), GEO.sulfur, 'throat-rim', { pos: [0, S * 0.2, 0] }));
    if (hot) g.add(thin(part(new THREE.CircleGeometry(S * 0.12, 12), hot, 'throat', { pos: [0, S * 0.22, 0], rot: [-Math.PI / 2, 0, 0] })));
  }
  // Sulfur staining — the tell that a vent is live even when it is not glowing.
  if (A.sulfur > 0) {
    for (let i = 0; i < A.sulfur * 5; i++) {
      const a = rand() * T;
      g.add(part(boulder(S * (0.05 + rand() * 0.06), 0, rand, 0.22), GEO.sulfur, 'sulfur-' + i, {
        pos: [Math.cos(a) * S * (0.4 + rand() * 0.5), S * 0.04, Math.sin(a) * S * (0.4 + rand() * 0.5)], rot: [0, rand() * T, 0],
      }));
    }
  }
  // Ejecta: bombs and lapilli thrown clear.
  if (A.ejecta > 0) {
    for (let i = 0; i < A.ejecta * 4; i++) {
      const a = rand() * T, rad = S * (0.9 + rand() * 1.2);
      const r = S * (0.04 + rand() * 0.1);
      g.add(part(boulder(r, 0, rand, 0.8), rock, 'bomb-' + i, { pos: [Math.cos(a) * rad, r * 0.7, Math.sin(a) * rad], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- LAVA FLOW */
export const LAVA_AXES = { form: 4, length: 4, width: 3, crust: 4, glow: 3, debris: 3 };
export function lavaFlow(variant = 0) {
  const A = axesOf(variant, LAVA_AXES);
  const rand = rnd(0x1a7a + variant * 2711);
  const g = new THREE.Group();
  const forms = ['pahoehoe', 'aa-rubble', 'channel', 'pool'];
  const form = forms[A.form];
  g.name = 'lava-' + form;
  const L = [3, 6, 10, 16][A.length];
  const W = [1.2, 2.4, 4][A.width];
  const crust = [GEO.basalt, GEO.scoria, GEO.obsidian, GEO.ashPale][A.crust];
  const hot = A.glow === 0 ? GEO.basalt : A.glow === 1 ? GEO.lavaCooling : GEO.lavaHot;

  if (form === 'pool') {
    g.add(thin(part(new THREE.CircleGeometry(W, 20), hot, 'pool-surface', { pos: [0, 0.06, 0], rot: [-Math.PI / 2, 0, 0] })));
    // Crustal plates floating on the pool — the read that says "moving".
    for (let i = 0; i < 9; i++) {
      const a = rand() * T, rad = rand() * W * 0.85;
      const p = boulder(W * (0.1 + rand() * 0.14), 0, rand, 0.14);
      g.add(part(p, crust, 'plate-' + i, { pos: [Math.cos(a) * rad, 0.08, Math.sin(a) * rad], rot: [0, rand() * T, 0] }));
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * T;
      g.add(part(boulder(W * 0.12, 0, rand, 0.7), crust, 'levee-' + i, { pos: [Math.cos(a) * W * 1.05, W * 0.05, Math.sin(a) * W * 1.05], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  } else if (form === 'aa-rubble') {
    // Aa lava is a field of clinker. Nothing smooth about it.
    const n = Math.round(L * W * 2.2);
    for (let i = 0; i < n; i++) {
      const t = rand();
      const r = W * (0.05 + rand() * 0.09);
      g.add(part(boulder(r, 0, rand, 0.75), crust, 'clinker-' + i, {
        pos: [-L / 2 + t * L, r * 0.6, (rand() - 0.5) * W * 1.6], rot: [rand() * T, rand() * T, rand() * T],
      }));
    }
    if (A.glow > 0) for (let i = 0; i < 7; i++) {
      const t = rand();
      g.add(part(box(W * 0.12, 0.02, W * 0.3), hot, 'crack-' + i, { pos: [-L / 2 + t * L, 0.02, (rand() - 0.5) * W], rot: [0, rand() * T, 0] }));
    }
  } else {
    // Pahoehoe ropes and channel levees both read as lobes along a path.
    const lobes = Math.round(L * 1.6);
    for (let i = 0; i < lobes; i++) {
      const t = i / lobes;
      const drift = Math.sin(t * 4) * W * 0.5;
      const lb = boulder(W * (0.4 + rand() * 0.2), 1, rand, 0.2);
      g.add(part(lb, form === 'channel' ? crust : (A.glow > 1 && i % 3 === 0 ? hot : crust), 'lobe-' + i, {
        pos: [-L / 2 + t * L, W * 0.06, drift], rot: [0, rand() * T, 0],
      }));
    }
    if (form === 'channel') {
      // Molten centre between raised levees.
      for (let i = 0; i < lobes; i++) {
        const t = i / lobes;
        const drift = Math.sin(t * 4) * W * 0.5;
        g.add(thin(part(new THREE.PlaneGeometry(L / lobes * 1.2, W * 0.5), hot, 'channel-flow-' + i, { pos: [-L / 2 + t * L, W * 0.1, drift], rot: [-Math.PI / 2, 0, 0] })));
        [-1, 1].forEach((s, j) => g.add(part(boulder(W * 0.2, 0, rand, 0.6), crust, 'levee-' + i + '-' + j, { pos: [-L / 2 + t * L, W * 0.12, drift + s * W * 0.48], rot: [rand() * T, rand() * T, rand() * T] })));
      }
    }
  }
  if (A.debris > 0) {
    for (let i = 0; i < A.debris * 5; i++) {
      g.add(part(boulder(W * 0.06, 0, rand, 0.8), GEO.ashPale, 'ash-clot-' + i, { pos: [(rand() - 0.5) * L, 0.04, (rand() - 0.5) * W * 2.4], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------------- WATER BODY
 * The placeable part of a lake, river reach, or coast: basin lip, shore,
 * surface patch and edge dressing. Terrain topology is not this file's job. */
export const WATER_AXES = { form: 5, size: 4, edge: 4, clarity: 3, feature: 3, dressing: 3 };
export function waterBody(variant = 0) {
  const A = axesOf(variant, WATER_AXES);
  const rand = rnd(0x0a7e + variant * 1871);
  const g = new THREE.Group();
  const forms = ['pool', 'river-reach', 'lake-shore', 'ocean-shore', 'flooded-hollow'];
  const form = forms[A.form];
  g.name = 'water-' + form;
  const S = [2, 4.5, 9, 18][A.size];
  const water = [GEO.waterDark, GEO.waterClear, GEO.waterMurk][A.clarity];
  const edgeStone = [GEO.graniteGrey, GEO.limestone, GEO.shale, GEO.basalt][A.edge];

  // Surface. A river reach is long; a shore is a strip; a pool is a disc.
  if (form === 'river-reach') {
    g.add(thin(part(new THREE.PlaneGeometry(S * 0.55, S * 2.4, 6, 12), water, 'surface', { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] })));
  } else if (form === 'pool' || form === 'flooded-hollow') {
    g.add(thin(part(new THREE.CircleGeometry(S * 0.5, 22), water, 'surface', { pos: [0, 0, 0], rot: [-Math.PI / 2, 0, 0] })));
  } else {
    g.add(thin(part(new THREE.PlaneGeometry(S * 2, S, 12, 6), water, 'surface', { pos: [0, 0, -S * 0.3], rot: [-Math.PI / 2, 0, 0] })));
  }

  // Edge: the single most important part. Water without a defined bank reads
  // as a decal lying on the ground.
  const edgeN = form === 'river-reach' ? 22 : 26;
  for (let i = 0; i < edgeN; i++) {
    const t = i / edgeN;
    let x, z;
    if (form === 'river-reach') { const s = i % 2 ? 1 : -1; x = s * S * 0.3; z = -S * 1.2 + t * S * 2.4; }
    else if (form === 'pool' || form === 'flooded-hollow') { const a = t * T; x = Math.cos(a) * S * 0.54; z = Math.sin(a) * S * 0.54; }
    else { x = -S + t * S * 2; z = S * 0.2 + Math.sin(t * 5) * S * 0.08; }
    const r = S * (0.04 + rand() * 0.05);
    g.add(part(boulder(r, 0, rand, 0.6), edgeStone, 'bank-stone-' + i, { pos: [x, r * 0.4, z], rot: [rand() * T, rand() * T, rand() * T] }));
  }
  // Waterline: foam or scum where water meets stone.
  if (A.edge >= 2) {
    const fm = A.clarity === 2 ? GEO.moss : GEO.foam;
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      let x, z;
      if (form === 'river-reach') { const s = i % 2 ? 1 : -1; x = s * S * 0.26; z = -S * 1.1 + t * S * 2.2; }
      else if (form === 'pool' || form === 'flooded-hollow') { const a = t * T; x = Math.cos(a) * S * 0.47; z = Math.sin(a) * S * 0.47; }
      else { x = -S * 0.9 + t * S * 1.8; z = S * 0.14; }
      g.add(part(boulder(S * 0.05, 0, rand, 0.14), fm, 'waterline-' + i, { pos: [x, 0.02, z], rot: [0, rand() * T, 0] }));
    }
  }
  // Feature: a submerged thing, a sandbar, or a fallen tree.
  if (A.feature === 1) {
    for (let i = 0; i < 5; i++) g.add(part(boulder(S * 0.09, 0, rand, 0.4), edgeStone, 'submerged-' + i, { pos: [(rand() - 0.5) * S * 0.6, -0.06, (rand() - 0.5) * S * 0.6], rot: [rand() * T, rand() * T, rand() * T] }));
  } else if (A.feature === 2) {
    g.add(part(limb(S * 0.035, S * 0.055, S * 0.9, 10, 3), MAT.barkDead || GEO.shale, 'fallen-trunk', { pos: [0, 0.03, S * 0.1], rot: [0, rand() * T, Math.PI / 2] }));
  }
  // Dressing: reeds, ice fringe, or salt.
  if (A.dressing > 0) {
    const dm = A.dressing === 1 ? MAT.reedPale : A.dressing === 2 ? GEO.ice : GEO.mineralWhite;
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const a = t * T;
      const x = form === 'river-reach' ? (i % 2 ? 1 : -1) * S * 0.33 : Math.cos(a) * S * 0.5;
      const z = form === 'river-reach' ? -S * 1.1 + t * S * 2.2 : Math.sin(a) * S * 0.5;
      if (A.dressing === 1) {
        for (let b = 0; b < 4; b++) g.add(part(box(0.02, S * 0.14, 0.005), dm, 'reed-' + i + '-' + b, { pos: [x + (rand() - 0.5) * 0.2, S * 0.07, z + (rand() - 0.5) * 0.2], rot: [0, rand() * T, (rand() - 0.5) * 0.2] }));
      } else {
        g.add(part(boulder(S * 0.06, 0, rand, 0.16), dm, 'fringe-' + i, { pos: [x, 0.02, z], rot: [0, rand() * T, 0] }));
      }
    }
  }
  return seat(g);
}

/* --------------------------------------------------------------- WATERFALL */
export const FALL_AXES = { form: 4, height: 4, width: 3, basin: 3, spray: 2, stone: 3 };
export function waterfall(variant = 0) {
  const A = axesOf(variant, FALL_AXES);
  const rand = rnd(0xfa11 + variant * 1439);
  const g = new THREE.Group();
  const forms = ['plunge', 'cascade', 'fan', 'chute'];
  const form = forms[A.form];
  g.name = 'waterfall-' + form;
  const H = [2, 4, 7, 12][A.height];
  const W = [0.6, 1.4, 2.6][A.width];
  const stone = [GEO.graniteDark, GEO.limestone, GEO.basalt][A.stone];

  // Headwall.
  for (let i = 0; i < 9; i++) {
    const r = W * (0.16 + rand() * 0.14);
    g.add(part(boulder(r, 0, rand, 0.7), stone, 'lip-stone-' + i, { pos: [-W * 0.7 + (i / 8) * W * 1.4, H, -W * 0.2 + (rand() - 0.5) * W * 0.2], rot: [rand() * T, rand() * T, rand() * T] }));
  }
  if (form === 'cascade') {
    // A stepped run: several short falls with their own plunge pools.
    const steps = 3 + A.height;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const y = H * (1 - t);
      const sw = W * (0.7 + t * 0.5);
      g.add(thin(part(new THREE.PlaneGeometry(sw, H / steps * 0.9), GEO.waterClear, 'sheet-' + i, { pos: [0, y - H / steps / 2, t * W * 0.5], rot: [0.2, 0, 0] })));
      for (let k = 0; k < 5; k++) g.add(part(boulder(W * 0.13, 0, rand, 0.6), stone, 'step-stone-' + i + '-' + k, { pos: [(rand() - 0.5) * sw, y, t * W * 0.5 + W * 0.2], rot: [rand() * T, rand() * T, rand() * T] }));
      g.add(thin(part(new THREE.CircleGeometry(sw * 0.5, 14), GEO.waterClear, 'pool-' + i, { pos: [0, y - H / steps, t * W * 0.5 + W * 0.35], rot: [-Math.PI / 2, 0, 0] })));
    }
  } else {
    const taper = form === 'fan' ? 2.2 : form === 'chute' ? 0.6 : 1;
    const seg = 8;
    for (let i = 0; i < seg; i++) {
      const t = i / seg;
      const w = W * (1 + t * (taper - 1));
      g.add(thin(part(new THREE.PlaneGeometry(w, (H / seg) * 1.06), GEO.waterClear, 'sheet-' + i, {
        pos: [0, H - (H / seg) * (i + 0.5), t * W * 0.22], rot: [0.1, 0, 0],
      })));
    }
    // Basin.
    if (A.basin > 0) {
      const br = W * (0.9 + A.basin * 0.4);
      g.add(thin(part(new THREE.CircleGeometry(br, 20), GEO.waterClear, 'plunge-pool', { pos: [0, 0.04, W * 0.3], rot: [-Math.PI / 2, 0, 0] })));
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * T;
        g.add(part(boulder(W * 0.16, 0, rand, 0.6), stone, 'basin-stone-' + i, { pos: [Math.cos(a) * br * 1.05, W * 0.08, W * 0.3 + Math.sin(a) * br * 1.05], rot: [rand() * T, rand() * T, rand() * T] }));
      }
    }
  }
  // Spray: foam clots at the impact, not a particle system.
  if (A.spray) {
    for (let i = 0; i < 12; i++) {
      g.add(part(boulder(W * (0.08 + rand() * 0.1), 0, rand, 0.5), GEO.foam, 'spray-' + i, {
        pos: [(rand() - 0.5) * W * 1.6, rand() * H * 0.22, W * 0.3 + (rand() - 0.5) * W * 1.2],
      }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- ICE FEATURE */
export const ICE_AXES = { form: 5, size: 3, clarity: 3, crack: 3, snow: 2, debris: 3 };
export function iceFeature(variant = 0) {
  const A = axesOf(variant, ICE_AXES);
  const rand = rnd(0x1ce + variant * 1181);
  const g = new THREE.Group();
  const forms = ['frozen-pool', 'ice-shelf', 'icicle-curtain', 'pressure-ridge', 'hoar-boulder'];
  const form = forms[A.form];
  g.name = 'ice-' + form;
  const S = [1.2, 2.8, 5.5][A.size];
  const ice = A.clarity === 0 ? GEO.ice
    : A.clarity === 1 ? M('ice-milky', '#9aadb2', 0.3, 0.02, { transparent: true, opacity: 0.82 })
    : M('ice-black', '#3e5257', 0.12, 0.06, { transparent: true, opacity: 0.9 });

  if (form === 'frozen-pool') {
    g.add(thin(part(new THREE.CircleGeometry(S * 0.5, 22), ice, 'ice-sheet', { pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0] })));
    for (let i = 0; i < A.crack * 4; i++) {
      const a = rand() * T;
      g.add(part(box(S * (0.2 + rand() * 0.4), 0.02, 0.02), GEO.snow, 'crack-' + i, { pos: [Math.cos(a) * S * 0.2, 0.06, Math.sin(a) * S * 0.2], rot: [0, rand() * T, 0] }));
    }
  } else if (form === 'ice-shelf') {
    const sh = box(S, S * 0.18, S * 0.7, 4, 1, 3);
    jitter(sh, S * 0.04, rand);
    g.add(part(sh, ice, 'shelf', { pos: [0, S * 0.1, 0] }));
    for (let i = 0; i < 10; i++) g.add(part(cone(S * 0.03, S * (0.1 + rand() * 0.2), 5, 1), ice, 'icicle-' + i, { pos: [-S * 0.45 + rand() * S * 0.9, 0, S * 0.34], rot: [Math.PI, 0, (rand() - 0.5) * 0.2] }));
  } else if (form === 'icicle-curtain') {
    for (let i = 0; i < 18; i++) {
      const t = i / 18;
      g.add(part(cone(S * (0.02 + rand() * 0.02), S * (0.2 + rand() * 0.7), 5, 1), ice, 'icicle-' + i, {
        pos: [-S * 0.5 + t * S, S, (rand() - 0.5) * S * 0.1], rot: [Math.PI, 0, (rand() - 0.5) * 0.14],
      }));
    }
    g.add(part(jitter(box(S * 1.1, S * 0.14, S * 0.2, 4, 1, 1), S * 0.03, rand), GEO.graniteDark, 'ledge', { pos: [0, S * 1.05, 0] }));
  } else if (form === 'pressure-ridge') {
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const h = S * (0.2 + Math.sin(t * Math.PI) * 0.4);
      const sl = box(S * 0.18, h, S * 0.3, 1, 2, 1);
      jitter(sl, S * 0.03, rand);
      g.add(part(sl, ice, 'slab-' + i, { pos: [-S * 0.6 + t * S * 1.2, h * 0.5, (rand() - 0.5) * S * 0.2], rot: [(rand() - 0.5) * 0.5, rand() * 0.4, (rand() - 0.5) * 0.6] }));
    }
  } else {
    g.add(part(boulder(S * 0.45, 1, rand, 0.7), GEO.graniteGrey, 'boulder', { pos: [0, S * 0.3, 0] }));
    for (let i = 0; i < 16; i++) {
      const a = rand() * T;
      g.add(part(cone(S * 0.02, S * 0.09, 4, 1), ice, 'hoar-spike-' + i, {
        pos: [Math.cos(a) * S * 0.4, S * (0.2 + rand() * 0.4), Math.sin(a) * S * 0.4],
        rot: [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2],
      }));
    }
  }
  if (A.snow) {
    for (let i = 0; i < 8; i++) {
      g.add(part(boulder(S * (0.08 + rand() * 0.1), 0, rand, 0.2), GEO.snow, 'snow-drift-' + i, { pos: [(rand() - 0.5) * S, S * 0.04, (rand() - 0.5) * S * 0.8], rot: [0, rand() * T, 0] }));
    }
  }
  if (A.debris > 0) {
    for (let i = 0; i < A.debris * 3; i++) {
      g.add(part(boulder(S * 0.05, 0, rand, 0.7), GEO.shale, 'entrained-' + i, { pos: [(rand() - 0.5) * S * 0.8, S * 0.06, (rand() - 0.5) * S * 0.6], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  return seat(g);
}

export const GEO_GENERATORS = [
  { id: 'geo.rock-formation', name: 'Rock formation', axes: ROCK_AXES, build: rockFormation, domain: 'world', budgetClass: 'standard' },
  { id: 'geo.cliff-face', name: 'Cliff face', axes: CLIFF_AXES, build: cliffFace, domain: 'world', budgetClass: 'hero' },
  { id: 'geo.cave-feature', name: 'Cave feature', axes: CAVE_AXES, build: caveFeature, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'geo.volcanic-vent', name: 'Volcanic vent', axes: VENT_AXES, build: volcanicVent, domain: 'world', budgetClass: 'hero' },
  { id: 'geo.lava-flow', name: 'Lava flow', axes: LAVA_AXES, build: lavaFlow, domain: 'world', budgetClass: 'hero' },
  { id: 'geo.water-body', name: 'Water body', axes: WATER_AXES, build: waterBody, domain: 'world', budgetClass: 'hero' },
  { id: 'geo.waterfall', name: 'Waterfall', axes: FALL_AXES, build: waterfall, domain: 'world', budgetClass: 'hero' },
  { id: 'geo.ice-feature', name: 'Ice feature', axes: ICE_AXES, build: iceFeature, domain: 'world', budgetClass: 'standard' },
];
