import { ITEMS, SKILLS } from "./skills.js";
import { ORIGINS } from "./character.js";
import { WORLD, NPCS as LEGACY_NPCS, ENEMIES as LEGACY_ENEMIES, GATHER_NODES } from "./world.js";
import { QUESTS } from "./quests.js";
import { BESTIARY } from "./bestiary.js";
import { CHARACTERS } from "./characters.js";

const freezeMap = (entries) => Object.freeze(Object.fromEntries(entries));
const title = (id) => id.split("_").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");

export const SKILL_ALIASES = Object.freeze({
  combat: "swordsmanship", lightBlades: "swordsmanship", dueling: "swordsmanship",
  heavyArms: "heavy_arms", maces: "heavy_arms", archery: "marksmanship",
  warding: "runecrafting", rites: "hexcraft", divination: "hexcraft", attunement: "hexcraft",
  firstAid: "vitality", endurance: "vitality", herbalism: "foraging",
  trapping: "hunting", tracking: "hunting", wayfinding: "wayfaring", exploration: "wayfaring",
  survival: "wayfaring", campcraft: "cooking", skulduggery: "wayfaring", bargaining: "wayfaring",
  rhetoric: "wayfaring", lore: "runecrafting", masonry: "mining", empathy: "wayfaring",
});

const skillIds = new Set(SKILLS.map(({ id }) => id));
export const resolveSkillId = (id) => skillIds.has(id) ? id : SKILL_ALIASES[id] || null;

export const REGION_DEFINITIONS = Object.freeze([
  ...WORLD.regions.map((region) => Object.freeze({ ...region, schemaVersion: 2, contentStatus: "integrated" })),
  Object.freeze({ id: "salt_waste_frontier", name: "The Mirror-Salt Waste", schemaVersion: 2, contentStatus: "planned", levelRange: [23, 34], bounds: null, ambience: "White storms erase direction while sealed mirrors preserve a second horizon." }),
  Object.freeze({ id: "veil_coast_frontier", name: "The Veil Coast", schemaVersion: 2, contentStatus: "planned", levelRange: [26, 38], bounds: null, ambience: "Moonless tides carry black-coral kin inland along a current no chart records." }),
]);
export const REGION_REGISTRY = freezeMap(REGION_DEFINITIONS.map((entry) => [entry.id, entry]));

const allEquipmentIds = ORIGINS.flatMap(({ equipment }) => Object.values(equipment || {}).flat());
const referencedItemIds = new Set([
  ...LEGACY_ENEMIES.flatMap(({ drops = [] }) => drops),
  ...BESTIARY.flatMap(({ drops = [] }) => drops.map(({ itemId }) => itemId)),
  ...GATHER_NODES.map(({ resourceId }) => resourceId),
  ...QUESTS.flatMap(({ rewards }) => (rewards.items || []).map(({ id }) => id)),
  ...QUESTS.flatMap(({ objectives }) => objectives.filter(({ type }) => type === "acquire").map(({ target }) => target)),
  ...allEquipmentIds,
]);

const authoredItems = ITEMS.map((item) => ({ ...item, source: "economy", contentStatus: "integrated" }));
const authoredIds = new Set(authoredItems.map(({ id }) => id));
const integratedSupplementalIds = new Set([
  ...LEGACY_ENEMIES.flatMap(({ drops = [] }) => drops),
  ...GATHER_NODES.map(({ resourceId }) => resourceId),
  ...QUESTS.flatMap(({ rewards }) => (rewards.items || []).map(({ id }) => id)),
  ...QUESTS.flatMap(({ objectives }) => objectives.filter(({ type }) => type === "acquire").map(({ target }) => target)),
  ...allEquipmentIds,
]);
export const SUPPLEMENTAL_ITEMS = Object.freeze([...referencedItemIds]
  .filter((id) => !authoredIds.has(id))
  .sort()
  .map((id) => Object.freeze({
    id,
    name: title(id),
    icon: id.includes("ore") || id.includes("iron") ? "◆" : id.includes("moss") || id.includes("reed") || id.includes("herb") ? "❧" : id.includes("blade") || id.includes("sword") || id.includes("knife") ? "†" : "◇",
    type: allEquipmentIds.includes(id) ? "origin_equipment" : "content_material",
    tier: 1,
    value: 0,
    stackable: !allEquipmentIds.includes(id),
    description: `Authored content item referenced by ${title(id)} records; economy tuning is pending.`,
    source: "content_reference",
    contentStatus: integratedSupplementalIds.has(id) ? "integrated" : "planned",
  })));

