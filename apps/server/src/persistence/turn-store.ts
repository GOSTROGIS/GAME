import { isServerSaveV6, type ServerSaveV6 } from "@hollow-march/shared";

/**
 * Storage seam for turn commands and encounter settlement.
 *
 * A PostgreSQL adapter must acquire every supplied lock key, in the supplied
 * sorted order, using transaction-scoped advisory/row locks before invoking
 * the callback. It also needs unique indexes on (character_id, command_id),
 * (character_id, encounter_id). Transaction callbacks are DB-only: they
 * must not perform network, filesystem, email, or other non-transactional side
 * effects. This is durable settlement, not active-encounter crash recovery.
 */

export type DurableScalar = string | number | boolean | null;
export type DurableValue = DurableScalar | readonly DurableValue[] | { readonly [key: string]: DurableValue };

export interface StoredTurnCommand<TResult extends DurableValue = DurableValue> {
  characterId: string;
  commandId: string;
  canonicalBody: string;
  result: TResult;
  committedAt: string;
}

export interface EncounterOutcomeRecord<TResult extends DurableValue = DurableValue> {
  characterId: string;
  encounterId: string;
  canonicalOutcome: string;
  result: TResult;
  committedAt: string;
}

export interface TurnPersistenceTransaction {
  /** Locks already acquired by the adapter before this callback began. */
  readonly heldLockKeys: ReadonlySet<string>;
  findCommand(characterId: string, commandId: string): Promise<StoredTurnCommand | null>;
  insertCommand(record: StoredTurnCommand): Promise<void>;
  findOutcome(characterId: string, encounterId: string): Promise<EncounterOutcomeRecord | null>;
  insertOutcome(record: EncounterOutcomeRecord): Promise<void>;
  /** Reads the current durable character under turnCharacterLockKey. */
  readCharacterSaveForUpdate(characterId: string): Promise<ServerSaveV6 | null>;
  writeCharacterSave(characterId: string, save: ServerSaveV6): Promise<void>;
  insertAuditEvent(event: { accountId: string | null; kind: string; subjectId: string; detail: Readonly<Record<string, DurableValue>> }): Promise<void>;
}

export interface TurnPersistenceAdapter {
  /** Acquire all sorted lock keys transactionally before invoking operation. */
  transaction<T>(lockKeys: readonly string[], operation: (transaction: TurnPersistenceTransaction) => Promise<T>): Promise<T>;
}

export interface InMemoryTurnCharacterStore {
  readonly characters: Map<string, {
    save: ServerSaveV6 | null;
    transform: ServerSaveV6["location"]["transform"];
    updatedAt: Date;
  }>;
  readonly auditEvents: Array<{ accountId: string | null; kind: string; subjectId: string | null; detail: Record<string, unknown> }>;
}

export type IdempotentCommandDecision<TResult extends DurableValue> =
  | { status: "committed"; result: TResult }
  | { status: "replayed"; result: TResult }
  | { status: "idempotency_conflict"; code: "idempotency_conflict" };

export type OutcomeLedgerDecision<TResult extends DurableValue> =
  | { status: "committed"; result: TResult }
  | { status: "replayed"; result: TResult }
  | { status: "encounter_outcome_conflict"; code: "encounter_outcome_conflict" };

const mapKey = (left: string, right: string): string => `${left}\u0000${right}`;
const commandKey = (characterId: string, commandId: string): string => mapKey(characterId, commandId);
const outcomeKey = (characterId: string, encounterId: string): string => mapKey(characterId, encounterId);

function assertIdentity(value: string, field: string): void {
  if (typeof value !== "string" || !value || value.length > 160 || /[\u0000-\u001f]/.test(value)) throw new Error(`${field} is invalid`);
}

function assertTimestamp(value: string, field: string): void {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error(`${field} is invalid`);
}

function assertLegacyFingerprint(value: string): void {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new Error("fingerprint is invalid");
}

