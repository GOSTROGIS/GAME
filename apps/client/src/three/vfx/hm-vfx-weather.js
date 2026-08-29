/* Weather — rain, snow, wind, mist and storm light.
 *
 * These are the four families that are everywhere at once, which makes them
 * the only ones where the cost model is genuinely about count. They are also
 * the ones that carry the region's mood: hearthmere declares cold_overcast
 * key light and wetness 0.82, so rain is the default state of the world and
 * everything else is a departure from it.
 *
 * CAMERA-FOLLOWING VOLUMES
 * A weather volume is authored once around the origin and moved to the
 * camera each frame, so a hundred metres of travel does not need a hundred
 * metres of particles. `update(t, ctx)` takes { camera } and snaps the group
 * to it. Snapping is on a grid rather than exact so the volume does not
 * shear when the camera turns.
 *
 * WHY THE STORM IS THE ONE BRIGHT THING
 * A lightning flash is the only moment the Reach is allowed to be fully lit,
 * and it works because everything either side of it is dark. The flash drives
 * a real directional light AND a full-screen additive sheet: the light finds
 * the geometry, the sheet finds the fog. One without the other reads as a
 * gamma glitch.
 *
 * COUNTING RULE, held: an axis counts only if it changes silhouette or
 * behaviour. `tint` was cut from stormflash (a recolour); `branch` replaced
 * it, because forks change the bolt's silhouette. Fog's `glow` axis was cut
 * for the same reason and replaced with `roll` — whether the bank advects
 * with a front or sits still, which is behaviour.
 */
import * as THREE from 'three';
import { MAT, rnd, part, cnt } from '../../world/hearthmere/hm-core.js';
import {
  VFX_ENV, pal, gpuPoints, softVolume, lightPool, axesOf, measureFx,
  NOISE_GLSL, FOG_GLSL, vfxTexture, flicker,
} from './hm-vfx.js';
import { rippleSheet } from './hm-vfx-water.js';

/* Per-particle tumble. gpuPoints rotates its sprite by one uniform; debris
   needs every mote on its own axis, so the expression is patched in. Cheaper
   than an attribute and it only touches families that ask for it. */
function tumble(pts, rate = 1) {
  const m = pts.material;
  m.uniforms.uSpin.value = rate;
  m.fragmentShader = m.fragmentShader.replace(
    'float a = uSpin;',
    'float a = vSeed.x * 6.2831 + uTime * uSpin * (0.35 + vSeed.y * 1.9);');
  m.needsUpdate = true;
  return pts;
}

/* Snap a volume to the camera on a grid. Exact tracking shears the field when
   the camera rotates; a grid step means the field only ever jumps by a whole
   cell, which is invisible inside a continuous particle cloud. */
function followCamera(group, ctx, step = 4) {
  if (!ctx || !ctx.camera) return;
  const c = ctx.camera.position;
  group.position.x = Math.round(c.x / step) * step;
  group.position.z = Math.round(c.z / step) * step;
}

/* ============================================================== rainfall ==
   rate × slant × drop × ground × sheet × splash × gust
   = 4 · 4 · 3 · 3 · 2 · 3 · 2 = 1,728 */
export const RAINFALL_AXES = { rate: 4, slant: 4, drop: 3, ground: 3, sheet: 2, splash: 3, gust: 2 };
const RATE = [
  { id: 'spitting', n: 240, ripple: 0.5 },
  { id: 'steady', n: 900, ripple: 1.2 },
  { id: 'heavy', n: 2200, ripple: 2.2 },
  { id: 'torrent', n: 4200, ripple: 3.6 },
];
const SLANT = [
  { id: 'plumb', a: 0.0 }, { id: 'leaning', a: 0.18 },
  { id: 'driven', a: 0.42 }, { id: 'horizontal', a: 0.78 },
];

