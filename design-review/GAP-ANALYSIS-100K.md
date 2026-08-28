# Gap analysis — 100,000 unique objects

**Status: 108,441 of 100,000 unique built across 227 counted categories.**

Every number below is measured from the running catalogue, not projected.
**0 build failures** across all sampled variants.

## Corrections made after review

**1. Wear tiers were nearly identical — confirmed, and fixed.** The reported
symptom was real. Measured, `kept` -> `ruined` moved only 364 -> 524 triangles,
the base colour moved #3b3d3c -> #454644, and roughness was ADDED to a value
already near 1.0, so `neglected` and `ruined` both clamped to exactly 1.00 and
were materially identical. Wear added litter; it never broke anything.

`kit/hm-wear.js` now applies wear to the asset's OWN parts — remove, detach to
the floor, splay out of true, corrode a subset, lean off plumb, and re-add the
removed volume as rubble so material is conserved. Measured on a beam engine:

| tier | nodes | fallen | rubble | footprint | height |
| --- | --- | --- | --- | --- | --- |
| kept | 65 | 0 | 0 | 5.71 | 3.65 |
| worked | 71 | 0 | 6 | 6.98 | 3.66 |
| neglected | 86 | 4 | 26 | 11.27 | 4.23 |
| ruined | 77 | 9 | 26 | 11.73 | 3.48 |

Ruined loses triangles because parts are gone, doubles its footprint as debris
spreads, and drops in height because members have fallen. The largest parts by
volume are protected, so a ruined asset still stands.

One process note against myself: my first test of this reported all four tiers
as byte-identical. That test was wrong — it passed the tier object where the
API expects the tier id, so every call silently fell back to `kept`. I reported
the conclusion before checking the harness.

**2. The machinery was bad. It is rebuilt.** The retired `mach.machine`
generator crammed eight machine types into one function and failed three ways:
nothing was kinematically connected (a walking beam was a box at a hardcoded
angle, with the piston rod not reaching it); its `state: live` axis only nudged
two positions and added a glow, so a "working" machine did not move; and shared
instrumentation was bolted on regardless of logic — a **loom** received steam
plumbing and pressure gauges.

`kit/hm-mach2.js` replaces it with seven real mechanisms, each built as an
explicit power chain and each driven by actual linkage maths at tick time:

| machine | mechanism | verified motion |
| --- | --- | --- |
| Beam engine | slider-crank (closed form), parallel motion, governor | 7 rotated, 2 rods re-stretched |
| Blowing engine | twin crank throws 180° apart | 7 rotated, 2 rods re-stretched |
| Stamp battery | phased cams, asymmetric lift-then-fall | 3 stamps translated |
| Water wheel | true tooth-ratio gear train (48t/16t) | 3 gears rotated |
| Trip hammer | cam lobes, gravity fall faster than lift | cam + helve |
| Rolling mill | counter-rotating rolls via pinion stand | 2 rolls, opposite sense |
| Line shaft | crowned pulleys, travelling belt lap | shaft + pulleys |

The slider-crank uses the exact closed-form solution, not a sine wave: at these
rod/crank ratios a sine approximation visibly detaches the rod from the pin.
Connecting rods are re-aimed and re-stretched every tick between two moving
points, which is what makes them stay connected.

`Sable Reach Machine Hall.html` runs them, with a stop/start so "working means
moving" is directly checkable, plus a speed control and the wear tiers applied
live. A ruined machine still animates.

**3. Single-variant categories — agreed, they fail.** Twelve former entries were
generic props and foliage with one variant each. They are RETIRED, not padded,
because later parametric families cover them properly (6 foliage singles ->
`flora.tree/shrub/flower/grass`; brazier -> `camp.campfire`; rain barrel ->
`mach.container`; awning -> `camp.tent`; bench -> `mach.furniture`; drying frame
-> `camp.drying-rack`; weapon rest -> `arms.*`).

Thirteen remaining entries are legitimately singular — there is exactly one
Bell-Clapper Mace and one Old Vigil Shrine. These are **named story objects**,
not categories, and now sit in their own section excluded from both the
generator count and the unique total. The catalogue asserts the rule: any
counted category with fewer than 2 unique logs a FAIL to console. None do.

