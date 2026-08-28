/* Water — falling, running, standing, erupting.
 *
 * WHY WATER IS THE HARD ONE
 * Fire is easy to make beautiful because it is allowed to be the brightest
 * thing in the frame. Water in the Reach is the opposite problem: the region
 * kit declares wetness 0.82 and a cold_overcast key, so the water is
 * near-black and there is almost no light to reflect off it. A black plane
 * with a wobble on it reads as vinyl.
 *
 * Four things fix that, and every family here uses all four:
 *   1. MOVEMENT with a real normal — three wave trains with analytic
 *      derivatives, so the light on the surface travels instead of the
 *      surface merely wobbling (hm-vfx.js waterMaterial).
 *   2. AERATION — foam and spray are additive and near-white. Air in water is
 *      the only part of water that is genuinely bright, so it carries the
 *      contrast.
 *   3. A GLOW on the crests, --focus hued, small and lifted at night. Held
 *      deliberately low: water that glows evenly reads as lava. This is the
 *      "bit of a glow" and it is a value move on the system's one cool hue,
 *      not a new colour.
 *   4. A --focus light pool on the stone around a plunge, so the rock is wet
 *      *and lit by* the water rather than merely near it.
 *
 * COUNTING RULE
 * An axis counts only if it changes silhouette or behaviour. `stain` was cut
 * from stillwater because it was a recolour; `debris` replaced it because a
 * scum mat and a leaf raft change the surface break-up. Seed jitter is never
 * counted.
 *
 * REFLECTION
 * "Reflective near the camera, stylized far" is implemented as a per-surface
 * opt-in: a family that can support a planar reflection returns
 * `reflect: { mesh, y }`, and the host binds ONE PlanarReflection to the
 * nearest such surface. Every other surface uses the stylized Fresnel
 * stand-in in the same shader, so the two halves match in palette.
 */
import * as THREE from 'three';
import { MAT, rnd, part, ico, cyl, lathe, jitter, cnt, torus } from './hm-core.js';
import {
  VFX_ENV, pal, gpuPoints, softVolume, lightPool, waterSurface,
  curtainGeometry, fallMaterial, axesOf, measureFx, NOISE_GLSL, FOG_GLSL,
  ballistic, speedForHeight, G,
} from './hm-vfx.js';

const rad = (d) => (d * Math.PI) / 180;

/* Wet stone. The kit's slate at spring-side wetness — one material, cloned
   per family so a family can darken its own rock without touching the rest. */
function wetRock(name, tint) {
  const m = MAT.wetSlate.clone();
  m.name = 'wet-rock-' + name;
  if (tint) m.color = new THREE.Color(tint);
  m.roughness = 0.34;
  return m;
}

/* Aerated water thrown off an impact — spray, churn, splash. Additive at low
   gain: this is backlit air in water, the brightest thing water gets to be.
   `v0` is a real launch speed in m/s and the arc is real projectile motion,
   so the height a splash reaches is a consequence of how hard it was thrown
   rather than a number that looked right. */
function droplets(o) {
  const life = o.life || 1.5;
  const b = ballistic(o.v0 != null ? o.v0 : 2, life);
  const pts = gpuPoints({
    name: o.name || 'droplets',
    count: o.count, size: o.size || 0.05, life,
    texture: o.streak ? 'streak' : 'glow',
    colA: o.colA || 'bone', colB: o.colB || 'focusBright',
    gain: o.gain != null ? o.gain : 1.5,
    opacity: o.opacity != null ? o.opacity : 0.6,
    rand: o.rand, radius: o.radius || 8, cull: o.cull,
    spawn: o.spawn,
    p1: b.rise, p2: o.spread || 1, p3: b.fall,
    // Horizontal launch is LINEAR in time — nothing pushes a droplet sideways
    // once it has left the water. The wind term is quadratic because drag
    // accelerates the droplet toward the airspeed. Vertical is the ballistic
    // pair, and gravity is deliberately NOT scaled per particle: the launch
    // speed varies between droplets, g does not.
    motion: `vec3(
        (s.x - 0.5) * uP.y * life + uWindDir.x * uWind * life * life * 0.5,
        life * uP.x * (0.55 + s.w * 0.9) - life * life * uP.z,
        (s.z - 0.5) * uP.y * life + uWindDir.y * uWind * life * life * 0.5)`,
    sizeCurve: `(0.4 + s.z * 1.15) * (1.0 - life * 0.45)`,
    alpha: `sin(life * 3.14159) * (0.5 + s.x * 0.5)`,
    colorT: `life * 0.85`,
  });
  pts.userData.apex = b.apex;
  return pts;
}

/* Expanding impact rings on a wet surface. One shader plane, no particles:
   the rings are hashed per grid cell, so a thousand impacts cost one quad.
   Used under rain and under a plunge — the same phenomenon at two rates. */
