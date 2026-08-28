/* Elemental VFX core — the engine the seventeen families are built on.
 *
 * WHY THIS EXISTS
 * The Reach is deliberately dark: near-black grounds, bone type, one gold
 * accent, grain over everything. That reads well and it reads *flat*, because
 * nothing in it is bright. Fire, water, storm and wisp-light are the only
 * places the world is allowed to be vivid, so they carry the whole contrast
 * budget of the frame. This module is built for that job: everything here is
 * authored to feed a bloom pass with real high-dynamic-range values rather
 * than to sit politely inside the sRGB palette.
 *
 * THE COLOUR RULE, STATED
 * No new hues. Every emissive here is a design-system signal token driven
 * past 1.0 in luminance — which is a *value* move, not a hue move, and is
 * exactly what an HDR pipeline is for. The four glow colours are the fauna
 * kit's own rarity ladder (hm-fauna.js GLOW_TIERS): ember, gold-bright,
 * focus, bone-bright. Cinderward's declared vfx rows (worldAssets.js:
 * ember_iron_spark, slag_drip_glow) name the forge palette; hollow_abbey's
 * memory_glyph_drift names the aether one.
 *
 * COUNTING RULE (unchanged from hm-steam.js, tightened by request)
 * An axis counts only if it changes SILHOUETTE or BEHAVIOUR. Seed jitter is
 * never counted. Colour temperature is never counted on its own — where a
 * flame changes colour here it is because the *fuel* axis changed, and fuel
 * also changes flame shape, ember rate and smoke. So the declared numbers are
 * counts of visibly different effects, not of recolours.
 *
 * BUDGETS
 * worldAssets.js WORLD_ASSET_BUDGETS caps a region at 2400 active particles
 * and 18 visible dynamic lights. Every family reports its own particle and
 * light cost, measured, so a scene can be assembled against that ceiling.
 * The lab runs uncapped on purpose; the world does not.
 */
import * as THREE from 'three';

/* ------------------------------------------------------------------ palette
   Each entry names its source. `gain` is the HDR multiplier the shader applies
   before tone mapping — the number that decides whether something merely looks
   orange or actually blinds. */
export const VFX_PALETTE = {
  /* Hot ladder — --blood → --ember → --gold-bright → --bone-bright, climbing. */
  coal:      { hex: '#5a2a17', gain: 0.9, src: 'MAT.ember base, hm-core.js' },
  emberDeep: { hex: '#8c3a18', gain: 1.4, src: '--ember toward --blood' },
  ember:     { hex: '#bd6135', gain: 2.2, src: '--ember (token)' },
  flame:     { hex: '#e08a3a', gain: 3.1, src: '--ember +L, lantern tier' },
  goldBright:{ hex: '#e4c77e', gain: 3.8, src: '--gold-bright (token)' },
  whiteHot:  { hex: '#fff2d0', gain: 5.6, src: '--bone-bright +L, core only' },

  /* Cold ladder — --focus is the system's only cool hue; these are its values. */
  blackwater:{ hex: '#0b1c20', gain: 0.7, src: 'MAT.blackwater, held down' },
  deepWater: { hex: '#12292d', gain: 0.9, src: 'MAT.blackwater (token-derived)' },
  springWater:{hex: '#1b3a36', gain: 1.1, src: 'Living World spring channel' },
  focus:     { hex: '#658e9e', gain: 1.9, src: '--focus (token)' },
  focusBright:{hex: '#9fd0dd', gain: 2.9, src: '--focus +L, veil tier' },
  glacier:   { hex: '#d6f0f7', gain: 4.2, src: '--focus at bone luminance' },
  bone:      { hex: '#e1dbca', gain: 3.4, src: '--bone-bright (token)' },

  /* Veil and marsh — moss and focus, the two hues the mire is allowed. */
  moss:      { hex: '#52665c', gain: 1.2, src: '--moss (token)' },
  wisp:      { hex: '#8fc2ae', gain: 2.6, src: '--moss +L, marsh-light' },

  /* Dead matter — smoke, ash, mist. Never emissive, and never pure grey. */
  smoke:     { hex: '#2a2b28', gain: 0.0, src: 'MAT.ash, held down' },
  ash:       { hex: '#5f5c56', gain: 0.0, src: 'MAT.ash (manifest colour)' },
  mist:      { hex: '#829492', gain: 0.4, src: 'hearthmere kit fog #829492' },
};
export const pal = (k) => new THREE.Color(VFX_PALETTE[k].hex);
export const gainOf = (k) => VFX_PALETTE[k].gain;

/* --------------------------------------------------------------- environment
   One uniform block shared by every material in the kit, so weather, wind and
   time of day move the whole elemental layer at once instead of per effect. */
export const VFX_ENV = {
  uTime: { value: 0 },
  uWind: { value: 1 },            // matches hm-world.js windUniforms.uWind
  uGust: { value: 0.55 },
  uWindDir: { value: new THREE.Vector2(1, 0.35).normalize() },
  uWetness: { value: 0.82 },      // hearthmere kit declares 0.82
  uIntensity: { value: 1 },       // global effect gain, for the lab slider
  uFogColor: { value: new THREE.Color('#0e1518') },
  uFogDensity: { value: 0.0072 }, // FogExp2 density, matched to the scene
  uNight: { value: 0 },           // 0 day … 1 night; raises emissive weight
  /* Climate. One solar direction shared by every material, so water specular,
     heat shimmer and god rays all agree about where the sun is — the single
     commonest tell of a pasted-on effect is a highlight that disagrees with
     the key light. uSeason is the year phase (0 = midwinter, 0.5 = midsummer),
     uHeat drives refractive shimmer, uDust the aerosol load that makes
     crepuscular rays visible at all. */
  uSunDir: { value: new THREE.Vector3(0.42, 0.72, 0.34).normalize() },
  uSunColor: { value: new THREE.Color('#c4d1d4') },
  uSeason: { value: 0.5 },
  uHeat: { value: 0 },
  uDust: { value: 0.1 },
  /* Seasonal state. These live here rather than in hm-vfx-climate.js because
     the water shader below needs them and climate imports THIS file — putting
     them the other way round would be a cycle. applyClimate() writes them. */
  uFreeze: { value: 0 },
  uSnowCover: { value: 0 },
};

export function setVfxEnv(o = {}) {
  for (const k of Object.keys(o)) {
    const u = VFX_ENV['u' + k[0].toUpperCase() + k.slice(1)];
    if (!u) continue;
    if (u.value && u.value.isColor) u.value.set(o[k]);
    else if (u.value && u.value.isVector2) u.value.copy(o[k]);
    else u.value = o[k];
  }
}