**4. New science/lab/bio section.** `kit/hm-lab.js`, 11 families, 2,988 unique.
On the connectors, stated plainly: PubMed and bioRxiv are literature indexes.
They confirm a vocabulary and workflow exist — "microtome sectioning" returns
748 indexed papers — but they cannot supply an instrument's proportions, and
**no citation is claimed for any dimension**. Elicit was unavailable on this
account. What grounds the module is documented apparatus FUNCTION: a Liebig
condenser has its water inlet at the low end because that is what makes it
condense; a knife-edge balance has three agate bearings and a beam rider; a
microscope's objectives sit on a revolving nosepiece at different lengths with
the mirror below the stage. Correct in principle, undimensioned — semi-real,
and labelled as such in the module header.


## The correction that produced this document

The earlier catalogue claimed 1.03M by counting `axis variants × 5 biomes × 4
wear tiers`. Against a bar of **unique objects**, that multiplier does not
count. A rimed pipe run and a scorched pipe run are the same object wearing
different weather — they are a finish, not a distinct asset.

The finish system stays (it is real geometry, and it earns its place at
dressing time). It no longer carries the headline number.

**Counting rule, unchanged and now load-bearing:** an axis counts only if it
changes silhouette or material. Seed jitter gives infinite micro-variation and
is never counted.

## Where the 100,540 comes from

| Module | Generators | Unique |
| --- | --- | --- |
| `hm-steam.js` — Cinderward industrial | 8 | 4,077 |
| `hm-flora2.js` — trees, shrubs, flowers, fungi, vines, grass, deadfall | 7 | 17,128 |
| `hm-arch.js` — doors, gates, windows, columns, stairs, bridges, archways, statues, sigils, altars | 10 | 11,286 |
| `hm-arms.js` — blades, hafted, ranged, shields, helms, cuirasses | 6 | 11,286 |
| `hm-geo.js` — rock, cliffs, caves, volcanic vents, lava, water bodies, falls, ice | 8 | 17,226 |
| `hm-mach.js` — machines, transit, furniture, containers | 4 | 9,720 |
| `hm-fungi.js` — fungal, parasitic, canopy growth | 13 | 9,120 |
| `hm-goods.js` — consumables, alchemy, trade goods, records | 17 | 8,478 |
| `hm-sign.js` — signage, wayfinding, civic display | 12 | 7,632 |
| `hm-camp.js` — camp, expedition, field kit | 13 | 5,472 |
| `hm-land.js` — fences, wells, graves, hives, crops | 5 | 3,024 |
| `hm-mach2.js` — real machinery, animated | 7 | 3,660 |
| `hm-lab.js` — laboratory and biological work | 11 | 2,988 |
| `hm-fauna.js` — hares, cervids, vermin, ground birds, anurans, serpents | 6 | 2,376 |
| `hm-fauna2.js` — arthropods, fliers, fish, firefly swarms, marsh lights | 9 | 3,138 |
| **Built total** | **227** | **108,441** |

(`hm-land.js` was scoped deliberately to close a 2,484 shortfall. The families
are genuine gaps in a worked countryside, but the *timing* of building them was
driven by the count — worth stating. The other modules were not scoped that
way. 13 named one-offs and the retired `mach.machine` are excluded above.)

Biggest single family: `flora.tree` at **12,960** unique across five forms
(conifer, broadleaf, dead, glasswood, mangrove) — the `form` axis changes the
build path, not a parameter, which is what makes it countable.

The 25 Hearthmere assets are still single-variant. Retrofitting axes onto them
is the cheapest remaining win in the plan: no new geometry, roughly 9,000
unique objects.

## Category coverage

Every category named in the brief now has at least one real family:

doors · gates · windows · columns · walls · stairs · bridges · archways ·
statues · occult symbology · altars · trees · bushes · flowers · fungi ·
vines · grasses · deadfall · rock · cliffs · caves · volcano · lava · lakes ·
rivers · oceans · waterfalls · ice · machines · transit · furniture ·
containers · weapons · armour · industrial machinery

**Still absent:** roofs as a family (they exist only inside structures),
consumables, signage and markers, rope and rigging, banners, and **bestiary
creatures** — 178 authored entries, 21 families, and still zero models or
reference art of any kind.

