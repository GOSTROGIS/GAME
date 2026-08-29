/* The veil — marsh light, hexcraft, steam, and frost.
 *
 * These four are the Reach's supernatural and industrial glows, and they are
 * the families most at risk of becoming AI-slop neon. Three rules keep them
 * inside the system:
 *
 *   1. NO NEW HUES. Marsh light is --moss driven past 1.0. Hexcraft is
 *      --focus and --bone-bright. Frost is --focus at bone luminance. The
 *      brightness is HDR headroom for the bloom pass, not a saturation
 *      change — which is exactly why these read as light rather than as
 *      coloured plastic.
 *   2. LIGHT NEEDS A FALLOFF. The finding recorded in hm-fauna.js: a faceted
 *      mesh with additive blending reads as a grey crystal, not as a glow. So
 *      every emitter here is a soft sprite or a shader with a real radial
 *      curve, and geometry is only ever the *body* holding the light.
 *   3. A GLOW MUST TOUCH SOMETHING. Every family puts a light pool on the
 *      ground under it. An emitter floating in unlit air is the single
 *      clearest tell of a pasted-on effect.
 *
 * Steam lives here rather than in the fire kit because in Cinderward it is
 * an industrial output, not combustion: hm-steam.js already builds the vents,
 * gauges and stacks, and this is what comes out of them.
 */
import * as THREE from 'three';
import { MAT, rnd, part, ico, cyl, lathe, torus, jitter, cnt } from '../../world/hearthmere/hm-core.js';
import {
  VFX_ENV, pal, gpuPoints, softVolume, lightPool, vfxTexture,
  axesOf, measureFx, flicker, NOISE_GLSL, FOG_GLSL,
} from './hm-vfx.js';

/* A soft emitter: sprite core plus a wider halo. Two sprites, because one
   sprite at any size is either a hard dot or a formless smudge. */
function emitter(o) {
  const g = new THREE.Group();
  g.name = o.name || 'emitter';
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vfxTexture('glow'), color: pal(o.core || 'bone'),
    transparent: true, opacity: o.coreOpacity != null ? o.coreOpacity : 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  core.material.name = 'emitter-core';
  core.name = 'core';
  core.scale.setScalar(o.size || 0.3);
  g.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: vfxTexture('glow'), color: pal(o.halo || 'moss'),
    transparent: true, opacity: o.haloOpacity != null ? o.haloOpacity : 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.material.name = 'emitter-halo';
  halo.name = 'halo';
  halo.scale.setScalar((o.size || 0.3) * (o.haloScale || 4.5));
  g.add(halo);
  g.userData.core = core;
  g.userData.halo = halo;
  return g;
}

/* ============================================================ marshLight ==
   count × path × pulse × halo × tail × height × pair
   = 4 · 4 · 3 · 3 · 3 · 3 · 2 = 2,592 */
export const MARSHLIGHT_AXES = { count: 4, path: 4, pulse: 3, halo: 3, tail: 3, height: 3, pair: 2 };
const PATH = [
  { id: 'drift', sp: 0.12, amp: 2.4, dart: 0 },
  { id: 'patrol', sp: 0.3, amp: 5.5, dart: 0 },
  { id: 'circle', sp: 0.45, amp: 2.0, dart: 0 },
  { id: 'darting', sp: 0.6, amp: 3.2, dart: 1 },
];
const PULSE = [
  { id: 'steady', d: 0.12, r: 1.1 },
  { id: 'breathing', d: 0.45, r: 0.7 },
  { id: 'guttering', d: 0.8, r: 3.3 },
];

