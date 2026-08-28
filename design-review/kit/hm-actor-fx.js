/* =========================================================================
   hm-actor-fx.js — environment, glow and particle systems for the cast
   -------------------------------------------------------------------------
   Three things that separate a lit render from a good one, none of which the
   rig had:

   1. AN ENVIRONMENT. MeshStandardMaterial is a PBR material and without an
      environment it has nothing to reflect, so every surface resolves to flat
      diffuse and metal reads as dark plastic. A PMREM-filtered procedural sky
      gives real specular falloff and fresnel at the silhouette edge — the
      single largest quality gain available, and it costs one texture for the
      whole scene rather than anything per actor.

   2. GLOW THAT SURVIVES SCISSOR RENDERING. The hall draws many cards in one
      frame by scissoring one canvas, so post-processed bloom would need a
      render target per card. Instead glow is additive billboard sprites plus
      emissive materials: it reads as bloom through the design system's grade,
      costs two triangles, and composites correctly in a scissored viewport.

   3. PARTICLES THAT BELONG TO A PERSON. Each emitter is parented to a BONE,
      so ember motes rise off the hand that holds the tongs and follow it
      through the swing. Particles parented to the root would slide off the
      body the moment the actor moved, which is the usual tell.

   Everything integrates in the actor's own local space, so an actor that is
   hidden costs nothing and an actor that is shown is already correct.
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* --------------------------------------------------------------- textures
   Built once and shared. A radial gradient with a soft shoulder reads as
   light; a hard-edged one reads as a decal, which is why the stops are
   weighted toward the centre rather than linear. */
let _glowTex = null;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  rad.addColorStop(0.00, 'rgba(255,255,255,1)');
  rad.addColorStop(0.14, 'rgba(255,255,255,.72)');
  rad.addColorStop(0.34, 'rgba(255,255,255,.26)');
  rad.addColorStop(0.62, 'rgba(255,255,255,.06)');
  rad.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, s, s);
  _glowTex = new THREE.CanvasTexture(c);
  _glowTex.colorSpace = THREE.SRGBColorSpace;
  return _glowTex;
}

/** A soft-edged mote. Slightly irregular so a cloud of them is not uniform. */
let _moteTex = null;
export function moteTexture() {
  if (_moteTex) return _moteTex;
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  rad.addColorStop(0, 'rgba(255,255,255,1)');
  rad.addColorStop(0.3, 'rgba(255,255,255,.6)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, s, s);
  _moteTex = new THREE.CanvasTexture(c);
  _moteTex.colorSpace = THREE.SRGBColorSpace;
  return _moteTex;
}

/* ------------------------------------------------------------ environment
   A procedural equirectangular sky, PMREM-filtered into a real environment.
   Authored to match the world rather than a neutral studio: cold overcast
   zenith, a warm low sun where the key light sits, ash-dark ground. That way
   the reflections agree with the lighting instead of fighting it. */
export function makeEnvironment(renderer) {
  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.00, '#2c3a42');   // zenith, cold
  sky.addColorStop(0.42, '#4d5a5e');
  sky.addColorStop(0.52, '#6b6353');   // horizon haze, warming
  sky.addColorStop(0.60, '#3a352e');
  sky.addColorStop(1.00, '#16181a');   // ground, ash
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // Warm sun bloom at the key light's azimuth (key sits front-left, +x back).
  const sunX = W * 0.66, sunY = H * 0.34;
  const sun = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.30);
  sun.addColorStop(0.00, 'rgba(255,236,196,.95)');
  sun.addColorStop(0.18, 'rgba(232,196,140,.45)');
  sun.addColorStop(0.55, 'rgba(150,140,120,.10)');
  sun.addColorStop(1.00, 'rgba(0,0,0,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);

  // A cool counter-glow opposite it, so rim reflections are not monochrome.
  const cx = W * 0.16, cy = H * 0.40;
  const cool = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.22);
  cool.addColorStop(0, 'rgba(140,178,196,.34)');
  cool.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = cool;
  g.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* ================================================================ emitters
   Each kind names WHOSE it is and what it is made of. `bone` is a rig path
   resolved at attach time, so the emitter rides the body part that would
   actually produce it. */
