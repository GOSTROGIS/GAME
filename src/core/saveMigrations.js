import { SKILLS, levelFromXp } from "../data/skills.js";
import { QUESTS } from "../data/quests.js";
import { ENCOUNTER_SPAWNS } from "../data/encounters.js";
import { getEnemyDefinition } from "../data/registries.js";
import { SKILL_TREES, SKILL_ACTIONS } from "../data/skillTrees.js";
import { WORLD, MAP_ROWS } from "../data/world.js";
import { STORY_STATE_DEFAULTS } from "../data/characters.js";
import { DEFAULT_CHARACTER, validateCharacter } from "../data/character.js";

export const SAVE_SCHEMA_VERSION = 3;
export const CONTENT_REVISION = 3;

export const createProgressionState = () => ({
  techniquePoints: Object.fromEntries(SKILLS.map(({ id }) => [id, id === "swordsmanship" ? 1 : 0])),
  awardedTechniqueLevels: Object.fromEntries(SKILLS.map(({ id }) => [id, []])),
  purchasedNodes: Object.fromEntries(SKILLS.map(({ id }) => [id, []])),
  milestoneStates: Object.fromEntries(SKILLS.map(({ id }) => [id, {}])),
  actionMastery: Object.fromEntries(SKILLS.map(({ id }) => [id, {}])),
  repetition: Object.fromEntries(SKILLS.map(({ id }) => [id, []])),
  masteryStates: Object.fromEntries(SKILLS.map(({ id }) => [id, { completed: false, completedAt: null }])),
  restedCharges: 6,
});

export const createWorldEvents = () => ({
  enemyDefeats: {},
  gathered: {},
  interactions: {},
  conversations: {},
  gates: { hollow_abbey_open: false },
  choices: {},
  storyFlags: { ...STORY_STATE_DEFAULTS },
  objectiveLedger: { talk: {}, gather: {}, interact: {}, defeat: {}, discover: {}, acquire: {}, craft: {} },
  uniqueDefeats: [],
});

export function createEnemyState(spawn) {
  const def = getEnemyDefinition(spawn.enemyId);
  if (!def) throw new Error(`Unknown encounter enemy ${spawn.enemyId}`);
  return {
    uid: spawn.id,
    spawnId: spawn.id,
    defId: def.id,
    x: spawn.position.x,
    y: spawn.position.y,
    homeX: spawn.position.x,
    homeY: spawn.position.y,
    level: def.levelRange[0],
    hp: def.runtime.maxHealth,
    maxHp: def.runtime.maxHealth,
    cooldown: 0,
    dead: false,
    respawnAt: 0,
    hitFlash: 0,
    intent: 0,
    intentMoveId: null,
    unique: Boolean(spawn.unique || def.boss),
  };
}