export const ITEM_REGISTRY = freezeMap([...authoredItems, ...SUPPLEMENTAL_ITEMS].map((item) => [item.id, Object.freeze(item)]));

const roleStyle = Object.freeze({
  bruiser: "melee", skirmisher: "mobile_melee", controller: "area_control", artillery: "ranged_pressure",
  ambusher: "ambush", support: "support", duelist: "counter_melee", swarm: "mobile_melee",
  hunter: "mobile_melee", juggernaut: "armored_melee",
});
const legacyEnemyMap = new Map(LEGACY_ENEMIES.map((entry) => [entry.id, entry]));
const rankHealth = { regular: 1, specialist: 1.12, elite: 1.45, miniboss: 2.2, boss: 4.5 };
const rankDamage = { regular: 1, specialist: 1.08, elite: 1.22, miniboss: 1.45, boss: 1.7 };
const RUNTIME_LOOT_OVERRIDES = Object.freeze({
  ledger_crawler: [{ itemId: "memory_ash", chance: 0.42, quantity: [1, 1], source: "runtime_override" }],
  wax_seal_archer: [{ itemId: "field_arrows", chance: 0.68, quantity: [2, 5], source: "runtime_override" }, { itemId: "bone_shard", chance: 0.18, quantity: [1, 1], source: "runtime_override" }],
  sealed_sapper: [{ itemId: "rust_ore", chance: 0.62, quantity: [1, 2], source: "runtime_override" }, { itemId: "spark_sigil", chance: 0.08, quantity: [1, 1], source: "runtime_override" }],
  bog_charm_tender: [{ itemId: "witch_reed", chance: 0.62, quantity: [1, 2], source: "runtime_override" }, { itemId: "pale_salt", chance: 0.2, quantity: [1, 1], source: "runtime_override" }],
});

export const ENEMY_DEFINITIONS = Object.freeze(BESTIARY.map((entry) => {
  const legacy = legacyEnemyMap.get(entry.id);
  const level = entry.levelRange[0];
  const frontier = entry.regions.some((regionId) => REGION_REGISTRY[regionId]?.contentStatus === "planned");
  const regionalCap = Math.max(...entry.regions.map((regionId) => REGION_REGISTRY[regionId]?.levelRange?.[1] || 0));
  const availability = frontier ? "planned_frontier" : entry.levelRange[0] > regionalCap ? "revisit_encounter" : entry.levelRange[1] > regionalCap ? "first_clear_with_revisit_tail" : "first_clear_pool";
  const canonicalLoot = entry.drops.filter(({ itemId }) => ITEM_REGISTRY[itemId]?.contentStatus === "integrated").map((row) => ({ ...row, source: "bestiary" }));
  const legacyLoot = (legacy?.drops || []).map((itemId, index) => ({ itemId, chance: entry.boss ? (index === 0 ? 1 : 0.65) : index === 0 ? 0.68 : 0.14, quantity: [1, 1], source: "legacy_runtime" }));
  const mergedLoot = new Map([...canonicalLoot, ...legacyLoot, ...(RUNTIME_LOOT_OVERRIDES[entry.id] || [])].map((row) => [row.itemId, row]));
  return Object.freeze({
    ...entry,
    schemaVersion: 2,
    availability,
    regionIds: entry.regions,
    combatStyle: legacy?.combatStyle || roleStyle[entry.combatRole],
    behavior: entry.behaviorPhases.map(({ behavior }) => behavior).join(" "),
    weaknesses: entry.weaknessTags,
    resistances: entry.resistanceTags,
    dropItemIds: Object.freeze([...new Set([...(legacy?.drops || []), ...entry.drops.map(({ itemId }) => itemId)])]),
    lootTable: Object.freeze([...mergedLoot.values()].map((row) => Object.freeze({ ...row, quantity: Object.freeze([...row.quantity]) }))),
    runtime: Object.freeze({
      maxHealth: Math.round((34 + level * 5) * (rankHealth[entry.rank] || 1)),
      poise: Math.round((12 + level * 1.8) * (entry.rank === "boss" ? 2.2 : entry.rank === "elite" ? 1.45 : 1)),
      movementSpeed: entry.combatRole === "skirmisher" || entry.combatRole === "hunter" ? 1.25 : entry.combatRole === "juggernaut" ? 0.68 : 0.86,
      perceptionRadius: entry.combatRole === "artillery" ? 7 : entry.combatRole === "ambusher" ? 3.8 : 5,
      leashRadius: entry.boss ? 10 : 7,
      attackRange: entry.combatRole === "artillery" ? 5.5 : entry.combatRole === "controller" ? 3.4 : 1.15,
      damage: Math.round((5 + level * 0.8) * (rankDamage[entry.rank] || 1)),
    }),
  });
}));