export const FX_KINDS = {
  /* Cinder Compact. Forge heat off the hands and a low ember wash at the
     hem — the only faction that carries its own light source. */
  forge: {
    label: 'Forge heat',
    colour: 0xbd6135, colour2: 0xe8a05a,
    count: 46, rate: 14,
    life: [1.1, 2.3], size: [0.012, 0.030],
    rise: [0.16, 0.42], spread: 0.055, drift: 0.09, turb: 0.5,
    fade: 'ember',
    lamps: [
      { bone: 'handR', off: [0, -0.03, 0.02], size: 0.30, intensity: 0.62, colour: 0xbd6135 },
      { bone: 'pelvis', off: [0, -0.06, 0.10], size: 0.44, intensity: 0.26, colour: 0xbd6135 },
    ],
    from: [{ bone: 'handR', off: [0, -0.04, 0.02] }, { bone: 'handL', off: [0, -0.04, 0.02] }],
  },

  /* Custodians of the Exact Word. Not fire — a cold votive shimmer that
     hangs rather than rises, because nothing in the abbey is in a hurry. */
  votive: {
    label: 'Votive shimmer',
    colour: 0x658e9e, colour2: 0xa8c6d2,
    count: 34, rate: 7,
    life: [2.2, 4.0], size: [0.008, 0.018],
    rise: [0.02, 0.10], spread: 0.10, drift: 0.05, turb: 0.22,
    fade: 'soft',
    lamps: [
      { bone: 'head', off: [0, 0.02, 0.06], size: 0.26, intensity: 0.30, colour: 0x658e9e },
    ],
    from: [{ bone: 'chest', off: [0, 0.10, 0.10] }, { bone: 'handR', off: [0, -0.03, 0.03] }],
  },

  /* Reed Sisters. Marsh spores and charm-light near the hem, moving sideways
     more than up because the air over blackwater does. */
  mire: {
    label: 'Mire spores',
    colour: 0x7d9689, colour2: 0xb6c4a8,
    count: 40, rate: 9,
    life: [2.6, 4.6], size: [0.006, 0.015],
    rise: [-0.02, 0.08], spread: 0.16, drift: 0.16, turb: 0.7,
    fade: 'soft',
    lamps: [{ bone: 'pelvis', off: [0, -0.22, 0.04], size: 0.34, intensity: 0.18, colour: 0x7d9689 }],
    from: [{ bone: 'pelvis', off: [0, -0.26, 0.0] }, { bone: 'ankleL', off: [0, 0.01, 0.02] }],
  },

  /* Ember Ledger. Ash and tallow-smoke off the ledger hand; almost no
     colour, because the Hold's light is bookkeeping light. */
  tallow: {
    label: 'Tallow ash',
    colour: 0xb99552, colour2: 0xd8cfae,
    count: 26, rate: 6,
    life: [1.8, 3.4], size: [0.006, 0.014],
    rise: [0.10, 0.26], spread: 0.07, drift: 0.10, turb: 0.4,
    fade: 'soft',
    lamps: [{ bone: 'handL', off: [0, -0.02, 0.04], size: 0.22, intensity: 0.24, colour: 0xb99552 }],
    from: [{ bone: 'handL', off: [0, -0.03, 0.04] }],
  },

  /* Grave Tithe. No lamp at all — she is the darkest silhouette by intent, so
     the FX is a thin cold dust that only shows against the rim light. */
  crypt: {
    label: 'Crypt dust',
    colour: 0x8e928b, colour2: 0xc0c4bb,
    count: 22, rate: 5,
    life: [2.4, 4.2], size: [0.005, 0.011],
    rise: [-0.04, 0.05], spread: 0.14, drift: 0.13, turb: 0.6,
    fade: 'soft',
    lamps: [],
    from: [{ bone: 'pelvis', off: [0, -0.18, -0.06] }],
  },
};