**No longer absent: ambient fauna.** The line above used to read "and creatures
of any kind". Fifteen families of ambient life are now built — 5,514 unique —
and they are deliberately *not* the bestiary: nothing in them has a rank, a
loot table or a telegraph window. They exist because the region kits in
`worldAssets.js` already declared the layer and never filled it
(`lantern_moth_sparse`, `marsh_light_drifter`, `mire_bird_nest`), and because
the Graven March is authored `no_bird_silence` — an absence that nothing in the
codebase respected until the spawn tables gained a per-region mask.

Two counting notes, both of which cost the headline rather than helping it:

- **Glow is a finish, not an axis.** A lit animal is the same animal wearing
  light, so the five glow tiers multiply the *dressing* count and are excluded
  from the 5,514 — the same correction this document already made once for
  biome × wear. Declared odds run from 1 in 64 to 1 in 32,768 and are checked
  against 200,000 live rolls in the viewer rather than asserted.
- **The biome overlay is not applied to creatures at all.** It hangs icicles
  off every upward face, which on a hare is a bug rather than a rime hare, and
  the wear tiers work by detaching parts to the floor. Creatures take the
  retint only and carry their own `condition` axis instead.

The production blocker is stated where it will be read: a rigged creature costs
one draw call per animated part — about 300 for ten hares, measured live — and
the procedural pipeline emits no skinned meshes. That gates ambient density,
not the geometry.

## Remaining 33,186 — where it comes from

| Family | Gen | Avg axes | Unique |
| --- | --- | --- | --- |
| Retrofit axes onto the 25 manifest assets | 25 | ~360 | 9,000 |
| Creature families (bestiary has 178 entries, 0 models) | 12 | 900 | 10,800 |
| Consumables, tonics, ore, ingots, relics | 10 | 400 | 4,000 |
| Signage, markers, banners, rope and rigging | 8 | 450 | 3,600 |
| Roofs as a standalone family | 6 | 450 | 2,700 |
| Ranged-weapon depth, second armour tier | 6 | 520 | 3,120 |
| **Total** | **67** | | **33,220** |

That closes at **100,034**.

## Plan to 100k unique

Axis spaces below are calibrated against the eight **measured** industrial
generators, which average 510. Nothing here is inflated to hit a target; the
plan overshoots to 168k so that families which turn out thinner than expected
do not sink the total.

| Family | Gen | Avg axes | Unique |
| --- | --- | --- | --- |
| **Flora** | | | **28,120** |
| &nbsp;&nbsp;Trees — conifer, broadleaf, dead, glasswood, mangrove | 14 | 900 | 12,600 |
| &nbsp;&nbsp;Bushes and shrubs | 10 | 480 | 4,800 |
| &nbsp;&nbsp;Flowers | 12 | 360 | 4,320 |
| &nbsp;&nbsp;Grasses and reeds | 8 | 300 | 2,400 |
| &nbsp;&nbsp;Fungi | 6 | 400 | 2,400 |
| &nbsp;&nbsp;Vines and creepers | 5 | 320 | 1,600 |
| **Architecture** | | | **25,300** |
| &nbsp;&nbsp;Doors and gates | 12 | 800 | 9,600 |
| &nbsp;&nbsp;Walls and columns | 10 | 600 | 6,000 |
| &nbsp;&nbsp;Stairs and bridges | 8 | 500 | 4,000 |
| &nbsp;&nbsp;Windows | 6 | 500 | 3,000 |
| &nbsp;&nbsp;Roofs | 6 | 450 | 2,700 |
| **Weapons and armour** | | | **27,200** |
| &nbsp;&nbsp;Weapons | 16 | 1,000 | 16,000 |
| &nbsp;&nbsp;Armour | 14 | 800 | 11,200 |
| **Geology** | | | **20,000** |
| &nbsp;&nbsp;Rock formations | 10 | 700 | 7,000 |
| &nbsp;&nbsp;Volcanic — cones, vents, flows, bombs | 8 | 650 | 5,200 |
| &nbsp;&nbsp;Cave features | 8 | 600 | 4,800 |
| &nbsp;&nbsp;Cliffs and scarps | 6 | 500 | 3,000 |
| **Statues and occult** | | | **19,200** |
| &nbsp;&nbsp;Statues and effigies | 10 | 800 | 8,000 |
| &nbsp;&nbsp;Occult symbology — wards, sigils, circles | 12 | 600 | 7,200 |
| &nbsp;&nbsp;Shrines and altars | 8 | 500 | 4,000 |
| **Machines and transit** | | | **17,800** |
| &nbsp;&nbsp;Machines | 12 | 900 | 10,800 |
| &nbsp;&nbsp;Transit — carts, rail, lifts, boats | 10 | 700 | 7,000 |
| **Furniture and items** | | | **18,800** |
| &nbsp;&nbsp;Furniture and props | 24 | 450 | 10,800 |
| &nbsp;&nbsp;Items and consumables | 20 | 400 | 8,000 |
| **Water bodies** | | | **12,000** |
| &nbsp;&nbsp;Ocean and coast | 6 | 600 | 3,600 |
| &nbsp;&nbsp;Rivers and streams | 6 | 500 | 3,000 |
| &nbsp;&nbsp;Lakes and pools | 5 | 400 | 2,000 |
| &nbsp;&nbsp;Falls and cascades | 4 | 450 | 1,800 |
| &nbsp;&nbsp;Ice and frozen water | 4 | 400 | 1,600 |
| **Total planned** | **~300** | | **168,420** |