const lockSegment = (value: string): string => encodeURIComponent(value);
export const turnCommandLockKey = (characterId: string, commandId: string): string => `turn-command:${lockSegment(characterId)}:${lockSegment(commandId)}`;
export const encounterOutcomeLockKey = (characterId: string, encounterId: string): string => `encounter-outcome:${lockSegment(characterId)}:${lockSegment(encounterId)}`;
export const turnCharacterLockKey = (characterId: string): string => `turn-character:${lockSegment(characterId)}`;
export const legacyCharacterLockKey = (characterId: string): string => `legacy-character:${lockSegment(characterId)}`;
export const legacyFingerprintLockKey = (fingerprint: string): string => {
  assertLegacyFingerprint(fingerprint);
  return `legacy-fingerprint:${lockSegment(fingerprint)}`;
};

export function sortedPersistenceLockKeys(lockKeys: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const key of lockKeys) {
    if (typeof key !== "string" || !key || key.length > 512 || /[\u0000-\u001f]/.test(key)) throw new Error("persistence lock key is invalid");
    unique.add(key);
  }
  return [...unique].sort((a, b) => a === b ? 0 : a < b ? -1 : 1);
}

function assertSortedUniqueLockKeys(lockKeys: readonly string[]): void {
  const canonical = sortedPersistenceLockKeys(lockKeys);
  if (canonical.length !== lockKeys.length || canonical.some((key, index) => key !== lockKeys[index])) throw new Error("persistence lock keys must be sorted and unique");
}

function requireHeldLock(transaction: TurnPersistenceTransaction, lockKey: string): void {
  if (!transaction.heldLockKeys.has(lockKey)) throw new Error(`transaction did not acquire required lock ${lockKey}`);
}

/** Canonical JSON makes object key order irrelevant while preserving array order. */
export function canonicalTurnBody(value: unknown): string {
  const ancestors = new Set<object>();
  const visit = (candidate: unknown): string => {
    if (candidate === null) return "null";
    if (typeof candidate === "string" || typeof candidate === "boolean") return JSON.stringify(candidate);
    if (typeof candidate === "number") {
      if (!Number.isFinite(candidate)) throw new Error("Durable command data must contain only finite numbers");
      return JSON.stringify(Object.is(candidate, -0) ? 0 : candidate);
    }
    if (Array.isArray(candidate)) {
      for (let index = 0; index < candidate.length; index += 1) if (!Object.hasOwn(candidate, index)) throw new Error("Durable command data cannot contain sparse arrays");
      if (ancestors.has(candidate)) throw new Error("Durable command data cannot be cyclic");
      ancestors.add(candidate);
      const result = `[${candidate.map(visit).join(",")}]`;
      ancestors.delete(candidate);
      return result;
    }
    if (candidate && typeof candidate === "object") {
      const prototype = Object.getPrototypeOf(candidate);
      if (prototype !== Object.prototype && prototype !== null) throw new Error("Durable command data must use plain JSON objects");
      if (ancestors.has(candidate)) throw new Error("Durable command data cannot be cyclic");
      ancestors.add(candidate);
      const source = candidate as Record<string, unknown>;
      const entries = Object.keys(source).sort().map((key) => {
        const child = source[key];
        if (child === undefined || typeof child === "function" || typeof child === "symbol" || typeof child === "bigint") throw new Error(`Durable command data contains unsupported value at ${key}`);
        return `${JSON.stringify(key)}:${visit(child)}`;
      });
      ancestors.delete(candidate);
      return `{${entries.join(",")}}`;
    }
    throw new Error("Durable command data contains an unsupported value");
  };
  return visit(value);
}

function cloneDurable<T extends DurableValue>(value: T): T {
  return JSON.parse(canonicalTurnBody(value)) as T;
}

export function decideCommandReplay<TResult extends DurableValue>(existing: StoredTurnCommand<TResult> | null, canonicalBody: string): "execute" | "replay" | "conflict" {
  if (!existing) return "execute";
  return existing.canonicalBody === canonicalBody ? "replay" : "conflict";
}

