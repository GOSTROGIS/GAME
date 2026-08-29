/* Climate — the sun, the year, and the three violent weathers.
 *
 * WHY THIS IS ONE MODULE AND NOT FIVE
 * "Dynamic days" and "four seasons" are the same equation. A season is not a
 * preset — it is a day-of-year, and what actually changes between midwinter
 * and midsummer is where the sun goes: how high it climbs, how long it is up,
 * and what colour it is when it is low. So this module has ONE solar model at
 * its centre, and the day cycle and the seasons are both readings off it.
 *
 * Doing it the other way — four hand-authored colour presets and a separate
 * day slider — gives you a winter noon with a summer sun angle, and the whole
 * thing stops being a world and becomes a set of filters.
 *
 * THE ASTRONOMY IS REAL
 *   declination  δ = 23.44° · sin(360°·(284 + n)/365)      (Cooper, 1969)
 *   hour angle   h = 15° · (t − 12)
 *   elevation    sin α = sin φ sin δ + cos φ cos δ cos h
 *   azimuth      from the same spherical triangle
 * Give it a latitude and it produces true day length, true seasonal sun
 * height, and a polar night if you go far enough north. The Reach sits at 58°N
 * by declaration below, which is what makes its winters short and grey and its
 * summers long and low-angled — that is a consequence of the number, not a
 * mood decision.
 *
 * WHAT "EXTREME SUN" MEANS PHYSICALLY
 * Not a brighter light. Three separate things:
 *   1. High elevation → short shadows, near-white key, and a sky that scatters
 *      less (short air mass), so contrast goes UP and the world bleaches.
 *   2. Air mass reddening at low elevation: AM ≈ 1/sin(α), and a sun at 5°
 *      travels ~11 atmospheres of air, which is why it goes red. Same equation
 *      handles sunrise, sunset and a winter noon.
 *   3. Refractive shimmer over hot ground — an inferior mirage. Requires a
 *      temperature gradient, so it only appears where the ground is hot.
 * God rays are crepuscular rays, and they are *scattering off aerosol*. With
 * clean air there are no god rays. That is why sunGlare reads uDust and the
 * desert is the biome where the effect is strongest — the two are physically
 * linked rather than artistically bundled.
 *
 * THE BLIZZARD / SANDSTORM DISTINCTION IS ALSO PHYSICS
 * Both are wind full of particles, and they look nothing alike because of one
 * number: terminal velocity.
 *   snowflake  ~1 m/s   → in a 20 m/s wind it travels at 87° off vertical
 *   raindrop   ~6.5 m/s → the same wind gives 72°, visibly steeper
 *   sand grain ~1.5 m/s but 2000× the mass of a flake, so it cannot stay up:
 *              it SALTATES, bouncing within about 1.5 m of the ground
 *   dust       <0.06 mm → suspends, and reaches kilometres
 * So a blizzard is a full-height volume and a sandstorm is a dense shallow
 * saltation layer under a tall thin suspension haze. Building a sandstorm as
 * "a blizzard with beige particles" is exactly the mistake this comment is
 * here to prevent.
 */
import * as THREE from 'three';
import { MAT, rnd, part, ico, jitter, cnt } from './hm-core.js';
import {
  VFX_ENV, pal, gpuPoints, softVolume, lightPool, axesOf, measureFx,
  terminalVelocity, NOISE_GLSL, FOG_GLSL, vfxTexture,
} from './hm-vfx.js';

const DEG = Math.PI / 180;

/* ---------------------------------------------------------------- the sun */

/** Real solar position. `day` is 1–365, `hour` is 0–24 local solar time. */
export function solarPosition(day = 172, hour = 12, latDeg = 58) {
  const dec = 23.44 * DEG * Math.sin(((360 * (284 + day)) / 365) * DEG);
  const lat = latDeg * DEG;
  const ha = (hour - 12) * 15 * DEG;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  // Azimuth measured from north, going clockwise, as a compass bearing does.
  const y = -Math.sin(ha) * Math.cos(dec);
  const x = Math.cos(lat) * Math.sin(dec) - Math.sin(lat) * Math.cos(dec) * Math.cos(ha);
  const az = Math.atan2(y, x);
  // Day length from the sunrise hour angle. cos(H0) = -tan φ tan δ, and when
  // that leaves [-1,1] the sun never sets or never rises — polar day and
  // polar night fall out of the formula rather than needing a special case.
  const cosH0 = -Math.tan(lat) * Math.tan(dec);
  const dayHours = cosH0 <= -1 ? 24 : cosH0 >= 1 ? 0 : (2 * Math.acos(cosH0) * 12) / Math.PI;
  return {
    altitude: alt / DEG,
    azimuth: az / DEG,
    declination: dec / DEG,
    dayHours,
    // Optical air mass. Kasten–Young below the horizon-ish region, clamped:
    // the naive 1/sin(alt) blows up at sunset and takes the colour with it.
    airMass: alt > 0
      ? 1 / (Math.sin(alt) + 0.50572 * Math.pow(alt / DEG + 6.07995, -1.6364))
      : 40,
    dir: new THREE.Vector3(
      Math.cos(alt) * Math.sin(az),
      Math.sin(alt),
      Math.cos(alt) * Math.cos(az)),
  };
}

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'];

/* ------------------------------------------------------- air temperature
 * Freezing water and turning leaves both need a TEMPERATURE, and a temperature
 * is not a date. Two physical facts shape this curve:
 *
 *   1. THERMAL LAG. Peak insolation is the solstice, but peak air temperature
 *      is four to six weeks later, because land and sea take that long to
 *      warm. Same at the other end — the coldest weeks are late January, not
 *      the December solstice. Without the lag the first frost lands on the
 *      wrong side of midwinter and the whole year feels mis-keyed.
 *   2. DIURNAL SWING lags too: the daily minimum is around dawn, not midnight,
 *      because the ground keeps radiating until the sun comes back.
 *
 * Latitude sets the annual mean and the amplitude — a high-latitude continent
 * swings much harder than the tropics. */
export function airTemperature(day, hour, latDeg = 58, biome = 'ash') {
  const B = CLIMATE_ZONES[biome] || CLIMATE_ZONES.ash;
  const lat = Math.abs(latDeg);
  // Insolation from 30 days ago is what today's air temperature reflects.
  const prev = ((Math.round(day) - 30) % 365 + 365) % 365 || 365;
  const lagged = solarPosition(prev, 12, latDeg);
  const annualMean = B.meanTemp - lat * 0.42;
  // A maritime zone swings less: water's heat capacity buffers the year.
  const amplitude = (4 + lat * 0.26) * (B.amplitudeScale != null ? B.amplitudeScale : 1);
  /* Normalise the lagged noon altitude against the year's OWN range at this
     latitude, so swing is a true −1 (midwinter) … +1 (midsummer) everywhere.
     Using sin(altitude) raw does not work: at 58°N midwinter noon is still 8.6°
     above the horizon, so the sine stays positive and winter never gets cold —
     the curve has to be relative to the local extremes, not to the horizon. */
  const maxAlt = 90 - lat + 23.44;
  const minAlt = 90 - lat - 23.44;
  const span = Math.max(1e-6, maxAlt - minAlt);
  const swing = Math.max(-1, Math.min(1, (2 * (lagged.altitude - minAlt)) / span - 1));
  const daily = annualMean + swing * amplitude + B.tempOffset;
  // Diurnal: minimum near dawn, maximum mid-afternoon.
  const diurnal = -Math.cos(((hour - 4) / 24) * Math.PI * 2) * B.diurnal;
  return daily + diurnal;
}