const questDefault = (quest, index) => ({
  status: index === 0 ? "active" : quest.prerequisites.length === 0 ? "available" : "locked",
  progress: quest.objectives.map(() => 0),
});

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const positiveOr = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const countMap = (value) => isRecord(value) ? Object.fromEntries(Object.entries(value).filter(([, count]) => Number.isFinite(Number(count)) && Number(count) >= 0).map(([id, count]) => [id, Number(count)])) : {};
const validWorldPosition = (position) => {
  if (!isRecord(position) || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return false;
  const x = Math.round(position.x); const y = Math.round(position.y);
  return x >= 0 && y >= 0 && x < WORLD.map.width && y < WORLD.map.height && Boolean(WORLD.tileLegend[MAP_ROWS[y]?.[x]]?.walkable);
};
const validAccessiblePlayerPosition = (position, gates) => validWorldPosition(position) && (gates?.hollow_abbey_open === true || !(Math.round(position.x) >= 24 && Math.round(position.y) >= 13));

export function migrateSave(input) {
  if (!isRecord(input)) return { ok: false, errors: ["Save root is not an object"], save: null, migrated: false };
  let save;
  try { save = JSON.parse(JSON.stringify(input)); }
  catch { return { ok: false, errors: ["Save is not serializable"], save: null, migrated: false }; }
  const sourceVersion = Number(save.version || 1);
  if (sourceVersion > SAVE_SCHEMA_VERSION) return { ok: false, errors: [`Save version ${sourceVersion} is newer than supported version ${SAVE_SCHEMA_VERSION}`], save: null, migrated: false };

  save.version = SAVE_SCHEMA_VERSION;
  save.contentRevision = CONTENT_REVISION;
  const rawCharacter = isRecord(save.character) ? save.character : {};
  const defaultCharacter = JSON.parse(JSON.stringify(DEFAULT_CHARACTER));
  const candidateCharacter = {
    ...defaultCharacter,
    ...rawCharacter,
    schemaVersion: DEFAULT_CHARACTER.schemaVersion,
    appearance: {
      ...defaultCharacter.appearance,
      ...(isRecord(rawCharacter.appearance) ? rawCharacter.appearance : {}),
      morphs: { ...defaultCharacter.appearance.morphs, ...(isRecord(rawCharacter.appearance?.morphs) ? rawCharacter.appearance.morphs : {}) },
    },
    attributes: { ...defaultCharacter.attributes, ...(isRecord(rawCharacter.attributes) ? rawCharacter.attributes : {}) },
  };
  if (validateCharacter(candidateCharacter).valid) save.character = candidateCharacter;
  else {
    const preservedName = typeof rawCharacter.name === "string" ? rawCharacter.name.trim() : "";
    const namedDefault = { ...defaultCharacter, name: preservedName };
    save.character = validateCharacter(namedDefault).valid ? namedDefault : defaultCharacter;
  }
  save.skills = isRecord(save.skills) ? save.skills : {};
  for (const skill of SKILLS) if (!Number.isFinite(save.skills[skill.id])) save.skills[skill.id] = 0;
  const lackedProgression = !isRecord(save.progression);
  save.progression = isRecord(save.progression) ? save.progression : createProgressionState();
  const progressionDefaults = createProgressionState();
  const lackedAwardLedger = lackedProgression || !save.progression.awardedTechniqueLevels;
  for (const field of ["techniquePoints", "awardedTechniqueLevels", "purchasedNodes", "milestoneStates", "actionMastery", "repetition", "masteryStates"]) {
    save.progression[field] = isRecord(save.progression[field]) ? save.progression[field] : {};
    for (const skill of SKILLS) if (save.progression[field][skill.id] == null) save.progression[field][skill.id] = progressionDefaults[field][skill.id];
  }
  for (const skill of SKILLS) {
    const skillId = skill.id;
    const tree = SKILL_TREES[skillId];
    const rawPoints = Number(save.progression.techniquePoints[skillId]);
    save.progression.techniquePoints[skillId] = Number.isFinite(rawPoints) ? Math.max(0, Math.min(99, Math.floor(rawPoints))) : progressionDefaults.techniquePoints[skillId];

    const rawMastery = save.progression.masteryStates[skillId];
    const currentSkillLevel = levelFromXp(save.skills[skillId] || 0);
    save.progression.masteryStates[skillId] = {
      completed: Boolean(rawMastery && typeof rawMastery === "object" && rawMastery.completed === true && currentSkillLevel >= 90),
      completedAt: rawMastery && typeof rawMastery === "object" && Number.isFinite(rawMastery.completedAt) ? rawMastery.completedAt : null,
    };

    const rawPurchased = Array.isArray(save.progression.purchasedNodes[skillId]) ? [...new Set(save.progression.purchasedNodes[skillId].filter((id) => typeof id === "string"))] : [];
    const accepted = [];
    for (const node of tree.nodes) {
      if (!rawPurchased.includes(node.id)) continue;
      if (!node.prerequisites.every((id) => accepted.includes(id))) continue;
      if (node.excludes.some((id) => accepted.includes(id))) continue;
      if (node.levelRequired > currentSkillLevel) continue;
      if (node.capstone && !save.progression.masteryStates[skillId].completed) continue;
      accepted.push(node.id);
    }
    save.progression.purchasedNodes[skillId] = accepted;

    const rawAwards = Array.isArray(save.progression.awardedTechniqueLevels[skillId]) ? save.progression.awardedTechniqueLevels[skillId] : [];
    const validThresholds = tree.techniquePointRules.earnedAtLevels;
    save.progression.awardedTechniqueLevels[skillId] = [...new Set(rawAwards.filter((value) => Number.isInteger(value) && validThresholds.includes(value) && value <= currentSkillLevel))].sort((a, b) => a - b);
    if (sourceVersion < 3 && (lackedAwardLedger || !Array.isArray(rawAwards))) {
      const earned = validThresholds.filter((threshold) => threshold <= levelFromXp(save.skills[skillId] || 0) && !save.progression.awardedTechniqueLevels[skillId].includes(threshold));
      save.progression.awardedTechniqueLevels[skillId].push(...earned);
      save.progression.techniquePoints[skillId] = Math.min(99, save.progression.techniquePoints[skillId] + earned.length);
    }

    const rawMilestones = isRecord(save.progression.milestoneStates[skillId]) ? save.progression.milestoneStates[skillId] : {};
    save.progression.milestoneStates[skillId] = Object.fromEntries(tree.milestoneChallenges.filter((milestone) => currentSkillLevel >= milestone.levelRequired && (rawMilestones[milestone.id] === true || rawMilestones[milestone.id]?.completed === true)).map((milestone) => [milestone.id, { completed: true, awarded: true }]));
    if (save.progression.masteryStates[skillId].completed && Object.keys(save.progression.milestoneStates[skillId]).length < tree.milestoneChallenges.length) save.progression.masteryStates[skillId] = { completed: false, completedAt: null };
    const illegalCapstoneIndex = accepted.findIndex((nodeId) => tree.nodes.find((node) => node.id === nodeId)?.capstone && !save.progression.masteryStates[skillId].completed);
    if (illegalCapstoneIndex >= 0) accepted.splice(illegalCapstoneIndex, 1);
    const knownActionIds = new Set(SKILL_ACTIONS[skillId].map(({ id }) => id));
    const rawActionMastery = isRecord(save.progression.actionMastery[skillId]) ? save.progression.actionMastery[skillId] : {};
    save.progression.actionMastery[skillId] = Object.fromEntries(Object.entries(rawActionMastery).filter(([actionId, state]) => knownActionIds.has(actionId) && isRecord(state)).map(([actionId, state]) => {
      const uses = Math.max(0, Math.floor(finiteOr(state.uses, 0)));
      return [actionId, {
        uses,
        totalXp: Math.max(0, Math.floor(finiteOr(state.totalXp, 0))),
        perfects: Math.min(uses, Math.max(0, Math.floor(finiteOr(state.perfects, 0)))),
        lastAt: Number.isFinite(state.lastAt) && state.lastAt >= 0 ? state.lastAt : null,
      }];
    }));
    save.progression.repetition[skillId] = Array.isArray(save.progression.repetition[skillId]) ? save.progression.repetition[skillId].filter((entry) => isRecord(entry) && knownActionIds.has(entry.actionId) && Number.isFinite(entry.at) && entry.at >= 0).map((entry) => ({ actionId: entry.actionId, at: entry.at })).slice(-64) : [];
    const milestoneBudget = tree.milestoneChallenges.filter((milestone) => save.progression.milestoneStates[skillId][milestone.id]?.awarded).reduce((sum, milestone) => sum + milestone.reward.techniquePoints, 0);
    const totalBudget = (skillId === "swordsmanship" ? 1 : 0) + save.progression.awardedTechniqueLevels[skillId].length + milestoneBudget + (save.progression.masteryStates[skillId].completed ? 3 : 0);
    let spent = accepted.reduce((sum, nodeId) => sum + tree.nodes.find((node) => node.id === nodeId).cost, 0);
    while (spent > totalBudget && accepted.length) {
      const removed = accepted.pop(); spent -= tree.nodes.find((node) => node.id === removed).cost;
    }
    save.progression.purchasedNodes[skillId] = accepted;
    save.progression.techniquePoints[skillId] = Math.min(save.progression.techniquePoints[skillId], Math.max(0, totalBudget - spent));
  }
  const rawRested = Number(save.progression.restedCharges);
  save.progression.restedCharges = Number.isFinite(rawRested) ? Math.max(0, Math.min(144, Math.floor(rawRested))) : progressionDefaults.restedCharges;

  save.worldEvents = isRecord(save.worldEvents) ? save.worldEvents : createWorldEvents();
  const eventDefaults = createWorldEvents();
  for (const field of ["enemyDefeats", "gathered", "interactions", "conversations"]) save.worldEvents[field] = countMap(save.worldEvents[field]);
  save.worldEvents.gates = isRecord(save.worldEvents.gates) ? { hollow_abbey_open: save.worldEvents.gates.hollow_abbey_open === true } : eventDefaults.gates;
  save.worldEvents.choices = isRecord(save.worldEvents.choices) ? save.worldEvents.choices : {};
  if (!["remember", "release"].includes(save.worldEvents.choices.lastBell)) delete save.worldEvents.choices.lastBell;
  save.worldEvents.storyFlags = isRecord(save.worldEvents.storyFlags) ? { ...STORY_STATE_DEFAULTS, ...save.worldEvents.storyFlags } : { ...STORY_STATE_DEFAULTS };
  save.worldEvents.objectiveLedger = isRecord(save.worldEvents.objectiveLedger) ? save.worldEvents.objectiveLedger : eventDefaults.objectiveLedger;
  for (const type of Object.keys(eventDefaults.objectiveLedger)) save.worldEvents.objectiveLedger[type] = countMap(save.worldEvents.objectiveLedger[type]);
  save.worldEvents.uniqueDefeats = Array.isArray(save.worldEvents.uniqueDefeats) ? [...new Set(save.worldEvents.uniqueDefeats.filter((id) => typeof id === "string"))] : [];
  for (const [legacyField, objectiveType] of [["enemyDefeats", "defeat"], ["gathered", "gather"], ["interactions", "interact"], ["conversations", "talk"]]) {
    for (const [target, count] of Object.entries(save.worldEvents[legacyField])) save.worldEvents.objectiveLedger[objectiveType][target] = Math.max(save.worldEvents.objectiveLedger[objectiveType][target] || 0, count);
  }
  for (const enemyId of save.worldEvents.uniqueDefeats) save.worldEvents.objectiveLedger.defeat[enemyId] = Math.max(1, save.worldEvents.objectiveLedger.defeat[enemyId] || 0);

  save.quests = isRecord(save.quests) ? save.quests : {};
  const validQuestStatuses = new Set(["locked", "available", "active", "ready", "completed", "failed"]);
  QUESTS.forEach((quest, index) => {
    save.quests[quest.id] = isRecord(save.quests[quest.id]) ? save.quests[quest.id] : questDefault(quest, index);
    const state = save.quests[quest.id];
    state.progress = quest.objectives.map((objective, objectiveIndex) => Math.max(0, Math.min(objective.required, finiteOr(Array.isArray(state.progress) ? state.progress[objectiveIndex] : 0, 0))));
    if (!validQuestStatuses.has(state.status)) state.status = questDefault(quest, index).status;
  });
  if (!QUESTS.some(({ id }) => id === save.trackedQuest)) save.trackedQuest = QUESTS[0].id;

  const existingBySpawn = new Map((Array.isArray(save.enemies) ? save.enemies : []).filter(isRecord).map((enemy) => [enemy.spawnId || enemy.uid, enemy]));
  save.enemies = ENCOUNTER_SPAWNS.map((spawn) => {
    const fresh = createEnemyState(spawn);
    const existing = existingBySpawn.get(spawn.id);
    if (!existing) return fresh;
    const merged = { ...fresh, ...existing, uid: spawn.id, spawnId: spawn.id, defId: spawn.enemyId, homeX: fresh.homeX, homeY: fresh.homeY, maxHp: fresh.maxHp, level: fresh.level, unique: fresh.unique };
    merged.x = finiteOr(merged.x, fresh.x); merged.y = finiteOr(merged.y, fresh.y);
    if (!validWorldPosition(merged)) { merged.x = fresh.x; merged.y = fresh.y; }
    merged.hp = Math.max(0, Math.min(merged.maxHp, finiteOr(merged.hp, fresh.hp)));
    merged.cooldown = Math.max(0, finiteOr(merged.cooldown, 0));
    merged.hitFlash = Math.max(0, finiteOr(merged.hitFlash, 0));
    merged.intent = Math.max(0, finiteOr(merged.intent, 0));
    merged.intentMoveId = typeof merged.intentMoveId === "string" && getEnemyDefinition(merged.defId).moves.some((move) => move.id === merged.intentMoveId) ? merged.intentMoveId : null;
    merged.dead = merged.dead === true;
    if (!Number.isFinite(merged.respawnAt) || sourceVersion < 2) merged.respawnAt = 0;
    if (merged.unique) {
      if (save.worldEvents.uniqueDefeats.includes(merged.defId)) merged.dead = true;
      else if (merged.dead) { merged.dead = false; merged.hp = merged.maxHp; merged.respawnAt = 0; }
    }
    return merged;
  });

  save.inventory = isRecord(save.inventory) ? Object.fromEntries(Object.entries(save.inventory).filter(([, quantity]) => Number.isFinite(Number(quantity)) && Number(quantity) >= 0).map(([id, quantity]) => [id, Number(quantity)])) : {};
  save.discovered = Array.isArray(save.discovered) ? [...new Set(save.discovered.filter((id) => typeof id === "string"))] : [];
  if (save.worldEvents.uniqueDefeats.includes("kiln_knight_rusk")) {
    save.inventory.cinder_seal = Math.max(1, save.inventory.cinder_seal || 0);
    save.worldEvents.objectiveLedger.acquire.cinder_seal = Math.max(1, save.worldEvents.objectiveLedger.acquire.cinder_seal || 0);
  }
  for (const quest of QUESTS) {
    const state = save.quests[quest.id];
    quest.objectives.forEach((objective, index) => {
      const ledgerValue = save.worldEvents.objectiveLedger[objective.type]?.[objective.target] || 0;
      const inferred = objective.type === "acquire" ? save.inventory[objective.target] || 0 : objective.type === "discover" && save.discovered.includes(objective.target) ? 1 : 0;
      state.progress[index] = Math.min(objective.required, Math.max(state.progress[index] || 0, ledgerValue, inferred));
    });
    if (["active", "available"].includes(state.status) && state.progress.every((value, index) => value >= quest.objectives[index].required)) state.status = "ready";
  }
  if (save.worldEvents.choices.lastBell) {
    const finalQuest = QUESTS.find(({ id }) => id === "main_a_litany_unspoken");
    const finalState = save.quests[finalQuest.id];
    const cantorDefeated = (save.worldEvents.objectiveLedger.defeat.cantor_oss || 0) >= 1 || save.worldEvents.uniqueDefeats.includes("cantor_oss");
    const endingEarned = ["ready", "completed"].includes(finalState.status) && finalState.progress.every((value, index) => value >= finalQuest.objectives[index].required) && cantorDefeated;
    if (!endingEarned) delete save.worldEvents.choices.lastBell;
  }
  save.gathered = isRecord(save.gathered) ? Object.fromEntries(Object.entries(save.gathered).filter(([, deadline]) => Number.isFinite(Number(deadline)) && Number(deadline) >= 0).map(([id, deadline]) => [id, Number(deadline)])) : {};
  save.player = isRecord(save.player) ? save.player : {};
  const attributes = isRecord(save.character?.attributes) ? save.character.attributes : {};
  const playerDefaults = {
    x: WORLD.map.startingPosition.x, y: WORLD.map.startingPosition.y,
    maxHp: 78 + finiteOr(attributes.vigor, 5) * 6,
    maxStamina: 62 + finiteOr(attributes.endurance, 5) * 5,
    maxFocus: 45 + finiteOr(attributes.attunement, 5) * 5,
  };
  save.player.x = finiteOr(save.player.x, playerDefaults.x); save.player.y = finiteOr(save.player.y, playerDefaults.y);
  if (!validAccessiblePlayerPosition(save.player, save.worldEvents.gates)) { save.player.x = playerDefaults.x; save.player.y = playerDefaults.y; }
  save.player.maxHp = positiveOr(save.player.maxHp, playerDefaults.maxHp);
  save.player.maxStamina = positiveOr(save.player.maxStamina, playerDefaults.maxStamina);
  save.player.maxFocus = positiveOr(save.player.maxFocus, playerDefaults.maxFocus);
  save.player.hp = Math.max(0, Math.min(save.player.maxHp, finiteOr(save.player.hp, save.player.maxHp)));
  save.player.stamina = Math.max(0, Math.min(save.player.maxStamina, finiteOr(save.player.stamina, save.player.maxStamina)));
  save.player.focus = Math.max(0, Math.min(save.player.maxFocus, finiteOr(save.player.focus, save.player.maxFocus)));
  save.player.mend = Math.max(0, Math.min(3, Math.floor(finiteOr(save.player.mend, 3))));
  save.player.sableMarks = Math.max(0, Math.floor(finiteOr(save.player.sableMarks, save.inventory.sable_marks || 0)));
  save.player.attackCooldown = Math.max(0, finiteOr(save.player.attackCooldown, 0));
  save.player.dodgeCooldown = Math.max(0, finiteOr(save.player.dodgeCooldown, 0));
  save.player.invulnerable = Math.max(0, finiteOr(save.player.invulnerable, 0));
  save.player.lantern = save.player.lantern !== false;
  save.player.afflictions = countMap(save.player.afflictions);
  save.player.facing = finiteOr(save.player.facing, 1) < 0 ? -1 : 1;
  save.player.path = [];
  save.playSeconds = Math.max(0, finiteOr(save.playSeconds, 0));
  save.respawn = validAccessiblePlayerPosition(save.respawn, save.worldEvents.gates) ? save.respawn : { x: playerDefaults.x, y: playerDefaults.y };
  const errors = validateSaveShape(save);
  return { ok: errors.length === 0, errors, save, migrated: sourceVersion !== SAVE_SCHEMA_VERSION || Number(input.contentRevision || 0) !== CONTENT_REVISION };
}

export function validateSaveShape(save) {
  const errors = [];
  if (save.version !== SAVE_SCHEMA_VERSION) errors.push("Unsupported save version");
  if (!save.character?.name) errors.push("Missing character identity");
  if (!save.player || !Number.isFinite(save.player.x) || !Number.isFinite(save.player.y)) errors.push("Invalid player position");
  for (const field of ["hp", "maxHp", "stamina", "maxStamina", "focus", "maxFocus", "mend", "sableMarks"]) if (!Number.isFinite(save.player?.[field]) || save.player[field] < 0) errors.push(`Invalid player ${field}`);
  if (save.player?.hp > save.player?.maxHp || save.player?.stamina > save.player?.maxStamina || save.player?.focus > save.player?.maxFocus) errors.push("Player resources exceed maxima");
  if (!save.progression?.purchasedNodes || !save.worldEvents?.enemyDefeats) errors.push("Missing progression or world-event state");
  for (const skill of SKILLS) {
    if (!Array.isArray(save.progression?.purchasedNodes?.[skill.id])) errors.push(`Invalid purchased techniques for ${skill.id}`);
    if (!Array.isArray(save.progression?.awardedTechniqueLevels?.[skill.id])) errors.push(`Invalid technique award ledger for ${skill.id}`);
    if (!Number.isInteger(save.progression?.techniquePoints?.[skill.id]) || save.progression.techniquePoints[skill.id] < 0) errors.push(`Invalid technique points for ${skill.id}`);
    if (!save.progression?.masteryStates?.[skill.id] || typeof save.progression.masteryStates[skill.id].completed !== "boolean") errors.push(`Invalid mastery state for ${skill.id}`);
  }
  const validQuestStatuses = new Set(["locked", "available", "active", "ready", "completed", "failed"]);
  for (const quest of QUESTS) {
    const state = save.quests?.[quest.id];
    if (!state) { errors.push(`Missing quest state ${quest.id}`); continue; }
    if (!validQuestStatuses.has(state.status)) errors.push(`Invalid quest status ${quest.id}`);
    if (!Array.isArray(state.progress) || state.progress.length !== quest.objectives.length || state.progress.some((value, index) => !Number.isFinite(value) || value < 0 || value > quest.objectives[index].required)) errors.push(`Invalid quest progress ${quest.id}`);
  }
  if (!Array.isArray(save.enemies) || save.enemies.length !== ENCOUNTER_SPAWNS.length) errors.push("Invalid encounter state");
  return errors;
}
