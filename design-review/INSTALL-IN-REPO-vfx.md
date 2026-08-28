# Insert into `sable-reach` — the elemental VFX layer

Twenty procedural effect families for fire, water, weather, the veil and
climate, a real solar model driving days and seasons, and the bloom pass that
makes them read. Built to sit alongside the Hearthmere 3D environment kit, not
to replace any of it.

Read-only access to the repo; nothing here was written back.

---

## Why this exists

The Reach is deliberately dark — near-black grounds, bone type, one gold
accent, grain over everything. That reads well and it reads **flat**, because
nothing in it is bright. Fire, water, storm and wisp-light are the only places
the world is allowed to be vivid, so they carry the whole contrast budget of
the frame.

`hm-world.js` had first-pass versions of three of these: `makeFire()` (three
cone shells and an ember cloud), `flowWater()` (two wave trains on the
vertices) and a 900-point CPU rain in the Living World page. They work. They
also cannot be *breathtaking*, because they are authored to sit politely inside
sRGB. This layer is authored for high dynamic range and a bloom pass instead.

---

## Files

| File | What |
| --- | --- |
| `hm-vfx.js` | Engine: palette, shared environment uniforms, GLSL noise, particle sprites, the GPU points system, the flame body, the water shader, the falling-water sheet, soft volumes, the light pool, planar reflection, **ballistics helpers**, measurement |
| `hm-vfx-fire.js` | Bonfire · forge fire · torch/lantern/candle · embers and ash fall |
| `hm-vfx-water.js` | Waterfall · flowing channel · still pool and marsh · geyser and hot spring |
| `hm-vfx-weather.js` | Rain and wet ground · snow · wind, leaves and dust · fog and ground mist · lightning |
| `hm-vfx-veil.js` | Marsh lights · aether and hexcraft · steam and furnace breath · frost and ice crust |
| `hm-vfx-climate.js` | **The solar model** (day + season) · biomes · blizzard · sandstorm · extreme sun |
| `hm-vfx-index.js` | The registry, the variant-index inverse, and the deferred list |

Proposed home: `apps/client/src/three/vfx/`, beside the existing kit modules.
The only hard dependencies are `three` and `hm-core.js`.

---

## The solar model — days and seasons are one equation

`hm-vfx-climate.js` is built around real solar geometry rather than a set of
time-of-day presets:

```
declination  δ = 23.44° · sin(360°(284 + n)/365)        (Cooper 1969)
hour angle   h = 15°(t − 12)
elevation    sin α = sin φ sin δ + cos φ cos δ cos h
day length   cos H₀ = −tan φ tan δ
air mass     Kasten–Young, for reddening and extinction
```

**A season is a day-of-year in that equation, not a colour grade.** Which is
the whole argument for doing it this way: four hand-authored presets give you a
winter noon with a summer sun angle, and the world stops being a place and
becomes a stack of filters. Verified against known values at 58°N:

| Moment | Model | Expected |
| --- | --- | --- |
| Equinox noon | 31.6°, 11.9 h | 32°, 12 h |
| Midsummer noon | 55.4°, 17.9 h | 55.4°, ~17.9 h |
| Midwinter noon | 8.6°, 6.1 h | 8.6°, ~6.3 h |
| 67°N midwinter | −0.4°, 0 h | polar night |
| Equator equinox | 89.6°, 12 h | ~90°, 12 h |

Polar night and midnight sun fall out of `cos H₀` leaving [−1, 1] — no special
case. The Reach is declared at 58°N, which is *why* its winters are six-hour
and its sun never climbs past 9°: the region's cold_overcast mood is a
consequence of a number rather than a mood decision.

Two biomes: `reach` (wet, turbid, cold) and `desert` (dry, dusty, hot ground).
A biome is a set of atmospheric properties — turbidity, dust load, ground heat,
wetness — not a palette swap. The palette stays the system's.

---

