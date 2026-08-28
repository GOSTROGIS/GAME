# Playable Origins Batch 02 — Exact Image Prompts

These are the prompts used on 2026-08-25 to complete the eight-origin concept-master and cutout roster. The four original masters are documented in `README.md`; this batch adds Grave-Tithe Runner, Cinder Mason, Starved Seer, and Thorn Poacher, plus the missing Gloamfarer cutout.

## Grave-Tithe Runner

```text
Use case: stylized-concept
Asset type: Sable Reach playable-origin character concept master
Primary request: Create the Grave-Tithe Runner origin archetype, an agile courier who smuggles names off burial rolls for poor families.
Scene/backdrop: flat near-black neutral studio background, no environment and no ground plane
Subject: mature lean woman with a wary, practical expression; short weather-cut dark hair; narrow athletic proportions. Wears layered road-worn black and umber runner's leathers, wax-sealed document pouches, false-seal tools and lock wires. Carries one compact original tithe hook and a sheathed boot knife; equipment must look functional, corroded and repaired. No glamour styling.
Style/medium: highly polished stylized 3D dark-fantasy MMORPG character presentation; original IP; grounded leather, old wool, paper, wax, iron and rain wear
Composition/framing: one complete full-body playable character, neutral ready pose, three-quarter view, face, hands, both boots and equipment visible, centered with generous clearance, portrait orientation, no crop
Lighting/mood: cold raking studio light, restrained wax-red accents; ungraded; alert and resourceful
Color palette: road black, burial umber, old parchment, wax red, tarnished iron
Constraints: playable heroic readability without clean heroic armor; no gore; no extra characters; no readable text, symbols, logos, watermark or franchise resemblance
Avoid: assassin cliché, catsuit, sexualized clothing, oversized armor, bright saturation, pristine gear, recognizable franchise design
```

## Cinder Mason

```text
Use case: stylized-concept
Asset type: Sable Reach playable-origin character concept master
Primary request: Create the Cinder Mason origin archetype, a builder who repaired foundations above a sealed furnace.
Scene/backdrop: flat near-black neutral studio background, no environment and no ground plane
Subject: mature broad-shouldered but realistically proportioned man, weathered face, close-cropped ash-gray hair, calm workman stance. Wears a scorched cinderhide jerkin, layered heavy work cloth, stone knee wraps, leather gloves and reinforced boots. Holds one original short-handled mason hammer; a rune chisel and measuring cord hang from a compact belt. Practical construction gear, no plate armor.
Style/medium: highly polished stylized 3D dark-fantasy MMORPG character presentation; original IP; grounded stone dust, cracked leather, old wool, forged iron and soot
Composition/framing: one complete full-body playable character, neutral ready pose, three-quarter view, face, hands, both boots and all tools visible, centered with generous clearance, portrait orientation, no crop
Lighting/mood: cold raking studio light opposed by a faint reflected furnace amber; ungraded; steadfast and exhausted
Color palette: soot black, cinder brown, stone gray, muted ember, weathered iron
Constraints: readable builder-fighter silhouette; mature human proportions; no gore; no extra characters; no text, logos, watermark or franchise resemblance
Avoid: dwarf stereotype, giant muscles, fantasy paladin, power armor, steampunk boiler, pristine gear, recognizable franchise design
```

## Starved Seer

```text
Use case: stylized-concept
Asset type: Sable Reach playable-origin character concept master
Primary request: Create the Starved Seer origin archetype, a disciplined visionary who interprets an empty sky through a black-glass lens.
Scene/backdrop: flat near-black neutral studio background, no environment and no ground plane
Subject: mature androgynous seer with very lean but healthy realistic proportions, high cheekbones, tired focused eyes and long dark hair threaded with premature silver. Wears layered threadbare oracle wraps, a narrow weathered mantle and practical boots. Holds one original forked seer rod; a small black-glass lens hangs in a protective brass frame at the chest. Restrained occult detail, no real-world religious symbols.
Style/medium: highly polished stylized 3D dark-fantasy MMORPG character presentation; original IP; grounded frayed linen, old wool, black glass, tarnished brass and rain wear
Composition/framing: one complete full-body playable character, composed neutral pose, three-quarter view, face, hands, both boots, rod and lens visible, centered with generous clearance, portrait orientation, no crop
Lighting/mood: cold raking studio light with a subtle gray-violet reflection in the lens; ungraded; austere and perceptive
Color palette: charcoal linen, weathered bone-white cloth, black glass, tarnished brass, muted violet
Constraints: non-graphic; no emaciation, injury or illness; no extra characters; no readable text, runes, religious symbols, logos, watermark or franchise resemblance
Avoid: glamorous sorcerer, floating magic, giant staff, ornate robes, bright saturation, recognizable franchise design
```

## Thorn Poacher

```text
Use case: stylized-concept
Asset type: Sable Reach playable-origin character concept master
Primary request: Create the Thorn Poacher origin archetype, a forest hunter who fed a village despite a winter hunting ban.
Scene/backdrop: flat near-black neutral studio background, no environment and no ground plane
Subject: mature lean man with angular weathered features, shoulder-length rough brown hair and a patient watchful expression. Wears a layered moss-dark mantle, patched forest leathers, wool wraps and practical high boots. Carries one original thornwood short bow, a quiver of barbed arrows and a sheathed skinning utility knife; a compact snare bundle hangs at the belt. Materials are damp, repaired and believable.
Style/medium: highly polished stylized 3D dark-fantasy MMORPG character presentation; original IP; grounded wood, thorn, leather, wool, iron and forest weathering
Composition/framing: one complete full-body playable character, neutral ready pose, three-quarter view, face, hands, both boots, bow and gear visible, centered with generous clearance, portrait orientation, no crop
Lighting/mood: cold raking studio light with restrained moss-green edge light; ungraded; wary and capable
Color palette: black pine, moss green, wet bark brown, muted iron, old bone
Constraints: mature narrow anatomy; no antlers on the character; no gore; no extra characters; no text, symbols, logos, watermark or franchise resemblance
Avoid: generic elf ranger, Robin Hood costume, heroic bodybuilder, pristine gear, bright saturation, recognizable franchise design
```

## Cutout extraction

The five background-extraction calls substituted the origin name and its master path into this template. The image tool returned RGB checkerboard files, so the repo's conservative boundary-connected `scripts/repair_checker_alpha.py` was applied before validation and commit.

```text
Use case: background-extraction
Asset type: Sable Reach runtime character cutout for <ORIGIN>
Input images: Image 1 is the edit target
Primary request: remove only the near-black background and replace it with genuine transparent alpha.
Constraints: preserve the complete character exactly—identity, face, pose, proportions, clothing, equipment, colors, lighting and full silhouette; preserve fine hair, frayed cloth, bow/weapon, straps and gear edges; do not crop; no checkerboard pattern; no opaque backdrop; no halo; no added shadow, text, logo or watermark; output must be a real transparent-background PNG.
```