/* ------------------------------------------------------------------ quality
   Grid mode puts sixty-plus live instances on screen at once. Shell and
   particle counts scale by this; silhouette and behaviour — the two things the
   axes actually change — survive the reduction, which is why the grid is still
   an honest comparison. */
let QUALITY = 1;
export const setVfxQuality = (q) => { QUALITY = Math.max(0.12, Math.min(1, q)); };
export const vfxQuality = () => QUALITY;
const qn = (n) => Math.max(1, Math.round(n * QUALITY));

/* -------------------------------------------------------------- glsl chunks */
export const NOISE_GLSL = `
float hash31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
                 mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                 mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
float fbm2(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 2; i++){ s += a * vnoise(p); p *= 2.11; a *= 0.5; } return s; }
`;

/* Distance fog applied by hand. ShaderMaterial does not inherit scene.fog
   without pulling in the whole fog include chain, and additive effects need
   fog to *attenuate* them rather than to tint them — a bright ember five
   hundred metres out must go away, not turn grey. */
export const FOG_GLSL = `
uniform vec3 uFogColor; uniform float uFogDensity;
float fogFactor(float d){ float f = d * uFogDensity; return 1.0 - exp(-f * f); }
`;

/* ----------------------------------------------------------------- textures
   Built on a canvas once and shared. A faceted mesh with additive blending
   reads as a grey crystal rather than as light (the finding hm-fauna.js
   already recorded); light needs a soft falloff, so every particle is a
   sprite with a real gradient. */
const texCache = new Map();
export function vfxTexture(kind = 'glow') {
  if (texCache.has(kind)) return texCache.get(kind);
  const s = kind === 'smoke' ? 128 : 96;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const c = cv.getContext('2d');

  if (kind === 'glow' || kind === 'spark') {
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    const tight = kind === 'spark';
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(tight ? 0.14 : 0.24, 'rgba(255,255,255,.72)');
    g.addColorStop(tight ? 0.34 : 0.55, 'rgba(255,255,255,.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  } else if (kind === 'streak') {
    // A rain drop is a stretched highlight, not a dot.
    const g = c.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(255,255,255,.85)');
    g.addColorStop(0.62, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(s * 0.42, 0, s * 0.16, s);
    c.filter = 'blur(2px)';
    c.drawImage(cv, 0, 0);
  } else if (kind === 'flake') {
    // Soft six-lobed blob. A snowflake at ambient scale is a smudge of light.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const g = c.createRadialGradient(
        s / 2 + Math.cos(a) * s * 0.16, s / 2 + Math.sin(a) * s * 0.16, 0,
        s / 2 + Math.cos(a) * s * 0.16, s / 2 + Math.sin(a) * s * 0.16, s * 0.3);
      g.addColorStop(0, 'rgba(255,255,255,.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, s, s);
    }
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.26);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, s, s);
  } else if (kind === 'smoke') {
    // Lumpy alpha: a smoke puff must not read as a soft circle.
    const img = c.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const dx = (x - s / 2) / (s / 2), dy = (y - s / 2) / (s / 2);
        const r = Math.sqrt(dx * dx + dy * dy);
        let n = 0, amp = 0.5, f = 3.1;
        for (let o = 0; o < 4; o++) {
          n += amp * (Math.sin(dx * f + o * 2.1) * Math.cos(dy * f * 1.13 + o * 1.7) * 0.5 + 0.5);
          amp *= 0.5; f *= 2.07;
        }
        const a = Math.max(0, 1 - r) * (0.45 + n * 0.75);
        const i4 = (y * s + x) * 4;
        img.data[i4] = img.data[i4 + 1] = img.data[i4 + 2] = 255;
        img.data[i4 + 3] = Math.min(255, a * 255);
      }
    }
    c.putImageData(img, 0, 0);
  }
  const t = new THREE.CanvasTexture(cv);
  t.name = 'vfx-' + kind;
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(kind, t);
  return t;
}

/* ------------------------------------------------------- GPU particle system
   All motion is authored in the vertex shader against a per-particle seed, so
   ten thousand embers cost the CPU one uniform write per frame. `motion` is a
   GLSL expression returning a vec3 offset; `alpha`, `sizeCurve` and `colorT`
   are expressions in `life` (0→1) and the seed. This is the whole reason a
   family can afford thousands of particles inside a 2400 ceiling: the ceiling
   is about *visible* particles, and these are cheap ones. */