## Seasonal response — flora and water

`airTemperature(day, hour, lat, biome)` closes the loop between the solar model
and the things that visibly respond to a season. Two physical facts shape it:

- **Thermal lag.** Peak insolation is the solstice; peak air temperature is
  four to six weeks later, because land and sea take that long to warm. The
  coldest weeks are late January, not late December. Without the lag the first
  frost lands on the wrong side of midwinter and the year feels mis-keyed.
- **The swing must be normalised against the local extremes.** Using
  `sin(altitude)` raw does not work: at 58°N midwinter noon is still 8.6° above
  the horizon, so the sine stays positive and winter never gets cold.

**Leaf turn is photoperiod; bud break is warmth.** That asymmetry is the whole
reason `leafState` is not one curve. Trees measure night length, which is why a
warm autumn is still an on-time autumn — but a cold spring is a late spring,
because bud break runs on accumulated heat. Modelling both ends off day length
produces a canopy that **turns green again in January**, since January's day
length matches October's and the sun cannot tell them apart. A deciduous tree
in midwinter is bare, and it stays bare until it is warm.

The colour path is botany, not a gradient. Chlorophyll breaks down first, which
*reveals* carotenoids that were already in the leaf — green to gold, a
subtraction. Only then are anthocyanins newly synthesised — gold to russet, an
addition. Running green straight to russet skips the yellow that is the actual
signature of a turning wood. Both endpoints stay in-system: gold is
`--gold-bright` held down, russet is `--ember` desaturated toward `--blood`, the
same derivation `hm-core.js` already used for `MAT.heatherBloom`. Conifers do
not turn; `evergreen: true` gives a needle only the winter dulling, which is
real.

Foliage response is a shader hook in the same idiom as `hm-world.js`
`windify()`, because the flora is instanced and merged — a CPU recolour per
plant is not available and would be the wrong tool anyway. Per-instance jitter
read out of `instanceMatrix` makes a wood turn unevenly; without it the whole
canopy flips on one frame and reads as a global colour filter rather than as a
season arriving. Note that changing `onBeforeCompile` **requires a new
`customProgramCacheKey`**, or three.js reuses the original material's compiled
program and the hook silently never runs.

**Ice has to stop the water, not tint it.** The wave trains are advected by
`uTime`, so damping amplitude alone leaves a frozen sheet with waves visibly
travelling under it. Freezing damps the motion as well, kills the depth glow
(there is no clear column to see into), goes opaque, and creeps in from
noise-thresholded patches. The mask is biased by crest, so a running channel
keeps a dark thread down its middle after a still pool has locked up.

A verified year at 58°N in the Reach:

| Day | Season | Temp | Daylight | Canopy | Ice |
| --- | --- | --- | --- | --- | --- |
| 15 | winter | −10.9 °C | 6.9 h | bare | 100% |
| 105 | spring | 6.1 °C | 14.1 h | leafing | — |
| 196 | summer | 27.1 °C | 17.2 h | green | — |
| 288 | autumn | 9.9 °C | 9.9 h | turning | — |
| 318 | autumn | 0.3 °C | 7.6 h | bare | 22% |
| 340 | autumn | −5.6 °C | 6.4 h | bare | 100% |

The ordering is the point: leaves colour and drop *before* the water freezes,
and spring leafs out on warmth well after the days have lengthened.

---

## Physics corrections in this pass

**The waterfall ran upward.** `fallMaterial` was written from the flame
shader, where gas *rises* and a minus sign on the scroll term is correct.
Water falls. With the sign inherited, a feature held its noise coordinate by
increasing `uv.y` — and `uv.y` is up — so the whole sheet climbed the cliff.

Fixing the sign alone would have been a one-character patch on a shader that
still had no gravity in it, so the fall is now genuinely accelerated:

```
fallen = t · H          fallT = sqrt(2·fallen/g)        v = v₀ + g·fallT
advect the noise by (uTime − fallT), not by uTime
```

