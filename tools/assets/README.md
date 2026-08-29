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

The historical LFS repair catalogue is independently checked without contacting
the remote store:

```powershell
node tools/assets/validate-lfs-forward-repair.mjs
node tools/assets/validate-lfs-forward-repair.mjs --require-resolved
```

The normal command proves that every tracked historical pointer has an exact OID,
byte count, recovery state, and forward action in the manifest. The release form
also fails on every unresolved payload. A rebuilt file may replace an active
catalogue reference only under a new version and OID; it must never be relabeled
as one of the historical hashes.

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
node tools/assets/validate-raster-art.mjs --metadata-only --strict-provenance
node tools/assets/validate-raster-art.mjs --strict-provenance --changed-since <base-ref>
node tools/assets/validate-concept-art-privacy.mjs
node tests/raster-art-validator.mjs
```

The normal gate enforces safe canonical paths, PNG structure and chunk CRCs, raster budgets, genuine cutout alpha, opaque masters, transparent corners, index coverage, hash mismatches, and stale/orphan records. Text, compressed-text, international-text, EXIF, and C2PA/JUMBF content-credential (`caBX`) chunks are rejected so published PNGs cannot carry hidden free-form provenance or provider-scoped identifiers. Published provenance JSON rejects execution IDs, external URLs, email addresses, and workstation paths.

Incomplete metadata from recovered legacy batches is reported as a warning. Use `--strict-provenance` before increasing any completion count; it upgrades missing hash, byte, dimension, color-space, alpha-policy, rights, content-hash lineage, prompt-direction, and maturity evidence to errors. `--metadata-only` checks the complete index and provenance catalog without opening PNG payloads. `--changed-since` accepts a Git base ref (or `RASTER_ART_BASE_SHA`) and opens only PNGs added or modified since that ref. Hash or dimension mismatches always fail when a payload is inspected.

The concept-art privacy command also scans the published prompt and design-review
surfaces for provider execution IDs, Drive links, signed URL material, email
addresses, and workstation paths. Content hashes and repository-relative paths
remain the only accepted public lineage identifiers.
