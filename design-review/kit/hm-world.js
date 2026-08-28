/* Living-world scatter: instancing, motion, and the cheap clutter tier.
 *
 * A 100,000-object world is not 100,000 assets. It is a few hundred unique
 * assets instanced with per-instance variation, and the arithmetic only
 * closes if the great majority of those instances are very cheap. This module
 * is the machinery for that: merge a built Group down to one geometry per
 * material, instance it, and drive motion from the vertex shader so the CPU
 * cost of 100k swaying objects is zero.
 *
 * Budget ceilings this is measured against, from src/data/worldAssets.js
 * WORLD_ASSET_BUDGETS: activeParticles 2400, dynamicLightsVisible 18.
 */
import * as THREE from 'three';
import { MAT, rnd, jitter, part, seat, ico, cone, cyl } from './hm-core.js';

/* ---------------------------------------------------------------- merging */

/** Flatten a built Group into one BufferGeometry per material, with each
 *  mesh's own transform baked in. Written by hand because BufferGeometryUtils
 *  is outside the pinned three.js import set. */
export function mergeByMaterial(group) {
  group.updateMatrixWorld(true);
  const buckets = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
  });
  const out = [];
  for (const [material, geos] of buckets) {
    let n = 0;
    for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    const uv = new Float32Array(n * 2);
    let o3 = 0, o2 = 0;
    for (const g of geos) {
      const p = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
      pos.set(p.array.subarray(0, p.count * 3), o3);
      if (na) nor.set(na.array.subarray(0, p.count * 3), o3);
      if (ua) uv.set(ua.array.subarray(0, p.count * 2), o2);
      o3 += p.count * 3;
      o2 += p.count * 2;
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingSphere();
    out.push({ material, geometry: merged });
  }
  return out;
}

export const geoTris = (g) => g.attributes.position.count / 3;

/* ------------------------------------------------------------------- wind
 * One uniform block, shared by every windy material. Motion is authored in
 * the vertex shader against the vertex's own height, with a per-instance
 * phase read out of instanceMatrix — so ten thousand trees never sway in
 * unison and the CPU does no work at all. */
export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uGust: { value: 0 },
};

/** Return a windy clone of a material. `flexH` is the height at which the
 *  asset reaches full sway; `amp` scales it (a reed whips, a trunk does not). */
export function windify(mat, flexH, amp, name) {
  const m = mat.clone();
  m.name = (name || mat.name) + '-wind';
  m.userData.wind = true;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.uniforms.uGust = windUniforms.uGust;
    shader.uniforms.uFlexH = { value: flexH };
    shader.uniforms.uAmp = { value: amp };
    shader.vertexShader =
      'uniform float uTime;\nuniform float uWind;\nuniform float uGust;\n' +
      'uniform float uFlexH;\nuniform float uAmp;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 iOrigin = vec3(instanceMatrix[3].x, instanceMatrix[3].y, instanceMatrix[3].z);
        #else
          vec3 iOrigin = vec3(0.0);
        #endif
        // Per-instance phase from world position: no two neighbours agree.
        float ph = iOrigin.x * 0.41 + iOrigin.z * 0.67;
        // Flex rises with the square of height — the base stays planted.
        float flex = clamp(transformed.y / max(uFlexH, 0.001), 0.0, 1.0);
        float bend = flex * flex * uAmp * uWind;
        // A travelling gust front, so wind crosses the world rather than
        // pulsing everywhere at once.
        float front = sin(uTime * 0.35 - iOrigin.x * 0.045 - iOrigin.z * 0.03);
        float gust = 1.0 + uGust * max(front, 0.0) * 1.9;
        float t = uTime * 1.15 + ph;
        transformed.x += (sin(t) * 0.62 + sin(t * 2.31 + 1.7) * 0.31) * bend * gust;
        transformed.z += (cos(t * 0.83 + 0.5) * 0.48 + sin(t * 1.9) * 0.2) * bend * gust * 0.8;
        // High-frequency flutter, only where the mass is (needles, blades).
        transformed.y -= abs(sin(t * 3.3 + transformed.x * 1.7)) * bend * 0.05;`
      );
  };
  return m;
}

/* ------------------------------------------------------------------ water
 * Two crossing wave trains on the vertices plus a slow UV drift, with a
 * flow direction so a channel runs and a pool only breathes. */
export const waterUniforms = { uTime: { value: 0 } };

export function flowWater(color, flow, amp, rough) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: rough, metalness: 0.14,
    transparent: true, opacity: 0.93,
  });
  m.name = 'flowing-water';
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.uniforms.uFlow = { value: new THREE.Vector2(flow[0], flow[1]) };
    shader.uniforms.uAmp = { value: amp };
    shader.vertexShader =
      'uniform float uTime;\nuniform vec2 uFlow;\nuniform float uAmp;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float d = dot(transformed.xz, normalize(uFlow + vec2(0.0001)));
        // Downstream train, plus a slower cross train so it is not a ripple
        // machine. Both scale with uAmp: a channel moves, a pool barely does.
        float w1 = sin(d * 2.7 - uTime * 2.3 * length(uFlow));
        float w2 = sin(transformed.x * 1.3 + transformed.z * 1.9 - uTime * 0.9);
        transformed.y += (w1 * 0.62 + w2 * 0.38) * uAmp;
        // Tilt the normal with the slope of the wave so light actually moves.
        objectNormal = normalize(objectNormal + vec3(
          -cos(d * 2.7 - uTime * 2.3 * length(uFlow)) * uAmp * 2.4, 0.0,
          -cos(transformed.x * 1.3 + transformed.z * 1.9 - uTime * 0.9) * uAmp * 1.6));
        vNormal = normalize(normalMatrix * objectNormal);`
      );
  };
  return m;
}