export function marshLight(variant = 0, opts = {}) {
  const A = axesOf(variant, MARSHLIGHT_AXES);
  const P = PATH[A.path], U = PULSE[A.pulse];
  const rand = rnd(0x11f + variant * 7481);
  const g = new THREE.Group();
  g.name = 'vfx-marsh-light';
  const scale = opts.scale || 1;
  const N = [1, 3, 6, 11][A.count] * (A.pair ? 2 : 1);
  const R = (opts.extent || 7) * scale;
  const hi = [0.5, 1.3, 2.6][A.height] * scale;
  const size = 0.22 * scale;

  /* --- the wisps. Each is a body + a trail, on its own path, and the paths
     are incommensurate so a group never reads as a formation. */
  const wisps = [];
  for (let i = 0; i < N; i++) {
    const w = emitter({
      name: 'wisp-' + i, size, core: 'bone', halo: 'wisp',
      coreOpacity: 0.9, haloOpacity: [0.22, 0.42, 0.7][A.halo],
      haloScale: [3, 5, 8][A.halo],
    });
    const a0 = rand() * Math.PI * 2;
    const d0 = R * (0.25 + rand() * 0.7);
    w.userData.seed = {
      a0, d0, y0: hi * (0.4 + rand() * 0.8),
      sp: P.sp * (0.7 + rand() * 0.7),
      ph: rand() * 6.28,
      // A pair shares a centre and orbits it — two lights that belong together.
      pairIdx: A.pair ? (i % 2) : 0,
      pairA: rand() * 6.28,
    };
    w.position.set(Math.cos(a0) * d0, w.userData.seed.y0, Math.sin(a0) * d0);
    g.add(w);
    wisps.push(w);

    /* Tail: motes shed behind the wisp. Parented to the wisp so the trail
       follows it without any per-frame position bookkeeping. */
    if (A.tail > 0) {
      const tail = gpuPoints({
        name: 'wisp-tail-' + i, count: [0, 14, 34][A.tail], size: size * 0.4,
        life: 1.8 + A.tail * 0.6, texture: 'glow',
        colA: 'wisp', colB: 'moss', gain: 2.1, opacity: 0.5, rand,
        radius: 2, cull: false,
        spawn: () => [0, 0, 0],
        p1: 0.5,
        motion: `vec3((s.x - 0.5) * life * uP.x, (s.y - 0.4) * life * uP.x * 0.7, (s.z - 0.5) * life * uP.x)`,
        sizeCurve: `(1.0 - life * 0.7) * (0.5 + s.z)`,
        alpha: `pow(1.0 - life, 1.4)`,
        colorT: `life`,
      });
      w.add(tail);
    }
  }

  /* --- one real light for the brightest wisp, if the budget allows. The
     others get the ground pool, which is where the reading comes from. */
  let light = null;
  if (opts.light !== false && N > 0) {
    light = new THREE.PointLight(0x8fc2ae, 2.4 * scale, 8 * scale, 2);
    light.name = 'wisp-light';
    wisps[0].add(light);
  }
  const pool = lightPool({
    radius: R * 0.9, color: 'moss', gain: 0.14 + N * 0.012, flicker: 0.1, y: 0.03,
  });
  g.add(pool);

  const cores = wisps.map((w) => w.userData.core.material);
  const halos = wisps.map((w) => w.userData.halo.material);
  const baseHalo = [0.22, 0.42, 0.7][A.halo];
  return {
    group: g,
    declared: {
      count: N, path: P.id, pulse: U.id,
      halo: ['tight', 'standard', 'wide'][A.halo],
      tail: ['none', 'short', 'long'][A.tail],
      height: ['ankle', 'chest', 'overhead'][A.height],
      pair: A.pair ? 'paired' : 'solitary',
    },
    update(t) {
      for (let i = 0; i < wisps.length; i++) {
        const w = wisps[i], s = w.userData.seed;
        let x, z, y;
        if (P.id === 'circle') {
          const a = s.a0 + t * s.sp;
          x = Math.cos(a) * s.d0; z = Math.sin(a) * s.d0;
        } else {
          // Two slow incommensurate sines: a wander, not a lissajous figure.
          x = Math.cos(s.a0) * s.d0 + Math.sin(t * s.sp + s.ph) * P.amp
            + Math.sin(t * s.sp * 0.41 + s.ph * 2) * P.amp * 0.5;
          z = Math.sin(s.a0) * s.d0 + Math.cos(t * s.sp * 0.83 + s.ph) * P.amp
            + Math.cos(t * s.sp * 0.37 + s.ph * 1.7) * P.amp * 0.5;
        }
        y = s.y0 + Math.sin(t * s.sp * 1.7 + s.ph) * hi * 0.28;
        if (P.dart) {
          // Darting: a hold, then a fast reposition. Behaviour, not speed.
          const k = Math.pow(Math.max(0, Math.sin(t * 0.7 + s.ph)), 6);
          x += Math.sin(s.ph * 3.1) * P.amp * 1.6 * k;
          z += Math.cos(s.ph * 2.7) * P.amp * 1.6 * k;
        }
        if (A.pair) {
          const pa = t * 0.9 + s.pairA + s.pairIdx * Math.PI;
          x += Math.cos(pa) * 0.5 * scale;
          z += Math.sin(pa) * 0.5 * scale;
          y += Math.sin(pa) * 0.2 * scale;
        }
        w.position.set(x, y, z);
        // The pulse. A guttering wisp genuinely goes out and comes back.
        const f = 0.55 + Math.sin(t * U.r + s.ph) * U.d + Math.sin(t * U.r * 2.7 + s.ph * 2) * U.d * 0.4;
        const k = Math.max(0.02, f);
        cores[i].opacity = 0.9 * k;
        halos[i].opacity = baseHalo * k;
        w.userData.core.scale.setScalar(size * (0.8 + k * 0.5));
      }
      if (light) light.intensity = 2.4 * scale * flicker(t, 0.4, 0.8) * (A.pulse === 2 ? 0.6 : 1);
    },
    set(k, v) {
      if (k === 'glow') { halos.forEach((m) => { m.opacity = baseHalo * v; }); pool.material.uniforms.uGain.value = (0.14 + N * 0.012) * v; }
      if (k === 'size') wisps.forEach((w) => w.userData.halo.scale.setScalar(size * [3, 5, 8][A.halo] * v));
      if (k === 'reach' && light) light.distance = 8 * scale * v;
    },
    ...measureFx(g),
  };
}

