# Hearthmere 3D asset staging

This directory is the destination described by the content manifests. It does
not currently contain production Blender, GLB, or KTX2 files.

- `authoring/` will hold original `.blend` sources.
- `runtime/` will hold optimized `.glb` and `.ktx2` derivatives.
- Prototype geometry is generated from the named recipes in
  `packages/content/manifests/hearthmere.assets.json`.

An asset may change from `prototype_geometry` to `production_ready` only after
its declared runtime file, SHA-256 hash, license/source record, LODs, sockets,
morphs, clips, and budgets pass `node tools/assets/validate.mjs
--strict-production`.

Identity-defining characters, enemies, architecture, symbols, equipment, and
narrative props must remain original. Any later CC0 foundation must receive a
new source record containing its URL, creator, license, retrieval date, hash,
and modifications before it can enter the runtime manifest.
