import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_APPEARANCE_V2, migrateServerSaveToV6 } from "@hollow-march/shared";
import {
  InMemoryTurnPersistence,
  canonicalTurnBody,
  encounterOutcomeLockKey,
  executeIdempotentTurnCommand,
  recordEncounterOutcome,
  recordEncounterOutcomeInTransaction,
  type TurnPersistenceAdapter,
  type TurnPersistenceTransaction,
} from "../src/persistence/turn-store.js";
import { TurnEncounterSettlementService } from "../src/rooms/turnSettlement.js";
import { InMemoryGameRepository } from "../src/persistence/memory.js";
import type { TurnSettlementInput } from "../src/rooms/turnEncounterManager.js";

const committedAt = "2026-08-25T12:00:00.000Z";

const settlementInput = (): TurnSettlementInput => {
  const base = migrateServerSaveToV6({
    version: 4, importedFrom: null,
    character: { name: "Mara", appearance: DEFAULT_APPEARANCE_V2 },
    transform: { x: 28, y: 0, z: 16, yaw: 0 }, legacyPayload: null,
  }, committedAt, { accountId: "account.1", characterId: "character.1" });
  base.inventory.mending_draught = 2;
  base.quests.main_bells_below = { status: "active", progress: [0, 0, 0, 0] };
  return {
    encounterId: "encounter.atomic", outcome: "victory", participantCharacterIds: ["character.1"], leasedEnemyIds: ["enemy.ash"],
    latestEventSequence: 14, rewardsAllowed: true,
    characters: [{
      characterId: "character.1", baseSave: base,
      finalVitals: { health: 61, maximumHealth: 100, stamina: 47, maximumStamina: 100, focus: 20, maximumFocus: 50 },
      finalTransform: { x: 29, y: 0, z: 17, yaw: 0.25 },
      finalItemCharges: { mending_draught: 1 },
      initialItemCharges: { mending_draught: 2 },
      rewardEligible: true,
      rewards: { inventory: { spent_cinder: 2 }, skillXp: { vitality: 7 }, quests: { "main_bells_below.objective.0": 1 }, progression: { encountersWon: 1 }, worldEvents: { enemyDefeats: { ash_husk: 1 }, uniqueDefeats: [] } },
    }],
  };
};

test("settlement atomically persists final resources, rewards, audit, and replays exactly once", async () => {
  const persistence = new InMemoryTurnPersistence();
  const service = new TurnEncounterSettlementService(persistence, () => new Date(committedAt));
  const input = settlementInput();
  await service.settle(input);
  await service.settle(input);
  const save = persistence.characterSave("character.1")!;
  assert.equal(save.vitals.health, 61);
  assert.deepEqual(save.location.transform, { x: 29, y: 0, z: 17, yaw: 0.25 });
  assert.equal(save.inventory.mending_draught, 1, "resolved quick-item consumption must persist once");
  assert.equal(save.inventory.spent_cinder, 2);
  assert.equal(save.skillXp.vitality, 7);
  assert.deepEqual(save.quests.main_bells_below, { status: "active", progress: [1, 0, 0, 0] });
  assert.equal(save.progression.encountersWon, 1);
  assert.equal((save.worldEvents.enemyDefeats as Record<string, number>).ash_husk, 1);
  assert.equal(((save.worldEvents.objectiveLedger as Record<string, unknown>).defeat as Record<string, number>).ash_husk, 1);
  assert.equal(persistence.auditEvents().length, 1);
});

