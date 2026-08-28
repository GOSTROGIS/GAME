import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_APPEARANCE_V2, PHASES, migrateServerSaveToV6, validateAppearanceV2, validateAuthenticatedCharacterV1, validatePrivateActorResourcesV1 } from "@hollow-march/shared";
import { loadConfig } from "../src/config.js";
import { isAllowedWebSocketOrigin } from "../src/transport-security.js";
import { canonicalAnchorTransform, canonicalPublicInteractionAnchors } from "../src/world/hearthmere.js";
import { CharacterSessionReservations, MAX_APPEARANCE_JSON_BYTES, actorFor, authenticatedCharacterProjection, normalizeGuestAppearance, privateActorResourcesProjection, safeActionKind, seedHearthmerePublicState, turnPlayerFromState } from "../src/rooms/HearthmereRoom.js";
import { AuthorityKernel } from "../src/rooms/authority.js";
import { HearthmereState } from "../src/rooms/schema/HearthmereState.js";

test("server spawns resolve from the canonical scene manifest", () => {
  assert.deepEqual(canonicalAnchorTransform("player.start"), { x: 28, y: 0, z: 16, yaw: 2.35 });
  assert.deepEqual(canonicalAnchorTransform("enemy.ash-husk"), { x: 24, y: 0, z: 32, yaw: 3.14 });
  assert.deepEqual(canonicalAnchorTransform("enemy.ledger-crawler"), { x: 20, y: 0, z: 32, yaw: 2.7 });
  assert.deepEqual(canonicalAnchorTransform("npc.maela-voss"), { x: 32, y: 0, z: 16, yaw: 1.9 });
  const interactionIds = new Set(canonicalPublicInteractionAnchors().map(({ id }) => id));
  for (const id of ["npc.maela-voss", "npc.torren-vale", "npc.ysra-pell", "landmark.old-vigil-shrine"]) assert.ok(interactionIds.has(id), `${id} is missing from public interaction state`);

  const state = new HearthmereState();
  seedHearthmerePublicState(state, new AuthorityKernel());
  assert.deepEqual(state.enemies.get("enemy.ash-husk")?.transform.toJSON(), { x: 24, y: 0, z: 32, yaw: 3.14 });
  assert.deepEqual(state.enemies.get("enemy.ledger-crawler")?.transform.toJSON(), { x: 20, y: 0, z: 32, yaw: 2.7 });
  assert.ok(state.interactables.has("npc.maela-voss"));
});

test("replicated actors omit durable account identifiers and invalid stored spawns are reprojected", () => {
  const appearance = normalizeGuestAppearance({});
  const actor = actorFor("public-session", {
    accountId: "account-private-value",
    guest: false,
    appearance,
    character: { id: "character-private-value", accountId: "account-private-value", name: "Mara", appearance, transform: { x: 96, y: 0, z: 96, yaw: 0 }, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC, save: null, legacyImportFingerprint: null, createdAt: new Date(0), updatedAt: new Date(0) },
  });
  assert.equal("accountId" in actor, false);
  assert.deepEqual(actor.transform.toJSON(), canonicalAnchorTransform("player.start"));
});

test("authenticated room bootstrap privately identifies the selected character before encounter start", () => {
  const projection = authenticatedCharacterProjection("character-private-value");
  assert.doesNotThrow(() => validateAuthenticatedCharacterV1(projection));
  assert.deepEqual(projection, { protocolVersion: 2, characterId: "character-private-value" });
  assert.equal(Object.keys(projection).includes("accountId"), false);
});

test("saved V6 vitals and spent quick items hydrate reconnect and next-encounter authority", () => {
  const save = migrateServerSaveToV6({ version: 4, importedFrom: null, character: { name: "Mara", appearance: DEFAULT_APPEARANCE_V2 }, transform: { x: 28, y: 0, z: 16, yaw: 0 }, legacyPayload: null }, "2026-08-25T12:00:00.000Z", { accountId: "account.1", characterId: "character.1" });
  save.vitals = { health: 43, maximumHealth: 130, stamina: 17, maximumStamina: 90, focus: 8, maximumFocus: 40 };
  save.inventory.mending_draught = 0;
  const character = { id: "character.1", accountId: "account.1", name: "Mara", appearance: DEFAULT_APPEARANCE_V2, transform: save.location.transform, publicPhaseMask: PHASES.PUBLIC, personalPhaseMask: PHASES.PUBLIC, save, legacyImportFingerprint: null, createdAt: new Date(0), updatedAt: new Date(0) };
  const actor = actorFor("session.1", { accountId: "account.1", character, guest: false, appearance: DEFAULT_APPEARANCE_V2 });
  assert.deepEqual(actor.vitals.toJSON(), { health: 43, maxHealth: 130 }, "global schema exposes health but not private stamina/focus");
  const privateResources = privateActorResourcesProjection("session.1", character.id, actor);
  assert.doesNotThrow(() => validatePrivateActorResourcesV1(privateResources));
  assert.deepEqual(privateResources, { protocolVersion: 2, actorId: "session.1", characterId: character.id, stamina: 17, maxStamina: 90, focus: 8, maxFocus: 40 });
  const nextEncounter = turnPlayerFromState(character.id, "session.1", actor, character);
  assert.equal(nextEncounter.quickItemId, null);
  assert.deepEqual(nextEncounter.itemCharges, {});
});

