import {
  encounterOutcomeLockKey,
  canonicalTurnBody,
  decideCommandReplay,
  recordEncounterOutcomeInTransaction,
  sortedPersistenceLockKeys,
  turnCharacterLockKey,
  turnCommandLockKey,
  type DurableValue,
  type TurnPersistenceAdapter,
} from "../persistence/turn-store.js";
import { isServerSaveV6, type SaveRecord, type SaveValue, type ServerSaveV6 } from "@hollow-march/shared";
import { TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID, TURN_QUEST_SETTLEMENT_DEFINITIONS } from "@hearthmere/content/turn-combat";
import type { TurnResolvedRewards, TurnSettlementCharacterInput, TurnSettlementInput } from "./turnEncounterManager.js";

export interface CharacterSettlementResult {
  encounterId: string;
  characterId: string;
  outcome: "victory" | "defeat" | "aborted";
  rewardsAllowed: boolean;
  rewardEligible: boolean;
  latestEventSequence: number;
  finalVitals: TurnSettlementCharacterInput["finalVitals"];
  finalTransform: TurnSettlementCharacterInput["finalTransform"];
  finalItemCharges: Readonly<Record<string, number>>;
  rewards: TurnResolvedRewards;
}

/**
 * Durable exactly-once settlement. Outcome ledger, final consumable/resource
 * state, loot/XP/quest/progression rewards, save_v6, and audit are one DB-only
 * transaction; victory cannot publish before it commits.
 */
export class TurnEncounterSettlementService {
  constructor(private readonly persistence: TurnPersistenceAdapter, private readonly clock: () => Date = () => new Date()) {}

  async settle(input: TurnSettlementInput): Promise<void> {
    const committedAt = this.clock().toISOString();
    const prepared = input.characters.map((character) => {
      const characterId = character.characterId;
      const result: CharacterSettlementResult = {
        encounterId: input.encounterId,
        characterId,
        outcome: input.outcome,
        rewardsAllowed: input.rewardsAllowed,
        rewardEligible: character.rewardEligible,
        latestEventSequence: input.latestEventSequence,
        finalVitals: character.finalVitals,
        finalTransform: character.finalTransform,
        finalItemCharges: character.finalItemCharges,
        rewards: character.rewards,
      };
      const durableResult = JSON.parse(canonicalTurnBody(result)) as DurableValue;
      return { character, characterId, durableResult, canonicalBody: canonicalTurnBody(durableResult), commandId: `settle.${input.encounterId}` };
    });
    const lockKeys = sortedPersistenceLockKeys(prepared.flatMap(({ characterId, commandId }) => [
      turnCommandLockKey(characterId, commandId),
      encounterOutcomeLockKey(characterId, input.encounterId),
      turnCharacterLockKey(characterId),
    ]));
    await this.persistence.transaction(lockKeys, async (transaction) => {
      const executions: typeof prepared = [];
      for (const entry of prepared) {
        const existing = await transaction.findCommand(entry.characterId, entry.commandId);
        const replay = decideCommandReplay(existing, entry.canonicalBody);
        if (replay === "conflict") throw new Error("idempotency_conflict");
        if (replay === "execute") executions.push(entry);
      }
      for (const { character, characterId, durableResult, canonicalBody, commandId } of executions) {
        const outcome = await recordEncounterOutcomeInTransaction(transaction, {
          characterId,
          encounterId: input.encounterId,
          result: durableResult,
          committedAt,
        });
        if (outcome.status === "encounter_outcome_conflict") throw new Error("encounter_outcome_conflict");
        if (outcome.status === "replayed") throw new Error("settlement_ledger_incomplete");
        const lockedSave = await transaction.readCharacterSaveForUpdate(characterId) ?? character.baseSave;
        if (!lockedSave) throw new Error(`missing_durable_character_save:${characterId}`);
        const settled = settleSave(lockedSave, character, committedAt);
        const finalSave = settled.save;
        await transaction.writeCharacterSave(characterId, finalSave);
        await transaction.insertAuditEvent({
          accountId: finalSave.identity.accountId,
          kind: "character.turn_encounter_settled",
          subjectId: characterId,
          detail: {
            encounterId: input.encounterId,
            outcome: input.outcome,
            rewardsAllowed: input.rewardsAllowed,
            rewardEligible: character.rewardEligible,
            rewards: JSON.parse(canonicalTurnBody(character.rewards)) as DurableValue,
            completedQuests: [...settled.completedQuestIds],
            questCompletionRewards: JSON.parse(canonicalTurnBody(settled.questCompletionRewards)) as DurableValue,
          },
        });
        await transaction.insertCommand({ characterId, commandId, canonicalBody, result: durableResult, committedAt });
      }
    });
  }
}

