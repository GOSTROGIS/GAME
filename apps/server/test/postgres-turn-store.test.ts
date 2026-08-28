import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { DEFAULT_APPEARANCE_V2, migrateServerSaveToV6 } from "@hollow-march/shared";
import { PostgresTurnPersistenceAdapter, type TurnSqlClient, type TurnSqlPool, type TurnSqlQueryResult } from "../src/persistence/postgres-turn-store.js";
import {
  canonicalTurnBody,
  encounterOutcomeLockKey,
  turnCharacterLockKey,
  turnCommandLockKey,
} from "../src/persistence/turn-store.js";

interface SqlCall { sql: string; values: readonly unknown[] }

const compact = (sql: string): string => sql.replace(/\s+/g, " ").trim();

class FakeClient implements TurnSqlClient {
  readonly calls: SqlCall[] = [];
  releases = 0;
  constructor(readonly respond: (sql: string, values: readonly unknown[]) => readonly Record<string, unknown>[] = () => []) {}
  async query(text: string, values: readonly unknown[] = []): Promise<TurnSqlQueryResult> {
    const sql = compact(text); this.calls.push({ sql, values: [...values] });
    return { rows: this.respond(sql, values) };
  }
  release(): void { this.releases += 1; }
}

class FakePool implements TurnSqlPool {
  connects = 0;
  constructor(readonly client: FakeClient) {}
  async connect(): Promise<TurnSqlClient> { this.connects += 1; return this.client; }
}

const iso = "2026-08-25T12:00:00.000Z";
const characterId = "11111111-1111-4111-8111-111111111111";
const durableSave = () => migrateServerSaveToV6({
  version: 4, importedFrom: null,
  character: { name: "Mara", appearance: DEFAULT_APPEARANCE_V2 },
  transform: { x: 28, y: 0, z: 16, yaw: 0 }, legacyPayload: null,
}, iso, { accountId: "22222222-2222-4222-8222-222222222222", characterId });

test("one client performs BEGIN, sorted advisory locks, callback, and COMMIT", async () => {
  const order: string[] = [];
  const client = new FakeClient((sql) => { order.push(sql); return []; });
  const pool = new FakePool(client); const adapter = new PostgresTurnPersistenceAdapter(pool);
  const result = await adapter.transaction(["a-lock", "b-lock"], async (transaction) => {
    order.push("CALLBACK");
    assert.deepEqual([...transaction.heldLockKeys], ["a-lock", "b-lock"]);
    return 42;
  });
  assert.equal(result, 42);
  assert.deepEqual(order, [
    "BEGIN",
    "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
    "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
    "CALLBACK",
    "COMMIT",
  ]);
  assert.deepEqual(client.calls.slice(1, 3).map(({ values }) => values), [["a-lock"], ["b-lock"]]);
  assert.equal(pool.connects, 1); assert.equal(client.releases, 1);
});

test("unsorted locks reject before connection and callback failures roll back without masking the original error", async () => {
  const unsortedPool = new FakePool(new FakeClient());
  const adapter = new PostgresTurnPersistenceAdapter(unsortedPool);
  await assert.rejects(adapter.transaction(["b", "a"], async () => true), /sorted unique/);
  assert.equal(unsortedPool.connects, 0);

  const failure = new Error("settlement failed");
  const rollbackFailure = new Error("rollback transport failed");
  const client = new FakeClient((sql) => { if (sql === "ROLLBACK") throw rollbackFailure; return []; });
  const rollbackAdapter = new PostgresTurnPersistenceAdapter(new FakePool(client));
  await assert.rejects(rollbackAdapter.transaction(["lock"], async () => { throw failure; }), (error: unknown) => {
    assert.strictEqual(error, failure);
    assert.strictEqual((error as Error & { rollbackError?: unknown }).rollbackError, rollbackFailure);
    return true;
  });
  assert.deepEqual(client.calls.map(({ sql }) => sql), ["BEGIN", "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", "ROLLBACK"]);
  assert.equal(client.releases, 1);
});

test("frozen callback errors remain primary when turn-ledger rollback also fails", async () => {
  const primary = Object.freeze(new Error("frozen settlement failure"));
  const client = new FakeClient((sql) => { if (sql === "ROLLBACK") throw new Error("rollback transport failure"); return []; });
  const adapter = new PostgresTurnPersistenceAdapter(new FakePool(client));
  await assert.rejects(adapter.transaction(["lock"], async () => { throw primary; }), (error: unknown) => {
    assert.strictEqual(error, primary);
    return true;
  });
});