/* Photoperiod is the real trigger for autumn colour — trees measure NIGHT
 * length, not temperature, which is why the turn happens on schedule even in a
 * warm autumn. Below about 12 hours of daylight the abscission programme runs;
 * frost then accelerates it.
 *
 * SPRING IS A DIFFERENT MECHANISM, and that asymmetry is the whole reason this
 * function is not one curve. Bud break is driven by accumulated WARMTH, not by
 * day length — which is why a cold spring is a late spring while a warm autumn
 * is still an on-time autumn. Modelling both ends off photoperiod produces a
 * canopy that turns green again in January, because January's day length is the
 * same as October's: the sun cannot tell them apart. A deciduous tree in
 * midwinter is bare, and it stays bare until it is warm.
 */
function leafState(dayHours, temp, shortening) {
  if (shortening) {
    // Autumn: colour on photoperiod, accelerated by frost.
    let turn = Math.max(0, Math.min(1, (12.5 - dayHours) / 2.5));
    if (temp < 0) turn = Math.min(1, turn + -temp * 0.06);
    // Drop trails the turn — a leaf colours well before it lets go, so this
    // runs on a later, shorter day-length window rather than off `turn`.
    const drop = Math.max(0, Math.min(1, (11 - dayHours) / 2));
    return { turn, drop, phase: drop > 0.85 ? 'bare' : turn > 0.15 ? 'turning' : 'green' };
  }
  // Lengthening days: dormant and bare until spring warmth releases the buds.
  const leafOut = Math.max(0, Math.min(1, (temp - 3) / 6));
  const turn = 1 - leafOut;
  const drop = 1 - leafOut;
  return {
    turn, drop,
    phase: leafOut < 0.1 ? 'bare' : leafOut < 0.9 ? 'leafing' : 'green',
  };
}

/** Season from day-of-year, on the astronomical boundaries (solstices and
 *  equinoxes), plus how far through that season we are. */
export function seasonOf(day) {
  const d = ((day - 1) % 365 + 365) % 365 + 1;
  const bounds = [[355, 79], [79, 172], [172, 266], [266, 355]];
  let idx = 0;
  if (d >= 79 && d < 172) idx = 1;
  else if (d >= 172 && d < 266) idx = 2;
  else if (d >= 266 && d < 355) idx = 3;
  const [a, b] = bounds[idx];
  const span = idx === 0 ? 365 - 355 + 79 : b - a;
  const into = idx === 0 ? (d >= 355 ? d - 355 : d + 10) : d - a;
  return { index: idx, name: SEASONS[idx], t: Math.max(0, Math.min(1, into / span)), day: d };
}

/* Biomes. Two, because the ask named two: the Reach as it is, and a desert.
   Each is a set of ATMOSPHERIC properties, not a colour grade — the palette
   stays the system's, and what changes is turbidity, dryness and ground heat. */
/* Climate zones. Named CLIMATE_ZONES and not BIOMES on purpose: hm-biome.js
 * already exports a BIOMES array, and two different public `BIOMES` in one kit
 * is a collision waiting to bite whichever module imports second.
 *
 * The ids are the REAL biome ids from hm-biome.js, so a scene that already
 * knows its biome gets its atmosphere for free rather than choosing twice. A
 * biome there is what a surface looks like (tint, roughness, overlays); a zone
 * here is what the AIR does. They are the same five places seen two ways.
 *
 * `desert` is the exception and is marked as such: the repo declares no arid
 * region, so it is a proposed zone rather than a grounded one. Everything
 * else maps onto something `worldAssets.js` already names. */
export const CLIMATE_ZONES = {
  /* hm-biome.js `ash` — region 'all'. The baseline Reach: sun dimmed behind a
     permanent ash veil, wetness 0.82 as the hearthmere kit declares. */
  ash: {
    label: 'Ash · the Reach', biome: 'ash', region: 'all', grounded: true,
    wetness: 0.82, dust: 0.14, groundHeat: 0.0, turbidity: 0.55,
    fog: '#0e1518', fogDensity: 0.0072,
    hemiSky: '#8fa5ac', hemiGround: '#2b2318',
    fogSeason: [1.55, 1.0, 0.72, 1.3],
    meanTemp: 32, tempOffset: -2, diurnal: 3.5,
  },
  /* hm-biome.js `forge` — Cinderward. Cooled slag crusts the base and the
     cracks still carry heat, so this is the one zone with hot ground and no
     sun: an interior, lit by what it is smelting. */
  forge: {
    label: 'Forge · Cinderward', biome: 'forge', region: 'cinderward', grounded: true,
    wetness: 0.3, dust: 0.42, groundHeat: 0.75, turbidity: 0.8,
    fog: '#1a1210', fogDensity: 0.014,
    hemiSky: '#6b5a4c', hemiGround: '#3a1e12',
    fogSeason: [1.2, 1.0, 1.0, 1.1],
    meanTemp: 40, tempOffset: 8, diurnal: 2,
  },
  /* hm-biome.js `rime` — the Mirror-Salt Waste, "where white storms erase
     direction. Ice loads every upward face." The blizzard family's home, and
     the reason snow cover is applied to upward-facing normals. */
  rime: {
    label: 'Rime · Mirror-Salt Waste', biome: 'rime', region: 'salt_waste_frontier', grounded: true,
    wetness: 0.5, dust: 0.06, groundHeat: 0.0, turbidity: 0.4,
    fog: '#131c20', fogDensity: 0.011,
    // High albedo: snow bounces a great deal of light back up, which is why a
    // snowfield reads bright from below as well as above.
    hemiSky: '#aebfc6', hemiGround: '#7d8f96',
    fogSeason: [1.9, 1.3, 0.85, 1.5],
    meanTemp: 20, tempOffset: -8, diurnal: 5,
  },
  /* hm-biome.js `verdant` — Dunmire. Nine years of unchecked overgrowth: warm,
     humid, and the only place in the Reach where fog is green. */
  verdant: {
    label: 'Verdant · Dunmire', biome: 'verdant', region: 'dunmire', grounded: true,
    wetness: 0.9, dust: 0.05, groundHeat: 0.1, turbidity: 0.62,
    fog: '#131a14', fogDensity: 0.0105,
    hemiSky: '#8a9c86', hemiGround: '#2c3320',
    fogSeason: [1.4, 1.2, 0.9, 1.35],
    meanTemp: 42, tempOffset: 3, diurnal: 3,
  },
  /* hm-biome.js `drowned` — the Veil Coast and flooded parish. Maritime, so
     the smallest seasonal swing anywhere: water buffers the year. */
  drowned: {
    label: 'Drowned · Veil Coast', biome: 'drowned', region: 'veil_coast_frontier', grounded: true,
    wetness: 1.0, dust: 0.04, groundHeat: 0.0, turbidity: 0.7,
    fog: '#0d1618', fogDensity: 0.0125,
    hemiSky: '#8296a0', hemiGround: '#243033',
    fogSeason: [1.5, 1.3, 1.0, 1.4],
    // Maritime: a cool mean, and a small annual amplitude because the sea has
    // an enormous heat capacity. Set via amplitudeScale below.
    meanTemp: 36, tempOffset: 1, diurnal: 2, amplitudeScale: 0.55,
  },
  /* PROPOSED, not grounded: worldAssets.js declares no arid region. Kept
     because the ask named it, and flagged so nobody mistakes it for canon. */
  desert: {
    label: 'Ash Waste · proposed', biome: null, region: null, grounded: false,
    wetness: 0.04, dust: 0.55, groundHeat: 1.0, turbidity: 0.35,
    fog: '#241d13', fogDensity: 0.0042,
    hemiSky: '#c9b48b', hemiGround: '#4a3a22',
    fogSeason: [0.9, 1.5, 0.8, 1.1],
    meanTemp: 48, tempOffset: 6, diurnal: 14,
  },
};