/* =========================================================== aetherGlow ==
   form × glyph × orbit × pulse × tendril × ground × collapse
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592
   hollow_abbey declares memory_glyph_drift as a vfx row; this builds it. */
export const AETHERGLOW_AXES = { form: 4, glyph: 3, orbit: 4, pulse: 3, tendril: 3, ground: 3, collapse: 2 };

export function aetherGlow(variant = 0, opts = {}) {
  const A = axesOf(variant, AETHERGLOW_AXES);
  const rand = rnd(0xae7 + variant * 6883);
  const g = new THREE.Group();
  g.name = 'vfx-aether-glow';
  const scale = opts.scale || 1;
  const R = 0.75 * scale;
  const FORM = ['sphere', 'ring', 'column', 'rift'][A.form];

  /* --- the body. Four genuinely different silhouettes, each holding light
     rather than emitting it directly. */
  const body = new THREE.Group();
  body.name = 'aether-body';
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uCore: { value: pal('bone') }, uEdge: { value: pal('focus') },
      uGain: { value: 1.15 }, uPhase: { value: variant * 1.7 },
      uPulse: { value: 1 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uPhase;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vFog;
      void main(){
        vUv = uv;
        vec3 p = position;
        // Breathing along the normal: the body is a field, not a shell.
        p += normal * sin(uTime * 1.3 + uPhase + position.y * 3.0) * 0.03;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime, uGain, uIntensity, uPhase, uPulse, uNight;
      uniform vec3 uCore, uEdge;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vFog;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      void main(){
        // Rim-only, and TIGHT: the silhouette is where a field is dense
        // enough to see. A soft rim over a whole torus is just a white donut.
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.2);
        float n = fbm2(vec3(vUv * 5.0, uTime * 0.4 + uPhase));
        float a = rim * (0.45 + n * 0.7) * uPulse;
        vec3 c = mix(uEdge, uCore, rim * 0.8 + n * 0.2);
        gl_FragColor = vec4(c * uGain * uIntensity * (1.0 + uNight * 0.4), a * (1.0 - fogFactor(vFog)));
        if (gl_FragColor.a < 0.004) discard;
      }`,
  });
  bodyMat.name = 'aether-body';
  if (A.form === 0) {
    body.add(part(new THREE.SphereGeometry(R, cnt(20), cnt(14)), bodyMat, 'aether-sphere', { pos: [0, R * 1.4, 0] }));
  } else if (A.form === 1) {
    body.add(part(torus(R, R * 0.2, 9, cnt(28)), bodyMat, 'aether-ring', { pos: [0, R * 1.6, 0], rot: [0.34, 0, 0] }));
  } else if (A.form === 2) {
    body.add(part(cyl(R * 0.5, R * 0.7, R * 4, cnt(16), 3, true), bodyMat, 'aether-column', { pos: [0, R * 2, 0] }));
  } else {
    // A rift: two nearly-coplanar sheets, so it reads as a tear in space.
    for (let i = 0; i < 2; i++) {
      const sheet = new THREE.PlaneGeometry(R * 0.5, R * 3.4, cnt(4), cnt(16));
      const sp = sheet.attributes.position;
      for (let v = 0; v < sp.count; v++) {
        const t = sp.getY(v) / (R * 1.7);
        sp.setX(v, sp.getX(v) * (1 - t * t * 0.85));
      }
      sp.needsUpdate = true;
      sheet.computeVertexNormals();
      body.add(part(sheet, bodyMat, 'rift-sheet-' + i, { pos: [0, R * 1.9, 0], rot: [0, i * 1.4, 0] }));
    }
  }
  g.add(body);

  /* --- glyphs. memory_glyph_drift: square marks, because the design system
     is square and its one drawn shape is a rotated square bullet. */
  const glyphs = new THREE.Group();
  glyphs.name = 'glyph-drift';
  if (A.glyph > 0) {
    const gm = new THREE.MeshBasicMaterial({
      color: pal('goldBright'), transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    gm.name = 'memory-glyph';
    const n = [0, 5, 11][A.glyph];
    for (let i = 0; i < cnt(n); i++) {
      const s = (0.07 + rand() * 0.06) * scale;
      const q = new THREE.PlaneGeometry(s, s);
      const m = part(q, gm, 'glyph-' + i, { rot: [0, 0, Math.PI / 4] });
      m.userData.orb = { a: rand() * 6.28, d: R * (1.3 + rand() * 1.2), y: R * (0.6 + rand() * 2.6), sp: 0.2 + rand() * 0.5 };
      glyphs.add(m);
    }
    g.add(glyphs);
  }

  /* --- orbiting motes */
  const motes = gpuPoints({
    name: 'aether-motes', count: [24, 60, 130, 260][A.orbit], size: 0.035 * scale,
    life: 3.4, texture: 'glow', colA: 'bone', colB: 'focus',
    gain: 2.8, opacity: 0.8, rand, radius: R * 6, cull: false,
    spawn: (i, n, r) => [0, R * 1.5, 0],
    p1: R * 2.4, p2: 1,
    // Motes spiral outward and up, then fade — a field shedding energy.
    motion: `vec3(
        cos(s.x * 6.28 + uTime * (0.8 + s.y) + life * 6.0) * uP.x * (0.3 + life * 0.9),
        (s.w - 0.35) * uP.x * life * 1.5,
        sin(s.x * 6.28 + uTime * (0.8 + s.y) + life * 6.0) * uP.x * (0.3 + life * 0.9))`,
    sizeCurve: `(0.4 + s.z) * (1.0 - life * 0.4)`,
    alpha: `sin(life * 3.14159) * (0.5 + s.x * 0.5)`,
    colorT: `life * 0.8`,
  });
  g.add(motes);

  /* --- tendrils: thin arcs reaching to the ground. */
  const tendrils = [];
  if (A.tendril > 0) {
    const tm = new THREE.MeshBasicMaterial({
      color: pal('focusBright'), transparent: true, opacity: 0.26,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    tm.name = 'aether-tendril';
    for (let i = 0; i < cnt([0, 3, 6][A.tendril]); i++) {
      const a = (i / [1, 3, 6][A.tendril]) * Math.PI * 2 + rand();
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        pts.push(new THREE.Vector3(
          Math.cos(a) * R * 1.6 * t + Math.sin(t * 4 + i) * 0.1,
          R * 1.5 * (1 - t * t),
          Math.sin(a) * R * 1.6 * t + Math.cos(t * 3.4 + i) * 0.1));
      }
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), cnt(14), 0.016 * scale, 4, false);
      const m = part(tube, tm, 'tendril-' + i);
      g.add(m);
      tendrils.push(m);
    }
  }

  /* --- the ground it stands on */
  if (A.ground === 1) {
    const ringM = new THREE.MeshBasicMaterial({
      color: pal('goldBright'), transparent: true,
      opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    ringM.name = 'ward-ring';
    const rg = new THREE.RingGeometry(R * 1.5, R * 1.62, cnt(40));
    rg.rotateX(-Math.PI / 2);
    g.add(part(rg, ringM, 'ward-ring', { pos: [0, 0.02, 0] }));
  } else if (A.ground === 2) {
    for (let i = 0; i < cnt(8); i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = ico(0.09 * scale, 0);
      s.scale(0.7, 2.2, 0.7);
      g.add(part(s, MAT.springStone, 'ward-stone-' + i,
        { pos: [Math.cos(a) * R * 1.7, 0.1 * scale, Math.sin(a) * R * 1.7], rot: [0, a, 0] }));
    }
  }

  const pool = lightPool({ radius: R * 3.4, color: 'focus', gain: 0.4, flicker: 0.12, y: 0.03 });
  g.add(pool);
  let light = null;
  if (opts.light !== false) {
    light = new THREE.PointLight(0x9fd0dd, 4 * scale, 10 * scale, 2);
    light.position.y = R * 1.6;
    light.name = 'aether-light';
    g.add(light);
  }

  const baseI = light ? light.intensity : 0;
  const PULSE_R = [0.6, 1.4, 3.1][A.pulse];
  return {
    group: g,
    declared: {
      form: FORM, glyph: [0, 5, 11][A.glyph], orbit: [24, 60, 130, 260][A.orbit],
      pulse: ['slow', 'measured', 'racing'][A.pulse],
      tendril: [0, 3, 6][A.tendril],
      ground: ['bare', 'ward-ring', 'ward-stones'][A.ground],
      collapse: A.collapse ? 'collapsing' : 'stable',
    },
    update(t) {
      // Collapse: the field periodically implodes and re-forms. Behaviour,
      // and the reason collapse is an axis.
      const col = A.collapse ? 0.35 + Math.pow(Math.abs(Math.sin(t * 0.28)), 3) * 0.9 : 1;
      const p = (0.7 + Math.sin(t * PULSE_R) * 0.3) * col;
      bodyMat.uniforms.uPulse.value = p;
      body.scale.setScalar(0.85 + p * 0.2);
      body.rotation.y = t * 0.22;
      glyphs.children.forEach((m, i) => {
        const o = m.userData.orb;
        const a = o.a + t * o.sp;
        m.position.set(Math.cos(a) * o.d * col, o.y + Math.sin(t * 0.5 + i) * 0.14, Math.sin(a) * o.d * col);
        m.rotation.y = a * 1.6;
        m.material.opacity = 0.55 * p;
      });
      tendrils.forEach((m, i) => { m.material.opacity = 0.26 * p * (0.6 + Math.abs(Math.sin(t * 1.7 + i)) * 0.5); });
      if (light) light.intensity = baseI * p * flicker(t, variant, 0.4);
      pool.material.uniforms.uGain.value = 0.4 * p;
    },
    set(k, v) {
      if (k === 'glow') { bodyMat.uniforms.uGain.value = 1.15 * v; motes.material.uniforms.uOpacity.value = 0.8 * v; }
      if (k === 'motes') motes.material.uniforms.uOpacity.value = 0.8 * v;
      if (k === 'reach' && light) light.distance = 10 * scale * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================ steamVent ==
   source × pressure × cadence × plume × condensate × nozzle × scald
   = 4 · 4 · 3 · 3 · 3 · 3 · 2 = 2,592 */
export const STEAMVENT_AXES = { source: 4, pressure: 4, cadence: 3, plume: 3, condensate: 3, nozzle: 3, scald: 2 };
const PRESSURE = [
  { id: 'weeping', v: 0.25, jet: 0.5 }, { id: 'venting', v: 0.6, jet: 1.4 },
  { id: 'blasting', v: 1.2, jet: 3.2 }, { id: 'rupture', v: 2.1, jet: 6 },
];
const CADENCE = [
  { id: 'constant', period: 0 }, { id: 'pulsed', period: 3.4 }, { id: 'chuffing', period: 0.9 },
];

export function steamVent(variant = 0, opts = {}) {
  const A = axesOf(variant, STEAMVENT_AXES);
  const P = PRESSURE[A.pressure], C = CADENCE[A.cadence];
  const rand = rnd(0x57e + variant * 6151);
  const g = new THREE.Group();
  g.name = 'vfx-steam-vent';
  const scale = opts.scale || 1;
  const iron = MAT.pittedIron;

  /* --- the source. hm-steam.js builds the machine; this is its breath, so
     the housings here are deliberately minimal — enough to give the jet an
     origin, not a second copy of the industrial kit. */
  let originY = 0.4 * scale, dir = [0, 1, 0];
  if (A.source === 0) {
    g.add(part(cyl(0.11 * scale, 0.11 * scale, 0.9 * scale, 10, 1, true), iron, 'vent-pipe',
      { pos: [0, 0.45 * scale, 0], rot: [0, 0, Math.PI / 2.6] }));
    g.add(part(torus(0.12 * scale, 0.022 * scale, 5, 12), MAT.blackIron, 'pipe-flange',
      { pos: [0.36 * scale, 0.72 * scale, 0], rot: [0, 0, Math.PI / 2.6 + Math.PI / 2] }));
    originY = 0.78 * scale;
    dir = [0.62, 0.78, 0];
  } else if (A.source === 1) {
    const grate = new THREE.Group();
    grate.name = 'floor-grate';
    grate.add(part(new THREE.BoxGeometry(0.9 * scale, 0.06 * scale, 0.9 * scale), MAT.blackIron, 'grate-frame', { pos: [0, 0.03 * scale, 0] }));
    for (let i = 0; i < cnt(7); i++) {
      grate.add(part(new THREE.BoxGeometry(0.8 * scale, 0.04 * scale, 0.05 * scale), iron, 'grate-bar-' + i,
        { pos: [0, 0.07 * scale, (i / 6 - 0.5) * 0.7 * scale] }));
    }
    g.add(grate);
    originY = 0.1 * scale;
  } else if (A.source === 2) {
    for (const s of [-1, 1]) {
      const b = new THREE.BoxGeometry(0.8 * scale, 0.34 * scale, 0.3 * scale);
      g.add(part(jitter(b, 0.05 * scale, rand), MAT.firedClay, 'fissure-lip-' + (s < 0 ? 'a' : 'b'),
        { pos: [0, 0.16 * scale, s * 0.26 * scale], rot: [0, 0, s * 0.06] }));
    }
    originY = 0.2 * scale;
  } else {
    g.add(part(cyl(0.2 * scale, 0.26 * scale, 1.7 * scale, 12, 1, true), iron, 'stack',
      { pos: [0, 0.85 * scale, 0] }));
    g.add(part(lathe([[0.2 * scale, 0], [0.3 * scale, 0.1 * scale], [0.26 * scale, 0.16 * scale]], 12),
      MAT.blackIron, 'stack-cowl', { pos: [0, 1.7 * scale, 0] }));
    originY = 1.86 * scale;
  }

  /* --- the nozzle changes the jet's shape, which is the whole point of an
     axis: a slot throws a fan, a rose throws a cone. */
  const spread = [0.14, 0.5, 1.1][A.nozzle];
  const jetLen = P.jet * scale;

  /* --- the jet. Fast, narrow, and short-lived at the throat, becoming a
     slow wide plume above — two systems because it is two behaviours. */
  const jet = gpuPoints({
    name: 'steam-jet', count: Math.round(90 * P.v + 40), size: 0.09 * scale, life: 0.9,
    texture: 'glow', colA: 'bone', colB: 'mist',
    gain: 1.15, opacity: 0.42, rand, radius: jetLen * 2, cull: false,
    spawn: () => [0, originY, 0],
    p1: jetLen, p2: spread, p3: 1,
    motion: `vec3(
        ${dir[0].toFixed(3)} * life * uP.x + (s.x - 0.5) * uP.y * life * 1.4 + uWindDir.x * uWind * life * life * 0.9,
        ${dir[1].toFixed(3)} * life * uP.x + (s.y - 0.3) * uP.y * life * 0.7,
        ${dir[2].toFixed(3)} * life * uP.x + (s.z - 0.5) * uP.y * life * 1.4 + uWindDir.y * uWind * life * life * 0.9)`,
    sizeCurve: `(0.3 + life * 2.2) * (0.5 + s.z * 0.9)`,
    alpha: `smoothstep(0.0, 0.06, life) * (1.0 - life) * (0.6 + s.x * 0.4)`,
    colorT: `life`,
    rateSpread: '0.8 + s.w * 1.4',
  });
  jet.material.uniforms.uP.value.w = 1;
  jet.material.fragmentShader = jet.material.fragmentShader.replace('float a = ', 'float a = uP.w * ');
  jet.material.needsUpdate = true;
  g.add(jet);

  /* --- the plume above the jet */
  let plume = null;
  if (A.plume > 0) {
    plume = softVolume({
      name: 'steam-plume', count: [0, 10, 22][A.plume],
      size: 0.6 * scale * (1 + P.v), life: 4.5, rise: 1.1 + P.v * 0.6,
      spread: 0.7 * scale * (1 + spread), grow: 2.4,
      opacity: [0, 0.055, 0.095][A.plume], colA: 'mist', colB: 'bone',
      gain: 1.1, drift: 1.6, rand,
      spawn: (i, n, r) => [dir[0] * jetLen * 0.6, originY + dir[1] * jetLen * 0.6, dir[2] * jetLen * 0.6],
    });
    g.add(plume);
  }

  /* --- condensate: what steam does when it hits cold Reach air. */
  let drip = null;
  if (A.condensate > 0) {
    drip = gpuPoints({
      name: 'condensate', count: [0, 24, 60][A.condensate], size: 0.03 * scale,
      life: 1.5, texture: 'streak', colA: 'mist', colB: 'focus',
      gain: 1, opacity: 0.5, rand, radius: jetLen * 2, cull: false,
      spawn: (i, n, r) => [(r() - 0.5) * jetLen, originY + r() * jetLen, (r() - 0.5) * jetLen],
      p1: 1.6,
      motion: `vec3(uWindDir.x * uWind * life * 0.3, -life * life * uP.x * 1.8, uWindDir.y * uWind * life * 0.3)`,
      sizeCurve: `0.5 + s.z * 0.8`,
      alpha: `sin(life * 3.14159) * 0.7`,
      colorT: `life`,
    });
    g.add(drip);
  }

  /* --- scald: the jet is hot enough to glow at the throat. Cinderward's
     furnaces are the only place in the Reach where steam is lit from behind. */
  if (A.scald) {
    g.add(lightPool({ radius: 1.4 * scale * P.v, color: 'ember', gain: 0.3 * P.v, flicker: 0.2, y: 0.03 }));
  }
  const pool = lightPool({ radius: 1.6 * scale, color: 'mist', gain: 0.14, flicker: 0.06, y: 0.02 });
  g.add(pool);

  const plumeMat = plume ? plume.children[0].material : null;
  const plumeBase = plumeMat ? plumeMat.uniforms.uOpacity.value : 0;
  return {
    group: g,
    declared: {
      source: ['pipe', 'floor-grate', 'fissure', 'stack'][A.source],
      pressure: P.id, cadence: C.id, period: C.period || 'continuous',
      plume: ['none', 'light', 'heavy'][A.plume],
      condensate: ['dry', 'dripping', 'raining'][A.condensate],
      nozzle: ['needle', 'cone', 'fan'][A.nozzle],
      scald: !!A.scald,
    },
    update(t) {
      // The cadence gate. A chuffing vent is a machine breathing; a constant
      // one is a leak. Same geometry, different thing entirely.
      let gate = 1;
      if (C.period > 0) {
        const ph = (t % C.period) / C.period;
        gate = Math.pow(Math.max(0, Math.sin(ph * Math.PI)), C.id === 'chuffing' ? 0.6 : 1.8);
        gate = 0.12 + gate * 0.95;
      }
      jet.material.uniforms.uP.value.w = gate;
      if (plumeMat) plumeMat.uniforms.uOpacity.value = plumeBase * (0.4 + gate * 0.7);
    },
    set(k, v) {
      if (k === 'pressure') jet.material.uniforms.uP.value.x = jetLen * v;
      if (k === 'plume' && plumeMat) plumeMat.uniforms.uOpacity.value = plumeBase * v;
      if (k === 'spread') jet.material.uniforms.uP.value.y = spread * v;
    },
    ...measureFx(g),
  };
}

/* =========================================================== frostcrust ==
   coverage × crystal × spread × relief × fracture × breath × rime
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const FROSTCRUST_AXES = { coverage: 4, crystal: 3, spread: 4, relief: 3, fracture: 3, breath: 3, rime: 2 };

export function frostcrust(variant = 0, opts = {}) {
  const A = axesOf(variant, FROSTCRUST_AXES);
  const rand = rnd(0xf05 + variant * 5279);
  const g = new THREE.Group();
  g.name = 'vfx-frostcrust';
  const scale = opts.scale || 1;
  const R = 2.2 * scale;
  const cover = [0.28, 0.5, 0.72, 0.95][A.coverage];
  const rate = [0, 0.05, 0.14, 0.34][A.spread];
  const relief = [0.0, 0.03, 0.08][A.relief];

  /* --- the stone the frost is on. Frost with nothing under it is a decal. */
  const slab = new THREE.CylinderGeometry(R, R * 1.05, 0.3 * scale, cnt(24), 2);
  g.add(part(jitter(slab, 0.05 * scale, rand), MAT.slateDry, 'frost-slab', { pos: [0, 0.15 * scale, 0] }));

  /* --- the crust. A shader on a disc just above the stone: coverage is a
     threshold on a noise field, so `spread` can animate the threshold and
     the frost genuinely grows outward from seeds. */
  const crustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uCover: { value: cover }, uRate: { value: rate },
      uCol: { value: pal('glacier') }, uEdgeCol: { value: pal('focus') },
      uGain: { value: 0.72 }, uRelief: { value: relief },
      uFracture: { value: A.fracture }, uRime: { value: A.rime ? 1 : 0 },
      uPhase: { value: variant * 2.1 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime, uRelief, uPhase;
      varying vec2 vUv; varying float vFog; varying vec3 vN; varying vec3 vV;
      ${NOISE_GLSL}
      void main(){
        vUv = uv;
        vec3 p = position;
        // Relief: the crust is a raised rind, not a paint layer.
        p.y += fbm2(vec3(uv * 9.0, uPhase)) * uRelief;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime, uCover, uRate, uGain, uIntensity, uFracture, uRime, uPhase, uNight;
      uniform vec3 uCol, uEdgeCol;
      varying vec2 vUv; varying float vFog; varying vec3 vN; varying vec3 vV;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      void main(){
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        if (r > 1.0) discard;
        // The growth front: coverage advances on a slow cycle when uRate > 0.
        float grow = uRate > 0.0 ? uCover * (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * uRate + uPhase))) : uCover;
        float n = fbm(vec3(vUv * 7.0, uPhase));
        float feather = fbm2(vec3(vUv * 22.0, uPhase * 1.7));
        // Frost grows in fingers, so the mask is noise thresholded, not a disc.
        float d = grow * 1.25 - r * 0.85 + n * 0.55 - 0.25;
        if (uRime > 0.5) d += pow(max(0.0, feather - 0.45), 1.4) * 0.9;
        float a = smoothstep(0.0, 0.16, d);
        if (a <= 0.004) discard;
        // Fracture lines: dark seams where the crust has cracked.
        float frac = 1.0;
        if (uFracture > 0.5){
          float f = abs(fbm(vec3(vUv * (3.0 + uFracture * 2.0), 7.7 + uPhase)) - 0.5);
          frac = smoothstep(0.0, 0.045 / uFracture, f);
        }
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
        // Sparkle is a few lit facets, not a sheen: --focus at bone luminance
        // is already near the top of the palette, so a wide multiplier here
        // takes the whole crust past white and the frost stops reading as ice.
        float sparkle = pow(feather, 8.0) * 1.3;
        vec3 col = mix(uEdgeCol, uCol, smoothstep(0.0, 0.4, d));
        col = col * (0.6 + rim * 0.5) + vec3(sparkle);
        col *= uGain * uIntensity * (1.0 + uNight * 0.5) * frac;
        float fog = fogFactor(vFog);
        col = mix(col, uFogColor, fog);
        gl_FragColor = vec4(col, a * (0.72 + sparkle * 0.2) * (1.0 - fog * 0.7));
      }`,
  });
  crustMat.name = 'frost-crust';
  const crust = new THREE.Mesh(new THREE.CircleGeometry(R * 1.02, cnt(48)), crustMat);
  crust.name = 'frost-crust';
  crust.rotation.x = -Math.PI / 2;
  crust.position.y = 0.31 * scale;
  crust.renderOrder = 4;
  g.add(crust);

  /* --- crystals. Needles standing off the crust, which is what makes frost
     read as three-dimensional at close range. */
  if (A.crystal > 0) {
    const cm = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b9d8e0'), roughness: 0.12, metalness: 0.0,
      transparent: true, opacity: 0.72,
      emissive: pal('focus'), emissiveIntensity: 0.22,
    });
    cm.name = 'frost-needle';
    const n = [0, 14, 34][A.crystal];
    for (let i = 0; i < cnt(n); i++) {
      const a = rand() * Math.PI * 2, d = R * Math.sqrt(rand()) * cover;
      const h = (0.06 + rand() * 0.16) * scale;
      const sp = new THREE.ConeGeometry(0.016 * scale, h, 4);
      g.add(part(sp, cm, 'needle-' + i, {
        pos: [Math.cos(a) * d, 0.31 * scale + h / 2, Math.sin(a) * d],
        rot: [(rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5],
      }));
    }
  }

  /* --- cold breath: air over frost fogs. Behaviour, and the thing that
     makes a frozen surface feel cold rather than merely white. */
  let breath = null;
  if (A.breath > 0) {
    breath = softVolume({
      name: 'cold-breath', count: [0, 10, 22][A.breath], size: R * 0.9,
      life: 8, rise: 0.12, spread: R * 0.4, grow: 1.6,
      opacity: [0, 0.045, 0.085][A.breath], colA: 'mist', colB: 'glacier',
      gain: 1.05, drift: 0.4, rand,
      spawn: (i, n, r) => [(r() - 0.5) * R * 1.6, 0.35 * scale + r() * 0.3, (r() - 0.5) * R * 1.6],
    });
    g.add(breath);
  }

  const pool = lightPool({ radius: R * 1.6, color: 'focus', gain: 0.16 * cover, flicker: 0.04, y: 0.02 });
  g.add(pool);

  return {
    group: g,
    declared: {
      coverage: Math.round(cover * 100) + '%',
      crystal: ['none', 'needles', 'thicket'][A.crystal],
      spread: A.spread === 0 ? 'static' : ['', 'creeping', 'growing', 'racing'][A.spread],
      relief: ['flat', 'raised', 'crusted'][A.relief],
      fracture: ['none', 'hairline', 'shattered'][A.fracture],
      breath: ['none', 'faint', 'smoking'][A.breath],
      rime: A.rime ? 'feathered' : 'plain',
    },
    update() {},
    set(k, v) {
      if (k === 'coverage') crustMat.uniforms.uCover.value = cover * v;
      if (k === 'glow') { crustMat.uniforms.uGain.value = 0.72 * v; pool.material.uniforms.uGain.value = 0.16 * cover * v; }
      if (k === 'spread') crustMat.uniforms.uRate.value = rate * v;
      if (k === 'breath' && breath) breath.children[0].material.uniforms.uOpacity.value = [0, 0.045, 0.085][A.breath] * v;
    },
    ...measureFx(g),
  };
}