export function gpuPoints(o) {
  const N = qn(o.count || 200);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N * 4);
  let r = o.rand || Math.random;
  for (let i = 0; i < N; i++) {
    const s = o.spawn ? o.spawn(i, N, r) : [0, 0, 0];
    pos[i * 3] = s[0]; pos[i * 3 + 1] = s[1]; pos[i * 3 + 2] = s[2];
    seed[i * 4] = r(); seed[i * 4 + 1] = r(); seed[i * 4 + 2] = r(); seed[i * 4 + 3] = r();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geo.computeBoundingSphere();
  geo.boundingSphere.radius = Math.max(geo.boundingSphere.radius, o.radius || 6);

  const uni = Object.assign({
    uTime: VFX_ENV.uTime, uWind: VFX_ENV.uWind, uGust: VFX_ENV.uGust,
    uWindDir: VFX_ENV.uWindDir, uIntensity: VFX_ENV.uIntensity,
    uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
    uTex: { value: vfxTexture(o.texture || 'glow') },
    uSize: { value: o.size || 0.08 },
    uLife: { value: o.life || 2 },
    uColA: { value: pal(o.colA || 'goldBright') },
    uColB: { value: pal(o.colB || 'ember') },
    uGain: { value: o.gain != null ? o.gain : 2.4 },
    uOpacity: { value: o.opacity != null ? o.opacity : 0.9 },
    uSpin: { value: o.spin || 0 },
    uP: { value: new THREE.Vector4(o.p1 || 0, o.p2 || 0, o.p3 || 0, o.p4 || 0) },
  }, o.uniforms || {});

  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: false,
    blending: o.blending === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending,
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uTime, uSize, uLife, uWind, uGust, uIntensity;
      uniform vec2 uWindDir; uniform vec4 uP;
      varying float vLife; varying vec4 vSeed; varying float vFog;
      ${NOISE_GLSL}
      void main(){
        vec4 s = aSeed;
        float sp = ${o.rateSpread != null ? o.rateSpread : '0.6 + s.w * 0.85'};
        float life = fract(uTime / max(uLife, 0.02) * sp + s.y);
        vec3 off = ${o.motion || 'vec3(0.0, life * 2.0, 0.0)'};
        vec3 p = position + off;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vLife = life; vSeed = s; vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
        float sc = ${o.sizeCurve || '1.0'};
        // Perspective point size, CLAMPED. The naive form is size * (340/-z),
        // and -z goes to zero for any particle level with the camera plane —
        // which makes one ember a screen-filling sprite that the tone mapper
        // then desaturates to a white smear. Particles behind the near plane
        // are dropped outright rather than wrapped to a huge size.
        float zd = -mv.z;
        gl_PointSize = zd < 0.12 ? 0.0
          : min(uSize * sc * uIntensity * (340.0 / zd), 190.0);
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform vec3 uColA, uColB;
      uniform float uGain, uOpacity, uSpin, uIntensity, uTime;
      uniform vec4 uP;
      varying float vLife; varying vec4 vSeed; varying float vFog;
      ${FOG_GLSL}
      void main(){
        // The authored expressions below are written against the vertex stage's
        // names, because that is where the motion is authored. Aliasing them
        // here lets ONE expression string be valid in both stages — without it
        // every alpha and colorT in the kit references an undeclared 'life'
        // and the whole family silently fails to compile.
        float life = vLife;
        vec4 s = vSeed;
        vec2 uv = gl_PointCoord - 0.5;
        if (uSpin != 0.0){ float a = uSpin; uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv; }
        vec4 t = texture2D(uTex, uv + 0.5);
        float a = ${o.alpha || 'sin(vLife * 3.14159)'};
        vec3 c = mix(uColA, uColB, clamp(${o.colorT || 'vLife'}, 0.0, 1.0));
        float fog = 1.0 - fogFactor(vFog);
        gl_FragColor = vec4(c * uGain, t.a * clamp(a, 0.0, 1.0) * uOpacity * fog);
        if (gl_FragColor.a < 0.004) discard;
      }`,
  });
  mat.name = 'vfx-points-' + (o.name || 'generic');
  const pts = new THREE.Points(geo, mat);
  pts.name = 'vfx-' + (o.name || 'points');
  pts.frustumCulled = o.cull !== false;
  pts.userData.particles = N;
  return pts;
}

/* ------------------------------------------------------------------- flame
   Not a particle system pretending to be fire, and not a billboard: a stack
   of open cylindrical shells, each eroded by its own scrolling fbm and tinted
   by a temperature ramp. Additively blended, the shells sum where they
   overlap, so the middle of the fire runs far past 1.0 and the bloom pass
   turns it into light. That summing is the whole effect — a single shell at
   any brightness reads as orange cellophane. */
function flameMaterial(o) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uWind: VFX_ENV.uWind, uGust: VFX_ENV.uGust,
      uWindDir: VFX_ENV.uWindDir, uIntensity: VFX_ENV.uIntensity,
      uNight: VFX_ENV.uNight,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uPhase: { value: o.phase || 0 },
      uRise: { value: o.rise || 1.1 },
      uSharp: { value: o.sharp || 0.34 },
      uVigour: { value: o.vigour || 1 },
      uCore: { value: pal(o.core || 'whiteHot') },
      uMid: { value: pal(o.mid || 'flame') },
      uEdge: { value: pal(o.edge || 'emberDeep') },
      uGain: { value: o.gain || 2.6 },
      uSway: { value: o.sway || 1 },
      uSquash: { value: o.squash || 0.32 },
      uDetail: { value: o.detail || 2.6 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uPhase, uWind, uGust, uSway, uVigour, uSquash;
      uniform vec2 uWindDir;
      varying vec2 vUv; varying vec3 vNrm; varying vec3 vView; varying float vFog;
      void main(){
        vUv = uv;
        float h = uv.y;
        vec3 p = position;
        float t = uTime * 2.7 * uVigour + uPhase;
        // Taper: a flame is a tongue, not a cone. Wider at the shoulder,
        // pinched hard at the tip.
        float taper = mix(1.05, 0.16, pow(h, 0.78));
        p.xz *= taper;
        // Wander, rising with height so the base stays anchored to its fuel.
        float w = h * h;
        p.x += (sin(t + h * 4.6) * 0.6 + sin(t * 2.13 + h * 8.2) * 0.24) * w * 0.34 * uSway;
        p.z += (cos(t * 1.27 + h * 3.9) * 0.55 + sin(t * 1.9 + h * 7.1) * 0.2) * w * 0.3 * uSway;
        // Wind leans the column and a gust flattens it.
        float lean = (uWind * 0.5 + uGust * max(sin(uTime * 0.6 + uPhase), 0.0) * 0.9);
        p.x += uWindDir.x * lean * w * 0.72;
        p.z += uWindDir.y * lean * w * 0.72;
        // Breath: the whole body stretches and drops. Incommensurate rates so
        // it never pulses on a beat.
        p.y *= 1.0 + (abs(sin(t * 0.42 + uPhase)) * 0.3 + abs(sin(t * 0.91)) * 0.16) * uSquash;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNrm = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime, uPhase, uRise, uSharp, uGain, uIntensity, uVigour, uDetail, uNight;
      uniform vec3 uCore, uMid, uEdge;
      varying vec2 vUv; varying vec3 vNrm; varying vec3 vView; varying float vFog;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      void main(){
        float h = vUv.y;
        // Two noise fields at different scales and speeds, scrolling up. The
        // slow one is the body of the flame, the fast one is the flicker.
        vec3 q = vec3(vUv.x * uDetail * 3.0, vUv.y * uDetail - uTime * uRise * 1.9 * uVigour, uPhase);
        float n = fbm(q);
        float n2 = fbm2(q * 2.7 + vec3(0.0, -uTime * uRise * 3.4, 3.1));
        // The field has to CROSS ZERO inside the body, not just near the tip.
        // Centring the noise on its own mean and giving it a wide gain is what
        // erodes the shell into separate tongues; a large positive constant
        // here instead leaves alpha at 1 everywhere and the cylinder's own
        // cone silhouette shows through as a hard-edged triangle.
        float d = (n - 0.46) * 3.4 + (n2 - 0.5) * 1.4 - h * h * 1.5 - h * 0.4 + 0.32;
        // Erode the tip into separate tongues rather than fading the whole top.
        d -= smoothstep(0.55, 1.0, h + n * 0.34) * 0.5;
        float a = smoothstep(0.0, uSharp, d);
        if (a <= 0.002) discard;
        // Rim weighting fakes volume: the silhouette of a shell is where the
        // eye would see the most gas. Damped toward the tip, so a tongue ends
        // in dark gas rather than in white.
        float rim = pow(1.0 - abs(dot(normalize(vNrm), normalize(vView))), 1.4);
        float body = a * (0.5 + rim * 0.55) * (1.0 - h * 0.42);
        // Temperature: hottest deep in the noise and LOW in the column. The
        // scale matters more than it looks: the field reaches about 1.4 at the
        // base, so a coefficient near 1.0 clamps the whole base to the core
        // colour and the fire becomes a white blob with a flame-shaped edge.
        float temp = clamp(d * 0.55 - h * 0.85 + 0.02, 0.0, 1.0);
        vec3 c = mix(uEdge, uMid, smoothstep(0.05, 0.52, temp));
        c = mix(c, uCore, smoothstep(0.68, 1.0, temp));
        float fog = 1.0 - fogFactor(vFog);
        float gain = uGain * uIntensity * (1.0 + uNight * 0.28);
        gl_FragColor = vec4(c * gain, body * fog);
      }`,
  });
  m.name = 'flame-' + (o.name || 'shell');
  return m;
}

