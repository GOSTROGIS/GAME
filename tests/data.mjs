import { SKILLS, ITEMS, RESOURCES, RECIPES, xpForLevel, levelFromXp } from "../src/data/skills.js";
import { WORLD, MAP_ROWS, NPCS, ENEMIES, GATHER_NODES, regionAtPosition } from "../src/data/world.js";
import { QUESTS } from "../src/data/quests.js";
import { DEFAULT_CHARACTER, validateCharacter, characterSilhouette } from "../src/data/character.js";
import { BESTIARY, ENEMY_FAMILIES, validateBestiary } from "../src/data/bestiary.js";
import { CHARACTERS, CHARACTER_RELATIONSHIPS, FACTIONS, STORY_STATE_DEFAULTS, validateCharacters } from "../src/data/characters.js";
import { SKILL_TREES, SKILL_ACTIONS, CROSS_SKILL_SYNERGIES, MASTERY_TRIALS, validateSkillTrees } from "../src/data/skillTrees.js";
import { WORLD_CONCEPT_ASSETS, WORLD_SOURCE_ASSETS, WORLD_SPATIAL_BLOCKOUT_ASSETS, WORLD_TECHNICAL_ASSETS, REGION_ASSET_KITS, validateWorldAssets } from "../src/data/worldAssets.js";
import { ENCOUNTERS, ENCOUNTER_SPAWNS, validateEncounterSpawns, validateEncounterGroups } from "../src/data/encounters.js";
import { ENEMY_DEFINITIONS, ENEMY_REGISTRY, ITEM_REGISTRY, CHARACTER_DEFINITIONS, validateRegistries } from "../src/data/registries.js";
import { validateContentGraph, validatePermanentInteractionLayout } from "../src/data/contentGraph.js";
import { SAVE_SCHEMA_VERSION, createProgressionState, createWorldEvents, migrateSave } from "../src/core/saveMigrations.js";
import { recordWorldObjective, hydrateQuestFromLedger, canOpenHollowAbbey, canResolveLastBell, lastBellOutcome } from "../src/core/worldProgression.js";
import { evaluateTechniquePurchase, purchaseTechniqueInState } from "../src/core/techniqueProgression.js";
import { rollLoot } from "../src/core/loot.js";
import { awardSkillAction } from "../src/core/skillActions.js";
import { damageAffinityMultiplier, behaviorPhaseAt, enemyMoveRuntime } from "../src/core/combat.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const unique = (entries, label) => check(new Set(entries.map(({ id }) => id)).size === entries.length, `${label} contains duplicate IDs`);
const CHARACTER_RENDER_ASSETS = [
  "assets/characters/gloamfarer-v2.png",
  "assets/characters/bell-warden-v2-cutout.png",
  "assets/characters/mire-physicker-v2-cutout.png",
  "assets/characters/oathless-scion-v2-cutout.png",
];

