/* Fire and fallout — bonfire, forge, practicals, and the things that fall
 * out of a fire afterwards.
 *
 * Fire is the one element in the Reach that is allowed to be beautiful, so it
 * gets the most machinery: a layered flame body, a hot core, buoyant embers,
 * an occluding smoke plume, a fake light pool on the ground, and one real
 * flickering light where the budget can afford it. Six things, and it is the
 * SUM of them that reads as fire — any one alone reads as an effect.
 *
 * Where a flame changes colour here it is because the fuel changed, and fuel
 * also changes shape, ember rate and plume. Colour is never its own axis.
 *
 * Relic-ash fire is not invention: README/DESIGN describe the royal foundry
 * alloying iron with relic ash to make bell-metal, and cinderward declares
 * ember_iron_spark and slag_drip_glow as vfx rows. A charge that burns cold
 * and bell-coloured is the fiction the repo already carries.
 */
import * as THREE from 'three';
import { MAT, rnd, part, ico, cyl, torus, lathe, jitter, cnt } from './hm-core.js';
import {
  VFX_ENV, pal, flameColumn, gpuPoints, softVolume, lightPool, vfxTexture,
  axesOf, spaceOf, measureFx, flicker, fallMaterial, curtainGeometry, vfxQuality,
  ballistic, speedForHeight, G,
} from './hm-vfx.js';

const rad = (deg) => (deg * Math.PI) / 180;

/* Shared ember cloud. `hot` biases the ramp; `spit` makes it a spark shower
   instead of a drift — a different behaviour, which is why it is an axis. */
function embers(o) {
  return gpuPoints({
    name: o.name || 'embers',
    count: o.count, size: o.size || 0.05, life: o.life || 2.6,
    texture: o.spit ? 'spark' : 'glow',
    colA: o.colA || 'whiteHot', colB: o.colB || 'emberDeep',
    gain: o.gain != null ? o.gain : 3.4, opacity: 0.95,
    rand: o.rand, radius: o.rise * 1.4,
    spawn: (i, n, r) => [(r() - 0.5) * o.spread, o.y0 || 0.05, (r() - 0.5) * o.spread],
    p1: o.rise,
    motion: `vec3(
        sin(s.z * 6.28 + uTime * 1.5 + life * 3.1) * (0.14 + s.x * 0.34) * life * uP.y
          + uWindDir.x * uWind * life * life * 1.5,
        life * uP.x * (0.55 + s.w * ${o.spit ? '1.9' : '0.9'}),
        cos(s.y * 6.28 + uTime * 1.27 + life * 2.7) * (0.14 + s.z * 0.34) * life * uP.y
          + uWindDir.y * uWind * life * life * 1.5)`,
    p2: o.turb != null ? o.turb : 1,
    sizeCurve: `(1.0 - life * ${o.spit ? '0.8' : '0.55'}) * (0.45 + s.z * 1.1)`,
    alpha: `pow(1.0 - life, ${o.spit ? '2.4' : '1.5'}) * smoothstep(0.0, 0.07, life)`,
    colorT: `pow(life, 0.75) * 1.25`,
  });
}

/* ============================================================== bonfire ==
   fuel × mass × vigour × tongues × plume × base × spit = 2,592 */
export const BONFIRE_AXES = { fuel: 4, mass: 4, vigour: 3, tongues: 3, plume: 3, base: 3, spit: 2 };
const FUEL = [
  { id: 'pine-crib', ramp: ['whiteHot', 'goldBright', 'flame', 'ember', 'emberDeep'], ember: 1, rise: 1.15, smoke: 0.8, light: 0xff9a45, detail: 2.4 },
  { id: 'faggot-bundle', ramp: ['goldBright', 'flame', 'ember', 'emberDeep', 'coal'], ember: 1.5, rise: 1.5, smoke: 1.2, light: 0xff8a3a, detail: 3.4 },
  { id: 'coal-bed', ramp: ['flame', 'ember', 'emberDeep', 'coal', 'coal'], ember: 0.5, rise: 0.7, smoke: 1.6, light: 0xd6522a, detail: 1.8 },
  { id: 'relic-ash', ramp: ['bone', 'glacier', 'focusBright', 'focus', 'moss'], ember: 0.8, rise: 1.3, smoke: 0.4, light: 0x9fd0dd, detail: 3 },
];
const MASS = [
  { id: 'hearth', h: 0.55, r: 0.24, pool: 2.2, li: 4 },
  { id: 'camp', h: 1.05, r: 0.36, pool: 3.6, li: 7 },
  { id: 'watch', h: 1.7, r: 0.52, pool: 5.4, li: 11 },
  { id: 'pyre', h: 2.7, r: 0.78, pool: 8.5, li: 17 },
];
const VIGOUR = [
  { id: 'banked', v: 0.55, g: 0.82, e: 0.4 },
  { id: 'steady', v: 1, g: 1.15, e: 1 },
  { id: 'roaring', v: 1.75, g: 1.5, e: 1.9 },
];