Advecting by *release time* makes the pattern accelerate exactly as the water
does — bunched and slow at the lip, stretched and quick at the base. A uniform
scroll cannot do that; it gives a fall that moves at one speed for its whole
drop. Continuity (`A·v = const`) then thins the sheet as it speeds up, which is
why a tall fall is a rope at the top and a torn veil at the bottom, and air
entrainment scales with velocity so it whitens as it falls.

**Every thrown thing now uses real ballistics.** `ballistic(v0, life)` returns
the two coefficients a motion expression needs — `v₀L` and `½gL²` — so heights
are consequences of launch speeds:

- Plunge churn launches at 26% of the fall's impact speed `sqrt(2gH)`, so a
  chasm boils and a sill ripples without either being tuned.
- A geyser's throat speed is `sqrt(2gh)` for its declared height, and its
  lifetime is the full flight time `2v₀/g`, so the water actually comes back
  down and the declared height is *measured off the arc*.
- Forge sparks: the old form drove launch **and** fall from one parameter, so
  gravity scaled with throw strength — a harder strike made sparks fall
  faster, which is backwards.
- The slag pour squared its *horizontal* term, so molten metal accelerated
  sideways as though gravity pulled along x. The tell was slag curving away
  from the vessel instead of falling from it.

**Rain, snow and sand differ by terminal velocity, not by speed.**
`terminalVelocity(mm, density, cd)` from the drag balance, and the ratio it
produces is the entire reason these three read differently:

| Particle | vₜ | Slant in a 20 m/s wind |
| --- | --- | --- |
| Snowflake (4 mm, low density) | ~1 m/s | 87° off vertical |
| Raindrop (2 mm) | ~6.5 m/s | 72° |
| Sand grain (0.25 mm, 2650 kg/m³) | ~1.5 m/s | cannot suspend — saltates |

A falling flake is **not accelerating** — it is in balance with drag — so
gravity does not appear in the blizzard's motion term at all, and that is
correct.

Which is also why a sandstorm is not a beige blizzard. Sand is 2,650 kg/m³ and
too heavy to stay up: it *saltates*, hopping in a dense sheet with a hard top
edge about 1.5 m off the ground, while sub-60-micron dust suspends and fills
the sky. Two layers with different physics, and the shallow river of sand is
the thing that actually reads as desert.

**Visibility is Koschmieder.** `σ = 3.912 / V`, so a blizzard or sandstorm's
declared visibility in metres and the fog you actually see are the same number
rather than two independent guesses.

**Extreme sun is three things, none of them a brighter light.** Short shadows
and near-white key at high elevation; air-mass reddening at low elevation
(AM ≈ 1/sin α, so a 5° sun crosses ~11 atmospheres); and refractive shimmer
over hot ground — an inferior mirage, which needs a temperature gradient and
therefore dies at night on its own. God rays are aerosol scattering, so they
scale with the biome's dust: **in clean air there are no god rays.** The
desert is where they are strongest because the two are physically linked, not
artistically bundled.

---

## The colour rule, stated

**No new hues.** Every emissive in the kit is a design-system signal token
driven past 1.0 in luminance — a *value* move, not a hue move, which is
precisely what an HDR pipeline is for.

- Hot ladder: `--blood` → `--ember` → `--gold-bright` → `--bone-bright`
- Cold ladder: `--focus` at rising luminance, up to bone
- Marsh and veil: `--moss` and `--focus`, the two hues the mire is allowed
- Dead matter (smoke, ash, mist): never emissive, and never pure grey

The four glow colours are the fauna kit's own rarity ladder
(`hm-fauna.js` `GLOW_TIERS`). Cinderward's declared vfx rows
(`ember_iron_spark`, `slag_drip_glow`) name the forge palette; `hollow_abbey`'s
`memory_glyph_drift` names the aether one. Nothing was invented.

