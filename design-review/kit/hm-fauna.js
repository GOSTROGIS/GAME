/* Ambient fauna — the living-environment layer.
 *
 * This is NOT the bestiary. The 178 bestiary entries are encounters: they have
 * ranks, loot tables, telegraph windows and combat roles. Nothing in this file
 * fights, drops anything, or has a health pool. These are the animals that make
 * a region read as inhabited rather than staged — and they are a real gap, not
 * an invention. The region kits in src/data/worldAssets.js already declare the
 * ambient life and then supply no asset for it:
 *
 *   hearthmere    vfx  lantern_moth_sparse        <- moths at the brazier lamps
 *   dunmire       vfx  marsh_light_drifter        <- the drifting lights
 *                 foliage  mire_bird_nest         <- a nest implies a bird
 *   graven_march  audio  no_bird_silence          <- a DELIBERATE absence
 *                 props  trail_snare_old          <- a snare implies quarry
 *   cinderward    vfx  ember_iron_spark, slag_drip_glow
 *   hollow_abbey  vfx  memory_glyph_drift
 *
 * `no_bird_silence` is the important one: the Graven March is authored to have
 * no birds. So the spawn tables below carry a per-region mask and the March
 * masks birds out. An ambient system that ignored that would quietly delete a
 * piece of authored atmosphere.
 *
 * ---------------------------------------------------------------------------
 * ONE LOCOMOTION ENGINE, MANY BODIES
 *
 * Every builder here returns geometry plus a `userData.creature` rig
 * description. It does not contain animation code. `stepCreature()` below is
 * the single engine that walks all of them, which is the same discipline
 * hm-mach2.js applied to machinery: the mechanism is solved, not posed.
 *
 * Four things are actually solved rather than eyeballed:
 *
 *  1. TWO-BONE IK. Each leg is thigh + shin closed-form solved by the law of
 *     cosines onto a foot target. The viewer reports the worst residual
 *     |solved - target| across the visible set; it is not asserted to be zero.
 *
 *  2. PLANTED FEET ARE WORLD-ANCHORED. A foot in stance holds a fixed WORLD
 *     position and the target is converted back into body space every frame.
 *     This is the whole reason the walk does not skate, and it keeps holding
 *     while the animal turns — a body-parameterised foot cycle (foot x = sin t)
 *     slides sideways through every turn, which is the single most common tell
 *     of a fake walk cycle. Skate is measured in millimetres in the viewer.
 *
 *  3. CYCLE FREQUENCY COMES FROM GROUND SPEED. f = v·duty / reach. Nothing
 *     animates on a wall-clock timer, so a stationary animal cannot paddle and
 *     a running one cannot slide. Stop the sim and every foot is still.
 *
 *  4. GAIT TRANSITIONS RUN ON FROUDE NUMBER, Fr = v²/(g·h) with h the hip
 *     height. That is the standard dimensionless predictor of gait change in
 *     the dynamic-similarity literature — walk below ~0.5, trot/run between,
 *     bound or gallop above ~2.5. Standard, and taken as read here rather than
 *     measured, which is why the number is shown in the viewer: a hare bounds
 *     at a lower absolute speed than a hart because it is shorter, and that
 *     falls out of the arithmetic instead of being hand-tuned per species.
 *
 * ---------------------------------------------------------------------------
 * COUNTING RULE, unchanged from hm-steam.js and load-bearing here: an axis
 * counts only if it changes silhouette or material. Seed jitter gives infinite
 * micro-variation and is never counted. GLOW IS NOT AN AXIS — it is a finish,
 * rolled at spawn time like biome and wear, and it is reported separately so it
 * can never inflate the headline. That is the same correction GAP-ANALYSIS-100K
 * already made once for biome × wear; making it again for glow costs nothing
 * and keeps the number honest.
 *
 * Palette: every colour traces to tokens/colors.css or a REGION_ASSET_KITS
 * palette entry in worldAssets.js. No new hues. Fur is bark and ash, feathers
 * are cinderward iron, wing membrane is the patched-cloth red, and the only
 * emissives are the four glow tiers — which are the design system's own signal
 * colours doing exactly what the system says they mean.
 */
import { THREE, rnd, jitter, part, limb, cone, cyl, ico, torus, sg, cnt } from './hm-core.js';
import { axesOf, spaceOf } from './hm-steam.js';

const T = Math.PI * 2;
const G = 9.81;
const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---------- heading convention, stated once ----------
   `agent.heading` IS `root.rotation.y`. A creature is built facing its own
   local +X, so forward in world is (cos h, 0, -sin h) and a local (x, z) maps
   to world (x cos h + z sin h, -x sin h + z cos h).

   Every bearing goes through these three helpers rather than being re-derived
   at the call site. The first version of this file derived it per site and got
   it wrong the same way twice: atan2(dx, dz) is the +Z convention, so the
   animals walked sideways relative to their own bodies and the foot planner
   put every touchdown ninety degrees off — which showed up as a 186 mm IK
   residual rather than as anything obviously broken. */
export const headingTo = (dx, dz) => Math.atan2(-dz, dx);
export const fwdOf = (h, out) => (out || new THREE.Vector3()).set(Math.cos(h), 0, -Math.sin(h));
export function localToWorld(h, lx, lz, out) {
  const c = Math.cos(h), s = Math.sin(h);
  out.x = lx * c + lz * s;
  out.z = -lx * s + lz * c;
  return out;
}

const M = (name, color, rough, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: rough, metalness: 0, ...extra,
  });
  m.name = name;
  return m;
};

/* ---------------------------------------------------------------- materials
   Fur is never black and never warm-bright: the grading pass on this project
   pulls saturation down by .72, so anything authored saturated ends up muddy.
   These are already where that pass wants them. */
export const FAUNA = {
  furDark: M('fur-dark', '#2a2521', 0.94),          // blackpine bark
  furAsh: M('fur-ash', '#4a4238', 0.93),            // ash road packed
  furRust: M('fur-rust', '#5a4234', 0.92),          // kit.timber, warmed
  furPale: M('fur-pale', '#7b7466', 0.93),          // canvas-bone
  furGrey: M('fur-grey', '#5d6360', 0.93),          // kit.stone, cooled
  hide: M('hide', '#3d3328', 0.9),                  // weathered timber
  belly: M('fur-belly', '#8a8272', 0.94),
  hoof: M('hoof', '#24292b', 0.62),                 // --slate/black iron
  antler: M('antler', '#a9a291', 0.86),             // --bone held down
  boneBeak: M('beak', '#8e928b', 0.7),              // --muted
  featherBlack: M('feather-black', '#20262a', 0.86),// cinderward iron
  featherAsh: M('feather-ash', '#3a4140', 0.88),
  featherPale: M('feather-pale', '#6f6c62', 0.89),
  crest: M('crest', '#5d3b39', 0.9),                // ridge heather
  scaleDark: M('scale-dark', '#2b3a31', 0.72),      // blackpine needle
  scaleSilver: M('scale-silver', '#767b76', 0.52),
  scaleWet: M('scale-wet', '#12292d', 0.34),        // still water
  membrane: M('wing-membrane', '#683f37', 0.88, { side: THREE.DoubleSide }),
  chitinBlack: M('chitin-black', '#24292b', 0.58),
  chitinBronze: M('chitin-bronze', '#6b542c', 0.44),
  chitinGlass: M('chitin-glasswood', '#2b3033', 0.36),
  wingDust: M('wing-dust', '#7b7466', 0.9, { side: THREE.DoubleSide, transparent: true, opacity: 0.82 }),
  eye: M('eye-catch', '#b99552', 0.3, { emissive: new THREE.Color('#b99552'), emissiveIntensity: 0.2 }),
  nose: M('nose', '#3a2a28', 0.6),
};

/* ------------------------------------------------------------- glow tiers
   The rarity ladder. Odds are one in N, declared here and shown in the viewer
   next to the observed count so the two can be compared rather than trusted.
   Colours are the design system's signal set used for exactly what it says
   they mean: ember is heat, gold is state, focus is the only cool hue, and the
   top tier is bone — the one thing in this palette that reads as light rather
   than as fire.

   Two families (glowfly, wisp) are lit by nature rather than by this roll;
   they carry their own intensity axis and are excluded from it. */
export const GLOW_TIERS = [
  { id: 'mundane', name: 'Mundane', one_in: 1, color: null, emissive: 0, light: 0, motes: 0,
    note: 'No light. What almost everything is.' },
  { id: 'lantern', name: 'Lantern-touched', one_in: 64, color: '#bd6135', emissive: 0.55, light: 0, motes: 3,
    note: 'A rim of banked heat along the spine. Emissive only \u2014 never takes a dynamic light.' },
  { id: 'bell', name: 'Bell-lit', one_in: 512, color: '#e4c77e', emissive: 1.15, light: 0.55, motes: 6,
    note: 'Gold. Takes a real light if the region\u2019s light budget has one spare.' },
  { id: 'veil', name: 'Veil-lit', one_in: 4096, color: '#658e9e', emissive: 1.5, light: 0.8, motes: 10,
    note: 'The only cool hue in the palette, and the only one that drifts motes upward.' },
  { id: 'hearth', name: 'Hearthlight', one_in: 32768, color: '#e1dbca', emissive: 2.1, light: 1.25, motes: 16,
    note: 'Bone-white. One in thirty-two thousand. The shimmer of hope, and it is rare enough to mean it.' },
];
export const GLOW_BY_ID = Object.fromEntries(GLOW_TIERS.map((g) => [g.id, g]));

/* ---------------------------------------------------------- glow falloff
   One radial-gradient texture, built once and shared by every glow in the kit.
   A faceted icosahedron with additive blending reads as a grey crystal, not as
   light — which is exactly how the first pass looked. Light has a soft edge, so
   the halo is a sprite with a real falloff and the geometry underneath is only
   the small bright core. */
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.13)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  glowTex = new THREE.CanvasTexture(cv);
  glowTex.name = 'glow-falloff';
  return glowTex;
}

/** An additive halo that always faces the camera. */
export function glowSprite(color, size, opacity, name) {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(), color: new THREE.Color(color), transparent: true,
    opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  m.name = name || 'glow-halo';
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.userData.noCast = true;
  s.userData.noShadow = true;
  return s;
}

/** Roll a glow tier for one spawn. Deterministic in `seed`, so a given animal
 *  at a given spot is always the same animal — a rare one does not vanish on
 *  reload, and a screenshot of one can be reproduced. Rarest first, so the
 *  ladder cannot double-count. */
export function rollGlow(seed) {
  const r = rnd(seed >>> 0)();
  let acc = 0;
  for (let i = GLOW_TIERS.length - 1; i >= 1; i--) {
    acc += 1 / GLOW_TIERS[i].one_in;
    if (r < acc) return GLOW_TIERS[i];
  }
  return GLOW_TIERS[0];
}

/** Apply a glow tier to a built creature. Emissive material clones on the
 *  parts the builder marked glowable, plus drifting motes. The dynamic light
 *  is NOT created here: WORLD_ASSET_BUDGETS caps a region at 18 visible
 *  dynamic lights, so the caller grants lights against that budget and this
 *  returns whether one was wanted. Anything refused a light still glows —
 *  it just does not illuminate its surroundings. */
export function applyGlow(group, tier, seed = 1) {
  const c = group.userData.creature;
  if (!c) return null;
  c.glow = tier;
  if (!tier || tier.id === 'mundane') return null;
  const col = new THREE.Color(tier.color);
  const rand = rnd(seed * 7919 + 13);

  for (const mesh of c.glowParts || []) {
    const m = mesh.material.clone();
    m.name = mesh.material.name + '-' + tier.id;
    m.emissive = col.clone();
    m.emissiveIntensity = tier.emissive;
    m.color.lerp(col, 0.32);
    mesh.material = m;
  }

  if (tier.motes) {
    // Mote count scales with the animal. Sixteen motes around a two-centimetre
    // moth is not a lit moth, it is a spark with an insect inside it.
    const bbm = new THREE.Box3().setFromObject(group);
    const sm = bbm.getSize(new THREE.Vector3());
    const small = sm.y < 0.12;
    const n = cnt(small ? Math.max(2, Math.round(tier.motes * 0.3)) : tier.motes);
    const pos = new Float32Array(n * 3);
    const bb = bbm;
    const s = sm;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * s.x * 1.5;
      pos[i * 3 + 1] = s.y * (0.3 + rand() * 1.5);
      pos[i * 3 + 2] = (rand() - 0.5) * s.z * 1.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: col, size: Math.max(s.y * 0.075, 0.016), transparent: true,
      map: glowTexture(), opacity: 0.85, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    });
    mat.name = 'mote-' + tier.id;
    const pts = new THREE.Points(g, mat);
    pts.name = 'glow-motes';
    pts.userData.motes = { base: pos.slice(), rise: tier.id === 'veil' || tier.id === 'hearth' };
    group.add(pts);
    c.motes = pts;
  }
  /* A rim halo, but only for the tiers that carry a light. The first pass put
     one on every glowing thing at 2.2× its own height, and on the small fliers
     that halo IS the animal — a moth, a gnat, a bat and a firefly all reduced to
     the same soft dot. Lantern-touched now shows only its emissive rim, which is
     what "emissive only" was supposed to mean. */
  if (tier.light > 0) {
    const bb2 = new THREE.Box3().setFromObject(group);
    const h = bb2.getSize(new THREE.Vector3()).y;
    const halo = glowSprite(tier.color, Math.min(h * 1.5, 1.1),
      0.06 + tier.emissive * 0.07, 'rim-halo-' + tier.id);
    halo.position.y = h * 0.45;
    group.add(halo);
  }
  return { wantsLight: tier.light > 0, intensity: tier.light, color: tier.color };
}