/** A flame body: nested shells, hot inside, cool and ragged outside. */
export function flameColumn(o = {}) {
  const g = new THREE.Group();
  g.name = 'flame-column';
  const shells = qn(o.shells || 4);
  const H = o.height || 1;
  const R = o.radius || 0.3;
  const ramp = o.ramp || ['whiteHot', 'goldBright', 'flame', 'ember', 'emberDeep'];
  for (let i = 0; i < shells; i++) {
    const t = shells === 1 ? 0 : i / (shells - 1);
    const geo = new THREE.CylinderGeometry(
      R * 0.1, R * (1 - t * 0.18), H * (1 - t * 0.1), qn(o.seg || 11), qn(o.hseg || 14), true);
    geo.translate(0, H * (1 - t * 0.1) * 0.5, 0);
    const mat = flameMaterial({
      phase: (o.seed || 1) * 3.7 + i * 2.31,
      rise: (o.rise || 1.1) * (1 - t * 0.22),
      vigour: o.vigour || 1,
      sharp: 0.2 + t * 0.3,
      core: ramp[Math.min(i, ramp.length - 1)],
      mid: ramp[Math.min(i + 1, ramp.length - 1)],
      edge: ramp[Math.min(i + 2, ramp.length - 1)],
      // Normalised by shell count, so the TOTAL brightness of the stack is
      // fixed and shells buy detail rather than exposure. Without this,
      // picking six tongues instead of three doubles the brightness of the
      // fire and `tongues` becomes a brightness axis by accident — and six
      // additive oranges sum to white, which loses the hue entirely.
      gain: (o.gain || 2.6) * (1 - t * 0.42) * (1.75 / shells),
      sway: (o.sway || 1) * (0.7 + t * 0.7),
      squash: o.squash,
      detail: (o.detail || 2.6) * (1 + t * 0.4),
      name: 'shell-' + i,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'flame-shell-' + i;
    mesh.scale.setScalar(1 + t * 0.2);
    mesh.renderOrder = 4 + (shells - i);
    g.add(mesh);
  }
  // The white core. Small, and the only thing in the kit allowed near 6× gain.
  if (o.core !== false) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.5, qn(10), qn(8)),
      flameMaterial({
        phase: (o.seed || 1) * 9.1, rise: 2.2, vigour: (o.vigour || 1) * 1.3,
        sharp: 0.5, core: 'whiteHot', mid: 'goldBright', edge: 'flame',
        gain: (o.gain || 2.6) * 1.3, sway: 0.3, squash: 0.5, detail: 4.2, name: 'core',
      }));
    core.name = 'flame-core';
    core.position.y = H * 0.16;
    core.scale.y = 1.5;
    core.renderOrder = 12;
    g.add(core);
  }
  return g;
}

/* -------------------------------------------------------------- light pool
   A flat additive disc under a fire. Eighteen dynamic lights per region is
   not enough for a hold full of braziers, and an unlit ground under a bright
   flame is the single thing that makes fire look pasted on. This is the cheat
   that buys the read for one draw call and no light budget at all. */