function addCounters(source: SaveRecord, increments: Readonly<Record<string, number>>): SaveRecord {
  const result = structuredClone(source);
  for (const [id, increment] of Object.entries(increments)) {
    if (!Number.isSafeInteger(increment) || increment < 0) throw new Error(`invalid settlement increment ${id}`);
    const previous = result[id];
    if (previous !== undefined && (typeof previous !== "number" || !Number.isSafeInteger(previous) || previous < 0)) throw new Error(`settlement counter ${id} is not numeric`);
    result[id] = ((previous as number | undefined) ?? 0) + increment;
  }
  return result;
}

interface QuestSettlementResult {
  readonly quests: SaveRecord;
  readonly completedQuestIds: readonly string[];
  readonly inventoryRewards: Readonly<Record<string, number>>;
  readonly skillXpRewards: Readonly<Record<string, number>>;
  readonly featureUnlocks: readonly string[];
  /** Undefined means settlement did not change chain tracking; null means the chain completed. */
  readonly trackedQuestId: string | null | undefined;
}

function objectiveLedgerValue(worldEvents: SaveRecord, type: string, target: string): number {
  const objectiveLedger = worldEvents.objectiveLedger;
  if (objectiveLedger === undefined) return 0;
  if (objectiveLedger === null || typeof objectiveLedger !== "object" || Array.isArray(objectiveLedger)) throw new Error("worldEvents.objectiveLedger is not an object");
  const bucket = (objectiveLedger as Record<string, SaveValue>)[type];
  if (bucket === undefined) return 0;
  if (bucket === null || typeof bucket !== "object" || Array.isArray(bucket)) throw new Error(`worldEvents.objectiveLedger.${type} is not an object`);
  const value = (bucket as Record<string, SaveValue>)[target] ?? 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`worldEvents.objectiveLedger.${type}.${target} is not a counter`);
  return value;
}

function inventoryObjectiveValue(inventory: SaveRecord, itemId: string): number {
  const value = inventory[itemId] ?? 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`inventory.${itemId} is not a counter`);
  return value;
}

function questProgress(
  questId: string,
  state: Record<string, unknown>,
  objectiveCount: number,
): number[] {
  const rawProgress = state.progress;
  if (!Array.isArray(rawProgress)) throw new Error(`quest ${questId} progress is not an array`);
  return Array.from({ length: objectiveCount }, (_, index) => {
    const value = rawProgress[index] ?? 0;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`quest ${questId} objective ${index} is not numeric`);
    return value;
  });
}

