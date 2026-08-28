import { SKILLS, RESOURCES, RECIPES } from "./skills.js";
import { ORIGINS } from "./character.js";
import { WORLD, MAP_ROWS, NPCS, GATHER_NODES, regionAtPosition } from "./world.js";
import { QUESTS } from "./quests.js";
import { BESTIARY, validateBestiary } from "./bestiary.js";
import { CHARACTERS, CHARACTER_RELATIONSHIPS, validateCharacters } from "./characters.js";
import { SKILL_TREES, SKILL_ACTIONS, validateSkillTrees } from "./skillTrees.js";
import { WORLD_CONCEPT_ASSETS, REGION_ASSET_KITS, validateWorldAssets } from "./worldAssets.js";
import { ENCOUNTERS, ENCOUNTER_SPAWNS, validateEncounterSpawns, validateEncounterGroups } from "./encounters.js";
import { ITEM_REGISTRY, ENEMY_REGISTRY, CHARACTER_REGISTRY, REGION_REGISTRY, resolveSkillId, validateRegistries } from "./registries.js";

export const CONTENT_GRAPH_VERSION = 2;

export const CONTENT_CAPABILITIES = Object.freeze([
  { system: "Character creator", authored: true, validated: true, integrated: true, playtested: true },
  { system: "Enemy roster", authored: true, validated: true, integrated: "codex_all_placed_subset", playtested: "codex_and_legacy_subset" },
  { system: "Enemy typed moves", authored: true, validated: true, integrated: "direct_status_buildup_movement_support_phase_affinity_subset", playtested: "pure_rules_and_smoke" },
  { system: "Character and faction roster", authored: true, validated: true, integrated: "codex_all_placed_subset", playtested: "codex_and_legacy_subset" },
  { system: "Skill trees", authored: true, validated: true, integrated: "ui_and_six_effect_hooks", playtested: "starter_effect_and_purchase_rules" },
  { system: "Skill action XP engine", authored: true, validated: true, integrated: "combat_gather_craft_wayfaring_subset", playtested: "repetition_rested_contribution_unit" },
  { system: "Gathering and crafting", authored: true, validated: true, integrated: "vertical_slice", playtested: "smoke_subset" },
  { system: "Quest chain", authored: true, validated: true, integrated: "runtime_rules_no_full_journey", playtested: "opening_smoke_and_pure_rules" },
  { system: "Encounter compositions", authored: true, validated: true, integrated: false, playtested: "geometry_and_ownership_unit" },
  { system: "Structured loot", authored: true, validated: true, integrated: "placed_enemies", playtested: "probability_boundaries_unit" },
  { system: "World concepts and kits", authored: true, validated: true, integrated: "atlas_only", playtested: "browser_smoke" },
  { system: "Frontier regions", authored: "hooks_only", validated: true, integrated: false, playtested: false },
]);

const tileWalkable = (x, y) => Boolean(WORLD.tileLegend[MAP_ROWS[y]?.[x]]?.walkable);

export function validatePermanentInteractionLayout(npcs = NPCS, nodes = GATHER_NODES, landmarks = WORLD.landmarks, regionResolver = regionAtPosition) {
  const errors = [];
  const permanentByTile = new Map();
  for (const [type, records] of [["npc", npcs], ["node", nodes], ["landmark", landmarks]]) {
    for (const record of records) {
      const key = `${record.position.x},${record.position.y}`;
      if (permanentByTile.has(key)) errors.push(`Permanent interaction collision at ${key}: ${permanentByTile.get(key)} and ${type}:${record.id}`);
      else permanentByTile.set(key, `${type}:${record.id}`);
    }
  }
  for (const npc of npcs) if (regionResolver(npc.position.x, npc.position.y).id !== npc.regionId) errors.push(`NPC ${npc.id} resolves outside declared region ${npc.regionId}`);
  for (const landmark of landmarks) if (regionResolver(landmark.position.x, landmark.position.y).id !== landmark.regionId) errors.push(`Landmark ${landmark.id} resolves outside declared region ${landmark.regionId}`);
  return { valid: errors.length === 0, errors };
}