export function bonfire(variant = 0, opts = {}) {
  const A = axesOf(variant, BONFIRE_AXES);
  const F = FUEL[A.fuel], M = MASS[A.mass], V = VIGOUR[A.vigour];
  const rand = rnd(0xf1e + variant * 7919);
  const g = new THREE.Group();
  g.name = 'vfx-bonfire';
  const scale = opts.scale || 1;
  const H = M.h * scale, R = M.r * scale;

  /* --- the fuel, as geometry. A fire needs something to be burning. */
  if (A.base === 0) {
    for (let i = 0; i < cnt(11); i++) {
      const a = (i / 11) * Math.PI * 2;
      const s = ico(R * (0.2 + rand() * 0.12), 0);
      s.scale(1.3, 0.7, 1);
      g.add(part(jitter(s, R * 0.06, rand), MAT.springStone, 'ring-stone-' + i,
        { pos: [Math.cos(a) * R * 1.5, R * 0.12, Math.sin(a) * R * 1.5], rot: [0, a, 0] }));
    }
  } else if (A.base === 1) {
    g.add(part(lathe([[R * 1.5, 0], [R * 1.6, R * 0.42], [R * 1.1, R * 0.5], [R * 0.3, R * 0.16]], 16),
      MAT.blackIron, 'iron-bowl'));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.add(part(cyl(R * 0.09, R * 0.06, R * 0.9, 6), MAT.blackIron, 'bowl-leg-' + i,
        { pos: [Math.cos(a) * R * 1.1, -R * 0.4, Math.sin(a) * R * 1.1], rot: [rad(9) * Math.cos(a), 0, -rad(9) * Math.sin(a)] }));
    }
  } else {
    const pit = new THREE.CylinderGeometry(R * 1.7, R * 1.3, R * 0.3, 14, 1);
    g.add(part(jitter(pit, R * 0.07, rand), MAT.ash, 'ash-pit', { pos: [0, R * 0.08, 0] }));
  }

  // Fuel logs, cribbed or bundled. Silhouette differs per fuel.
  const logMat = A.fuel === 3 ? MAT.ash : MAT.pineBark;
  if (A.fuel === 0 || A.fuel === 1) {
    const n = A.fuel === 0 ? cnt(6) : cnt(9);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand();
      const len = A.fuel === 0 ? R * 2.4 : R * 1.7;
      g.add(part(cyl(R * 0.11, R * 0.13, len, 5), logMat, 'log-' + i, {
        pos: [Math.cos(a) * R * 0.4, R * (0.3 + (i % 2) * 0.22), Math.sin(a) * R * 0.4],
        rot: A.fuel === 0 ? [Math.PI / 2, a, rad(6)] : [rad(62) * Math.cos(a), a, rad(62) * Math.sin(a)],
      }));
    }
  } else {
    for (let i = 0; i < cnt(9); i++) {
      const s = ico(R * (0.12 + rand() * 0.1), 0);
      g.add(part(s, A.fuel === 3 ? MAT.clayPale : MAT.ash, 'coal-' + i,
        { pos: [(rand() - 0.5) * R * 1.8, R * 0.2 + rand() * R * 0.2, (rand() - 0.5) * R * 1.8] }));
    }
  }

  // Live coals under the flame. This is the only emissive standard material
  // in the effect; everything else above it is additive.
  const coalMat = MAT.ember.clone();
  coalMat.name = 'live-coal-' + F.id;
  coalMat.emissive = pal(A.fuel === 3 ? 'focusBright' : 'ember');
  coalMat.emissiveIntensity = 2.2 * V.v;
  const coals = new THREE.Group();
  coals.name = 'coal-bed';
  for (let i = 0; i < cnt(7); i++) {
    const s = ico(R * (0.13 + rand() * 0.12), 0);
    s.scale(1.2, 0.5, 1.1);
    coals.add(part(s, coalMat, 'coal-live-' + i,
      { pos: [(rand() - 0.5) * R * 1.5, R * 0.18, (rand() - 0.5) * R * 1.5] }));
  }
  g.add(coals);

  /* --- the flame body */
  const flame = flameColumn({
    shells: [3, 4, 6][A.tongues], height: H, radius: R, ramp: F.ramp,
    vigour: V.v, gain: V.g, rise: F.rise, seed: variant + 1, detail: F.detail,
    sway: 1 + (A.vigour === 2 ? 0.5 : 0), squash: 0.28 + V.v * 0.1,
  });
  flame.position.y = R * 0.22;
  g.add(flame);

  /* --- embers */
  const emb = embers({
    count: Math.round(36 * F.ember * V.e * (0.6 + M.h)), size: 0.045 * scale * (0.7 + M.h * 0.4),
    life: 2.4 + M.h * 0.6, rise: H * 2.4, spread: R * 1.6, y0: R * 0.3,
    colA: A.fuel === 3 ? 'glacier' : 'whiteHot', colB: A.fuel === 3 ? 'focus' : 'emberDeep',
    gain: 3.2 * V.v, rand, spit: false, name: 'bonfire-embers',
  });
  g.add(emb);

  let sparks = null;
  if (A.spit) {
    sparks = embers({
      count: Math.round(30 * V.e), size: 0.028 * scale, life: 1.1, rise: H * 3.4,
      spread: R * 0.9, y0: R * 0.4, spit: true, gain: 4.6 * V.v, rand,
      colA: A.fuel === 3 ? 'bone' : 'whiteHot', colB: A.fuel === 3 ? 'focusBright' : 'flame',
      name: 'bonfire-sparks',
    });
    g.add(sparks);
  }

  /* --- plume */
  let plume = null;
  if (A.plume === 1) {
    plume = softVolume({
      name: 'smoke', count: Math.round(10 * F.smoke * (0.6 + M.h * 0.5)), size: R * 2.2,
      life: 5 + M.h, rise: 1.1 + V.v * 0.5, spread: R * 2.4, grow: 2.4,
      opacity: 0.085 * F.smoke, colA: 'smoke', colB: 'ash', rand,
      spawn: () => [0, H * 0.75, 0],
    });
    g.add(plume);
  } else if (A.plume === 2) {
    // Ember column: a chimney of rising heat, no smoke. Reads as a signal fire.
    plume = embers({
      count: Math.round(44 * V.e), size: 0.036 * scale, life: 4.2, rise: H * 5.5,
      spread: R * 0.7, y0: H * 0.7, gain: 2.6, rand,
      colA: A.fuel === 3 ? 'focusBright' : 'flame', colB: 'coal', name: 'ember-column',
    });
    g.add(plume);
  }

  /* --- ground light and one real light */
  const pool = lightPool({
    radius: M.pool * scale * (0.7 + V.v * 0.4),
    color: A.fuel === 3 ? 'focus' : 'ember',
    gain: 0.24 * V.v, phase: variant * 1.7, y: 0.04,
  });
  g.add(pool);

  let light = null;
  if (opts.light !== false) {
    light = new THREE.PointLight(F.light, M.li * V.v * (opts.lightScale || 1), M.pool * 3.4 * scale, 2);
    light.position.y = H * 0.45;
    light.name = 'fire-light';
    g.add(light);
  }

  const phase = variant * 2.7;
  const base = light ? light.intensity : 0;
  return {
    group: g,
    declared: { fuel: F.id, mass: M.id, vigour: V.id, tongues: [3, 4, 6][A.tongues], plume: ['none', 'smoke', 'ember-column'][A.plume], base: ['stone-ring', 'iron-bowl', 'ash-pit'][A.base], spit: !!A.spit },
    update(t) {
      if (light) light.intensity = base * flicker(t, phase);
      coalMat.emissiveIntensity = 2.2 * V.v * flicker(t, phase + 1.1, 0.5);
    },
    set(k, v) {
      if (k === 'height') flame.scale.setScalar(v);
      if (k === 'vigour') flame.traverse((n) => { if (n.material && n.material.uniforms && n.material.uniforms.uVigour) n.material.uniforms.uVigour.value = v; });
      if (k === 'embers') { emb.material.uniforms.uOpacity.value = 0.95 * v; if (sparks) sparks.material.uniforms.uOpacity.value = 0.95 * v; }
    },
    ...measureFx(g),
  };
}

