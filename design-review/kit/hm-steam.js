/* Cinderward industrial set — the steampunk layer.
 *
 * This is an EXTENSION of vocabulary the repo already has, not a genre swap.
 * src/data/worldAssets.js → REGION_ASSET_KITS.cinderward already declares
 * chain_lift_tower, gantry_grate, ore_crusher_manual, vent_wheel_seized,
 * chain_counterweight, furnace_breath_cycle and cooling_cistern_broken. The
 * royal foundry made bell-metal by alloying iron with relic ash, and its last
 * workers sealed the furnace from the outside. That is an industrial
 * revolution with a body count, and it is where brass, pressure and pipework
 * legitimately enter the Reach.
 *
 * Every colour traces to the cinderward kit palette
 *   { shadow #080a0d, iron #20262a, brick #4a3028, slag #1c1615,
 *     accent #df6e32, cool #344d62 }
 * or to a canonical token in tokens/colors.css. Nothing is invented, and
 * nothing is brighter than --bone.
 *
 * PARAMETRIC BY DESIGN. Each generator resolves a flat variant index against
 * declared axes, so one generator is a family of hundreds of visually
 * distinct assets addressable as (generatorId, variant). An axis only counts
 * if it changes silhouette or material — seed jitter gives infinite
 * micro-variation but is never counted, because counting it would make the
 * catalogue total a lie.
 */
import { THREE, MAT, rnd, jitter, part, lathe, limb, torus, cone, cyl, ico, seat, thin } from './hm-core.js';
import { surfaceMaps } from './hm-textures.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const M = (name, color, rough, metal, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal, ...extra });
  m.name = name;
  return m;
};

/* Metalness is capped LOW on purpose. The stage carries no environment map,
 * and a metalness of 0.4 with nothing to reflect does not read as metal — it
 * reads as wet plastic, and applied across a whole industrial set it makes
 * everything uniformly shiny and uncanny. Real metal in a dark, sooty foundry
 * is mostly ROUGH. The metal read is carried by base colour plus a roughness
 * map that varies gloss across the surface, never by a high metalness value.
 *
 * Bind the maps with bindSteamTextures() — without them these are flat
 * colours, which is the other half of the same problem. */
export const STEAM = {
  sootIron: M('soot-iron', '#20262a', 0.82, 0.14),           // kit.iron
  firebrick: M('firebrick-cracked', '#4a3028', 0.94, 0.01),  // kit.brick
  slagGlass: M('slag-glass-cooled', '#1c1615', 0.52, 0.08),  // kit.slag
  brass: M('foundry-brass', '#b3873f', 0.56, 0.2),
  copper: M('copper-pipe', '#8c5a3c', 0.6, 0.18),
  verdigris: M('verdigris', '#4a6b60', 0.9, 0.04),           // ~ --moss
  pressureGlass: M('pressure-glass', '#6f8f9b', 0.3, 0.02, { transparent: true, opacity: 0.44 }), // ~ --focus
  aetherGlow: M('aether-glow', '#2a4a52', 0.62, 0.0, { emissive: new THREE.Color('#658e9e'), emissiveIntensity: 1.5 }),
  hotSlag: M('hot-slag', '#3a1a0e', 0.78, 0.0, { emissive: new THREE.Color('#df6e32'), emissiveIntensity: 1.9 }),
  leather: M('boiled-leather', '#3d2f26', 0.93, 0.01),
  coolIron: M('cooled-iron', '#344d62', 0.84, 0.12),         // kit.cool
};

/* Which existing surface generator each industrial material borrows its
   roughness variation from. Only the roughnessMap is taken, never the colour
   map — a brass-toned albedo over a brass material double-tints. */
const ROUGH_SOURCE = {
  sootIron: 'pittedIron', coolIron: 'blackIron', slagGlass: 'pittedIron',
  brass: 'bellBronze', copper: 'pittedIron', verdigris: 'blackIron',
  firebrick: 'firedClay', leather: 'weatheredTimber',
};

let steamBound = false;
/** Give every industrial material a roughness map so gloss varies across a
 *  surface instead of being one flat number. This is what stops the set
 *  reading as uniformly shiny. */