test("the SQL facade refuses ledger access whose advisory lock was not declared", async () => {
  const client = new FakeClient();
  const adapter = new PostgresTurnPersistenceAdapter(new FakePool(client));
  await assert.rejects(adapter.transaction([], (transaction) => transaction.findCommand(characterId, "undeclared")), /did not acquire required lock/);
  assert.deepEqual(client.calls.map(({ sql }) => sql), ["BEGIN", "ROLLBACK"]);
  assert.equal(client.releases, 1);
});

test("transaction facade maps command and outcome rows and parameters", async () => {
  const client = new FakeClient((sql) => {
    if (sql.includes("FROM turn_command_ledger")) return [{ character_id: characterId, command_id: "command.1", canonical_body: "{\"round\":1}", result: { accepted: true }, committed_at: new Date(iso) }];
    if (sql.includes("FROM turn_encounter_outcome_ledger")) return [{ character_id: characterId, encounter_id: "encounter.1", canonical_outcome: "{\"xp\":5}", result: { xp: 5 }, committed_at: iso }];
    return [];
  });
  const adapter = new PostgresTurnPersistenceAdapter(new FakePool(client));
  const locks = [
    turnCommandLockKey(characterId, "command.1"), encounterOutcomeLockKey(characterId, "encounter.1"),
  ].sort();
  await adapter.transaction(locks, async (transaction) => {
    assert.deepEqual(await transaction.findCommand(characterId, "command.1"), {
      characterId, commandId: "command.1", canonicalBody: '{"round":1}', result: { accepted: true }, committedAt: iso,
    });
    await transaction.insertCommand({ characterId, commandId: "command.1", canonicalBody: '{"round":1}', result: { z: 2, a: 1 }, committedAt: iso });
    assert.deepEqual(await transaction.findOutcome(characterId, "encounter.1"), {
      characterId, encounterId: "encounter.1", canonicalOutcome: '{"xp":5}', result: { xp: 5 }, committedAt: iso,
    });
    await transaction.insertOutcome({ characterId, encounterId: "encounter.1", canonicalOutcome: '{"xp":5}', result: { xp: 5 }, committedAt: iso });
  });

  const insertCommand = client.calls.find(({ sql }) => sql.startsWith("INSERT INTO turn_command_ledger"))!;
  assert.deepEqual(insertCommand.values, [characterId, "command.1", '{"round":1}', '{"a":1,"z":2}', iso]);
  const insertOutcome = client.calls.find(({ sql }) => sql.startsWith("INSERT INTO turn_encounter_outcome_ledger"))!;
  assert.deepEqual(insertOutcome.values, [characterId, "encounter.1", '{"xp":5}', '{"xp":5}', iso]);
});

test("character save settlement locks and reads current V6 before validated write and audit", async () => {
  const save = durableSave();
  const client = new FakeClient((sql) => {
    if (sql.startsWith("SELECT save_v6")) return [{ save_v6: save }];
    if (sql.startsWith("UPDATE characters")) return [{ id: characterId }];
    return [];
  });
  const adapter = new PostgresTurnPersistenceAdapter(new FakePool(client));
  await adapter.transaction([turnCharacterLockKey(characterId)], async (transaction) => {
    assert.deepEqual(await transaction.readCharacterSaveForUpdate(characterId), save);
    const updated = structuredClone(save); updated.inventory.mending_draught = 1;
    await transaction.writeCharacterSave(characterId, updated);
    await transaction.insertAuditEvent({ accountId: save.identity.accountId, kind: "character.turn_encounter_settled", subjectId: characterId, detail: { encounterId: "encounter.1" } });
  });
  const read = client.calls.find(({ sql }) => sql.startsWith("SELECT save_v6"))!;
  assert.match(read.sql, /FOR UPDATE$/);
  const write = client.calls.find(({ sql }) => sql.startsWith("UPDATE characters"))!;
  assert.deepEqual(write.values, [characterId, canonicalTurnBody({ ...save, inventory: { ...save.inventory, mending_draught: 1 } }), canonicalTurnBody(save.location.transform)]);
  const audit = client.calls.find(({ sql }) => sql.startsWith("INSERT INTO audit_events"))!;
  assert.deepEqual(audit.values, [save.identity.accountId, "character.turn_encounter_settled", characterId, '{"encounterId":"encounter.1"}']);

  const invalidClient = new FakeClient();
  const invalidAdapter = new PostgresTurnPersistenceAdapter(new FakePool(invalidClient));
  await assert.rejects(invalidAdapter.transaction([turnCharacterLockKey(characterId)], async (transaction) => {
    await transaction.writeCharacterSave(characterId, { ...save, identity: { ...save.identity, characterId: "33333333-3333-4333-8333-333333333333" } });
  }), /invalid_character_save/);
  assert.equal(invalidClient.calls.some(({ sql }) => sql.startsWith("UPDATE characters")), false);
});