export const ENEMY_REGISTRY = freezeMap(ENEMY_DEFINITIONS.map((entry) => [entry.id, entry]));
export const getEnemyDefinition = (id) => ENEMY_REGISTRY[id] || null;

const placementMap = new Map(LEGACY_NPCS.map((entry) => [entry.id, entry]));
export const CHARACTER_DEFINITIONS = Object.freeze(CHARACTERS.map((character) => {
  const placed = placementMap.get(character.id);
  return Object.freeze({
    ...character,
    schemaVersion: 2,
    title: placed?.title || character.role,
    regionId: character.region,
    position: placed?.position || null,
    services: placed?.services || [],
    description: placed?.description || `${character.role}. ${character.motivations[0]}`,
    placed: Boolean(placed?.position),
  });
}));

export const CHARACTER_REGISTRY = freezeMap(CHARACTER_DEFINITIONS.map((entry) => [entry.id, entry]));
export const PLACED_CHARACTERS = Object.freeze(CHARACTER_DEFINITIONS.filter(({ placed }) => placed));
export const getCharacterDefinition = (id) => CHARACTER_REGISTRY[id] || null;
export const getItemDefinition = (id) => ITEM_REGISTRY[id] || null;

export function validateRegistries() {
  const errors = [];
  for (const legacy of LEGACY_ENEMIES) if (!ENEMY_REGISTRY[legacy.id]) errors.push(`Legacy enemy ${legacy.id} has no canonical bestiary entry`);
  for (const legacy of LEGACY_NPCS) if (!CHARACTER_REGISTRY[legacy.id]) errors.push(`Placed NPC ${legacy.id} has no canonical character entry`);
  for (const enemy of ENEMY_DEFINITIONS) {
    for (const itemId of enemy.dropItemIds) if (!ITEM_REGISTRY[itemId]) errors.push(`Enemy ${enemy.id} has unresolved drop ${itemId}`);
    for (const row of enemy.lootTable) {
      if (!ITEM_REGISTRY[row.itemId]) errors.push(`Enemy ${enemy.id} has unresolved runtime loot ${row.itemId}`);
      if (!(row.chance >= 0 && row.chance <= 1) || !Array.isArray(row.quantity) || row.quantity.length !== 2) errors.push(`Enemy ${enemy.id} has malformed runtime loot ${row.itemId}`);
    }
  }
  for (const origin of ORIGINS) {
    for (const skillId of Object.keys(origin.skillBonuses || {})) if (!resolveSkillId(skillId)) errors.push(`Origin ${origin.id} has unresolved skill ${skillId}`);
    for (const itemId of Object.values(origin.equipment || {}).flat()) if (!ITEM_REGISTRY[itemId]) errors.push(`Origin ${origin.id} has unresolved item ${itemId}`);
  }
  for (const quest of QUESTS) {
    for (const skillId of Object.keys(quest.rewards.skillXp || {})) if (!resolveSkillId(skillId)) errors.push(`Quest ${quest.id} has unresolved skill ${skillId}`);
    for (const item of quest.rewards.items || []) if (!ITEM_REGISTRY[item.id]) errors.push(`Quest ${quest.id} has unresolved reward ${item.id}`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), summary: Object.freeze({ enemies: ENEMY_DEFINITIONS.length, characters: CHARACTER_DEFINITIONS.length, placedCharacters: PLACED_CHARACTERS.length, items: Object.keys(ITEM_REGISTRY).length }) });
}
