import assert from "node:assert/strict";
import test from "node:test";
import type { Pool } from "pg";
import { DEFAULT_APPEARANCE_V2, migrateLegacySaveV3ToV6 } from "@hollow-march/shared";
import { PostgresGameRepository, withTransaction } from "../src/persistence/postgres.js";

interface SqlCall { sql: string; values: readonly unknown[] }

const compact = (sql: string): string => sql.replace(/\s+/g, " ").trim();

class FakeClient {
  readonly calls: SqlCall[] = [];
  releases = 0;
  constructor(readonly respond: (sql: string, values: readonly unknown[]) => readonly Record<string, unknown>[] = () => []) {}
  async query(text: string, values: readonly unknown[] = []): Promise<{ rows: readonly Record<string, unknown>[] }> {
    const sql = compact(text);
    this.calls.push({ sql, values: [...values] });
    return { rows: this.respond(sql, values) };
  }
  release(): void { this.releases += 1; }
}

class FakePool {
  readonly directCalls: SqlCall[] = [];
  ends = 0;
  constructor(readonly client: FakeClient) {}
  async connect(): Promise<FakeClient> { return this.client; }
  async query(text: string, values: readonly unknown[] = []): Promise<{ rows: readonly Record<string, unknown>[] }> {
    const sql = compact(text);
    this.directCalls.push({ sql, values: [...values] });
    return { rows: this.client.respond(sql, values) };
  }
  async end(): Promise<void> { this.ends += 1; }
}

const accountId = "11111111-1111-4111-8111-111111111111";
const characterId = "22222222-2222-4222-8222-222222222222";
const savedAt = "2026-08-25T12:00:00.000Z";
const makeSave = () => migrateLegacySaveV3ToV6(
  { version: 3, player: { x: 3, y: 5 }, character: { name: "After" } },
  savedAt,
  { accountId, characterId },
);

test("Postgres legacy import claims, character update, and audit commit in one locked transaction", async () => {
  const client = new FakeClient((sql, values) => {
    if (sql.startsWith("SELECT legacy_import_fingerprint FROM characters")) return [{ legacy_import_fingerprint: null }];
    if (sql.includes("FROM turn_legacy_import_claims")) return [];
    if (sql.startsWith("UPDATE characters SET name=")) return [{
      id: values[0], account_id: values[1], name: values[2], appearance: values[3], transform: values[4],
      public_phase_mask: 1, personal_phase_mask: 1, save_v6: values[5], legacy_import_fingerprint: values[6],
      created_at: savedAt, updated_at: savedAt,
    }];
    return [];
  });
  const pool = new FakePool(client);
  const repository = new PostgresGameRepository(pool as unknown as Pool);
  const save = makeSave();
  const result = await repository.importLegacySaveOnce(characterId, accountId, save);

  assert.deepEqual(result.save?.identity, { accountId, characterId });
  assert.deepEqual(result.transform, save.location.transform);
  const statements = client.calls.map(({ sql }) => sql);
  assert.equal(statements[0], "BEGIN");
  assert.equal(statements.filter((sql) => sql.startsWith("SELECT pg_advisory_xact_lock")).length, 2);
  assert.ok(statements.some((sql) => sql.startsWith("INSERT INTO turn_legacy_import_claims")));
  const auditIndex = statements.findIndex((sql) => sql.startsWith("INSERT INTO audit_events"));
  const commitIndex = statements.indexOf("COMMIT");
  assert.ok(auditIndex > 0 && auditIndex < commitIndex, "audit insertion must succeed before the import commits");
  assert.equal(statements.includes("ROLLBACK"), false);
  assert.equal(client.releases, 1);
});

test("Postgres import audit failure rolls back and reports the original failure", async () => {
  const auditFailure = new Error("audit unavailable");
  const client = new FakeClient((sql, values) => {
    if (sql.startsWith("SELECT legacy_import_fingerprint FROM characters")) return [{ legacy_import_fingerprint: null }];
    if (sql.includes("FROM turn_legacy_import_claims")) return [];
    if (sql.startsWith("UPDATE characters SET name=")) return [{
      id: values[0], account_id: values[1], name: values[2], appearance: values[3], transform: values[4],
      public_phase_mask: 1, personal_phase_mask: 1, save_v6: values[5], legacy_import_fingerprint: values[6],
      created_at: savedAt, updated_at: savedAt,
    }];
    if (sql.startsWith("INSERT INTO audit_events")) throw auditFailure;
    return [];
  });
  const repository = new PostgresGameRepository(new FakePool(client) as unknown as Pool);
  await assert.rejects(repository.importLegacySaveOnce(characterId, accountId, makeSave()), (error: unknown) => {
    assert.strictEqual(error, auditFailure);
    return true;
  });
  assert.equal(client.calls.some(({ sql }) => sql === "ROLLBACK"), true);
  assert.equal(client.calls.some(({ sql }) => sql === "COMMIT"), false);
});