/* Back-compat alias. Anything already importing BIOMES from this module keeps
   working, but the name is deprecated in favour of CLIMATE_ZONES — see the
   collision note above. */
export const BIOMES = CLIMATE_ZONES;

/** The climate zone for a declared region id, falling back to the baseline.
 *  `ash` covers region 'all', which is what makes it the right default. */
export function zoneForRegion(regionId) {
  for (const k of Object.keys(CLIMATE_ZONES)) {
    if (CLIMATE_ZONES[k].region === regionId) return k;
  }
  return 'ash';
}

/* Sun colour by air mass. This is the one place a colour is COMPUTED rather
   than picked, and it has to be: the same sun has to be white overhead and red
   on the horizon, and no pair of palette tokens can interpolate that honestly
   through a whole day. The endpoints are still the system's — bone-bright at
   the top, --ember at the horizon. */
const SUN_HIGH = new THREE.Color('#e6ecec');
const SUN_MID = new THREE.Color('#e4c77e');
const SUN_LOW = new THREE.Color('#bd6135');
const SUN_NIGHT = new THREE.Color('#2f4a57');

function sunColour(alt, airMass, turbidity) {
  const c = new THREE.Color();
  if (alt <= -6) return c.copy(SUN_NIGHT);
  // Reddening tracks air mass, scaled by how much haze there is to redden it.
  const k = Math.min(1, ((airMass - 1) / 9) * (0.6 + turbidity * 0.8));
  if (alt < 6) {
    c.copy(SUN_MID).lerp(SUN_LOW, Math.min(1, k * 1.3));
    // Fold to night through the civil-twilight band rather than snapping.
    return c.lerp(SUN_NIGHT, 1 - Math.max(0, (alt + 6) / 12));
  }
  return c.copy(SUN_HIGH).lerp(SUN_MID, k);
}

/** The full climate reading for a moment. Everything a scene needs to light
 *  itself, derived from four inputs and nothing else. */
export function climateState(o = {}) {
  const day = o.day != null ? o.day : 172;
  const hour = o.hour != null ? o.hour : 12;
  const lat = o.latitude != null ? o.latitude : 58;
  const B = CLIMATE_ZONES[o.biome] || CLIMATE_ZONES.ash;
  const sun = solarPosition(day, hour, lat);
  const season = seasonOf(day);
  const alt = sun.altitude;
  /* Is the year shortening? Compare today's day length with a week ago. The
     SIGN of that difference is the only thing separating a 12-hour March from a
     12-hour September — the sun cannot tell them apart, and neither can a model
     that looks only at day length. */
  const weekAgo = ((Math.round(day) - 7) % 365 + 365) % 365 || 365;
  const shortening = solarPosition(weekAgo, 12, lat).dayHours > sun.dayHours;
  const temp = airTemperature(day, hour, lat, o.biome || 'ash');
  const leaf = leafState(sun.dayHours, temp, shortening);

  // Night is a smooth ramp through twilight, not a threshold. Civil twilight
  // ends at -6°, nautical at -12°; the world is genuinely dark by then.
  const night = 1 - Math.max(0, Math.min(1, (alt + 12) / 22));
  const up = Math.max(0, Math.sin(alt * DEG));

  const sunCol = sunColour(alt, sun.airMass, B.turbidity);
  // Direct sun falls off with air mass (Beer–Lambert, roughly) as well as with
  // angle, which is why a low sun is dim AND red rather than merely red.
  const extinction = Math.exp(-0.16 * B.turbidity * Math.max(0, sun.airMass - 1));
  const keyI = up * 3.1 * extinction * (o.overcast != null ? 1 - o.overcast * 0.72 : 1);

  const fogCol = new THREE.Color(B.fog);
  /* SKY LUMINANCE. The sky is bright because it is scattering sunlight, so its
     luminance has to rise with sun elevation — and the more turbid the air, the
     more there is to scatter off, which is exactly why a dusty desert noon is a
     blinding white haze while a clean high-altitude noon is deep blue.
     Getting this wrong is not subtle: with only a low-sun warm tint (the first
     version of this function) the fog stayed at its dark biome value all day,
     so the brighter the sun got the darker the sky stayed, and a tropical noon
     rendered near-black. The horizon is the thing that gives a sun its
     "extreme" — not the intensity of the key light. */
  const scatter = Math.min(0.92, up * (0.3 + B.turbidity * 0.55 + B.dust * 0.95));
  fogCol.lerp(new THREE.Color(B.hemiSky), scatter);
  // Then the low-sun warm cast: a foggy sunrise is orange because the fog is
  // what you are seeing the sun through.
  const lowSun = Math.max(0, 1 - Math.abs(alt) / 22) * up;
  fogCol.lerp(sunCol, lowSun * 0.45);
  const fogDensity = B.fogDensity * B.fogSeason[season.index]
    * (1 + night * 0.5) * (o.fogScale != null ? o.fogScale : 1);

  return {
    day, hour, latitude: lat, biome: o.biome || 'ash',
    biomeLabel: B.label, grounded: B.grounded !== false, region: B.region,
    season, sun, night, dayHours: sun.dayHours,
    sunColor: sunCol,
    keyIntensity: keyI,
    // Sky fill rises when the sun is high and stays as the only light source
    // after it sets; a scene lit by nothing at night is unreadable, and real
    // nights have sky glow.
    hemiSky: new THREE.Color(B.hemiSky),
    hemiGround: new THREE.Color(B.hemiGround),
    hemiIntensity: 0.1 + up * 1.05 * (1 - night * 0.35),
    fillIntensity: 0.05 + up * 0.5,
    fogColor: fogCol, fogDensity,
    temperature: temp, shortening,
    // Freeze is a RANGE, not a flag: water skins over near zero and locks up a
    // few degrees below, which is what makes the shoulder seasons legible.
    freeze: Math.max(0, Math.min(1, (1.5 - temp) / 5.5)),
    leafTurn: leaf.turn, leafDrop: leaf.drop, canopy: leaf.phase,
    snowCover: Math.max(0, Math.min(1, (0.5 - temp) / 6)),
    heat: B.groundHeat * Math.pow(up, 1.4) * (season.index === 2 ? 1 : 0.55),
    dust: B.dust, wetness: B.wetness,
    // Shadow length as a multiple of object height, cot(altitude). Printed in
    // the lab because it is the most legible single number for "how high is
    // the sun" — a 3× shadow reads as evening at a glance.
    shadowLength: alt > 1 ? 1 / Math.tan(alt * DEG) : Infinity,
    exposure: 1.36 * (1 - up * 0.18),
  };
}