export function validateContentGraph() {
  const errors = [];
  const add = (message) => errors.push(message);
  const absorb = (name, result) => { for (const error of result.errors || []) add(`${name}: ${typeof error === "string" ? error : error.message || JSON.stringify(error)}`); };
  absorb("bestiary", validateBestiary());
  absorb("characters", validateCharacters());
  absorb("skillTrees", validateSkillTrees());
  absorb("worldAssets", validateWorldAssets());
  absorb("registries", validateRegistries());
  absorb("encounters", validateEncounterSpawns(ENEMY_REGISTRY, tileWalkable, regionAtPosition));
  absorb("encounterGroups", validateEncounterGroups());
  absorb("interactions", validatePermanentInteractionLayout());

  const questIds = new Set(QUESTS.map(({ id }) => id));
  const landmarkIds = new Set(WORLD.landmarks.map(({ id }) => id));
  const recipeIds = new Set(RECIPES.map(({ id }) => id));
  const skillIds = new Set(SKILLS.map(({ id }) => id));
  for (const quest of QUESTS) {
    if (!CHARACTER_REGISTRY[quest.giverNpcId]) add(`Quest ${quest.id} has unknown giver ${quest.giverNpcId}`);
    for (const prerequisite of quest.prerequisites) if (!questIds.has(prerequisite)) add(`Quest ${quest.id} has unknown prerequisite ${prerequisite}`);
    for (const objective of quest.objectives) {
      if (objective.type === "talk" && !CHARACTER_REGISTRY[objective.target]) add(`Quest ${quest.id} has unknown character target ${objective.target}`);
      if (objective.type === "defeat" && !ENEMY_REGISTRY[objective.target]) add(`Quest ${quest.id} has unknown enemy target ${objective.target}`);
      if (["discover", "interact"].includes(objective.type) && !landmarkIds.has(objective.target)) add(`Quest ${quest.id} has unknown landmark target ${objective.target}`);
      if (objective.type === "craft" && !recipeIds.has(objective.target)) add(`Quest ${quest.id} has unknown recipe target ${objective.target}`);
      if (objective.type === "acquire" && !ITEM_REGISTRY[objective.target]) add(`Quest ${quest.id} has unknown item target ${objective.target}`);
    }
  }

  for (const resource of RESOURCES) {
    if (!skillIds.has(resource.skillId)) add(`Resource ${resource.id} has unknown skill ${resource.skillId}`);
    if (!ITEM_REGISTRY[resource.itemId]) add(`Resource ${resource.id} has unknown item ${resource.itemId}`);
  }
  for (const node of GATHER_NODES) if (!ITEM_REGISTRY[node.resourceId]) add(`Placed node ${node.id} has unknown output ${node.resourceId}`);
  for (const recipe of RECIPES) {
    if (!resolveSkillId(recipe.skillId)) add(`Recipe ${recipe.id} has unknown skill ${recipe.skillId}`);
    for (const part of [...recipe.ingredients, ...recipe.outputs]) if (!ITEM_REGISTRY[part.itemId]) add(`Recipe ${recipe.id} has unknown item ${part.itemId}`);
  }
  for (const origin of ORIGINS) for (const rawSkillId of Object.keys(origin.skillBonuses || {})) if (!resolveSkillId(rawSkillId)) add(`Origin ${origin.id} has unknown skill ${rawSkillId}`);
  for (const enemy of BESTIARY) {
    for (const regionId of enemy.regions) if (!REGION_REGISTRY[regionId]) add(`Enemy ${enemy.id} has unknown region ${regionId}`);
    for (const drop of enemy.drops) if (!ITEM_REGISTRY[drop.itemId]) add(`Enemy ${enemy.id} has unknown drop ${drop.itemId}`);
  }
  for (const character of CHARACTERS) if (!REGION_REGISTRY[character.region]) add(`Character ${character.id} has unknown region ${character.region}`);
  for (const edge of CHARACTER_RELATIONSHIPS) if (!CHARACTER_REGISTRY[edge.sourceId] || !CHARACTER_REGISTRY[edge.targetId]) add(`Relationship ${edge.id} has missing endpoint`);
  for (const [skillId, tree] of Object.entries(SKILL_TREES)) {
    if (!skillIds.has(skillId)) add(`Tree ${skillId} has no base skill`);
    if (!SKILL_ACTIONS[skillId]?.length) add(`Tree ${skillId} has no actions`);
    for (const node of tree.nodes) if (!node.effects.every(({ hook }) => typeof hook === "string" && hook.includes("."))) add(`Technique ${node.id} has malformed hook`);
  }
  for (const concept of WORLD_CONCEPT_ASSETS) if (!REGION_REGISTRY[concept.regionId]) add(`Concept ${concept.id} has unknown region`);
  for (const kit of REGION_ASSET_KITS) if (!REGION_REGISTRY[kit.id]) add(`Asset kit ${kit.id} has unknown region`);
  for (const spawn of ENCOUNTER_SPAWNS) {
    const enemy = ENEMY_REGISTRY[spawn.enemyId];
    if (!enemy) { add(`Spawn ${spawn.id} has unknown enemy`); continue; }
    if (!enemy.lootTable.length) add(`Spawn ${spawn.id} has no runtime loot`);
    for (const row of enemy.lootTable) if (ITEM_REGISTRY[row.itemId]?.contentStatus !== "integrated") add(`Spawn ${spawn.id} can grant planned item ${row.itemId}`);
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    summary: Object.freeze({
      regions: Object.keys(REGION_REGISTRY).length,
      enemies: Object.keys(ENEMY_REGISTRY).length,
      encounterSpawns: ENCOUNTER_SPAWNS.length,
      encounterGroups: ENCOUNTERS.length,
      characters: Object.keys(CHARACTER_REGISTRY).length,
      items: Object.keys(ITEM_REGISTRY).length,
      skills: SKILLS.length,
      techniques: Object.values(SKILL_TREES).reduce((sum, tree) => sum + tree.nodes.length, 0),
      actions: Object.values(SKILL_ACTIONS).reduce((sum, actions) => sum + actions.length, 0),
      quests: QUESTS.length,
    }),
  });
}
