# Gap analysis — the elemental VFX layer

What was built, what actually uses it, and what is still a hole. Written after
the twenty families were finished, because "authored" and "integrated" had
quietly become two different numbers.

---

## The headline gap

**Twenty families existed; five were in a scene.** Everything else lived only in
`Elemental VFX Lab.html`, which is a workbench, not a place. A family that no
scene calls is vocabulary, not content — and the lab makes that easy to miss,
because in the lab every family looks equally finished.

After this pass: **eleven families in three scenes**, and every declared `vfx`
row in `worldAssets.js` now has both an implementation and somewhere it runs.

---

## Bug found by the analysis

**`BIOMES` was exported twice.** `kit/hm-biome.js` exports a `BIOMES` array —
five surface finishes keyed to regions (`ash`, `forge`, `rime`, `verdant`,
`drowned`) — and `kit/hm-vfx-climate.js` had grown its own `BIOMES` object of
atmospheric properties. Two different public `BIOMES` in one kit is a collision
waiting to bite whichever module imports second, and `Cinderward Undercroft.html`
already imports the `hm-biome.js` one.

Renamed to `CLIMATE_ZONES`, with `BIOMES` kept as a deprecated alias so nothing
breaks.

**And the rename exposed a worse problem underneath it.** My zones were
`reach` and `desert` — both invented, while the repo already declared five
biomes tied to five real regions. The climate zones are now keyed to **the real
biome ids**, so a scene that knows its biome gets its atmosphere for free
instead of choosing twice:

| Zone | `hm-biome.js` biome | Region | Air |
| --- | --- | --- | --- |
| `ash` | Ash | `all` | The baseline Reach. Wet (0.82), turbid, cold. |
| `forge` | Forge | `cinderward` | Hot ground, heavy dust, tight warm fog. No sun. |
| `rime` | Rime | `salt_waste_frontier` | Freezing, high albedo. |
| `verdant` | Verdant | `dunmire` | Humid, warm, green fog. |
| `drowned` | Drowned | `veil_coast_frontier` | Maritime — the smallest annual swing anywhere, because water buffers the year. |
| `desert` | — | — | **Proposed, not grounded.** |

The best find here: `rime` is described in `hm-biome.js` as *"the Mirror-Salt
Waste, where white storms erase direction. Ice loads every upward face."* That
is the blizzard family's home, written down before the blizzard existed — and
"ice loads every upward face" is exactly what the seasonal snow term does to
upward-facing normals. The blizzard was always meant to go there.

`desert` stays because it was explicitly asked for, but it is flagged
`grounded: false` and the lab groups it under **Proposed** rather than
**Declared regions**. `worldAssets.js` declares no arid region; pretending
otherwise would put a fabrication next to five sourced entries.

---

## Coverage now

| Scene | Region / zone | Families |
| --- | --- | --- |
| `Hearthmere Living World.html` | hearthmere / `ash` | bonfire, cascade, rainfall, groundmist, marshLight (+ two water surfaces) |
| `Cinderward Undercroft.html` | cinderward / `forge` | forgeFire, torchlight, steamVent ×2, aetherGlow |
| `Sable Reach Machine Hall.html` | cinderward / `forge` | steamVent, gated on the machine's `running` state |
| `Elemental VFX Lab.html` | all zones | all 20 |

Declared `vfx` rows in `worldAssets.js`, all now covered:

| Row | Family | Scene |
| --- | --- | --- |
| `banked_braziers` | bonfire, torchlight | Living World, Undercroft |
| `ember_iron_spark` | forgeFire | Undercroft |
| `slag_drip_glow` | forgeFire | Undercroft |
| `memory_glyph_drift` | aetherGlow | Undercroft |
| `marsh_light_drifter` | marshLight | Living World |

---

## The streaming problem, and why the Undercroft uses a pool

The Undercroft is a generated, chunk-streamed dungeon: the room count is
unbounded. **One practical per room does not work** — it blows the 18-light and
2,400-particle ceilings on any large floor, and it keeps building effects the
player will never reach.

So a **fixed pool of seven** is built once and re-homed to the nearest unclaimed
room centres as the walker moves. Cost is constant in floor size, which is the
same reasoning the chunk streamer already applies to geometry. Measured:
**668 particles, 10 scene lights, ~130 draw calls** — inside both caps with room
to spare.

Two details that matter:

- **Each pool entry is a different declared variant**, not one torch repeated
  with a new seed. The axes differ, so the undercroft's practicals read as
  seven fixtures rather than one fixture seven times.
- **An effect with nothing in reach hides.** Corridors are genuinely dark and
  arriving in a room lights it, which is the behaviour that makes the pool feel
  like placement rather than like a follow-cam.

Re-homing is throttled to 400 ms — it is an O(rooms) scan and the answer cannot
change meaningfully between frames at walking pace.

---

## Still open

**Three regions have kits and no scene.** `graven_march`, `dunmire` and
`hollow_abbey` have full asset kits in `worldAssets.js` (surfaces, structures,
props, foliage, decals, vfx, audio) but no 3D scene in this project, so their
atmospheres are defined and unexercised. The `verdant` and `rime` zones are
likewise built and unvisited. This is a scene gap, not a kit gap — nothing more
needs authoring in the VFX layer to serve them.

**Nine families are still lab-only:** channel, stillwater, geyser, snowfall,
windfield, stormflash, frostcrust, fallout, blizzard, sandstorm, sunGlare. Most
are waiting on a location rather than on work — `blizzard` wants the Mirror-Salt
Waste, `sandstorm` and `sunGlare` want an arid region that does not exist yet.

**Four of five regions still have no asset manifest.** Pre-existing, recorded in
`github.md`; only `hearthmere.assets.json` exists.

**Snow accumulation is a shader tint, not geometry.** Real drifts against walls
need the scatter layer to place them. `hm-biome.js` already has a `rimeOverlay()`
that puts snow caps and icicles on an asset's bounding box — wiring the seasonal
snow term to that overlay is the obvious next move and was not done here.

**The temperature model has no weather noise.** A smooth annual curve with
thermal lag, so there are no warm snaps or cold spells: a given date is
deterministic. Worth adding banded noise before anything gameplay-facing keys
off a specific day.

**Combat VFX remain deferred** — blood and harm impact need the turn-based
resolution vocabulary (initiative rail, action economy, resolution log), which
the repo does not have. Recorded in `hm-vfx-index.js` `DEFERRED`.