---

## Declared variants

The counting rule was tightened by request and is applied strictly: **an axis
counts only if it changes silhouette or behaviour.** Seed jitter is never
counted. Colour temperature is never an axis on its own — where a flame changes
colour it is because the *fuel* changed, and fuel also changes flame shape,
ember rate and plume.

| Family | Axes | Declared |
| --- | --- | --- |
| Bonfire and brazier | fuel · mass · vigour · tongues · plume · base · spit | 2,592 |
| Forge fire and molten slag | bed · blast · slag · spark · vessel · quench · pour | 2,592 |
| Torch, lantern, candle | kind · mount · flame · housing · soot · halo · wicks | 2,592 |
| Embers, sparks and ash fall | kind · density · drift · size · life · ignition · turbulence | 2,592 |
| Waterfall and cascade | drop · width · volume · ledges · plunge · spray · basin | 2,592 |
| Flowing channel water | width · grade · flow · bed · banks · riffle · weir | 2,592 |
| Still pool and marsh | extent · depth · surface · growth · veil · debris · reflect | 2,592 |
| Geyser and hot spring | vent · period · jet · steam · terrace · pool · surge | 2,592 |
| Rain and wet ground | rate · slant · drop · ground · sheet · splash · gust | 1,728 |
| Snow and flurries | rate · flake · fall · swirl · ground · squall · settle | 1,728 |
| Wind, leaves and dust | strength · debris · gust · lane · height · dust · vortex | 2,592 |
| Fog and ground mist | depth · density · drift · banding · extent · lift · roll | 2,592 |
| Lightning and storm flash | cadence · reach · bolt · sheet · branch · afterglow | **864** |
| Marsh lights / will-o-wisp | count · path · pulse · halo · tail · height · pair | 2,592 |
| Aether and hexcraft glow | form · glyph · orbit · pulse · tendril · ground · collapse | 2,592 |
| Steam and furnace breath | source · pressure · cadence · plume · condensate · nozzle · scald | 2,592 |
| Frost and ice crust | coverage · crystal · spread · relief · fracture · breath · rime | 2,592 |
| Blizzard and whiteout | severity · visibility · drift · ground · sting · squall · whiteout | 2,592 |
| Sandstorm and haboob | severity · grain · saltation · suspension · dune · static · wall | 2,592 |
| Extreme sun, shimmer, rays | shimmer · rays · bleach · dust · ground · halo · mirage | 2,592 |
| **Total** | | **48,384** |

**Season and time of day are deliberately NOT axes.** They are inputs to the
solar model, and every family reads that model — so the same blizzard variant
is a different thing at a winter dawn and a summer noon. Counting them as axes
would be multiplying the catalogue by a number that describes the sky rather
than the effect, which is exactly the padding the counting rule exists to stop.

**Two axes were cut to hold the rule.** `stormflash.tint` and
`groundmist.glow` were recolours, not behaviours. That is why lightning
declares 864 and not 1,728 — a bolt has fewer honest axes than a fire does,
and padding it would have doubled the number without adding one visibly
different flash. `stillwater.stain` was likewise replaced by `debris`, because
a scum mat and a leaf raft change the surface break-up and a peat tint does
not.

Each family's real space is larger than its declared count: every instance also
carries a seed that varies placement and phase without bound. The declared
number is the count of *visibly different* effects, which is the only number
worth quoting.

---

## Budgets

`worldAssets.js` `WORLD_ASSET_BUDGETS` caps a region at **2,400** active
particles and **18** visible dynamic lights. Every family reports its own
measured particle, light, draw and triangle cost via `measureFx()`, so a scene
can be assembled against the ceiling rather than hoped at.

The Living World page as wired sits at **2,352 particles and 11 lights** —
inside both. The lab runs uncapped on purpose and says so on screen when it is
over, with the multiple printed.

