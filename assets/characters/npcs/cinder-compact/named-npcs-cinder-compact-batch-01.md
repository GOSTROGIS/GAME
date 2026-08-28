# Cinder Compact Named NPCs — Batch 01 Prompts

Generated on 2026-08-26 with the OpenAI built-in image-generation tool. Existing Sable Reach art established only the near-black studio presentation, mature grounded proportions, restrained industrial materials, subdued palette, and level of finish. All identities, faces, poses, garments, tools, and silhouettes are original to this batch.

## Orik Senn

```text
Create Orik Senn, an adult man in his early sixties and the Last Smith of Cinderward, as a complete full-body Cinder Compact named NPC. Make him a lean, exacting senior precision smith rather than a warrior or playable Cinder Mason: split charcoal forge coat, faded ember-red wool, heat-dark leather apron, modest measuring plates, practical boots, compact planishing hammer held down, large curved calipers, bolt gauges, folding square, punch set, sealed chalk tube, closed pattern case, and a narrow tool-carrying shoulder yoke. Near-black neutral studio, restrained warm ember rim, cool frontal fill, realistic soot-dark wool, leather, corroded iron, brass, and ash. Keep every prop inside a portrait 2:3 frame. No active forge, action scene, fantasy glow, visible text, logo, or crop.
```

## Sava Quench

```text
Create Sava Quench, an adult woman in her mid-forties and Quench-master of Cinderward, as a complete full-body Cinder Compact named NPC. Give her a composed technical silhouette built from charcoal wool, faded ember-red underlayers, a long waxed apron, reinforced forearms, practical boots, a closed hammered-copper quench flask, long perforated handling basket, temperature-test rods, stoppered ceramic cooling salts, valve key, folded heat cloths, and hinged sample rack. Use subtle blue-gray water staining against the warm forge palette. Near-black studio, restrained cool rim and ember edge, realistic copper, iron, ceramic, leather, and wet-dark wool. No active process, weapon posture, visible text, logo, or crop.
```

## Tarn Widow

```text
Create Tarn Widow, an adult woman in her late fifties and austere keeper of the Widow Forge, as a complete full-body Cinder Compact named NPC. Treat Widow as a professional title. Use a high-collared charcoal coat, faded ember lining, split keeper mantle, segmented leather waist guard, modest shoulder caps, gloves, high boots, varied forge keys, compact valve-wheel tool, blank lockplate samples, an upright closed bellows-control lever, sealed maintenance packets, oil flask, and blank duty tokens. Near-black studio with restrained warm rim and cool fill; grounded wool, leather, corroded iron, brass, paper, and ash. No mourning tableau, active forge, visible text, logo, or crop.
```

## Mera Bolt

```text
Create Mera Bolt, an adult woman in her mid-thirties and salvage engineer of Cinderward, as a complete full-body Cinder Compact named NPC. Build a compact recovery-engineer silhouette from a short charcoal work coat, faded ember layers, divided leather apron, reinforced knees and forearms, gloves, sturdy boots, folded portable screw-jack frame, practical ratchet spanner held down, segmented tray of blank fasteners, measuring chain, pulley block, plumb weight, pry wedges, articulated clamp, and closed parts case. Near-black studio, restrained ember rim, realistic greasy canvas, leather, iron, brass, wool, and ash. All machinery is inactive and secured. No combat pose, visible text, logo, or crop.
```

## Dain Coal

```text
Create Dain Coal, an adult man around fifty and the furnace-maintenance steward canonically called the Furnace Penitent, as a complete full-body Cinder Compact named NPC. Interpret the title as disciplined voluntary civic service and technical upkeep. Use charcoal wool, a plain ash-gray work surcoat with faded ember edging, short leather shoulder cape, wrapped forearms, gloves, boots, upright grate-inspection rod, removable furnace-filter panel, ash sieve, replacement mesh rolls, folded filter cloths, an unused respirator at the belt, ceramic dust jars, blank duty tokens, and a closed inspection pouch. Near-black studio, warm rim and cool fill, realistic wool, linen, leather, iron, brass, ceramic, and mesh. No ritual tableau, active furnace, dangerous action, visible text, logo, or crop.
```

## Pritch Glass

```text
Create Pritch Glass, an adult man in his early forties and Glasswood harvester of Cinderward, as a complete full-body Cinder Compact named NPC. Make him a patient specialist collector rather than a warrior: charcoal wool with ember seams, padded ash-gray mantle, split waxed-leather apron, thick gloves, forearm guards, sturdy boots, round goggles resting on a padded hood, long pruning hook held down, wicker-and-brass carrier with secured intact smoky-gray glasswood samples, padded wraps, soft-jaw clamps, resin pots, calipers, sheathed hand saw, and folded canvas screen. Near-black studio with restrained ember rim and cool fill. No active cutting, loose fragments, visible text, logo, or crop.
```

## Cutout extraction and repair

Each approved master was submitted separately with identity, pose, clothing, equipment, subject lighting, scale, framing, and full silhouette locked. The tool returned RGB checkerboard renders. `scripts/repair_checker_alpha.py` removed boundary-connected pale low-chroma pixels; a visual-QA pass then cleared large enclosed checker components inside rings, frames, baskets, tools, and mesh. Dain Coal's fine filter equipment also received a prop-bounded pale-pixel check. Each cutout was conformed to the 1024×1536 master canvas, optimized as indexed PNG8 with `tRNS`, and reviewed over a light-to-dark field.

```text
Remove only the studio background and floor from Image 1. Preserve the exact adult character, face, expression, pose, proportions, clothing, tools, colors, subject lighting, scale, canvas, and complete silhouette. Make the exterior and every reviewed prop opening genuinely transparent with four transparent corners. No baked checkerboard, matte rectangle, halo, crop, restyling, added or removed object, text, logo, or watermark.
```