/* -------------------------------------------------------------------- gaits
   Phase offsets are the real footfall sequences, not four legs on two sine
   waves. `duty` is the fraction of the cycle a foot spends planted, which is
   what actually distinguishes a walk (most feet down, most of the time) from
   a bound (a flight phase with nothing down at all).

   The lateral-sequence walk — left hind, left fore, right hind, right fore —
   is the sequence nearly every quadruped uses at low speed, and getting it
   wrong is visible: a diagonal-sequence walk reads as a camel. */
/* =========================================================================
   MEDIA — WATER, LAND, AIR, AND THE RULES FOR CROSSING BETWEEN THEM

   The first pass had no medium at all. Every creature was placed at
   ground(x,z) + hipHeight and steered inside a circular home range, and a fish
   is a creature whose home range happened to be drawn on top of a pond. Two
   things followed, both wrong and both visible:

     - A fish that wandered past its home radius kept going. It swam out over
       the mud and up the bank, undulating on dry grass, because nothing in the
       engine knew that water had an edge.
     - Even inside the pond it was never IN the water. It rode at bed level plus
       hip height, so its back was above a surface plane it had no relationship
       with.

   The fix is not a fence around the pond. It is to give the world a medium and
   give every family a DECLARED rule about which media it may occupy, then
   enforce that rule in two places — steering, which is what should do the work,
   and a hard clamp, which is the backstop. Both are counted separately, so the
   viewer can show whether the animals are choosing to stay in bounds or being
   shoved back. If the clamp count is high the steering is bad, and hiding that
   behind a clamp that always succeeds would be the dishonest version.

   WATER IS A VOLUME, NOT A PLANE. The host supplies ctx.water with
   depthAt(x,z) and a surfaceY. Depth is what every rule reads, so a sloped bed
   gives a shallow margin and a deep middle for free: the margin genuinely is a
   margin, waders stand in it, fish stay off it, and nobody had to author a
   shoreline polygon.

   WATER CLASSES. Bands are expressed in the creature's OWN dimensions, so one
   table covers a shrew and a hart without a per-species number:

     aquatic      needs a column at least 2.2 body radii deep and may never
                  leave it. This is the fish rule. minDepth > 0 IS the
                  no-exit rule — there is no separate flag doing the work.
     amphibious   any depth, any dry ground. Frog, crab, grass snake.
     wader        dry ground up to 0.85 hip heights of water — belly deep.
                  Deer and the long-legged ground birds.
     terrestrial  dry ground up to 0.22 hip heights — ankle deep, a puddle.
                  Hare, vermin, beetle, spider.
     aerial       exempt. A bird over a pond is not in the pond.

   2.2 body radii is derived, not picked: a fish is held between the bed and the
   surface with 1.05 r of clearance below and 1.15 r above (see stepUndulate),
   which needs 2.2 r of column. The same constant appears in both places because
   it is the same fact.
   ======================================================================= */
export const WATER_CLASS = {
  aquatic: { canLeave: false, swims: true, minD: 2.2, maxD: Infinity },
  amphibious: { canLeave: true, swims: true, minD: 0, maxD: Infinity },
  wader: { canLeave: true, swims: false, minD: 0, maxD: 0.85 },
  terrestrial: { canLeave: true, swims: false, minD: 0, maxD: 0.22 },
  aerial: { canLeave: true, swims: false, minD: 0, maxD: Infinity, ignores: true },
};

/** The water rule for every family, in one place. A per-spec `waterClass`
 *  overrides it, but keeping the declarations in one table is what makes them
 *  reviewable — you can read the whole world's water policy in fifteen lines
 *  instead of hunting through fifteen builders.
 *
 *  Frogs are amphibious rather than waders. The first cut listed them as
 *  margin animals to avoid needing a swimming pose, but a wader's band is
 *  0.85 hip heights and a frog's hip is three centimetres — which made its
 *  legal water a twelve-centimetre ring at the pool rim that it spent every
 *  frame being pushed back into. The rules were fighting the placement. A
 *  frog that floats and paddles when the water is too deep to stand in is both
 *  less code and what frogs do. */
export const WATER_BY_FAMILY = {
  'fauna.hare': 'terrestrial',
  'fauna.deer': 'wader',
  'fauna.vermin': 'terrestrial',
  'fauna.ground-bird': 'wader',
  'fauna.frog': 'amphibious',
  'fauna.serpent': 'amphibious',
  'fauna.beetle': 'terrestrial',
  'fauna.spider': 'terrestrial',
  'fauna.crab': 'amphibious',
  'fauna.moth': 'aerial',
  'fauna.bat': 'aerial',
  'fauna.flyer': 'aerial',
  'fauna.fish': 'aquatic',
  'fauna.glowfly': 'aerial',
  'fauna.wisp': 'aerial',
};

/** The depth band this creature may occupy, in metres, from its own size. */
export function depthBandFor(spec) {
  const cls = spec.waterClass || WATER_BY_FAMILY[spec.family] || 'terrestrial';
  const w = WATER_CLASS[cls] || WATER_CLASS.terrestrial;
  const r = spec.bodyR || spec.hipHeight || 0.1;
  const h = spec.hipHeight || r;
  return {
    cls,
    min: w.minD * r,
    max: w.maxD === Infinity ? Infinity : w.maxD * h,
    canLeave: w.canLeave, swims: w.swims, ignores: !!w.ignores,
  };
}

const depthGrad = (water, x, z, e) => [
  water.depthAt(x + e, z) - water.depthAt(x - e, z),
  water.depthAt(x, z + e) - water.depthAt(x, z - e),
];

/* Steering. Look one stride ahead; if that point is outside the band, turn
   toward the depth gradient that fixes it. This is the part that should do all
   the work — an animal that can see the shore does not need to be stopped by
   it. Turning toward the gradient rather than away from a boundary line is what
   makes a fish follow the contour of a pool instead of pinballing across it. */
export function mediumSteer(c, a, ctx, dt) {
  const band = c.band;
  const water = ctx.water;
  if (!band || band.ignores || !water) return;
  const stride = Math.max(0.22, a.speed * 0.75);
  const ax = a.pos.x + Math.cos(a.heading) * stride;
  const az = a.pos.z - Math.sin(a.heading) * stride;
  const dHere = water.depthAt(a.pos.x, a.pos.z);
  const dAhead = water.depthAt(ax, az);
  // +1 means "I need deeper water", -1 means "I need shallower".
  const need = (d) => (d < band.min ? 1 : d > band.max ? -1 : 0);
  const n = need(dAhead) || need(dHere);
  c.depth = dHere;
  c.medium = dHere > 0.004 ? 'water' : 'land';
  if (!n) return;
  const [gx, gz] = depthGrad(water, a.pos.x, a.pos.z, Math.max(0.12, stride * 0.5));
  if (Math.abs(gx) < 1e-6 && Math.abs(gz) < 1e-6) return;
  const want = headingTo(gx * n, gz * n);
  // Urgency rises as the violation gets worse, so a fish near the bank turns
  // hard and a deer with wet feet only leans.
  const err = n > 0 ? band.min - Math.min(dHere, dAhead) : Math.max(dHere, dAhead) - band.max;
  const urgency = clamp(0.35 + err * 6, 0.35, 1);
  a.desired = angLerp(a.desired, want, Math.min(1, dt * 9 * urgency));
  if (a.state === 'forage') { a.state = 'step'; a.stateT = 1.1; }
}

/* The backstop. Called after the position integrates. A creature that is out
   of band is pushed along the depth gradient; if a few steps of that do not
   fix it, it is returned to the last position where it WAS in band, which is
   the only move guaranteed to be legal. That guarantee is the whole point: a
   fish can only ever be moved back to somewhere it legitimately swam, so it
   cannot end up on the bank no matter how the steering fails. */
export function enforceMedium(c, a, ctx) {
  const band = c.band;
  const water = ctx.water;
  if (!band || band.ignores || !water) return;
  const ok = (d) => d >= band.min - 1e-4 && d <= band.max + 1e-4;
  let d = water.depthAt(a.pos.x, a.pos.z);
  if (ok(d)) {
    a.lastGood.set(a.pos.x, 0, a.pos.z);
    c.outOfMedium = false;
    c.depth = d;
    return;
  }
  const n = d < band.min ? 1 : -1;
  for (let i = 0; i < 10; i++) {
    const [gx, gz] = depthGrad(water, a.pos.x, a.pos.z, 0.1);
    const m = Math.hypot(gx, gz);
    if (m < 1e-7) break;
    a.pos.x += (gx / m) * n * 0.07;
    a.pos.z += (gz / m) * n * 0.07;
    d = water.depthAt(a.pos.x, a.pos.z);
    if (ok(d)) break;
  }
  if (!ok(d)) {
    a.pos.x = a.lastGood.x;
    a.pos.z = a.lastGood.z;
    a.speed = 0;
    c.shoreClamps = (c.shoreClamps || 0) + 1;
  }
  // Reflect the heading off the boundary rather than letting it grind along it.
  const [gx, gz] = depthGrad(water, a.pos.x, a.pos.z, 0.1);
  if (Math.hypot(gx, gz) > 1e-7) a.desired = headingTo(gx * n, gz * n);
  c.outOfMedium = true;
  c.depth = water.depthAt(a.pos.x, a.pos.z);
}

/* =========================================================================
   WINGBEAT FREQUENCY — derived, with the rendering limit stated

   Berg & Rayner (1995) found wingbeat frequency falling with wing length with
   an exponent of 1.055, statistically indistinguishable from Hill's (1950)
   predicted exponent of 1 and clearly distinct from Pennycuick's (1975) 1/2.
   So f is proportional to 1/L_wing, and one anchor fixes the constant: a
   corvid of roughly 0.33 m wing length cruises near 4 Hz.

   Pennycuick's 1990 regression, f = 1.08 m^(1/3) g^(1/2) b^-1 S^(-1/4)
   rho^(-1/3), is the better predictor, but it needs body mass, wing span, wing
   area and air density. We have one measured length and no mass, so using it
   would mean inventing three numbers in order to look more rigorous. The
   simpler law with a stated anchor is the honest choice here.

   RENDERING LIMIT, stated because it is real: the derived frequency for a 2 cm
   moth wing is about 37 Hz, and for a gnat's nearly 200 Hz. At 60 fps anything
   above 30 Hz breaks Nyquist, and even 26 Hz gives 2.3 samples per cycle — a
   hard-edged polygon sweeping at that rate strobes, which looks worse than not
   trying. So the physical frequency is computed and REPORTED, while the
   RENDERED frequency is capped at 12 Hz and the stroke amplitude is cut to 45%
   above the cap. A real wing that fast reads as a shimmer rather than as
   distinct strokes, so a small fast oscillation is closer to what an eye sees
   than a slow full sweep would be. The cap is a display artefact and not a
   claim about moths, which is why both numbers are carried. */
export function wingbeatHz(wingLen) {
  const physical = 4 * (0.33 / Math.max(wingLen, 0.004));
  const aliased = physical > 12;
  return { physical, rendered: Math.min(physical, 12), aliased, ampScale: aliased ? 0.45 : 1 };
}

/* =========================================================================
   PHYSICS SOURCES — every derived law in this engine, and where it comes from.
   The viewer renders this table. A number that cannot name its source is a
   number somebody invented, and the point of keeping the list in code is that
   it cannot drift away from the code that uses it.
   ======================================================================= */
export const PHYSICS_SOURCES = [
  {
    law: 'Fr = v² / (g·h)',
    used: 'Gait selection for every legged family. Hip height h, so a hare and a hart change gait at different speeds without either being tuned.',
    src: 'Dynamic similarity in terrestrial gait — Alexander & Jayes (1983). Walk below Fr≈0.5, run/trot to ≈2.5, bound above.',
  },
  {
    law: 'St = f·A / U  →  stride = A / St',
    used: 'Tail-beat frequency for every swimmer. Because the body wave is driven by distance travelled, setting the wavelength to A/St makes the beat frequency come out at St·U/A on its own.',
    src: 'Strouhal number for undulatory propulsion; efficient cruising falls in St 0.25–0.35, peaking near 0.30 (Triantafyllou et al. 1993). Optimum rises for the smallest swimmers (Eloy 2012, via Lighthill elongated-body theory).',
  },
  {
    law: 'A ≈ 0.15–0.25 L peak-to-peak',
    used: 'Tail amplitude, hence stride length, for every swimmer.',
    src: 'Rohr & Fish (2004): peak-to-peak fluke amplitude normalised by body length lies predominantly in 0.15–0.25 across swimmers.',
  },
  {
    law: 'U = stride × f, stride constant as a fraction of L',
    used: 'Why a swimmer cannot undulate on the spot: distance drives the wave, so zero speed is zero beats.',
    src: 'Bainbridge (1958); Videler & Wardle (1991) — steady swimmers hold a species-specific stride length and tail amplitude as fixed fractions of body length across the whole speed range.',
  },
  {
    law: 'burst ≈ 10 L/s, cruise ≈ 1 L/s',
    used: 'Fish speeds are set in body lengths per second and multiplied by the built length, so a big pike is faster in m/s and slower in L/s than a silverling. Neither number is authored per species.',
    src: 'Videler & Wardle (1991): mean maximum burst 10 L/s. FishBase: burst about ten times sustained.',
  },
  {
    law: 'φ = atan(V·ω / g)',
    used: 'Bank angle in flight. Replaced a hand-picked 0.16 coefficient.',
    src: 'Standard coordinated-turn relation, ω = g·tan(φ)/V — the turn is flown with lift tilted, so the bank follows from speed and turn rate alone.',
  },
  {
    law: 'γ = atan(climb / V)',
    used: 'Pitch in flight. Was previously pitch proportional to speed, which held a bird nose-down in level cruise.',
    src: 'Flight-path angle. Pitch follows the actual climb rate because that is what pitch means.',
  },
  {
    law: 'f ∝ 1 / L_wing',
    used: 'Wingbeat frequency for moth, bat and bird, anchored on a corvid at 0.33 m and 4 Hz.',
    src: 'Berg & Rayner (1995), exponent 1.055; Hill (1950) predicted 1. Rendered frequency capped at 12 Hz with stroke cut to 45% — above that a polygon wing strobes at 60 fps. Both numbers are reported.',
  },
  {
    law: 'v_y(t) = v₀ − g·t',
    used: 'The frog\'s leap. Apex and airtime are consequences of the launch velocity, not authored. Heading is frozen while airborne — there is no ground to push against.',
    src: 'Projectile motion. Airtime 2v₀/g, apex v₀²/2g.',
  },
  {
    law: 'depth band in body radii',
    used: 'Which media a family may occupy. An obligate swimmer needs 2.2 body radii of column, which is exactly the clearance the submerged pose requires.',
    src: 'Internal, and derived rather than picked: 1.05 r below the fish plus 1.15 r above it.',
  },
];