unique(SKILLS, "Skills"); unique(ITEMS, "Items"); unique(RESOURCES, "Resources"); unique(RECIPES, "Recipes");
check(MAP_ROWS.length === WORLD.map.height, "Map height does not match metadata");
check(MAP_ROWS.every((row) => row.length === WORLD.map.width), "Map rows have inconsistent width");
check(Object.keys(WORLD.tileLegend).every((symbol) => MAP_ROWS.some((row) => row.includes(symbol))), "A legend symbol is unused");
check(validateCharacter(DEFAULT_CHARACTER).valid, "Default character does not validate");
check(JSON.stringify(characterSilhouette(DEFAULT_CHARACTER)) === JSON.stringify(characterSilhouette(DEFAULT_CHARACTER)), "Silhouette is not deterministic");
check(xpForLevel(99) === 13034431, "Level-99 XP contract changed");
for (let level = 1; level <= 99; level += 1) check(levelFromXp(xpForLevel(level)) === level, `XP inverse failed at level ${level}`);
check(validateBestiary().valid, `Bestiary validator failed: ${JSON.stringify(validateBestiary().errors)}`);
check(validateCharacters().valid, `Character validator failed: ${JSON.stringify(validateCharacters().errors)}`);
check(validateSkillTrees().valid, `Skill tree validator failed: ${JSON.stringify(validateSkillTrees().errors)}`);
check(validateWorldAssets().valid, `World asset validator failed: ${JSON.stringify(validateWorldAssets().errors)}`);
check(validateRegistries().valid, `Registry validator failed: ${JSON.stringify(validateRegistries().errors)}`);
const rusk = ENEMY_REGISTRY.kiln_knight_rusk;
check(damageAffinityMultiplier(rusk, "frost") === 1.25, "Enemy weakness affinity did not amplify damage");
check(damageAffinityMultiplier(rusk, "slash") === 0.75, "Enemy resistance affinity did not reduce damage");
check(behaviorPhaseAt(rusk, rusk.runtime.maxHealth, rusk.runtime.maxHealth).id === "assess", "Enemy did not begin in its assess phase");
check(behaviorPhaseAt(rusk, rusk.runtime.maxHealth * .2, rusk.runtime.maxHealth).id === "desperate", "Boss did not enter its desperate phase");
const ruskSignature = enemyMoveRuntime(rusk, rusk.moves.at(-1).id, rusk.runtime.maxHealth * .2, rusk.runtime.maxHealth);
check(ruskSignature.status === "fire" && ruskSignature.phase.id === "desperate" && ruskSignature.damage > rusk.runtime.damage, "Typed signature move did not carry phase-scaled fire behavior");
const reedWitch = ENEMY_REGISTRY.reed_witch;
const mireStep = enemyMoveRuntime(reedWitch, reedWitch.moves.find(({ id }) => id.endsWith("_mire_step")).id, reedWitch.runtime.maxHealth, reedWitch.runtime.maxHealth);
check(mireStep.effectKind === "movement" && mireStep.damage === 0, "Mire Step was incorrectly coerced into direct damage");
const waxArcher = ENEMY_REGISTRY.wax_seal_archer;
const bannerWall = enemyMoveRuntime(waxArcher, waxArcher.moves.find(({ id }) => id.endsWith("_banner_wall")).id, waxArcher.runtime.maxHealth, waxArcher.runtime.maxHealth);
check(bannerWall.effectKind === "support" && bannerWall.damage === 0, "Banner Wall was incorrectly coerced into direct damage");
const graph = validateContentGraph();
check(graph.valid, `Content graph validator failed: ${JSON.stringify(graph.errors)}`);
const collisionFixture = validatePermanentInteractionLayout([], [], [
  { id: "first", regionId: "hearthmere", position: { x: 8, y: 4 } },
  { id: "blocked", regionId: "hearthmere", position: { x: 8, y: 4 } },
]);
check(!collisionFixture.valid && collisionFixture.errors.some((error) => error.includes("collision")), "Permanent interaction validator accepted an ambiguous quest target fixture");
const badSpawnFixture = validateEncounterSpawns(ENEMY_REGISTRY, (x, y) => Boolean(WORLD.tileLegend[MAP_ROWS[y]?.[x]]?.walkable), regionAtPosition, [
  { id: "bad_region", enemyId: "ash_husk", regionId: "cinderward", position: { x: 4, y: 15 } },
]);
check(!badSpawnFixture.valid && badSpawnFixture.errors.some((error) => error.includes("outside declared region")), "Encounter validator accepted a declared/resolved region mismatch fixture");
const remoteGroupFixture = validateEncounterGroups([{ id: "remote", regionId: "graven_march", tier: "field", spawnIds: ["remote_spawn"], budget: [1, 1], activation: { center: { x: 0, y: 0 }, radius: 1 }, roleIntent: "Fixture", reset: "fixture" }], [{ id: "remote_spawn", enemyId: "ash_husk", regionId: "graven_march", position: { x: 10, y: 10 } }]);
check(!remoteGroupFixture.valid && remoteGroupFixture.errors.some((error) => error.includes("activation radius")), "Encounter-group validator accepted a remote roster member fixture");
check(BESTIARY.length === 178 && ENEMY_FAMILIES.length === 21, "Bestiary quantity contract changed");
check(CHARACTERS.length === 42 && FACTIONS.length === 7 && CHARACTER_RELATIONSHIPS.length === 48, "Character or faction quantity contract changed");
check(Object.keys(STORY_STATE_DEFAULTS).length === CHARACTERS.length + new Set(CHARACTER_RELATIONSHIPS.map(({ stateFlag }) => stateFlag)).size, "Story-state registry does not cover every arc and relationship flag");
check(Object.keys(SKILL_TREES).length === 18, "Expected 18 skill trees");
check(Object.values(SKILL_TREES).flatMap(({ nodes }) => nodes).length === 216, "Expected 216 technique nodes");
check(Object.values(SKILL_ACTIONS).flat().length === 144, "Expected 144 skill actions");
check(CROSS_SKILL_SYNERGIES.length === 20 && MASTERY_TRIALS.length === 18, "Synergy or mastery quantity contract changed");
check(ENCOUNTER_SPAWNS.length === 24, "Expected 24 authored encounter spawns");
check(ENCOUNTERS.length === 7 && validateEncounterGroups().valid, "Expected seven valid encounter compositions");
check(ENEMY_DEFINITIONS.every(({ runtime }) => runtime?.maxHealth > 0 && runtime?.damage > 0), "A canonical enemy lacks runtime tuning");
check(CHARACTER_DEFINITIONS.every(({ regionId }) => typeof regionId === "string"), "A canonical character lacks a region");
check(Object.keys(ITEM_REGISTRY).length >= 200, "Canonical item registry is unexpectedly small");
for (const asset of [...WORLD_CONCEPT_ASSETS, ...WORLD_SOURCE_ASSETS, ...WORLD_TECHNICAL_ASSETS]) check(existsSync(resolve(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), asset.path)), `Missing world asset ${asset.path}`);
for (const reference of WORLD_SPATIAL_BLOCKOUT_ASSETS) {
  for (const repositoryPath of [reference.payloadPath, reference.indexPath, reference.provenancePath, reference.schemaPath].filter(Boolean)) check(existsSync(resolve(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), repositoryPath)), `Missing spatial blockout asset ${repositoryPath}`);
}
for (const asset of WORLD_TECHNICAL_ASSETS) check(existsSync(resolve(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), asset.topologyPath)), `Missing world topology source ${asset.topologyPath}`);
for (const asset of CHARACTER_RENDER_ASSETS) check(existsSync(resolve(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), asset)), `Missing character render ${asset}`);
check(REGION_ASSET_KITS.length === 5, "Expected five production regional asset kits");
check(new Set(WORLD_CONCEPT_ASSETS.map(({ id }) => id)).size === WORLD_CONCEPT_ASSETS.length, "World concept IDs must be unique");
check(WORLD_CONCEPT_ASSETS.length === 13, "Expected thirteen accepted world concept references");
check(WORLD_TECHNICAL_ASSETS.length === 1, "Expected one accepted world technical reference");
check(WORLD_SPATIAL_BLOCKOUT_ASSETS.length === 3, "Expected three reviewed world spatial blockout references");
check(new Set(WORLD_SPATIAL_BLOCKOUT_ASSETS.map(({ id }) => id)).size === WORLD_SPATIAL_BLOCKOUT_ASSETS.length, "World spatial blockout IDs must be unique");
check(WORLD_SPATIAL_BLOCKOUT_ASSETS.every(({ authority, runtimeIntegrated, constructionReady, productionGeometry, staticScene, animatedScene, releaseReady }) => authority === "independently_reviewed_noncanonical_reference" && !runtimeIntegrated && !constructionReady && !productionGeometry && !staticScene && !animatedScene && !releaseReady), "Spatial blockout registry overstates authority or implementation readiness");
const wardenExterior = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_warden_reed_four_bank_visibility_exterior");
const wardenInterior = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_warden_reed_stilt_service_house_interior");
const hearthmereCivic = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_hearthmere_civic_spring_spine");
check(Boolean(hearthmereCivic), "Hearthmere civic spring direction is missing");
check(hearthmereCivic?.path === "./assets/world/hearthmere-civic-spring-spine-v1.png" && hearthmereCivic?.sha256 === "d8f74db7b7bb138475b15d64d0ee86f779804bafa6b6054afbc0adb46e310a79" && hearthmereCivic?.bytes === 3207738, "Hearthmere civic spring content-addressed evidence changed");
check(hearthmereCivic?.dimensions?.width === 1536 && hearthmereCivic?.dimensions?.height === 1024 && hearthmereCivic?.colorSpace === "sRGB" && hearthmereCivic?.alphaPolicy === "opaque", "Hearthmere civic spring raster contract changed");
check(hearthmereCivic?.environmentId === "environment.hearthmere-hold-civic-spring-spine" && hearthmereCivic?.siteId === "site.hearthmere" && hearthmereCivic?.locationId === "hearthmere_civic_spring_spine", "Hearthmere civic spring content binding changed");
check(hearthmereCivic?.referenceScope === "site_civic_exterior" && hearthmereCivic?.runtimeBackdrop === false && hearthmereCivic?.runtimeIntegrated === false && hearthmereCivic?.productionAsset === false, "Hearthmere civic spring overstates implementation readiness");
check(JSON.stringify(hearthmereCivic?.use) === JSON.stringify(["civic_spring_spine", "three_route_hierarchy", "resident_scale", "spring_runoff_separation", "working_civic_artifacts", "hearthmere_material_law"]), "Hearthmere civic spring accepted-use boundary changed");
check(Boolean(wardenExterior && wardenInterior), "Warden Reed exterior/interior direction pair is incomplete");
for (const [asset, expected] of [
  [wardenExterior, { path: "./assets/world/warden-reed-four-bank-visibility-exterior-v1.png", sha256: "52d94e5252c7f4935772daaa970b58668ea82746491a969d0cad616403eaf17e", bytes: 2709612, scope: "quest_location_exterior" }],
  [wardenInterior, { path: "./assets/world/warden-reed-stilt-service-house-interior-v1.png", sha256: "5494c36be429b7a76b2f2857059cce8a28a495fa23bc27a2e405adf950037089", bytes: 2729693, scope: "quest_location_interior" }],
]) {
  check(asset?.path === expected.path && asset?.sha256 === expected.sha256 && asset?.bytes === expected.bytes, `Warden Reed ${expected.scope} content-addressed evidence changed`);
  check(asset?.dimensions?.width === 1536 && asset?.dimensions?.height === 1024 && asset?.colorSpace === "sRGB" && asset?.alphaPolicy === "opaque", `Warden Reed ${expected.scope} raster contract changed`);
  check(asset?.environmentId === "environment.warden-reed-four-bank-visibility" && asset?.siteId === "site.warden-reed" && asset?.locationId === "warden_reed_four_bank_visibility" && asset?.questId === "regional_the_fog_came_to_collect_our_outlines", `Warden Reed ${expected.scope} canonical binding changed`);
  check(asset?.referenceScope === expected.scope && asset?.runtimeBackdrop === false && asset?.runtimeIntegrated === false && asset?.productionAsset === false, `Warden Reed ${expected.scope} overstated implementation readiness`);
}
const hollowArrival = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_hollow_abbey_processional_west_arrival");
const hollowInterior = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_hollow_abbey_mute_nave_route_read");
const hollowRainCourt = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_hollow_abbey_rain_court_work_nexus");
const hollowFoundry = WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_hollow_abbey_foundry_operational_chain");
check(Boolean(hollowArrival && hollowInterior && hollowRainCourt && hollowFoundry), "Hollow Abbey supplemental direction set is incomplete");
for (const [asset, expected] of [
  [hollowArrival, { path: "./assets/world/hollow-abbey-processional-west-arrival-v1.png", sha256: "e10cf6c4e1469d23f49f0fc38ebb49d0dad51f490b1f8bf23c1c2e82ced72e29", bytes: 2762634, scope: "site_arrival_exterior", landmarks: ["abbey_gate"] }],
  [hollowInterior, { path: "./assets/world/hollow-abbey-mute-nave-route-read-v1.png", sha256: "2e5582779702fed33fef3ee092f109a0c39403431752f11c22bbad95b7288826", bytes: 2715661, scope: "site_interior_route_read", landmarks: ["mute_nave", "last_bell_crypt"] }],
  [hollowRainCourt, { path: "./assets/world/hollow-abbey-rain-court-work-nexus-v1.png", sha256: "a5e5ae1dfe2ec15a7f17f649356404f4f276ba8db89bcdd07bc2273cd555b074", bytes: 3200004, scope: "site_court_work_nexus", landmarks: ["abbey_gate", "mute_nave"] }],
]) {
  check(asset?.path === expected.path && asset?.sha256 === expected.sha256 && asset?.bytes === expected.bytes, `Hollow Abbey ${expected.scope} content-addressed evidence changed`);
  check(asset?.dimensions?.width === 1536 && asset?.dimensions?.height === 1024 && asset?.colorSpace === "sRGB" && asset?.alphaPolicy === "opaque", `Hollow Abbey ${expected.scope} raster contract changed`);
  check(asset?.environmentId === "environment.hollow-abbey-processional-and-mute-nave" && asset?.siteId === "site.hollow-abbey" && asset?.routeId === "route.processional-steps" && asset?.locationId === "hollow_abbey_processional_and_mute_nave" && asset?.questId === "main_a_litany_unspoken", `Hollow Abbey ${expected.scope} canonical binding changed`);
  check(JSON.stringify(asset?.landmarkIds) === JSON.stringify(expected.landmarks), `Hollow Abbey ${expected.scope} landmark binding changed`);
  check(asset?.referenceScope === expected.scope && asset?.runtimeBackdrop === false && asset?.runtimeIntegrated === false && asset?.productionAsset === false, `Hollow Abbey ${expected.scope} overstated implementation readiness`);
}
check(hollowFoundry?.path === "./assets/world/hollow-abbey-foundry-operational-chain-v1.png" && hollowFoundry?.sha256 === "a4b6c7ee808befc1ac6b1adfefa1a801c4e5d5fe48e71e42e1820c789a48b1bc" && hollowFoundry?.bytes === 2656904, "Hollow Abbey foundry content-addressed evidence changed");
check(hollowFoundry?.dimensions?.width === 1536 && hollowFoundry?.dimensions?.height === 1024 && hollowFoundry?.colorSpace === "sRGB" && hollowFoundry?.alphaPolicy === "opaque", "Hollow Abbey foundry raster contract changed");
check(hollowFoundry?.environmentId === "environment.hollow-abbey-processional-and-mute-nave" && hollowFoundry?.siteId === "site.hollow-abbey" && hollowFoundry?.locationId === "hollow_abbey_foundry_of_borrowed_quiet" && hollowFoundry?.questId === "profession_bell_paid_in_silence", "Hollow Abbey foundry canonical binding changed");
check(hollowFoundry?.referenceScope === "site_foundry_operational_interior" && hollowFoundry?.runtimeBackdrop === false && hollowFoundry?.runtimeIntegrated === false && hollowFoundry?.productionAsset === false, "Hollow Abbey foundry overstated implementation readiness");
check(JSON.stringify(hollowFoundry?.use) === JSON.stringify(["f01_f08_operational_chain", "seven_silence_rooms_simultaneous_read", "deaf_worker_blackwater_ripple_sightline", "funeral_route_bypasses_molten_floor", "rain_open_casting_lantern_seven_baffles", "worker_egress_clearance_repair_and_weathering"]), "Hollow Abbey foundry accepted-use boundary changed");
const veilTechnicalReference = WORLD_TECHNICAL_ASSETS.find(({ id }) => id === "technical_veil_coast_gloamharbor_tide_refuge");
check(veilTechnicalReference?.approvalStatus === "approved_2d_topology_reference", "Veil technical reference must retain its reviewed 2D-only status");
check(veilTechnicalReference?.claims?.cells === 5 && veilTechnicalReference?.claims?.internalOpenings === 4, "Veil technical reference lost reviewed cell topology");
check(veilTechnicalReference?.runtimeIntegrated === false && veilTechnicalReference?.productionAsset === false && veilTechnicalReference?.technicalReadiness === false, "Veil technical reference overstated implementation readiness");
check(veilTechnicalReference?.coordinateSemantics === "diagram_pixels_not_meters", "Veil technical reference must not expose diagram coordinates as world meters");
check(REGION_ASSET_KITS.find(({ id }) => id === "graven_march")?.reference === "concept_graven_march_black_pine_occlusion_basin", "Graven March must resolve its accepted regional keyframe");
check(WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_graven_march_black_pine_occlusion_basin")?.runtimeBackdrop === true, "Graven March keyframe must declare its legacy runtime use");
check(REGION_ASSET_KITS.find(({ id }) => id === "hollow_abbey")?.reference === "concept_hollow_abbey_nave", "Cathedral quest art must not replace Hollow Abbey's regional keyframe");
check(WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_cathedral_six_rehearsed_dawns")?.referenceScope === "quest_location", "Cathedral art must remain quest-location direction");
check(WORLD_CONCEPT_ASSETS.find(({ id }) => id === "concept_cathedral_six_rehearsed_dawns")?.runtimeIntegrated === false, "Cathedral direction must not claim runtime integration");

const migration = migrateSave({
  version: 1,
  character: DEFAULT_CHARACTER,
  player: { x: WORLD.map.startingPosition.x, y: WORLD.map.startingPosition.y },
  skills: { swordsmanship: xpForLevel(20) },
  inventory: {},
  quests: {},
  enemies: [],
});
check(migration.ok && migration.migrated, `Version-1 save migration failed: ${migration.errors.join(", ")}`);
check(migration.save?.version === SAVE_SCHEMA_VERSION, "Save migration did not advance schema version");
check(migration.save?.enemies.length === ENCOUNTER_SPAWNS.length, "Save migration did not reconcile encounter spawns");
check(Boolean(migration.save?.worldEvents?.objectiveLedger && migration.save?.progression?.purchasedNodes), "Save migration omitted new persistent systems");
check(["hp", "maxHp", "stamina", "maxStamina", "focus", "maxFocus", "mend"].every((field) => Number.isFinite(migration.save?.player?.[field])), "Minimal legacy save did not receive runtime-required player resources");
check(migration.save?.playSeconds === 0, "Minimal legacy save did not receive a finite runtime clock");
check(migration.save?.progression?.awardedTechniqueLevels?.swordsmanship?.length === 4 && migration.save?.progression?.techniquePoints?.swordsmanship === 5, "Save migration did not restore earned technique points");
check(evaluateTechniquePurchase(migration.save.progression, migration.save.skills, "swordsmanship.quiet_edge").allowed, "A level-qualified root technique was rejected");
check(purchaseTechniqueInState(migration.save.progression, migration.save.skills, "swordsmanship.quiet_edge").purchased, "Technique state transaction failed");
check(migration.save.progression.techniquePoints.swordsmanship === 4, "Technique purchase did not deduct its cost");
check(evaluateTechniquePurchase(migration.save.progression, migration.save.skills, "swordsmanship.death_between_beats").code === "missing_prerequisite", "Technique prerequisite gate failed");
const identityOnlyMigration = migrateSave({ version: 1, character: { name: "Orphan" }, player: {}, skills: {}, inventory: {}, quests: {}, enemies: [] });
check(identityOnlyMigration.ok && identityOnlyMigration.save.character.name === "Orphan" && validateCharacter(identityOnlyMigration.save.character).valid && Number.isFinite(identityOnlyMigration.save.character.attributes.endurance), "Identity-only legacy character did not receive a complete creator contract");
const capstoneProgression = structuredClone(migration.save.progression);
capstoneProgression.techniquePoints.swordsmanship = 99;
capstoneProgression.purchasedNodes.swordsmanship = SKILL_TREES.swordsmanship.nodes.slice(0, 11).filter((node) => !node.id.endsWith("reaver_vow")).map(({ id }) => id);
check(evaluateTechniquePurchase(capstoneProgression, { ...migration.save.skills, swordsmanship: xpForLevel(99) }, "swordsmanship.unanswered_cut").code === "mastery_gate", "Capstone mastery gate failed");

const malformed = structuredClone(migration.save);
malformed.version = SAVE_SCHEMA_VERSION;
malformed.progression.purchasedNodes.swordsmanship = "not-an-array";
malformed.progression.techniquePoints.swordsmanship = -10;
malformed.progression.restedCharges = -999;
malformed.progression.masteryStates.swordsmanship = "complete-ish";
malformed.progression.actionMastery.swordsmanship = { "swordsmanship.mixed_chain": "broken", invented: { uses: 999 } };
malformed.progression.repetition.swordsmanship = [{ actionId: "invented", at: 12 }, { actionId: "swordsmanship.mixed_chain", at: "yesterday" }];
malformed.player.hp = "broken";
malformed.player.maxHp = -40;
malformed.player.x = 999;
malformed.player.y = -20;
malformed.playSeconds = "not-a-clock";
malformed.player.afflictions = { fire: 32, frost: -8, broken: "not-a-count" };
malformed.respawn = { x: -10, y: 999 };
malformed.quests.main_embers_at_dusk.status = "nonsense";
malformed.quests.main_embers_at_dusk.progress = [-9, 999, Number.NaN];
malformed.worldEvents.choices.lastBell = "impossible_third_ending";
malformed.worldEvents.uniqueDefeats = [];
malformed.enemies.find(({ defId }) => defId === "kiln_knight_rusk").dead = true;
malformed.enemies.find(({ defId }) => defId === "kiln_knight_rusk").intentMoveId = "invented_move";
const repaired = migrateSave(malformed);
check(repaired.ok && Array.isArray(repaired.save.progression.purchasedNodes.swordsmanship), "Malformed purchased-node state was not repaired");
check(repaired.save.progression.techniquePoints.swordsmanship === 0 && repaired.save.progression.restedCharges === 0, "Malformed progression balances were not clamped");
check(repaired.save.progression.masteryStates.swordsmanship.completed === false, "Malformed mastery state was trusted");
check(Object.keys(repaired.save.progression.actionMastery.swordsmanship).length === 0 && repaired.save.progression.repetition.swordsmanship.length === 0, "Malformed nested action progression was not repaired");
check(repaired.save.player.maxHp > 0 && repaired.save.player.hp === repaired.save.player.maxHp, "Malformed player resources were not repaired");
check(repaired.save.player.x === WORLD.map.startingPosition.x && repaired.save.player.y === WORLD.map.startingPosition.y && repaired.save.respawn.x === WORLD.map.startingPosition.x, "Out-of-bounds player or respawn was trusted");
check(repaired.save.playSeconds === 0, "Malformed runtime clock was trusted");
check(repaired.save.quests.main_embers_at_dusk.status === "active" && repaired.save.quests.main_embers_at_dusk.progress.every((value, index) => value >= 0 && value <= QUESTS[0].objectives[index].required), "Malformed quest state was not repaired");
check(!("lastBell" in repaired.save.worldEvents.choices), "Invalid Last Bell choice was trusted");
check(repaired.save.enemies.find(({ defId }) => defId === "kiln_knight_rusk").dead === false, "Dead unique boss without defeat ledger was trusted");
check(repaired.save.enemies.find(({ defId }) => defId === "kiln_knight_rusk").intentMoveId === null, "Unknown enemy intent move was trusted");
check(repaired.save.player.afflictions.fire === 32 && !("frost" in repaired.save.player.afflictions) && !("broken" in repaired.save.player.afflictions), "Malformed affliction buildup was not normalized");
const brokenOuterProgression = structuredClone(migration.save);
brokenOuterProgression.progression = "broken";
const repairedOuterProgression = migrateSave(brokenOuterProgression);
check(repairedOuterProgression.ok && Array.isArray(repairedOuterProgression.save.progression.purchasedNodes.swordsmanship), "Malformed outer progression container was not repaired");
const illegalLowLevelProgression = structuredClone(migration.save);
illegalLowLevelProgression.version = SAVE_SCHEMA_VERSION;
illegalLowLevelProgression.skills.swordsmanship = 0;
illegalLowLevelProgression.progression.purchasedNodes.swordsmanship = SKILL_TREES.swordsmanship.nodes.map(({ id }) => id);
illegalLowLevelProgression.progression.awardedTechniqueLevels.swordsmanship = [...SKILL_TREES.swordsmanship.techniquePointRules.earnedAtLevels];
illegalLowLevelProgression.progression.techniquePoints.swordsmanship = 99;
illegalLowLevelProgression.progression.milestoneStates.swordsmanship = Object.fromEntries(SKILL_TREES.swordsmanship.milestoneChallenges.map(({ id }) => [id, { completed: true }]));
illegalLowLevelProgression.progression.masteryStates.swordsmanship = { completed: true, completedAt: Date.now() };
const repairedLowLevelProgression = migrateSave(illegalLowLevelProgression);
check(repairedLowLevelProgression.ok && repairedLowLevelProgression.save.progression.purchasedNodes.swordsmanship.length === 1 && repairedLowLevelProgression.save.progression.purchasedNodes.swordsmanship[0] === "swordsmanship.quiet_edge", "Migration retained over-level or over-budget techniques");
check(repairedLowLevelProgression.save.progression.awardedTechniqueLevels.swordsmanship.length === 0 && repairedLowLevelProgression.save.progression.masteryStates.swordsmanship.completed === false, "Migration trusted forged awards or mastery");

const legacyUniqueDefeat = structuredClone(migration.save);
legacyUniqueDefeat.version = 2;
legacyUniqueDefeat.worldEvents.enemyDefeats.kiln_knight_rusk = 1;
legacyUniqueDefeat.worldEvents.uniqueDefeats = ["kiln_knight_rusk"];
delete legacyUniqueDefeat.worldEvents.objectiveLedger;
delete legacyUniqueDefeat.inventory.cinder_seal;
legacyUniqueDefeat.quests.main_the_cinder_seal.status = "active";
legacyUniqueDefeat.quests.main_the_cinder_seal.progress = [0, 0, 0, 0];
legacyUniqueDefeat.enemies.find(({ defId }) => defId === "kiln_knight_rusk").dead = true;
legacyUniqueDefeat.enemies.find(({ defId }) => defId === "kiln_knight_rusk").x = 999;
const repairedLegacyDefeat = migrateSave(legacyUniqueDefeat);
const repairedCinderState = repairedLegacyDefeat.save.quests.main_the_cinder_seal;
check(repairedLegacyDefeat.ok && repairedLegacyDefeat.save.worldEvents.objectiveLedger.defeat.kiln_knight_rusk === 1, "Legacy unique defeat was not backfilled into the objective ledger");
check(repairedLegacyDefeat.save.inventory.cinder_seal === 1 && repairedCinderState.progress[2] === 1 && repairedCinderState.progress[3] === 1, "Legacy Rusk defeat did not restore quest-critical seal progress");
check(repairedLegacyDefeat.save.enemies.find(({ defId }) => defId === "kiln_knight_rusk").x !== 999, "Migrated unique enemy retained an invalid world position");

const trappedBehindGate = structuredClone(migration.save);
trappedBehindGate.version = 2;
trappedBehindGate.worldEvents.gates = { hollow_abbey_open: false };
trappedBehindGate.player.x = 28; trappedBehindGate.player.y = 20;
trappedBehindGate.respawn = { x: 28, y: 20 };
const repairedGateTrap = migrateSave(trappedBehindGate);
check(repairedGateTrap.ok && repairedGateTrap.save.player.x === WORLD.map.startingPosition.x && repairedGateTrap.save.player.y === WORLD.map.startingPosition.y, "Migration retained a player behind the closed Abbey gate");
check(repairedGateTrap.save.respawn.x === WORLD.map.startingPosition.x && repairedGateTrap.save.respawn.y === WORLD.map.startingPosition.y, "Migration retained an inaccessible respawn behind the closed Abbey gate");

const forgedEnding = structuredClone(migration.save);
forgedEnding.version = SAVE_SCHEMA_VERSION;
forgedEnding.worldEvents.choices.lastBell = "remember";
forgedEnding.worldEvents.uniqueDefeats = [];
forgedEnding.worldEvents.objectiveLedger.defeat.cantor_oss = 0;
const forgedFinalQuest = QUESTS.find(({ id }) => id === "main_a_litany_unspoken");
forgedEnding.quests.main_a_litany_unspoken = { status: "locked", progress: forgedFinalQuest.objectives.map(() => 0) };
const repairedEnding = migrateSave(forgedEnding);
check(!("lastBell" in repairedEnding.save.worldEvents.choices), "Migration retained an impossible but enum-valid Last Bell ending");

const actionProgression = createProgressionState();
actionProgression.restedCharges = 0;
const actionAwards = Array.from({ length: 7 }, (_, index) => awardSkillAction(actionProgression, { skillId: "swordsmanship", actionId: "swordsmanship.mixed_chain", difficultyRatio: 1, timing: 1, quality: 1, restedEligible: false, now: 1_000 + index }));
check(actionAwards.every(({ awarded }) => awarded) && actionAwards.at(-1).xp < actionAwards[0].xp, "Registered skill action did not apply repetition decay");
check(awardSkillAction(actionProgression, { skillId: "swordsmanship", actionId: "swordsmanship.mixed_chain", difficultyRatio: 0.1 }).code === "trivial_contribution", "Skill action contribution gate failed");
const restedProgression = createProgressionState();
const restedAward = awardSkillAction(restedProgression, { skillId: "mining", actionId: "mining.clean_strike", difficultyRatio: 1, timing: 1, quality: 1 });
check(restedAward.awarded && restedAward.multipliers.rested === 1.5 && restedProgression.restedCharges === 5 && restedProgression.actionMastery.mining["mining.clean_strike"].uses === 1, "Rested charge or action mastery was not applied atomically");
const defensiveProgression = createProgressionState();
defensiveProgression.actionMastery.swordsmanship["swordsmanship.mixed_chain"] = "broken";
check(awardSkillAction(defensiveProgression, { skillId: "swordsmanship", actionId: "swordsmanship.mixed_chain", difficultyRatio: 1, timing: 1, quality: 1 }).awarded && defensiveProgression.actionMastery.swordsmanship["swordsmanship.mixed_chain"].uses === 1, "Action reducer did not defensively replace malformed nested mastery state");
check(awardSkillAction(defensiveProgression, { skillId: "swordsmanship", actionId: "swordsmanship.mixed_chain", difficultyRatio: Number.NaN }).code === "invalid_context", "Action reducer accepted a non-finite context");

const retroactiveEvents = createWorldEvents();
recordWorldObjective(retroactiveEvents, "talk", "orik_senn", 1);
recordWorldObjective(retroactiveEvents, "defeat", "kiln_thrall", 3);
recordWorldObjective(retroactiveEvents, "defeat", "kiln_knight_rusk", 1);
const cinderQuest = QUESTS.find(({ id }) => id === "main_the_cinder_seal");
const retroactiveState = { status: "active", progress: cinderQuest.objectives.map(() => 0) };
hydrateQuestFromLedger(cinderQuest, retroactiveState, retroactiveEvents, { cinder_seal: 1 }, []);
check(retroactiveState.progress.every((value, index) => value === cinderQuest.objectives[index].required), "Retroactive event hydration did not prevent the Cinder Seal quest softlock");
check(!canOpenHollowAbbey({}, []) && canOpenHollowAbbey({}, ["kiln_knight_rusk"]) && canOpenHollowAbbey({ cinder_seal: 1 }, []), "Hollow Abbey gate rule is inconsistent");
const finalQuest = QUESTS.find(({ id }) => id === "main_a_litany_unspoken");
const finalReadyState = { status: "active", progress: finalQuest.objectives.map((objective, index) => index < 4 ? objective.required : 0) };
check(canResolveLastBell(finalQuest, finalReadyState, { objectiveLedger: { defeat: { cantor_oss: 1 } }, uniqueDefeats: [] }), "Completed final-quest route did not unlock the Last Bell choice");
check(!canResolveLastBell(finalQuest, { status: "locked", progress: finalReadyState.progress }, { objectiveLedger: { defeat: { cantor_oss: 1 } }, uniqueDefeats: [] }), "Locked final quest exposed the Last Bell choice");
check(!canResolveLastBell(finalQuest, { status: "active", progress: [1, 5, 1, 0, 0] }, { objectiveLedger: { defeat: {} }, uniqueDefeats: [] }), "Living Cantor exposed the Last Bell choice");
check(lastBellOutcome("remember")?.stat === "focus" && lastBellOutcome("release")?.stat === "stamina" && lastBellOutcome("invalid") === null, "Last Bell choice rules are invalid");
const guaranteedLoot = rollLoot([{ itemId: "guaranteed", chance: 1, quantity: [2, 4] }], () => 0.99);
check(guaranteedLoot.length === 1 && guaranteedLoot[0].quantity === 4, "Guaranteed or ranged loot roll failed");
check(rollLoot([{ itemId: "never", chance: 0, quantity: [1, 1] }], () => 0.5).length === 0, "Zero-chance loot was granted");
check(rollLoot([{ itemId: "never", chance: 0, quantity: [1, 1] }], () => 0).length === 0, "Zero-chance loot was granted at the RNG boundary");
const upperBoundaryLoot = rollLoot([{ itemId: "always", chance: 1, quantity: [1, 1] }], () => 1);
check(upperBoundaryLoot.length === 1 && upperBoundaryLoot[0].quantity === 1, "Guaranteed loot failed at the RNG or quantity boundary");
const ruskLoot = ENEMY_REGISTRY.kiln_knight_rusk.lootTable;
check(ruskLoot.some(({ itemId, chance }) => itemId === "cinder_seal" && chance === 1), "Kiln Knight Rusk does not guarantee the quest seal");
for (const spawn of ENCOUNTER_SPAWNS) check(ENEMY_REGISTRY[spawn.enemyId].lootTable.every(({ itemId }) => ITEM_REGISTRY[itemId].contentStatus === "integrated"), `Spawn ${spawn.id} grants planned loot`);

const itemIds = new Set(ITEMS.map(({ id }) => id));
const skillIds = new Set(SKILLS.map(({ id }) => id));
const recipeIds = new Set(RECIPES.map(({ id }) => id));
const npcIds = new Set(NPCS.map(({ id }) => id));
const enemyIds = new Set(ENEMIES.map(({ id }) => id));
const landmarkIds = new Set(WORLD.landmarks.map(({ id }) => id));
RECIPES.forEach((recipe) => {
  check(skillIds.has(recipe.skillId), `Recipe ${recipe.id} references missing skill ${recipe.skillId}`);
  [...recipe.ingredients, ...recipe.outputs].forEach(({ itemId }) => check(itemIds.has(itemId), `Recipe ${recipe.id} references missing item ${itemId}`));
});
GATHER_NODES.forEach((node) => check(skillIds.has(node.skill) || node.skill === "excavation", `Node ${node.id} references missing skill ${node.skill}`));

for (const quest of QUESTS) {
  check(npcIds.has(quest.giverNpcId), `Quest ${quest.id} has a missing giver`);
  quest.objectives.forEach((objective) => {
    if (objective.type === "talk") check(npcIds.has(objective.target), `Quest ${quest.id} has missing talk target ${objective.target}`);
    if (objective.type === "defeat") check(enemyIds.has(objective.target), `Quest ${quest.id} has missing enemy ${objective.target}`);
    if (["discover", "interact"].includes(objective.type)) check(landmarkIds.has(objective.target), `Quest ${quest.id} has missing landmark ${objective.target}`);
    if (objective.type === "craft") check(recipeIds.has(objective.target), `Quest ${quest.id} has missing recipe ${objective.target}`);
  });
}

const result = {
  skills: SKILLS.length,
  items: ITEMS.length,
  resources: RESOURCES.length,
  recipes: RECIPES.length,
  regions: WORLD.regions.length,
  quests: QUESTS.length,
  enemies: BESTIARY.length,
  enemyFamilies: ENEMY_FAMILIES.length,
  characters: CHARACTERS.length,
  factions: FACTIONS.length,
  techniques: Object.values(SKILL_TREES).flatMap(({ nodes }) => nodes).length,
  skillActions: Object.values(SKILL_ACTIONS).flat().length,
  encounterSpawns: ENCOUNTER_SPAWNS.length,
  encounterGroups: ENCOUNTERS.length,
  worldConcepts: WORLD_CONCEPT_ASSETS.length,
  worldTechnicalReferences: WORLD_TECHNICAL_ASSETS.length,
  worldSpatialBlockouts: WORLD_SPATIAL_BLOCKOUT_ASSETS.length,
  characterRenders: CHARACTER_RENDER_ASSETS.length,
  contentGraph: graph.summary,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