test("quest activation hydrates kills recorded during its unlocking encounter and awards the prior quest once", async () => {
  const persistence = new InMemoryTurnPersistence();
  const service = new TurnEncounterSettlementService(persistence, () => new Date(committedAt));
  const input = settlementInput();
  const originalCharacter = input.characters[0]!;
  const base = originalCharacter.baseSave!;
  base.quests.main_bells_below = { status: "active", progress: [3, 1, 1, 1] };
  base.quests.main_the_cinder_seal = { status: "locked", progress: [0, 0, 0, 0] };
  base.worldEvents.objectiveLedger = { defeat: { kiln_thrall: 2 } };
  const first: TurnSettlementInput = {
    ...input,
    characters: [{
      ...originalCharacter,
      rewards: {
        ...originalCharacter.rewards,
        quests: { "main_bells_below.objective.0": 50 },
        worldEvents: { enemyDefeats: { mirebound: 1, kiln_thrall: 1 }, uniqueDefeats: [] },
      },
    }],
  };
  await service.settle(first);
  const completed = persistence.characterSave("character.1")!;
  assert.deepEqual(completed.quests.main_bells_below, { status: "completed", progress: [4, 1, 1, 1] });
  assert.deepEqual(completed.quests.main_the_cinder_seal, { status: "active", progress: [0, 3, 0, 0] });
  assert.equal(completed.trackedQuestId, "main_the_cinder_seal");
  assert.equal(completed.inventory.sable_marks, 220);
  assert.equal(completed.inventory.reedward_charm, 1);
  assert.equal(completed.skillXp.swordsmanship, 300);
  assert.equal(completed.skillXp.runecrafting, 180);
  assert.equal(completed.skillXp.wayfaring, 150);
  assert.equal((completed.progression.unlocks as Record<string, unknown>).dunmire_shortcut, true);

  const second: TurnSettlementInput = {
    ...first,
    encounterId: "encounter.atomic.second",
    characters: [{ ...first.characters[0]!, initialItemCharges: { mending_draught: 1 }, finalItemCharges: { mending_draught: 1 } }],
  };
  await service.settle(second);
  const replayedByDifferentEncounter = persistence.characterSave("character.1")!;
  assert.equal(replayedByDifferentEncounter.inventory.sable_marks, 220, "completed quest currency cannot award twice");
  assert.equal(replayedByDifferentEncounter.inventory.reedward_charm, 1, "completed quest item cannot award twice");
  assert.equal(replayedByDifferentEncounter.skillXp.swordsmanship, 300, "completed quest XP cannot award twice");
});

test("kills recorded before unlock hydrate and recursively complete eligible main-chain quests", async () => {
  const persistence = new InMemoryTurnPersistence();
  const service = new TurnEncounterSettlementService(persistence, () => new Date(committedAt));
  const input = settlementInput();
  const originalCharacter = input.characters[0]!;
  const base = originalCharacter.baseSave!;
  base.quests.main_bells_below = { status: "active", progress: [3, 1, 1, 1] };
  base.quests.main_the_cinder_seal = { status: "locked", progress: [0, 0, 0, 0] };
  base.quests.main_a_litany_unspoken = { status: "locked", progress: [0, 0, 0, 0, 0] };
  base.inventory.cinder_seal = 1;
  base.worldEvents.objectiveLedger = {
    talk: { orik_senn: 1 },
    defeat: { kiln_thrall: 3, kiln_knight_rusk: 1, hush_monk: 4, cantor_oss: 1 },
    interact: { abbey_gate: 1, memory_clapper: 1 },
    discover: { last_bell_crypt: 1 },
  };
  base.discoveries.push("last_bell_crypt");
  const encounter: TurnSettlementInput = {
    ...input,
    characters: [{
      ...originalCharacter,
      rewards: {
        ...originalCharacter.rewards,
        quests: { "main_bells_below.objective.0": 1 },
        worldEvents: { enemyDefeats: { mirebound: 1 }, uniqueDefeats: [] },
      },
    }],
  };

  await service.settle(encounter);
  await service.settle(encounter);
  const completed = persistence.characterSave("character.1")!;
  assert.deepEqual(completed.quests.main_bells_below, { status: "completed", progress: [4, 1, 1, 1] });
  assert.deepEqual(completed.quests.main_the_cinder_seal, { status: "completed", progress: [1, 3, 1, 1] });
  assert.deepEqual(completed.quests.main_a_litany_unspoken, { status: "active", progress: [1, 4, 1, 1, 1] });
  assert.equal(completed.trackedQuestId, "main_a_litany_unspoken");
  assert.equal(completed.inventory.sable_marks, 720, "recursive quest currency is awarded exactly once");
  assert.equal(completed.inventory.reedward_charm, 1);
  assert.equal(completed.inventory.cinder_seal, 2, "the prior inventory objective and one canonical reward are preserved");
  assert.equal(completed.inventory.tempered_flask_shard, 1);
  assert.equal(completed.skillXp.swordsmanship, 1_000);
  assert.equal((completed.progression.unlocks as Record<string, unknown>).dunmire_shortcut, true);
  assert.equal((completed.progression.unlocks as Record<string, unknown>).hollow_abbey_gate, true);
});

