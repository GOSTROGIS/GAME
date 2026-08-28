import { Pool } from "pg";
import { isServerSaveV6, type ServerSaveV6 } from "@hollow-march/shared";
import {
  canonicalTurnBody,
  encounterOutcomeLockKey,
  sortedPersistenceLockKeys,
  turnCharacterLockKey,
  turnCommandLockKey,
  type DurableValue,
  type EncounterOutcomeRecord,
  type StoredTurnCommand,
  type TurnPersistenceAdapter,
  type TurnPersistenceTransaction,
} from "./turn-store.js";

type SqlRow = Record<string, unknown>;

export interface TurnSqlQueryResult {
  readonly rows: readonly SqlRow[];
}

/** Minimal PoolClient surface, intentionally easy to fake in focused tests. */
export interface TurnSqlClient {
  query(text: string, values?: readonly unknown[]): Promise<TurnSqlQueryResult>;
  release(): void;
}

export interface TurnSqlPool {
  connect(): Promise<TurnSqlClient>;
}

function exactSortedLocks(lockKeys: readonly string[]): string[] {
  const sorted = sortedPersistenceLockKeys(lockKeys);
  if (sorted.length !== lockKeys.length || sorted.some((key, index) => key !== lockKeys[index])) throw new Error("PostgreSQL turn transaction requires sorted unique lock keys");
  return sorted;
}

function timestamp(value: unknown, field: string): string {
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!Number.isFinite(Date.parse(text))) throw new Error(`${field} returned an invalid timestamp`);
  return text;
}

function durableValue(value: unknown, field: string): DurableValue {
  try { return JSON.parse(canonicalTurnBody(value)) as DurableValue; }
  catch (error) { throw new Error(`${field} returned invalid durable JSON`, { cause: error }); }
}

function commandFromRow(row: SqlRow): StoredTurnCommand {
  return {
    characterId: String(row.character_id),
    commandId: String(row.command_id),
    canonicalBody: String(row.canonical_body),
    result: durableValue(row.result, "turn command result"),
    committedAt: timestamp(row.committed_at, "turn command committed_at"),
  };
}

function outcomeFromRow(row: SqlRow): EncounterOutcomeRecord {
  return {
    characterId: String(row.character_id),
    encounterId: String(row.encounter_id),
    canonicalOutcome: String(row.canonical_outcome),
    result: durableValue(row.result, "encounter outcome result"),
    committedAt: timestamp(row.committed_at, "encounter outcome committed_at"),
  };
}

function characterSaveFromRow(row: SqlRow, characterId: string): ServerSaveV6 | null {
  if (row.save_v6 === null || row.save_v6 === undefined) return null;
  const save = row.save_v6;
  if (!isServerSaveV6(save) || save.identity.characterId !== characterId) throw new Error("character save returned invalid ServerSaveV6");
  return structuredClone(save);
}