test("Postgres import does not misreport an unrelated unique violation as legacy replay", async () => {
  const nameCollision = Object.assign(new Error("character name already exists"), {
    code: "23505",
    constraint: "characters_account_id_name_key",
  });
  const client = new FakeClient((sql) => {
    if (sql.startsWith("SELECT legacy_import_fingerprint FROM characters")) return [{ legacy_import_fingerprint: null }];
    if (sql.includes("FROM turn_legacy_import_claims")) return [];
    if (sql.startsWith("UPDATE characters SET name=")) throw nameCollision;
    return [];
  });
  const repository = new PostgresGameRepository(new FakePool(client) as unknown as Pool);
  await assert.rejects(repository.importLegacySaveOnce(characterId, accountId, makeSave()), (error: unknown) => {
    assert.strictEqual(error, nameCollision);
    return true;
  });
  assert.equal(client.calls.some(({ sql }) => sql === "ROLLBACK"), true);
});

test("Postgres movement keeps save_v6 location synchronized with the authoritative transform", async () => {
  const pool = new FakePool(new FakeClient());
  const repository = new PostgresGameRepository(pool as unknown as Pool);
  const transform = { x: 19, y: 2, z: 31, yaw: 0.75 };
  await repository.updateCharacterTransform(characterId, transform);
  assert.equal(pool.directCalls.length, 1);
  assert.match(pool.directCalls[0]!.sql, /jsonb_set\(save_v6, '\{location,transform\}', \$2::jsonb, true\)/);
  assert.deepEqual(pool.directCalls[0]!.values, [characterId, transform]);
});

test("generic Postgres transactions preserve the original error when rollback also fails", async () => {
  const original = new Error("write failed");
  const rollbackFailure = new Error("rollback failed");
  const client = new FakeClient((sql) => { if (sql === "ROLLBACK") throw rollbackFailure; return []; });
  await assert.rejects(withTransaction(new FakePool(client) as unknown as Pool, async () => { throw original; }), (error: unknown) => {
    assert.strictEqual(error, original);
    assert.strictEqual((error as Error & { rollbackError?: unknown }).rollbackError, rollbackFailure);
    return true;
  });
});

test("Postgres import binds authenticated ownership even when the caller supplies a different V6 identity", async () => {
  const save = makeSave();
  save.identity = { accountId: "untrusted-account", characterId: "untrusted-character" };
  const client = new FakeClient((sql, values) => {
    if (sql.startsWith("SELECT legacy_import_fingerprint FROM characters")) return [{ legacy_import_fingerprint: null }];
    if (sql.includes("FROM turn_legacy_import_claims")) return [];
    if (sql.startsWith("UPDATE characters SET name=")) return [{
      id: values[0], account_id: values[1], name: values[2], appearance: values[3] ?? DEFAULT_APPEARANCE_V2, transform: values[4],
      public_phase_mask: 1, personal_phase_mask: 1, save_v6: values[5], legacy_import_fingerprint: values[6],
      created_at: savedAt, updated_at: savedAt,
    }];
    return [];
  });
  const repository = new PostgresGameRepository(new FakePool(client) as unknown as Pool);
  const imported = await repository.importLegacySaveOnce(characterId, accountId, save);
  assert.deepEqual(imported.save?.identity, { accountId, characterId });
});

test("Postgres repository never closes an injected pool it does not own", async () => {
  const pool = new FakePool(new FakeClient());
  const repository = new PostgresGameRepository(pool as unknown as Pool);
  await repository.close();
  assert.equal(pool.ends, 0);
});

test("frozen primary errors survive a simultaneous rollback failure", async () => {
  const primary = Object.freeze(new Error("frozen primary"));
  const client = new FakeClient((sql) => { if (sql === "ROLLBACK") throw new Error("rollback also failed"); return []; });
  await assert.rejects(withTransaction(new FakePool(client) as unknown as Pool, async () => { throw primary; }), (error: unknown) => {
    assert.strictEqual(error, primary);
    return true;
  });
});