export function rainfall(variant = 0, opts = {}) {
  const A = axesOf(variant, RAINFALL_AXES);
  const R = RATE[A.rate], S = SLANT[A.slant];
  const rand = rnd(0x7a1 + variant * 8191);
  const g = new THREE.Group();
  g.name = 'vfx-rainfall';
  const E = opts.extent || 22;      // half-width of the volume
  const H = opts.height || 16;
  const len = [0.5, 0.85, 1.4][A.drop];

  /* --- the fall. Drops spawn across the volume floor and the motion lifts
     them to the ceiling, so `life` runs top-to-bottom with no CPU work. */
  const drops = gpuPoints({
    name: 'raindrops', count: R.n, size: 0.055 * len, life: 0.85 + len * 0.25,
    texture: 'streak', colA: 'bone', colB: 'focus',
    gain: 1.15, opacity: 0.5, rand, radius: E * 2, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0, (r() - 0.5) * E * 2],
    p1: H, p2: S.a, p3: len,
    motion: `vec3(
        (uWindDir.x * uWind * uP.y + uGust * uWindDir.x * 0.6) * (1.0 - life) * uP.x,
        uP.x * (1.0 - life),
        (uWindDir.y * uWind * uP.y + uGust * uWindDir.y * 0.6) * (1.0 - life) * uP.x)`,
    // Stretch with fall speed: a fast drop is a longer streak.
    sizeCurve: `(0.6 + s.z * 0.8) * (1.0 + uP.z * 0.8)`,
    alpha: `smoothstep(0.0, 0.04, life) * (0.55 + s.x * 0.45)`,
    colorT: `s.w`,
    rateSpread: '0.75 + s.w * 0.6',
  });
  // Rotate the streak sprite to match the slant, so the drop and its path agree.
  drops.material.uniforms.uSpin.value = -S.a * 0.9;
  g.add(drops);

  /* --- wet ground. The rings are the cheapest and most convincing part of
     rain: one quad, hashed impacts, and the ground suddenly has a surface. */
  let rings = null, splash = null;
  if (A.ground > 0) {
    rings = rippleSheet({
      name: 'rain-rings', size: E * 2, y: 0.02,
      rate: R.ripple * 0.55, cells: E * 2 * (A.ground === 2 ? 3.4 : 2.2),
      gain: [0, 0.4, 0.7][A.ground], width: 0.05, color: 'focusBright',
    });
    g.add(rings);
  }
  if (A.splash > 0) {
    splash = gpuPoints({
      name: 'splash', count: [0, 160, 420][A.splash], size: 0.03, life: 0.5,
      texture: 'glow', colA: 'bone', colB: 'focus', gain: 1.4, opacity: 0.5,
      rand, radius: E * 2, cull: false,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0.01, (r() - 0.5) * E * 2],
      p1: 0.42,
      motion: `vec3((s.x - 0.5) * life * 0.28, life * uP.x - life * life * uP.x * 1.6, (s.z - 0.5) * life * 0.28)`,
      sizeCurve: `(0.5 + s.z) * (1.0 - life * 0.5)`,
      alpha: `pow(1.0 - life, 1.8) * smoothstep(0.0, 0.06, life)`,
      colorT: `life`,
    });
    g.add(splash);
  }

  /* --- rain sheets. The thing that makes heavy rain read as weather rather
     than as a particle count: visible curtains crossing the middle distance. */
  let sheets = null;
  if (A.sheet) {
    sheets = softVolume({
      name: 'rain-sheet', count: cnt(9), size: E * 1.1, life: 7,
      rise: 0.0, spread: E * 0.5, grow: 1.3, opacity: 0.038,
      colA: 'mist', colB: 'focus', gain: 1.1, drift: 3.4, rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, H * 0.3 + r() * H * 0.3, (r() - 0.5) * E * 2],
    });
    g.add(sheets);
  }

  const dropMat = drops.material;
  const baseSize = 0.055 * len;
  return {
    group: g,
    declared: {
      rate: R.id, drops: R.n, slant: S.id,
      drop: ['fine', 'standard', 'fat'][A.drop],
      ground: ['dry', 'ripples', 'sheeting'][A.ground],
      sheet: !!A.sheet, splash: ['none', 'light', 'heavy'][A.splash],
      gust: A.gust ? 'squally' : 'even',
    },
    update(t, ctx) {
      followCamera(g, ctx, 4);
      if (A.gust) {
        // Squalls: the rate visibly surges rather than the wind merely rising.
        const s = 0.75 + Math.max(0, Math.sin(t * 0.31)) * 0.55 + Math.sin(t * 0.11) * 0.12;
        dropMat.uniforms.uOpacity.value = 0.5 * s;
        dropMat.uniforms.uSize.value = baseSize * (0.85 + s * 0.2);
      }
    },
    set(k, v) {
      if (k === 'rate') dropMat.uniforms.uOpacity.value = 0.5 * v;
      if (k === 'slant') dropMat.uniforms.uP.value.y = S.a * v;
      if (k === 'ground' && rings) rings.material.uniforms.uGain.value = [0, 0.4, 0.7][A.ground] * v;
      if (k === 'splash' && splash) splash.material.uniforms.uOpacity.value = 0.5 * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================== snowfall ==
   rate × flake × fall × swirl × ground × squall × settle
   = 4 · 3 · 4 · 3 · 3 · 2 · 2 = 1,728 */
export const SNOWFALL_AXES = { rate: 4, flake: 3, fall: 4, swirl: 3, ground: 3, squall: 2, settle: 2 };
const FALL = [
  { id: 'drifting', v: 0.22, turb: 1.6 },
  { id: 'settling', v: 0.4, turb: 1.0 },
  { id: 'steady', v: 0.75, turb: 0.6 },
  { id: 'driven', v: 1.5, turb: 0.35 },
];

export function snowfall(variant = 0, opts = {}) {
  const A = axesOf(variant, SNOWFALL_AXES);
  const F = FALL[A.fall];
  const rand = rnd(0x2c9 + variant * 7013);
  const g = new THREE.Group();
  g.name = 'vfx-snowfall';
  const E = opts.extent || 20;
  const H = opts.height || 14;
  const N = [300, 900, 2000, 3800][A.rate];
  const SZ = [0.05, 0.085, 0.14][A.flake];
  const swirl = [0.35, 0.9, 1.8][A.swirl];

  /* --- the fall. Snow is slow enough that the swirl is the effect: a flake
     that falls straight reads as dust. Two incommensurate lateral terms plus
     the shared wind, so no two flakes trace the same path. */
  const flakes = gpuPoints({
    name: 'snowflakes', count: N, size: SZ, life: 5.5 / Math.max(F.v, 0.15),
    texture: 'flake', colA: 'bone', colB: 'glacier',
    gain: 1.5, opacity: 0.72, rand, radius: E * 2, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0, (r() - 0.5) * E * 2],
    p1: H, p2: swirl * F.turb, p3: F.v,
    motion: `vec3(
        (sin(s.x * 6.28 + uTime * 0.55 + life * 4.1) * 0.7
          + sin(s.z * 9.1 + uTime * 0.23) * 0.4) * uP.y
          + uWindDir.x * (uWind + uGust * 0.7) * (1.0 - life) * uP.x * 0.34,
        uP.x * (1.0 - life),
        (cos(s.y * 6.28 + uTime * 0.49 + life * 3.7) * 0.7
          + cos(s.w * 8.3 + uTime * 0.21) * 0.4) * uP.y
          + uWindDir.y * (uWind + uGust * 0.7) * (1.0 - life) * uP.x * 0.34)`,
    sizeCurve: `0.45 + s.z * 1.2`,
    alpha: `smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.9, 1.0, life)) * (0.5 + s.x * 0.5)`,
    colorT: `s.w * 0.6`,
    rateSpread: '0.6 + s.w * 0.9',
  });
  tumble(flakes, 0.6);
  g.add(flakes);

  /* --- near-camera flakes. A handful of large, soft, out-of-focus flakes is
     what gives a snow field depth; without them every flake reads at the same
     distance and the volume looks like a texture. */
  let near = null;
  if (A.settle) {
    near = gpuPoints({
      name: 'snow-near', count: cnt(40), size: SZ * 5, life: 6,
      texture: 'flake', colA: 'bone', colB: 'bone',
      gain: 1.2, opacity: 0.1, rand, radius: 10, cull: false,
      spawn: (i, n, r) => [(r() - 0.5) * 10, 0, (r() - 0.5) * 10],
      p1: 9, p2: swirl,
      motion: `vec3(sin(s.x * 6.28 + uTime * 0.4) * uP.y * 1.4 + uWindDir.x * uWind * (1.0 - life) * 2.0,
                    uP.x * (1.0 - life),
                    cos(s.y * 6.28 + uTime * 0.36) * uP.y * 1.4 + uWindDir.y * uWind * (1.0 - life) * 2.0)`,
      sizeCurve: `0.6 + s.z * 1.4`,
      alpha: `sin(life * 3.14159) * 0.8`,
      colorT: `0.0`,
    });
    tumble(near, 0.3);
    g.add(near);
  }

  /* --- ground. Snow lying is a lightness on the floor, not a white plane:
     a wide, very soft additive pool at bone luminance. */
  let lying = null;
  if (A.ground > 0) {
    lying = lightPool({
      radius: E * 1.4, color: 'glacier',
      gain: [0, 0.1, 0.2][A.ground], flicker: 0, y: 0.015,
    });
    g.add(lying);
  }

  const mat = flakes.material;
  return {
    group: g,
    declared: {
      rate: ['thin', 'steady', 'heavy', 'blizzard'][A.rate], flakes: N,
      flake: ['fine', 'standard', 'clotted'][A.flake], fall: F.id,
      swirl: ['slight', 'wandering', 'chaotic'][A.swirl],
      ground: ['bare', 'dusted', 'lying'][A.ground],
      squall: A.squall ? 'gusting' : 'even',
      settle: A.settle ? 'near-field' : 'far only',
    },
    update(t, ctx) {
      followCamera(g, ctx, 4);
      if (A.squall) {
        const s = 0.7 + Math.max(0, Math.sin(t * 0.19 + 1.2)) * 0.7;
        mat.uniforms.uOpacity.value = 0.72 * s;
        mat.uniforms.uP.value.y = swirl * F.turb * (0.7 + s * 0.6);
      }
    },
    set(k, v) {
      if (k === 'rate') mat.uniforms.uOpacity.value = 0.72 * v;
      if (k === 'swirl') mat.uniforms.uP.value.y = swirl * F.turb * v;
      if (k === 'size') mat.uniforms.uSize.value = SZ * v;
      if (k === 'ground' && lying) lying.material.uniforms.uGain.value = [0, 0.1, 0.2][A.ground] * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================= windfield ==
   strength × debris × gust × lane × height × dust × vortex
   = 4 · 4 · 3 · 3 · 3 · 3 · 2 = 2,592 */
export const WINDFIELD_AXES = { strength: 4, debris: 4, gust: 3, lane: 3, height: 3, dust: 3, vortex: 2 };
const DEBRIS = [
  { id: 'leaf', tex: 'flake', colA: 'moss', colB: 'ash', size: 0.11, gain: 0.9, spin: 1.4 },
  { id: 'dust', tex: 'smoke', colA: 'ash', colB: 'mist', size: 0.2, gain: 0.7, spin: 0.3 },
  { id: 'ash', tex: 'smoke', colA: 'smoke', colB: 'ash', size: 0.14, gain: 0.8, spin: 0.5 },
  { id: 'seed', tex: 'glow', colA: 'bone', colB: 'boneDim', size: 0.05, gain: 1.3, spin: 0.8 },
];

export function windfield(variant = 0, opts = {}) {
  const A = axesOf(variant, WINDFIELD_AXES);
  const D = DEBRIS[A.debris];
  const rand = rnd(0x91d + variant * 6421);
  const g = new THREE.Group();
  g.name = 'vfx-windfield';
  const E = opts.extent || 20;
  const N = [180, 480, 1100, 2400][A.strength];
  const band = [1.4, 4, 9][A.height];
  const speed = [0.9, 1.8, 3.2, 5][A.strength];
  const lane = [0.2, 0.7, 1.5][A.lane];

  /* --- the field. Debris crosses the volume on the shared wind direction, so
     wind here and the swaying trees in hm-world.js are the same wind. */
  const motes = gpuPoints({
    name: 'wind-debris', count: N, size: D.size, life: 4.5,
    texture: D.tex, colA: D.colA, colB: D.colB === 'boneDim' ? 'bone' : D.colB,
    gain: D.gain, opacity: A.debris === 1 ? 0.3 : 0.6, rand, radius: E * 2, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0.15 + r() * band, (r() - 0.5) * E * 2],
    p1: speed, p2: lane, p3: band, p4: A.vortex ? 1 : 0,
    // Down-wind travel, a lateral wander, and a vertical bob that lifts with
    // gust — leaves rise on a gust and fall between them.
    motion: `vec3(
        uWindDir.x * uP.x * life * (2.6 + uWind * 3.0)
          + sin(s.x * 6.28 + uTime * 0.9 + life * 5.0) * uP.y
          + (uP.w > 0.5 ? cos(life * 9.0 + s.y * 6.28) * life * 2.2 : 0.0),
        sin(s.y * 6.28 + uTime * 0.7 + life * 3.4) * uP.y * 0.8
          + uGust * life * 1.6 * (0.4 + s.w)
          + (uP.w > 0.5 ? life * uP.z * 0.7 : 0.0),
        uWindDir.y * uP.x * life * (2.6 + uWind * 3.0)
          + cos(s.z * 6.28 + uTime * 0.85 + life * 4.6) * uP.y
          + (uP.w > 0.5 ? sin(life * 9.0 + s.y * 6.28) * life * 2.2 : 0.0))`,
    sizeCurve: `0.5 + s.z * 1.1`,
    alpha: `sin(life * 3.14159) * (0.5 + s.x * 0.5)`,
    colorT: `s.w`,
    rateSpread: '0.5 + s.w * 1.1',
  });
  if (D.spin) tumble(motes, D.spin);
  g.add(motes);

  /* --- ground dust. Wind is legible at the floor: a low sheet of dust that
     streaks downwind and lifts on the gust. */
  let dust = null;
  if (A.dust > 0) {
    dust = softVolume({
      name: 'ground-dust', count: [0, 14, 30][A.dust], size: 3.4,
      life: 5, rise: 0.18, spread: 3, grow: 2.6,
      opacity: [0, 0.05, 0.09][A.dust], colA: 'ash', colB: 'mist',
      gain: 0.9, drift: 3.6, rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 1.6, 0.25 + r() * 0.8, (r() - 0.5) * E * 1.6],
    });
    g.add(dust);
  }

  /* --- the gust front itself, as something you can watch arrive. */
  let front = null;
  if (A.gust > 0) {
    front = softVolume({
      name: 'gust-front', count: [0, 6, 12][A.gust], size: E * 0.8,
      life: 6, rise: 0.3, spread: E * 0.4, grow: 1.6,
      opacity: [0, 0.03, 0.055][A.gust], colA: 'mist', colB: 'ash',
      gain: 0.9, drift: 5, rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0.6 + r() * band * 0.6, (r() - 0.5) * E * 2],
    });
    g.add(front);
  }

  const mat = motes.material;
  return {
    group: g,
    declared: {
      strength: ['breath', 'breeze', 'blow', 'gale'][A.strength], motes: N,
      debris: D.id, gust: ['none', 'front', 'squall'][A.gust],
      lane: ['tight', 'loose', 'scattered'][A.lane],
      height: ['low', 'mid', 'tall'][A.height] + ' (' + band + 'm)',
      dust: ['clear', 'low dust', 'streaming'][A.dust],
      vortex: A.vortex ? 'dust-devil' : 'straight',
    },
    update(t, ctx) { followCamera(g, ctx, 6); },
    set(k, v) {
      if (k === 'strength') mat.uniforms.uP.value.x = speed * v;
      if (k === 'debris') mat.uniforms.uOpacity.value = (A.debris === 1 ? 0.3 : 0.6) * v;
      if (k === 'lane') mat.uniforms.uP.value.y = lane * v;
      if (k === 'dust' && dust) dust.children[0].material.uniforms.uOpacity.value = [0, 0.05, 0.09][A.dust] * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================ groundmist ==
   depth × density × drift × banding × extent × lift × roll
   = 4 · 4 · 3 · 3 · 3 · 3 · 2 = 2,592 */
export const GROUNDMIST_AXES = { depth: 4, density: 4, drift: 3, banding: 3, extent: 3, lift: 3, roll: 2 };

export function groundmist(variant = 0, opts = {}) {
  const A = axesOf(variant, GROUNDMIST_AXES);
  const rand = rnd(0x3f9 + variant * 5701);
  const g = new THREE.Group();
  g.name = 'vfx-groundmist';
  const E = [12, 20, 32][A.extent];
  const depth = [0.5, 1.2, 2.6, 5][A.depth];
  const dens = [10, 22, 44, 80][A.density];
  const drift = [0.25, 0.9, 2.2][A.drift];
  const bands = A.banding + 1;
  const lift = [0, 0.25, 0.7][A.lift];

  /* --- banded layers. Real ground fog is stratified: distinct sheets at
     distinct heights with clear air between them. One uniform cloud reads as
     a fog constant, which the scene already has. */
  const layers = [];
  for (let b = 0; b < bands; b++) {
    const y = depth * (0.15 + (b / bands) * 0.85);
    const layer = softVolume({
      name: 'mist-band-' + b, count: Math.round(dens / bands), size: E * 0.55,
      life: 16 - b * 2, rise: lift, spread: E * 0.35, grow: 1.5,
      opacity: (0.045 + A.density * 0.016) * (1 - b * 0.18),
      colA: 'mist', colB: b === 0 ? 'moss' : 'bone',
      gain: 1.0 + b * 0.08, drift: drift * (1 + b * 0.4), rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, y + (r() - 0.5) * depth * 0.3, (r() - 0.5) * E * 2],
    });
    layers.push(layer);
    g.add(layer);
  }

  const mats = layers.map((l) => l.children[0].material);
  const bases = mats.map((m) => m.uniforms.uOpacity.value);
  return {
    group: g,
    declared: {
      depth: depth + 'm', density: dens, drift: drift,
      banding: bands + (bands === 1 ? ' layer' : ' layers'),
      extent: E * 2 + 'm', lift: ['flat', 'creeping', 'rising'][A.lift],
      roll: A.roll ? 'advecting front' : 'settled',
    },
    update(t, ctx) {
      followCamera(g, ctx, 8);
      if (A.roll) {
        // A front passing through: the bank thickens and thins on a long
        // period, so the same fog is different fog a minute later.
        for (let i = 0; i < mats.length; i++) {
          mats[i].uniforms.uOpacity.value = bases[i] * (0.55 + Math.max(0, Math.sin(t * 0.07 + i * 0.9)) * 0.95);
        }
      }
    },
    set(k, v) {
      if (k === 'density') mats.forEach((m, i) => { m.uniforms.uOpacity.value = bases[i] * v; });
      if (k === 'drift') mats.forEach((m, i) => { m.uniforms.uDrift.value = drift * (1 + i * 0.4) * v; });
      if (k === 'lift') mats.forEach((m) => { m.uniforms.uRise.value = lift * v; });
    },
    ...measureFx(g),
  };
}

/* ============================================================ stormflash ==
   cadence × reach × bolt × sheet × branch × afterglow
   = 4 · 3 · 4 · 3 · 3 · 2 = 864
   The smallest declared space in the kit, and stated as such: a bolt has
   fewer honest axes than a fire does. Padding it with tint variants would
   have doubled the number without adding a single visibly different flash. */
export const STORMFLASH_AXES = { cadence: 4, reach: 3, bolt: 4, sheet: 3, branch: 3, afterglow: 2 };
const CADENCE = [
  { id: 'distant', t: 14, chance: 0.5 }, { id: 'building', t: 8, chance: 0.7 },
  { id: 'close', t: 4.2, chance: 0.85 }, { id: 'overhead', t: 1.9, chance: 1 },
];

/* A bolt as a tapering ribbon built from a random walk. Billboarded toward
   the camera each frame, because a flat ribbon seen edge-on disappears. */
function boltRibbon(o) {
  const n = o.segs || 24;
  const pts = [];
  let x = 0, z = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    x += (o.rand() - 0.5) * o.jag * (1.1 - t * 0.5);
    z += (o.rand() - 0.5) * o.jag * 0.4;
    pts.push([x, o.h * (1 - t), z]);
  }
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w = o.width * (1 - t * 0.7) * (0.55 + Math.abs(Math.sin(t * 11 + 1.3)) * 0.45);
    pos.push(pts[i][0] - w, pts[i][1], pts[i][2], pts[i][0] + w, pts[i][1], pts[i][2]);
    uvs.push(0, t, 1, t);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uFlash: { value: 0 }, uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity,
      uCore: { value: pal('bone') }, uEdge: { value: pal('focusBright') },
      uGain: { value: o.gain || 5.5 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uFlash, uGain, uIntensity; uniform vec3 uCore, uEdge;
      varying vec2 vUv;
      void main(){
        if (uFlash <= 0.001) discard;
        // Hot filament with a soft sheath: the channel is white, the corona
        // is --focus. Both blow out, which is what bloom needs.
        float d = abs(vUv.x - 0.5) * 2.0;
        float core = pow(1.0 - d, 7.0);
        float sheath = pow(1.0 - d, 1.8) * 0.5;
        vec3 c = uCore * core * 2.2 + uEdge * sheath;
        gl_FragColor = vec4(c * uGain * uIntensity, (core + sheath * 0.6) * uFlash);
      }`,
  });
  mat.name = 'bolt-ribbon';
  const m = new THREE.Mesh(geo, mat);
  m.name = o.name || 'bolt';
  m.renderOrder = 14;
  return m;
}

export function stormflash(variant = 0, opts = {}) {
  const A = axesOf(variant, STORMFLASH_AXES);
  const C = CADENCE[A.cadence];
  const rand = rnd(0xb01 + variant * 4093);
  const g = new THREE.Group();
  g.name = 'vfx-stormflash';
  const H = [14, 26, 42][A.reach];
  const boltKind = ['none', 'single', 'forked', 'crawler'][A.bolt];

  /* --- the bolts. Branch count changes the silhouette, which is why branch
     is an axis and colour is not. They hang off their own root so a strike
     can be RELOCATED: the storm group tracks the camera, so a bolt left at
     the group origin is inside the viewer's head, and the vector from the
     group to the camera is zero — which makes the billboard angle atan2(0,0)
     and leaves every bolt edge-on and invisible. */
  const boltRoot = new THREE.Group();
  boltRoot.name = 'strike';
  g.add(boltRoot);
  const bolts = [];
  if (A.bolt > 0) {
    const branches = A.branch + (A.bolt === 2 ? 1 : 0);
    const main = boltRibbon({
      h: H, width: 0.16 + A.reach * 0.05, jag: A.bolt === 3 ? 2.6 : 1.3,
      segs: A.bolt === 3 ? 34 : 22, rand, gain: 5 + A.reach, name: 'bolt-main',
    });
    boltRoot.add(main);
    bolts.push(main);
    for (let b = 0; b < branches; b++) {
      const fork = boltRibbon({
        h: H * (0.28 + rand() * 0.3), width: 0.08, jag: 1.6, segs: 12,
        rand, gain: 4, name: 'bolt-fork-' + b,
      });
      fork.position.set((rand() - 0.5) * H * 0.16, H * (0.35 + rand() * 0.4), (rand() - 0.5) * 2);
      fork.rotation.z = (rand() - 0.5) * 1.1;
      boltRoot.add(fork);
      bolts.push(fork);
    }
  }

  /* --- the sheet. A hemisphere shell lighting the fog from inside the storm.
     This is the half that finds the atmosphere; the light finds the geometry. */
  let sheet = null;
  if (A.sheet > 0) {
    const sm = new THREE.ShaderMaterial({
      uniforms: {
        uFlash: { value: 0 }, uIntensity: VFX_ENV.uIntensity,
        uCol: { value: pal('focusBright') }, uGain: { value: [0, 0.22, 0.48][A.sheet] },
      },
      transparent: true, depthWrite: false, side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vP;
        void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uFlash, uGain, uIntensity; uniform vec3 uCol; varying vec3 vP;
        void main(){
          if (uFlash <= 0.001) discard;
          // Brightest at the horizon, because that is where the cloud base is.
          // Held down hard: the sheet exists to light the FOG, and at any real
          // weight it flattens the whole frame to grey and swallows the bolt
          // it is supposed to be supporting.
          float h = 1.0 - abs(vP.y);
          gl_FragColor = vec4(uCol * uGain * uIntensity * 1.2, pow(h, 2.4) * uFlash * 0.42);
        }`,
    });
    sm.name = 'storm-sheet';
    sheet = new THREE.Mesh(new THREE.SphereGeometry(H * 2.2, 18, 12), sm);
    sheet.name = 'storm-sheet';
    sheet.frustumCulled = false;
    sheet.renderOrder = 1;
    g.add(sheet);
  }

  /* --- the real light. One directional light: the flash has to find the
     geometry or the whole thing reads as a screen effect. */
  const light = new THREE.DirectionalLight(0xcfe6ee, 0);
  light.position.set(6, H * 0.7, -4);
  light.name = 'flash-light';
  g.add(light);

  const boltMats = bolts.map((b) => b.material);
  const peak = [0, 2.2, 3.6, 5.4][A.bolt] || 3;
  let nextAt = 2, flash = 0, seq = 0, holdTo = 0;
  return {
    group: g,
    declared: {
      cadence: C.id, meanPeriod: C.t + 's', reach: H + 'm',
      bolt: boltKind, branch: A.bolt > 0 ? A.branch + (A.bolt === 2 ? 1 : 0) : 0,
      sheet: ['none', 'soft', 'full'][A.sheet],
      afterglow: A.afterglow ? 'lingering' : 'clean',
    },
    update(t, ctx) {
      if (ctx && ctx.camera) {
        g.position.set(ctx.camera.position.x, 0, ctx.camera.position.z);
        // The bolt stands off in the middle distance and turns its ribbon face
        // toward the viewer. Because the group sits on the camera, the vector
        // to the camera is simply the negated local offset.
        boltRoot.rotation.y = Math.atan2(-boltRoot.position.x, -boltRoot.position.z);
      }
      if (t > nextAt) {
        // A strike is a short burst of 1-3 flickers, not one clean pulse.
        seq = 1 + Math.floor(rand() * 3);
        holdTo = t + 0.1 + seq * 0.075;
        nextAt = t + C.t * (0.55 + rand() * 0.9);
        flash = 1;
        // Each strike lands somewhere new, at storm distance — biased into the
        // camera's forward arc. A uniformly random azimuth puts half of all
        // strikes behind the viewer, so the flash fires and there is nothing
        // to look at. Real storms do that; a lab and a game should not.
        const fwd = (ctx && ctx.camera)
          ? Math.atan2(
            -(ctx.camera.matrixWorld.elements[8]),
            -(ctx.camera.matrixWorld.elements[10]))
          : 0;
        const az = fwd + (rand() - 0.5) * 1.7;
        const dist = H * (0.45 + rand() * 0.5);
        boltRoot.position.set(Math.sin(az) * dist, 0, Math.cos(az) * dist);
        light.position.set(Math.sin(az) * dist, H * 0.7, Math.cos(az) * dist);
      }
      if (t < holdTo) {
        // Strobe inside the strike.
        flash = Math.abs(Math.sin(t * 46 + seq)) * (0.55 + rand() * 0.45);
      } else {
        flash *= A.afterglow ? 0.93 : 0.78;
        if (flash < 0.002) flash = 0;
      }
      boltMats.forEach((m) => { m.uniforms.uFlash.value = flash; });
      if (sheet) sheet.material.uniforms.uFlash.value = flash;
      light.intensity = flash * peak;
    },
    set(k, v) {
      if (k === 'reach') light.intensity = flash * peak * v;
      if (k === 'bolt') boltMats.forEach((m) => { m.uniforms.uGain.value = (5 + A.reach) * v; });
      if (k === 'sheet' && sheet) sheet.material.uniforms.uGain.value = [0, 0.22, 0.48][A.sheet] * v;
    },
    ...measureFx(g),
  };
}