/* ------------------------------------------------------- seasonal foliage
 * The flora is instanced and merged by material, so a CPU recolour per plant is
 * not available — and would be the wrong tool anyway. Instead a material gets a
 * shader hook, exactly the way hm-world.js `windify()` does it, so the whole
 * canopy turns from one uniform.
 *
 * THE COLOUR PATH IS BOTANY, NOT A GRADIENT.
 * Autumn colour is two separate events. First chlorophyll breaks down, which
 * *reveals* the carotenoids that were in the leaf all along — that is the green
 * to gold step, and it is a subtraction. Only then do some species newly
 * synthesise anthocyanins, which is the gold to russet step, and it is an
 * addition. Running straight from green to russet in one lerp skips the yellow
 * that is the actual signature of a turning wood.
 *
 * Both endpoints stay inside the system: gold is --gold-bright held down, and
 * russet is --ember desaturated toward --blood, which is the same derivation
 * hm-core.js already used for MAT.heatherBloom. No new hues.
 *
 * Conifers do not turn. `evergreen: true` gives a needle only the winter
 * desaturation, which is real — needles do dull and lose carotene in cold.
 */
export const SEASON_UNIFORMS = {
  uLeafTurn: { value: 0 },
  uLeafDrop: { value: 0 },
  // Freeze and snow cover live on VFX_ENV, because hm-vfx.js's water shader
  // consumes them and this module imports that one. Aliased here so a caller
  // has one place to read seasonal state from.
  uFreeze: VFX_ENV.uFreeze,
  uSnowCover: VFX_ENV.uSnowCover,
};

const AUTUMN_GOLD = new THREE.Color('#8a6d34');
const AUTUMN_RUSSET = new THREE.Color('#6b3b23');
const WINTER_DULL = new THREE.Color('#3f4640');