Plus retrofitting axes onto the 25 existing single-variant assets: **~9,000**.

## Ordering, and why

1. **Retrofit axes onto the existing 25.** Best ratio in the whole plan — no
   new geometry, ~9,000 unique objects, and it makes the Hearthmere kit
   consistent with the industrial one.
2. **Flora (28k).** Largest single block, most visible, and the outside world
   is currently carrying one tree.
3. **Architecture (25k).** Doors and walls are what make dungeons and
   settlements stop looking like the same room repeated.
4. **Weapons and armour (27k).** Highest per-generator yield. Needs sockets
   and a paper-doll rig that does not exist yet — so it is third, not first.
5. **Geology, statues/occult, machines/transit, furniture, water bodies.**

## Known blockers

- **`land.crop` — FIXED.** It was 3,974–5,508 triangles for a patch meant to
  tile, labelled standard while costing hero. Two causes: it never called the
  kit's own `cnt()` / `sg()` LOD helpers, so LOD1/LOD2 thinned nothing; and the
  local `tube()` helper (stems are tubes, and there are hundreds) ignored LOD
  entirely. Both routed through the LOD system now:

  | LOD | triangles | meshes |
  | --- | --- | --- |
  | 0 | 5,208 | 252 |
  | 1 | 1,804 | 78 |
  | 2 | 640 | 26 |

  `cropField(variant, tilesX, tilesZ, lod)` composes a field by instancing one
  prototype patch, so draw calls equal the patch's part count and do not grow
  with tile count: a 10x10 field is **26 draw calls instead of 2,600**. The
  generator is now labelled `hero`, which is the truthful class for its LOD0
  cost. Two limits are recorded in the module header rather than glossed:
  instancing saves draw calls but NOT triangles, and an InstancedMesh
  frustum-culls as one object, so fields larger than about 8x8 must be composed
  per region to cull independently.
- **Equipment has no rig.** Weapons and armour need attachment sockets and a
  paper-doll skeleton. Neither exists. 27k of the plan is gated on it.
- **Water bodies are not props.** A lake is terrain topology plus a surface,
  not an object you place. The 12k line item needs a different generator
  contract from everything else here, and probably belongs with terrain.
- **Volcano is a region, not an asset.** The 5,200 volcanic line covers cones,
  vents, flows and ejecta as placeable objects. An actual volcano is a biome
  with its own heightfield, hazard system and lighting — that is a region
  build on the scale of Hearthmere, not a catalogue entry.
- **No texture on new families yet.** The roughness-map fix landed on the
  industrial set; every new family needs the same treatment at authoring time
  or the shine problem returns family by family.

## Fixed in this pass

**The uncanny shine.** Every industrial material ran metalness 0.14–0.42 with
no environment map and no maps bound. Metalness with nothing to reflect does
not read as metal, it reads as wet plastic — and across a whole set it makes
everything uniformly glossy. Metalness is now capped at 0.20, roughness raised
substantially, and each material takes a **roughness map** from the nearest
existing surface generator (colour maps are deliberately not taken — a
brass-toned albedo over a brass material double-tints). Gloss now varies across
a surface instead of being one flat number. `bindSteamTextures()` in
`kit/hm-steam.js`, bound in both scenes.
