import { randomUUID } from "node:crypto";
import { LegacyImportConflictError, type AccountRecord, type CharacterRecord, type GameRepository, type NewCharacter, type SessionRecord } from "./types.js";

interface MagicLink { email: string; expiresAt: Date; usedAt: Date | null }

export class InMemoryGameRepository implements GameRepository {
  readonly accounts = new Map<string, AccountRecord>();
  readonly characters = new Map<string, CharacterRecord>();
  readonly auditEvents: Array<{ accountId: string | null; kind: string; subjectId: string | null; detail: Record<string, unknown> }> = [];
  #accountByEmail = new Map<string, string>();
  #magicLinks = new Map<string, MagicLink>();
  #sessions = new Map<string, SessionRecord>();
  #legacyImportByCharacter = new Map<string, string>();
  #legacyImportByFingerprint = new Map<string, string>();

  async putMagicLink(email: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.#magicLinks.set(tokenHash, { email, expiresAt, usedAt: null });
  }

  async consumeMagicLink(tokenHash: string, now: Date): Promise<AccountRecord | null> {
    const link = this.#magicLinks.get(tokenHash);
    if (!link || link.usedAt || link.expiresAt <= now) return null;
    link.usedAt = now;
    const existingId = this.#accountByEmail.get(link.email);
    if (existingId) return this.accounts.get(existingId) ?? null;
    const account = { id: randomUUID(), email: link.email, createdAt: now };
    this.accounts.set(account.id, account);
    this.#accountByEmail.set(account.email, account.id);
    return structuredClone(account);
  }

  async putSession(tokenHash: string, accountId: string, expiresAt: Date): Promise<void> {
    this.#sessions.set(tokenHash, { accountId, expiresAt });
  }

  async findSession(tokenHash: string, now: Date): Promise<SessionRecord | null> {
    const session = this.#sessions.get(tokenHash);
    return !session || session.expiresAt <= now ? null : structuredClone(session);
  }

  async listCharacters(accountId: string): Promise<CharacterRecord[]> {
    return [...this.characters.values()].filter((character) => character.accountId === accountId).map((character) => structuredClone(character));
  }

  async getCharacter(characterId: string): Promise<CharacterRecord | null> {
    const character = this.characters.get(characterId);
    return character ? structuredClone(character) : null;
  }

  async createCharacter(input: NewCharacter): Promise<CharacterRecord> {
    const now = new Date();
    const character: CharacterRecord = { id: randomUUID(), ...structuredClone(input), save: null, legacyImportFingerprint: null, createdAt: now, updatedAt: now };
    this.characters.set(character.id, character);
    return structuredClone(character);
  }

  async updateCharacterTransform(characterId: string, transform: CharacterRecord["transform"]): Promise<void> {
    const character = this.characters.get(characterId);
    if (!character) return;
    character.transform = structuredClone(transform);
    if (character.save) {
      character.save = {
        ...character.save,
        location: { ...character.save.location, transform: structuredClone(transform) },
      };
    }
    character.updatedAt = new Date();
  }

  async importLegacySaveOnce(characterId: string, accountId: string, save: NonNullable<CharacterRecord["save"]>): Promise<CharacterRecord> {
    const character = this.characters.get(characterId);
    if (!character || character.accountId !== accountId) throw new Error("Character not found");
    if (character.legacyImportFingerprint) throw new LegacyImportConflictError();
    const fingerprint = save.legacyImport?.fingerprint;
    if (!fingerprint) throw new Error("Imported save requires a legacy fingerprint");
    const boundSave = { ...structuredClone(save), identity: { accountId, characterId } };
    const claimedFingerprint = this.#legacyImportByCharacter.get(characterId);
    const claimedCharacter = this.#legacyImportByFingerprint.get(fingerprint);
    if ((claimedFingerprint && claimedFingerprint !== fingerprint) || (claimedCharacter && claimedCharacter !== characterId)) throw new LegacyImportConflictError();
    character.name = String(boundSave.character.name);
    character.appearance = structuredClone(boundSave.appearance);
    character.transform = structuredClone(boundSave.location.transform);
    character.save = boundSave;
    character.legacyImportFingerprint = fingerprint;
    character.updatedAt = new Date();
    this.auditEvents.push({ accountId, kind: "character.legacy_import", subjectId: characterId, detail: { fingerprint } });
    this.#legacyImportByCharacter.set(characterId, fingerprint);
    this.#legacyImportByFingerprint.set(fingerprint, characterId);
    return structuredClone(character);
  }

  async appendAuditEvent(event: { accountId: string | null; kind: string; subjectId: string | null; detail: Record<string, unknown> }): Promise<void> {
    this.auditEvents.push(structuredClone(event));
  }
  async health(): Promise<boolean> { return true; }
  async close(): Promise<void> {}
}