/* ============================================================ forge fire ==
   bed × blast × slag × spark × vessel × quench = 3 × 4 × 4 × 3 × 3 × 3 = 1,296
   ...times pour (2) = 2,592 */
export const FORGE_AXES = { bed: 3, blast: 4, slag: 4, spark: 3, vessel: 3, quench: 3, pour: 2 };
const BLAST = [
  { id: 'cold', v: 0.3, g: 0.68, cycle: 0 },
  { id: 'draught', v: 0.7, g: 1.0, cycle: 0.3 },
  { id: 'bellowed', v: 1.3, g: 1.4, cycle: 1 },
  { id: 'roaring', v: 2, g: 1.85, cycle: 0.5 },
];

export function forgeFire(variant = 0, opts = {}) {
  const A = axesOf(variant, FORGE_AXES);
  const B = BLAST[A.blast];
  const rand = rnd(0xc0a + variant * 6151);
  const g = new THREE.Group();
  g.name = 'vfx-forge-fire';
  const scale = opts.scale || 1;
  const W = [0.9, 1.3, 1.8][A.bed] * scale;

  /* Hearth masonry — the vessel axis changes the silhouette entirely. */
  const brick = MAT.firedClay;
  if (A.vessel === 0) {
    g.add(part(new THREE.BoxGeometry(W * 1.6, W * 0.7, W * 1.2), brick, 'hearth-block', { pos: [0, W * 0.35, 0] }));
    g.add(part(new THREE.BoxGeometry(W * 1.3, W * 0.16, W * 0.9), MAT.ash, 'hearth-bed', { pos: [0, W * 0.72, 0] }));
  } else if (A.vessel === 1) {
    g.add(part(lathe([[W * 0.62, 0], [W * 0.7, W * 0.5], [W * 0.55, W * 0.62], [W * 0.2, W * 0.2]], 18), MAT.blackIron, 'crucible'));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.add(part(cyl(W * 0.06, W * 0.05, W * 0.5, 6), MAT.blackIron, 'crucible-leg-' + i,
        { pos: [Math.cos(a) * W * 0.5, -W * 0.2, Math.sin(a) * W * 0.5] }));
    }
  } else {
    g.add(part(new THREE.BoxGeometry(W * 2, W * 0.3, W * 1.1), brick, 'tap-sill', { pos: [0, W * 0.15, 0] }));
    g.add(part(new THREE.BoxGeometry(W * 0.5, W * 0.9, W * 0.6), brick, 'tap-throat', { pos: [-W * 0.7, W * 0.6, 0] }));
  }

  /* Molten bed — emissive, and the brightest continuous surface in the kit. */
  const meltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a1a0e'), roughness: 0.42, metalness: 0,
    emissive: pal('flame'), emissiveIntensity: 2.4 * B.v,
  });
  meltMat.name = 'molten-bed';
  const bedGeo = new THREE.CylinderGeometry(W * 0.52, W * 0.44, W * 0.1, 16, 1);
  const bed = part(jitter(bedGeo, W * 0.02, rand), meltMat, 'molten-bed',
    { pos: [0, A.vessel === 0 ? W * 0.8 : A.vessel === 1 ? W * 0.55 : W * 0.32, 0] });
  g.add(bed);

  const flame = flameColumn({
    shells: 4, height: W * (0.7 + B.v * 0.55), radius: W * 0.44,
    ramp: ['whiteHot', 'goldBright', 'flame', 'ember', 'emberDeep'],
    vigour: 0.6 + B.v, gain: B.g, rise: 1.4 + B.v * 0.5, seed: variant + 3,
    detail: 3.2, sway: 0.5, squash: 0.2,
  });
  flame.position.y = bed.position.y + W * 0.04;
  g.add(flame);

  /* Slag: a molten runnel using the waterfall sheet with a hot palette. Same
     machinery, opposite temperature — slag_drip_glow is a declared row. */
  let slag = null;
  if (A.slag > 0) {
    const drop = W * [0, 0.5, 1.1, 1.9][A.slag];
    const mat = fallMaterial({
      speed: 0.5 + A.slag * 0.22, braid: 2 + A.slag, sharp: 0.5,
      height: drop, vel0: 0.12 + A.slag * 0.05,
      body: 'goldBright', deep: 'emberDeep', foamColor: 'whiteHot',
      gain: 2.4 + A.slag * 0.5, phase: variant, volume: 0.5 + A.slag * 0.18,
    });
    mat.blending = THREE.AdditiveBlending;
    slag = new THREE.Mesh(curtainGeometry({ w: W * (0.16 + A.slag * 0.09), h: drop, curve: 0.5, spread: 0.5, segsW: 8, segsH: 20 }), mat);
    slag.name = 'slag-runnel';
    slag.position.set(W * (A.vessel === 2 ? -0.9 : 0.55), bed.position.y - drop / 2, 0);
    g.add(slag);
    // Molten pool where it lands.
    const poolMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a1109'), roughness: 0.5, emissive: pal('ember'), emissiveIntensity: 2,
    });
    poolMat.name = 'slag-pool';
    const sp = new THREE.Mesh(new THREE.CircleGeometry(W * 0.3 * A.slag, 18), poolMat);
    sp.name = 'slag-pool';
    sp.rotation.x = -Math.PI / 2;
    sp.position.set(slag.position.x, 0.02, 0);
    g.add(sp);
  }

  /* Iron sparks — ember_iron_spark. Flat trajectories, not a rising drift.
     Real ballistics: a spark leaves the bed at a launch speed and falls at g.
     The old form drove BOTH the launch and the fall from one parameter, so
     gravity scaled with throw strength — a harder strike made sparks fall
     faster, which is exactly backwards. */
  const sparkLife = 0.9;
  const sparkB = ballistic(2.2 + A.spark * 0.5, sparkLife);
  const sparks = gpuPoints({
    name: 'iron-spark', count: [30, 70, 130][A.spark], size: 0.03 * scale, life: sparkLife,
    texture: 'spark', colA: 'whiteHot', colB: 'flame', gain: 5.2, opacity: 1, rand,
    spawn: () => [0, bed.position.y + W * 0.1, 0], radius: W * 4,
    p1: sparkB.rise, p2: sparkB.fall, p3: W * 2.4,
    motion: `vec3(
        (s.x - 0.5) * uP.z * life,
        life * uP.x * (0.4 + s.w) - life * life * uP.y,
        (s.z - 0.5) * uP.z * life)`,
    sizeCurve: `(1.0 - life * 0.7) * (0.4 + s.w)`,
    alpha: `pow(1.0 - life, 2.2)`,
    colorT: `life * 1.6`,
  });
  g.add(sparks);

  let quench = null;
  if (A.quench > 0) {
    quench = softVolume({
      name: 'quench-steam', count: [0, 8, 16][A.quench], size: W * 1.4,
      life: 3.2, rise: 2.4, spread: W * 1.6, grow: 2.4, opacity: 0.07,
      colA: 'mist', colB: 'bone', gain: 1.1, rand,
      spawn: (i, n, r) => [(r() - 0.5) * W, W * 0.2, (r() - 0.5) * W],
    });
    g.add(quench);
  }

  if (A.pour) {
    // A ladle pour: a bright thread of metal on a real parabola. Molten metal
    // leaving a lip carries its horizontal speed UNCHANGED and accelerates
    // downward at g. The earlier form squared the horizontal term too, so the
    // thread accelerated sideways as though gravity pulled along x — the tell
    // was slag that curved away from the vessel instead of falling from it.
    const pourLife = 1.4;
    const pour = gpuPoints({
      name: 'pour', count: 90, size: 0.05 * scale, life: pourLife, texture: 'glow',
      colA: 'whiteHot', colB: 'flame', gain: 4.4, opacity: 0.95, rand,
      spawn: () => [W * 0.8, W * 1.5, 0], radius: W * 3,
      p1: W * 0.55, p2: 0.5 * G * pourLife * pourLife * 0.12,
      motion: `vec3(-life * uP.x, -life * life * uP.y, (s.z - 0.5) * 0.05)`,
      sizeCurve: `0.7 + s.w * 0.6`, alpha: `smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.78, 1.0, life))`,
      colorT: `life`,
    });
    g.add(pour);
  }

  g.add(lightPool({ radius: W * 3.2, color: 'ember', gain: 0.8 * B.v, phase: variant, y: 0.05 }));
  let light = null;
  if (opts.light !== false) {
    light = new THREE.PointLight(0xff7a33, 9 * B.v * (opts.lightScale || 1), W * 12, 2);
    light.position.y = bed.position.y + W * 0.4;
    light.name = 'forge-light';
    g.add(light);
  }
  const phase = variant * 3.1;
  const baseI = light ? light.intensity : 0;
  return {
    group: g,
    declared: { bed: ['small', 'standard', 'great'][A.bed], blast: B.id, slag: ['none', 'weep', 'runnel', 'cascade'][A.slag], spark: ['few', 'many', 'shower'][A.spark], vessel: ['hearth', 'crucible', 'tap'][A.vessel], quench: ['dry', 'plume', 'burst'][A.quench], pour: !!A.pour },
    update(t) {
      // Bellows cycle: the blast rises and falls on a stated period.
      const cyc = B.cycle ? 1 + Math.sin(t * 0.9) * 0.35 * B.cycle : 1;
      if (light) light.intensity = baseI * flicker(t, phase) * cyc;
      meltMat.emissiveIntensity = 2.4 * B.v * cyc * flicker(t, phase, 0.4);
      flame.traverse((n) => {
        if (n.material && n.material.uniforms && n.material.uniforms.uVigour)
          n.material.uniforms.uVigour.value = (0.6 + B.v) * cyc;
      });
    },
    set(k, v) {
      if (k === 'blast') flame.traverse((n) => { if (n.material && n.material.uniforms && n.material.uniforms.uVigour) n.material.uniforms.uVigour.value = v; });
      if (k === 'sparks') sparks.material.uniforms.uOpacity.value = v;
      if (k === 'height') flame.scale.setScalar(v);
    },
    ...measureFx(g),
  };
}

