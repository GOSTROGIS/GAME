# Playable-origin art manifest

This directory contains the complete eight-origin concept-art roster and a matching transparent cutout for each origin.

## Assets

| Origin | Concept master | Transparent cutout |
|---|---|---|
| Gloamfarer | `gloamfarer-v2.png` | `gloamfarer-v2-cutout.png` |
| Bell Warden | `bell-warden-v2.png` | `bell-warden-v2-cutout.png` |
| Grave-Tithe Runner | `grave-tithe-runner-v2.png` | `grave-tithe-runner-v2-cutout.png` |
| Mire Physicker | `mire-physicker-v2.png` | `mire-physicker-v2-cutout.png` |
| Oathless Scion | `oathless-scion-v2.png` | `oathless-scion-v2-cutout.png` |
| Cinder Mason | `cinder-mason-v2.png` | `cinder-mason-v2-cutout.png` |
| Starved Seer | `starved-seer-v2.png` | `starved-seer-v2-cutout.png` |
| Thorn Poacher | `thorn-poacher-v2.png` | `thorn-poacher-v2-cutout.png` |

## Direction and maturity

The shared direction is a polished stylized-3D dark-fantasy character presentation with full-body framing, restrained color, weathered practical equipment, grounded materials, and distinct origin silhouettes. The work is original project art and intentionally avoids franchise resemblance, logos, text, and watermarks.

The masters are approved concept art. The cutouts are prototype billboards with genuine alpha. Neither set is marked as runtime-integrated or production-ready character models.

The first four masters and three cutouts were committed in the initial render batch. Batch 02 adds four masters and five cutouts, completing the 8/8 master and 8/8 cutout roster. Exact prompts and extraction notes are in `playable-origins-batch-02.md`; hashes, dimensions, lineage, alpha validation, and maturity flags are in `playable-origins.batch-02.provenance.json`.

Several image-tool extraction results contained a baked checker pattern. Those outputs were repaired with `scripts/repair_checker_alpha.py`, which removes only pale low-chroma backdrop pixels connected to the image boundary. The final files were checked for RGBA mode, transparent corners, and non-empty opaque silhouettes.

The initial Gloamfarer, Bell Warden, Mire Physicker, and Oathless Scion masters plus the first three cutouts now have a recovery provenance record in `playable-origins.batch-01.provenance.json`. It was reconstructed from owner-supplied source copies whose byte lengths match the committed blobs; exact original prompts were not present in that handoff and are not claimed.

