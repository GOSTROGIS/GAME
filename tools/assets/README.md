# World-content validation

The validator has no third-party runtime dependencies and is safe to run before
the client/server workspaces are installed.

```powershell
node tools/assets/validate.mjs
node tools/assets/summary.mjs
node tests/assets3d.mjs
```

Use `--json` on either tool for CI output. `validate.mjs` also accepts `--root`,
`--assets`, `--licenses`, and `--scene`; override paths are resolved from the
selected workspace root.

The normal gate permits assets explicitly marked `prototype_geometry`, emits a
warning with their count, and still enforces their generator, provenance,
budgets, LODs, targets, scene references, navigation, and phases. The final art
gate is deliberately stricter:

```powershell
node tools/assets/validate.mjs --strict-production
```

That command fails until every catalogue record is `production_ready`, uses file
delivery, has a workspace-confined runtime path and SHA-256 hash, and the file is
present. It prevents a graybox count or screenshot from being used as evidence
that production assets exist.

Validation failure codes are stable enough for CI filtering: `duplicate_id`,
`triangle_budget`, `texture_budget`, `missing_provenance`,
`incomplete_external_provenance`, `missing_asset`, `unknown_phase`,
`exclusive_phase_conflict`, `legacy_mapping`, `disconnected_navigation`, and
`production_gate` cover the primary adversarial gates.
## Character and bestiary raster validation

The generated character and bestiary PNGs have a separate path-specific gate:

```powershell
node tools/assets/validate-raster-art.mjs
node tools/assets/validate-raster-art.mjs --strict-provenance
node tests/raster-art-validator.mjs
```

The normal gate enforces safe canonical paths, PNG integrity, raster budgets, genuine cutout alpha, transparent corners, index coverage, hash mismatches, and stale/orphan records. Incomplete metadata from recovered legacy batches is reported as a warning. Use `--strict-provenance` before increasing any completion count; it upgrades missing hash, byte, dimension, color-space, alpha-policy, rights, lineage, prompt-direction, and maturity evidence to errors. Hash or dimension mismatches always fail.