export function rippleSheet(o = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uCol: { value: pal(o.color || 'focusBright') },
      uRate: { value: o.rate != null ? o.rate : 1 },
      // Cell count is per SHEET, not per metre, so it has to scale with the
      // sheet or the rings come out metres across. A raindrop ring is roughly
      // a third of a metre, hence ~2.6 cells per world unit by default.
      uCells: { value: o.cells != null ? o.cells : Math.max(8, (o.size || 8) * 2.6) },
      uGain: { value: o.gain != null ? o.gain : 0.6 },
      uWidth: { value: o.width != null ? o.width : 0.055 },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv; varying float vFog;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform float uTime, uRate, uCells, uGain, uWidth, uIntensity, uNight;
      uniform vec3 uCol;
      varying vec2 vUv; varying float vFog;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      float rings(vec2 uv, float t, float w){
        vec2 c = floor(uv); vec2 f = fract(uv) - 0.5;
        float h = hash31(vec3(c, 3.1));
        // Each cell fires on its own phase, so impacts are scattered in time.
        float ph = fract(t * uRate * (0.7 + h * 0.6) + h * 7.3);
        float r = ph * 0.48;
        float d = length(f);
        // A ring, not a disc: leading edge bright, interior already collapsed.
        float band = smoothstep(r + w, r, d) - smoothstep(r, r - w * 2.4, d);
        return max(band, 0.0) * (1.0 - ph) * (1.0 - ph);
      }
      void main(){
        // Two grids at different scales — regular impacts never tile visibly.
        float a = rings(vUv * uCells, uTime, uWidth)
                + rings(vUv * uCells * 1.73 + 4.1, uTime * 0.83, uWidth * 1.5) * 0.7;
        a *= uGain * uIntensity * (0.7 + uNight * 0.7);
        // Fade the sheet at its own border so it has no visible edge.
        float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        a *= smoothstep(0.0, 0.16, e);
        if (a < 0.004) discard;
        gl_FragColor = vec4(uCol * 1.6, a * (1.0 - fogFactor(vFog)));
      }`,
  });
  mat.name = 'ripple-sheet';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.name = o.name || 'ripple-sheet';
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(o.size || 8);
  m.position.y = o.y != null ? o.y : 0.02;
  m.renderOrder = 3;
  return m;
}

/* ============================================================== cascade ==
   drop × width × volume × ledges × plunge × spray × basin
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const CASCADE_AXES = { drop: 4, width: 3, volume: 4, ledges: 3, plunge: 3, spray: 3, basin: 2 };
const DROP = [
  { id: 'sill', h: 1.6 },
  { id: 'shelf', h: 3.2 },
  { id: 'ridge', h: 6.0 },
  { id: 'chasm', h: 10.5 },
];
const WIDTH = [
  { id: 'spout', w: 0.55 },
  { id: 'race', w: 1.5 },
  { id: 'sheet', w: 3.2 },
];
const VOLUME = [
  { id: 'veil', v: 0.34, braid: 7, speed: 1.15 },
  { id: 'run', v: 0.62, braid: 5, speed: 1.5 },
  { id: 'flood', v: 1.0, braid: 3.5, speed: 1.9 },
  { id: 'spate', v: 1.38, braid: 2.4, speed: 2.4 },
];

export function cascade(variant = 0, opts = {}) {
  const A = axesOf(variant, CASCADE_AXES);
  const D = DROP[A.drop], W = WIDTH[A.width], V = VOLUME[A.volume];
  const rand = rnd(0x3a71 + variant * 7717);
  const g = new THREE.Group();
  g.name = 'vfx-cascade';
  const scale = opts.scale || 1;
  const H = D.h * scale, WD = W.w * scale;
  const rock = wetRock('cascade-' + variant);

  /* --- the cliff. Water needs a lip to leave; a curtain hanging in air is
     the single thing that makes a waterfall read as a decal. */
  const cliffW = WD * 2.9 + 1.2;
  const cliff = new THREE.BoxGeometry(cliffW, H, 1.5);
  g.add(part(jitter(cliff, 0.24 * scale, rand), rock, 'cliff-face',
    { pos: [0, H / 2, -1.05] }));
  // Lip stone: the fall's leading edge, rounded so the water rolls over it.
  const lip = new THREE.CylinderGeometry(0.3 * scale, 0.36 * scale, cliffW * 0.92, 9, 1);
  g.add(part(jitter(lip, 0.06 * scale, rand), rock, 'lip-stone',
    { pos: [0, H - 0.1 * scale, -0.28], rot: [0, 0, Math.PI / 2] }));

  /* --- the falling sheet, in stages. Each ledge breaks the drop and throws
     its own churn, which is what makes a tall fall read as tall. */
  const stages = A.ledges + 1;
  const segH = H / stages;
  const sheets = [];
  const churns = [];
  // Speed the water crosses the first lip at — a spate arrives faster than a
  // veil. Every later stage inherits a share of what the one above built up:
  // a shelf breaks a fall, it does not stop it.
  const lipV = 0.7 + V.v * 1.5;
  for (let s = 0; s < stages; s++) {
    const top = H - s * segH;
    const w = WD * (1 + s * 0.16);
    const arrive = s === 0 ? lipV : lipV + Math.sqrt(2 * G * segH * s) * 0.38;
    const mat = fallMaterial({
      speed: V.speed * (1 + s * 0.12), braid: V.braid * (1 + s * 0.25),
      sharp: 0.32 + (1 - V.v) * 0.2, volume: V.v,
      height: segH, vel0: arrive,
      // Body sits on --focus, not its bright step: the bright end of the cool
      // ladder at any real gain is a white slab, and the FOAM is what should
      // carry the brightness in falling water.
      body: 'focus', deep: 'deepWater', foamColor: 'bone',
      gain: 0.82 + V.v * 0.2, phase: variant * 2.3 + s * 3.7,
    });
    const sheet = new THREE.Mesh(curtainGeometry({
      w, h: segH * 0.99, curve: 0.75 + V.v * 0.4, spread: 0.16 + V.v * 0.2,
      bow: 0.14, segsW: 16, segsH: 30,
    }), mat);
    sheet.name = 'fall-sheet-' + s;
    sheet.position.set(0, top - segH / 2, s * 0.34 * scale);
    sheet.renderOrder = 5;
    g.add(sheet);
    sheets.push(sheet);

    // Shelf the water lands on, except at the base where the basin takes it.
    if (s < stages - 1) {
      const shelf = new THREE.BoxGeometry(w * 2.1, 0.34 * scale, 1.1 * scale);
      g.add(part(jitter(shelf, 0.08 * scale, rand), rock, 'ledge-' + s,
        { pos: [0, top - segH, s * 0.34 * scale + 0.2] }));
      // Churn at every intermediate impact. Water arriving at this shelf has
      // fallen segH, so it lands at sqrt(2g·segH) and throws a fraction of
      // that back up — which is why a tall fall's ledges spit higher than a
      // short one's without anybody tuning a number.
      const c = droplets({
        name: 'ledge-churn-' + s, count: Math.round(26 * V.v * (1 + A.plunge * 0.5)),
        size: 0.05 * scale, life: 1.1,
        v0: Math.sqrt(2 * G * segH) * 0.32 * (0.6 + V.v * 0.6),
        spread: w * 1.5, rand, radius: w * 4,
        spawn: (i, n, r) => [(r() - 0.5) * w * 1.1, top - segH + 0.2, s * 0.34 * scale + (r() - 0.5) * 0.5],
      });
      g.add(c);
      churns.push(c);
    }
  }
  const baseZ = (stages - 1) * 0.34 * scale;

  /* --- the basin. Boulders or a cut bowl; either way the water needs
     something to break on. */
  if (A.basin === 0) {
    for (let i = 0; i < cnt(9); i++) {
      const r = (0.24 + rand() * 0.4) * scale;
      const b = ico(r, 1);
      b.scale(1.25, 0.75, 1.05);
      const a = (i / 9) * Math.PI * 2 + rand() * 0.7;
      const dist = WD * (1.2 + rand() * 1.1);
      g.add(part(jitter(b, r * 0.28, rand), rock, 'basin-boulder-' + i, {
        pos: [Math.cos(a) * dist, r * 0.45, baseZ + Math.sin(a) * dist * 0.7 + 0.8],
        rot: [rand() * 0.4, rand() * 3, rand() * 0.4],
      }));
    }
  } else {
    g.add(part(lathe([
      [WD * 2.3, 0], [WD * 2.5, 0.34 * scale], [WD * 2.1, 0.42 * scale], [WD * 0.4, 0.06 * scale],
    ], 22), wetRock('basin-' + variant, '#3c4547'), 'cut-basin', { pos: [0, 0, baseZ + 0.7] }));
  }

  /* --- the plunge pool. Flow runs away from the cliff, and the foam edge is
     turned on so the shore line is aerated rather than cut. */
  const pool = waterSurface({
    w: WD * 5.2, h: WD * 4.2 + 2, segs: 44,
    flow: [0, 0.34 + V.v * 0.3], amp: 0.018 + V.v * 0.03, scale: 2.1,
    deep: 'blackwater', shallow: 'deepWater',
    glow: 0.42 + V.v * 0.3, foam: 0.5 + V.v * 0.34, edge: 0.5,
    spec: 1.15, caustic: 0.4, opacity: 0.95,
    reflect: !!opts.reflect, name: 'plunge-pool',
  });
  pool.position.set(0, 0.05 * scale, baseZ + WD * 1.7 + 1.1);
  g.add(pool);

  /* --- the plunge itself: churn, then the rings that spread off it. The
     churn's launch speed comes from the impact speed of the whole drop, so a
     chasm boils and a sill merely ripples. */
  let plunge = null, rings = null;
  const impactV = Math.sqrt(2 * G * H);
  if (A.plunge > 0) {
    plunge = droplets({
      name: 'plunge-churn',
      count: Math.round([0, 46, 120][A.plunge] * (0.5 + V.v * 0.8)),
      size: 0.055 * scale * (0.7 + V.v * 0.5), life: 1.35,
      v0: impactV * 0.26 * (0.5 + V.v * 0.7),
      spread: WD * 1.7,
      gain: 1.7, opacity: 0.7, rand, radius: WD * 6,
      spawn: (i, n, r) => [(r() - 0.5) * WD * 1.2, 0.12 * scale, baseZ + 0.5 + (r() - 0.5) * 0.7],
    });
    g.add(plunge);
    rings = rippleSheet({
      name: 'plunge-rings', size: WD * 5, y: 0.075 * scale,
      rate: 1.5 + V.v, gain: 0.5 + V.v * 0.3, color: 'focusBright',
    });
    rings.position.z = baseZ + WD * 1.5 + 0.9;
    g.add(rings);
  }

  /* --- spray. Normal-blended so it occludes the rock behind it: a mist that
     adds light instead of hiding stone reads as a lens flare. */
  let mist = null;
  if (A.spray > 0) {
    mist = softVolume({
      name: 'spray', count: Math.round([0, 10, 20][A.spray] * (0.6 + V.v * 0.5)),
      size: WD * (1.5 + V.v), life: 4.6, rise: 0.7 + V.v * 0.5,
      spread: WD * 2.2, grow: 2.2, opacity: 0.05 + V.v * 0.035,
      colA: 'mist', colB: 'bone', gain: 1.1, drift: 1.3, rand,
      spawn: (i, n, r) => [(r() - 0.5) * WD * 1.6, 0.2 + r() * H * 0.2, baseZ + (r() - 0.5) * 1.4],
    });
    g.add(mist);
  }

  /* --- the glow. A --focus pool on the wet stone: the water lighting the
     rock, which is what sells "lit from within" without a real light. */
  const glow = lightPool({
    radius: WD * 2.6 + 1, color: 'focus',
    gain: (0.24 + V.v * 0.2) * (A.plunge > 0 ? 1.35 : 0.7),
    phase: variant * 1.3, flicker: 0.1, y: 0.03,
  });
  glow.position.z = baseZ + 0.8;
  g.add(glow);

  const declared = {
    drop: D.id, height: +(H).toFixed(2), width: W.id, volume: V.id,
    ledges: A.ledges, stages,
    plunge: ['dry', 'churn', 'boil'][A.plunge],
    spray: ['none', 'veil', 'cloud'][A.spray],
    basin: A.basin === 0 ? 'boulder-field' : 'cut-bowl',
    // Measured off the physics rather than stated: this is what the water is
    // actually doing when it hits the pool.
    impactSpeed: +impactV.toFixed(1) + ' m/s',
    fallTime: +Math.sqrt((2 * H) / G).toFixed(2) + ' s',
    churnApex: plunge ? +plunge.userData.apex.toFixed(2) + ' m' : 'n/a',
  };
  return {
    group: g, declared,
    reflect: opts.reflect ? { mesh: pool, y: pool.position.y } : null,
    update() {},
    set(k, v) {
      if (k === 'volume') sheets.forEach((s) => { s.material.uniforms.uVolume.value = V.v * v; });
      if (k === 'spray' && mist) mist.children[0].material.uniforms.uOpacity.value = (0.05 + V.v * 0.035) * v;
      if (k === 'glow') {
        glow.material.uniforms.uGain.value = (0.24 + V.v * 0.2) * v;
        pool.material.uniforms.uGlow.value = (0.42 + V.v * 0.3) * v;
      }
      if (k === 'churn' && plunge) plunge.material.uniforms.uOpacity.value = 0.7 * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================== channel ==
   width × grade × flow × bed × banks × riffle × weir
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const CHANNEL_AXES = { width: 4, grade: 3, flow: 4, bed: 3, banks: 3, riffle: 3, weir: 2 };
const GRADE = [
  { id: 'level', tilt: 0.0, chop: 0.6 },
  { id: 'falling', tilt: 0.05, chop: 1.0 },
  { id: 'steep', tilt: 0.12, chop: 1.6 },
];
const FLOW = [
  { id: 'seep', s: 0.12 }, { id: 'creep', s: 0.34 },
  { id: 'run', s: 0.72 }, { id: 'race', s: 1.25 },
];

export function channel(variant = 0, opts = {}) {
  const A = axesOf(variant, CHANNEL_AXES);
  const G = GRADE[A.grade], F = FLOW[A.flow];
  const rand = rnd(0x5c2 + variant * 6217);
  const g = new THREE.Group();
  g.name = 'vfx-channel';
  const scale = opts.scale || 1;
  const W = [0.7, 1.3, 2.2, 3.6][A.width] * scale;
  const L = (opts.length || 14) * scale;
  const rock = wetRock('channel-' + variant);

  /* --- the trough. The bed sits below the water line so the water has a
     depth to tint, which is the whole reason deep water reads as deep. */
  const bedMat = [rock, wetRock('bedrock-' + variant, '#2c3436'), MAT.ash][A.bed];
  const bed = new THREE.PlaneGeometry(W * 1.5, L, cnt(10), cnt(26));
  bed.rotateX(-Math.PI / 2);
  const bp = bed.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i) / (W * 0.75);
    // A channel is a trough: deepest in the middle, and rough with its bed.
    bp.setY(i, -0.34 * scale * (1 - x * x) + (rand() - 0.5) * (A.bed === 1 ? 0.02 : 0.08) * scale);
  }
  bp.needsUpdate = true;
  bed.computeVertexNormals();
  g.add(part(bed, bedMat, 'channel-bed'));

  // Bed cobbles — the silhouette difference between the three bed types.
  if (A.bed === 0) {
    for (let i = 0; i < cnt(22); i++) {
      const r = (0.06 + rand() * 0.1) * scale;
      const c = ico(r, 0);
      c.scale(1.3, 0.6, 1.1);
      g.add(part(c, rock, 'cobble-' + i, {
        pos: [(rand() - 0.5) * W * 1.2, -0.28 * scale + rand() * 0.08, (rand() - 0.5) * L],
        rot: [0, rand() * 3, 0],
      }));
    }
  }

  /* --- banks */
  for (const side of [-1, 1]) {
    if (A.banks === 0) {
      const kerb = new THREE.BoxGeometry(0.42 * scale, 0.5 * scale, L);
      g.add(part(jitter(kerb, 0.05 * scale, rand), rock, 'kerb-' + (side < 0 ? 'l' : 'r'),
        { pos: [side * (W * 0.75 + 0.21 * scale), 0.1 * scale, 0] }));
    } else if (A.banks === 1) {
      for (let i = 0; i < cnt(24); i++) {
        const h = (0.3 + rand() * 0.45) * scale;
        const blade = new THREE.PlaneGeometry(0.05 * scale, h, 1, 2);
        const p = blade.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = (p.getY(v) + h / 2) / h;
          p.setX(v, p.getX(v) * (1 - t * 0.7));
          p.setZ(v, t * t * 0.1 * scale);
        }
        p.needsUpdate = true;
        blade.computeVertexNormals();
        g.add(part(blade, MAT.reedPale, 'reed-' + side + '-' + i, {
          pos: [side * (W * 0.78 + rand() * 0.4 * scale), h / 2 - 0.05, (rand() - 0.5) * L],
          rot: [0, rand() * 3, side * 0.12],
        }));
      }
    } else {
      const mud = new THREE.BoxGeometry(0.7 * scale, 0.22 * scale, L);
      g.add(part(jitter(mud, 0.09 * scale, rand), MAT.firedClay, 'mud-bank-' + (side < 0 ? 'l' : 'r'),
        { pos: [side * (W * 0.8 + 0.35 * scale), 0.02 * scale, 0] }));
      for (let i = 0; i < cnt(6); i++) {
        g.add(part(ico(0.1 * scale, 0), MAT.graveMoss, 'bank-moss-' + side + '-' + i,
          { pos: [side * (W * 0.8 + rand() * 0.5 * scale), 0.1 * scale, (rand() - 0.5) * L] }));
      }
    }
  }

  /* --- the running surface */
  const surf = waterSurface({
    w: W * 1.52, h: L, segs: 52,
    flow: [0, F.s], amp: (0.012 + F.s * 0.035) * G.chop, scale: 2.4 + F.s,
    deep: 'deepWater', shallow: 'springWater',
    glow: 0.4 + F.s * 0.25, foam: 0.28 + F.s * 0.4 * G.chop,
    spec: 1.2, caustic: 0.5, opacity: 0.9, edge: 0.22,
    reflect: !!opts.reflect, name: 'channel-surface',
  });
  surf.position.y = 0.02 * scale;
  g.add(surf);
  g.rotation.x = -G.tilt;

  /* --- riffle: standing white water where the bed breaks the flow. This is
     behaviour, not decoration — it is what a grade does to a current. */
  let riffle = null;
  if (A.riffle > 0) {
    riffle = droplets({
      name: 'riffle', count: Math.round([0, 40, 110][A.riffle] * (0.4 + F.s)),
      size: 0.035 * scale, life: 0.9,
      v0: 0.9 + F.s * 1.5, spread: W * 0.5,
      gain: 1.5, opacity: 0.55, rand, radius: L,
      spawn: (i, n, r) => [(r() - 0.5) * W * 1.1, 0.06 * scale, (r() - 0.5) * L],
    });
    g.add(riffle);
  }

  /* --- weir: a step. Reuses the fall sheet, so a channel and a cascade are
     the same machinery at different scales. */
  let weir = null;
  if (A.weir) {
    const drop = 0.55 * scale;
    g.add(part(new THREE.BoxGeometry(W * 1.6, drop * 1.6, 0.3 * scale), rock, 'weir-sill',
      { pos: [0, -drop * 0.5, L * 0.18] }));
    const mat = fallMaterial({
      speed: 1.5 + F.s, braid: 3.2, sharp: 0.36, volume: 0.5 + F.s * 0.4,
      height: drop, vel0: 0.5 + F.s * 1.8,
      body: 'focus', deep: 'deepWater', foamColor: 'bone', gain: 0.9, phase: variant,
    });
    weir = new THREE.Mesh(curtainGeometry({
      w: W * 1.4, h: drop, curve: 0.5, spread: 0.1, segsW: 12, segsH: 14,
    }), mat);
    weir.name = 'weir-fall';
    weir.position.set(0, -drop / 2 + 0.02, L * 0.18 + 0.16 * scale);
    g.add(weir);
    g.add(droplets({
      name: 'weir-churn', count: 34, size: 0.04 * scale, life: 1,
      v0: Math.sqrt(2 * G * drop) * 0.4 + 0.4, spread: W * 1.2,
      gain: 1.6, rand, radius: W * 4,
      spawn: (i, n, r) => [(r() - 0.5) * W * 1.1, -drop + 0.1, L * 0.18 + 0.3],
    }));
  }

  const glow = lightPool({
    radius: W * 2.2, color: 'focus', gain: 0.16 + F.s * 0.14, flicker: 0.07, y: 0.06,
  });
  g.add(glow);

  return {
    group: g,
    declared: {
      width: +(W).toFixed(2), grade: G.id, flow: F.id, speed: F.s,
      bed: ['cobbles', 'bedrock', 'silt'][A.bed],
      banks: ['cut-kerb', 'reeds', 'mud'][A.banks],
      riffle: ['glassy', 'broken', 'white'][A.riffle],
      weir: !!A.weir,
    },
    reflect: opts.reflect ? { mesh: surf, y: surf.position.y } : null,
    update() {},
    set(k, v) {
      if (k === 'flow') surf.material.uniforms.uFlow.value.set(0, F.s * v);
      if (k === 'glow') { surf.material.uniforms.uGlow.value = (0.4 + F.s * 0.25) * v; glow.material.uniforms.uGain.value = (0.16 + F.s * 0.14) * v; }
      if (k === 'chop') surf.material.uniforms.uAmp.value = (0.012 + F.s * 0.035) * G.chop * v;
      if (k === 'riffle' && riffle) riffle.material.uniforms.uOpacity.value = 0.55 * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================ stillwater ==
   extent × depth × surface × growth × veil × debris × reflect
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const STILLWATER_AXES = { extent: 4, depth: 3, surface: 4, growth: 3, veil: 3, debris: 3, reflect: 2 };
const SURFACE = [
  { id: 'glass', amp: 0.004, chop: 0.2, foam: 0.0, glow: 0.32 },
  { id: 'breathing', amp: 0.014, chop: 0.5, foam: 0.06, glow: 0.46 },
  { id: 'ruffled', amp: 0.032, chop: 1.0, foam: 0.16, glow: 0.55 },
  { id: 'scummed', amp: 0.01, chop: 0.35, foam: 0.3, glow: 0.26 },
];

export function stillwater(variant = 0, opts = {}) {
  const A = axesOf(variant, STILLWATER_AXES);
  const S = SURFACE[A.surface];
  const rand = rnd(0x571 + variant * 5531);
  const g = new THREE.Group();
  g.name = 'vfx-stillwater';
  const scale = opts.scale || 1;
  const R = [3, 5.5, 9, 15][A.extent] * scale;
  const deepIdx = A.depth;
  const rock = wetRock('mire-' + variant, '#333c3d');

  /* --- the hollow the water sits in. Without a rim the plane reads as a
     sheet laid on the ground rather than water in a depression. */
  const lip = new THREE.RingGeometry(R * 0.94, R * 1.22, cnt(34), 1);
  lip.rotateX(-Math.PI / 2);
  const lp = lip.attributes.position;
  for (let i = 0; i < lp.count; i++) lp.setY(i, (rand() - 0.3) * 0.16 * scale);
  lp.needsUpdate = true;
  lip.computeVertexNormals();
  g.add(part(lip, A.depth === 0 ? MAT.firedClay : rock, 'mire-lip', { pos: [0, 0.02, 0] }));

  for (let i = 0; i < cnt(14); i++) {
    const a = rand() * Math.PI * 2, d = R * (0.98 + rand() * 0.22);
    const r = (0.14 + rand() * 0.3) * scale;
    const b = ico(r, 0);
    b.scale(1.3, 0.55, 1.1);
    g.add(part(jitter(b, r * 0.3, rand), rock, 'shore-stone-' + i,
      { pos: [Math.cos(a) * d, r * 0.2, Math.sin(a) * d], rot: [0, rand() * 3, 0] }));
  }

  /* --- the water. Deep and dark, with the crest glow doing the work: this
     is the family the "glow on the water" note is really about, because a
     still black pool has nothing else to show. */
  const surf = waterSurface({
    w: R * 2, h: R * 2, segs: 56,
    flow: [0.02, 0.012], amp: S.amp * scale, scale: 1.1 + A.extent * 0.2,
    deep: ['deepWater', 'blackwater', 'blackwater'][deepIdx],
    shallow: ['springWater', 'deepWater', 'deepWater'][deepIdx],
    glow: S.glow, glowColor: 'focus',
    foam: S.foam, spec: 0.7, caustic: deepIdx === 0 ? 0.55 : 0.2,
    opacity: [0.86, 0.94, 0.985][deepIdx], edge: 0.3,
    reflect: !!A.reflect, name: 'still-surface',
  });
  surf.position.y = 0.06 * scale;
  g.add(surf);

  /* --- growth */
  if (A.growth === 1) {
    for (let i = 0; i < cnt(40); i++) {
      const a = rand() * Math.PI * 2, d = R * (0.35 + rand() * 0.62);
      const h = (0.5 + rand() * 0.9) * scale;
      const blade = new THREE.PlaneGeometry(0.055 * scale, h, 1, 3);
      const p = blade.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = (p.getY(v) + h / 2) / h;
        p.setX(v, p.getX(v) * (1 - t * 0.75));
        p.setZ(v, t * t * 0.14 * scale);
      }
      p.needsUpdate = true;
      blade.computeVertexNormals();
      g.add(part(blade, MAT.reedPale, 'reed-' + i, {
        pos: [Math.cos(a) * d, h / 2 + 0.02, Math.sin(a) * d], rot: [0, rand() * 3, (rand() - 0.5) * 0.2],
      }));
    }
  } else if (A.growth === 2) {
    for (let i = 0; i < cnt(18); i++) {
      const a = rand() * Math.PI * 2, d = R * rand() * 0.85;
      const pad = new THREE.CircleGeometry((0.16 + rand() * 0.18) * scale, 9, rand() * 3, Math.PI * 1.86);
      pad.rotateX(-Math.PI / 2);
      g.add(part(pad, MAT.graveMoss, 'lily-pad-' + i,
        { pos: [Math.cos(a) * d, 0.075 * scale, Math.sin(a) * d] }));
    }
  }

  /* --- debris on the surface. Changes the break-up, which is why it is an
     axis and the peat tint it replaced was not. */
  if (A.debris === 1) {
    for (let i = 0; i < cnt(26); i++) {
      const a = rand() * Math.PI * 2, d = R * rand() * 0.92;
      const leaf = new THREE.PlaneGeometry(0.11 * scale, 0.07 * scale);
      leaf.rotateX(-Math.PI / 2);
      g.add(part(leaf, MAT.heatherBloom, 'leaf-' + i,
        { pos: [Math.cos(a) * d, 0.068 * scale, Math.sin(a) * d], rot: [0, rand() * 3, 0] }));
    }
  } else if (A.debris === 2) {
    const scum = new THREE.CircleGeometry(R * 0.72, cnt(26));
    scum.rotateX(-Math.PI / 2);
    const sp = scum.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const k = 0.55 + Math.abs(Math.sin(i * 2.3)) * 0.5;
      sp.setX(i, sp.getX(i) * k);
      sp.setZ(i, sp.getZ(i) * k);
    }
    sp.needsUpdate = true;
    const sm = MAT.graveMoss.clone();
    sm.name = 'scum-mat';
    sm.transparent = true;
    sm.opacity = 0.72;
    g.add(part(scum, sm, 'scum-mat', { pos: [0, 0.072 * scale, 0] }));
  }

  /* --- the veil over the water. A mire in the Reach is never clear air. */
  let veil = null;
  if (A.veil > 0) {
    veil = softVolume({
      name: 'mire-veil', count: Math.round([0, 16, 34][A.veil] * (0.6 + A.extent * 0.2)),
      size: R * 0.7, life: 12, rise: 0.1, spread: R * 0.5, grow: 1.4,
      opacity: [0, 0.055, 0.1][A.veil], colA: 'mist', colB: 'moss',
      gain: 1.0, drift: 0.45, rand,
      spawn: (i, n, r) => [(r() - 0.5) * R * 1.7, 0.1 + r() * 0.5 * scale, (r() - 0.5) * R * 1.7],
    });
    g.add(veil);
  }

  const glow = lightPool({
    radius: R * 1.15, color: 'focus', gain: S.glow * 0.28, flicker: 0.05, y: 0.04,
  });
  g.add(glow);

  return {
    group: g,
    declared: {
      extent: +(R * 2).toFixed(1), depth: ['shallow', 'deep', 'unsounded'][A.depth],
      surface: S.id, growth: ['bare', 'reeds', 'lily'][A.growth],
      veil: ['clear', 'haze', 'shroud'][A.veil],
      debris: ['clean', 'leaf-raft', 'scum-mat'][A.debris],
      reflect: A.reflect ? 'planar' : 'stylized',
    },
    reflect: A.reflect ? { mesh: surf, y: surf.position.y } : null,
    update() {},
    set(k, v) {
      if (k === 'glow') { surf.material.uniforms.uGlow.value = S.glow * v; glow.material.uniforms.uGain.value = S.glow * 0.28 * v; }
      if (k === 'surface') surf.material.uniforms.uAmp.value = S.amp * scale * v;
      if (k === 'veil' && veil) veil.children[0].material.uniforms.uOpacity.value = [0, 0.055, 0.1][A.veil] * v;
    },
    ...measureFx(g),
  };
}

/* =============================================================== geyser ==
   vent × period × jet × steam × terrace × pool × surge
   = 3 · 4 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const GEYSER_AXES = { vent: 3, period: 4, jet: 4, steam: 3, terrace: 3, pool: 3, surge: 2 };
const PERIOD = [
  { id: 'constant', t: 0, duty: 1 },
  { id: 'slow', t: 22, duty: 0.24 },
  { id: 'regular', t: 11, duty: 0.34 },
  { id: 'restless', t: 4.5, duty: 0.5 },
];
const JET = [
  { id: 'spit', h: 0.9, n: 60 }, { id: 'plume', h: 2.4, n: 150 },
  { id: 'column', h: 5.5, n: 320 }, { id: 'tower', h: 10, n: 560 },
];

export function geyser(variant = 0, opts = {}) {
  const A = axesOf(variant, GEYSER_AXES);
  const P = PERIOD[A.period], J = JET[A.jet];
  const rand = rnd(0x6e7 + variant * 4831);
  const g = new THREE.Group();
  g.name = 'vfx-geyser';
  const scale = opts.scale || 1;
  const H = J.h * scale;
  const mineral = wetRock('sinter-' + variant, '#7a7a6c');

  /* --- the vent. Three genuinely different silhouettes. */
  let mouthR = 0.3 * scale;
  if (A.vent === 0) {
    // Fissure: a slot in the rock.
    g.add(part(new THREE.BoxGeometry(1.4 * scale, 0.3 * scale, 0.26 * scale), mineral, 'fissure-lip-n',
      { pos: [0, 0.13 * scale, -0.28 * scale] }));
    g.add(part(new THREE.BoxGeometry(1.4 * scale, 0.3 * scale, 0.26 * scale), mineral, 'fissure-lip-s',
      { pos: [0, 0.13 * scale, 0.28 * scale] }));
    mouthR = 0.5 * scale;
  } else if (A.vent === 1) {
    g.add(part(lathe([
      [0.62 * scale, 0], [0.55 * scale, 0.3 * scale], [0.3 * scale, 0.52 * scale], [0.22 * scale, 0.46 * scale],
    ], 18), mineral, 'sinter-cone'));
    mouthR = 0.24 * scale;
  } else {
    g.add(part(cyl(0.3 * scale, 0.36 * scale, 0.7 * scale, 12, 1, true), MAT.pittedIron, 'vent-pipe',
      { pos: [0, 0.35 * scale, 0] }));
    g.add(part(torus(0.33 * scale, 0.04 * scale, 5, 14), MAT.blackIron, 'pipe-collar',
      { pos: [0, 0.7 * scale, 0], rot: [Math.PI / 2, 0, 0] }));
    mouthR = 0.28 * scale;
  }
  const ventY = A.vent === 1 ? 0.5 * scale : A.vent === 2 ? 0.72 * scale : 0.12 * scale;

  /* --- mineral terrace. Sinter builds in steps around a hot spring; the
     terrace count changes the silhouette and how wide the pool reads. */
  if (A.terrace > 0) {
    const steps = [0, 2, 4][A.terrace];
    for (let s = 0; s < steps; s++) {
      const r0 = (1.1 + s * 0.85) * scale;
      const ter = new THREE.RingGeometry(r0, r0 + 0.8 * scale, cnt(24), 1);
      ter.rotateX(-Math.PI / 2);
      const tp = ter.attributes.position;
      for (let i = 0; i < tp.count; i++) tp.setY(i, (rand() - 0.5) * 0.05 * scale);
      tp.needsUpdate = true;
      ter.computeVertexNormals();
      g.add(part(ter, mineral, 'sinter-terrace-' + s, { pos: [0, -s * 0.14 * scale, 0] }));
    }
  }

  /* --- hot pool at the base */
  let pool = null;
  if (A.pool > 0) {
    pool = waterSurface({
      w: [0, 2.6, 5][A.pool] * scale, h: [0, 2.6, 5][A.pool] * scale, segs: 32,
      flow: [0.05, 0.04], amp: 0.012 * scale, scale: 2.2,
      deep: 'deepWater', shallow: 'springWater',
      glow: 0.6, glowColor: 'focusBright', foam: 0.18, spec: 1.4, caustic: 0.6,
      opacity: 0.9, edge: 0.4, name: 'hot-pool',
    });
    pool.position.y = 0.05 * scale;
    g.add(pool);
  }

  /* --- the jet. A real ballistic column: the launch speed is whatever it
     takes to reach the declared height, v0 = sqrt(2gh), and the lifetime is
     the full up-and-down flight time 2v0/g so the water actually comes back
     down. The declared height is therefore MEASURED off the arc rather than
     asserted — a tower vent leaves the throat at 14 m/s because that is what
     ten metres costs. uP.w is the live eruption gate driven by update(). */
  const jetV0 = speedForHeight(H);
  const jetLife = ((2 * jetV0) / G) * 1.05;
  const jet = droplets({
    name: 'geyser-jet', count: J.n, size: 0.05 * scale, life: jetLife,
    v0: jetV0, spread: mouthR * 2.2,
    gain: 1.9, opacity: 0.8, rand, radius: H * 1.6, cull: false, streak: J.h > 4,
    colA: 'bone', colB: 'focusBright',
    spawn: (i, n, r) => [(r() - 0.5) * mouthR, ventY, (r() - 0.5) * mouthR],
  });
  jet.material.uniforms.uP.value.w = 1;
  // Gate the jet on the eruption cycle: alpha folds in uP.w.
  jet.material.fragmentShader = jet.material.fragmentShader.replace(
    'float a = ', 'float a = uP.w * ');
  jet.material.needsUpdate = true;
  g.add(jet);

  /* --- steam. A geyser is mostly steam; the water is the small part. */
  let steam = null;
  if (A.steam > 0) {
    steam = softVolume({
      name: 'geyser-steam', count: [0, 12, 24][A.steam],
      size: mouthR * (5 + J.h), life: 5.5, rise: 1.6 + J.h * 0.16,
      spread: mouthR * 5, grow: 2.2, opacity: [0, 0.05, 0.085][A.steam],
      colA: 'mist', colB: 'bone', gain: 1.1, drift: 1.5, rand,
      spawn: (i, n, r) => [(r() - 0.5) * mouthR, ventY + 0.1, (r() - 0.5) * mouthR],
    });
    g.add(steam);
  }

  const glow = lightPool({
    radius: mouthR * 6 + 1, color: 'focusBright', gain: 0.3, flicker: 0.16, y: 0.04,
  });
  g.add(glow);

  const steamMat = steam ? steam.children[0].material : null;
  const steamBase = steam ? [0, 0.05, 0.085][A.steam] : 0;
  return {
    group: g,
    declared: {
      vent: ['fissure', 'sinter-cone', 'iron-pipe'][A.vent],
      period: P.id, cycleSeconds: P.t || 'continuous', jet: J.id,
      jetHeight: +jet.userData.apex.toFixed(1) + ' m',
      throatSpeed: +jetV0.toFixed(1) + ' m/s',
      flightTime: +jetLife.toFixed(2) + ' s',
      steam: ['dry', 'plume', 'boil'][A.steam],
      terrace: [0, 2, 4][A.terrace], pool: ['none', 'basin', 'spread'][A.pool],
      surge: A.surge ? 'double-pulse' : 'single',
    },
    update(t) {
      // The eruption cycle. A constant vent sits at 1; the others ramp fast,
      // hold for their duty fraction, and fall away slowly.
      let gate = 1;
      if (P.t > 0) {
        const ph = (t % P.t) / P.t;
        const d = P.duty;
        gate = ph < d
          ? Math.min(1, ph / (d * 0.18)) * (1 - Math.max(0, (ph - d * 0.6) / (d * 0.4)) * 0.45)
          : Math.max(0, 1 - (ph - d) / (d * 0.7)) * 0.25;
        if (A.surge) gate *= 1 + Math.sin(t * 4.1) * 0.22;
      }
      jet.material.uniforms.uP.value.w = Math.max(0, gate);
      if (steamMat) steamMat.uniforms.uOpacity.value = steamBase * (0.35 + gate * 0.8);
      glow.material.uniforms.uGain.value = 0.3 * (0.3 + gate);
    },
    set(k, v) {
      // The slider is in HEIGHT, so launch speed moves as its square root:
      // doubling a jet's height costs only 1.41x the throat speed. Scaling v0
      // linearly would make the slider quadratic in height and a small nudge
      // would send the column through the roof.
      if (k === 'jet') jet.material.uniforms.uP.value.x = speedForHeight(H * v) * jetLife;
      if (k === 'steam' && steamMat) steamMat.uniforms.uOpacity.value = steamBase * v;
      if (k === 'glow' && pool) pool.material.uniforms.uGlow.value = 0.6 * v;
    },
    ...measureFx(g),
  };
}

export const WATER_FAMILIES = [
  {
    id: 'hm.vfx.cascade', name: 'Waterfall and cascade', group: 'water',
    axes: CASCADE_AXES, build: cascade, stage: 'cliff', prior: null,
    hero: { drop: 2, width: 1, volume: 2, ledges: 1, plunge: 2, spray: 2, basin: 0 },
    params: [
      { key: 'volume', label: 'Volume', min: 0.2, max: 2, step: 0.05, value: 1 },
      { key: 'churn', label: 'Plunge churn', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'spray', label: 'Spray', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'glow', label: 'Water glow', min: 0, max: 2.6, step: 0.05, value: 1 },
    ],
    note: 'The spring falling off the ridge. Ledges break the drop into stages and each stage throws its own churn \u2014 that is what makes a tall fall read as tall rather than as a long decal.',
  },
  {
    id: 'hm.vfx.channel', name: 'Flowing channel water', group: 'water',
    axes: CHANNEL_AXES, build: channel, stage: 'trough', prior: 'hm-world.js flowWater()',
    hero: { width: 2, grade: 1, flow: 2, bed: 0, banks: 1, riffle: 1, weir: 1 },
    params: [
      { key: 'flow', label: 'Flow speed', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'chop', label: 'Chop', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'riffle', label: 'White water', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'glow', label: 'Water glow', min: 0, max: 2.6, step: 0.05, value: 1 },
    ],
    note: 'Replaces flowWater(): three wave trains with analytic normals instead of two on the vertices, plus depth tint, foam, caustics and the crest glow. Compare mode runs both.',
  },
  {
    id: 'hm.vfx.stillwater', name: 'Still pool and marsh water', group: 'water',
    axes: STILLWATER_AXES, build: stillwater, stage: 'basin', prior: null,
    hero: { extent: 2, depth: 1, surface: 1, growth: 1, veil: 1, debris: 1, reflect: 1 },
    params: [
      { key: 'glow', label: 'Water glow', min: 0, max: 3, step: 0.05, value: 1 },
      { key: 'surface', label: 'Surface motion', min: 0, max: 4, step: 0.05, value: 1 },
      { key: 'veil', label: 'Veil', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'The family the glow note is really about: a still black pool has nothing but its crest sheen to show. Half the variants carry a real planar reflection, half the stylized Fresnel stand-in.',
  },
  {
    id: 'hm.vfx.geyser', name: 'Geyser and hot spring', group: 'water',
    axes: GEYSER_AXES, build: geyser, stage: 'ground', prior: null,
    hero: { vent: 1, period: 2, jet: 2, steam: 2, terrace: 1, pool: 1, surge: 0 },
    params: [
      { key: 'jet', label: 'Jet height', min: 0.2, max: 2.4, step: 0.05, value: 1 },
      { key: 'steam', label: 'Steam', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'glow', label: 'Pool glow', min: 0, max: 2.6, step: 0.05, value: 1 },
    ],
    note: 'Ballistic jet on a stated eruption cycle \u2014 constant, slow, regular or restless, with the period printed in seconds. The gate is live, so a tower vent is genuinely dormant between eruptions.',
  },
];