test("pending and live character claims are atomic across concurrent auth continuations", async () => {
  const reservations = new CharacterSessionReservations();
  const attempts = await Promise.all(["session.a", "session.b"].map(async (sessionId) => {
    await Promise.resolve();
    return reservations.claim("character.same", sessionId);
  }));
  assert.deepEqual(attempts.sort(), [false, true]);
  reservations.releaseSession("session.a"); reservations.releaseSession("session.b");
  assert.equal(reservations.claim("character.same", "session.c"), true);
});

test("WebSocket upgrades reject hostile and malformed origins", () => {
  const allowed = ["https://alpha.hearthmere.example", "http://localhost:5173"];
  assert.equal(isAllowedWebSocketOrigin("https://alpha.hearthmere.example", allowed, false), true);
  assert.equal(isAllowedWebSocketOrigin("https://alpha.hearthmere.example.evil.test", allowed, false), false);
  assert.equal(isAllowedWebSocketOrigin("not a url", allowed, false), false);
  assert.equal(isAllowedWebSocketOrigin(undefined, allowed, false), false);
  assert.equal(isAllowedWebSocketOrigin(undefined, allowed, true), true);
});

test("originless WebSockets require an explicit production opt-in", () => {
  const production = loadConfig({ NODE_ENV: "production", PORT: "2567", PUBLIC_ORIGIN: "https://alpha.hearthmere.example", COOKIE_SECRET: "production-secret-longer-than-24-characters" });
  assert.equal(production.allowOriginlessWebSockets, false);
  const nativeEnabled = loadConfig({ NODE_ENV: "production", PORT: "2567", PUBLIC_ORIGIN: "https://alpha.hearthmere.example", COOKIE_SECRET: "production-secret-longer-than-24-characters", ALLOW_ORIGINLESS_WEBSOCKETS: "true" });
  assert.equal(nativeEnabled.allowOriginlessWebSockets, true);
});

test("development origin defaults match the Vite preview host while production stays closed", () => {
  const development = loadConfig({ NODE_ENV: "development", PORT: "2567" });
  assert.ok(development.allowedOrigins.includes("http://localhost:4173"));
  assert.ok(development.allowedOrigins.includes("http://127.0.0.1:4173"));
  assert.equal(isAllowedWebSocketOrigin("http://127.0.0.1:4173", development.allowedOrigins, false), true);

  const production = loadConfig({ NODE_ENV: "production", PORT: "2567", PUBLIC_ORIGIN: "https://alpha.hearthmere.example", COOKIE_SECRET: "production-secret-longer-than-24-characters" });
  assert.deepEqual(production.allowedOrigins, ["https://alpha.hearthmere.example"]);
  assert.equal(isAllowedWebSocketOrigin("http://127.0.0.1:4173", production.allowedOrigins, false), false);
});

test("guest actor state carries bounded, validated, distinct creator appearances", () => {
  const pale = normalizeGuestAppearance({ hairId: "shorn_crown", morphs: { stature: -0.8 }, plague: { pallor: 0.9 } });
  const tall = normalizeGuestAppearance({ hairId: "pilgrim_knot", morphs: { stature: 0.8 }, plague: { pallor: 0.1 } });
  const paleActor = actorFor("guest-pale", { accountId: "development_guest", character: null, guest: true, appearance: pale });
  const tallActor = actorFor("guest-tall", { accountId: "development_guest", character: null, guest: true, appearance: tall });

  assert.notEqual(paleActor.appearanceSignature, tallActor.appearanceSignature);
  assert.equal(JSON.parse(paleActor.appearanceJson).morphs.stature, -0.8);
  assert.equal(JSON.parse(tallActor.appearanceJson).morphs.stature, 0.8);
  assert.ok(new TextEncoder().encode(paleActor.appearanceJson).byteLength <= MAX_APPEARANCE_JSON_BYTES);
  assert.ok(paleActor.appearanceSignature.length > 0);

  const normalizedInvalid = normalizeGuestAppearance({ bodyId: "NOT VALID", morphs: { stature: 99 }, plague: { lesions: Number.POSITIVE_INFINITY } });
  assert.equal(validateAppearanceV2(normalizedInvalid).ok, true);
  assert.equal(normalizedInvalid.bodyId, DEFAULT_APPEARANCE_V2.bodyId);
  assert.equal(normalizedInvalid.morphs.stature, 1);
  assert.equal(normalizedInvalid.plague.lesions, DEFAULT_APPEARANCE_V2.plague.lesions);
});

test("action metrics have finite label cardinality for hostile payloads", () => {
  const labels = new Set(Array.from({ length: 500 }, (_, index) => safeActionKind({ kind: `attacker_value_${index}` })));
  assert.deepEqual([...labels], ["invalid"]);
  assert.equal(safeActionKind({ kind: "light_attack" }), "light_attack");
});