export async function executeIdempotentTurnCommand<TResult extends DurableValue>(
  adapter: TurnPersistenceAdapter,
  command: { characterId: string; commandId: string; body: unknown; committedAt: string; additionalLockKeys?: readonly string[] },
  /** DB-only callback; all needed additional locks must be declared above. */
  execute: (transaction: TurnPersistenceTransaction) => Promise<TResult>,
): Promise<IdempotentCommandDecision<TResult>> {
  assertIdentity(command.characterId, "characterId");
  assertIdentity(command.commandId, "commandId");
  assertTimestamp(command.committedAt, "committedAt");
  const canonicalBody = canonicalTurnBody(command.body);
  const requiredLock = turnCommandLockKey(command.characterId, command.commandId);
  const lockKeys = sortedPersistenceLockKeys([requiredLock, ...(command.additionalLockKeys ?? [])]);
  return adapter.transaction(lockKeys, async (transaction) => {
    requireHeldLock(transaction, requiredLock);
    const existing = await transaction.findCommand(command.characterId, command.commandId) as StoredTurnCommand<TResult> | null;
    const decision = decideCommandReplay(existing, canonicalBody);
    if (decision === "conflict") return { status: "idempotency_conflict", code: "idempotency_conflict" };
    if (decision === "replay") return { status: "replayed", result: cloneDurable(existing!.result) };
    const result = cloneDurable(await execute(transaction));
    await transaction.insertCommand({ characterId: command.characterId, commandId: command.commandId, canonicalBody, result, committedAt: command.committedAt });
    return { status: "committed", result: cloneDurable(result) };
  });
}

export function decideOutcomeWrite<TResult extends DurableValue>(existing: EncounterOutcomeRecord<TResult> | null, canonicalOutcome: string): "insert" | "replay" | "conflict" {
  if (!existing) return "insert";
  return existing.canonicalOutcome === canonicalOutcome ? "replay" : "conflict";
}

export async function recordEncounterOutcome<TResult extends DurableValue>(
  adapter: TurnPersistenceAdapter,
  input: { characterId: string; encounterId: string; result: TResult; committedAt: string },
): Promise<OutcomeLedgerDecision<TResult>> {
  assertIdentity(input.characterId, "characterId");
  assertIdentity(input.encounterId, "encounterId");
  assertTimestamp(input.committedAt, "committedAt");
  const lockKey = encounterOutcomeLockKey(input.characterId, input.encounterId);
  return adapter.transaction(sortedPersistenceLockKeys([lockKey]), async (transaction) => recordEncounterOutcomeInTransaction(transaction, input));
}

/** Caller must declare encounterOutcomeLockKey in its enclosing transaction. */
export async function recordEncounterOutcomeInTransaction<TResult extends DurableValue>(
  transaction: TurnPersistenceTransaction,
  input: { characterId: string; encounterId: string; result: TResult; committedAt: string },
): Promise<OutcomeLedgerDecision<TResult>> {
  assertIdentity(input.characterId, "characterId");
  assertIdentity(input.encounterId, "encounterId");
  assertTimestamp(input.committedAt, "committedAt");
  requireHeldLock(transaction, encounterOutcomeLockKey(input.characterId, input.encounterId));
  const canonicalOutcome = canonicalTurnBody(input.result);
  const existing = await transaction.findOutcome(input.characterId, input.encounterId) as EncounterOutcomeRecord<TResult> | null;
  const decision = decideOutcomeWrite(existing, canonicalOutcome);
  if (decision === "conflict") return { status: "encounter_outcome_conflict", code: "encounter_outcome_conflict" };
  if (decision === "replay") return { status: "replayed", result: cloneDurable(existing!.result) };
  const result = cloneDurable(input.result);
  await transaction.insertOutcome({ characterId: input.characterId, encounterId: input.encounterId, canonicalOutcome, result, committedAt: input.committedAt });
  return { status: "committed", result: cloneDurable(result) };
}

export class InMemoryTurnPersistence implements TurnPersistenceAdapter {
  #commands = new Map<string, StoredTurnCommand>();
  #outcomes = new Map<string, EncounterOutcomeRecord>();
  #characterSaves = new Map<string, ServerSaveV6>();
  #auditEvents: Array<{ accountId: string | null; kind: string; subjectId: string; detail: Readonly<Record<string, DurableValue>> }> = [];
  #tail: Promise<void> = Promise.resolve();

  constructor(private readonly characterStore: InMemoryTurnCharacterStore | null = null) {}