function applyQuestObjectiveCounters(
  source: SaveRecord,
  increments: Readonly<Record<string, number>>,
  worldEvents: SaveRecord,
  postEncounterInventory: SaveRecord,
  discoveries: readonly string[],
): QuestSettlementResult {
  const result = structuredClone(source);
  const completedQuestIds: string[] = [];
  let questTrackingChanged = false;

  // Direct objective deltas preserve compatibility with non-ledger objectives.
  // Defeat/discovery/acquire progress is subsequently hydrated from canonical
  // post-encounter state, so these deltas are never applied twice.
  for (const [key, increment] of Object.entries(increments)) {
    const match = /^(.*)\.objective\.(\d+)$/.exec(key);
    if (!match || !Number.isSafeInteger(increment) || increment < 0) throw new Error(`invalid quest objective increment ${key}`);
    const questId = match[1]!; const objectiveIndex = Number(match[2]);
    const definition = TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.get(questId);
    if (!definition || objectiveIndex >= definition.objectives.length) throw new Error(`quest objective ${key} has no canonical settlement definition`);
    const state = result[questId];
    if (!state || typeof state !== "object" || Array.isArray(state)) continue;
    const record = state as Record<string, unknown>;
    if (record.status !== "active") continue;
    const progress = questProgress(questId, record, definition.objectives.length);
    progress[objectiveIndex] = Math.min(definition.objectives[objectiveIndex]!.required, progress[objectiveIndex]! + increment);
    result[questId] = { ...(state as Record<string, DurableValue>), progress };
  }

  const inventoryRewards: Record<string, number> = {};
  const skillXpRewards: Record<string, number> = {};
  const featureUnlocks = new Set<string>();
  let workingInventory = structuredClone(postEncounterInventory);
  const chains = [...new Set(TURN_QUEST_SETTLEMENT_DEFINITIONS.map(({ chain }) => chain))].sort();

  // Completion, reward, unlock, activation, and hydration form one bounded
  // fixed point. This is what lets kills recorded before (or during) the
  // unlocking encounter immediately count for the newly active quest.
  for (let pass = 0; pass <= TURN_QUEST_SETTLEMENT_DEFINITIONS.length * 3; pass += 1) {
    let changed = false;
    for (const definition of [...TURN_QUEST_SETTLEMENT_DEFINITIONS].sort((left, right) => left.order - right.order || left.questId.localeCompare(right.questId))) {
      const state = result[definition.questId];
      if (!state || typeof state !== "object" || Array.isArray(state)) continue;
      const record = state as Record<string, unknown>;
      if (record.status !== "active") continue;
      const progress = questProgress(definition.questId, record, definition.objectives.length);
      const hydrated = definition.objectives.map((objective, index) => {
        const ledger = objectiveLedgerValue(worldEvents, objective.type, objective.target);
        const inferred = objective.type === "acquire"
          ? inventoryObjectiveValue(workingInventory, objective.target)
          : objective.type === "discover" && discoveries.includes(objective.target) ? 1 : 0;
        return Math.min(objective.required, Math.max(progress[index]!, ledger, inferred));
      });
      if (hydrated.some((value, index) => value !== progress[index])) {
        result[definition.questId] = { ...(state as Record<string, DurableValue>), progress: hydrated };
        changed = true;
      }
      if (!definition.objectives.every((objective, index) => hydrated[index]! >= objective.required)) continue;
      result[definition.questId] = { ...(result[definition.questId] as Record<string, DurableValue>), status: "completed", progress: hydrated };
      completedQuestIds.push(definition.questId);
      questTrackingChanged = true;
      changed = true;
      for (const [itemId, amount] of Object.entries(definition.rewards.inventory)) {
        inventoryRewards[itemId] = (inventoryRewards[itemId] ?? 0) + amount;
        workingInventory = addCounters(workingInventory, { [itemId]: amount });
      }
      for (const [skillId, amount] of Object.entries(definition.rewards.skillXp)) skillXpRewards[skillId] = (skillXpRewards[skillId] ?? 0) + amount;
      for (const unlockId of definition.rewards.unlocks) if (!TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.has(unlockId)) featureUnlocks.add(unlockId);
    }

    for (const definition of TURN_QUEST_SETTLEMENT_DEFINITIONS) {
      const state = result[definition.questId];
      if (!state || typeof state !== "object" || Array.isArray(state) || (state as Record<string, unknown>).status !== "locked") continue;
      const prerequisitesComplete = definition.prerequisites.every((questId) => {
        const prerequisite = result[questId];
        return prerequisite !== null && typeof prerequisite === "object" && !Array.isArray(prerequisite) && (prerequisite as Record<string, unknown>).status === "completed";
      });
      if (prerequisitesComplete) {
        result[definition.questId] = { ...(state as Record<string, DurableValue>), status: "available" };
        changed = true;
      }
    }

    for (const chain of chains) {
      const definitions = TURN_QUEST_SETTLEMENT_DEFINITIONS.filter((definition) => definition.chain === chain)
        .sort((left, right) => left.order - right.order || left.questId.localeCompare(right.questId));
      const hasActive = definitions.some(({ questId }) => {
        const state = result[questId];
        return state !== null && typeof state === "object" && !Array.isArray(state) && (state as Record<string, unknown>).status === "active";
      });
      if (hasActive) continue;
      const next = definitions.find(({ questId }) => {
        const state = result[questId];
        return state !== null && typeof state === "object" && !Array.isArray(state) && (state as Record<string, unknown>).status === "available";
      });
      if (!next) continue;
      result[next.questId] = { ...(result[next.questId] as Record<string, DurableValue>), status: "active" };
      questTrackingChanged = true;
      changed = true;
    }
    if (!changed) break;
    if (pass === TURN_QUEST_SETTLEMENT_DEFINITIONS.length * 3) throw new Error("quest settlement fixed point did not converge");
  }

  const trackedQuestId = questTrackingChanged
    ? TURN_QUEST_SETTLEMENT_DEFINITIONS
      .filter(({ questId }) => {
        const state = result[questId];
        return state !== null && typeof state === "object" && !Array.isArray(state) && (state as Record<string, unknown>).status === "active";
      })
      .sort((left, right) => left.order - right.order || left.questId.localeCompare(right.questId))[0]?.questId ?? null
    : undefined;
  return {
    quests: result,
    completedQuestIds: Object.freeze([...new Set(completedQuestIds)].sort()),
    inventoryRewards,
    skillXpRewards,
    featureUnlocks: Object.freeze([...featureUnlocks].sort()),
    trackedQuestId,
  };
}