The one budget amendment worth discussing: `lightPool()` is a flat additive
disc that fakes bounced firelight on the ground for one draw call and no light
budget at all. Eighteen dynamic lights is not enough for a hold full of
braziers, and unlit ground under a bright flame is the single thing that makes
fire look pasted on. Every practical in the kit ships with one.

---

## Wiring, as done in `Hearthmere Living World.html`

```js
import { VFX_ENV, waterSurface } from './kit/hm-vfx.js';
import { bonfire, BONFIRE_AXES } from './kit/hm-vfx-fire.js';
import { indexOfAxes } from './kit/hm-vfx-index.js';
import { climateState, applyClimate } from './kit/hm-vfx-climate.js';

// Bloom is not optional for this layer. Threshold above white, so the
// palette never blooms and only genuinely over-range emissives do.
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.55, 0.98);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// The composer resets renderer.info per pass, so a census would read the
// final fullscreen quad. Accumulate over the frame instead.
renderer.info.autoReset = false;

const fire = bonfire(indexOfAxes(
  { fuel: 1, mass: 2, vigour: 2, tongues: 2, plume: 2, base: 1, spit: 1 },
  BONFIRE_AXES), { scale: 0.85, lightScale: 0.7 });
scene.add(fire.group);

// The sky. Four inputs; everything about the light derives from them.
const clock = { day: 296, hour: 16.4, latitude: 58 };
let climate = climateState({ ...clock, biome: 'reach', overcast: 0.35 });
applyClimate(climate, { key, hemi, fill, scene, renderer });

// per frame
renderer.info.reset();
VFX_ENV.uTime.value = t;
VFX_ENV.uWind.value = windUniforms.uWind.value;   // ONE wind, not two
fire.update(t, { camera });
composer.render();

// the sky at ~4 Hz — a sun that moves over minutes does not need 60 Hz, and
// climateState allocates a few Colors per call
if (skyDue) {
  clock.hour = (clock.hour + dt * 0.5) % 24;
  climate = climateState({ ...clock, biome: 'reach', overcast: 0.35 });
  applyClimate(climate, { key, hemi, fill, scene, renderer });
  key.position.copy(climate.sun.dir).multiplyScalar(90);  // shadows follow
}
```

`VFX_ENV.uWind` and `uGust` are deliberately fed from `hm-world.js`'s
`windUniforms`, so airborne debris, swaying scatter and a leaning flame are one
wind rather than three that happen to agree.

---

## Findings worth keeping

Five bugs in this layer were the same bug wearing different clothes, and all
five are commented at the site:
1. **An uncentred noise field never erodes anything.** `n * 1.15 + 0.52` sits
   positive everywhere, so alpha is 1 across the whole shell and the geometry's
   own cone or rectangle silhouette shows through. Centring on the mean
   (`(n - 0.46) * 3.4`) is what turns a cone into tongues and a plane into
   braided water.
2. **Additive shells must be normalised by shell count.** Six oranges summed is
   white, and `tongues` silently becomes a brightness axis.
3. **A temperature ramp needs the right scale.** The field reaches ~1.4 at a
   flame's base, so a coefficient near 1.0 clamps the entire base to the core
   colour.
4. **`gl_PointSize = size * (340 / -z)` is unbounded.** Any particle level with
   the camera plane becomes a screen-filling sprite that the tone mapper then
   desaturates to a white smear. Clamp it, and drop particles behind the near
   plane.
5. **A soft volume's opacity is `count × alpha × coverage`.** Thirty sprites at
   0.3 is opaque, not misty. Keep the product under about 1.

Plus three that are worth a paragraph each:

- **`Math.pow(negative, fractional)` is NaN.** The waterfall's curtain
  computed `Math.pow(t, 1.7)` where `t` reached a whisker below zero from float
  error at the lip. One NaN vertex poisoned the bounding sphere, the frustum
  test, and every `Box3` built from the mesh — the whole waterfall vanished and
  the camera framed on it went to NaN with it. Clamp before `pow`.