/* ============================================================ torchlight ==
   kind × mount × flame × housing × soot × halo × wicks = 4·4·3·3·2·3·3 = 2,592 */
export const TORCH_AXES = { kind: 4, mount: 4, flame: 3, housing: 3, soot: 2, halo: 3, wicks: 3 };

export function torchlight(variant = 0, opts = {}) {
  const A = axesOf(variant, TORCH_AXES);
  const rand = rnd(0x707 + variant * 4409);
  const g = new THREE.Group();
  g.name = 'vfx-torchlight';
  const scale = opts.scale || 1;
  const KIND = ['torch', 'lantern', 'candle', 'brazier-cup'][A.kind];
  const size = [1, 0.72, 0.42, 1.25][A.kind] * scale;
  const FL = [
    { id: 'guttering', v: 1.6, sway: 2.2, g: 1.05 },
    { id: 'steady', v: 0.85, sway: 0.6, g: 1.3 },
    { id: 'wind-whipped', v: 2.2, sway: 3.4, g: 1.5 },
  ][A.flame];
  const wicks = A.wicks + 1;
  const y0 = 0.9 * size;

  /* Mount */
  const metal = A.soot ? MAT.blackIron : MAT.warmBrass;
  if (A.mount === 0) {
    g.add(part(cyl(0.022 * size, 0.026 * size, y0, 7), MAT.weatheredTimber, 'haft', { pos: [0, y0 / 2, 0] }));
    for (let i = 0; i < cnt(4); i++) g.add(part(torus(0.035 * size, 0.007 * size, 4, 10), metal, 'ferrule-' + i, { pos: [0, y0 * (0.72 + i * 0.06), 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.mount === 1) {
    g.add(part(new THREE.BoxGeometry(0.2 * size, 0.28 * size, 0.05 * size), metal, 'wall-plate', { pos: [0, y0, -0.16 * size] }));
    g.add(part(cyl(0.018 * size, 0.022 * size, 0.34 * size, 6), metal, 'bracket', { pos: [0, y0 + 0.02 * size, -0.02 * size], rot: [rad(70), 0, 0] }));
  } else if (A.mount === 2) {
    g.add(part(cyl(0.05 * size, 0.075 * size, y0 * 1.5, 8), MAT.weatheredTimber, 'post', { pos: [0, y0 * 0.75, 0] }));
    g.add(part(torus(0.09 * size, 0.012 * size, 5, 12), metal, 'post-band', { pos: [0, y0 * 1.4, 0], rot: [Math.PI / 2, 0, 0] }));
  } else {
    g.add(part(lathe([[0.18 * size, 0], [0.19 * size, 0.03 * size], [0.06 * size, 0.09 * size], [0.05 * size, y0 * 0.9]], 14), metal, 'floor-stand'));
  }
  const topY = A.mount === 2 ? y0 * 1.5 : A.mount === 1 ? y0 + 0.16 * size : y0;

  /* Housing */
  if (A.kind === 1 || A.housing === 1) {
    const glass = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#6f8f9b'), roughness: 0.24, metalness: 0.02,
      transparent: true, opacity: 0.3,
    });
    glass.name = 'lantern-glass';
    const gm = part(lathe([[0.085 * size, 0], [0.1 * size, 0.07 * size], [0.1 * size, 0.24 * size], [0.06 * size, 0.3 * size]], 14), glass, 'glass-shade', { pos: [0, topY, 0] });
    gm.userData.noShadow = true;
    g.add(gm);
    g.add(part(lathe([[0.07 * size, 0], [0.11 * size, 0.02 * size], [0.09 * size, 0.05 * size]], 12), metal, 'shade-collar', { pos: [0, topY + 0.3 * size, 0] }));
  } else if (A.housing === 2) {
    for (let i = 0; i < cnt(6); i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(part(new THREE.BoxGeometry(0.008 * size, 0.3 * size, 0.008 * size), metal, 'cage-rib-' + i,
        { pos: [Math.cos(a) * 0.1 * size, topY + 0.15 * size, Math.sin(a) * 0.1 * size] }));
    }
    g.add(part(torus(0.1 * size, 0.008 * size, 4, 14), metal, 'cage-hoop', { pos: [0, topY + 0.3 * size, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.kind === 3) g.add(part(lathe([[0.16 * size, 0], [0.18 * size, 0.08 * size], [0.11 * size, 0.11 * size]], 14), metal, 'fire-cup', { pos: [0, topY, 0] }));
  if (A.kind === 2) g.add(part(cyl(0.028 * size, 0.034 * size, 0.22 * size, 8), MAT.boneLinen, 'tallow', { pos: [0, topY + 0.11 * size, 0] }));

  /* Flames — one per wick, offset so they do not sync. */
  const flames = [];
  const fy = topY + (A.kind === 2 ? 0.22 : A.kind === 3 ? 0.08 : 0.02) * size;
  for (let i = 0; i < wicks; i++) {
    const a = wicks === 1 ? 0 : (i / wicks) * Math.PI * 2;
    const off = wicks === 1 ? 0 : 0.055 * size;
    const f = flameColumn({
      shells: 3, height: (A.kind === 2 ? 0.12 : 0.3) * size, radius: (A.kind === 2 ? 0.022 : 0.06) * size,
      ramp: ['whiteHot', 'goldBright', 'flame', 'ember'], vigour: FL.v, gain: FL.g,
      rise: 1.5, seed: variant + i * 3 + 1, detail: 3.4, sway: FL.sway, squash: 0.42, core: A.kind !== 2,
    });
    f.position.set(Math.cos(a) * off, fy, Math.sin(a) * off);
    g.add(f);
    flames.push(f);
  }

  /* Halo — the sprite that makes a small flame read as a light source. */
  if (A.halo > 0) {
    const hm = new THREE.SpriteMaterial({
      map: vfxTexture('glow'), color: pal('flame'), transparent: true,
      opacity: [0, 0.42, 0.68][A.halo], blending: THREE.AdditiveBlending, depthWrite: false,
    });
    hm.name = 'torch-halo';
    const sp = new THREE.Sprite(hm);
    sp.name = 'halo';
    sp.scale.setScalar([0, 0.9, 1.9][A.halo] * size);
    sp.position.y = fy + 0.1 * size;
    g.add(sp);
  }

  const emb = embers({
    count: A.kind === 2 ? 6 : 14, size: 0.02 * size, life: 1.8, rise: size * 1.6,
    spread: 0.06 * size, y0: fy, gain: 3, rand, name: 'torch-embers',
  });
  g.add(emb);
  if (A.soot) {
    for (let i = 0; i < cnt(4); i++) {
      const s = ico(0.02 * size + rand() * 0.012 * size, 0);
      s.scale(1.3, 0.5, 1.2);
      g.add(part(s, MAT.ash, 'soot-' + i, { pos: [(rand() - 0.5) * 0.14 * size, topY - rand() * 0.2 * size, (rand() - 0.5) * 0.14 * size] }));
    }
  }
  g.add(lightPool({ radius: 1.6 * size, color: 'ember', gain: 0.4, phase: variant * 2.2, y: 0.03 }));

  let light = null;
  if (opts.light !== false) {
    light = new THREE.PointLight(0xffa552, 2.6 * size * wicks * (opts.lightScale || 1), 7 * size, 2);
    light.position.y = fy + 0.1 * size;
    light.name = 'practical';
    g.add(light);
  }
  const phase = variant * 1.9;
  const baseI = light ? light.intensity : 0;
  return {
    group: g,
    declared: { kind: KIND, mount: ['hand-haft', 'wall', 'post', 'floor'][A.mount], flame: FL.id, housing: ['bare', 'glazed', 'caged'][A.housing], soot: !!A.soot, halo: ['none', 'tight', 'wide'][A.halo], wicks },
    update(t) { if (light) light.intensity = baseI * flicker(t, phase, A.flame === 0 ? 1.8 : 1); },
    set(k, v) {
      if (k === 'flame') flames.forEach((f) => f.traverse((n) => { if (n.material && n.material.uniforms && n.material.uniforms.uVigour) n.material.uniforms.uVigour.value = v; }));
      if (k === 'halo' && light) light.intensity = baseI * v;
    },
    ...measureFx(g),
  };
}

/* =============================================================== fallout ==
   What a fire leaves in the air. kind × density × drift × size × life ×
   ignition × turbulence = 3·4·4·3·3·3·2 = 2,592 */
export const FALLOUT_AXES = { kind: 3, density: 4, drift: 4, size: 3, life: 3, ignition: 3, turbulence: 2 };

export function fallout(variant = 0, opts = {}) {
  const A = axesOf(variant, FALLOUT_AXES);
  const rand = rnd(0xfa1 + variant * 3313);
  const g = new THREE.Group();
  g.name = 'vfx-fallout';
  const R = opts.extent || 14;
  const N = [90, 240, 520, 900][A.density];
  const SZ = [0.03, 0.055, 0.09][A.size];
  const LIFE = [3.5, 7, 12][A.life];
  const IG = [
    { colA: 'ash', colB: 'smoke', gain: 0.9, tex: 'smoke' },
    { colA: 'ember', colB: 'coal', gain: 2.2, tex: 'glow' },
    { colA: 'whiteHot', colB: 'ember', gain: 4, tex: 'spark' },
  ][A.ignition];
  const drift = [0.2, 0.6, 1.3, 2.4][A.drift];
  const turb = A.turbulence ? 1.8 : 0.6;

  const rise = A.kind === 0;
  const mixed = A.kind === 2;
  const pts = gpuPoints({
    name: 'fallout', count: N, size: SZ, life: LIFE, texture: IG.tex,
    colA: IG.colA, colB: IG.colB, gain: IG.gain, opacity: A.ignition === 0 ? 0.5 : 0.85,
    rand, radius: R * 1.6, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * R * 2, rise ? 0.2 : R * 0.9, (r() - 0.5) * R * 2],
    p1: R, p2: drift, p3: turb, p4: mixed ? 1 : 0,
    motion: `vec3(
        (sin(s.z * 6.28 + uTime * 0.6 * uP.z + life * 2.2) * 0.5 + uWindDir.x * uWind * 0.9) * uP.y * life * uP.x * 0.35,
        ${rise ? 'life * uP.x * 0.7 * (0.4 + s.w)'
      : mixed ? '(s.w > 0.5 ? life * uP.x * 0.6 : -life * uP.x * 0.55) * (0.5 + s.x)'
        : '-life * uP.x * (0.35 + s.w * 0.5)'},
        (cos(s.y * 6.28 + uTime * 0.55 * uP.z + life * 2.0) * 0.5 + uWindDir.y * uWind * 0.9) * uP.y * life * uP.x * 0.35)`,
    sizeCurve: `(0.5 + s.z) * (1.0 - life * ${A.ignition === 0 ? '0.2' : '0.5'})`,
    alpha: `sin(life * 3.14159) * (0.4 + s.x * 0.6)`,
    colorT: `pow(life, 0.8)`,
  });
  g.add(pts);

  return {
    group: g,
    declared: { kind: ['rising ember', 'falling ash', 'mixed'][A.kind], density: N, drift: drift.toFixed(1), size: SZ, life: LIFE, ignition: ['cold', 'glowing', 'hot'][A.ignition], turbulence: A.turbulence ? 'gusty' : 'calm' },
    update() {},
    set(k, v) {
      if (k === 'density') pts.material.uniforms.uOpacity.value = v;
      if (k === 'size') pts.material.uniforms.uSize.value = SZ * v;
      if (k === 'drift') pts.material.uniforms.uP.value.y = drift * v;
    },
    ...measureFx(g),
  };
}

export const FIRE_FAMILIES = [
  {
    id: 'hm.vfx.bonfire', name: 'Bonfire and brazier', group: 'fire', axes: BONFIRE_AXES, build: bonfire,
    stage: 'ground', prior: 'hm-world.js makeFire()',
    hero: { fuel: 1, mass: 2, vigour: 2, tongues: 2, plume: 2, base: 1, spit: 1 },
    params: [
      { key: 'vigour', label: 'Vigour', min: 0.2, max: 2.6, step: 0.05, value: 1 },
      { key: 'height', label: 'Flame height', min: 0.4, max: 2.2, step: 0.05, value: 1 },
      { key: 'embers', label: 'Ember density', min: 0, max: 2, step: 0.05, value: 1 },
    ],
    note: 'Four fuels, and each changes flame shape, ember rate and plume as well as colour. Relic-ash burns bell-coloured and cold — the foundry fiction, not a recolour.',
  },
  {
    id: 'hm.vfx.forge', name: 'Forge fire and molten slag', group: 'fire', axes: FORGE_AXES, build: forgeFire,
    stage: 'ground', prior: null,
    hero: { bed: 2, blast: 2, slag: 2, spark: 1, vessel: 2, quench: 1, pour: 1 },
    params: [
      { key: 'blast', label: 'Blast', min: 0.2, max: 3.4, step: 0.05, value: 1.6 },
      { key: 'sparks', label: 'Iron sparks', min: 0, max: 1.6, step: 0.05, value: 1 },
      { key: 'height', label: 'Flame height', min: 0.4, max: 2, step: 0.05, value: 1 },
    ],
    note: 'Slag reuses the waterfall sheet at the opposite temperature. cinderward declares ember_iron_spark and slag_drip_glow; this builds both.',
  },
  {
    id: 'hm.vfx.torchlight', name: 'Torch, lantern, candle', group: 'fire', axes: TORCH_AXES, build: torchlight,
    stage: 'ground', prior: null,
    hero: { kind: 0, mount: 2, flame: 0, housing: 2, soot: 1, halo: 2, wicks: 0 },
    params: [
      { key: 'flame', label: 'Flame', min: 0.3, max: 3, step: 0.05, value: 1 },
      { key: 'halo', label: 'Light reach', min: 0.2, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'The practicals. banked_braziers is the region\u2019s declared practical source, so these are the lights the player actually walks between.',
  },
  {
    id: 'hm.vfx.fallout', name: 'Embers, sparks and ash fall', group: 'fire', axes: FALLOUT_AXES, build: fallout,
    stage: 'ground', prior: null,
    hero: { kind: 2, density: 2, drift: 2, size: 1, life: 1, ignition: 1, turbulence: 1 },
    params: [
      { key: 'density', label: 'Density', min: 0, max: 1.6, step: 0.05, value: 1 },
      { key: 'size', label: 'Mote size', min: 0.3, max: 3, step: 0.05, value: 1 },
      { key: 'drift', label: 'Drift', min: 0, max: 3, step: 0.05, value: 1 },
    ],
    note: 'The volume effect: what hangs in the air after Cinderward burned. Rising ember, falling ash, or both at once.',
  },
];