function applyFeatureUnlocks(source: SaveRecord, unlockIds: readonly string[]): SaveRecord {
  const result = structuredClone(source);
  const existing = result.unlocks;
  if (existing !== undefined && (existing === null || typeof existing !== "object" || Array.isArray(existing))) throw new Error("progression.unlocks is not an object");
  const unlocks: SaveRecord = { ...((existing as Record<string, SaveValue> | undefined) ?? {}) };
  for (const unlockId of unlockIds) unlocks[unlockId] = true;
  if (Object.keys(unlocks).length > 0) result.unlocks = unlocks;
  return result;
}

function applyDefeatWorldEvents(source: SaveRecord, rewards: TurnResolvedRewards["worldEvents"]): SaveRecord {
  const result = structuredClone(source);
  const existingDefeats = result.enemyDefeats;
  if (existingDefeats !== undefined && (existingDefeats === null || typeof existingDefeats !== "object" || Array.isArray(existingDefeats))) throw new Error("worldEvents.enemyDefeats is not an object");
  const enemyDefeats: SaveRecord = { ...((existingDefeats as Record<string, SaveValue> | undefined) ?? {}) };
  const existingLedger = result.objectiveLedger;
  if (existingLedger !== undefined && (existingLedger === null || typeof existingLedger !== "object" || Array.isArray(existingLedger))) throw new Error("worldEvents.objectiveLedger is not an object");
  const objectiveLedger: SaveRecord = { ...((existingLedger as Record<string, SaveValue> | undefined) ?? {}) };
  const existingDefeatLedger = objectiveLedger.defeat;
  if (existingDefeatLedger !== undefined && (existingDefeatLedger === null || typeof existingDefeatLedger !== "object" || Array.isArray(existingDefeatLedger))) throw new Error("worldEvents.objectiveLedger.defeat is not an object");
  const defeatLedger: SaveRecord = { ...((existingDefeatLedger as Record<string, SaveValue> | undefined) ?? {}) };
  for (const [creatureId, increment] of Object.entries(rewards.enemyDefeats)) {
    if (!Number.isSafeInteger(increment) || increment < 0) throw new Error(`invalid enemy defeat increment ${creatureId}`);
    const previous = enemyDefeats[creatureId] ?? 0;
    const ledgerPrevious = defeatLedger[creatureId] ?? 0;
    if (typeof previous !== "number" || !Number.isSafeInteger(previous) || previous < 0 || typeof ledgerPrevious !== "number" || !Number.isSafeInteger(ledgerPrevious) || ledgerPrevious < 0) throw new Error(`enemy defeat ledger ${creatureId} is invalid`);
    enemyDefeats[creatureId] = previous + increment;
    defeatLedger[creatureId] = ledgerPrevious + increment;
  }
  const existingUnique = result.uniqueDefeats;
  if (existingUnique !== undefined && (!Array.isArray(existingUnique) || existingUnique.some((entry) => typeof entry !== "string"))) throw new Error("worldEvents.uniqueDefeats is not a string array");
  result.enemyDefeats = enemyDefeats;
  result.objectiveLedger = { ...objectiveLedger, defeat: defeatLedger };
  result.uniqueDefeats = [...new Set([...((existingUnique as string[] | undefined) ?? []), ...rewards.uniqueDefeats])].sort();
  return result;
}