export const GAITS = {
  stand: { duty: 1, lift: 0, minFr: 0, phase: { LF: 0, RF: 0, LH: 0, RH: 0 } },
  walk: { duty: 0.66, lift: 0.16, minFr: 0, phase: { LH: 0.0, LF: 0.25, RH: 0.5, RF: 0.75 } },
  trot: { duty: 0.5, lift: 0.28, minFr: 0.5, phase: { LF: 0.0, RH: 0.0, RF: 0.5, LH: 0.5 } },
  bound: { duty: 0.42, lift: 0.42, minFr: 2.5, phase: { LF: 0.0, RF: 0.06, LH: 0.5, RH: 0.56 } },
  gallop: { duty: 0.34, lift: 0.46, minFr: 2.5, phase: { LH: 0.0, RH: 0.14, LF: 0.44, RF: 0.6 } },
  // Two legs. A bird's walk is the same machinery with the pair in antiphase.
  step2: { duty: 0.62, lift: 0.2, minFr: 0, phase: { L: 0.0, R: 0.5 } },
  run2: { duty: 0.42, lift: 0.34, minFr: 0.6, phase: { L: 0.0, R: 0.5 } },
  // Six legs, alternating tripod: the front and hind of one side move with the
  // middle of the other, so three feet are always down. This is the real
  // insect gait and it is why a beetle never looks unstable.
  tripod: { duty: 0.56, lift: 0.2, minFr: 0, phase: { L1: 0, R2: 0, L3: 0, R1: 0.5, L2: 0.5, R3: 0.5 } },
  // Eight legs, metachronal wave: a travelling sequence down each side.
  wave8: {
    duty: 0.62, lift: 0.16, minFr: 0,
    phase: { L1: 0, L2: 0.25, L3: 0.5, L4: 0.75, R1: 0.5, R2: 0.75, R3: 0.0, R4: 0.25 },
  },
};

/** Froude number, the dimensionless speed that predicts gait change. */
export const froude = (v, hipHeight) => (v * v) / (G * Math.max(hipHeight, 0.02));

/** Pick a gait from the Froude number and the ladder the species declares. */
export function gaitFor(spec, v) {
  const fr = froude(v, spec.hipHeight);
  const ladder = spec.gaits || ['walk', 'trot', 'gallop'];
  let out = ladder[0];
  for (const id of ladder) if (fr >= GAITS[id].minFr) out = id;
  return { id: out, fr };
}

/* ---------------------------------------------------------------- leg rigs */

/** Build one leg as hip -> thigh -> knee -> shin -> ankle -> foot.
 *
 *  The hip group is never rotated: it is a pure attachment offset, so
 *  hip-local space equals body-local space minus the hip position, and the IK
 *  target conversion stays one subtraction instead of a matrix inverse.
 *
 *  `bend` is +1 or -1 and it matters anatomically. A mammal's forelimb folds
 *  back at the carpus and its hindlimb folds forward at the stifle; a bird's
 *  visible knee folds the opposite way to what people expect because the femur
 *  is hidden inside the body. Getting the sign wrong gives you the classic
 *  backwards-dog. */
export function legRig(bodyGroup, o) {
  const hip = new THREE.Group();
  hip.name = 'hip-' + o.key;
  hip.position.set(o.hip[0], o.hip[1], o.hip[2]);
  bodyGroup.add(hip);

  const thigh = new THREE.Group();
  thigh.name = 'thigh-' + o.key;
  hip.add(thigh);
  const upper = new THREE.Mesh(
    new THREE.CapsuleGeometry(o.r1, o.L1 * 0.82, sg(3), sg(7)), o.mat);
  upper.name = 'upper-' + o.key;
  upper.position.y = -o.L1 / 2;
  thigh.add(upper);

  const knee = new THREE.Group();
  knee.name = 'knee-' + o.key;
  knee.position.y = -o.L1;
  thigh.add(knee);
  const lower = new THREE.Mesh(
    new THREE.CapsuleGeometry(o.r2, o.L2 * 0.8, sg(3), sg(6)), o.mat);
  lower.name = 'lower-' + o.key;
  lower.position.y = -o.L2 / 2;
  knee.add(lower);

  const ankle = new THREE.Group();
  ankle.name = 'ankle-' + o.key;
  ankle.position.y = -o.L2;
  knee.add(ankle);

  let foot;
  if (o.foot === 'hoof') {
    foot = new THREE.Mesh(cyl(o.r2 * 1.5, o.r2 * 1.8, o.r2 * 2.4, 7), o.footMat || FAUNA.hoof);
    foot.position.y = -o.r2 * 1.2;
  } else if (o.foot === 'toes') {
    foot = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i - 1) * 0.5;
      const t = new THREE.Mesh(cyl(o.r2 * 0.4, o.r2 * 0.55, o.L2 * 0.5, 5), o.footMat || FAUNA.boneBeak);
      t.rotation.set(Math.PI / 2, a, 0);
      t.position.set(Math.cos(a) * o.L2 * 0.24, 0, Math.sin(a) * o.L2 * 0.24);
      t.name = 'toe-' + o.key + '-' + i;
      foot.add(t);
    }
    const hind = new THREE.Mesh(cyl(o.r2 * 0.35, o.r2 * 0.45, o.L2 * 0.3, 5), o.footMat || FAUNA.boneBeak);
    hind.rotation.set(Math.PI / 2, Math.PI, 0);
    hind.position.set(-o.L2 * 0.14, 0, 0);
    foot.add(hind);
  } else if (o.foot === 'none') {
    foot = new THREE.Group();
  } else {
    foot = new THREE.Mesh(box(o.L2 * 0.5, o.r2 * 1.1, o.r2 * 2.2), o.footMat || o.mat);
    foot.position.set(o.L2 * 0.1, -o.r2 * 0.5, 0);
  }
  foot.name = 'foot-' + o.key;
  ankle.add(foot);

  return {
    key: o.key, hip, thigh, knee, ankle, foot,
    hipPos: new THREE.Vector3(o.hip[0], o.hip[1], o.hip[2]),
    L1: o.L1, L2: o.L2, bend: o.bend ?? 1, side: o.side ?? 1,
    reach: o.reach ?? (o.L1 + o.L2) * 0.42,
    // runtime
    phase: 0, planted: false,
    plant: new THREE.Vector3(), lift: new THREE.Vector3(), next: new THREE.Vector3(),
    world: new THREE.Vector3(), residual: 0, skate: 0,
  };
}

const _t = new THREE.Vector3();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/** Closed-form two-bone IK in the leg's sagittal plane. `t` is the foot target
 *  in BODY space. Returns the residual in metres — the amount by which the
 *  target was out of reach and had to be clamped. Reported, never hidden: a
 *  leg that cannot reach is a real fact about the animal's stride, and the
 *  honest response is to show the number, not to stretch the bone. */
export function solveLeg(leg, t) {
  const dx = t.x - leg.hipPos.x;
  const dy = t.y - leg.hipPos.y;
  const dz = t.z - leg.hipPos.z;
  // Lateral offset is taken by rolling the whole leg about X; the remaining
  // problem is planar, which is what makes the closed form available.
  const roll = Math.atan2(dz, -dy);
  const dyz = Math.hypot(dy, dz);
  const d0 = Math.hypot(dx, dyz);
  const reachMax = (leg.L1 + leg.L2) * 0.995;
  const reachMin = Math.abs(leg.L1 - leg.L2) + 1e-4;
  const d = clamp(d0, reachMin, reachMax);
  const residual = Math.abs(d0 - d);

  const phi = Math.atan2(dx, dyz);
  const cosA = clamp((leg.L1 * leg.L1 + d * d - leg.L2 * leg.L2) / (2 * leg.L1 * d), -1, 1);
  const cosK = clamp((leg.L1 * leg.L1 + leg.L2 * leg.L2 - d * d) / (2 * leg.L1 * leg.L2), -1, 1);
  const A = Math.acos(cosA);
  const K = Math.acos(cosK);

  leg.thigh.rotation.set(0, 0, 0);
  leg.thigh.rotation.x = roll;
  leg.thigh.rotation.z = phi + leg.bend * A;
  leg.knee.rotation.z = -leg.bend * (Math.PI - K);
  // Keep the foot flat to the ground rather than swinging with the shin.
  leg.ankle.rotation.z = -(leg.thigh.rotation.z + leg.knee.rotation.z);
  leg.residual = residual;
  return residual;
}

/** A one-shot standing pose for a creature that will never be stepped \u2014 a
 *  static grid cell in the asset catalogue, a distant background instance, an
 *  export. Without it the legs hang straight and unbent from the hip, which is
 *  the stiffest possible read; with it the same closed-form IK that drives the
 *  walk puts the feet on the ground once. */
/** The tallest the body can stand and still have solvable legs.
 *
 *  A leg cannot hold the body higher than the leg is long. Several builders set
 *  hipHeight at or ABOVE the leg's total segment length: measured at variant 7,
 *  deer overshoots by 41.3 mm, and vermin, ground-bird and frog all land exactly
 *  ON L1+L2. solveLeg clamps reach at 0.995 of the span, so a target at or past
 *  the span can never be met — the knee locks dead straight and the residual is
 *  permanently non-zero, which the panel then reports as an honest "stride out
 *  of reach" when it is really a build-time contradiction.
 *
 *  So body height is a CONSEQUENCE of leg length, not an independent number.
 *  hipHeight stays untouched for everything it legitimately means — Froude
 *  number is a dynamic-similarity length and must keep the real value. This is
 *  only the height the body is carried at. */
export function standHeight(c) {
  if (c._standH != null) return c._standH;
  let minSpan = Infinity;
  for (const l of (c.legs || [])) minSpan = Math.min(minSpan, l.L1 + l.L2);
  c._standH = Number.isFinite(minSpan) ? Math.min(c.hipHeight, minSpan * 0.94) : c.hipHeight;
  return c._standH;
}

export function restPose(group) {
  const c = group.userData.creature;
  if (!c) return group;
  if (c.legs && c.legs.length) {
    const h = standHeight(c);
    for (const leg of c.legs) {
      _t.set(leg.hipPos.x + leg.reach * 0.05, -h, leg.hipPos.z);
      solveLeg(leg, _t);
    }
  }
  if (c.spine && c.spine.length > 1) {
    // A resting coil rather than every segment stacked at the origin.
    for (let i = 0; i < c.spine.length; i++) {
      const s = i / (c.spine.length - 1);
      const lateral = Math.sin(s * Math.PI * 1.7) * c.waveAmp * 0.8;
      c.spine[i].position.set(-s * c.bodyLen, c.hipHeight, lateral);
      c.spine[i].rotation.y = Math.cos(s * Math.PI * 1.7) * 0.55;
    }
  }
  return group;
}

/* ------------------------------------------------------------------- agent
   Vigilance and foraging bouts, not a patrol path. Real small animals spend
   most of their time head-down in one spot, take a few steps, and freeze at
   anything. A creature that walks a constant loop reads as a machine, which is
   the failure this state machine exists to avoid.

   States: forage -> step -> forage, punctuated by alert (freeze, head up) and
   flee (run away from the threat, then resume). */
const STATES = ['forage', 'step', 'alert', 'flee'];

export function makeAgent(spec, seed, home) {
  const rand = rnd(seed >>> 0);
  const a = {
    rand,
    pos: new THREE.Vector3(home?.x ?? 0, 0, home?.z ?? 0),
    home: new THREE.Vector3(home?.x ?? 0, 0, home?.z ?? 0),
    radius: home?.radius ?? 6,
    heading: rand() * T,
    desired: 0,
    speed: 0,
    state: 'forage',
    stateT: rand() * 2.5,
    headT: 0, alertness: 0,
    bob: 0, tailV: 0, tailX: 0, earV: 0, earX: 0, headY: 0, headYV: 0,
    cycle: rand(),
    airborne: false, vy: 0,
    startle: 0,
    lastGood: new THREE.Vector3(home?.x ?? 0, 0, home?.z ?? 0),
  };
  a.desired = a.heading;
  return a;
}

