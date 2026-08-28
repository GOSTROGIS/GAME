import assert from "node:assert/strict";
import test from "node:test";
import { legacySaveFingerprintV1, migrateLegacyV3Save, migrateLegacyV3SaveToV5 } from "../src/migration.js";
import {
  ACTIVE_ENCOUNTER_DURABILITY,
  SERVER_SAVE_V6_DEFAULTS,
  isServerSaveV6,
  migrateLegacySaveV3ToV6,
  migrateLocalSaveV3ToV4,
  migrateServerSaveToV6,
  migrateServerSaveV4ToV6,
  migrateServerSaveV5ToV6,
} from "../src/save-v6.js";

const importedAt = "2026-08-25T12:00:00.000Z";
const boundIdentity = { accountId: "account.test", characterId: "character.test" };
const legacy = {
  version: 3 as const,
  contentRevision: 3,
  accountId: "account.1",
  characterId: "character.1",
  character: { id: "character.1", name: "Mara", origin: "mire_physicker", appearance: { morphs: { stature: 0.5 } } },
  player: {
    x: 7.5, y: 11, hp: 73, maxHp: 90,
    stamina: 999, maxStamina: 100, focus: -4, maxFocus: 80,
    attackCooldown: 0.2, dodgeCooldown: 0.7, invulnerable: 0.4,
  },
  skills: { swordsmanship: 12_345, warding: 55 },
  progression: {
    purchasedNodes: { swordsmanship: ["edge.lesson.1"] },
    techniquePoints: { swordsmanship: 2 },
    masteryStates: { swordsmanship: { completed: false } },
  },
  inventory: { rust_sword: 1, ashleaf: 4 },
  quests: { first_vigil: { status: "active", progress: [1] } },
  worldEvents: { uniqueDefeats: ["ash_husk"] },
  discovered: ["hearthmere_square", "dunmire_causeway"],
  respawn: { x: 4, y: 6 },
  gathered: { spring: 1234 },
  enemies: [{ uid: "enemy.1", hp: 4, maxHp: 20, dead: false, respawnAt: 0, cooldown: 4, intent: 2, intentMoveId: "bite", hitFlash: 1 }],
  trackedQuest: "first_vigil",
  playSeconds: 321,
  activeEncounter: { id: "encounter.must-not-persist" },
};

test("local v3 to v4 preserves durable progression in named metre space and excludes real-time combat state", () => {
  const save = migrateLocalSaveV3ToV4(legacy, importedAt);
  assert.equal(save.version, 4);
  assert.equal(save.location.coordinateSpaceId, "hearthmere_local_meters");
  assert.deepEqual(save.location.transform, { x: 30, y: 0, z: 44, yaw: 0 });
  assert.deepEqual(save.respawn.transform, { x: 16, y: 0, z: 24, yaw: 0 });
  assert.deepEqual(save.skillXp, legacy.skills);
  assert.deepEqual(save.techniques.purchasedNodes, legacy.progression.purchasedNodes);
  assert.deepEqual(save.inventory, legacy.inventory);
  assert.deepEqual(save.quests, legacy.quests);
  assert.deepEqual(save.worldEvents, legacy.worldEvents);
  assert.deepEqual(save.discoveries, legacy.discovered);
  assert.equal(save.vitals.stamina, 100);
  assert.equal(save.vitals.focus, 0);
  assert.equal(save.legacyImport?.importedAt, importedAt);
  assert.equal(save.activeEncounterDurability, ACTIVE_ENCOUNTER_DURABILITY);
  assert.equal("activeEncounter" in save, false);
  assert.deepEqual(save.worldState.enemies, [{ uid: "enemy.1", hp: 4, maxHp: 20, dead: false, respawnAt: 0 }]);
});

test("server v4 and v5 transforms and one-time import fingerprint survive v6 exactly", () => {
  const v4 = migrateLegacyV3Save(legacy, importedAt);
  const v5 = migrateLegacyV3SaveToV5(legacy, importedAt);
  const v4TransformBytes = JSON.stringify(v4.transform);
  const boundIdentity = { accountId: legacy.accountId, characterId: legacy.characterId };
  const fromV4 = migrateServerSaveV4ToV6(v4, importedAt, boundIdentity);
  const fromV5 = migrateServerSaveV5ToV6(v5, importedAt, boundIdentity);
  assert.equal(JSON.stringify(fromV4.location.transform), v4TransformBytes);
  assert.equal(JSON.stringify(fromV5.location.transform), v4TransformBytes);
  assert.deepEqual(fromV4.legacyImport, { ...v4.importedFrom, algorithm: "sha256" });
  assert.deepEqual(fromV5.legacyImport, { ...v5.importedFrom, algorithm: "sha256" });
  assert.deepEqual(fromV5.skillXp, legacy.skills);
  assert.deepEqual(fromV5.progression, legacy.progression);
});