function settleSave(base: ServerSaveV6, character: TurnSettlementCharacterInput, committedAt: string): {
  readonly save: ServerSaveV6;
  readonly completedQuestIds: readonly string[];
  readonly questCompletionRewards: { readonly inventory: Readonly<Record<string, number>>; readonly skillXp: Readonly<Record<string, number>>; readonly unlocks: readonly string[] };
} {
  if (!isServerSaveV6(base) || base.identity.characterId !== character.characterId) throw new Error("settlement base save is invalid or belongs to another character");
  const inventory = structuredClone(base.inventory);
  const chargeIds = new Set([...Object.keys(character.initialItemCharges), ...Object.keys(character.finalItemCharges)]);
  for (const itemId of chargeIds) {
    const initial = character.initialItemCharges[itemId] ?? 0;
    const final = character.finalItemCharges[itemId] ?? 0;
    if (!Number.isSafeInteger(initial) || initial < 0 || !Number.isSafeInteger(final) || final < 0 || final > initial) throw new Error(`invalid item charge transition ${itemId}`);
    const consumed = initial - final;
    const current = inventory[itemId] ?? 0;
    if (typeof current !== "number" || !Number.isSafeInteger(current) || current < consumed) throw new Error(`insufficient current item charge ${itemId}`);
    inventory[itemId] = current - consumed;
  }
  const encounterInventory = addCounters(inventory, character.rewards.inventory);
  const postEncounterWorldEvents = applyDefeatWorldEvents(base.worldEvents, character.rewards.worldEvents);
  const questSettlement = applyQuestObjectiveCounters(base.quests, character.rewards.quests, postEncounterWorldEvents, encounterInventory, base.discoveries);
  const encounterSkillXp = addCounters(base.skillXp, character.rewards.skillXp);
  const encounterProgression = addCounters(base.progression, character.rewards.progression);
  const finalSave: ServerSaveV6 = {
    ...structuredClone(base),
    savedAt: committedAt,
    location: { ...structuredClone(base.location), transform: { ...character.finalTransform } },
    vitals: { ...character.finalVitals },
    inventory: addCounters(encounterInventory, questSettlement.inventoryRewards),
    skillXp: addCounters(encounterSkillXp, questSettlement.skillXpRewards),
    quests: questSettlement.quests,
    progression: applyFeatureUnlocks(encounterProgression, questSettlement.featureUnlocks),
    worldEvents: postEncounterWorldEvents,
    trackedQuestId: questSettlement.trackedQuestId === undefined ? base.trackedQuestId : questSettlement.trackedQuestId,
  };
  if (!isServerSaveV6(finalSave)) throw new Error("settlement produced an invalid ServerSaveV6");
  return {
    save: finalSave,
    completedQuestIds: questSettlement.completedQuestIds,
    questCompletionRewards: {
      inventory: questSettlement.inventoryRewards,
      skillXp: questSettlement.skillXpRewards,
      unlocks: questSettlement.featureUnlocks,
    },
  };
}