test("settlement reads the locked current save and applies consumption and rewards as deltas", async () => {
  const persistence = new InMemoryTurnPersistence();
  const input = settlementInput();
  const concurrent = structuredClone(input.characters[0]!.baseSave!);
  concurrent.inventory.mending_draught = 5;
  concurrent.inventory.concurrent_find = 3;
  concurrent.quests.concurrent_quest = { stage: 2 };
  concurrent.progression.concurrent_rank = 9;
  persistence.seedCharacterSave(concurrent);

  await new TurnEncounterSettlementService(persistence, () => new Date(committedAt)).settle(input);
  const save = persistence.characterSave("character.1")!;
  assert.equal(save.inventory.mending_draught, 4, "one authored use subtracts from the locked count without erasing four concurrent gains");
  assert.equal(save.inventory.concurrent_find, 3);
  assert.deepEqual(save.quests.concurrent_quest, { stage: 2 });
  assert.equal(save.progression.concurrent_rank, 9);
  assert.equal(save.inventory.spent_cinder, 2);
});

test("memory room settlement updates the canonical repository character read path", async () => {
  const repository = new InMemoryGameRepository();
  const character = await repository.createCharacter({
    accountId: "account.memory", name: "Mara", appearance: DEFAULT_APPEARANCE_V2,
    transform: { x: 28, y: 0, z: 16, yaw: 0 }, publicPhaseMask: 1, personalPhaseMask: 1,
  });
  const input = settlementInput();
  const base = migrateServerSaveToV6({
    version: 4, importedFrom: null,
    character: { name: "Mara", appearance: DEFAULT_APPEARANCE_V2 },
    transform: character.transform, legacyPayload: null,
  }, committedAt, { accountId: character.accountId, characterId: character.id });
  base.inventory.mending_draught = 2;
  const rebound: TurnSettlementInput = {
    ...input,
    participantCharacterIds: [character.id],
    characters: [{ ...input.characters[0]!, characterId: character.id, baseSave: base }],
  };
  const persistence = new InMemoryTurnPersistence(repository);
  await new TurnEncounterSettlementService(persistence, () => new Date(committedAt)).settle(rebound);
  const after = await repository.getCharacter(character.id);
  assert.equal(after?.save?.vitals.health, 61);
  assert.equal(after?.save?.inventory.mending_draught, 1);
  assert.equal(after?.save?.inventory.spent_cinder, 2);
  assert.equal(after?.transform.x, after?.save?.location.transform.x);
  assert.equal(repository.auditEvents.filter(({ kind }) => kind === "character.turn_encounter_settled").length, 1);
});

test("audit failure rolls back save, reward, command, and outcome before a clean retry", async () => {
  const persistence = new InMemoryTurnPersistence();
  const failing: TurnPersistenceAdapter = {
    transaction: (locks, operation) => persistence.transaction(locks, (transaction) => operation({
      ...transaction,
      insertAuditEvent: async () => { throw new Error("audit unavailable"); },
    })),
  };
  await assert.rejects(new TurnEncounterSettlementService(failing, () => new Date(committedAt)).settle(settlementInput()), /audit unavailable/);
  assert.equal(persistence.characterSave("character.1"), null);
  assert.equal(persistence.auditEvents().length, 0);
  await new TurnEncounterSettlementService(persistence, () => new Date(committedAt)).settle(settlementInput());
  assert.equal(persistence.characterSave("character.1")?.inventory.spent_cinder, 2);
  assert.equal(persistence.auditEvents().length, 1);
});