export const WEATHER_FAMILIES = [
  {
    id: 'hm.vfx.rainfall', name: 'Rain and wet ground', group: 'weather',
    axes: RAINFALL_AXES, build: rainfall, stage: 'volume',
    prior: 'Hearthmere Living World camera-following rain',
    hero: { rate: 2, slant: 1, drop: 1, ground: 1, sheet: 1, splash: 1, gust: 1 },
    params: [
      { key: 'rate', label: 'Rate', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'slant', label: 'Slant', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'ground', label: 'Ground rings', min: 0, max: 2.6, step: 0.05, value: 1 },
      { key: 'splash', label: 'Splash', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'The declared default state of the Reach. The hashed impact rings are one quad for a thousand impacts \u2014 the cheapest convincing thing in the whole kit.',
  },
  {
    id: 'hm.vfx.snowfall', name: 'Snow and drifting flurries', group: 'weather',
    axes: SNOWFALL_AXES, build: snowfall, stage: 'volume', prior: null,
    hero: { rate: 2, flake: 1, fall: 1, swirl: 1, ground: 2, squall: 0, settle: 1 },
    params: [
      { key: 'rate', label: 'Rate', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'swirl', label: 'Swirl', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'size', label: 'Flake size', min: 0.3, max: 3, step: 0.05, value: 1 },
    ],
    note: 'Snow is slow enough that the swirl is the effect. Half the variants add a near-field of large soft flakes, which is what gives the volume depth instead of reading as a texture.',
  },
  {
    id: 'hm.vfx.windfield', name: 'Wind, leaves and dust', group: 'weather',
    axes: WINDFIELD_AXES, build: windfield, stage: 'volume',
    prior: 'hm-world.js windify() \u2014 vertex wind on scatter',
    hero: { strength: 2, debris: 0, gust: 1, lane: 1, height: 1, dust: 1, vortex: 0 },
    params: [
      { key: 'strength', label: 'Strength', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'debris', label: 'Debris density', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'lane', label: 'Wander', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'dust', label: 'Ground dust', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'Reads the same uWind and uGust as windify(), so airborne debris and the swaying scatter are one wind rather than two effects that happen to agree.',
  },
  {
    id: 'hm.vfx.groundmist', name: 'Fog and ground mist', group: 'weather',
    axes: GROUNDMIST_AXES, build: groundmist, stage: 'volume', prior: null,
    hero: { depth: 2, density: 2, drift: 1, banding: 2, extent: 1, lift: 1, roll: 1 },
    params: [
      { key: 'density', label: 'Density', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'drift', label: 'Drift', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'lift', label: 'Lift', min: 0, max: 3, step: 0.05, value: 1 },
    ],
    note: 'Stratified into distinct sheets with clear air between them. One uniform cloud would just restate the scene\u2019s FogExp2, which is already there.',
  },
  {
    id: 'hm.vfx.stormflash', name: 'Lightning and storm flash', group: 'weather',
    axes: STORMFLASH_AXES, build: stormflash, stage: 'volume', prior: null,
    hero: { cadence: 2, reach: 1, bolt: 2, sheet: 2, branch: 1, afterglow: 1 },
    params: [
      { key: 'bolt', label: 'Bolt brightness', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'sheet', label: 'Sky sheet', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'reach', label: 'Flash light', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: '864 variants \u2014 the smallest space in the kit, and stated rather than padded: a bolt has fewer honest axes than a fire. A strike is a burst of one to three flickers, not a clean pulse.',
  },
];