export function lightPool(o = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
      uCol: { value: pal(o.color || 'ember') },
      uGain: { value: o.gain || 0.85 },
      uPhase: { value: o.phase || 0 },
      uFlicker: { value: o.flicker != null ? o.flicker : 0.22 },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime, uGain, uIntensity, uPhase, uFlicker, uNight;
      uniform vec3 uCol; varying vec2 vUv;
      void main(){
        float r = length(vUv - 0.5) * 2.0;
        if (r > 1.0) discard;
        float f = 1.0 + sin(uTime * 9.7 + uPhase) * uFlicker + sin(uTime * 23.1 + uPhase * 2.3) * uFlicker * 0.6;
        float a = pow(1.0 - r, 2.6) * uGain * f * uIntensity * (1.0 + uNight * 0.5);
        gl_FragColor = vec4(uCol * (1.0 + uNight * 0.5), a);
      }`,
  });
  mat.name = 'light-pool';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.name = 'light-pool';
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar((o.radius || 3) * 2);
  m.position.y = o.y != null ? o.y : 0.03;
  m.renderOrder = 2;
  return m;
}

/* ------------------------------------------------------- planar reflection
   The near-water half of "reflective near, stylized far". A rigid virtual
   camera below the plane plus a texture matrix that projects world position
   into its clip space — the Reflector approach, which avoids mirroring the
   view matrix and therefore avoids inverting every triangle's winding.
   Costs one extra scene render, so it is opt-in per surface and never used
   on more than the one surface the camera is standing over. */
export class PlanarReflection {
  constructor(size = 512) {
    this.rt = new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType, depthBuffer: true });
    this.rt.texture.name = 'water-reflection';
    this.camera = new THREE.PerspectiveCamera();
    this.matrix = new THREE.Matrix4();
    this.enabled = true;
  }
  update(renderer, scene, camera, planeY, hide = []) {
    if (!this.enabled) return;
    const c = this.camera;
    c.fov = camera.fov; c.aspect = camera.aspect; c.near = camera.near; c.far = camera.far;
    c.position.set(camera.position.x, 2 * planeY - camera.position.y, camera.position.z);
    const look = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      .multiplyScalar(20).add(camera.position);
    c.up.set(0, 1, 0);
    c.lookAt(look.x, 2 * planeY - look.y, look.z);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    this.matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.matrix.multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    const was = hide.map((h) => h.visible);
    hide.forEach((h) => { h.visible = false; });
    // NOTE ON CLIPPING: the textbook fix for a mirrored camera seeing under a
    // single-sided ground is a global clipping plane for this pass. Do not do
    // that here — assigning renderer.clippingPlanes mid-frame changes every
    // material's shader defines, so the whole scene recompiles twice per frame
    // and the page locks up. The host is responsible instead for giving any
    // ground under a reflective surface two sides.
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, c);
    renderer.setRenderTarget(prevTarget);
    hide.forEach((h, i) => { h.visible = was[i]; });
  }
  dispose() { this.rt.dispose(); }
}

/* ------------------------------------------------------------------- water
   Three crossing wave trains on the vertices with analytic normals, then a
   fragment stage doing the four things that actually make water read:
   depth tint, a Fresnel-weighted reflection, a small blown-out specular, and
   foam on the crests. The glow is deliberate and small — a --focus-hued
   emissive that rides the wave tops, which is what gives still black water
   any life at all in a scene with almost no light in it. */
export function waterMaterial(o = {}) {
  const uni = {
    uTime: VFX_ENV.uTime, uWind: VFX_ENV.uWind, uGust: VFX_ENV.uGust,
    uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
    uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
    uFlow: { value: new THREE.Vector2(o.flow ? o.flow[0] : 0.3, o.flow ? o.flow[1] : 0) },
    uAmp: { value: o.amp != null ? o.amp : 0.05 },
    uScale: { value: o.scale != null ? o.scale : 1.6 },
    uDeep: { value: pal(o.deep || 'blackwater') },
    uShallow: { value: pal(o.shallow || 'deepWater') },
    uGlowCol: { value: pal(o.glowColor || 'focus') },
    uGlow: { value: o.glow != null ? o.glow : 0.5 },
    uFoam: { value: o.foam != null ? o.foam : 0.5 },
    uFoamCol: { value: pal('bone') },
    uSpec: { value: o.spec != null ? o.spec : 1 },
    // Ice, shared from the environment so every water surface in a scene
    // freezes together — a pond that ices over while the channel beside it
    // runs free would need to be a per-surface decision, and it never is.
    uFreeze: VFX_ENV.uFreeze,
    uSun: { value: (o.sun ? new THREE.Vector3(...o.sun) : new THREE.Vector3(0.42, 0.72, 0.34)).normalize() },
    uOpacity: { value: o.opacity != null ? o.opacity : 0.94 },
    uRefl: { value: null },
    uReflMatrix: { value: new THREE.Matrix4() },
    uReflStrength: { value: o.reflStrength != null ? o.reflStrength : 0.6 },
    uHasRefl: { value: 0 },
    uEdge: { value: o.edge != null ? o.edge : 0 },
    uCaustic: { value: o.caustic != null ? o.caustic : 0.35 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: uni,
    transparent: true,
    depthWrite: o.depthWrite !== false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime, uAmp, uScale, uWind, uGust, uFreeze;
      uniform vec2 uFlow;
      varying vec3 vWorld; varying vec3 vNrm; varying vec3 vView;
      varying vec2 vUv; varying float vCrest; varying float vFog;
      ${NOISE_GLSL}
      void main(){
        vUv = uv;
        vec3 p = position;
        vec2 dir = normalize(uFlow + vec2(0.0001));
        float sp = length(uFlow);
        float d = dot(p.xz, dir);
        float chop = 1.0 + uWind * 0.35 + uGust * 0.4;
        // Ice damps the surface toward flat — and because the wave trains are
        // advected by uTime, damping the AMPLITUDE alone leaves a frozen sheet
        // with waves visibly travelling under it. The motion has to stop too,
        // which is what the mobile factor below does.
        float mobile = 1.0 - uFreeze * 0.97;
        chop *= 1.0 - uFreeze * 0.93;
        // Downstream train, cross train, and a long slow swell.
        float w1 = sin(d * 2.6 * uScale - uTime * (1.1 + sp * 2.6) * mobile);
        float w2 = sin((p.x * 1.35 + p.z * 1.85) * uScale - uTime * 0.85 * mobile);
        float w3 = sin((p.x * 0.42 - p.z * 0.61) * uScale - uTime * 0.4 * mobile);
        float hgt = (w1 * 0.54 + w2 * 0.3 + w3 * 0.24) * uAmp * chop;
        float rip = (fbm(vec3(p.xz * 1.9 * uScale, uTime * 0.5 * mobile)) - 0.5) * uAmp * 0.7 * chop;
        p.y += hgt + rip;
        // Crest drives the depth tint, the glow and the foam. It has to scale
        // with how much the surface is ACTUALLY moving: taken raw it is just
        // the sine sum, so a glass-still pool gets the same full-contrast
        // banding as a running channel and reads as corrugated tin.
        float rough = clamp(uAmp * uScale * 14.0, 0.0, 1.0);
        vCrest = mix(0.5, (w1 * 0.54 + w2 * 0.3) * 0.5 + 0.5, rough);
        // Analytic normal from the derivative of the same trains — this is
        // what makes the light move rather than the surface merely wobble.
        float dx = cos(d * 2.6 * uScale - uTime * (1.1 + sp * 2.6) * mobile) * 2.6 * dir.x * 0.54
                 + cos((p.x * 1.35 + p.z * 1.85) * uScale - uTime * 0.85 * mobile) * 1.35 * 0.3;
        float dz = cos(d * 2.6 * uScale - uTime * (1.1 + sp * 2.6) * mobile) * 2.6 * dir.y * 0.54
                 + cos((p.x * 1.35 + p.z * 1.85) * uScale - uTime * 0.85 * mobile) * 1.85 * 0.3;
        vec3 n = normalize(vec3(-dx * uAmp * uScale * 6.0, 1.0, -dz * uAmp * uScale * 6.0));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        vNrm = normalize(mat3(modelMatrix) * n);
        vec4 mv = viewMatrix * wp;
        vView = normalize(cameraPosition - wp.xyz);
        vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime, uGlow, uFoam, uSpec, uOpacity, uIntensity, uNight;
      uniform float uReflStrength, uHasRefl, uEdge, uCaustic, uScale, uFreeze;
      uniform vec3 uDeep, uShallow, uGlowCol, uFoamCol, uSun;
      uniform sampler2D uRefl; uniform mat4 uReflMatrix;
      varying vec3 vWorld; varying vec3 vNrm; varying vec3 vView;
      varying vec2 vUv; varying float vCrest; varying float vFog;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      void main(){
        vec3 n = normalize(vNrm);
        vec3 v = normalize(vView);
        // A steep Fresnel keeps the reflection at the grazing edges, which is
        // where water actually mirrors. At a shallow exponent most of the
        // surface is reflection and the pool reads as sheet metal.
        float fres = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 4.2);
        vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 0.85, vCrest));

        // Reflection, distorted by the surface normal. Fresnel-weighted, so
        // the water is black underfoot and mirrors the far bank.
        if (uHasRefl > 0.5){
          vec4 rp = uReflMatrix * vec4(vWorld, 1.0);
          vec2 ruv = rp.xy / max(rp.w, 0.0001) + n.xz * 0.05;
          vec3 refl = texture2D(uRefl, clamp(ruv, 0.002, 0.998)).rgb;
          col = mix(col, refl, clamp(fres * uReflStrength * 1.5, 0.0, 0.55));
        } else {
          // Stylized stand-in: the sky value the reflection would have carried.
          col = mix(col, uShallow * 1.6 + uGlowCol * 0.25, fres * 0.55);
        }

        // Specular. The tight lobe is the sparkle, but on a smooth analytic
        // normal it lands as clean parallel BANDS — water turns into
        // corrugated tin. Gating it through high-frequency noise scatters it
        // into glints, which is what a real surface does with its own
        // sub-wavelength detail. The broad lobe stays tiny for the same reason.
        vec3 hv = normalize(uSun + v);
        float sparkle = smoothstep(0.55, 0.78, fbm2(vec3(vWorld.xz * 24.0, uTime * 1.6)));
        float spec = pow(max(dot(n, hv), 0.0), 220.0) * uSpec * sparkle;
        float glint = pow(max(dot(n, hv), 0.0), 48.0) * uSpec * 0.04;

        // Caustic shimmer, cheap: two counter-scrolling noise fields.
        float ca = fbm2(vec3(vWorld.xz * 1.4 * uScale, uTime * 0.35));
        float cb = fbm2(vec3(vWorld.zx * 1.7 * uScale, -uTime * 0.29));
        float caust = pow(clamp(ca * cb * 3.4, 0.0, 1.0), 2.2) * uCaustic;

        // The glow: --focus riding the crests, lifted at night. Weighted
        // toward the caustic rather than the crest, because a pure crest term
        // is the wave function itself and reads as stripes.
        float crest = smoothstep(0.62, 0.98, vCrest);
        vec3 glow = uGlowCol * (crest * 0.4 + caust * 1.15) * uGlow * (0.4 + uNight * 0.7) * (1.0 - uFreeze);

        // Foam: crest tops and, where declared, the geometry edge.
        float fn = fbm(vec3(vWorld.xz * 3.1, uTime * 0.6));
        float foam = smoothstep(0.72, 0.98, vCrest * 0.75 + fn * 0.45) * uFoam;
        float edge = uEdge * (1.0 - smoothstep(0.0, 0.14, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y))));
        foam = clamp(foam + edge * uFoam, 0.0, 1.0);

        vec3 outc = col + glow + vec3(spec * 1.5 + glint) + uFoamCol * foam * 1.25;

        /* ICE. Three things happen when water freezes, and all three matter:
           the surface goes pale and opaque (light scatters in the crystal
           lattice instead of transmitting into depth); the specular goes broad
           and hard (a rough solid, not a mirror); and the depth glow dies,
           because there is no longer a clear column of water to see into. The
           crust is noise-thresholded so the freeze creeps in from patches
           rather than the whole plane switching state on one frame.
           Open leads survive longest where the flow was fastest \u2014 which is why
           the mask is biased by crest, and why a running channel keeps a dark
           thread down its middle after a still pool has locked up. */
        if (uFreeze > 0.001) {
          float crust = fbm(vec3(vWorld.xz * 1.35, 4.7));
          float lead = smoothstep(0.35, 0.85, uFreeze * 1.35 - crust * 0.5 - vCrest * 0.22);
          vec3 ice = mix(vec3(0.62, 0.71, 0.74), vec3(0.82, 0.89, 0.9), crust);
          // Rime whitens the oldest ice; the tight spec becomes a dull sheen.
          ice += vec3(pow(max(0.0, crust - 0.55), 1.6)) * 0.5;
          outc = mix(outc, ice * (0.55 + uNight * 0.2) + vec3(glint * 0.4), lead);
        }
        outc *= uIntensity;
        float fog = fogFactor(vFog);
        outc = mix(outc, uFogColor, fog);
        // Ice is opaque: you cannot see the bed through it.
        float alpha = mix(uOpacity, 1.0, foam * 0.7);
        gl_FragColor = vec4(outc, mix(alpha, 1.0, uFreeze * 0.85));
      }`,
  });
  m.name = 'vfx-water';
  m.userData.water = true;
  return m;
}