export function seasonalFoliage(mat, o = {}) {
  const m = mat.clone();
  m.name = (o.name || mat.name) + '-seasonal';
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uLeafTurn = SEASON_UNIFORMS.uLeafTurn;
    shader.uniforms.uLeafDrop = SEASON_UNIFORMS.uLeafDrop;
    shader.uniforms.uSnowCover = SEASON_UNIFORMS.uSnowCover;
    shader.uniforms.uGold = { value: AUTUMN_GOLD };
    shader.uniforms.uRusset = { value: AUTUMN_RUSSET };
    shader.uniforms.uDull = { value: WINTER_DULL };
    shader.uniforms.uEvergreen = { value: o.evergreen ? 1 : 0 };
    // Per-instance variation, so a wood turns unevenly. Without it the whole
    // canopy flips on the same frame and reads as a global colour filter
    // rather than as a season arriving.
    shader.vertexShader = 'varying float vSeasonJit;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         vSeasonJit = fract(sin(instanceMatrix[3][0] * 12.9898 + instanceMatrix[3][2] * 78.233) * 43758.5453);
       #else
         vSeasonJit = 0.5;
       #endif`);
    shader.fragmentShader =
      'uniform float uLeafTurn;\nuniform float uLeafDrop;\nuniform float uSnowCover;\n'
      + 'uniform float uEvergreen;\nuniform vec3 uGold;\nuniform vec3 uRusset;\nuniform vec3 uDull;\n'
      + 'varying float vSeasonJit;\n'
      + shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         {
           // Each plant leads or trails the season by up to a fifth of the turn.
           float t = clamp(uLeafTurn * (0.75 + vSeasonJit * 0.5), 0.0, 1.0);
           if (uEvergreen > 0.5) {
             // A needle only dulls; it does not colour.
             diffuseColor.rgb = mix(diffuseColor.rgb, uDull, uSnowCover * 0.34);
           } else {
             // Chlorophyll breaks down first, REVEALING carotenoid gold …
             diffuseColor.rgb = mix(diffuseColor.rgb, uGold, smoothstep(0.0, 0.55, t));
             // … then anthocyanins are synthesised on top of it.
             diffuseColor.rgb = mix(diffuseColor.rgb, uRusset, smoothstep(0.5, 1.0, t) * 0.8);
             // A dropped leaf is gone, not merely brown.
             diffuseColor.rgb *= 1.0 - uLeafDrop * 0.55;
           }
           // Snow settles on what faces the sky, so it reads as accumulation
           // rather than as a wash over the whole plant.
           float up = clamp(vNormal.y, 0.0, 1.0);
           diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.79, 0.84, 0.85),
                                  uSnowCover * up * 0.62);
         }`);
  };
  // Changing onBeforeCompile requires a new program key, or three.js reuses the
  // cached shader for the original material and the hook never runs.
  m.customProgramCacheKey = () => 'seasonal-' + (o.evergreen ? 'ever' : 'decid');
  return m;
}

/** Push a climate reading into a scene's lights, fog and shared uniforms. */
export function applyClimate(st, r = {}) {
  if (r.key) {
    r.key.position.copy(st.sun.dir).multiplyScalar(120);
    r.key.color.copy(st.sunColor);
    r.key.intensity = st.keyIntensity;
  }
  if (r.hemi) {
    r.hemi.color.copy(st.hemiSky);
    r.hemi.groundColor.copy(st.hemiGround);
    r.hemi.intensity = st.hemiIntensity;
  }
  if (r.fill) {
    r.fill.intensity = st.fillIntensity;
    r.fill.color.copy(st.sunColor).lerp(new THREE.Color('#c9793c'), 0.5);
  }
  if (r.scene && r.scene.fog) {
    r.scene.fog.color.copy(st.fogColor);
    r.scene.fog.density = st.fogDensity;
  }
  if (r.scene && r.scene.background && r.scene.background.isColor) {
    // The sky reads slightly brighter than the fog it fades into, which is what
    // gives a horizon. Equal values erase it and the world looks like a room.
    r.scene.background.copy(st.fogColor).multiplyScalar(1.08);
  }
  if (r.renderer) r.renderer.toneMappingExposure = st.exposure;
  VFX_ENV.uNight.value = st.night;
  VFX_ENV.uSeason.value = (st.season.index + st.season.t) / 4;
  VFX_ENV.uSunDir.value.copy(st.sun.dir);
  VFX_ENV.uSunColor.value.copy(st.sunColor);
  VFX_ENV.uHeat.value = st.heat;
  VFX_ENV.uDust.value = st.dust;
  VFX_ENV.uWetness.value = st.wetness;
  VFX_ENV.uFogColor.value.copy(st.fogColor);
  VFX_ENV.uFogDensity.value = st.fogDensity;
  // Seasonal response for flora and water.
  SEASON_UNIFORMS.uLeafTurn.value = st.leafTurn;
  SEASON_UNIFORMS.uLeafDrop.value = st.leafDrop;
  VFX_ENV.uFreeze.value = st.freeze;
  VFX_ENV.uSnowCover.value = st.snowCover;
  return st;
}

/* ============================================================== blizzard ==
   severity × visibility × drift × ground × sting × squall × whiteout
   = 4 · 3 · 4 · 3 · 3 · 3 · 2 = 2,592 */
export const BLIZZARD_AXES = { severity: 4, visibility: 3, drift: 4, ground: 3, sting: 3, squall: 3, whiteout: 2 };
const SEVERITY = [
  { id: 'blowing snow', wind: 9, n: 1600, vis: 900 },
  { id: 'blizzard', wind: 16, n: 3200, vis: 380 },
  { id: 'severe blizzard', wind: 24, n: 5200, vis: 140 },
  { id: 'ground blizzard', wind: 31, n: 7000, vis: 45 },
];
export function blizzard(variant = 0, opts = {}) {
  const A = axesOf(variant, BLIZZARD_AXES);
  const S = SEVERITY[A.severity];
  const rand = rnd(0xb112 + variant * 7919);
  const g = new THREE.Group();
  g.name = 'vfx-blizzard';
  const E = opts.extent || 30;
  const H = opts.height || 20;

  /* The physics that makes a blizzard look like a blizzard: a snowflake's
     terminal velocity is about 1 m/s, so in this wind it travels at
     atan(wind / vt) off vertical — 84° at blizzard strength. It is not
     "snow, but faster". It is snow moving sideways. */
  const vt = terminalVelocity(4, 100, 1.4);         // ~1 m/s for a 4 mm flake
  const slantDeg = (Math.atan2(S.wind, vt) * 180) / Math.PI;
  const N = Math.round(S.n * (opts.density != null ? opts.density : 1));

  const flakes = gpuPoints({
    name: 'blizzard-snow', count: N, size: 0.055 + A.severity * 0.012,
    life: Math.max(1.1, (E * 1.6) / S.wind),        // time to cross the volume
    texture: 'flake', colA: 'bone', colB: 'glacier',
    gain: 1.35, opacity: 0.5, rand, radius: E * 2, cull: false,
    // Seeded across the whole volume including its full height, because a
    // near-horizontal field is entered from the SIDE, not from above.
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, r() * H, (r() - 0.5) * E * 2],
    p1: S.wind, p2: vt, p3: [1.5, 3, 5, 8][A.drift], p4: E * 2,
    // Downwind travel dominates; vertical is terminal velocity, which is
    // CONSTANT because a flake reaches it almost immediately. Gravity does not
    // appear here at all, and that is correct — a falling flake is not
    // accelerating, it is in balance with drag.
    motion: `vec3(
        uWindDir.x * (uP.x + uGust * 6.0) * life * uP.w * 0.5
          + sin(s.x * 6.28 + uTime * 2.1 + life * 7.0) * uP.z,
        -life * uP.y * uP.w * 0.12
          + sin(s.y * 6.28 + uTime * 1.7) * uP.z * 0.55,
        uWindDir.y * (uP.x + uGust * 6.0) * life * uP.w * 0.5
          + cos(s.z * 6.28 + uTime * 1.9 + life * 6.0) * uP.z)`,
    sizeCurve: `0.4 + s.z * 1.3`,
    alpha: `smoothstep(0.0, 0.04, life) * (1.0 - smoothstep(0.92, 1.0, life)) * (0.45 + s.x * 0.55)`,
    colorT: `s.w * 0.5`,
    rateSpread: '0.7 + s.w * 0.8',
  });
  g.add(flakes);

  /* Ground-lifted snow. This is what a *ground* blizzard actually is: the sky
     may be clear and the air is still full of snow, because the wind is
     picking it back up off the drifts. Distinct behaviour, so it earns its
     place on the severity axis rather than being more of the same. */
  const lifted = gpuPoints({
    name: 'lifted-snow', count: Math.round(N * 0.3), size: 0.07, life: 2.4,
    texture: 'smoke', colA: 'bone', colB: 'glacier',
    gain: 1.1, opacity: 0.3, rand, radius: E * 2, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0.02, (r() - 0.5) * E * 2],
    p1: S.wind, p2: 1.6 + A.severity * 0.7,
    // Lifted snow rises fast, then settles: it is thrown, not falling.
    motion: `vec3(
        uWindDir.x * uP.x * life * 0.55,
        uP.y * life * (1.0 - life) * 2.2,
        uWindDir.y * uP.x * life * 0.55)`,
    sizeCurve: `(0.6 + s.z) * (1.0 + life * 2.4)`,
    alpha: `sin(life * 3.14159) * 0.7`,
    colorT: `life`,
  });
  g.add(lifted);

  /* Visibility. A blizzard is DEFINED by it — under 400 m by the met service
     definition — and the honest way to render that is to raise the fog, not to
     put a white sheet over the lens. Extinction coefficient from the Koschmieder
     relation: visibility V ≈ 3.912 / σ, so σ = 3.912 / V. */
  const sigma = 3.912 / S.vis;
  g.userData.fogDensity = sigma * 0.5;

  /* Whiteout: the sky and the ground become the same luminance and the horizon
     stops existing. A real and specific phenomenon, not just heavy snow. */
  let veil = null;
  if (A.whiteout) {
    veil = softVolume({
      name: 'whiteout', count: cnt(14), size: E * 1.3, life: 9,
      rise: 0.05, spread: E * 0.5, grow: 1.2, opacity: 0.05 + A.severity * 0.018,
      colA: 'mist', colB: 'bone', gain: 1.15, drift: 5.5, rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, r() * H * 0.6, (r() - 0.5) * E * 2],
    });
    g.add(veil);
  }

  /* Drifts. Wind-shaped snow accumulating in the lee of things — the record
     that the storm has been going for a while. */
  if (A.ground > 0) {
    const snowMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#c9d6da'), roughness: 0.92, metalness: 0,
    });
    snowMat.name = 'snow-drift';
    for (let i = 0; i < cnt([0, 8, 18][A.ground]); i++) {
      const len = 1.4 + rand() * 4;
      const d = ico(len * 0.5, 1);
      // A drift is a long tapered wedge lying along the wind, not a lump.
      d.scale(len * 0.42, 0.16 + rand() * 0.3, len * 0.14);
      g.add(part(jitter(d, 0.1, rand), snowMat, 'drift-' + i, {
        pos: [(rand() - 0.5) * E * 1.7, 0.02, (rand() - 0.5) * E * 1.7],
        rot: [0, Math.atan2(VFX_ENV.uWindDir.value.y, VFX_ENV.uWindDir.value.x) + (rand() - 0.5) * 0.4, 0],
      }));
    }
    g.add(lightPool({ radius: E * 1.2, color: 'glacier', gain: 0.06 + A.ground * 0.05, flicker: 0, y: 0.01 }));
  }

  const fm = flakes.material, lm = lifted.material;
  return {
    group: g,
    declared: {
      severity: S.id, flakes: N,
      windSpeed: S.wind + ' m/s',
      slant: Math.round(slantDeg) + '\u00b0 off vertical',
      terminalVelocity: vt.toFixed(2) + ' m/s',
      visibility: A.visibility === 0 ? S.vis + ' m' : A.visibility === 1 ? Math.round(S.vis * 0.5) + ' m' : Math.round(S.vis * 0.22) + ' m',
      drift: ['tight', 'loose', 'wild', 'chaotic'][A.drift],
      ground: ['scoured', 'dusted', 'drifted'][A.ground],
      sting: ['none', 'gusting', 'lashing'][A.sting],
      squall: ['steady', 'pulsing', 'violent'][A.squall],
      whiteout: !!A.whiteout,
    },
    update(t, ctx) {
      if (ctx && ctx.camera) {
        g.position.x = Math.round(ctx.camera.position.x / 4) * 4;
        g.position.z = Math.round(ctx.camera.position.z / 4) * 4;
      }
      // Squalls: the wind itself surges, so slant and density move together.
      // Driving only the opacity gives a storm that gets thicker without ever
      // getting angrier, which is the tell of a faked gust.
      const sq = [0.12, 0.4, 0.85][A.squall];
      const s = 1 + Math.sin(t * 0.23) * sq + Math.sin(t * 0.61 + 1.3) * sq * 0.5;
      fm.uniforms.uP.value.x = S.wind * s;
      fm.uniforms.uOpacity.value = 0.5 * (0.75 + s * 0.3);
      lm.uniforms.uP.value.x = S.wind * s;
      lm.uniforms.uOpacity.value = 0.3 * (0.6 + s * 0.4) * [0.4, 1, 1.6][A.sting];
    },
    set(k, v) {
      if (k === 'severity') { fm.uniforms.uOpacity.value = 0.5 * v; lm.uniforms.uOpacity.value = 0.3 * v; }
      if (k === 'wind') { fm.uniforms.uP.value.x = S.wind * v; lm.uniforms.uP.value.x = S.wind * v; }
      if (k === 'whiteout' && veil) veil.children[0].material.uniforms.uOpacity.value = (0.05 + A.severity * 0.018) * v;
      if (k === 'size') fm.uniforms.uSize.value = (0.055 + A.severity * 0.012) * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================= sandstorm ==
   severity × grain × saltation × suspension × dune × static × wall
   = 4 · 3 · 3 · 4 · 3 · 3 · 2 = 2,592 */
export const SANDSTORM_AXES = { severity: 4, grain: 3, saltation: 3, suspension: 4, dune: 3, static: 3, wall: 2 };
const SAND_SEVERITY = [
  { id: 'blowing sand', wind: 8, n: 900, vis: 1200 },
  { id: 'sandstorm', wind: 15, n: 2200, vis: 400 },
  { id: 'severe sandstorm', wind: 22, n: 4000, vis: 120 },
  { id: 'haboob', wind: 30, n: 6000, vis: 30 },
];

export function sandstorm(variant = 0, opts = {}) {
  const A = axesOf(variant, SANDSTORM_AXES);
  const S = SAND_SEVERITY[A.severity];
  const rand = rnd(0x5a4d + variant * 7127);
  const g = new THREE.Group();
  g.name = 'vfx-sandstorm';
  const E = opts.extent || 30;
  const H = opts.height || 20;

  /* THE TWO LAYERS. This is the whole design of the effect.
     Sand grains (0.1–0.5 mm) are far too heavy to suspend: they SALTATE,
     hopping along in a dense sheet confined to roughly the first metre and a
     half. Dust (<0.06 mm) suspends and fills the sky. Rendering one uniform
     cloud of beige particles is the mistake — you lose the sharp-edged, dense,
     ankle-high river of sand that is the thing that actually reads as desert. */
  const grainMm = [0.45, 0.25, 0.12][A.grain];
  const vtSand = terminalVelocity(grainMm, 2650, 0.8);
  const saltHeight = [0.7, 1.5, 2.6][A.saltation];

  const salt = gpuPoints({
    name: 'saltation', count: Math.round(S.n * 0.55), size: 0.03 + grainMm * 0.06,
    life: Math.max(0.9, (E * 1.4) / S.wind),
    texture: 'spark', colA: 'goldBright', colB: 'ash',
    gain: 0.85, opacity: 0.55, rand, radius: E * 2, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, 0.02, (r() - 0.5) * E * 2],
    p1: S.wind, p2: saltHeight, p3: vtSand,
    // A hop: up fast, back down under gravity, repeatedly. The fract() is the
    // bounce — a grain in saltation is not on one long arc, it is on dozens of
    // short ones, and that is why the layer has a hard top edge.
    motion: `vec3(
        uWindDir.x * uP.x * life * 0.5,
        uP.y * (1.0 - pow(abs(fract(life * (3.0 + s.w * 4.0)) * 2.0 - 1.0), 1.6)) * (0.4 + s.z),
        uWindDir.y * uP.x * life * 0.5)`,
    sizeCurve: `0.5 + s.z * 0.9`,
    alpha: `smoothstep(0.0, 0.05, life) * (1.0 - smoothstep(0.85, 1.0, life)) * 0.85`,
    colorT: `s.w`,
    rateSpread: '0.8 + s.w * 0.9',
  });
  g.add(salt);

  const suspN = Math.round(S.n * 0.45 * [0.3, 0.7, 1.2, 1.8][A.suspension]);
  const dust = gpuPoints({
    name: 'suspended-dust', count: suspN, size: 0.5 + A.suspension * 0.3,
    life: 6, texture: 'smoke', colA: 'ash', colB: 'goldBright',
    gain: 0.6, opacity: 0.11, rand, radius: E * 2.4, cull: false,
    spawn: (i, n, r) => [(r() - 0.5) * E * 2, r() * H, (r() - 0.5) * E * 2],
    p1: S.wind, p2: H,
    // Suspension: carried with the wind, effectively neutrally buoyant, with a
    // slow turbulent wander. No settling term at all — that is what suspended
    // means, and it is why dust outlasts the storm.
    motion: `vec3(
        uWindDir.x * uP.x * life * 0.42 + sin(s.x * 6.28 + uTime * 0.4) * 2.2,
        sin(s.y * 6.28 + uTime * 0.31) * 1.4,
        uWindDir.y * uP.x * life * 0.42 + cos(s.z * 6.28 + uTime * 0.37) * 2.2)`,
    sizeCurve: `(0.7 + s.z * 0.8) * (1.0 + life * 1.6)`,
    alpha: `sin(life * 3.14159) * (0.5 + s.x * 0.5)`,
    colorT: `s.w * 0.7`,
  });
  g.add(dust);

  /* The haboob wall: a dust front with a visible leading edge, which is the
     single most recognisable desert-storm silhouette. Only on the top severity
     or when the axis asks, because a wall implies a density current. */
  let wall = null;
  if (A.wall) {
    wall = softVolume({
      name: 'dust-wall', count: cnt(22), size: E * 0.95, life: 14,
      rise: 0.5, spread: E * 0.3, grow: 1.5, opacity: 0.1 + A.severity * 0.03,
      colA: 'ash', colB: 'goldBright', gain: 0.9, drift: 3.4, rand,
      // Stacked into a front rather than scattered: a curtain, standing tall.
      spawn: (i, n, r) => {
        const k = i / Math.max(1, cnt(22) - 1);
        return [(k - 0.5) * E * 2.4, r() * H * 0.75, -E * 0.8 + (r() - 0.5) * 4];
      },
    });
    g.add(wall);
  }

  /* Dunes and the scoured ground under them. Sand needs somewhere to have come
     from or the storm is floating. */
  if (A.dune > 0) {
    const sandMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#a68b5b'), roughness: 0.96, metalness: 0,
    });
    sandMat.name = 'dune-sand';
    for (let i = 0; i < cnt([0, 5, 11][A.dune]); i++) {
      const len = 6 + rand() * 14;
      const d = ico(len * 0.4, 2);
      // A barchan is asymmetric: shallow windward, steep lee. Squashing an
      // icosphere and shearing it along the wind gets the read cheaply.
      d.scale(len * 0.5, 0.5 + rand() * 1.4, len * 0.26);
      g.add(part(jitter(d, 0.25, rand), sandMat, 'dune-' + i, {
        pos: [(rand() - 0.5) * E * 1.8, -0.1, (rand() - 0.5) * E * 1.8],
        rot: [0, Math.atan2(VFX_ENV.uWindDir.value.y, VFX_ENV.uWindDir.value.x) + (rand() - 0.5) * 0.3, 0],
      }));
    }
  }

  const sigma = 3.912 / S.vis;
  g.userData.fogDensity = sigma * 0.5;

  const sm = salt.material, dm = dust.material;
  return {
    group: g,
    declared: {
      severity: S.id, grains: Math.round(S.n * 0.55), dustMotes: suspN,
      windSpeed: S.wind + ' m/s',
      grain: grainMm + ' mm',
      grainTerminal: vtSand.toFixed(2) + ' m/s',
      saltation: saltHeight + ' m layer',
      suspension: ['thin', 'moderate', 'thick', 'choking'][A.suspension],
      visibility: S.vis + ' m',
      dune: ['scoured rock', 'low dunes', 'dune field'][A.dune],
      static: ['none', 'crackle', 'discharge'][A.static],
      wall: A.wall ? 'haboob front' : 'open',
    },
    update(t, ctx) {
      if (ctx && ctx.camera) {
        g.position.x = Math.round(ctx.camera.position.x / 4) * 4;
        g.position.z = Math.round(ctx.camera.position.z / 4) * 4;
      }
      const s = 1 + Math.sin(t * 0.19) * 0.3 + Math.sin(t * 0.53) * 0.15;
      sm.uniforms.uP.value.x = S.wind * s;
      dm.uniforms.uP.value.x = S.wind * s;
      sm.uniforms.uOpacity.value = 0.55 * (0.8 + s * 0.25);
    },
    set(k, v) {
      if (k === 'severity') { sm.uniforms.uOpacity.value = 0.55 * v; dm.uniforms.uOpacity.value = 0.11 * v; }
      if (k === 'wind') { sm.uniforms.uP.value.x = S.wind * v; dm.uniforms.uP.value.x = S.wind * v; }
      if (k === 'saltation') sm.uniforms.uP.value.y = saltHeight * v;
      if (k === 'suspension') dm.uniforms.uOpacity.value = 0.11 * v;
    },
    ...measureFx(g),
  };
}

/* ============================================================== sunGlare ==
   Extreme sun: shimmer, crepuscular rays, and bleached air.
   shimmer × rays × bleach × dust × ground × halo × mirage
   = 4 · 4 · 3 · 3 · 3 · 3 · 2 = 2,592 */
export const SUNGLARE_AXES = { shimmer: 4, rays: 4, bleach: 3, dust: 3, ground: 3, halo: 3, mirage: 2 };

export function sunGlare(variant = 0, opts = {}) {
  const A = axesOf(variant, SUNGLARE_AXES);
  const rand = rnd(0x53a1 + variant * 6871);
  const g = new THREE.Group();
  g.name = 'vfx-sun-glare';
  const E = opts.extent || 26;

  /* HEAT SHIMMER — an inferior mirage. Hot ground heats the air touching it;
     warm air is less dense, so its refractive index is lower, and light
     grazing it bends upward. The result is a vertical displacement that is
     strongest just above the surface and dies with height, wobbling at a few
     Hz. Rendered as a transparent shader plane that samples nothing: the
     displacement itself is what you see, as a distortion of luminance.
     Deliberately NOT a screen-space post pass \u2014 shimmer belongs at the hot
     surface, so it has to be occluded by anything in front of it. */
  const shimStrength = [0, 0.35, 0.7, 1.2][A.shimmer];
  let shimmer = null;
  if (A.shimmer > 0) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity,
        uHeat: VFX_ENV.uHeat, uSunColor: VFX_ENV.uSunColor,
        uFogColor: VFX_ENV.uFogColor, uFogDensity: VFX_ENV.uFogDensity,
        uStrength: { value: shimStrength },
        uMirage: { value: A.mirage ? 1 : 0 },
      },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv; varying float vFog;
        void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFog = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `
        uniform float uTime, uStrength, uIntensity, uHeat, uMirage;
        uniform vec3 uSunColor;
        varying vec2 vUv; varying float vFog;
        ${NOISE_GLSL}
        ${FOG_GLSL}
        void main(){
          // The gradient dies with height: dT/dz is steepest at the surface,
          // so shimmer is an ankle-high effect and not a full-screen wobble.
          float h = 1.0 - vUv.y;
          float grad = pow(h, 2.4);
          // Cells rising and wobbling. Two rates so it never reads as a
          // scrolling texture, which is what a single sine looks like.
          float w = fbm(vec3(vUv.x * 26.0, vUv.y * 7.0 - uTime * 1.6, uTime * 0.6))
                  + fbm2(vec3(vUv.x * 51.0, vUv.y * 13.0 - uTime * 2.7, 3.1)) * 0.5;
          float a = (w - 0.62) * grad * uStrength * uHeat * 1.6;
          // A mirage is the sky, folded up: an inverted bright band that reads
          // as water and is the reason distant desert ground looks wet.
          if (uMirage > 0.5) a += smoothstep(0.06, 0.0, h) * 0.28 * uHeat;
          if (a <= 0.002) discard;
          gl_FragColor = vec4(uSunColor * uIntensity * 0.8, a * (1.0 - fogFactor(vFog)));
        }`,
    });
    mat.name = 'heat-shimmer';
    // A ring of billboards around the viewer: shimmer is at the horizon, which
    // is where the line of sight grazes the hot ground for long enough to bend.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const q = new THREE.Mesh(new THREE.PlaneGeometry(E * 1.2, 2.4), mat);
      q.name = 'shimmer-' + i;
      q.position.set(Math.sin(a) * E, 1.1, Math.cos(a) * E);
      q.lookAt(0, 1.1, 0);
      q.renderOrder = 6;
      g.add(q);
    }
    shimmer = mat;
  }

  /* CREPUSCULAR RAYS. These are sunlight scattering off aerosol, so they
     scale with uDust: in clean air there are no god rays, and a desert or a
     dust storm is where they are strongest. Physically motivated rather than
     decorative, which is also why they are in this module and not in fire. */
  let rays = null;
  if (A.rays > 0) {
    const rm = new THREE.ShaderMaterial({
      uniforms: {
        uTime: VFX_ENV.uTime, uIntensity: VFX_ENV.uIntensity,
        uSunColor: VFX_ENV.uSunColor, uDust: VFX_ENV.uDust,
        uSunDir: VFX_ENV.uSunDir,
        uGain: { value: [0, 0.16, 0.34, 0.6][A.rays] },
        uCount: { value: [0, 5, 9, 15][A.rays] },
      },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime, uGain, uIntensity, uDust, uCount;
        uniform vec3 uSunColor, uSunDir;
        varying vec2 vUv;
        ${NOISE_GLSL}
        void main(){
          // Shafts fanning from a point: bands in angle, softened by noise so
          // they are gaps in a cloud rather than a lens artefact.
          vec2 c = vUv - vec2(0.5, 1.0);
          float ang = atan(c.x, -c.y);
          float band = 0.5 + 0.5 * sin(ang * uCount + fbm(vec3(ang * 3.0, uTime * 0.08, 0.0)) * 4.0);
          band = pow(band, 3.2);
          // Fade with distance from the source and toward the horizon.
          float r = clamp(1.0 - length(c) * 0.85, 0.0, 1.0);
          // Aerosol is what makes a ray visible at all.
          float a = band * r * uGain * uIntensity * smoothstep(0.02, 0.45, uDust)
                  * max(0.0, uSunDir.y);
          if (a <= 0.003) discard;
          gl_FragColor = vec4(uSunColor * 1.3, a * 0.5);
        }`,
    });
    rm.name = 'crepuscular-rays';
    rays = new THREE.Mesh(new THREE.PlaneGeometry(E * 2.4, E * 1.5), rm);
    rays.name = 'god-rays';
    rays.renderOrder = 7;
    g.add(rays);
  }

  /* Bleached air: an aerial-perspective wash that lifts the far distance
     toward the sun's colour. This is the "extreme" in extreme sun — a desert
     noon has less contrast at distance, not more. */
  let bleach = null;
  if (A.bleach > 0) {
    bleach = softVolume({
      name: 'bleach-haze', count: cnt([0, 8, 16][A.bleach]), size: E * 1.4,
      life: 22, rise: 0.02, spread: E * 0.3, grow: 1.1,
      opacity: [0, 0.035, 0.07][A.bleach], colA: 'ash', colB: 'bone',
      gain: 1.05, drift: 0.7, rand,
      spawn: (i, n, r) => [(r() - 0.5) * E * 2, 1 + r() * 8, (r() - 0.5) * E * 2],
    });
    g.add(bleach);
  }

  /* Dust devils and lifted grit — the visible sign that the ground is hot
     enough to drive convection. */
  let devil = null;
  if (A.dust > 0) {
    devil = gpuPoints({
      name: 'lifted-grit', count: [0, 90, 220][A.dust], size: 0.055,
      life: 4.5, texture: 'smoke', colA: 'ash', colB: 'goldBright',
      gain: 0.7, opacity: 0.3, rand, radius: E, cull: false,
      spawn: (i, n, r) => [(r() - 0.5) * E, 0.05, (r() - 0.5) * E],
      p1: 3.4, p2: 1,
      // A thermal: rising while rotating, tightening as it climbs. Buoyancy,
      // not wind — which is why it goes UP in still air.
      motion: `vec3(
          cos(s.x * 6.28 + life * 7.0) * uP.y * (1.4 - life) + uWindDir.x * uWind * life * 1.2,
          life * uP.x * (0.5 + s.w),
          sin(s.x * 6.28 + life * 7.0) * uP.y * (1.4 - life) + uWindDir.y * uWind * life * 1.2)`,
      sizeCurve: `(0.5 + s.z) * (1.0 + life * 1.4)`,
      alpha: `sin(life * 3.14159) * 0.75`,
      colorT: `s.w`,
    });
    g.add(devil);
  }

  /* Sun-baked ground: a hot pool that reads as reflected glare off pale rock,
     and the cracked crust of a dry lake bed. */
  if (A.ground > 0) {
    g.add(lightPool({
      radius: E * 0.9, color: A.ground === 2 ? 'goldBright' : 'bone',
      gain: [0, 0.1, 0.2][A.ground], flicker: 0, y: 0.02,
    }));
  }

  return {
    group: g,
    declared: {
      shimmer: ['none', 'faint', 'strong', 'boiling'][A.shimmer],
      rays: ['none', 'few', 'banded', 'cathedral'][A.rays],
      bleach: ['clear', 'washed', 'blinding'][A.bleach],
      dust: ['still', 'lifting', 'devils'][A.dust],
      ground: ['shadowed', 'baked', 'glaring'][A.ground],
      halo: ['none', 'ring', 'pillar'][A.halo],
      mirage: A.mirage ? 'inferior mirage' : 'none',
      note: 'rays scale with atmospheric dust; shimmer with ground heat',
    },
    update(t, ctx) {
      if (ctx && ctx.camera) {
        g.position.x = ctx.camera.position.x;
        g.position.z = ctx.camera.position.z;
        // The ray plane faces the viewer and sits toward the sun, so the fan
        // converges where the light actually is.
        if (rays) {
          const s = VFX_ENV.uSunDir.value;
          rays.position.set(s.x * E * 0.8, E * 0.5, s.z * E * 0.8);
          rays.lookAt(ctx.camera.position.x - g.position.x, 2, ctx.camera.position.z - g.position.z);
        }
      }
    },
    set(k, v) {
      if (k === 'shimmer' && shimmer) shimmer.uniforms.uStrength.value = shimStrength * v;
      if (k === 'rays' && rays) rays.material.uniforms.uGain.value = [0, 0.16, 0.34, 0.6][A.rays] * v;
      if (k === 'bleach' && bleach) bleach.children[0].material.uniforms.uOpacity.value = [0, 0.035, 0.07][A.bleach] * v;
      if (k === 'dust' && devil) devil.material.uniforms.uOpacity.value = 0.3 * v;
    },
    ...measureFx(g),
  };
}