/* Speeds are authored per species in metres per second, then the gait falls
   out of the Froude arithmetic. A hare's 6 m/s is a real hare; the point of
   putting it here is that it is stated, and the gait it produces is derived. */
function pickState(a, spec, ctx) {
  const r = a.rand();
  if (a.state === 'forage') {
    if (r < 0.55) { a.state = 'step'; a.stateT = 0.7 + a.rand() * 2.4; a.desired = a.heading + (a.rand() - 0.5) * 1.7; }
    else { a.state = 'forage'; a.stateT = 1.2 + a.rand() * 3.4; }
  } else if (a.state === 'step') {
    a.state = r < 0.22 ? 'alert' : 'forage';
    a.stateT = a.state === 'alert' ? 0.8 + a.rand() * 1.6 : 1.4 + a.rand() * 3.2;
  } else {
    a.state = 'forage';
    a.stateT = 1 + a.rand() * 2.6;
  }
}

/** One creature, one step. `ctx` carries the shared world: elapsed time, the
 *  ground sampler, and an optional threat position the animals flush from. */
export function stepCreature(group, dt, ctx = {}) {
  const c = group.userData.creature;
  if (!c || !c.agent) return;
  const a = c.agent;
  const spec = c;
  const ground = ctx.groundAt || (() => 0);
  dt = Math.min(dt, 0.05); // a tab that was backgrounded must not teleport anything

  // The engine's one extension point. A hanging bat, a firefly swarm and a
  // drifting marsh light do not locomote in any sense this engine models, and
  // "does not locomote" is not a kind of locomotion — so they bring their own
  // step function rather than adding a dead branch to this one.
  // Every creature gets a band, including the ones that bring their own tick,
  // so the medium readout accounts for all of them instead of silently
  // omitting the roosting bats and drifting wisps.
  if (!c.band) c.band = depthBandFor(c);
  if (c.tickOverride) return c.tickOverride(group, c, a, dt, ctx);

  /* ---- behaviour ---- */
  a.stateT -= dt;
  const threat = ctx.threat;
  if (threat) {
    const d = Math.hypot(threat.x - a.pos.x, threat.z - a.pos.z);
    if (d < (spec.flushRadius || 3.2)) {
      a.state = 'flee';
      a.stateT = Math.max(a.stateT, 0.9 + spec.flushRadius / 4);
      a.desired = headingTo(a.pos.x - threat.x, a.pos.z - threat.z);
      a.startle = 1;
    }
  }
  if (a.stateT <= 0) pickState(a, spec, ctx);
  a.startle = Math.max(0, a.startle - dt * 1.4);

  // Stay in the home range: steer back before the boundary, do not bounce.
  const dHome = Math.hypot(a.pos.x - a.home.x, a.pos.z - a.home.z);
  if (dHome > a.radius * 0.82) {
    const back = headingTo(a.home.x - a.pos.x, a.home.z - a.pos.z);
    const w = clamp((dHome - a.radius * 0.82) / (a.radius * 0.3), 0, 1);
    a.desired = angLerp(a.desired, back, w);
    if (a.state === 'forage') { a.state = 'step'; a.stateT = 1.4; }
  }

  const target =
    a.state === 'flee' ? (spec.speeds?.run ?? 3)
      : a.state === 'step' ? (spec.speeds?.walk ?? 0.7)
        : 0;
  const accel = a.state === 'flee' ? (spec.accel || 8) : (spec.accel || 8) * 0.45;
  a.speed += clamp(target - a.speed, -accel * dt * 2.2, accel * dt);
  a.speed = Math.max(0, a.speed);
  a.alertness += ((a.state === 'alert' || a.state === 'flee' ? 1 : 0) - a.alertness) * Math.min(1, dt * 5);

  /* Stillness is relative to the animal, not an absolute speed — see the walker
     branch below, where this same threshold decides stand versus gait. Declared
     here because the turn rate needs it too. */
  const stillV = (spec.speeds?.walk || 0.7) * 0.15;

  /* Turn rate falls with speed — the reason a fleeing animal runs in an arc
     rather than a corner. But the old form, turnRate/(1 + v·0.55), PEAKS at zero
     speed, so a standing animal could pivot at its full authored rate: measured
     20.29 rad/s on a standing hare, which is 1162° per second. That is what was
     dragging planted feet — the foot holds a fixed world point while the hips
     spin out from under it, and the IK hauls the ankle up to 31 mm in a frame.

     Turning needs traction. An animal with no ground speed has no steps to turn
     on, so the rate is scaled down toward a slow pivot as speed falls. */
  const traction = clamp(a.speed / Math.max(stillV, 1e-3), 0.12, 1);
  const maxTurn = ((spec.turnRate || 2.6) / (1 + a.speed * 0.55)) * traction;
  // The medium gets its say on the desired heading BEFORE the turn is taken,
  // so avoiding the shore costs the same turn rate as any other manoeuvre.
  mediumSteer(c, a, ctx, dt);
  // A body in the air has nothing to push against and cannot change heading.
  // Letting a frog steer mid-leap was the one place the engine broke Newton.
  const dh = wrapPi(a.desired - a.heading);
  if (!a.airborne) a.heading += clamp(dh, -maxTurn * dt, maxTurn * dt);

  const fwd = fwdOf(a.heading);
  // Hop and wisp modes integrate their own position (ballistic and drifting
  // respectively), so the shared integrator must not also move them.
  if (spec.locomotion !== 'hop') a.pos.addScaledVector(fwd, a.speed * dt);
  enforceMedium(c, a, ctx);

  /* ---- locomotion ---- */
  const mode = spec.locomotion;
  if (mode === 'flyer' || mode === 'flutter') return stepFlyer(group, c, a, dt, ctx);
  if (mode === 'undulate') return stepUndulate(group, c, a, dt, ctx);
  if (mode === 'hop') return stepHop(group, c, a, dt, ctx);

  const root = c.root;
  const bodyG = c.bodyG;
  root.position.set(a.pos.x, ground(a.pos.x, a.pos.z), a.pos.z);
  root.rotation.y = a.heading;

  /* STILLNESS IS RELATIVE TO THE ANIMAL, not an absolute speed.

     This threshold was 0.12 m/s flat, and the shipped walk speeds are spider
     0.042, beetle 0.06, crab 0.09 — all UNDER it. Those three families took the
     standing branch on every frame of their lives: the wave8 and tripod gaits
     were unreachable, and because the standing branch plants a foot once and
     never releases it, the body walked away from its own nailed feet. Traced at
     900 frames, a 27 mm spider had a foot 122 mm behind it.

     A tenth of a metre per second is a crawl for a hare and a sprint for a
     spider, so the only threshold that can be right for both is a fraction of
     the animal's OWN walking speed. stillV is computed in the shared behaviour
     section above, because the turn rate is derived from it as well. */
  const still = a.speed < stillV;
  const g = gaitFor(spec, a.speed);
  const gait = GAITS[still ? 'stand' : g.id];
  c.gait = still ? 'stand' : g.id;
  c.froude = g.fr;

  // Stride reach grows with speed as well as frequency, which is what real
  // animals do. The interpolation itself is authored, and says so.
  const reachK = 0.72 + 0.42 * clamp(a.speed / (spec.speeds?.run || 3), 0, 1);
  const f = !still
    ? (a.speed * gait.duty) / (spec.legs[0].reach * reachK)
    : 0;
  a.cycle = (a.cycle + f * dt) % 1;
  c.cycleHz = f;

  let sumY = 0, planted = 0, sumX = 0, sumZ = 0, sxy = 0, szy = 0;
  const legs = spec.legs;
  for (const leg of legs) {
    const ph = (a.cycle + (gait.phase[leg.key] ?? 0)) % 1;
    const stance = ph < gait.duty;
    const R = leg.reach * reachK;

    if (still) {
      /* Standing. Feet hold whatever ground they are on, directly under the
         hip — but they must RELEASE once the body has drifted, or a creature
         that idles while still edging forward drags its feet behind it for the
         rest of the scene. Re-plant past half a leg reach. */
      if (leg.planted) {
        localToWorld(a.heading, leg.hipPos.x, leg.hipPos.z, _p);
        _p.x += a.pos.x;
        _p.z += a.pos.z;
        if (Math.hypot(_p.x - leg.plant.x, _p.z - leg.plant.z) > leg.reach * 0.5) leg.planted = false;
      }
      if (!leg.planted) {
        localToWorld(a.heading, leg.hipPos.x, leg.hipPos.z, leg.plant);
        leg.plant.x += a.pos.x;
        leg.plant.z += a.pos.z;
        leg.plant.y = ground(leg.plant.x, leg.plant.z);
        leg.planted = true;
        /* A foot that was deliberately lifted and set down has not SLID. Skate
           is defined as a planted foot moving through the world, so the
           measurement has to restart whenever the plant is reassigned —
           otherwise every step registers as a slide the width of the step, and
           the transition out of standing shows up as a phantom 50–90 mm. */
        leg._lastW = null;
      }
      leg.world.copy(leg.plant);
    } else if (stance) {
      if (!leg.planted) { leg.planted = true; leg.plant.copy(leg.next); leg._lastW = null; }
      leg.world.copy(leg.plant);
    } else {
      if (leg.planted) {
        // Liftoff. Predict touchdown from where the body will be when the
        // swing ends, then interpolate in WORLD space so a turn mid-swing
        // does not drag the foot sideways.
        leg.planted = false;
        leg.lift.copy(leg.plant);
        const tSwing = f > 0 ? (1 - gait.duty) / f : 0.2;
        const px = a.pos.x + fwd.x * a.speed * tSwing;
        const pz = a.pos.z + fwd.z * a.speed * tSwing;
        localToWorld(a.heading, leg.hipPos.x + R / 2, leg.hipPos.z, leg.next);
        leg.next.x += px;
        leg.next.z += pz;
        leg.next.y = ground(leg.next.x, leg.next.z);
      }
      const u = clamp((ph - gait.duty) / (1 - gait.duty), 0, 1);
      leg.world.lerpVectors(leg.lift, leg.next, u * u * (3 - 2 * u));
      leg.world.y += Math.sin(u * Math.PI) * gait.lift * (leg.L1 + leg.L2);
    }
    if (leg.planted || still) {
      planted++;
      sumY += leg.world.y; sumX += leg.hipPos.x; sumZ += leg.hipPos.z;
      sxy += leg.hipPos.x * leg.world.y; szy += leg.hipPos.z * leg.world.y;
    }
  }

  /* Body height and attitude come from the feet that are actually down —
     a least-squares plane through the support polygon — so the body pitches
     into a slope and rolls through a walk without a single hand-keyed curve.
     Vertical oscillation is at twice stride frequency, which is what a real
     trot does: one rise per diagonal pair. */
  const avgY = planted ? sumY / planted : 0;
  const bob = Math.sin(a.cycle * T * 2) * spec.hipHeight * 0.022 * clamp(a.speed, 0, 2);
  bodyG.position.y = avgY + standHeight(c) + bob - root.position.y;
  if (planted >= 2) {
    const n = planted;
    const varX = legs.reduce((s, l) => s + (l.planted ? l.hipPos.x * l.hipPos.x : 0), 0);
    const varZ = legs.reduce((s, l) => s + (l.planted ? l.hipPos.z * l.hipPos.z : 0), 0);
    const bx = varX > 1e-4 ? (sxy - (sumX * sumY) / n) / Math.max(varX - (sumX * sumX) / n, 1e-4) : 0;
    const bz = varZ > 1e-4 ? (szy - (sumZ * sumY) / n) / Math.max(varZ - (sumZ * sumZ) / n, 1e-4) : 0;
    bodyG.rotation.z = clamp(Math.atan(bx), -0.3, 0.3) * 0.8;
    bodyG.rotation.x = clamp(-Math.atan(bz), -0.3, 0.3) * 0.8;
  }

  root.updateMatrixWorld(true);
  let worst = 0, skate = 0;
  for (const leg of legs) {
    _t.copy(leg.world);
    bodyG.worldToLocal(_t);
    worst = Math.max(worst, solveLeg(leg, _t));
  }
  /* Sample the feet only AFTER the whole chain has been re-solved.

     leg.foot.updateMatrixWorld(true) recomputes the foot from its ANCESTORS'
     matrices, and inside the solve loop those are still last frame's — so every
     sample lagged a frame, and the very first one compared the build pose
     against the first standing pose. That single spike was then kept by
     Math.max for the rest of the run: it read 50.43 mm on the hare and stayed
     bit-identical through a sixfold change in turn rate, which is what gave it
     away. One propagation after the solves makes every sample current. */
  root.updateMatrixWorld(true);
  for (const leg of legs) {
    if (!leg.planted) { leg._lastW = null; continue; }
    _s.setFromMatrixPosition(leg.foot.matrixWorld);
    if (leg._lastW) skate = Math.max(skate, _s.distanceTo(leg._lastW));
    else leg._lastW = new THREE.Vector3();
    leg._lastW.copy(_s);
  }
  c.residual = worst;
  c.skate = skate;

  /* Bird head-thrust. A walking bird does not bob: it holds its head STILL IN
     SPACE while its body carries on, then thrusts it forward to catch up. It is
     visual stabilisation, and it is built on exactly the same world-anchoring
     the feet use — hold the head against the world for the first 55% of the
     cycle, then close the gap over the remainder. Once you have seen a real
     rook walk, a sine-wave head bob is unwatchable. */
  if (c.headThrust && c.headG && a.speed > 0.15) {
    if (c.headHomeX === undefined) c.headHomeX = c.headG.position.x;
    const hold = 0.55;
    a.headX = a.headX || 0;
    if (a.cycle < hold) a.headX = Math.max(a.headX - a.speed * dt, -spec.bodyLen * 0.34);
    else a.headX = Math.min(a.headX + a.speed * dt * (hold / (1 - hold)), 0);
    c.headG.position.x = c.headHomeX + a.headX;
  }

  secondary(c, a, dt);
}