/** Faction default. A character may override with spec.fx. */
export const FACTION_FX = {
  cinder_compact: 'forge',
  exact_word: 'votive',
  reed_sisters: 'mire',
  ember_ledger: 'tallow',
  grave_tithe: 'crypt',
  bell_wardens: null,        // deliberately none: the Wardens carry no light
  unwritten_roads: null,     // and neither do the Roads
};

function resolveBone(rig, path) {
  switch (path) {
    case 'handR': return rig.arms.R.hand || rig.arms.R.wrist;
    case 'handL': return rig.arms.L.hand || rig.arms.L.wrist;
    case 'ankleL': return rig.legs.L.ankle;
    case 'ankleR': return rig.legs.R.ankle;
    case 'head': return rig.head;
    case 'chest': return rig.chest;
    case 'pelvis': return rig.pelvis;
    default: return rig.root;
  }
}

/* ------------------------------------------------------------------ attach
   One Points cloud per actor, plus a lamp sprite per declared lamp. Particles
   live in ROOT space and are seeded from the emitter bone's current world
   position converted into root space, so they detach on birth and drift
   independently — which is what smoke does. A cloud parented rigidly to a
   hand would swing with it like a flag. */
export function attachFX(rig, kindName, seed = 1) {
  const kind = FX_KINDS[kindName];
  if (!kind) return null;

  const n = kind.count;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const siz = new Float32Array(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));

  /* A tiny ShaderMaterial rather than PointsMaterial, because per-particle
     size and per-particle alpha are both needed and PointsMaterial gives
     neither. Size attenuates with distance so a mote reads the same physical
     size on a near card and a far one. */
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: moteTexture() }, uScale: { value: 620 } },
    vertexShader: `
      attribute float size;
      varying vec3 vCol;
      varying float vA;
      void main() {
        vCol = color;
        vA = clamp(size * 90.0, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(size * uScale / max(-mv.z, 0.08), 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      varying vec3 vCol;
      varying float vA;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vCol, t.a * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.name = 'fx:' + kindName;
  rig.root.add(points);

  const lamps = [];
  for (const L of kind.lamps) {
    const sm = new THREE.SpriteMaterial({
      map: glowTexture(),
      color: new THREE.Color(L.colour),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: L.intensity,
    });
    const sp = new THREE.Sprite(sm);
    sp.scale.setScalar(L.size * rig.H);
    sp.position.set(L.off[0] * rig.H, L.off[1] * rig.H, L.off[2] * rig.H);
    const host = resolveBone(rig, L.bone);
    host.add(sp);
    lamps.push({ sprite: sp, base: L.intensity, phase: Math.random() * TAU });
  }

  // Particle state, kept plain and preallocated.
  const P = [];
  for (let i = 0; i < n; i++) P.push({ age: 1e9, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0 });

  let s = (seed >>> 0) || 7;
  const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };

  return {
    kind, kindName, points, geo, mat, lamps, P, rand,
    emitters: kind.from.map((f) => ({ bone: resolveBone(rig, f.bone), off: f.off })),
    acc: 0, t: 0,
    c1: new THREE.Color(kind.colour),
    c2: new THREE.Color(kind.colour2),
    _v: new THREE.Vector3(),
  };
}

/* -------------------------------------------------------------------- step
   Integrates in root space. Emission is rate-based with an accumulator, so
   the cloud density is frame-rate independent — a particle system tied to
   frames thins out on a slow machine, which is the commonest FX bug. */
export function stepFX(fx, rig, dt) {
  if (!fx) return;
  const K = fx.kind;
  fx.t += dt;

  // Emit.
  fx.acc += dt * K.rate;
  let budget = Math.min(Math.floor(fx.acc), 6);
  fx.acc -= budget;
  if (budget > 0) {
    for (const p of fx.P) {
      if (budget <= 0) break;
      if (p.age < p.life) continue;
      const em = fx.emitters[(fx.rand() * fx.emitters.length) | 0];
      if (!em || !em.bone) continue;
      em.bone.getWorldPosition(fx._v);
      rig.root.worldToLocal(fx._v);
      const H = rig.H;
      p.x = fx._v.x + em.off[0] * H + (fx.rand() - 0.5) * K.spread * H;
      p.y = fx._v.y + em.off[1] * H + (fx.rand() - 0.5) * K.spread * H * 0.4;
      p.z = fx._v.z + em.off[2] * H + (fx.rand() - 0.5) * K.spread * H;
      const rise = K.rise[0] + fx.rand() * (K.rise[1] - K.rise[0]);
      p.vx = (fx.rand() - 0.5) * K.drift;
      p.vy = rise;
      p.vz = (fx.rand() - 0.5) * K.drift;
      p.life = K.life[0] + fx.rand() * (K.life[1] - K.life[0]);
      p.age = 0;
      p.s = K.size[0] + fx.rand() * (K.size[1] - K.size[0]);
      budget--;
    }
  }

  // Integrate and write buffers.
  const pos = fx.geo.attributes.position.array;
  const col = fx.geo.attributes.color.array;
  const siz = fx.geo.attributes.size.array;
  const tmp = new THREE.Color();

  for (let i = 0; i < fx.P.length; i++) {
    const p = fx.P[i];
    const o = i * 3;
    if (p.age >= p.life) { siz[i] = 0; pos[o] = 0; pos[o + 1] = -99; pos[o + 2] = 0; continue; }
    p.age += dt;
    const u = clamp(p.age / p.life, 0, 1);

    // Curl-ish turbulence from cheap trig, offset per particle so no two
    // motes share a path.
    if (K.turb > 0) {
      const w = fx.t * 1.7 + i * 2.399;
      p.vx += Math.sin(w) * K.turb * dt * 0.34;
      p.vz += Math.cos(w * 0.83) * K.turb * dt * 0.34;
      p.vy += Math.sin(w * 0.41) * K.turb * dt * 0.10;
    }
    // Drag, so nothing accelerates forever.
    const drag = 1 - 1.15 * dt;
    p.vx *= drag; p.vy *= drag; p.vz *= drag;

    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    pos[o] = p.x; pos[o + 1] = p.y; pos[o + 2] = p.z;

    /* Fade shape. `ember` cools from bright core colour to the dim one and
       dies fast at the end, which is how a spark behaves. `soft` is a
       symmetric in-out, which is how dust behaves in a shaft of light. */
    let a, mix;
    if (K.fade === 'ember') {
      a = Math.pow(1 - u, 1.7);
      mix = Math.pow(u, 0.6);
    } else {
      a = Math.sin(u * Math.PI);
      mix = u;
    }
    tmp.copy(fx.c2).lerp(fx.c1, mix);
    col[o] = tmp.r; col[o + 1] = tmp.g; col[o + 2] = tmp.b;
    siz[i] = p.s * (0.55 + a * 0.75) * (a > 0.02 ? 1 : 0);
  }

  fx.geo.attributes.position.needsUpdate = true;
  fx.geo.attributes.color.needsUpdate = true;
  fx.geo.attributes.size.needsUpdate = true;

  // Lamps breathe. A forge lamp flickers; a votive one barely moves.
  const flick = K.fade === 'ember' ? 0.30 : 0.10;
  for (const L of fx.lamps) {
    const w = fx.t * (K.fade === 'ember' ? 7.3 : 1.4) + L.phase;
    const j = 1 + (Math.sin(w) * 0.6 + Math.sin(w * 2.7) * 0.4) * flick;
    L.sprite.material.opacity = L.base * j;
  }
}

/** Free GPU resources for one actor's FX. */
export function disposeFX(fx) {
  if (!fx) return;
  fx.geo.dispose();
  fx.mat.dispose();
  for (const L of fx.lamps) { L.sprite.material.dispose(); L.sprite.removeFromParent(); }
  fx.points.removeFromParent();
}
