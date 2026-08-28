# Insert into `sable-reach` — Hearthmere 3D environment kit, pass one

Eighteen procedural assets for Hearthmere Hold, built against the declared
rows in `packages/content/manifests/hearthmere.assets.json`. Repo access from
the design side is **read-only** — there is no push, branch, or PR tool here —
so this is the insertion manifest. Commit it from Claude Code, or upload to
`/upload/main/`.

## What this replaces

Every prop and foliage row in `hearthmere.assets.json` currently declares
`generatorId: "prop.graybox"` / `"foliage.instanced"` at
`pipelineStatus: "prototype_geometry"`. `assets/3d/README.md` says outright
that the directory holds no production geometry and that prototypes come from
"the named recipes" in the manifest. These are those recipes, built.

Delivery matches what the repo already ships:
`sable-reach.prototype-assets.json` declares
`"delivery": "runtime-procedural-threejs"`. Nothing here needs a new pipeline.

## File map

| From this project | To the repo |
| --- | --- |
| `kit/hm-core.js` | `apps/client/src/world/hearthmere/hm-core.js` |
| `kit/hm-flora.js` | `apps/client/src/world/hearthmere/hm-flora.js` |
| `kit/hm-props.js` | `apps/client/src/world/hearthmere/hm-props.js` |
| `kit/hm-artifacts.js` | `apps/client/src/world/hearthmere/hm-artifacts.js` |
| `kit/hm-catalog.js` | `apps/client/src/world/hearthmere/hm-catalog.js` |
| `Hearthmere Environment Kit.html` | `tools/assets/kit-viewer/hearthmere.html` (dev tool, optional) |

Plain ES modules, no TypeScript syntax, no npm imports beyond `three`. They
rename to `.ts` unchanged except for adding parameter types; keep them `.js`
if `allowJs` is off in `apps/client/tsconfig.json`.

## Wiring

`hm-catalog.js` exports `CATALOG`, an ordered array whose rows carry
`{ id, slug, group, budgetClass, generator, manifest, declared, build }`.
`build()` returns a `THREE.Group` of named meshes, seated so its lowest point
is `y = 0` and it is centred in xz — one pivot convention for the whole kit.

```js
import { CATALOG } from './world/hearthmere/hm-catalog.js';
const byId = new Map(CATALOG.map((a) => [a.id, a]));
scene.add(byId.get('hm.prop.rope-bell-small').build());
```

Geometry is deterministic: every builder draws from a seeded stream
(`rnd(seed)` in `hm-core.js`), never `Math.random()`, so two runs produce
byte-identical output and the SHA-256 that
`tools/assets/validate.mjs --strict-production` wants is stable.

## Two manifest amendments required

Both are material-slot counts that the asset's own declared purpose
contradicts. Neither was silently exceeded.

1. **`hm.prop.banked-brazier` — slots 2 → 3.** The region kit declares
   `lighting.practicals: "banked_braziers"`. A practical light source needs an
   emissive slot; at two slots the brazier is a cold bowl and the region loses
   its only warm practical.
2. **`hm.prop.rain-barrel-iron` — slots 2 → 3.** The third is standing
   rainwater. In a region held at `wetness: 0.82`, a rain barrel with a dry
   interior reads as a bug.

Triangle budgets were **not** amended. All eighteen sit under their declared
or proposed LOD0 ceiling.

## Three proposed rows

Not in any manifest. Each exists because the authored fiction already
requires it; each is flagged `proposed` everywhere it appears.

| Proposed id | Justification in existing source |
| --- | --- |
| `gm.foliage.blackpine-mature` | `worldAssets.js` graven_march kit lists foliage `blackpine_mature`; `world.js` GATHER_NODES declares `node_blackpine_01` "Harvestable Black Pine" at woodcutting 3. No asset row anywhere. |
| `hm.artifact.clay-name-tablet` | The manifest carries `hm.surface.clay-tablets` as a **surface**. `world.js` makes the tablet the region's central object. A surface cannot be picked up, and quest/codex surfaces need one that can. |
| `hm.artifact.bell-clapper-mace` | `world.js` describes Torren Vale as "a broad veteran who carries the clapper of a ruined bell as a mace." Placed NPC, named weapon, no weapon asset. |

## Material provenance

Six materials carry the **exact** `baseColor` and `roughness` from the
matching `hm.surface.*` row. Those rows also declare a `wetness` that
`MeshStandardMaterial` has no channel for; it is folded into roughness as
`effective = roughness × (1 − wetness × 0.3)`. That is the only derived
number in the kit and it is stated at the top of `hm-core.js` rather than
left as an eyeballed value.

Everything else traces to the hearthmere kit palette in `worldAssets.js` or a
canonical token in the design system's `tokens/colors.css`. No colour was
invented.

## Still missing before `production_ready`

`assets/3d/README.md` sets the bar, and this pass does not clear it:

- **No LOD chain.** Only LOD0 is built. LOD1/LOD2 in the manifest are
  declared, not generated — they need a decimation pass or hand-authored
  lower tiers.
- **No sockets, morphs, or clips.** Nothing here has an attachment point,
  and the interactive props (bell rope, barrel lid, brazier poker) have no
  animation rig.
- **No source records or hashes** in `hearthmere.licenses.json`.
- **No collision geometry.** `WORLD_ASSET_BUDGETS` allows 24 complex and 160
  simple colliders per region; none are authored.
- **Textures.** The kit is geometry-and-material only. `materials.maxTextureDimension`
  in the manifest is unused so far, which is why every surface reads flat at
  close range.
- **Four regions untouched.** Graven March, Dunmire, Cinderward and Hollow
  Abbey have kits in `worldAssets.js` but no asset manifest at all.