- **`Box3.expandByObject` refreshes only the object's own matrix, not its
  parents'.** Framing a freshly built grid measured all sixty-four instances as
  if they sat at the origin. Call `updateMatrixWorld(true)` first.
- **Do not toggle `renderer.clippingPlanes` per frame.** It changes every
  material's shader defines, so the whole scene recompiles twice a frame and
  the page locks up. The planar reflection instead takes a hide-list, and the
  host passes the ground: it sits *below* the water and has no business in a
  reflection of what is above it. Left in, the mirrored camera fills its view
  with lit grey ground and a black pool reads as sheet metal.

One more, in the shader-plumbing category: the particle system's authored
`alpha` and `colorT` expressions are written against the vertex stage's `life`
and `s`, so the fragment shader aliases `vLife`/`vSeed` to those names. Without
the alias every family compiles to an undeclared-identifier error and silently
renders nothing.

And one from the climate work, because it is the same class of mistake in a new
place: **the sky is bright because it scatters sunlight**, so its luminance has
to rise with sun elevation. The first version of `climateState` only warmed the
fog for a *low* sun and left it at the dark biome value otherwise — so the
brighter the sun got, the darker the sky stayed, and a tropical noon rendered
near-black. Sky luminance now scales with elevation *and* turbidity, which is
also what makes a dusty desert noon a blinding white haze and a clean
high-altitude noon a deep blue. The horizon, not the key light, is what gives a
sun its "extreme".

### A guard, not just a fix

Three families had drifted between their axis names and their `declared` keys
(`nearField` vs `settle`, `branches` vs `branch`, `glyphs` vs `glyph`), which
made the lab's axis readout fall back to a raw integer — a failure that looks
like data rather than like a bug. Rather than patch the three, the lab now runs
a boot-time self-check that builds every family at its hero variant and warns
for any axis missing a named entry. It caught a fourth (`grainSize` vs `grain`)
in the climate module within a minute of that module being written, which is
the argument for the guard. Reachable as `window.__vfx.audit`.

---

## Deferred, and named rather than quietly missing

**Blood and harm impact** — combat and ability VFX are *not* in this pass, by
decision. They need phase timings (wind-up, impact, dissipate) to hang on, and
the project has no turn-order rail, per-turn action economy or resolution log
yet. Building them now would mean inventing that timing vocabulary twice. The
entry is in `hm-vfx-index.js` `DEFERRED` with this reason attached.

## Known rough edges

- The Living World's new spring cascade is positioned by eye at tile
  ~(12.2, 8.4). Its plunge pool and the blackwater plane sit at different
  heights and want reconciling against real terrain heights rather than the
  approximate placement used here.
- `stillwater`'s planar reflection is one surface at a time by design. A scene
  with two reflective pools in shot will reflect into whichever was bound last.
- Snow, frost and geyser families are authored but have no declared region that
  calls for them; they are vocabulary ahead of a location. The same is now true
  of the desert biome — `worldAssets.js` declares no arid region, so the Ash
  Waste is a biome definition waiting for a map rather than a place.
- Seasonal *response* is currently atmospheric plus flora and water: sun, sky,
  fog, ground heat, canopy colour, leaf drop and surface ice all move with the
  year. Snow **accumulation** is a per-material tint on upward-facing normals,
  not real geometry — drifts against walls would need the scatter layer to
  place them.
- The temperature model is a smooth annual curve with thermal lag; it has no
  weather noise, so there are no warm snaps or cold spells. A day either is or
  is not freezing for its date. Adding banded noise would be a small change to
  `airTemperature` and worth doing before anything gameplay-facing depends on
  a specific day.
- The blizzard and sandstorm both declare a visibility and publish the matching
  fog density on `group.userData.fogDensity`, but it is the *host* that has to
  apply it. The lab does; a new scene will need to.