/** Water plane, seated in xz and ready for a reflection to be bound. */
export function waterSurface(o = {}) {
  const geo = new THREE.PlaneGeometry(o.w || 8, o.h || 8, qn(o.segs || 48), qn(o.segs || 48));
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, waterMaterial(o));
  mesh.name = o.name || 'water-surface';
  mesh.userData.reflective = !!o.reflect;
  return mesh;
}

/* ------------------------------------------------------------------ curtain
   The falling-water sheet. A plane bowed forward along its drop so the water
   leaves the lip on a curve instead of hanging like a flag, subdivided fine
   enough vertically for the shader to erode it into braids. */
export function curtainGeometry(o = {}) {
  const w = o.w || 2, h = o.h || 4;
  const g = new THREE.PlaneGeometry(w, h, qn(o.segsW || 18), qn(o.segsH || 34));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    // CLAMPED, and it matters: at the lip this evaluates to a whisker below
    // zero from float error, and Math.pow(-1e-17, 1.7) is NaN. One NaN vertex
    // poisons the bounding sphere, the frustum test, and any Box3 built from
    // the mesh — the whole waterfall silently vanishes and the camera that
    // was framed on it goes to NaN with it.
    const t = Math.min(1, Math.max(0, 1 - (p.getY(i) + h / 2) / h));   // 0 lip → 1 base
    const x = p.getX(i) / (w / 2);
    p.setZ(i, -Math.pow(t, 1.7) * (o.curve != null ? o.curve : 0.9) * h * 0.16
      + Math.cos(x * 1.3) * (o.bow || 0.12) * h * 0.06);
    p.setX(i, p.getX(i) * (1 + t * (o.spread != null ? o.spread : 0.22)));
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

/* ----------------------------------------------------------------- ballistics
   Real projectile motion for anything thrown: spray, sparks, a geyser jet.
   Over a lifetime L seconds at launch speed v0 m/s, height at normalised
   life u = t/L is

       y(u) = v0·L·u − ½g(L·u)²  =  (v0·L)·u − (½gL²)·u²

   so the two coefficients a motion expression needs are exactly v0·L and
   ½gL². Deriving `fall` from anything else is what makes spray hang in the
   air like ash: the arc is the right SHAPE with the wrong g, and the eye
   reads the whole scene as low-gravity rather than as slow. Apex is v0²/2g
   at v0/g seconds — both worth asserting against, because a jet that
   declares a 10 m column and reaches 3 is a lie in the readout. */
export const G = 9.81;
export function ballistic(v0, life) {
  return {
    rise: v0 * life,
    fall: 0.5 * G * life * life,
    apex: (v0 * v0) / (2 * G),
    apexAt: v0 / G,
  };
}
/** Launch speed that reaches a given apex height. The inverse of the above. */
export const speedForHeight = (h) => Math.sqrt(2 * G * Math.max(h, 0));

/** Terminal velocity of a falling particle from the drag balance
    v = sqrt(4ρ_p·g·d / 3·Cd·ρ_air). This is the number that separates rain
    from snow: a 2 mm drop settles at ~6.5 m/s and reaches that speed almost
    at once, so rain falls at a CONSTANT rate and its slant is fixed by
    atan(wind/v). A snowflake is a low-density, high-drag object at ~1 m/s,
    so the SAME wind lays it over five times as far. That one ratio is why a
    blizzard looks horizontal and heavy rain does not. */
export function terminalVelocity(mmDiameter, density = 1000, cd = 0.5) {
  const d = mmDiameter / 1000;
  return Math.sqrt((4 * density * G * d) / (3 * cd * 1.225));
}

/** The falling sheet material: stretched vertical noise, eroded into braids. */
export function fallMaterial(o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity, uNight: VFX_ENV.uNight,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uSpeed: { value: o.speed || 1.6 },
      // The physical drop, in metres, and the speed the water crosses the lip.
      // Both are needed for honest fall physics: the pattern has to accelerate
      // at g, and the sheet has to thin as it does.
      uHeight: { value: o.height != null ? o.height : 3 },
      uVel0: { value: o.vel0 != null ? o.vel0 : 1.2 },
      uBraid: { value: o.braid || 4 },
      uSharp: { value: o.sharp != null ? o.sharp : 0.4 },
      uBody: { value: pal(o.body || 'focusBright') },
      uFoam: { value: pal(o.foamColor || 'bone') },
      uDeep: { value: pal(o.deep || 'focus') },
      uGain: { value: o.gain != null ? o.gain : 0.95 },
      uPhase: { value: o.phase || 0 },
      uVolume: { value: o.volume != null ? o.volume : 1 },
    },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    vertexShader: `
      uniform float uTime, uPhase, uVolume;
      varying vec2 vUv; varying float vFog; varying vec3 vNrm; varying vec3 vView;
      void main(){
        vUv = uv;
        vec3 p = position;
        float t = 1.0 - uv.y;
        // The sheet sways where it is thin and holds where it is heavy.
        p.x += sin(uTime * 1.3 + uPhase + t * 3.4) * t * 0.06 * (1.4 - uVolume);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNrm = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        vFog = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime, uSpeed, uBraid, uSharp, uGain, uIntensity, uPhase, uVolume, uNight;
      uniform float uHeight, uVel0;
      uniform vec3 uBody, uFoam, uDeep;
      varying vec2 vUv; varying float vFog; varying vec3 vNrm; varying vec3 vView;
      ${NOISE_GLSL}
      ${FOG_GLSL}
      void main(){
        float t = 1.0 - vUv.y;                       // 0 lip → 1 base

        /* GRAVITY, done properly.
           Water at depth t on a sheet of height uHeight has fallen s = t*H,
           which took sqrt(2s/g) seconds and left it moving at g*that. So the
           parcel visible here was released from the lip that many seconds ago,
           and advecting the noise by its RELEASE TIME makes the pattern
           accelerate exactly as the water does: bunched and slow at the lip,
           stretched and quick at the base. A uniform scroll cannot do that —
           it gives a fall that moves at one speed for its whole drop.

           THE SIGN. This shader was written from the flame's, where the gas
           RISES and a minus is right. With the minus left in, a feature holds
           its noise coordinate by INCREASING uv.y — and uv.y is up — so the
           whole waterfall ran backwards up the cliff. Falling water advects
           the other way. */
        float fallen = max(t * uHeight, 0.0);
        float fallT = sqrt(2.0 * fallen / 9.81);     // seconds since the lip
        float vel = uVel0 + 9.81 * fallT;            // m/s here
        float adv = (uTime - fallT) * uSpeed;
        vec3 q = vec3(vUv.x * uBraid, adv * 2.2, uPhase);
        // Same rule as the flame: centre the noise on its own mean so the
        // field CROSSES ZERO inside the sheet. Left uncentred this sits
        // positive everywhere and the curtain renders as a solid rectangle
        // with the plane's own straight edges.
        float n = fbm(q * vec3(1.0, 0.42, 1.0));
        float n2 = fbm2(vec3(vUv.x * uBraid * 2.3, adv * 3.6, uPhase + 5.0));
        // Braids: the sheet is thick in channels and torn between them.
        float braid = 0.5 + 0.5 * sin(vUv.x * uBraid * 3.14159 + n * 1.6);
        float d = (n - 0.47) * 2.6 + (n2 - 0.5) * 1.1
                + (braid - 0.5) * 1.1 * uVolume - 0.16 + uVolume * 0.5;
        // CONTINUITY: the same water crossing the lip is spread over more
        // length once it speeds up, so the sheet must thin as it accelerates.
        // This is why a tall fall is a solid rope at the top and a torn veil
        // at the bottom, and it falls straight out of A*v = constant.
        float thin = uVel0 / vel;
        d -= (1.0 - thin) * 0.62 * (1.4 - uVolume);
        float a = smoothstep(0.0, uSharp, d);
        if (a <= 0.003) discard;
        float rim = pow(1.0 - abs(dot(normalize(vNrm), normalize(vView))), 1.6);
        // Aeration: air entrainment scales with velocity, so the fall whitens
        // as it falls rather than being uniformly foamy. Capped well below 1 —
        // a sheet that reaches full bone is an opaque white slab and stops
        // reading as water at all.
        float aer = smoothstep(0.55, 0.05, d) * 0.55
                  + smoothstep(1.0, 11.0, vel) * 0.45;
        vec3 c = mix(uDeep, uBody, smoothstep(0.0, 0.5, d));
        c = mix(c, uFoam, clamp(aer * 0.6, 0.0, 0.72));
        c *= uGain * uIntensity * (1.0 + uNight * 0.35) * (0.8 + rim * 0.5);
        float fog = fogFactor(vFog);
        c = mix(c, uFogColor, fog);
        gl_FragColor = vec4(c, clamp(a * (0.62 + aer * 0.5), 0.0, 1.0) * (1.0 - fog * 0.8));
      }`,
  });
  m.name = 'vfx-fall';
  return m;
}

