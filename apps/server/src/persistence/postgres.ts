import { Pool, type PoolClient } from "pg";
import { migrateServerSaveToV6, type AppearanceV2, type ServerSaveV6, type WorldTransform } from "@hollow-march/shared";
import { legacyCharacterLockKey, legacyFingerprintLockKey, sortedPersistenceLockKeys } from "./turn-store.js";
import { LegacyImportConflictError, type AccountRecord, type CharacterRecord, type GameRepository, type NewCharacter, type SessionRecord } from "./types.js";

type Row = Record<string, unknown>;

const date = (value: unknown): Date => value instanceof Date ? value : new Date(String(value));
const saveFromRow = (row: Row): ServerSaveV6 | null => {
  const source = row.save_v6 ?? row.save_v5 ?? row.save_v4;
  return source == null ? null : migrateServerSaveToV6(source, date(row.updated_at).toISOString(), { accountId: String(row.account_id), characterId: String(row.id) });
};

const characterFromRow = (row: Row): CharacterRecord => ({
  id: String(row.id),
  accountId: String(row.account_id),
  name: String(row.name),
  appearance: row.appearance as AppearanceV2,
  transform: row.transform as WorldTransform,
  publicPhaseMask: Number(row.public_phase_mask),
  personalPhaseMask: Number(row.personal_phase_mask),
  save: saveFromRow(row),
  legacyImportFingerprint: row.legacy_import_fingerprint === null ? null : String(row.legacy_import_fingerprint),
  createdAt: date(row.created_at),
  updatedAt: date(row.updated_at),
});

export class PostgresGameRepository implements GameRepository {
  readonly pool: Pool;
  readonly #ownsPool: boolean;
  constructor(source: string | Pool) {
    this.#ownsPool = typeof source === "string";
    this.pool = this.#ownsPool ? new Pool({ connectionString: source as string, max: 20, statement_timeout: 5_000 }) : source as Pool;
  }

  async putMagicLink(email: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query("INSERT INTO magic_link_tokens (token_hash, email, expires_at) VALUES ($1, $2, $3)", [tokenHash, email, expiresAt]);
  }