/* -------------------------------------------------------- secondary motion
   Ears, tail and head are sprung, not keyed. Each is a critically-damped
   spring chasing a target that comes from the body's own state — tail from
   yaw rate, ears from alertness, head from the behaviour state. This is the
   cheapest thing in the file and it does more for "alive" than any of the
   geometry. */
function secondary(c, a, dt) {
  const spring = (x, v, target, k, damp) => {
    v += (-k * (x - target) - damp * v) * dt;
    return [x + v * dt, v];
  };
  const yawRate = wrapPi(a.heading - (a._lastHeading ?? a.heading)) / Math.max(dt, 1e-4);
  a._lastHeading = a.heading;

  if (c.tailG) {
    [a.tailX, a.tailV] = spring(a.tailX, a.tailV, clamp(-yawRate * 0.22, -0.7, 0.7) + Math.sin(a.cycle * T) * 0.06, 90, 12);
    c.tailG.rotation.y = a.tailX;
    c.tailG.rotation.x = (c.tailBase || 0) - a.alertness * 0.5 + Math.sin(a.cycle * T + 1) * 0.05;
  }
  if (c.headG) {
    // Head down to forage, up and still when alert. Birds get the anchored
    // head-thrust instead; see stepBirdHead.
    const down = a.state === 'forage' ? 1 : 0;
    [a.headY, a.headYV] = spring(a.headY, a.headYV, down, 34, 8);
    const nib = a.state === 'forage' ? Math.sin(a._nib = (a._nib || 0) + dt * 7) * 0.05 : 0;
    c.headG.rotation.x = (c.headBase || 0) + a.headY * (c.forageDip ?? 0.85) + nib
      - a.alertness * 0.22 + Math.sin(a.cycle * T * 2) * 0.03 * clamp(a.speed, 0, 1.5);
    c.headG.rotation.y = a.state === 'alert' ? Math.sin(a.stateT * 1.7) * 0.4 : Math.sin(a.cycle * T) * 0.05;
  }
  for (let i = 0; i < (c.ears || []).length; i++) {
    const ear = c.ears[i];
    const tgt = a.alertness * 0.9 - (a.state === 'forage' ? 0.25 : 0);
    ear.rotation.x = (ear.userData.base || 0) - tgt * 0.5;
    ear.rotation.z = (ear.userData.baseZ || 0) + Math.sin(a.cycle * T * 1.7 + i * 2) * 0.05 * (1 - a.alertness);
  }
  if (c.motes) {
    const p = c.motes.geometry.attributes.position;
    const base = c.motes.userData.motes.base;
    const rise = c.motes.userData.motes.rise;
    a.headT += dt;
    for (let i = 0; i < p.count; i++) {
      const ph = a.headT * 0.6 + i * 1.7;
      p.setX(i, base[i * 3] + Math.sin(ph) * 0.03);
      p.setY(i, base[i * 3 + 1] + (rise ? ((a.headT * 0.12 + i * 0.13) % 0.5) : Math.sin(ph * 1.3) * 0.02));
      p.setZ(i, base[i * 3 + 2] + Math.cos(ph * 0.8) * 0.03);
    }
    p.needsUpdate = true;
  }
}

/* ---------------------------------------------------------------- hop mode
   A frog does not walk. It sits, then commits to a ballistic leap: the legs
   extend against the ground, the body follows a parabola, and it lands
   forelimbs-first. Airborne means no planted feet, so the same IK just tracks
   a tucked pose instead. */
function stepHop(group, c, a, dt, ctx) {
  const ground = ctx.groundAt || (() => 0);
  const root = c.root, bodyG = c.bodyG;

  /* Floating. Water deeper than the animal can stand in has no bed to push
     against, so there is no leap — it floats at the surface and paddles. This
     is the branch that lets a frog be honestly amphibious instead of being
     confined to a thin ring at the waterline. */
  const water = ctx.water;
  const dHere = water ? water.depthAt(a.pos.x, a.pos.z) : 0;
  if (dHere > Math.max(c.hipHeight * 1.3, 0.05)) {
    a.airborne = false; a.vy = 0; a.pos.y = 0;
    a._pad = (a._pad || 0) + dt * 2.1;
    a.pos.addScaledVector(fwdOf(a.heading), a.speed * dt * 0.5);
    root.position.set(a.pos.x, water.surfaceY - c.hipHeight * 0.3 + Math.sin(a._pad) * 0.006, a.pos.z);
    root.rotation.y = a.heading;
    bodyG.rotation.x = 0;
    bodyG.position.y = standHeight(c);
    const pad = Math.sin(a._pad * 3.1);
    c.legs.forEach((leg, i) => {
      const s = i % 2 ? 1 : -1;
      _t.set(leg.hipPos.x + s * pad * 0.014, -standHeight(c) * 0.86, leg.hipPos.z + s * pad * 0.022);
      solveLeg(leg, _t);
    });
    c.gait = 'paddle';
    c.froude = 0;
    secondary(c, a, dt);
    return;
  }
  if (!a.airborne && (a.state === 'step' || a.state === 'flee') && a.speed > 0.2) {
    a.airborne = true;
    a.vy = c.hopUp || 2.4;
    a.hopSpeed = a.state === 'flee' ? (c.speeds.run || 3) : (c.speeds.walk || 1.2);
  }
  if (a.airborne) {
    a.vy -= G * dt;
    a.pos.y += a.vy * dt;
    a.pos.x += Math.cos(a.heading) * a.hopSpeed * dt;
    a.pos.z += -Math.sin(a.heading) * a.hopSpeed * dt;
    if (a.pos.y <= 0) { a.pos.y = 0; a.airborne = false; a.vy = 0; a.speed = 0; a.stateT = 0.5 + a.rand() * 2.2; a.state = 'forage'; }
  }
  root.position.set(a.pos.x, ground(a.pos.x, a.pos.z) + a.pos.y, a.pos.z);
  root.rotation.y = a.heading;
  const t = a.airborne ? clamp(a.vy / (c.hopUp || 2.4), -1, 1) : 0;
  bodyG.rotation.x = -t * 0.35;
  bodyG.position.y = standHeight(c);
  for (const leg of c.legs) {
    const ext = a.airborne ? (t > 0 ? 1 - t * 0.7 : 0.35) : 1;
    _t.set(leg.hipPos.x + (a.airborne ? -0.02 : 0), -standHeight(c) * ext, leg.hipPos.z);
    solveLeg(leg, _t);
  }
  c.gait = a.airborne ? 'leap' : 'sit';
  c.froude = froude(a.hopSpeed || 0, c.hipHeight);
  // Apex and airtime are consequences of the launch velocity, not authored
  // numbers, and are reported so they can be checked against v²/2g and 2v/g.
  const v0 = c.hopUp || 2.4;
  c.apex = (v0 * v0) / (2 * G);
  c.airtime = (2 * v0) / G;
  secondary(c, a, dt);
}

/* ----------------------------------------------------------- undulate mode
   Snakes, eels and fish. The body is a chain of segments that follows the
   HEAD'S OWN PAST PATH, sampled by arc length, rather than a sine wave pinned
   to the body axis. That is what makes a snake track around an obstacle
   instead of shimmying through it, and it costs one ring buffer.

   The lateral wave is driven by distance travelled, never by time, so the
   body cannot undulate on the spot or glide without undulating. */
function stepUndulate(group, c, a, dt, ctx) {
  const ground = ctx.groundAt || (() => 0);
  const root = c.root;
  a.dist = (a.dist || 0) + a.speed * dt;

  /* STROUHAL. For a swimmer the wavelength is not authored — it is the stride
     length, and the stride length is amplitude over Strouhal number. Because
     the wave here is driven by DISTANCE travelled rather than by a clock, using
     A/St as the wavelength makes the beat frequency come out at f = St·U/A on
     its own, which is the Strouhal definition rearranged. Two consequences fall
     out for free: a fish cannot beat its tail while stationary, and a fish that
     speeds up beats faster in exactly the measured proportion.

     St rises for the smallest swimmers (Eloy 2012), which is why the silverling
     carries a higher number than the carp — that is the literature, not a
     tuning pass. Snakes keep their authored wavelength: they are not swimming
     against water and the Strouhal relation is not theirs to borrow. */
  const lam = c.swim && c.tailAmp
    ? Math.max(c.tailAmp / (c.strouhal || 0.3), 1e-3)
    : c.waveLen;
  c.strideLen = lam;
  c.beatHz = a.speed / lam;
  c.blPerSec = a.speed / Math.max(c.bodyLen, 1e-3);

  const amp = (c.swim && c.tailAmp ? c.tailAmp * 0.5 : c.waveAmp)
    * (0.35 + 0.65 * clamp(a.speed / (c.speeds.run || 1.2), 0, 1));
  root.position.set(0, 0, 0);
  root.rotation.y = 0;
  // Segments are placed in world coordinates, so the body group must not add
  // its own hip offset on top of the one computed below.
  c.bodyG.position.y = 0;

  /* Depth holding. A fish does not sit at a fixed height above the bed — it
     holds a depth below the SURFACE and drifts up and down through the column.
     The clamp below is what makes the no-exit rule true in the vertical as well
     as the horizontal: 1.05 body radii of clearance off the bed so it never
     clips through, 1.15 above so the dorsal never breaches. Those two are the
     2.2 radii the aquatic depth band demands — same fact, stated once. */
  if (c.swim) {
    const want = c.bodyR * (1.6 + 2.4 * (0.5 + 0.5 * Math.sin(a.dist * 0.35 + a.cycle * 6)));
    a.holdDepth = a.holdDepth == null ? c.bodyR * 2.6 : a.holdDepth + (want - a.holdDepth) * Math.min(1, dt * 0.7);
  }

  if (!a.trail) {
    a.trail = [];
    for (let i = 0; i < 128; i++) a.trail.push(new THREE.Vector3(a.pos.x, 0, a.pos.z));
  }
  a.trail.unshift(new THREE.Vector3(a.pos.x, ground(a.pos.x, a.pos.z), a.pos.z));
  if (a.trail.length > 256) a.trail.pop();

  // Arc-length lookup down the trail.
  const seg = c.spine;
  const surf = ctx.water ? ctx.water.surfaceY : null;
  let acc = 0, ti = 0, topY = -1e9;
  for (let i = 0; i < seg.length; i++) {
    const want = (i / (seg.length - 1)) * c.bodyLen;
    while (ti < a.trail.length - 2 && acc < want) { acc += a.trail[ti].distanceTo(a.trail[ti + 1]); ti++; }
    const p = a.trail[Math.min(ti, a.trail.length - 1)];
    const nxt = a.trail[Math.min(ti + 1, a.trail.length - 1)];
    const dir = headingTo(p.x - nxt.x, p.z - nxt.z);
    const s = i / (seg.length - 1);
    const envelope = c.anguilliform ? 0.5 + s * 0.5 : 0.2 + s * s * 1.5;
    const phase = (a.dist / lam - s) * T;
    const lateral = Math.sin(phase) * amp * envelope;
    let y;
    if (c.swim && surf != null) {
      const lo = p.y + c.bodyR * 1.05;
      const hi = surf - c.bodyR * 1.15;
      const wob = Math.sin(phase + 1.2) * amp * 0.2;
      y = clamp(surf - a.holdDepth + wob, Math.min(lo, hi), Math.max(lo, hi));
    } else {
      y = p.y + c.hipHeight + (c.swim ? Math.sin(phase + 1.2) * amp * 0.2 : 0);
    }
    if (y > topY) topY = y;
    // Lateral is along the segment's own left — local +Z, which is
    // (sin dir, 0, cos dir) in world.
    seg[i].position.set(
      p.x + Math.sin(dir) * lateral,
      y,
      p.z + Math.cos(dir) * lateral);
    seg[i].rotation.y = dir + Math.cos(phase) * amp * 2.2 * envelope;
  }
  // Reported so the viewer can prove no fish broke the surface rather than
  // being told so. Negative would mean a breach.
  c.surfaceClearance = c.swim && surf != null ? surf - (topY + c.bodyR) : null;
  c.gait = a.speed > 0.1 ? (c.swim ? 'swim' : 'slither') : 'coil';
  c.froude = froude(a.speed, c.hipHeight);
  c.residual = 0; c.skate = 0;
  secondary(c, a, dt);
}

/* -------------------------------------------------------------- flyer mode
   Wingbeat IS time-driven here, and that is correct rather than a shortcut:
   air is not a footprint, so there is nothing to skate against. What is
   derived is the bank — roll is proportional to turn rate times speed, which
   is what a real turning bird does and what makes a flight path read as
   controlled rather than as a dragged sprite.

   `flutter` is the moth and bat variant: erratic heading noise, and an
   attraction to the nearest light, because that is what the region kit's
   `lantern_moth_sparse` actually describes. */