/* ------------------------------------------------------------------- fire
 * Layered emissive shells that scroll and pinch, a flickering light, and
 * ember points. Not a particle system pretending to be fire — a shaped
 * flame body, which is what actually reads at distance. */
export const fireUniforms = { uTime: { value: 0 } };

function flameMaterial(color, seedPhase) {
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color), transparent: true, opacity: 0.62,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  m.name = 'flame-shell';
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = fireUniforms.uTime;
    shader.uniforms.uPhase = { value: seedPhase };
    shader.vertexShader =
      'uniform float uTime;\nuniform float uPhase;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float t = uTime * 3.4 + uPhase;
        float h = clamp(transformed.y / 0.55, 0.0, 1.0);
        // Flames narrow and wander as they rise, and lick sideways at the tip.
        transformed.xz *= 1.0 - h * 0.62;
        transformed.x += sin(t + h * 5.2) * h * h * 0.13;
        transformed.z += cos(t * 1.27 + h * 4.4) * h * h * 0.11;
        transformed.y *= 0.82 + abs(sin(t * 0.9 + uPhase)) * 0.4;`
      );
  };
  return m;
}

/** A brazier fire: three nested flame shells, a core, embers, and a light.
 *  Returns { group, light, embers } so the caller can flicker it. */
export function makeFire(scale = 1, seed = 1) {
  const g = new THREE.Group();
  g.name = 'fire';
  const cols = ['#ffb257', '#e8722c', '#a83714'];
  cols.forEach((c, i) => {
    const shell = cone(0.3 - i * 0.06, 0.9 - i * 0.12, 7, 4);
    const m = new THREE.Mesh(shell, flameMaterial(c, seed * 2.3 + i * 1.9));
    m.name = 'flame-' + i;
    m.position.y = (0.9 - i * 0.12) / 2;
    m.scale.setScalar(scale);
    g.add(m);
  });
  // Hot core, small and bright.
  const core = new THREE.Mesh(ico(0.13 * scale, 1), flameMaterial('#ffe3a8', seed * 5.1));
  core.name = 'flame-core';
  core.position.y = 0.14 * scale;
  g.add(core);

  // Embers: a Points cloud rising and dying. Counted against the declared
  // activeParticles budget of 2400 for the whole visible set.
  const N = 26;
  const pos = new Float32Array(N * 3);
  const seedArr = new Float32Array(N);
  const rand = rnd(0x3b1 + seed * 977);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rand() - 0.5) * 0.34 * scale;
    pos[i * 3 + 1] = rand() * 1.6 * scale;
    pos[i * 3 + 2] = (rand() - 0.5) * 0.34 * scale;
    seedArr[i] = rand();
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const em = new THREE.PointsMaterial({
    color: new THREE.Color('#e8863c'), size: 0.055 * scale, transparent: true,
    opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  em.name = 'ember';
  const embers = new THREE.Points(eg, em);
  embers.name = 'embers';
  embers.userData = { seedArr, scale, base: pos.slice(0) };
  g.add(embers);

  const light = new THREE.PointLight(0xff8b3d, 5.5 * scale, 13 * scale, 2);
  light.position.y = 0.55 * scale;
  light.name = 'fire-light';
  g.add(light);

  return { group: g, light, embers, particles: N };
}

/** Advance every fire in the scene: flicker the light, rise the embers. */
export function stepFires(fires, t) {
  for (const f of fires) {
    // Two incommensurate sines plus a fast term — reads as combustion, not
    // as a sine wave.
    const fl = 0.72 + Math.sin(t * 11.3 + f.phase) * 0.13 + Math.sin(t * 27.7 + f.phase * 2.1) * 0.09;
    f.light.intensity = f.baseIntensity * fl;
    const u = f.embers.userData;
    const p = f.embers.geometry.attributes.position;
    for (let i = 0; i < u.seedArr.length; i++) {
      const life = (t * (0.5 + u.seedArr[i] * 0.6) + u.seedArr[i] * 3.1) % 1;
      p.array[i * 3 + 1] = life * 2.1 * u.scale;
      p.array[i * 3] = u.base[i * 3] + Math.sin(t * 2 + i) * life * 0.28 * u.scale;
      p.array[i * 3 + 2] = u.base[i * 3 + 2] + Math.cos(t * 1.7 + i) * life * 0.28 * u.scale;
    }
    p.needsUpdate = true;
  }
}

/* ----------------------------------------------------- the clutter tier
 * The three assets that make 100,000 objects arithmetically possible. Each
 * is deliberately tiny: a pebble is 20 triangles, a grass tuft is 24. At
 * these costs 70,000 instances is under two million triangles, which a GPU
 * eats. At foliage cost it would be forty million, which it does not. */

export function pebble() {
  const rand = rnd(0x9eb1);
  const g = new THREE.Group();
  g.name = 'pebble';
  const b = ico(0.075, 0);
  b.scale(1.3, 0.62, 1.05);
  jitter(b, 0.022, rand);
  g.add(part(b, MAT.wetSlate, 'pebble-body'));
  return g;
}

export function twig() {
  const rand = rnd(0x7167);
  const g = new THREE.Group();
  g.name = 'twig';
  g.add(part(cyl(0.008, 0.014, 0.34, 4, 1, true), MAT.pineBark, 'twig-stem', { rot: [0, 0, 1.45] }));
  g.add(part(cyl(0.005, 0.009, 0.16, 4, 1, true), MAT.pineBark, 'twig-fork', { pos: [0.1, 0.03, 0.03], rot: [0, 0.6, 1.1] }));
  return g;
}

export function grassTuft() {
  const rand = rnd(0x6a55);
  const g = new THREE.Group();
  g.name = 'grass-tuft';
  // Three crossed blades. Twenty-four triangles for something that has to
  // exist thirty thousand times.
  for (let i = 0; i < 3; i++) {
    const bl = new THREE.PlaneGeometry(0.075, 0.3, 1, 2);
    const p = bl.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const t = (p.getY(v) + 0.15) / 0.3;
      p.setX(v, p.getX(v) * (1 - t * 0.8));
      p.setZ(v, t * t * 0.09);
    }
    p.needsUpdate = true;
    bl.computeVertexNormals();
    g.add(part(bl, MAT.reedPale, 'blade-' + i, { pos: [0, 0.15, 0], rot: [0, (i / 3) * Math.PI * 2 + rand(), 0] }));
  }
  return g;
}

export function rubbleChunk() {
  const rand = rnd(0x4bb1);
  const g = new THREE.Group();
  g.name = 'rubble-chunk';
  const b = new THREE.BoxGeometry(0.26, 0.17, 0.21);
  jitter(b, 0.05, rand);
  g.add(part(b, MAT.slateDry, 'chunk', { pos: [0, 0.085, 0] }));
  return g;
}