test("turn-combat migration retains old saves and creates globally unique durable ledgers", async () => {
  const rootInvocation = resolve(process.cwd(), "infra/postgres/migrations/0003_turn_combat.sql");
  const sql = await readFile(existsSync(rootInvocation) ? rootInvocation : resolve(process.cwd(), "../../infra/postgres/migrations/0003_turn_combat.sql"), "utf8");
  assert.match(sql, /^--[\s\S]*?\nBEGIN;/);
  assert.match(sql, /COMMIT;\s*$/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS save_v6 jsonb/);
  assert.match(sql, /source jsonb := COALESCE\(save_v5_value, save_v4_value/);
  assert.match(sql, /payload := legacy_payload \|\| source/);
  assert.match(sql, /character_value := CASE WHEN jsonb_typeof\(legacy_payload->'character'\)/);
  assert.match(sql, /jsonb_typeof\(character_value#>'\{attributes,vigor\}'\) = 'number'/);
  assert.match(sql, /ELSE 78 \+ vigor \* 6 END/);
  assert.match(sql, /'transform', jsonb_build_object\(\s*'x', transform_value->'x'/);
  assert.match(sql, /WHEN jsonb_typeof\(payload->'skillXp'\) = 'object'/);
  assert.match(sql, /WHEN jsonb_typeof\(world_state_value->'gathered'\) = 'object'/);
  assert.match(sql, /UPDATE characters\s+SET save_v6 = sable_build_save_v6\(/);
  assert.match(sql, /WHERE save_v6 IS NULL AND \(save_v5 IS NOT NULL OR save_v4 IS NOT NULL\)/);
  assert.match(sql, /activeEncounterDurability', 'excluded_not_crash_recoverable'/);
  assert.match(sql, /characters_save_v6_schema/);
  assert.match(sql, /save_v6 IS NULL OR COALESCE\(\(/);
  assert.match(sql, /save_v6 - ARRAY\[/);
  assert.match(sql, /save_v6->'identity' - ARRAY\['accountId','characterId'\]/);
  assert.match(sql, /NOT \(save_v6 \? 'accountId'\)/);
  assert.match(sql, /save_v6#>>'\{identity,accountId\}' = account_id::text/);
  assert.match(sql, /save_v6#>>'\{identity,characterId\}' = id::text/);
  assert.match(sql, /jsonb_typeof\(save_v6#>'\{location,transform,x\}'\) = 'number'/);
  assert.match(sql, /save_v6#>'\{location,transform\}' = transform/);
  assert.match(sql, /abs\(\(save_v6#>>'\{location,transform,x\}'\)::numeric\) <= 65536/);
  assert.match(sql, /sable_jsonb_nonnegative_number_map\(save_v6->'skillXp'\)/);
  assert.match(sql, /sable_jsonb_nonnegative_number_map\(save_v6->'inventory'\)/);
  assert.match(sql, /sable_jsonb_unique_nonempty_string_array\(save_v6->'discoveries'\)/);
  assert.match(sql, /sable_jsonb_object_array\(save_v6#>'\{worldState,enemies\}'\)/);
  assert.match(sql, /save_v6#>>'\{legacyImport,fingerprint\}' ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(sql, /source->'importedFrom' \|\| jsonb_build_object\('algorithm', 'legacy-fnv1a64x4-v1'\)/);
  assert.match(sql, /save_v6#>>'\{legacyImport,algorithm\}' IN \('sha256', 'legacy-fnv1a64x4-v1'\)/);
  assert.match(sql, /save_v6#>>'\{legacyImport,fingerprint\}' = btrim\(legacy_import_fingerprint\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS turn_command_ledger/);
  assert.match(sql, /PRIMARY KEY \(character_id, command_id\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS turn_encounter_outcome_ledger/);
  assert.match(sql, /PRIMARY KEY \(character_id, encounter_id\)/);
  assert.match(sql, /fingerprint char\(64\) PRIMARY KEY/);
  assert.match(sql, /character_id uuid NOT NULL UNIQUE REFERENCES characters\(id\) ON DELETE RESTRICT/);
  assert.match(sql, /characters_legacy_import_fingerprint_global_idx/);
  assert.match(sql, /INSERT INTO turn_legacy_import_claims/);
  assert.doesNotMatch(sql, /DROP (COLUMN )?save_v[45]/i);
});
