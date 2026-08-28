import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_APPEARANCE_V2, PHASES, migrateLegacySaveV3ToV6 } from "@hollow-march/shared";
import { AuthService, type MagicLinkSender } from "../src/auth/service.js";
import { loadConfig } from "../src/config.js";
import { InMemoryGameRepository } from "../src/persistence/memory.js";
import { LegacyImportConflictError } from "../src/persistence/types.js";

class CaptureSender implements MagicLinkSender {
  url = "";
  async send(message: { url: string }): Promise<void> { this.url = message.url; }
}

test("magic links are single-use and establish a signed session", async () => {
  let time = new Date("2026-08-23T00:00:00Z");
  const repository = new InMemoryGameRepository(); const sender = new CaptureSender();
  const config = loadConfig({ NODE_ENV: "test", PUBLIC_ORIGIN: "http://localhost:2567", COOKIE_SECRET: "test-secret-longer-than-twenty-four" });
  const auth = new AuthService(repository, config, sender, () => time);
  await auth.requestMagicLink("PLAYER@example.com");
  const token = new URL(sender.url).searchParams.get("token");
  const verified = await auth.verifyMagicLink(token);
  assert.ok(verified);
  assert.equal((await auth.resolveSession(verified.cookieValue))?.accountId, verified.account.id);
  assert.equal(await auth.verifyMagicLink(token), null);
  time = new Date(time.getTime() + 31 * 24 * 60 * 60_000);
  assert.equal(await auth.resolveSession(verified.cookieValue), null);
});

test("one-time v3 import preserves payload and cannot be replayed", async () => {
  const repository = new InMemoryGameRepository();
  const character = await repository.createCharacter({ accountId: "account_1", name: "Before", appearance: DEFAULT_APPEARANCE_V2, transform: { x: 48, y: 0, z: 48, yaw: 0 }, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC });
  const save = migrateLegacySaveV3ToV6({ version: 3, player: { x: 3, y: 5 }, character: { name: "After" } }, "2026-08-23T00:00:00Z", { accountId: "account_1", characterId: character.id });
  const imported = await repository.importLegacySaveOnce(character.id, "account_1", save);
  assert.equal(imported.name, "After"); assert.deepEqual(imported.transform, { x: 12, y: 0, z: 20, yaw: 0 }); assert.ok(imported.save?.legacyImport?.fingerprint);
  assert.deepEqual(imported.save?.identity, { accountId: "account_1", characterId: character.id }, "authenticated ownership overrides untrusted legacy identity fields");
  assert.deepEqual(repository.auditEvents, [{ accountId: "account_1", kind: "character.legacy_import", subjectId: character.id, detail: { fingerprint: save.legacyImport?.fingerprint } }]);
  const moved = { x: 19, y: 2, z: 31, yaw: 0.75 };
  await repository.updateCharacterTransform(character.id, moved);
  const movedCharacter = await repository.getCharacter(character.id);
  assert.deepEqual(movedCharacter?.transform, moved);
  assert.deepEqual(movedCharacter?.save?.location.transform, moved, "the durable named location remains synchronized with the authoritative row transform");
  await assert.rejects(repository.importLegacySaveOnce(character.id, "account_1", save), LegacyImportConflictError);

  const otherAccountCharacter = await repository.createCharacter({ accountId: "account_2", name: "Other", appearance: DEFAULT_APPEARANCE_V2, transform: { x: 48, y: 0, z: 48, yaw: 0 }, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC });
  await assert.rejects(repository.importLegacySaveOnce(otherAccountCharacter.id, "account_2", save), LegacyImportConflictError, "legacy fingerprints are globally single-use");
});

test("legacy import is exposed only as an atomic repository operation", async () => {
  const repository = new InMemoryGameRepository();
  const first = await repository.createCharacter({ accountId: "account_a", name: "First", appearance: DEFAULT_APPEARANCE_V2, transform: { x: 0, y: 0, z: 0, yaw: 0 }, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC });
  const second = await repository.createCharacter({ accountId: "account_b", name: "Second", appearance: DEFAULT_APPEARANCE_V2, transform: { x: 0, y: 0, z: 0, yaw: 0 }, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC });
  const save = migrateLegacySaveV3ToV6({ version: 3, player: { x: 1, y: 2 }, character: { name: "Imported" } }, "2026-08-23T00:00:00Z", { accountId: "account_a", characterId: first.id });
  assert.equal("turnPersistence" in repository, false, "callers cannot create a dangling claim outside the character transaction");
  const decisions = await Promise.allSettled([
    repository.importLegacySaveOnce(first.id, "account_a", save),
    repository.importLegacySaveOnce(second.id, "account_b", save),
  ]);
  assert.equal(decisions.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(decisions.filter(({ status }) => status === "rejected").length, 1);
  assert.equal(repository.auditEvents.filter(({ kind }) => kind === "character.legacy_import").length, 1);
});
