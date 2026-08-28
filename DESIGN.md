# Design brief: The Hollow March

## Player promise

You are an oathbound pilgrim crossing a drowned borderland whose bells preserve the names of the dead. Everything you practice becomes a discipline; every promise alters what power costs; every safe light asks what should be remembered.

## Three interlocking loops

1. **Venture:** leave a wayshrine, read the land, take deliberate fights, discover a landmark, and decide how far to push dwindling health and flask charges.
2. **Practice:** attacks, defenses, gathering, and crafting award XP to the skill actually used. Attributes define potential and resources; skills record behavior.
3. **Return:** bring materials and story evidence to NPCs, craft upgrades, advance quests, refill at a shrine, and choose the next route or discipline goal.

## Combat grammar

- Light attacks are quick and stamina-efficient; heavy attacks commit longer, reach farther, and scale with Might/Heavy Arms.
- Dodges spend meaningful stamina and provide a short invulnerability window.
- Enemies use ten encounter roles—bruiser, skirmisher, controller, artillery, ambusher, support, duelist, swarm, hunter, and juggernaut—with authored telegraphs, timing windows, counterplay, phases, and role-specific runtime ranges. The slice now resolves typed moves, health-phase aggression/recovery, line/arc/area telegraphs, status buildup, and slash/strike affinity modifiers for placed enemies.
- Defeat returns the player to the last wayshrine with restored flask charges and a 10% Sable Mark loss.
- Vows are self-imposed rules with paired benefit/cost modifiers, giving builds a narrative constraint rather than a free perk.

## Progression architecture

- **Attributes:** Vigor, Endurance, Might, Finesse, Insight, Will, Attunement, Presence.
- **Combat disciplines:** Swordsmanship, Heavy Arms, Marksmanship, Guard, Vitality, Hexcraft.
- **Gathering disciplines:** Mining, Woodcutting, Foraging, Fishing, Hunting.
- **Artisan disciplines:** Smithing, Woodcraft, Leatherworking, Alchemy, Cooking.
- **Mystic/exploration disciplines:** Runecrafting and Wayfaring.

Each discipline has twelve techniques across novice, adept, expert, and master tiers; eight actions; four milestone challenges at levels 10, 25, 50, and 75; and a level-90 mastery trial. Technique points also arrive at defined level thresholds. Two mutually exclusive adept nodes make specialization a real choice. XP uses rested charges, action diversity, repetition decay, and contribution gates to resist low-risk grinding. The browser slice integrates the complete purchase/persistence UI, a reusable action-XP reducer, combat/gather/craft/wayfaring callsites, and six representative technique effects. Milestone/mastery completion and the remaining effect hooks are explicit production contracts, not claimed runtime features.

## Content architecture

- `registries.js` is the canonical adapter boundary for enemies, characters, items, skills, and regions. Legacy vertical-slice IDs remain compatible without maintaining a second hidden content truth.
- `contentGraph.js` validates IDs across quests, drops, recipes, origins, encounters, characters, relationships, skill trees, regions, and asset references.
- `encounters.js` owns 24 runtime placements grouped into seven budgeted encounter compositions, with explicit activation, reset, region ownership, and role intent. The prototype AI does not yet coordinate those groups.
- The persistent objective ledger records actions before their associated quest activates, so defeating a unique enemy early or gathering ahead cannot softlock the chain.
- Save schema version 3 migrates prior browser saves, repairs hostile/malformed progression and player state, reconciles spawned enemies, and adds technique, story-flag, and world-event state.

## World structure

- **Hearthmere Hold (1–6):** social hub, first shrine, combat instruction, Ember Ledger.
- **Graven March (2–10):** roads, cairns, tracking, early enemies, exploration story.
- **Dunmire Causeway (5–14):** gathering, drowned parish, ranged pressure, moral side story.
- **Cinderward (8–18):** mining/smithing route, furnace hazards, first boss and gate key.
- **Hollow Abbey (14–24):** counter-fighters, layered objectives, final boss, memory choice.

Salt-Waste and Veil-Coast exist as frontier stubs in the region registry and bestiary. They are authored expansion hooks, not playable regions. Four final environment keyframes cover Hearthmere, Dunmire, Cinderward, and Hollow Abbey; five regional production kits specify modular surfaces, structures, props, foliage, decals, VFX, audio, palettes, and lighting.

## Visual direction

- Characters use mature, narrow anatomy and plague-worn faces: hollow cheeks, exhausted eyes, unhealthy skin, damaged layered cloth, corroded tools, and restrained materials. Cute proportions, oversized heroic torsos, pristine armor, glamour styling, and comedy silhouettes are outside the target language.
- Four original stylized-3D origin keyframes establish the current quality target. They lead the creator, HUD, character sheet, and prototype in-world sprites; the appearance controls remain represented by a separate live deterministic profile until a rigged morphable model can replace it honestly.
- The retained Canvas world combines readable isometric navigation with region keyframe atmosphere, material gradients, dimensional structures, layered foliage, local light, fog, and rain. Hearthmere now also has a manifest-driven WebGL2 graybox with live rigs, navigation, occluder fading, and synchronized actors. Production parity still requires original Blender-authored modular kits, terrain blending, complete animation, production occlusion/LODs, and region-specific population passes.

## Production priorities

- Split remaining combat mutation from `main.js` and add deterministic seeded encounter simulations for movement, telegraph resolution, and group budgets.
- Implement the milestone/mastery evaluator and respec economy so a capstone can be earned through ordinary play rather than save migration alone.
- Turn representative bestiary roles into original animated models or sprite sheets, then implement one complete encounter composition per region before scaling the roster.
- Wire remaining technique hooks in vertical slices: one full combat tree, one gathering minigame, one artisan quality loop, and one cross-skill synergy before broad implementation.
- Implement equipment, poise, guard/parry, status effects, real boss phases, and vow rule enforcement.
- Add real station requirements, banking, shops, repair/durability, and resource animation timing.
- Convert the world keyframes and asset kits into blockouts, collision proxies, encounter lanes, budgets, and an import pipeline; concept art alone is not a shippable world asset.
- Expand each region into streamed chunks, place the remaining named characters, add faction-state consequences, minimap/cartography, elevation, occlusion, and navigation mesh data.
- Add audio buses, adaptive region layers, enemy cues, full dialogue presentation, rebinding, controller support, and localization.