test("legacy v3 migrates directly to v6 and the public migrator is idempotent", () => {
  const save = migrateLegacySaveV3ToV6(legacy, importedAt);
  assert.equal(save.version, 6);
  assert.equal(save.savedAt, importedAt);
  assert.equal(save.identity.characterId, "character.1");
  assert.equal(save.appearance.originId, "mire_physicker");
  const migratedAgain = migrateServerSaveToV6(save);
  assert.notStrictEqual(migratedAgain, save, "V6 input is cloned instead of trusted by reference");
  assert.deepEqual(migratedAgain, save);
  assert.equal(isServerSaveV6(migratedAgain), true);
});

test("v4/v5 saves with absent local progression receive canonical derived defaults", () => {
  const minimalLegacy = { version: 3 as const, player: { x: 3, y: 4 }, character: { name: "Defaulted" } };
  const fromV4 = migrateServerSaveV4ToV6(migrateLegacyV3Save(minimalLegacy, importedAt), importedAt, boundIdentity);
  const fromV5 = migrateServerSaveV5ToV6(migrateLegacyV3SaveToV5(minimalLegacy, importedAt), importedAt, boundIdentity);
  for (const save of [fromV4, fromV5]) {
    assert.deepEqual(save.vitals, SERVER_SAVE_V6_DEFAULTS.vitals);
    for (const ledger of SERVER_SAVE_V6_DEFAULTS.techniqueLedgerKeys) assert.deepEqual(save.techniques[ledger], {}, ledger);
  }

  const attributed = migrateLegacySaveV3ToV6({
    version: 3, player: { x: 1, y: 1 },
    character: { name: "Attributed", attributes: { vigor: 8, endurance: 9, attunement: 10 } },
  }, importedAt, boundIdentity);
  assert.deepEqual(attributed.vitals, { health: 126, maximumHealth: 126, stamina: 107, maximumStamina: 107, focus: 95, maximumFocus: 95 });
});

test("V6 rebuild recursively strips transient combat state from nested records and arrays", () => {
  const save = migrateLegacySaveV3ToV6(legacy, importedAt);
  const contaminated = structuredClone(save) as typeof save & Record<string, unknown>;
  contaminated.activeEncounter = { id: "encounter.transient" };
  contaminated.worldEvents = {
    durableFlag: true,
    combat: {
      cooldown: 3,
      windows: [{ attackCooldown: 1, invulnerabilityWindow: { impactAt: 8 }, durable: "kept" }],
    },
  };
  assert.equal(isServerSaveV6(contaminated), false);
  const rebuilt = migrateServerSaveToV6(contaminated);
  assert.equal("activeEncounter" in rebuilt, false);
  assert.deepEqual(rebuilt.worldEvents, { durableFlag: true, combat: { windows: [{ durable: "kept" }] } });
  assert.equal(isServerSaveV6(rebuilt), true);
});

test("V6 rejects legacy root identity aliases and empty canonical identity IDs", () => {
  const valid = migrateLegacySaveV3ToV6(legacy, importedAt);
  for (const contaminated of [
    { ...structuredClone(valid), accountId: valid.identity.accountId },
    { ...structuredClone(valid), accountId: "contradictory.account" },
    { ...structuredClone(valid), characterId: valid.identity.characterId },
    { ...structuredClone(valid), characterId: "contradictory.character" },
  ]) {
    assert.equal(isServerSaveV6(contaminated), false);
    assert.throws(() => migrateServerSaveToV6(contaminated), /root identity aliases/);
  }

  const emptyAccountId = structuredClone(valid);
  emptyAccountId.identity.accountId = "";
  assert.equal(isServerSaveV6(emptyAccountId), false);
  assert.throws(() => migrateServerSaveToV6(emptyAccountId), /identity/);

  const emptyCharacterId = structuredClone(valid);
  emptyCharacterId.identity.characterId = "";
  assert.equal(isServerSaveV6(emptyCharacterId), false);
  assert.throws(() => migrateServerSaveToV6(emptyCharacterId), /identity/);

  const nullAccount = structuredClone(valid);
  nullAccount.identity.accountId = null;
  assert.equal(isServerSaveV6(nullAccount), false);
  assert.throws(() => migrateServerSaveToV6(nullAccount), /identity must be bound/);

  const identityExtra = structuredClone(valid) as typeof valid & { identity: typeof valid.identity & { role: string } };
  identityExtra.identity.role = "admin";
  assert.equal(isServerSaveV6(identityExtra), false);
  assert.throws(() => migrateServerSaveToV6(identityExtra), /identity contains unknown fields/);
});