test("a second-character failure rolls back the entire party settlement before exact-once retry", async () => {
  const persistence = new InMemoryTurnPersistence();
  const input = settlementInput();
  const first = input.characters[0]!;
  const secondSave = { ...structuredClone(first.baseSave!), identity: { accountId: "account.2", characterId: "character.2" } };
  const party: TurnSettlementInput = {
    ...input,
    participantCharacterIds: ["character.1", "character.2"],
    characters: [first, { ...structuredClone(first), characterId: "character.2", baseSave: secondSave }],
  };
  const failing: TurnPersistenceAdapter = {
    transaction: (locks, operation) => persistence.transaction(locks, (transaction) => operation({
      ...transaction,
      insertAuditEvent: async (event) => {
        if (event.subjectId === "character.2") throw new Error("second character audit unavailable");
        return transaction.insertAuditEvent(event);
      },
    })),
  };
  await assert.rejects(new TurnEncounterSettlementService(failing, () => new Date(committedAt)).settle(party), /second character audit unavailable/);
  assert.equal(persistence.characterSave("character.1"), null);
  assert.equal(persistence.characterSave("character.2"), null);
  assert.equal(persistence.auditEvents().length, 0);

  const service = new TurnEncounterSettlementService(persistence, () => new Date(committedAt));
  await service.settle(party); await service.settle(party);
  assert.equal(persistence.characterSave("character.1")?.inventory.spent_cinder, 2);
  assert.equal(persistence.characterSave("character.2")?.inventory.spent_cinder, 2);
  assert.equal(persistence.auditEvents().length, 2);
});

test("same command and canonical body returns its stored result without executing twice", async () => {
  const persistence = new InMemoryTurnPersistence();
  let executions = 0;
  const execute = async () => ({ reward: { xp: 40, items: ["ash"] }, ordinal: ++executions });
  const first = await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "command.1", body: { round: 2, action: { target: "enemy.1", kind: "light" } }, committedAt,
  }, execute);
  const replay = await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "command.1", body: { action: { kind: "light", target: "enemy.1" }, round: 2 }, committedAt,
  }, execute);
  assert.deepEqual(first, { status: "committed", result: { ordinal: 1, reward: { items: ["ash"], xp: 40 } } });
  assert.deepEqual(replay, { status: "replayed", result: first.result });
  assert.equal(executions, 1);
});

test("concurrent identical retries serialize and execute their handler once", async () => {
  const persistence = new InMemoryTurnPersistence();
  let executions = 0;
  const submit = () => executeIdempotentTurnCommand(persistence, {
    characterId: "character.concurrent", commandId: "command.concurrent", body: { round: 4 }, committedAt,
  }, async () => ({ execution: ++executions }));
  const decisions = await Promise.all([submit(), submit(), submit()]);
  assert.deepEqual(decisions.map(({ status }) => status).sort(), ["committed", "replayed", "replayed"]);
  assert.equal(executions, 1);
});

test("same command ID with a different canonical body reports idempotency_conflict", async () => {
  const persistence = new InMemoryTurnPersistence();
  await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "command.1", body: { round: 2 }, committedAt,
  }, async () => ({ accepted: true }));
  const conflict = await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "command.1", body: { round: 3 }, committedAt,
  }, async () => { throw new Error("must not execute"); });
  assert.deepEqual(conflict, { status: "idempotency_conflict", code: "idempotency_conflict" });
});

test("encounter outcomes are unique per character and identical settlement retries replay", async () => {
  const persistence = new InMemoryTurnPersistence();
  const input = { characterId: "character.1", encounterId: "encounter.1", result: { xp: 75, drops: ["sealed_ash"] }, committedAt } as const;
  assert.equal((await recordEncounterOutcome(persistence, input)).status, "committed");
  assert.equal((await recordEncounterOutcome(persistence, input)).status, "replayed");
  const conflict = await recordEncounterOutcome(persistence, { ...input, result: { xp: 76, drops: ["sealed_ash"] } });
  assert.deepEqual(conflict, { status: "encounter_outcome_conflict", code: "encounter_outcome_conflict" });

  const otherCharacter = await recordEncounterOutcome(persistence, { ...input, characterId: "character.2" });
  assert.equal(otherCharacter.status, "committed");
});