  async consumeMagicLink(tokenHash: string, now: Date): Promise<AccountRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const tokenResult = await client.query<Row>("SELECT email FROM magic_link_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>$2 FOR UPDATE", [tokenHash, now]);
      const token = tokenResult.rows[0];
      if (!token) { await client.query("ROLLBACK"); return null; }
      await client.query("UPDATE magic_link_tokens SET used_at=$2 WHERE token_hash=$1", [tokenHash, now]);
      const accountResult = await client.query<Row>(
        "INSERT INTO accounts (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id,email,created_at",
        [token.email],
      );
      await client.query("COMMIT");
      const row = accountResult.rows[0]!;
      return { id: String(row.id), email: String(row.email), createdAt: date(row.created_at) };
    } catch (error) { await rollbackPreservingOriginal(client, error); throw error; }
    finally { client.release(); }
  }

  async putSession(tokenHash: string, accountId: string, expiresAt: Date): Promise<void> {
    await this.pool.query("INSERT INTO sessions (token_hash, account_id, expires_at) VALUES ($1,$2,$3)", [tokenHash, accountId, expiresAt]);
  }

  async findSession(tokenHash: string, now: Date): Promise<SessionRecord | null> {
    const result = await this.pool.query<Row>("SELECT account_id,expires_at FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>$2", [tokenHash, now]);
    const row = result.rows[0];
    return row ? { accountId: String(row.account_id), expiresAt: date(row.expires_at) } : null;
  }

  async listCharacters(accountId: string): Promise<CharacterRecord[]> {
    const result = await this.pool.query<Row>("SELECT * FROM characters WHERE account_id=$1 ORDER BY created_at", [accountId]);
    return result.rows.map(characterFromRow);
  }

  async getCharacter(characterId: string): Promise<CharacterRecord | null> {
    const result = await this.pool.query<Row>("SELECT * FROM characters WHERE id=$1", [characterId]);
    return result.rows[0] ? characterFromRow(result.rows[0]) : null;
  }

  async createCharacter(input: NewCharacter): Promise<CharacterRecord> {
    const result = await this.pool.query<Row>(
      "INSERT INTO characters (account_id,name,appearance,transform,public_phase_mask,personal_phase_mask) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [input.accountId, input.name, input.appearance, input.transform, input.publicPhaseMask, input.personalPhaseMask],
    );
    return characterFromRow(result.rows[0]!);
  }

  async updateCharacterTransform(characterId: string, transform: WorldTransform): Promise<void> {
    await this.pool.query(
      `UPDATE characters
          SET transform=$2,
              save_v6=CASE WHEN save_v6 IS NULL THEN NULL ELSE jsonb_set(save_v6, '{location,transform}', $2::jsonb, true) END,
              updated_at=now()
        WHERE id=$1`,
      [characterId, transform],
    );
  }

  async importLegacySaveOnce(characterId: string, accountId: string, save: ServerSaveV6): Promise<CharacterRecord> {
    const fingerprint = save.legacyImport?.fingerprint;
    if (!fingerprint) throw new Error("Imported save requires a legacy fingerprint");
    const lockKeys = sortedPersistenceLockKeys([
      legacyCharacterLockKey(characterId),
      legacyFingerprintLockKey(fingerprint),
    ]);
    const boundSave: ServerSaveV6 = { ...save, identity: { accountId, characterId } };
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const lockKey of lockKeys) await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [lockKey]);
      const locked = await client.query<Row>("SELECT legacy_import_fingerprint FROM characters WHERE id=$1 AND account_id=$2 FOR UPDATE", [characterId, accountId]);
      if (!locked.rows[0]) throw new Error("Character not found");
      if (locked.rows[0].legacy_import_fingerprint) throw new LegacyImportConflictError();
      const byCharacter = await client.query<Row>(
        "SELECT account_id,character_id,fingerprint FROM turn_legacy_import_claims WHERE character_id=$1",
        [characterId],
      );
      const byFingerprint = await client.query<Row>(
        "SELECT account_id,character_id,fingerprint FROM turn_legacy_import_claims WHERE fingerprint=$1",
        [fingerprint],
      );
      const claims = [byCharacter.rows[0], byFingerprint.rows[0]].filter((row): row is Row => Boolean(row));
      if (claims.some((row) => String(row.account_id) !== accountId || String(row.character_id) !== characterId || String(row.fingerprint) !== fingerprint)) throw new LegacyImportConflictError();
      if (claims.length === 0) {
        await client.query(
          "INSERT INTO turn_legacy_import_claims (fingerprint,account_id,character_id,claimed_at) VALUES ($1,$2,$3,$4)",
          [fingerprint, accountId, characterId, save.legacyImport!.importedAt],
        );
      }
      const result = await client.query<Row>(
        "UPDATE characters SET name=$3,appearance=$4,transform=$5,save_v6=$6,legacy_import_fingerprint=$7,legacy_imported_at=now(),updated_at=now() WHERE id=$1 AND account_id=$2 RETURNING *",
        [characterId, accountId, String(boundSave.character.name), boundSave.appearance, boundSave.location.transform, boundSave, fingerprint],
      );
      await client.query(
        "INSERT INTO audit_events (account_id,kind,subject_id,detail) VALUES ($1,$2,$3,$4)",
        [accountId, "character.legacy_import", characterId, { fingerprint }],
      );
      const character = characterFromRow(result.rows[0]!);
      await client.query("COMMIT");
      return character;
    } catch (error) {
      await rollbackPreservingOriginal(client, error);
      if (isLegacyImportUniqueViolation(error)) {
        const conflict = new LegacyImportConflictError();
        Object.defineProperty(conflict, "cause", { value: error, enumerable: false });
        const rollbackError = readRollbackError(error);
        if (rollbackError !== undefined) attachRollbackError(conflict, rollbackError);
        throw conflict;
      }
      throw error;
    } finally { client.release(); }
  }

  async appendAuditEvent(event: { accountId: string | null; kind: string; subjectId: string | null; detail: Record<string, unknown> }): Promise<void> {
    await this.pool.query("INSERT INTO audit_events (account_id,kind,subject_id,detail) VALUES ($1,$2,$3,$4)", [event.accountId, event.kind, event.subjectId, event.detail]);
  }
  async health(): Promise<boolean> { try { await this.pool.query("SELECT 1"); return true; } catch { return false; } }
  async close(): Promise<void> { if (this.#ownsPool) await this.pool.end(); }
}

const LEGACY_IMPORT_UNIQUE_CONSTRAINTS = new Set([
  "turn_legacy_import_claims_pkey",
  "turn_legacy_import_claims_character_id_key",
  "characters_legacy_import_fingerprint_global_idx",
  "characters_account_id_legacy_import_fingerprint_key",
]);

function isLegacyImportUniqueViolation(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object"
    && "code" in error && (error as { code?: string }).code === "23505"
    && "constraint" in error && LEGACY_IMPORT_UNIQUE_CONSTRAINTS.has(String((error as { constraint?: unknown }).constraint)),
  );
}

export async function withTransaction<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const value = await operation(client); await client.query("COMMIT"); return value; }
  catch (error) { await rollbackPreservingOriginal(client, error); throw error; }
  finally { client.release(); }
}

async function rollbackPreservingOriginal(client: Pick<PoolClient, "query">, error: unknown): Promise<void> {
  try { await client.query("ROLLBACK"); }
  catch (rollbackError) { attachRollbackError(error, rollbackError); }
}

function attachRollbackError(error: unknown, rollbackError: unknown): void {
  try {
    if (error && typeof error === "object" && Object.isExtensible(error)) Object.defineProperty(error, "rollbackError", { value: rollbackError, enumerable: false });
  } catch { /* Rollback diagnostics must never replace the primary failure. */ }
}

function readRollbackError(error: unknown): unknown {
  try { return error && typeof error === "object" && "rollbackError" in error ? (error as { rollbackError?: unknown }).rollbackError : undefined; }
  catch { return undefined; }
}