export const VEIL_FAMILIES = [
  {
    id: 'hm.vfx.marshlight', name: 'Marsh lights and will-o-wisp', group: 'veil',
    axes: MARSHLIGHT_AXES, build: marshLight, stage: 'ground',
    prior: 'hm-fauna.js GLOW_TIERS \u2014 the rarity glow ladder',
    hero: { count: 2, path: 0, pulse: 1, halo: 1, tail: 1, height: 1, pair: 0 },
    params: [
      { key: 'glow', label: 'Halo', min: 0, max: 2.6, step: 0.05, value: 1 },
      { key: 'size', label: 'Halo size', min: 0.3, max: 3, step: 0.05, value: 1 },
      { key: 'reach', label: 'Light reach', min: 0.3, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'Wanders on two incommensurate sines rather than a path, so a group never reads as a formation. A guttering wisp genuinely goes out and comes back.',
  },
  {
    id: 'hm.vfx.aether', name: 'Aether and hexcraft glow', group: 'veil',
    axes: AETHERGLOW_AXES, build: aetherGlow, stage: 'ground',
    prior: 'hm-steam.js aetherLamp() \u2014 the housing, not the field',
    hero: { form: 1, glyph: 1, orbit: 2, pulse: 1, tendril: 1, ground: 1, collapse: 0 },
    params: [
      { key: 'glow', label: 'Field brightness', min: 0, max: 2.6, step: 0.05, value: 1 },
      { key: 'motes', label: 'Motes', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'reach', label: 'Light reach', min: 0.3, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'hollow_abbey declares memory_glyph_drift; the glyphs are rotated squares because the design system\u2019s one drawn shape is a rotated square bullet. Four silhouettes: sphere, ring, column, rift.',
  },
  {
    id: 'hm.vfx.steamvent', name: 'Steam and furnace breath', group: 'veil',
    axes: STEAMVENT_AXES, build: steamVent, stage: 'ground',
    prior: 'hm-steam.js ventStack() \u2014 the machine, not its breath',
    hero: { source: 0, pressure: 2, cadence: 2, plume: 1, condensate: 1, nozzle: 1, scald: 1 },
    params: [
      { key: 'pressure', label: 'Pressure', min: 0.2, max: 2.4, step: 0.05, value: 1 },
      { key: 'spread', label: 'Nozzle spread', min: 0.2, max: 3, step: 0.05, value: 1 },
      { key: 'plume', label: 'Plume', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'A chuffing vent is a machine breathing; a constant one is a leak. Same geometry, and the cadence gate is what tells them apart.',
  },
  {
    id: 'hm.vfx.frostcrust', name: 'Frost and ice crust', group: 'veil',
    axes: FROSTCRUST_AXES, build: frostcrust, stage: 'ground', prior: null,
    hero: { coverage: 2, crystal: 1, spread: 2, relief: 1, fracture: 1, breath: 1, rime: 1 },
    params: [
      { key: 'coverage', label: 'Coverage', min: 0, max: 1.6, step: 0.05, value: 1 },
      { key: 'spread', label: 'Growth rate', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'glow', label: 'Sheen', min: 0, max: 2.6, step: 0.05, value: 1 },
      { key: 'breath', label: 'Cold breath', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'Coverage is a threshold on a noise field, so growth is real: the frost advances from seeds in fingers rather than a disc scaling up.',
  },
];