test("V6 rebuild copies only fixed transform coordinates and drops transient extras", () => {
  const valid = migrateLegacySaveV3ToV6(legacy, importedAt);
  const contaminated = structuredClone(valid) as typeof valid & {
    location: typeof valid.location & { transform: typeof valid.location.transform & Record<string, unknown> };
    respawn: typeof valid.respawn & { transform: typeof valid.respawn.transform & Record<string, unknown> };
  };
  contaminated.location.transform.cooldown = 9;
  contaminated.location.transform.clientPrediction = { x: 999 };
  contaminated.respawn.transform.invulnerabilityWindow = 4;
  contaminated.respawn.transform.untrustedExtra = "discarded";
  assert.equal(isServerSaveV6(contaminated), false, "strict V6 records reject unknown fixed-transform fields");
  const rebuilt = migrateServerSaveToV6(contaminated);
  assert.deepEqual(rebuilt.location.transform, valid.location.transform);
  assert.deepEqual(rebuilt.respawn.transform, valid.respawn.transform);
  assert.deepEqual(Object.keys(rebuilt.location.transform), ["x", "y", "z", "yaw"]);
  assert.deepEqual(Object.keys(rebuilt.respawn.transform), ["x", "y", "z", "yaw"]);
});

test("V6 rejects unknown root fields and implausible durable transform bounds", () => {
  const valid = migrateLegacySaveV3ToV6(legacy, importedAt);
  const unknownRoot = { ...structuredClone(valid), futureAuthorityOverride: true };
  assert.equal(isServerSaveV6(unknownRoot), false);
  assert.throws(() => migrateServerSaveToV6(unknownRoot), /unknown fields/);

  const hugeLocation = structuredClone(valid);
  hugeLocation.location.transform.x = 1e12;
  assert.equal(isServerSaveV6(hugeLocation), false);
  assert.throws(() => migrateServerSaveToV6(hugeLocation), /coordinates/);

  const hugeRespawn = structuredClone(valid);
  hugeRespawn.respawn.transform.yaw = 1e12;
  assert.equal(isServerSaveV6(hugeRespawn), false);
  assert.throws(() => migrateServerSaveToV6(hugeRespawn), /coordinates/);
});

test("v4/v5 import fingerprints are verified against their embedded legacy payload", () => {
  const v4 = migrateLegacyV3Save(legacy, importedAt);
  v4.importedFrom!.fingerprint = "0".repeat(64);
  assert.throws(() => migrateServerSaveV4ToV6(v4, importedAt), /fingerprint does not match/);

  const v5 = migrateLegacyV3SaveToV5(legacy, importedAt);
  v5.importedFrom!.fingerprint = "f".repeat(64);
  assert.throws(() => migrateServerSaveV5ToV6(v5, importedAt), /fingerprint does not match/);

  const historical = migrateLegacyV3Save(legacy, importedAt);
  historical.importedFrom!.fingerprint = legacySaveFingerprintV1(legacy);
  const migratedHistorical = migrateServerSaveV4ToV6(historical, importedAt);
  assert.equal(migratedHistorical.legacyImport?.algorithm, "legacy-fnv1a64x4-v1");
  assert.equal(migratedHistorical.legacyImport?.fingerprint, historical.importedFrom!.fingerprint);
});

test("V6 import protection accepts only lowercase SHA-256 fingerprints", () => {
  const valid = migrateLegacySaveV3ToV6(legacy, importedAt);
  const malformed = structuredClone(valid);
  malformed.legacyImport!.fingerprint = "A".repeat(64);
  assert.equal(isServerSaveV6(malformed), false);
  assert.throws(() => migrateServerSaveToV6(malformed), /legacyImport|legacy import protection/);
});

test("malformed and ambiguously versioned saves are rejected instead of cast into V6", () => {
  const valid = migrateLegacySaveV3ToV6(legacy, importedAt);
  const missingVitals = structuredClone(valid) as unknown as Record<string, unknown>;
  delete missingVitals.vitals;
  assert.throws(() => migrateServerSaveToV6(missingVitals), /vitals/);

  const missingTechniqueLedger = structuredClone(valid);
  delete missingTechniqueLedger.techniques.actionMastery;
  assert.throws(() => migrateServerSaveToV6(missingTechniqueLedger), /techniques\.actionMastery/);

  const badCoordinates = structuredClone(valid);
  badCoordinates.location.coordinateSpaceId = "wrong_space";
  assert.throws(() => migrateServerSaveToV6(badCoordinates), /coordinates|coordinate space/);
  assert.throws(() => migrateServerSaveToV6({ version: 5, transform: valid.location.transform }), /ServerSaveV5 is malformed/);
  assert.throws(() => migrateServerSaveToV6({ version: 4, contentRevision: 0 }), /LocalGameSaveV4 header|identity/);
});

test("sparse arrays are rejected in both legacy migration and V6 validation", () => {
  const sparse = new Array<string>(2); sparse[1] = "hearthmere_square";
  assert.throws(() => migrateLegacySaveV3ToV6({ ...legacy, discovered: sparse }, importedAt), /sparse/);
  const save = migrateLegacySaveV3ToV6(legacy, importedAt);
  const malformed = structuredClone(save); malformed.discoveries = sparse;
  assert.equal(isServerSaveV6(malformed), false);
  assert.throws(() => migrateServerSaveToV6(malformed), /sparse/);
});