function stepFlyer(group, c, a, dt, ctx) {
  const root = c.root;
  a.flapT = (a.flapT || 0) + dt * c.flapHz * (0.7 + a.speed * 0.12);
  a.h = a.h ?? (c.cruiseY || 2.4);

  if (c.locomotion === 'flutter') {
    a.desired += (a.rand() - 0.5) * dt * 14;
    let tgt = null, best = 1e9;
    for (const L of ctx.lights || []) {
      const d = Math.hypot(L.x - a.pos.x, L.z - a.pos.z);
      if (d < best) { best = d; tgt = L; }
    }
    if (tgt && best < (c.lightPull || 7)) {
      const to = headingTo(tgt.x - a.pos.x, tgt.z - a.pos.z);
      a.desired = angLerp(a.desired, to, clamp(dt * 3.4 * (1 - best / (c.lightPull || 7)), 0, 1));
      a.h += ((tgt.y || 1.6) - a.h) * Math.min(1, dt * 1.6);
    } else {
      a.h += (Math.sin(a.flapT * 0.19) * 0.5 + (c.cruiseY || 1.6) - a.h) * Math.min(1, dt * 1.1);
    }
    a.speed += ((c.speeds.walk || 1.1) - a.speed) * Math.min(1, dt * 3);
  } else {
    a.h += (Math.sin(a.flapT * 0.11) * (c.cruiseY || 6) * 0.16 + (c.cruiseY || 6) - a.h) * Math.min(1, dt * 0.8);
    a.speed += ((c.speeds.walk || 4) - a.speed) * Math.min(1, dt * 1.4);
  }

  const ground = ctx.groundAt || (() => 0);
  /* Over water, cruise height is measured from the SURFACE and not from the
     bed. Without this a bird crossing the channel dipped into the trough,
     because ground() correctly returns the bed and the bed is a metre down. */
  const base = (ctx.water && ctx.water.depthAt(a.pos.x, a.pos.z) > 0.004)
    ? ctx.water.surfaceY
    : ground(a.pos.x, a.pos.z);
  const y = base + a.h;
  root.position.set(a.pos.x, y, a.pos.z);
  /* Aircraft convention, stated explicitly because the previous pass had roll
     and pitch swapped. The rig faces +X, so the longitudinal (roll) axis is X
     and the lateral (pitch) axis is Z. Rotating yaw, then pitch, then roll is
     Euler order YZX. Banking on Z, as before, pitched the bird instead — which
     is why turns read as a nose-bob rather than a bank. */
  root.rotation.order = 'YZX';
  root.rotation.y = a.heading;
  const yawRate = wrapPi(a.heading - (a._lastHeadingF ?? a.heading)) / Math.max(dt, 1e-4);
  a._lastHeadingF = a.heading;
  /* Coordinated turn. A turning bird banks so the lift vector's horizontal
     component supplies the centripetal force, giving ω = g·tan(φ)/V, so
     φ = atan(V·ω/g). That replaces a hand-picked 0.16 coefficient with the
     actual relation — and it means a slow bird banks gently through the same
     turn a fast one has to lay right over for. */
  const phi = Math.atan((a.speed * yawRate) / G);
  root.rotation.x = clamp(-phi, -1.2, 1.2);
  // Pitch is the flight-path angle taken from the REAL climb rate. The old
  // version pitched in proportion to speed, which held a bird permanently
  // nose-down in level cruise and never pitched up on a climb.
  const climb = (y - (a._lastY == null ? y : a._lastY)) / Math.max(dt, 1e-4);
  a._lastY = y;
  root.rotation.z = clamp(Math.atan2(climb, Math.max(a.speed, 0.25)), -0.6, 0.6);
  c.bankDeg = Math.abs(phi) * 180 / Math.PI;
  c.climbRate = climb;

  const beat = Math.sin(a.flapT * T);
  const fold = c.locomotion === 'flutter' ? 1 : clamp(1 - Math.abs(beat) * 0.2, 0, 1);
  c.wings.forEach((w, i) => {
    const s = i === 0 ? 1 : -1;
    w.rotation.z = s * (beat * (c.flapAmp || 0.9) + (c.wingBase || 0.1));
    w.rotation.x = beat * 0.22 * fold;
    w.rotation.y = s * beat * 0.16;
  });
  if (c.tailG) c.tailG.rotation.x = (c.tailBase || 0) + beat * 0.1;
  c.gait = c.locomotion === 'flutter' ? 'flutter' : 'flap';
  c.froude = 0;
  c.residual = 0; c.skate = 0;
  if (c.motes) secondary(c, a, dt);
}

const wrapPi = (x) => Math.atan2(Math.sin(x), Math.cos(x));
const angLerp = (a, b, t) => a + wrapPi(b - a) * clamp(t, 0, 1);

/* ------------------------------------------------------------ body helpers */

/** Torso as a jittered capsule along +X (forward), with shoulder and haunch
 *  masses. One shape, five slots, and it reads as an animal rather than a
 *  sausage because the two masses break the silhouette. */
function torso(g, len, r, mat, rand, o = {}) {
  const cap = new THREE.CapsuleGeometry(r, len * 0.62, sg(4), sg(9));
  cap.rotateZ(Math.PI / 2);
  cap.scale(1, o.flat ?? 0.92, o.wide ?? 1);
  jitter(cap, r * 0.14, rand);
  g.add(part(cap, mat, 'torso'));
  const sh = ico(r * (o.shoulder ?? 1.06), 1);
  sh.scale(1.05, 0.9, 1);
  jitter(sh, r * 0.16, rand);
  g.add(part(sh, mat, 'shoulder', { pos: [len * 0.26, r * 0.1, 0] }));
  const hq = ico(r * (o.haunch ?? 1.12), 1);
  hq.scale(1, 1.02, 1.04);
  jitter(hq, r * 0.17, rand);
  g.add(part(hq, mat, 'haunch', { pos: [-len * 0.26, r * 0.12, 0] }));
  if (o.belly) {
    const b = ico(r * 0.8, 1);
    b.scale(1.5, 0.55, 0.9);
    jitter(b, r * 0.1, rand);
    g.add(part(b, FAUNA.belly, 'belly', { pos: [-len * 0.02, -r * 0.62, 0] }));
  }
  if (o.ribs) {
    // The `poor` condition tier: visible ribs and a dropped flank. A real
    // silhouette change, which is why condition counts as an axis.
    for (let i = 0; i < cnt(4); i++) {
      const rb = torus(r * 0.86, r * 0.055, 4, 9, Math.PI * 0.85);
      g.add(part(rb, mat, 'rib-' + i, { pos: [len * (0.12 - i * 0.09), r * 0.1, 0], rot: [0, 0, Math.PI * 0.57] }));
    }
  }
  return g;
}

/** Head group: skull, muzzle, eyes, and an optional pair of ears returned so
 *  the engine can spring them. Sits at the top of the neck and rotates as one
 *  unit, which is how a head behaves. */
function headRig(parent, o, rand) {
  const hg = new THREE.Group();
  hg.name = 'head';
  hg.position.set(o.at[0], o.at[1], o.at[2]);
  parent.add(hg);

  if (o.neck) {
    const nk = new THREE.CapsuleGeometry(o.r * (o.neckR ?? 0.62), o.neck, sg(3), sg(7));
    nk.rotateZ(-Math.PI / 2 * (o.neckLean ?? 0.55));
    jitter(nk, o.r * 0.08, rand);
    hg.add(part(nk, o.mat, 'neck', { pos: [-o.neck * 0.22, -o.neck * 0.2, 0] }));
  }
  const sk = ico(o.r, 1);
  sk.scale(o.skull ?? 1.25, 0.94, 0.9);
  jitter(sk, o.r * 0.13, rand);
  hg.add(part(sk, o.mat, 'skull'));

  if (o.muzzle) {
    const mz = cone(o.r * 0.66, o.r * (o.muzzle ?? 1.4), 7);
    mz.rotateZ(-Math.PI / 2);
    jitter(mz, o.r * 0.07, rand);
    hg.add(part(mz, o.mat, 'muzzle', { pos: [o.r * (o.muzzle ?? 1.4) * 0.5 + o.r * 0.3, -o.r * 0.18, 0] }));
    hg.add(part(ico(o.r * 0.13, 0), FAUNA.nose, 'nose', { pos: [o.r * (o.muzzle ?? 1.4) + o.r * 0.36, -o.r * 0.14, 0] }));
  }
  if (o.beak) {
    const bk = cone(o.r * 0.42, o.r * o.beak, 5);
    bk.rotateZ(-Math.PI / 2);
    hg.add(part(bk, FAUNA.boneBeak, 'beak', { pos: [o.r * o.beak * 0.5 + o.r * 0.5, -o.r * 0.05, 0] }));
  }
  const eyes = [];
  for (const s of [1, -1]) {
    const e = part(ico(o.r * (o.eye ?? 0.15), 0), FAUNA.eye, 'eye-' + (s > 0 ? 'l' : 'r'),
      { pos: [o.r * 0.62, o.r * 0.24, s * o.r * 0.6] });
    hg.add(e);
    eyes.push(e);
  }
  const ears = [];
  if (o.ear) {
    for (const s of [1, -1]) {
      const eg = new THREE.Group();
      eg.name = 'ear-' + (s > 0 ? 'l' : 'r');
      eg.position.set(-o.r * 0.2, o.r * 0.7, s * o.r * 0.48);
      const geo = o.earShape === 'round'
        ? ico(o.r * o.ear * 0.5, 1)
        : cone(o.r * o.ear * (o.earW ?? 0.34), o.r * o.ear * 1.7, 6);
      if (o.earShape === 'round') geo.scale(0.6, 1, 1);
      jitter(geo, o.r * 0.05, rand);
      const m = part(geo, o.earMat || o.mat, 'ear');
      m.position.y = o.r * o.ear * 0.8;
      eg.add(m);
      eg.userData.base = -0.15;
      eg.userData.baseZ = s * 0.2;
      eg.rotation.z = s * 0.2;
      hg.add(eg);
      ears.push(eg);
    }
  }
  return { head: hg, ears, eyes };
}

/** Tail group: a chain of tapering segments, pivoting at the rump. */
function tailRig(parent, o, rand) {
  const tg = new THREE.Group();
  tg.name = 'tail';
  tg.position.set(o.at[0], o.at[1], o.at[2]);
  parent.add(tg);
  if (o.kind === 'puff') {
    const p = ico(o.len * 0.42, 1);
    jitter(p, o.len * 0.16, rand);
    tg.add(part(p, o.mat, 'tail-puff', { pos: [-o.len * 0.3, o.len * 0.1, 0] }));
    return tg;
  }
  const n = cnt(o.seg || 3);
  let prev = tg;
  for (let i = 0; i < n; i++) {
    const s = 1 - i / (n + 1);
    const g2 = new THREE.Group();
    g2.position.set(-(o.len / n), i === 0 ? 0 : 0, 0);
    g2.rotation.z = -(o.droop ?? 0.16);
    prev.add(g2);
    const geo = limb(o.r * s * 0.7, o.r * s, o.len / n, 6);
    geo.rotateZ(Math.PI / 2);
    prev.add(part(geo, o.mat, 'tail-' + i, { pos: [-(o.len / n) * 0.5, 0, 0] }));
    prev = g2;
  }
  return tg;
}

/** Common assembly. Every builder ends here, so every creature carries the
 *  same rig contract and the same engine drives it. */
function assemble(g, spec) {
  const root = new THREE.Group();
  root.name = spec.species;
  const bodyG = new THREE.Group();
  bodyG.name = 'body';
  bodyG.position.y = spec.hipHeight;
  root.add(bodyG);
  bodyG.add(g);
  root.userData.creature = { ...spec, root, bodyG };
  return root;
}

/* =========================================================================
   FAMILY 1 — small ground mammals. Hare, coney, hedgepig, marten.
   The form axis changes the build path: a hare is legs, a hedgepig is a
   spined dome with no visible legs at rest, a marten is a spine with a low
   slung gait. Those are not parameter tweaks.
   ======================================================================= */
