# Art roster and completion ledger

Last audited: 2026-08-26 against `main`.

This ledger turns the hand-off into countable deliverables. Canonical IDs, names, regions, factions, ranks, and ordering stay in the game-data modules; this file records art coverage without duplicating those sources. File paths are indexed in `art-index.json`.

## Subject coverage

| Subject group | Canonical source | Subjects | Concept masters | Transparent cutouts | Status |
|---|---|---:|---:|---:|---|
| Playable origins | `src/data/character.js` (`ORIGINS`) | 8 | 8 / 8 | 8 / 8 | Complete |
| Named NPCs and special-region characters | `src/data/characters.js` (`CHARACTERS`) | 42 | 24 / 42 | 24 / 42 | In progress |
| Individual bestiary forms | `packages/content/src/bestiary.data.js` (`BESTIARY`) | 178 | 0 / 178 | 0 / 178 | Pending |
| **Total** | Canonical modules above | **228** | **32 / 228** | **32 / 228** | **392 subject images remain** |

## Supplementary family coverage

| Deliverable | Canonical source | Complete | Pending | Total |
|---|---|---:|---:|---:|
| Bestiary family concept plates | `packages/content/src/bestiary.data.js` (`ENEMY_FAMILIES`) | 21 | 0 | 21 |

Family plates establish visual grammar for groups; they do not replace the 178 individual bestiary masters or cutouts.

## Acceptance rules

- A concept master counts only when its approved PNG, exact prompt or generation direction, hash or lineage, dimensions, rights declaration, and maturity flags are committed.
- A cutout counts only when it has genuine alpha, transparent corners, a non-empty opaque silhouette, source-master lineage, and no baked checkerboard.
- Concept art and prototype cutouts do not imply runtime integration, animation, collision, rigging, LODs, or production readiness.
- Game-data modules are the authority for roster membership. This ledger and `art-index.json` must be updated in the same commit whenever an art batch changes a completion count.

## Next production order

1. Produce the remaining 18 named NPC and special-region character masters in faction-sized batches, followed by matching cutouts.
2. Produce the 178 individual bestiary forms family by family, followed by matching cutouts.
3. Continue strict provenance backfill for legacy plates and confirm Git LFS capacity before larger raster commits.