  async transaction<T>(lockKeys: readonly string[], operation: (transaction: TurnPersistenceTransaction) => Promise<T>): Promise<T> {
    assertSortedUniqueLockKeys(lockKeys);
    const previous = this.#tail;
    let release!: () => void;
    this.#tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const commands = new Map(this.#commands);
    const outcomes = new Map(this.#outcomes);
    const characterSaves = new Map([...this.#characterSaves].map(([id, save]) => [id, structuredClone(save)]));
    for (const [id, character] of this.characterStore?.characters ?? []) if (character.save) characterSaves.set(id, structuredClone(character.save));
    const auditEvents = structuredClone(this.#auditEvents);
    const existingAuditCount = auditEvents.length;
    const heldLockKeys = new Set(lockKeys);
    const transaction: TurnPersistenceTransaction = {
      heldLockKeys,
      findCommand: async (characterId, commandId) => {
        requireHeldLock(transaction, turnCommandLockKey(characterId, commandId));
        return cloneStored(commands.get(commandKey(characterId, commandId)) ?? null);
      },
      insertCommand: async (record) => {
        requireHeldLock(transaction, turnCommandLockKey(record.characterId, record.commandId));
        const key = commandKey(record.characterId, record.commandId);
        if (commands.has(key)) throw new Error("turn_command_unique_violation");
        commands.set(key, cloneStored(record)!);
      },
      findOutcome: async (characterId, encounterId) => {
        requireHeldLock(transaction, encounterOutcomeLockKey(characterId, encounterId));
        return cloneStored(outcomes.get(outcomeKey(characterId, encounterId)) ?? null);
      },
      insertOutcome: async (record) => {
        requireHeldLock(transaction, encounterOutcomeLockKey(record.characterId, record.encounterId));
        const key = outcomeKey(record.characterId, record.encounterId);
        if (outcomes.has(key)) throw new Error("encounter_outcome_unique_violation");
        outcomes.set(key, cloneStored(record)!);
      },
      readCharacterSaveForUpdate: async (characterId) => {
        requireHeldLock(transaction, turnCharacterLockKey(characterId));
        return structuredClone(characterSaves.get(characterId) ?? null);
      },
      writeCharacterSave: async (characterId, save) => {
        requireHeldLock(transaction, turnCharacterLockKey(characterId));
        if (!isServerSaveV6(save) || save.identity.characterId !== characterId) throw new Error("invalid_character_save");
        characterSaves.set(characterId, structuredClone(save));
      },
      insertAuditEvent: async (event) => {
        requireHeldLock(transaction, turnCharacterLockKey(event.subjectId));
        canonicalTurnBody(event.detail);
        auditEvents.push(structuredClone(event));
      },
    };
    try {
      const result = await operation(transaction);
      this.#commands = commands; this.#outcomes = outcomes; this.#characterSaves = characterSaves; this.#auditEvents = auditEvents;
      if (this.characterStore) {
        for (const [id, save] of characterSaves) {
          const character = this.characterStore.characters.get(id);
          if (!character) continue;
          character.save = structuredClone(save);
          character.transform = structuredClone(save.location.transform);
          character.updatedAt = new Date(save.savedAt);
        }
        for (const event of auditEvents.slice(existingAuditCount)) this.characterStore.auditEvents.push(structuredClone(event));
      }
      return result;
    } finally {
      release();
    }
  }

  characterSave(characterId: string): ServerSaveV6 | null { return structuredClone(this.#characterSaves.get(characterId) ?? null); }
  seedCharacterSave(save: ServerSaveV6): void {
    const characterId = save.identity.characterId;
    if (!isServerSaveV6(save) || !characterId) throw new Error("invalid_character_save");
    this.#characterSaves.set(characterId, structuredClone(save));
  }
  auditEvents(): readonly { accountId: string | null; kind: string; subjectId: string; detail: Readonly<Record<string, DurableValue>> }[] { return structuredClone(this.#auditEvents); }
}

function cloneStored<T extends StoredTurnCommand | EncounterOutcomeRecord>(value: T | null): T | null {
  if (!value) return null;
  return { ...value, result: cloneDurable(value.result) } as T;
}