export const CLIMATE_FAMILIES = [
  {
    id: 'hm.vfx.blizzard', name: 'Blizzard and whiteout', group: 'climate',
    axes: BLIZZARD_AXES, build: blizzard, stage: 'volume', prior: null,
    hero: { severity: 2, visibility: 1, drift: 2, ground: 2, sting: 1, squall: 1, whiteout: 1 },
    params: [
      { key: 'severity', label: 'Density', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'wind', label: 'Wind speed', min: 0.2, max: 2.4, step: 0.05, value: 1 },
      { key: 'whiteout', label: 'Whiteout', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'size', label: 'Flake size', min: 0.3, max: 3, step: 0.05, value: 1 },
    ],
    note: 'Not snow made faster \u2014 snow made SIDEWAYS. A flake\u2019s terminal velocity is ~1 m/s, so a 24 m/s wind lays it over to 87\u00b0 off vertical. Visibility comes from the Koschmieder relation, so the declared metres and the fog you see are the same number.',
  },
  {
    id: 'hm.vfx.sandstorm', name: 'Sandstorm and haboob', group: 'climate',
    axes: SANDSTORM_AXES, build: sandstorm, stage: 'volume', prior: null,
    hero: { severity: 2, grain: 1, saltation: 1, suspension: 2, dune: 1, static: 1, wall: 1 },
    params: [
      { key: 'severity', label: 'Density', min: 0, max: 2, step: 0.05, value: 1 },
      { key: 'wind', label: 'Wind speed', min: 0.2, max: 2.4, step: 0.05, value: 1 },
      { key: 'saltation', label: 'Saltation height', min: 0.2, max: 3, step: 0.05, value: 1 },
      { key: 'suspension', label: 'Dust load', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'Two layers, because sand and dust obey different physics: grains are 2,650 kg/m\u00b3 and cannot suspend, so they SALTATE in a hard-topped sheet near the ground, while sub-60-micron dust fills the sky. One beige particle cloud would lose the thing that reads as desert.',
  },
  {
    id: 'hm.vfx.sunglare', name: 'Extreme sun, shimmer and rays', group: 'climate',
    axes: SUNGLARE_AXES, build: sunGlare, stage: 'volume', prior: null,
    hero: { shimmer: 2, rays: 2, bleach: 1, dust: 1, ground: 1, halo: 1, mirage: 1 },
    params: [
      { key: 'shimmer', label: 'Heat shimmer', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'rays', label: 'God rays', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'bleach', label: 'Aerial bleach', min: 0, max: 2.4, step: 0.05, value: 1 },
      { key: 'dust', label: 'Lifted grit', min: 0, max: 2.4, step: 0.05, value: 1 },
    ],
    note: 'Shimmer is an inferior mirage \u2014 it needs hot ground, so it fades with the sun and dies at night. God rays are aerosol scattering, so they scale with atmospheric dust: in clean air there are none. Both are tied to the solar model rather than to a slider.',
  },
];