function transactionFacade(client: TurnSqlClient, lockKeys: readonly string[]): TurnPersistenceTransaction {
  const heldLockKeys = new Set(lockKeys);
  const requireHeld = (lockKey: string): void => {
    if (!heldLockKeys.has(lockKey)) throw new Error(`PostgreSQL turn transaction did not acquire required lock ${lockKey}`);
  };
  return {
    heldLockKeys,
    async findCommand(characterId, commandId) {
      requireHeld(turnCommandLockKey(characterId, commandId));
      const result = await client.query(
        `SELECT character_id, command_id, canonical_body, result, committed_at
           FROM turn_command_ledger
          WHERE character_id = $1 AND command_id = $2`,
        [characterId, commandId],
      );
      return result.rows[0] ? commandFromRow(result.rows[0]) : null;
    },
    async insertCommand(record) {
      requireHeld(turnCommandLockKey(record.characterId, record.commandId));
      await client.query(
        `INSERT INTO turn_command_ledger
           (character_id, command_id, canonical_body, result, committed_at)
         VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [record.characterId, record.commandId, record.canonicalBody, canonicalTurnBody(record.result), record.committedAt],
      );
    },
    async findOutcome(characterId, encounterId) {
      requireHeld(encounterOutcomeLockKey(characterId, encounterId));
      const result = await client.query(
        `SELECT character_id, encounter_id, canonical_outcome, result, committed_at
           FROM turn_encounter_outcome_ledger
          WHERE character_id = $1 AND encounter_id = $2`,
        [characterId, encounterId],
      );
      return result.rows[0] ? outcomeFromRow(result.rows[0]) : null;
    },
    async insertOutcome(record) {
      requireHeld(encounterOutcomeLockKey(record.characterId, record.encounterId));
      await client.query(
        `INSERT INTO turn_encounter_outcome_ledger
           (character_id, encounter_id, canonical_outcome, result, committed_at)
         VALUES ($1, $2, $3, $4::jsonb, $5)`,
        [record.characterId, record.encounterId, record.canonicalOutcome, canonicalTurnBody(record.result), record.committedAt],
      );
    },
    async readCharacterSaveForUpdate(characterId) {
      requireHeld(turnCharacterLockKey(characterId));
      const result = await client.query(
        `SELECT save_v6
           FROM characters
          WHERE id = $1
          FOR UPDATE`,
        [characterId],
      );
      if (!result.rows[0]) throw new Error("character_not_found");
      return characterSaveFromRow(result.rows[0], characterId);
    },
    async writeCharacterSave(characterId, save) {
      requireHeld(turnCharacterLockKey(characterId));
      if (!isServerSaveV6(save) || save.identity.characterId !== characterId) throw new Error("invalid_character_save");
      const result = await client.query(
        `UPDATE characters
            SET save_v6 = $2::jsonb,
                transform = $3::jsonb,
                updated_at = now()
          WHERE id = $1
          RETURNING id`,
        [characterId, canonicalTurnBody(save), canonicalTurnBody(save.location.transform)],
      );
      if (!result.rows[0]) throw new Error("character_not_found");
    },
    async insertAuditEvent(event) {
      requireHeld(turnCharacterLockKey(event.subjectId));
      await client.query(
        `INSERT INTO audit_events (account_id, kind, subject_id, detail)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [event.accountId, event.kind, event.subjectId, canonicalTurnBody(event.detail)],
      );
    },
  };
}

export class PostgresTurnPersistenceAdapter implements TurnPersistenceAdapter {
  readonly #pool: TurnSqlPool;
  readonly #ownedPool: Pool | null;

  constructor(source: string | Pool | TurnSqlPool) {
    this.#ownedPool = typeof source === "string" ? new Pool({ connectionString: source, max: 20, statement_timeout: 5_000 }) : null;
    this.#pool = (this.#ownedPool ?? source) as unknown as TurnSqlPool;
  }

  /**
   * The callback runs only after all transaction-scoped locks are held. It must
   * remain DB-only because external side effects cannot be rolled back.
   */
  async transaction<T>(lockKeys: readonly string[], operation: (transaction: TurnPersistenceTransaction) => Promise<T>): Promise<T> {
    const sortedLocks = exactSortedLocks(lockKeys);
    const client = await this.#pool.connect();
    let began = false;
    try {
      await client.query("BEGIN");
      began = true;
      for (const lockKey of sortedLocks) await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [lockKey]);
      const result = await operation(transactionFacade(client, sortedLocks));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      if (began) {
        try { await client.query("ROLLBACK"); }
        catch (rollbackError) { attachRollbackError(error, rollbackError); }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.#ownedPool) await this.#ownedPool.end();
  }
}

function attachRollbackError(error: unknown, rollbackError: unknown): void {
  try {
    if (error && typeof error === "object" && Object.isExtensible(error)) Object.defineProperty(error, "rollbackError", { value: rollbackError, enumerable: false });
  } catch { /* Rollback diagnostics must never replace the primary failure. */ }
}