/* ------------------------------------------------------------- soft volumes
   Mist, smoke and steam are all the same object: a stack of camera-facing
   sprites with lumpy alpha, drifting on the shared wind. Normal-blended, not
   additive — smoke *occludes*, and the contrast between a dark plume and a
   white-hot core is most of why the fire reads as fierce. */
export function softVolume(o = {}) {
  const N = qn(o.count || 24);
  const g = new THREE.Group();
  g.name = o.name || 'soft-volume';
  const tex = vfxTexture('smoke');
  const rand = o.rand || Math.random;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: VFX_ENV.uTime, uWind: VFX_ENV.uWind, uGust: VFX_ENV.uGust,
      uWindDir: VFX_ENV.uWindDir, uIntensity: VFX_ENV.uIntensity,
      uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
      uTex: { value: tex },
      uColA: { value: pal(o.colA || 'smoke') },
      uColB: { value: pal(o.colB || 'ash') },
      uOpacity: { value: o.opacity != null ? o.opacity : 0.3 },
      uLife: { value: o.life || 6 },
      uRise: { value: o.rise != null ? o.rise : 1.2 },
      uSpread: { value: o.spread != null ? o.spread : 0.5 },
      uSize: { value: o.size || 1.2 },
      uGrow: { value: o.grow != null ? o.grow : 2.2 },
      uGain: { value: o.gain != null ? o.gain : 1 },
      uDrift: { value: o.drift != null ? o.drift : 1 },
    },
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
  mat.name = 'soft-volume';
  // One instanced quad set, billboarded in the vertex shader.
  const base = new THREE.PlaneGeometry(1, 1);
  const inst = new THREE.InstancedBufferGeometry();
  inst.index = base.index;
  inst.attributes.position = base.attributes.position;
  inst.attributes.uv = base.attributes.uv;
  const seeds = new Float32Array(N * 4);
  const origins = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    seeds[i * 4] = rand(); seeds[i * 4 + 1] = rand();
    seeds[i * 4 + 2] = rand(); seeds[i * 4 + 3] = rand();
    const s = o.spawn ? o.spawn(i, N, rand) : [0, 0, 0];
    origins[i * 3] = s[0]; origins[i * 3 + 1] = s[1]; origins[i * 3 + 2] = s[2];
  }
  inst.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
  inst.setAttribute('aOrigin', new THREE.InstancedBufferAttribute(origins, 3));
  inst.instanceCount = N;
  mat.vertexShader = `
    attribute vec4 aSeed; attribute vec3 aOrigin;
    uniform float uTime, uLife, uRise, uSpread, uSize, uGrow, uWind, uGust, uDrift;
    uniform vec2 uWindDir;
    varying vec2 vUv; varying float vLife; varying float vSeed; varying float vFog;
    void main(){
      float sp = 0.55 + aSeed.w * 0.9;
      float life = fract(uTime / max(uLife, 0.02) * sp + aSeed.x);
      vec3 o = aOrigin;
      o.y += life * uRise * uLife * 0.55;
      float lat = life * uSpread;
      o.x += sin(aSeed.y * 6.28 + uTime * 0.3) * lat + uWindDir.x * life * uWind * uDrift * 1.6;
      o.z += cos(aSeed.z * 6.28 + uTime * 0.27) * lat + uWindDir.y * life * uWind * uDrift * 1.6;
      vec4 mv = modelViewMatrix * vec4(o, 1.0);
      float s = uSize * (0.5 + aSeed.z * 0.7) * (1.0 + life * uGrow);
      float a = aSeed.y * 6.28 + uTime * (0.1 + aSeed.w * 0.2);
      vec2 q = vec2(position.x, position.y) * s;
      mv.xy += mat2(cos(a), -sin(a), sin(a), cos(a)) * q;
      vUv = uv; vLife = life; vSeed = aSeed.w; vFog = length(mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`;
  mat.fragmentShader = `
    uniform sampler2D uTex; uniform vec3 uColA, uColB;
    uniform float uOpacity, uIntensity, uGain;
    varying vec2 vUv; varying float vLife; varying float vSeed; varying float vFog;
    ${FOG_GLSL}
    void main(){
      vec4 t = texture2D(uTex, vUv);
      float a = t.a * sin(clamp(vLife, 0.0, 1.0) * 3.14159) * uOpacity;
      vec3 c = mix(uColA, uColB, vLife * 0.8 + vSeed * 0.2) * uGain;
      float fog = fogFactor(vFog);
      c = mix(c, uFogColor, fog);
      gl_FragColor = vec4(c, a * (1.0 - fog * 0.6));
      if (gl_FragColor.a < 0.004) discard;
    }`;
  const mesh = new THREE.Mesh(inst, mat);
  mesh.name = (o.name || 'soft') + '-volume';
  mesh.frustumCulled = false;
  mesh.renderOrder = o.renderOrder != null ? o.renderOrder : 3;
  mesh.userData.particles = N;
  g.add(mesh);
  return g;
}