export function bindSteamTextures(on = true) {
  if (steamBound === on) return;
  steamBound = on;
  for (const key of Object.keys(ROUGH_SOURCE)) {
    const m = STEAM[key];
    if (!m) continue;
    const maps = on ? surfaceMaps(ROUGH_SOURCE[key]) : null;
    m.roughnessMap = maps ? maps.roughnessMap : null;
    m.needsUpdate = true;
  }
}

/** Resolve a flat variant index against declared axis sizes. Deterministic:
 *  index N always yields the same combination, which is what lets a catalogue
 *  address an asset by (generatorId, variant) instead of storing a mesh. */
export function axesOf(index, axes) {
  const out = {};
  let n = index;
  for (const k of Object.keys(axes)) {
    out[k] = n % axes[k];
    n = Math.floor(n / axes[k]);
  }
  return out;
}
export const spaceOf = (axes) => Object.values(axes).reduce((a, b) => a * b, 1);

/* ---------------------------------------------------------- aether lamp */
export const AETHER_LAMP_AXES = { mount: 4, vessel: 4, cage: 4, bracket: 3, lit: 2, wear: 3 };
export function aetherLamp(variant = 0) {
  const A = axesOf(variant, AETHER_LAMP_AXES);
  const rand = rnd(0xae7 + variant * 7919);
  const g = new THREE.Group();
  g.name = 'aether-lamp';
  const metal = [STEAM.brass, STEAM.copper, STEAM.sootIron, STEAM.verdigris][A.mount];

  if (A.mount === 0) {
    g.add(part(jitter(box(0.26, 0.34, 0.05, 1, 2, 1), 0.006, rand), metal, 'wall-plate', { pos: [0, 0.5, -0.16] }));
    for (let i = 0; i < 4; i++) g.add(part(ico(0.016, 0), metal, 'plate-bolt-' + i, { pos: [(i % 2 ? 1 : -1) * 0.09, 0.5 + (i < 2 ? 0.12 : -0.12), -0.13] }));
  } else if (A.mount === 1) {
    g.add(part(limb(0.022, 0.026, 0.6, 8, 1), metal, 'ceiling-stem', { pos: [0, 0.92, 0] }));
  } else if (A.mount === 2) {
    g.add(part(lathe([[0.16, 0], [0.17, 0.03], [0.06, 0.08], [0.05, 0.5], [0.07, 0.55]], 14), metal, 'floor-stand'));
  } else {
    g.add(part(box(0.1, 0.14, 0.14), metal, 'gantry-clamp', { pos: [0, 0.62, -0.1] }));
    g.add(part(torus(0.07, 0.014, 5, 12), metal, 'clamp-ring', { pos: [0, 0.62, -0.02], rot: [0, Math.PI / 2, 0] }));
  }

  const armLen = [0.22, 0.3, 0.16][A.bracket];
  g.add(part(limb(0.014, 0.02, armLen, 7, 1), metal, 'bracket-arm', { pos: [0, 0.52, -0.08 + armLen / 2], rot: [Math.PI / 2, 0, 0] }));
  if (A.bracket === 1) g.add(part(box(0.03, 0.16, 0.02), metal, 'bracket-stay', { pos: [0, 0.44, 0.02], rot: [0.7, 0, 0] }));

  // Vessel — the axis that changes silhouette most.
  const y = 0.42;
  const profiles = [
    [[0.06, 0], [0.1, 0.05], [0.11, 0.14], [0.08, 0.2], [0.05, 0.23]],
    [[0.04, 0], [0.09, 0.03], [0.09, 0.18], [0.04, 0.21]],
    [[0.05, 0], [0.12, 0.08], [0.05, 0.16]],
    [[0.03, 0], [0.07, 0.04], [0.1, 0.1], [0.07, 0.16], [0.09, 0.2], [0.04, 0.24]],
  ];
  g.add(thin(part(lathe(profiles[A.vessel], 16), STEAM.pressureGlass, 'aether-vessel', { pos: [0, y, 0.06] })));
  if (A.lit) g.add(part(ico(0.055, 1), STEAM.aetherGlow, 'aether-core', { pos: [0, y + 0.1, 0.06] }));
  g.add(part(lathe([[0.055, 0], [0.075, 0.012], [0.07, 0.038], [0.05, 0.044]], 14), metal, 'collar-lower', { pos: [0, y - 0.02, 0.06] }));
  g.add(part(lathe([[0.045, 0], [0.06, 0.014], [0.05, 0.034]], 14), metal, 'collar-upper', { pos: [0, y + 0.23, 0.06] }));

  if (A.cage === 1) {
    for (let i = 0; i < 3; i++) g.add(part(torus(0.115, 0.007, 4, 14), metal, 'cage-hoop-' + i, { pos: [0, y + 0.05 + i * 0.07, 0.06], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.cage === 2) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(box(0.012, 0.26, 0.012), metal, 'cage-rib-' + i, { pos: [Math.cos(a) * 0.115, y + 0.12, 0.06 + Math.sin(a) * 0.115] }));
    }
  } else if (A.cage === 3) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.add(part(box(0.01, 0.28, 0.01), metal, 'cage-rib-' + i, { pos: [Math.cos(a) * 0.12, y + 0.12, 0.06 + Math.sin(a) * 0.12] }));
    }
    for (let i = 0; i < 2; i++) g.add(part(torus(0.12, 0.008, 4, 16), metal, 'cage-hoop-' + i, { pos: [0, y + 0.02 + i * 0.22, 0.06], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.wear > 0) {
    const w = A.wear === 1 ? STEAM.sootIron : STEAM.verdigris;
    for (let i = 0; i < 3; i++) {
      const s = ico(0.022 + rand() * 0.016, 0);
      s.scale(1.4, 0.5, 1.2);
      g.add(part(s, w, 'wear-' + i, { pos: [(rand() - 0.5) * 0.16, y + rand() * 0.22, 0.06 + (rand() - 0.5) * 0.16] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------- pressure gauge */
export const GAUGE_AXES = { count: 4, face: 3, body: 3, plumbing: 4, state: 3 };
export function pressureGauge(variant = 0) {
  const A = axesOf(variant, GAUGE_AXES);
  const rand = rnd(0x9a5 + variant * 6151);
  const g = new THREE.Group();
  g.name = 'pressure-gauge';
  const body = [STEAM.brass, STEAM.copper, STEAM.sootIron][A.body];
  const n = A.count + 1;

  g.add(part(jitter(box(0.16 + n * 0.13, 0.24, 0.035, 3, 1, 1), 0.005, rand), STEAM.sootIron, 'backplate', { pos: [0, 0.3, 0] }));
  for (let i = 0; i < n; i++) {
    const x = -((n - 1) * 0.13) / 2 + i * 0.13;
    const r = [0.052, 0.062, 0.044][A.face];
    g.add(part(lathe([[0, 0], [r, 0.004], [r, 0.03], [r * 0.86, 0.036], [0, 0.038]], 18), body, 'bezel-' + i, { pos: [x, 0.3, 0.02], rot: [Math.PI / 2, 0, 0] }));
    g.add(thin(part(new THREE.CircleGeometry(r * 0.82, 18), STEAM.pressureGlass, 'glass-' + i, { pos: [x, 0.3, 0.06] })));
    const ang = [-0.9, 0.2, 1.4][A.state] + (rand() - 0.5) * 0.5;
    g.add(part(box(r * 0.72, 0.006, 0.005), i % 2 ? STEAM.brass : STEAM.copper, 'needle-' + i, { pos: [x + Math.cos(ang) * r * 0.3, 0.3 + Math.sin(ang) * r * 0.3, 0.062], rot: [0, 0, ang] }));
    g.add(part(ico(0.008, 0), body, 'needle-hub-' + i, { pos: [x, 0.3, 0.063] }));
    if (A.state === 2 && i === n - 1) g.add(part(ico(0.016, 0), STEAM.hotSlag, 'alarm-lamp', { pos: [x, 0.3 + r + 0.03, 0.05] }));
  }
  if (A.plumbing > 0) {
    const pipeMat = A.plumbing === 3 ? STEAM.verdigris : STEAM.copper;
    g.add(part(limb(0.022, 0.026, 0.3, 8, 1), pipeMat, 'feed-pipe', { pos: [0, 0.06, 0] }));
    g.add(part(lathe([[0.03, 0], [0.042, 0.012], [0.03, 0.026]], 12), pipeMat, 'feed-union', { pos: [0, 0.18, 0] }));
    if (A.plumbing >= 2) {
      g.add(part(limb(0.016, 0.018, 0.24, 7, 1), pipeMat, 'bleed-line', { pos: [0.12, 0.12, 0], rot: [0, 0, 0.5] }));
      g.add(part(torus(0.032, 0.008, 4, 12), STEAM.brass, 'bleed-valve', { pos: [0.2, 0.2, 0], rot: [0, Math.PI / 2, 0] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- pipe run */
export const PIPE_RUN_AXES = { length: 4, bore: 3, material: 4, fittings: 4, lag: 3, leak: 2 };
export function pipeRun(variant = 0) {
  const A = axesOf(variant, PIPE_RUN_AXES);
  const rand = rnd(0x91b + variant * 4409);
  const g = new THREE.Group();
  g.name = 'pipe-run';
  const L = [1.4, 2.2, 3.0, 4.2][A.length];
  const r = [0.05, 0.08, 0.12][A.bore];
  const mat = [STEAM.copper, STEAM.sootIron, STEAM.brass, STEAM.verdigris][A.material];

  g.add(part(limb(r, r, L, 12, 1), mat, 'barrel', { pos: [0, 0.9, 0], rot: [0, 0, Math.PI / 2] }));
  const joints = A.fittings + 2;
  for (let i = 0; i < joints; i++) {
    const x = -L / 2 + (L / (joints - 1)) * i;
    g.add(part(lathe([[r, 0], [r * 1.5, 0.012], [r * 1.5, 0.04], [r, 0.052]], 14), mat, 'flange-' + i, { pos: [x, 0.9, 0], rot: [0, 0, Math.PI / 2] }));
    for (let b = 0; b < 6; b++) {
      const a = (b / 6) * Math.PI * 2;
      g.add(part(ico(0.011, 0), STEAM.sootIron, 'bolt-' + i + '-' + b, { pos: [x + 0.026, 0.9 + Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25] }));
    }
  }
  for (let i = 0; i < Math.max(2, A.fittings + 1); i++) {
    const x = -L / 2 + 0.3 + i * ((L - 0.6) / Math.max(1, A.fittings));
    g.add(part(box(0.02, 0.42, 0.02), STEAM.sootIron, 'hanger-rod-' + i, { pos: [x, 1.16, 0] }));
    g.add(part(torus(r + 0.02, 0.012, 4, 12), STEAM.sootIron, 'hanger-strap-' + i, { pos: [x, 0.9, 0], rot: [0, Math.PI / 2, 0] }));
  }
  if (A.lag > 0) {
    const lagLen = L * (A.lag === 1 ? 0.35 : 0.62);
    g.add(part(limb(r * 1.34, r * 1.34, lagLen, 12, 1), MAT.canvasBone, 'lagging', { pos: [-L * 0.1, 0.9, 0], rot: [0, 0, Math.PI / 2] }));
    for (let i = 0; i < 5; i++) g.add(part(torus(r * 1.38, 0.006, 4, 12), STEAM.sootIron, 'lag-wire-' + i, { pos: [-L * 0.1 - lagLen / 2 + (lagLen / 4) * i, 0.9, 0], rot: [0, Math.PI / 2, 0] }));
  }
  if (A.leak) {
    const x = L * 0.22;
    g.add(part(torus(r * 1.2, 0.016, 5, 14), STEAM.verdigris, 'leak-scale', { pos: [x, 0.9, 0], rot: [0, Math.PI / 2, 0] }));
    for (let i = 0; i < 4; i++) {
      const s = ico(0.02 + rand() * 0.02, 0);
      s.scale(1.3, 0.4, 1.2);
      g.add(part(s, STEAM.verdigris, 'leak-deposit-' + i, { pos: [x + (rand() - 0.5) * 0.2, 0.9 - r - 0.02 - i * 0.02, (rand() - 0.5) * 0.1] }));
    }
  }
  return seat(g);
}

/* -------------------------------------------------------- chain lift block */
export const LIFT_AXES = { sheaves: 3, frame: 3, hook: 4, chain: 4, load: 3 };
export function chainLiftBlock(variant = 0) {
  const A = axesOf(variant, LIFT_AXES);
  const rand = rnd(0xc11 + variant * 3313);
  const g = new THREE.Group();
  g.name = 'chain-lift-block';
  const n = A.sheaves + 1;
  const frameMat = [STEAM.sootIron, STEAM.brass, STEAM.coolIron][A.frame];

  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(0.03, 0.34, 0.26, 1, 2, 2), 0.005, rand), frameMat, 'shell-' + i, { pos: [s * (n * 0.045 + 0.02), 0.72, 0] }));
  });
  for (let i = 0; i < n; i++) {
    const x = -((n - 1) * 0.045) / 2 + i * 0.09;
    g.add(part(lathe([[0.02, 0], [0.09, 0.006], [0.095, 0.016], [0.072, 0.022], [0.095, 0.028], [0.09, 0.038], [0.02, 0.044]], 16), STEAM.brass, 'sheave-' + i, { pos: [x, 0.72, 0], rot: [0, 0, Math.PI / 2] }));
  }
  g.add(part(limb(0.014, 0.014, n * 0.1 + 0.1, 10, 1), STEAM.sootIron, 'axle', { pos: [0, 0.72, 0], rot: [0, 0, Math.PI / 2] }));
  g.add(part(torus(0.05, 0.014, 5, 14), frameMat, 'becket', { pos: [0, 0.94, 0], rot: [0, Math.PI / 2, 0] }));
  const hs = [0.9, 1.15, 1.4, 0.75][A.hook];
  g.add(part(torus(0.07 * hs, 0.017 * hs, 5, 12, Math.PI * 1.35), STEAM.sootIron, 'hook', { pos: [0, 0.44, 0], rot: [Math.PI / 2, 0, 0.4] }));
  g.add(part(lathe([[0.026, 0], [0.034, 0.02], [0.02, 0.06]], 12), STEAM.sootIron, 'hook-shank', { pos: [0, 0.5, 0] }));
  const links = [5, 9, 14, 20][A.chain];
  for (let i = 0; i < links; i++) {
    g.add(part(torus(0.024, 0.007, 5, 10), STEAM.sootIron, 'chain-link-' + i, { pos: [0.07, 0.94 + i * 0.037, 0], rot: [Math.PI / 2, (i % 2) * (Math.PI / 2), 0] }));
  }
  if (A.load === 1) {
    g.add(part(jitter(box(0.3, 0.22, 0.3, 2, 1, 2), 0.02, rand), STEAM.firebrick, 'crucible', { pos: [0, 0.2, 0] }));
    g.add(part(ico(0.1, 0), STEAM.hotSlag, 'melt', { pos: [0, 0.3, 0] }));
  } else if (A.load === 2) {
    g.add(part(lathe([[0.02, 0], [0.16, 0.04], [0.18, 0.2], [0.14, 0.26], [0.16, 0.3], [0.05, 0.32]], 16), STEAM.sootIron, 'ore-bucket', { pos: [0, 0.06, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------- governor flyball */
export const GOVERNOR_AXES = { arms: 3, ball: 3, column: 3, base: 3, speed: 3 };
export function governorFlyball(variant = 0) {
  const A = axesOf(variant, GOVERNOR_AXES);
  const g = new THREE.Group();
  g.name = 'governor-flyball';
  const arms = A.arms + 2;
  const ballR = [0.05, 0.07, 0.09][A.ball];
  const colH = [0.5, 0.7, 0.34][A.column];
  const lift = [0.35, 0.7, 1.05][A.speed]; // how far the balls have flown out

  const bases = [
    [[0.16, 0], [0.17, 0.03], [0.06, 0.07]],
    [[0.2, 0], [0.21, 0.025], [0.14, 0.05], [0.06, 0.09]],
    [[0.13, 0], [0.14, 0.05], [0.05, 0.06]],
  ];
  g.add(part(lathe(bases[A.base], 16), STEAM.sootIron, 'base'));
  g.add(part(limb(0.03, 0.038, colH, 12, 1), STEAM.brass, 'column', { pos: [0, 0.07 + colH / 2, 0] }));
  const topY = 0.07 + colH;
  g.add(part(lathe([[0.05, 0], [0.062, 0.012], [0.05, 0.03]], 14), STEAM.brass, 'crown', { pos: [0, topY, 0] }));

  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2;
    const tilt = 0.28 + lift * 0.62;
    const len = 0.3;
    const m = part(box(0.016, len, 0.016), STEAM.brass, 'arm-' + i, {
      pos: [Math.cos(a) * Math.sin(tilt) * len / 2, topY - Math.cos(tilt) * len / 2, Math.sin(a) * Math.sin(tilt) * len / 2],
    });
    m.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    g.add(m);
    g.add(part(ico(ballR, 1), STEAM.sootIron, 'flyball-' + i, {
      pos: [Math.cos(a) * Math.sin(tilt) * len, topY - Math.cos(tilt) * len, Math.sin(a) * Math.sin(tilt) * len],
    }));
    g.add(part(box(0.012, 0.18, 0.012), STEAM.copper, 'link-' + i, {
      pos: [Math.cos(a) * Math.sin(tilt) * len * 0.62, topY - 0.22, Math.sin(a) * Math.sin(tilt) * len * 0.62],
      rot: [Math.sin(a) * tilt * 1.6, 0, -Math.cos(a) * tilt * 1.6],
    }));
  }
  g.add(part(lathe([[0.038, 0], [0.06, 0.01], [0.06, 0.04], [0.038, 0.05]], 14), STEAM.copper, 'sliding-collar', { pos: [0, topY - 0.3 + lift * 0.1, 0] }));
  return seat(g);
}

/* --------------------------------------------------------------- bellows */
export const BELLOWS_AXES = { size: 3, drive: 3, nozzle: 3, state: 2, frame: 3 };
export function bellowsRig(variant = 0) {
  const A = axesOf(variant, BELLOWS_AXES);
  const rand = rnd(0xbe1 + variant * 1871);
  const g = new THREE.Group();
  g.name = 'bellows-rig';
  const w = [0.5, 0.72, 0.95][A.size];
  const open = A.state ? 1 : 0.42;
  const frameMat = [MAT.darkOak, MAT.weatheredTimber, STEAM.sootIron][A.frame];

  g.add(part(jitter(box(w, 0.05, w * 0.72, 3, 1, 2), 0.008, rand), frameMat, 'lower-board', { pos: [0, 0.4, 0] }));
  g.add(part(jitter(box(w, 0.05, w * 0.72, 3, 1, 2), 0.008, rand), frameMat, 'upper-board', { pos: [0, 0.4 + 0.1 + open * 0.3, 0] }));
  const pleats = 5;
  for (let i = 0; i < pleats; i++) {
    const t = (i + 0.5) / pleats;
    const y = 0.44 + t * (0.06 + open * 0.3);
    const bulge = Math.sin(t * Math.PI) * (1 - open * 0.5);
    g.add(part(limb(w * 0.5 * (0.86 + bulge * 0.2), w * 0.5 * (0.86 + bulge * 0.2), (0.06 + open * 0.3) / pleats, 12, 1), STEAM.leather, 'pleat-' + i, { pos: [0, y, 0], scale: [1, 1, 0.72] }));
  }
  const nz = [0.18, 0.3, 0.44][A.nozzle];
  g.add(part(limb(0.03, 0.055, nz, 10, 1), STEAM.sootIron, 'nozzle', { pos: [w * 0.5 + nz / 2, 0.46, 0], rot: [0, 0, Math.PI / 2] }));
  if (A.drive === 0) {
    g.add(part(limb(0.02, 0.026, 0.6, 8, 1), MAT.darkOak, 'handle', { pos: [-w * 0.5 - 0.24, 0.62 + open * 0.28, 0], rot: [0, 0, 1.2] }));
  } else if (A.drive === 1) {
    g.add(part(box(0.5, 0.05, 0.16), MAT.darkOak, 'treadle', { pos: [-w * 0.5 - 0.22, 0.14, 0], rot: [0, 0, -0.16] }));
    g.add(part(limb(0.012, 0.012, 0.44, 6, 1), STEAM.sootIron, 'treadle-rod', { pos: [-w * 0.5 - 0.06, 0.3, 0] }));
  } else {
    g.add(part(torus(0.14, 0.018, 5, 16), STEAM.brass, 'crank-wheel', { pos: [-w * 0.5 - 0.18, 0.68, 0], rot: [0, Math.PI / 2, 0] }));
    for (let i = 0; i < 4; i++) g.add(part(box(0.012, 0.26, 0.012), STEAM.brass, 'crank-spoke-' + i, { pos: [-w * 0.5 - 0.18, 0.68, 0], rot: [0, Math.PI / 2, (i / 4) * Math.PI] }));
    g.add(part(limb(0.012, 0.012, 0.3, 6, 1), STEAM.sootIron, 'crank-rod', { pos: [-w * 0.5 - 0.1, 0.56, 0], rot: [0, 0, 0.4] }));
  }
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    g.add(part(jitter(box(0.06, 0.4, 0.06, 1, 2, 1), 0.006, rand), frameMat, 'leg-' + i, { pos: [sx * (w * 0.4), 0.2, sz * (w * 0.28)] }));
  });
  return seat(g);
}

/* ------------------------------------------------------------ valve wheel */
export const VALVE_AXES = { spokes: 4, size: 3, material: 3, stem: 3, seized: 2 };
export function valveWheel(variant = 0) {
  const A = axesOf(variant, VALVE_AXES);
  const rand = rnd(0x7a1 + variant * 1439);
  const g = new THREE.Group();
  g.name = 'valve-wheel';
  const R = [0.18, 0.26, 0.36][A.size];
  const spokes = A.spokes + 3;
  const mat = [STEAM.sootIron, STEAM.brass, STEAM.verdigris][A.material];

  g.add(part(torus(R, R * 0.09, 6, 20), mat, 'rim', { pos: [0, 0.6, 0], rot: [Math.PI / 2, 0, 0] }));
  for (let i = 0; i < spokes; i++) {
    g.add(part(box(R * 1.9, 0.022, 0.022), mat, 'spoke-' + i, { pos: [0, 0.6, 0], rot: [0, 0, (i / spokes) * Math.PI] }));
  }
  g.add(part(lathe([[0.05, 0], [0.06, 0.02], [0.045, 0.05], [0.05, 0.06]], 14), mat, 'hub', { pos: [0, 0.6, 0] }));
  const stemH = [0.2, 0.34, 0.12][A.stem];
  g.add(part(limb(0.026, 0.03, stemH, 10, 1), STEAM.sootIron, 'stem', { pos: [0, 0.6 - stemH / 2, 0] }));
  g.add(part(lathe([[0.09, 0], [0.11, 0.03], [0.07, 0.08], [0.05, 0.1]], 14), STEAM.sootIron, 'bonnet', { pos: [0, 0.6 - stemH - 0.1, 0] }));
  g.add(part(lathe([[0.14, 0], [0.15, 0.05], [0.1, 0.09]], 14), STEAM.sootIron, 'body', { pos: [0, 0.6 - stemH - 0.19, 0] }));
  if (A.seized) {
    for (let i = 0; i < 6; i++) {
      const s = ico(0.02 + rand() * 0.022, 0);
      s.scale(1.3, 0.6, 1.2);
      g.add(part(s, STEAM.verdigris, 'rust-bloom-' + i, { pos: [(rand() - 0.5) * 0.14, 0.6 - stemH * rand(), (rand() - 0.5) * 0.14] }));
    }
    g.add(part(limb(0.018, 0.024, 0.8, 7, 1), STEAM.sootIron, 'cheater-bar', { pos: [R * 0.6, 0.72, 0], rot: [0, 0, 0.9] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------- vent stack */
export const VENT_AXES = { height: 4, cap: 4, girth: 3, bracing: 3, active: 2 };
export function ventStack(variant = 0) {
  const A = axesOf(variant, VENT_AXES);
  const g = new THREE.Group();
  g.name = 'vent-stack';
  const Hh = [1.2, 1.9, 2.7, 3.6][A.height];
  const r = [0.13, 0.19, 0.26][A.girth];

  g.add(part(lathe([[r * 1.5, 0], [r * 1.55, 0.06], [r * 1.1, 0.1], [r * 1.05, 0.14]], 16), STEAM.firebrick, 'stack-base'));
  const courses = Math.max(2, Math.round(Hh / 0.6));
  for (let i = 0; i < courses; i++) {
    const y = 0.14 + (Hh / courses) * (i + 0.5);
    g.add(part(limb(r * (1 - i * 0.02), r * (1 - i * 0.02), (Hh / courses) * 1.02, 14, 1), STEAM.sootIron, 'course-' + i, { pos: [0, y, 0] }));
    g.add(part(torus(r * (1 - i * 0.02) + 0.012, 0.014, 4, 16), STEAM.sootIron, 'band-' + i, { pos: [0, y - (Hh / courses) / 2, 0], rot: [Math.PI / 2, 0, 0] }));
    for (let b = 0; b < 8; b++) {
      const a = (b / 8) * Math.PI * 2;
      g.add(part(ico(0.011, 0), STEAM.sootIron, 'rivet-' + i + '-' + b, { pos: [Math.cos(a) * (r + 0.012), y - (Hh / courses) / 2, Math.sin(a) * (r + 0.012)] }));
    }
  }
  const top = 0.14 + Hh;
  if (A.cap === 1) {
    g.add(part(lathe([[r, 0], [r * 1.3, 0.06], [r * 1.25, 0.12], [r * 0.4, 0.2]], 16), STEAM.sootIron, 'cowl', { pos: [0, top, 0], rot: [0.3, 0, 0] }));
  } else if (A.cap === 2) {
    g.add(part(lathe([[0, 0], [r * 1.5, 0.04], [r * 1.5, 0.07], [r * 0.6, 0.11]], 16), STEAM.sootIron, 'mushroom-cap', { pos: [0, top + 0.1, 0] }));
    for (let i = 0; i < 3; i++) g.add(part(box(0.02, 0.14, 0.02), STEAM.sootIron, 'cap-stay-' + i, { pos: [Math.cos((i / 3) * 6.28) * r, top + 0.04, Math.sin((i / 3) * 6.28) * r] }));
  } else if (A.cap === 3) {
    for (let i = 0; i < 5; i++) g.add(part(torus(r * 1.12, 0.014, 4, 16), STEAM.sootIron, 'louvre-ring-' + i, { pos: [0, top + 0.03 + i * 0.05, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(lathe([[r * 1.2, 0], [r * 0.5, 0.1], [0, 0.13]], 14), STEAM.sootIron, 'louvre-crown', { pos: [0, top + 0.28, 0] }));
  }
  if (A.bracing > 0) {
    const n = A.bracing === 1 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      g.add(part(limb(0.012, 0.016, Hh * 0.7, 6, 1), STEAM.sootIron, 'stay-' + i, {
        pos: [Math.cos(a) * r * 2.2, 0.14 + Hh * 0.35, Math.sin(a) * r * 2.2],
        rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5],
      }));
    }
  }
  if (A.active) g.add(part(limb(r * 0.8, r * 0.8, 0.06, 12, 1), STEAM.hotSlag, 'vent-throat', { pos: [0, top - 0.04, 0] }));
  return seat(g);
}

/* What this module actually builds, with its declared axes. */
export const STEAM_GENERATORS = [
  { id: 'cw.industrial.aether-lamp', name: 'Aether lamp', axes: AETHER_LAMP_AXES, build: aetherLamp, domain: 'dungeon', budgetClass: 'minor' },
  { id: 'cw.industrial.pressure-gauge', name: 'Pressure gauge cluster', axes: GAUGE_AXES, build: pressureGauge, domain: 'dungeon', budgetClass: 'minor' },
  { id: 'cw.industrial.pipe-run', name: 'Pipe run', axes: PIPE_RUN_AXES, build: pipeRun, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'cw.industrial.chain-lift-block', name: 'Chain lift block', axes: LIFT_AXES, build: chainLiftBlock, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'cw.industrial.governor-flyball', name: 'Governor flyball', axes: GOVERNOR_AXES, build: governorFlyball, domain: 'combat', budgetClass: 'minor' },
  { id: 'cw.industrial.bellows-rig', name: 'Bellows rig', axes: BELLOWS_AXES, build: bellowsRig, domain: 'world', budgetClass: 'standard' },
  { id: 'cw.industrial.valve-wheel', name: 'Valve wheel', axes: VALVE_AXES, build: valveWheel, domain: 'dungeon', budgetClass: 'minor' },
  { id: 'cw.industrial.vent-stack', name: 'Vent stack', axes: VENT_AXES, build: ventStack, domain: 'world', budgetClass: 'standard' },
];
