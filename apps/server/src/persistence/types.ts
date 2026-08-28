import type { AppearanceV2, ServerSaveV6, WorldTransform } from "@hollow-march/shared";

export interface AccountRecord { id: string; email: string; createdAt: Date }
export interface SessionRecord { accountId: string; expiresAt: Date }
export interface CharacterRecord {
  id: string;
  accountId: string;
  name: string;
  appearance: AppearanceV2;
  transform: WorldTransform;
  publicPhaseMask: number;
  personalPhaseMask: number;
  save: ServerSaveV6 | null;
  legacyImportFingerprint: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCharacter {
  accountId: string;
  name: string;
  appearance: AppearanceV2;
  transform: WorldTransform;
  publicPhaseMask: number;
  personalPhaseMask: number;
}

export interface GameRepository {
  putMagicLink(email: string, tokenHash: string, expiresAt: Date): Promise<void>;
  consumeMagicLink(tokenHash: string, now: Date): Promise<AccountRecord | null>;
  putSession(tokenHash: string, accountId: string, expiresAt: Date): Promise<void>;
  findSession(tokenHash: string, now: Date): Promise<SessionRecord | null>;
  listCharacters(accountId: string): Promise<CharacterRecord[]>;
  getCharacter(characterId: string): Promise<CharacterRecord | null>;
  createCharacter(input: NewCharacter): Promise<CharacterRecord>;
  updateCharacterTransform(characterId: string, transform: WorldTransform): Promise<void>;
  importLegacySaveOnce(characterId: string, accountId: string, save: ServerSaveV6): Promise<CharacterRecord>;
  appendAuditEvent(event: { accountId: string | null; kind: string; subjectId: string | null; detail: Record<string, unknown> }): Promise<void>;
  health(): Promise<boolean>;
  close(): Promise<void>;
}

export class LegacyImportConflictError extends Error {
  constructor() { super("This character has already imported a legacy save"); this.name = "LegacyImportConflictError"; }
}