/* ------------------------------------------------------------------- axes
   Same resolver as hm-steam.js: a flat variant index becomes a combination,
   deterministically, so an effect is addressable as (familyId, variant) and
   a screenshot can always be reproduced. */
export function axesOf(index, axes) {
  const out = {};
  let n = Math.max(0, index | 0);
  for (const k of Object.keys(axes)) { out[k] = n % axes[k]; n = Math.floor(n / axes[k]); }
  return out;
}
export const spaceOf = (axes) => Object.values(axes).reduce((a, b) => a * b, 1);

/** Count the parts of an effect the same way the kit measures assets. */
export function measureFx(group) {
  let particles = 0, lights = 0, draws = 0, tris = 0;
  group.traverse((o) => {
    if (o.isLight) lights++;
    if (o.userData && o.userData.particles) particles += o.userData.particles;
    if (o.isMesh || o.isPoints) {
      draws++;
      const g = o.geometry;
      if (g && g.attributes.position) {
        const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
        tris += n * (g.isInstancedBufferGeometry ? (g.instanceCount || 1) : 1);
      }
    }
  });
  return { particles, lights, draws, tris: Math.round(tris) };
}

/** Flicker curve shared by every practical light in the kit: two
 *  incommensurate sines plus a fast term. Reads as combustion. */
export const flicker = (t, phase, depth = 1) =>
  1 + (Math.sin(t * 11.3 + phase) * 0.13 + Math.sin(t * 27.7 + phase * 2.1) * 0.09
    + Math.sin(t * 3.1 + phase * 0.7) * 0.06) * depth;

export { THREE };