test("command result and outcome ledger can settle atomically through one transaction seam", async () => {
  const persistence = new InMemoryTurnPersistence();
  const result = await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "settle.1", body: { encounterId: "encounter.1" }, committedAt,
    additionalLockKeys: [encounterOutcomeLockKey("character.1", "encounter.1")],
  }, async (transaction) => {
    const outcome = await recordEncounterOutcomeInTransaction(transaction, {
      characterId: "character.1", encounterId: "encounter.1", result: { xp: 90 }, committedAt,
    });
    assert.equal(outcome.status, "committed");
    return { outcome: "victory", xp: 90 };
  });
  assert.equal(result.status, "committed");
  const retry = await executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "settle.1", body: { encounterId: "encounter.1" }, committedAt,
  }, async () => { throw new Error("must not execute"); });
  assert.equal(retry.status, "replayed");
});

test("failed memory transactions roll back outcomes and command records", async () => {
  const persistence = new InMemoryTurnPersistence();
  await assert.rejects(executeIdempotentTurnCommand(persistence, {
    characterId: "character.1", commandId: "settle.fail", body: { encounterId: "encounter.fail" }, committedAt,
    additionalLockKeys: [encounterOutcomeLockKey("character.1", "encounter.fail")],
  }, async (transaction) => {
    await recordEncounterOutcomeInTransaction(transaction, {
      characterId: "character.1", encounterId: "encounter.fail", result: { xp: 1 }, committedAt,
    });
    throw new Error("database write failed");
  }), /database write failed/);
  const outcome = await recordEncounterOutcome(persistence, {
    characterId: "character.1", encounterId: "encounter.fail", result: { xp: 2 }, committedAt,
  });
  assert.equal(outcome.status, "committed");
});

test("helpers declare sorted uniqueness locks before database-only callbacks", async () => {
  class CapturingAdapter implements TurnPersistenceAdapter {
    readonly inner = new InMemoryTurnPersistence();
    readonly calls: string[][] = [];
    transaction<T>(lockKeys: readonly string[], operation: (transaction: TurnPersistenceTransaction) => Promise<T>): Promise<T> {
      this.calls.push([...lockKeys]);
      return this.inner.transaction(lockKeys, operation);
    }
  }
  const persistence = new CapturingAdapter();
  await recordEncounterOutcome(persistence, { characterId: "character.lock", encounterId: "encounter.lock", result: { xp: 1 }, committedAt });
  assert.deepEqual(persistence.calls[0], [encounterOutcomeLockKey("character.lock", "encounter.lock")]);
  assert.deepEqual(persistence.calls[0], [...persistence.calls[0]!].sort());
});

test("nested outcome settlement derives canonical identity from the durable result", async () => {
  const persistence = new InMemoryTurnPersistence();
  const lockKey = encounterOutcomeLockKey("character.canonical", "encounter.canonical");
  await persistence.transaction([lockKey], async (transaction) => {
    const adversarial = {
      characterId: "character.canonical", encounterId: "encounter.canonical", result: { xp: 5 }, committedAt,
      canonicalOutcome: canonicalTurnBody({ xp: 999 }),
    };
    assert.equal((await recordEncounterOutcomeInTransaction(transaction, adversarial)).status, "committed");
  });
  const replay = await recordEncounterOutcome(persistence, {
    characterId: "character.canonical", encounterId: "encounter.canonical", result: { xp: 5 }, committedAt,
  });
  assert.equal(replay.status, "replayed", "an extra caller canonical cannot poison the stored outcome identity");
});

test("nested outcome settlement fails before writes when its uniqueness lock was not declared", async () => {
  const persistence = new InMemoryTurnPersistence();
  await assert.rejects(executeIdempotentTurnCommand(persistence, {
    characterId: "character.no-lock", commandId: "settle.no-lock", body: { encounterId: "encounter.no-lock" }, committedAt,
  }, async (transaction) => {
    await recordEncounterOutcomeInTransaction(transaction, {
      characterId: "character.no-lock", encounterId: "encounter.no-lock", result: { xp: 1 }, committedAt,
    });
    return { accepted: true };
  }), /did not acquire required lock/);
});

test("canonical command bodies reject non-durable values", () => {
  assert.equal(canonicalTurnBody({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.throws(() => canonicalTurnBody({ value: Number.NaN }), /finite numbers/);
  assert.throws(() => canonicalTurnBody({ value: undefined }), /unsupported value/);
  assert.throws(() => canonicalTurnBody({ value: new Date(committedAt) }), /plain JSON objects/);
  assert.throws(() => canonicalTurnBody({ value: new Array(2) }), /sparse arrays/);
});