export const HARE_AXES = { form: 4, size: 3, ear: 3, coat: 3, tail: 2, condition: 2 };
export function hare(variant = 0) {
  const A = axesOf(variant, HARE_AXES);
  const rand = rnd(0x4a1e + variant * 7919);
  const forms = ['hare', 'coney', 'hedgepig', 'marten'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.62, 0.8, 1.0][A.size] * (form === 'marten' ? 1.05 : 1);
  const len = (form === 'marten' ? 0.46 : 0.34) * S;
  const r = (form === 'hedgepig' ? 0.11 : form === 'marten' ? 0.062 : 0.082) * S;
  const coat = [FAUNA.furDark, FAUNA.furAsh, FAUNA.furRust][A.coat];
  const poor = A.condition === 1;

  torso(g, len, r, coat, rand, {
    belly: form !== 'hedgepig', ribs: poor, flat: form === 'marten' ? 0.8 : 0.92,
    haunch: form === 'hare' ? 1.3 : 1.1,
  });

  if (form === 'hedgepig') {
    // Spines are the silhouette. Individually placed cones, thinned by LOD.
    const dome = ico(r * 1.12, 1);
    dome.scale(1.25, 0.95, 1.05);
    jitter(dome, r * 0.1, rand);
    g.add(part(dome, FAUNA.furDark, 'spine-mass', { pos: [0, r * 0.3, 0] }));
    for (let i = 0; i < cnt(34); i++) {
      const u = rand(), v2 = rand();
      const th = u * T, ph = Math.acos(clamp(v2 * 1.1 - 0.05, -1, 1)) * 0.8;
      const sp = cone(r * 0.055, r * 0.62, 4);
      const px = Math.sin(ph) * Math.cos(th) * len * 0.5;
      const py = Math.cos(ph) * r * 1.15 + r * 0.3;
      const pz = Math.sin(ph) * Math.sin(th) * r * 1.05;
      g.add(part(sp, FAUNA.antler, 'quill-' + i, {
        pos: [px, py, pz], rot: [pz * 3, 0, -px * 3],
      }));
    }
  }

  const earLen = form === 'hare' ? [1.9, 2.6, 3.4][A.ear] : form === 'coney' ? [1.1, 1.5, 1.9][A.ear] : [0.5, 0.7, 0.9][A.ear];
  const H = headRig(g, {
    at: [len * 0.44, r * 0.42, 0], r: r * 0.78, mat: coat, muzzle: 1.5,
    neck: form === 'marten' ? r * 1.2 : 0, ear: earLen,
    earShape: form === 'hedgepig' ? 'round' : 'cone', earW: 0.3,
    skull: form === 'marten' ? 1.45 : 1.2,
  }, rand);

  const tailKinds = form === 'hare' || form === 'coney'
    ? ['puff', 'puff'] : ['taper', 'taper'];
  const tail = tailRig(g, {
    at: [-len * 0.46, r * 0.5, 0], mat: coat, r: r * 0.5,
    len: (form === 'marten' ? len * 0.85 : len * [0.2, 0.32][A.tail]),
    kind: form === 'marten' ? 'taper' : tailKinds[A.tail] === 'puff' ? 'puff' : 'taper',
    seg: 3, droop: 0.1,
  }, rand);

  const hip = (form === 'hedgepig' ? 0.1 : form === 'marten' ? 0.13 : 0.19) * S;
  const L1 = hip * 0.56, L2 = hip * 0.56;
  const legs = [];
  const lat = r * 0.82;
  const spread = form === 'marten' ? 0.42 : 0.36;
  for (const [key, x, bend] of [['LF', len * spread, -1], ['RF', len * spread, -1],
    ['LH', -len * spread, 1], ['RH', -len * spread, 1]]) {
    legs.push(legRig(g, {
      key, hip: [x, -r * 0.2, (key[0] === 'L' ? 1 : -1) * lat],
      L1: key[1] === 'H' ? L1 * 1.22 : L1, L2: key[1] === 'H' ? L2 * 1.22 : L2,
      r1: r * 0.3, r2: r * 0.22, bend, foot: 'paw', mat: coat,
      reach: hip * (form === 'hare' ? 0.85 : 0.6),
    }));
  }

  const spec = {
    species: form, family: 'fauna.hare', form,
    label: { hare: 'Fell hare', coney: 'Ash coney', hedgepig: 'Hedgepig', marten: 'Roof marten' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: len,
    gaits: form === 'hare' ? ['walk', 'trot', 'bound'] : form === 'marten' ? ['walk', 'trot', 'gallop'] : ['walk', 'trot'],
    speeds: {
      walk: form === 'hedgepig' ? 0.28 : 0.62,
      run: form === 'hare' ? 6.2 : form === 'marten' ? 4.4 : form === 'coney' ? 3.6 : 0.9,
    },
    turnRate: form === 'hedgepig' ? 1.4 : 3.4, accel: form === 'hare' ? 14 : 8,
    flushRadius: form === 'hedgepig' ? 1.4 : 4.2,
    legs, headG: H.head, ears: H.ears, tailG: tail, tailBase: form === 'marten' ? -0.2 : -0.5,
    forageDip: 0.7, budgetClass: 'minor',
    glowParts: [...H.eyes, ...(form === 'hedgepig' ? g.children.filter((c) => c.name.startsWith('quill')) : [])],
    regions: form === 'marten' ? ['hearthmere', 'cinderward'] : ['hearthmere', 'graven_march', 'dunmire'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 2 — cervids and caprids. Roe, hart, fell-goat.
   Headgear is the axis that does the most work and it is genuinely four
   different builds: bare, spike, branched, curled horn.
   ======================================================================= */
export const DEER_AXES = { form: 3, headgear: 4, size: 3, coat: 3, neck: 2, condition: 2 };
export function deer(variant = 0) {
  const A = axesOf(variant, DEER_AXES);
  const rand = rnd(0x9d33 + variant * 7919);
  const forms = ['roe', 'hart', 'goat'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.78, 1, 1.22][A.size] * (form === 'hart' ? 1.35 : form === 'goat' ? 0.86 : 1);
  const len = 1.05 * S;
  const r = 0.2 * S;
  const coat = [FAUNA.furRust, FAUNA.furAsh, FAUNA.furGrey][A.coat];
  const poor = A.condition === 1;

  torso(g, len, r, coat, rand, { ribs: poor, belly: false, flat: 0.88, haunch: 1.14, shoulder: 1.08 });

  const neckLen = r * [1.5, 2.3][A.neck] * (form === 'hart' ? 1.2 : 1);
  const H = headRig(g, {
    at: [len * 0.46, r * 0.72, 0], r: r * 0.5, mat: coat, muzzle: 1.9,
    neck: neckLen, neckR: 0.66, neckLean: 0.75, ear: 1.5, earW: 0.32,
    skull: 1.5,
  }, rand);

  // Headgear. Bare, spike, branched (a real bifurcating beam), curled horn.
  const gear = ['bare', 'spike', 'branched', 'curled'][A.headgear];
  if (gear !== 'bare') {
    for (const s of [1, -1]) {
      if (gear === 'curled') {
        const seg = cnt(7);
        for (let i = 0; i < seg; i++) {
          const t = i / seg;
          const a2 = t * Math.PI * 1.5;
          const hn = limb(r * 0.09 * (1 - t * 0.5), r * 0.11 * (1 - t * 0.4), r * 0.36, 6);
          H.head.add(part(hn, FAUNA.antler, 'horn-' + (s > 0 ? 'l' : 'r') + i, {
            pos: [-Math.sin(a2) * r * 0.5, r * 0.5 + Math.cos(a2) * r * 0.42 + t * r * 0.3, s * r * 0.34],
            rot: [0, 0, -a2 * 0.6],
          }));
        }
      } else {
        const beamLen = gear === 'spike' ? r * 1.5 : r * 2.4;
        const beam = limb(r * 0.05, r * 0.11, beamLen, 6);
        H.head.add(part(beam, FAUNA.antler, 'beam-' + (s > 0 ? 'l' : 'r'), {
          pos: [-r * 0.1, r * 0.5 + beamLen * 0.45, s * r * 0.3], rot: [s * -0.24, 0, 0.16],
        }));
        if (gear === 'branched') {
          for (let i = 0; i < cnt(3); i++) {
            const tn = limb(r * 0.035, r * 0.06, r * (0.9 - i * 0.16), 5);
            H.head.add(part(tn, FAUNA.antler, 'tine-' + (s > 0 ? 'l' : 'r') + i, {
              pos: [-r * 0.1 + i * r * 0.12, r * 0.7 + beamLen * (0.35 + i * 0.24), s * r * (0.36 + i * 0.1)],
              rot: [s * -0.5, 0, 0.6 - i * 0.2],
            }));
          }
        }
      }
    }
  }
  if (form === 'goat') {
    const beard = cone(r * 0.16, r * 0.6, 5);
    H.head.add(part(beard, coat, 'beard', { pos: [r * 0.5, -r * 0.45, 0], rot: [0, 0, 0.3] }));
  }

  const tail = tailRig(g, {
    at: [-len * 0.48, r * 0.6, 0], mat: coat, r: r * 0.24,
    len: form === 'goat' ? len * 0.18 : len * 0.13, kind: 'taper', seg: 2, droop: 0.5,
  }, rand);

  const hip = (form === 'hart' ? 0.98 : form === 'goat' ? 0.62 : 0.74) * S;
  const legs = [];
  for (const [key, x, bend] of [['LF', len * 0.32, -1], ['RF', len * 0.32, -1],
    ['LH', -len * 0.34, 1], ['RH', -len * 0.34, 1]]) {
    legs.push(legRig(g, {
      key, hip: [x, -r * 0.35, (key[0] === 'L' ? 1 : -1) * r * 0.68],
      L1: hip * 0.46, L2: hip * 0.5, r1: r * 0.2, r2: r * 0.12,
      bend, foot: 'hoof', mat: coat, footMat: FAUNA.hoof, reach: hip * 0.5,
    }));
  }

  const spec = {
    species: form, family: 'fauna.deer', form,
    label: { roe: 'Roe deer', hart: 'March hart', goat: 'Fell goat' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: len,
    gaits: form === 'goat' ? ['walk', 'trot', 'gallop'] : ['walk', 'trot', 'bound'],
    speeds: { walk: 0.85, run: form === 'hart' ? 9.5 : form === 'goat' ? 5.5 : 8 },
    turnRate: 2.2, accel: 9, flushRadius: 8.5,
    legs, headG: H.head, ears: H.ears, tailG: tail, tailBase: -0.3, forageDip: 1.15,
    budgetClass: 'standard', glowParts: [...H.eyes],
    regions: ['hearthmere', 'graven_march', 'dunmire'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 3 — vermin. Rat, vole, stoat, mole.
   The mole earns its place as a form rather than a recolour: spade forelimbs,
   no visible eyes, a snout instead of a face, and a hunched posture that
   changes the whole silhouette.
   ======================================================================= */
export const VERMIN_AXES = { form: 4, size: 3, tail: 3, coat: 3, posture: 2, condition: 2 };
export function vermin(variant = 0) {
  const A = axesOf(variant, VERMIN_AXES);
  const rand = rnd(0x2c17 + variant * 7919);
  const forms = ['rat', 'vole', 'stoat', 'mole'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.62, 0.85, 1.15][A.size];
  const len = (form === 'stoat' ? 0.3 : form === 'vole' ? 0.15 : 0.22) * S;
  const r = (form === 'mole' ? 0.055 : form === 'stoat' ? 0.038 : 0.048) * S;
  const coat = form === 'mole' ? FAUNA.furDark : [FAUNA.furDark, FAUNA.furAsh, FAUNA.furGrey][A.coat];

  torso(g, len, r, coat, rand, {
    ribs: A.condition === 1 && form !== 'mole', belly: form !== 'mole',
    flat: A.posture === 1 ? 0.8 : 0.95, wide: form === 'mole' ? 1.15 : 1,
  });

  const H = headRig(g, {
    at: [len * 0.46, r * (A.posture === 1 ? 0.2 : 0.42), 0], r: r * 0.8, mat: coat,
    muzzle: form === 'mole' ? 2.2 : 1.7, ear: form === 'mole' ? 0 : form === 'stoat' ? 0.6 : 0.9,
    earShape: 'round', eye: form === 'mole' ? 0.06 : 0.15, skull: form === 'mole' ? 1.5 : 1.25,
  }, rand);

  const tail = tailRig(g, {
    at: [-len * 0.48, r * 0.4, 0], mat: form === 'stoat' ? FAUNA.furDark : coat,
    r: r * 0.35, len: len * [0.35, 0.75, 1.1][A.tail],
    kind: form === 'stoat' && A.tail === 2 ? 'puff' : 'taper', seg: 4, droop: 0.06,
  }, rand);

  const hip = (form === 'mole' ? 0.048 : form === 'stoat' ? 0.075 : 0.085) * S;
  const legs = [];
  for (const [key, x, bend] of [['LF', len * 0.3, -1], ['RF', len * 0.3, -1],
    ['LH', -len * 0.32, 1], ['RH', -len * 0.32, 1]]) {
    const isFore = key[1] === 'F';
    legs.push(legRig(g, {
      key, hip: [x, -r * 0.25, (key[0] === 'L' ? 1 : -1) * r * 0.78],
      L1: hip * 0.5, L2: hip * 0.5,
      r1: r * (form === 'mole' && isFore ? 0.55 : 0.3), r2: r * 0.22, bend,
      foot: 'paw', mat: coat, reach: hip * 0.55,
    }));
    if (form === 'mole' && isFore) {
      const spade = box(r * 0.6, r * 0.18, r * 1.1);
      legs[legs.length - 1].ankle.add(part(spade, FAUNA.antler, 'spade', { pos: [r * 0.25, -r * 0.1, 0] }));
    }
  }

  const spec = {
    species: form, family: 'fauna.vermin', form,
    label: { rat: 'Tithe rat', vole: 'Bank vole', stoat: 'Stoat', mole: 'Grave mole' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: len,
    gaits: form === 'mole' ? ['walk'] : ['walk', 'trot', 'gallop'],
    speeds: { walk: form === 'mole' ? 0.18 : 0.55, run: form === 'stoat' ? 4.2 : form === 'mole' ? 0.4 : 2.6 },
    turnRate: form === 'mole' ? 1.2 : 4.6, accel: 12, flushRadius: form === 'mole' ? 1 : 3,
    legs, headG: H.head, ears: H.ears, tailG: tail, tailBase: -0.2, forageDip: 0.6,
    budgetClass: 'minor', glowParts: [...H.eyes],
    regions: form === 'mole' ? ['graven_march', 'hollow_abbey'] : ['hearthmere', 'cinderward', 'hollow_abbey', 'dunmire'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 4 — ground birds. Rook, hen, wader, quail.
   Bipedal, and they get the head-thrust: a walking bird holds its head still
   in space during stance and thrusts it forward during swing. It is a
   visual-stabilisation behaviour, not a bob, and it is built here on the same
   world-anchoring machinery as the feet — which is the whole argument for
   having that machinery.
   ======================================================================= */
export const GBIRD_AXES = { form: 4, size: 3, bill: 3, crest: 2, plumage: 3, leg: 2 };
export function groundBird(variant = 0) {
  const A = axesOf(variant, GBIRD_AXES);
  const rand = rnd(0x7b41 + variant * 7919);
  const forms = ['rook', 'hen', 'wader', 'quail'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.74, 1, 1.24][A.size];
  const len = (form === 'wader' ? 0.34 : form === 'quail' ? 0.18 : 0.28) * S;
  const r = (form === 'quail' ? 0.085 : 0.075) * S;
  const plume = [FAUNA.featherBlack, FAUNA.featherAsh, FAUNA.featherPale][A.plumage];

  torso(g, len, r, plume, rand, { flat: 0.98, wide: 0.92, haunch: 1.18, shoulder: 0.98 });

  // Folded wings sit on the body as plates. A ground bird that walks with
  // spread wings looks wrong; these only move when it flushes.
  const wings = [];
  for (const s of [1, -1]) {
    const wg = new THREE.Group();
    wg.position.set(len * 0.04, r * 0.5, s * r * 0.72);
    const wgeo = box(len * 0.78, r * 0.14, r * 0.5);
    jitter(wgeo, r * 0.06, rand);
    wg.add(part(wgeo, plume, 'wing-' + (s > 0 ? 'l' : 'r'), { pos: [-len * 0.1, 0, s * r * 0.16] }));
    g.add(wg);
    wings.push(wg);
  }

  const H = headRig(g, {
    at: [len * 0.4, r * 0.9, 0], r: r * 0.52, mat: plume,
    neck: r * (form === 'wader' ? 2.4 : 1.2), neckR: 0.5, neckLean: 0.35,
    beak: [1.3, 2.1, 3.4][A.bill] * (form === 'wader' ? 1.5 : 1), eye: 0.18, skull: 1.15,
  }, rand);
  if (A.crest === 1) {
    for (let i = 0; i < cnt(3); i++) {
      const cq = cone(r * 0.06, r * 0.45, 4);
      H.head.add(part(cq, FAUNA.crest, 'crest-' + i, {
        pos: [-r * 0.1 - i * r * 0.12, r * 0.5, 0], rot: [0, 0, -0.5 - i * 0.2],
      }));
    }
  }

  const tail = tailRig(g, { at: [-len * 0.5, r * 0.55, 0], mat: plume, r: r * 0.5, len: len * 0.5, kind: 'taper', seg: 2, droop: 0.25 }, rand);
  // Rectrices: a fan of flat feathers, which is what makes a bird silhouette.
  for (let i = 0; i < cnt(5); i++) {
    const a2 = (i - 2) * 0.2;
    const f = box(len * 0.44, r * 0.04, r * 0.13);
    tail.add(part(f, plume, 'rectrix-' + i, { pos: [-len * 0.22, 0, Math.sin(a2) * r * 0.4], rot: [0, a2, -0.2] }));
  }

  const hip = (form === 'wader' ? 0.36 : form === 'quail' ? 0.1 : 0.17) * S * [0.85, 1.15][A.leg];
  const legs = [];
  for (const [key, s] of [['L', 1], ['R', -1]]) {
    legs.push(legRig(g, {
      key, hip: [-len * 0.04, -r * 0.4, s * r * 0.4],
      L1: hip * 0.5, L2: hip * 0.5, r1: r * 0.14, r2: r * 0.1,
      // A bird's visible joint folds backward: the femur is inside the body,
      // so what reads as a knee is the ankle.
      bend: 1, foot: 'toes', mat: FAUNA.boneBeak, reach: hip * 0.62,
    }));
  }

  const spec = {
    species: form, family: 'fauna.ground-bird', form,
    label: { rook: 'Rook', hen: 'Hold hen', wader: 'Mire wader', quail: 'Ash quail' }[form],
    locomotion: 'quadruped', biped: true, hipHeight: hip, bodyLen: len,
    gaits: ['step2', 'run2'], headThrust: true,
    speeds: { walk: 0.5, run: form === 'wader' ? 2.2 : 2.8 },
    turnRate: 3.8, accel: 10, flushRadius: 5.5,
    legs, headG: H.head, ears: [], tailG: tail, tailBase: -0.2, forageDip: 1.35,
    wings, budgetClass: 'minor', glowParts: [...H.eyes],
    // graven_march is authored `no_bird_silence`. Birds are masked out of it.
    regions: form === 'wader' ? ['dunmire'] : ['hearthmere', 'dunmire', 'cinderward', 'hollow_abbey'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 5 — anurans. Frog, toad, newt.
   Ballistic hop rather than a gait. Throat pulse while sitting.
   ======================================================================= */
export const FROG_AXES = { form: 3, size: 3, marking: 3, limb: 2, throat: 2, condition: 2 };
export function frog(variant = 0) {
  const A = axesOf(variant, FROG_AXES);
  const rand = rnd(0x5f0b + variant * 7919);
  const forms = ['frog', 'toad', 'newt'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.7, 1, 1.35][A.size];
  const len = (form === 'newt' ? 0.16 : 0.09) * S;
  const r = (form === 'toad' ? 0.045 : 0.036) * S;
  const skin = [FAUNA.scaleDark, FAUNA.furAsh, FAUNA.scaleWet][A.marking];

  const bodyGeo = ico(r * 1.5, 1);
  bodyGeo.scale(form === 'newt' ? 2.1 : 1.35, 0.8, 1.05);
  jitter(bodyGeo, r * (form === 'toad' ? 0.28 : 0.14), rand);
  g.add(part(bodyGeo, skin, 'body'));
  if (form === 'toad') {
    for (let i = 0; i < cnt(9); i++) {
      const w = ico(r * 0.16, 0);
      g.add(part(w, skin, 'wart-' + i, {
        pos: [(rand() - 0.5) * len * 1.4, r * (0.5 + rand() * 0.5), (rand() - 0.5) * r * 1.6],
      }));
    }
  }

  const H = headRig(g, {
    at: [len * 0.9, r * 0.35, 0], r: r * 0.85, mat: skin, muzzle: 0.9,
    eye: 0.26, skull: 1.1,
  }, rand);
  const throat = part(ico(r * [0.5, 0.8][A.throat], 1), skin, 'throat', { pos: [len * 0.7, -r * 0.5, 0] });
  throat.scale.set(1.1, 0.7, 1.1);
  g.add(throat);

  const hip = r * 1.15;
  const legs = [];
  const L = [1, 1.35][A.limb];
  for (const [key, x, bend] of [['LF', len * 0.7, -1], ['RF', len * 0.7, -1],
    ['LH', -len * 0.5, 1], ['RH', -len * 0.5, 1]]) {
    const back = key[1] === 'H';
    legs.push(legRig(g, {
      key, hip: [x, -r * 0.3, (key[0] === 'L' ? 1 : -1) * r * 0.85],
      L1: hip * (back ? 0.85 * L : 0.5), L2: hip * (back ? 0.9 * L : 0.5),
      r1: r * 0.2, r2: r * 0.14, bend, foot: 'toes', mat: skin, footMat: skin, reach: hip * 0.5,
    }));
  }
  if (form === 'newt') tailRig(g, { at: [-len * 0.9, r * 0.2, 0], mat: skin, r: r * 0.45, len: len * 1.1, kind: 'taper', seg: 3, droop: 0.05 }, rand);

  const spec = {
    species: form, family: 'fauna.frog', form,
    label: { frog: 'Reed frog', toad: 'Sump toad', newt: 'Spring newt' }[form],
    locomotion: form === 'newt' ? 'quadruped' : 'hop', hipHeight: hip, bodyLen: len,
    gaits: ['walk', 'trot'], hopUp: 1.6 + S * 0.6,
    speeds: { walk: form === 'newt' ? 0.22 : 1.4, run: form === 'newt' ? 0.7 : 2.6 },
    turnRate: 2.4, accel: 9, flushRadius: 2.2,
    legs, headG: H.head, ears: [], throat, forageDip: 0.2,
    budgetClass: 'minor', glowParts: [...H.eyes, throat],
    regions: ['dunmire', 'hearthmere'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 6 — serpents and worms. Adder, grass-snake, slow-worm, eel.
   Undulation mode: the body follows the head's own path.
   ======================================================================= */
export const SERPENT_AXES = { form: 4, length: 3, girth: 3, marking: 3, head: 2, shed: 2 };
export function serpent(variant = 0) {
  const A = axesOf(variant, SERPENT_AXES);
  const rand = rnd(0x3e88 + variant * 7919);
  const forms = ['adder', 'grass-snake', 'slow-worm', 'eel'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const len = [0.5, 0.85, 1.35][A.length] * (form === 'eel' ? 1.2 : 1);
  const r = [0.016, 0.024, 0.034][A.girth] * (form === 'slow-worm' ? 0.7 : 1);
  const skin = form === 'eel' ? FAUNA.scaleWet : [FAUNA.scaleDark, FAUNA.furAsh, FAUNA.scaleSilver][A.marking];

  const nSeg = cnt(form === 'eel' ? 13 : 15);
  const spine = [];
  for (let i = 0; i < nSeg; i++) {
    const s = i / (nSeg - 1);
    const rr = r * (1 - Math.pow(s, 2.2) * 0.75) * (i === 0 ? 1.1 : 1);
    const seg = new THREE.Group();
    seg.name = 'segment-' + i;
    const geo = new THREE.CapsuleGeometry(rr, (len / nSeg) * 1.1, sg(3), sg(6));
    geo.rotateZ(Math.PI / 2);
    if (form === 'eel') geo.scale(1, 1.5, 0.75);
    seg.add(part(geo, skin, 'body-' + i));
    if (A.marking === 0 && i % 2 === 0 && form === 'adder') {
      const mk = box((len / nSeg) * 0.5, rr * 0.2, rr * 1.5);
      seg.add(part(mk, FAUNA.furDark, 'zigzag-' + i, { pos: [0, rr * 0.85, 0] }));
    }
    if (form === 'eel' && s > 0.25) {
      const fin = box((len / nSeg) * 1.05, rr * 1.1, rr * 0.1);
      seg.add(part(fin, FAUNA.wingDust, 'fin-' + i, { pos: [0, rr * 0.7, 0] }));
    }
    g.add(seg);
    spine.push(seg);
  }

  /* Mid-shed. A snake sloughs from the head backward and spends days with the
     old skin rucked up behind the jaw — a real silhouette, and the reason this
     is an axis rather than a texture: the collar is geometry that catches light
     differently from the animal inside it. */
  if (A.shed === 1) {
    const shedMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#a9a291'), roughness: 0.95, metalness: 0,
      transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    });
    shedMat.name = 'shed-skin';
    const at = Math.max(1, Math.floor(nSeg * 0.22));
    const collar = cyl(r * 1.35, r * 2.05, (len / nSeg) * 2.4, sg(9), 1, true);
    collar.rotateZ(Math.PI / 2);
    jitter(collar, r * 0.22, rand);
    const cm = part(collar, shedMat, 'shed-collar', { pos: [-(len / nSeg) * 0.6, r * 0.1, 0] });
    cm.userData.noCast = true;
    cm.userData.noShadow = true;
    spine[at].add(cm);
  }

  const H = headRig(spine[0], {
    at: [(len / nSeg) * 0.7, 0, 0], r: r * [1.5, 2.1][A.head], mat: skin,
    muzzle: 0.8, eye: 0.16, skull: 1.5,
  }, rand);
  if (form !== 'slow-worm') {
    const tongue = cone(r * 0.1, r * 1.1, 4);
    tongue.rotateZ(-Math.PI / 2);
    H.head.add(part(tongue, FAUNA.crest, 'tongue', { pos: [r * 2.4, -r * 0.2, 0] }));
  }

  const spec = {
    species: form, family: 'fauna.serpent', form,
    label: { adder: 'March adder', 'grass-snake': 'Reed snake', 'slow-worm': 'Slow-worm', eel: 'Sluice eel' }[form],
    locomotion: 'undulate', hipHeight: r * 1.1, bodyLen: len,
    anguilliform: true, swim: form === 'eel',
    waveAmp: r * (form === 'eel' ? 5.5 : 7), waveLen: len * 0.62,
    speeds: { walk: 0.35, run: form === 'eel' ? 1.6 : 1.2 },
    turnRate: 1.8, accel: 4, flushRadius: 2.6,
    spine, legs: [], headG: H.head, ears: [], forageDip: 0.2,
    budgetClass: 'minor', glowParts: [...H.eyes],
    regions: form === 'eel' ? ['dunmire'] : ['hearthmere', 'graven_march', 'dunmire'],
  };
  return assemble(g, spec);
}

/* --------------------------------------------------------------- registry */
export const FAUNA_GENERATORS = [
  { id: 'fauna.hare', name: 'Small ground mammal', axes: HARE_AXES, build: hare, domain: 'fauna-ground', budgetClass: 'minor' },
  { id: 'fauna.deer', name: 'Cervid and caprid', axes: DEER_AXES, build: deer, domain: 'fauna-ground', budgetClass: 'standard' },
  { id: 'fauna.vermin', name: 'Vermin', axes: VERMIN_AXES, build: vermin, domain: 'fauna-ground', budgetClass: 'minor' },
  { id: 'fauna.ground-bird', name: 'Ground bird', axes: GBIRD_AXES, build: groundBird, domain: 'fauna-ground', budgetClass: 'minor' },
  { id: 'fauna.frog', name: 'Anuran', axes: FROG_AXES, build: frog, domain: 'fauna-water', budgetClass: 'minor' },
  { id: 'fauna.serpent', name: 'Serpent', axes: SERPENT_AXES, build: serpent, domain: 'fauna-water', budgetClass: 'minor' },
];

export { spaceOf, axesOf, torso, headRig, tailRig, assemble, box, clamp, M, T, G };
