# Hearthmere content package

This package is the canonical machine-readable content boundary for the 96 × 96
meter Hearthmere shard, the 16,384 × 12,288-meter Sable Reach atlas, the
178-creature bestiary, habitats, stable placements, and ecology showcases.
Runtime code consumes stable IDs and validated manifests; it must not embed
authoring paths or invent private scene data.

## Public manifests

- `@hearthmere/content/hearthmere/assets` - asset catalogue, runtime delivery,
  target production files, capabilities, and budgets.
- `@hearthmere/content/hearthmere/licenses` - licenses and source provenance.
- `@hearthmere/content/hearthmere/scene` - chunks, placements, navigation,
  collision, occlusion, light/VFX/audio zones, anchors, and phase masks.
- `@hearthmere/content/runtime` - canonical browser/server projection with actor
  and interactable spawns, phase selection, recipes, collision checks, and
  navigation/path helpers.
- `@hearthmere/content/bestiary` - 178 complete `CreatureDefinitionV3` records
  across 21 families, with mechanic and habitat contracts.
- `@hearthmere/content/atlas` - GIS-valid territories, sites, routes, bridges,
  hydrology evidence, hashed 512-meter cells, and coordinate transforms.
- `@hearthmere/content/habitats` and `./placements` - route-reachable creature
  placements, unique anchors, and explicit stable-ID world placements.
- `@hearthmere/content/showcases` and `./prototype-assets` - 21 authoritative
  ecology-proof contracts plus hashed prototypes for 21 creatures and seven
  distinct location arenas.
- `@hearthmere/content/bridge-assets`, `./site-scenes`, and `./bridge-runtime`
  - 96 accepted-seed reskin recipes, seven scene-backed proof sites, 761
  explicit data-only cells, and measured prototype GLB dependency closures.
  These entries are deliberately absent from the eager package barrel.
- `@hearthmere/content/bridge-catalog` - the complete 1,087-record developer
  catalog. It is a separate dynamic entry and is loaded only after explicit
  developer action.

The six new proof-site scenes use distinct territory-authored layouts rather
than a shared lattice. Their V2 chunks publish connected local navigation,
dimensioned colliders consumed by playable movement, and interaction anchors
bound to actual landmark instances. Hearthmere remains a one-way exact adapter
that preserves its 51 stable placements and legacy semantic coordinates.

Coordinates use metres, Y-up, with +X east and +Z south. Legacy tile positions
map deterministically to `{ x: tile.x * 4, y: 0, z: tile.y * 4 }`.

`pipelineStatus: "prototype_geometry"` is intentional. Those records use named
procedural generators today and declare missing Blender/GLB/KTX2 deliverables as
targets, not as completed art. `--strict-production` turns every such record into
a validation failure for the final slice gate.

The runtime entry exports `HEARTHMERE_RUNTIME_PROJECTION`,
`selectRuntimeInstances`, `resolveAssetRuntimeRecipe`,
`resolveInstanceRuntimeRecipe`, `validateWalkableDestination`,
`findNavigationPath`, and `validateWalkablePath`. The projection remains marked
with `prototypeContentPresent: true` until real production files pass the strict
asset gate.

Build and test the package from the workspace root with:

```powershell
pnpm --filter @hearthmere/content build
pnpm --filter @hearthmere/content test
```

Package exports resolve to compiled `dist/*.js` and `dist/*.d.ts`; neither the
server nor plain Node is expected to execute TypeScript source files.
