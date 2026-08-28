import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { Client } from "@colyseus/sdk";
import {
  DEFAULT_APPEARANCE_V2,
  NETWORK_PROTOCOL_VERSION,
  validateAuthenticatedCharacterV1,
  validateEncounterClientStateV1,
  validateTurnEncounterCommandAck,
} from "@hollow-march/shared";

const root = resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const port = await reservePort();
const output = [];
const server = spawn(process.execPath, ["apps/server/dist/index.js"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(port),
    PUBLIC_ORIGIN: `http://127.0.0.1:${port}`,
    ALLOW_GUESTS: "true",
    ALLOW_ORIGINLESS_WEBSOCKETS: "true",
    EXPOSE_DEV_MAGIC_LINKS: "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => output.push(String(chunk)));
server.stderr.on("data", (chunk) => output.push(String(chunk)));

let firstRoom;
let secondRoom;
let authenticatedRoom;
try {
  await waitForHealth(`http://127.0.0.1:${port}/health/ready`, server);
  const firstAppearance = structuredClone(DEFAULT_APPEARANCE_V2);
  const secondAppearance = structuredClone(DEFAULT_APPEARANCE_V2);
  firstAppearance.morphs.stature = -.75;
  firstAppearance.hairPaletteId = "charcoal";
  secondAppearance.morphs.stature = .75;
  secondAppearance.hairPaletteId = "silver_ash";

  const firstClient = new Client(`ws://127.0.0.1:${port}`);
  const secondClient = new Client(`ws://127.0.0.1:${port}`);
  firstRoom = await firstClient.joinOrCreate("hearthmere", { appearance: firstAppearance });
  secondRoom = await secondClient.joinOrCreate("hearthmere", { appearance: secondAppearance });
  assert.equal(firstRoom.roomId, secondRoom.roomId, "clients must share one Hearthmere shard");
  await waitFor(() => firstRoom.state.players.size === 2 && secondRoom.state.players.size === 2, 5_000, "two-player replication");

  const firstActor = firstRoom.state.players.get(firstRoom.sessionId);
  const secondActor = firstRoom.state.players.get(secondRoom.sessionId);
  assert.ok(firstActor && secondActor, "both synchronized actors must exist");
  assert.deepEqual([firstActor.transform.x, firstActor.transform.y, firstActor.transform.z], [28, 0, 16]);
  assert.deepEqual([secondActor.transform.x, secondActor.transform.y, secondActor.transform.z], [28, 0, 16]);
  assert.equal(JSON.parse(firstActor.appearanceJson).morphs.stature, -.75);
  assert.equal(JSON.parse(secondActor.appearanceJson).morphs.stature, .75);
  assert.notEqual(firstActor.appearanceSignature, secondActor.appearanceSignature);
  assert.equal(firstRoom.state.enemies.size, 2);
  assert.ok(firstRoom.state.interactables.size >= 4);
  assert.equal(firstActor.accountId, undefined, "durable account IDs must never be replicated");
  assert.equal(secondActor.accountId, undefined, "remote durable account IDs must never be replicated");

  const startX = firstActor.transform.x;
  firstRoom.send("input", { sequence: 1, clientTick: 1, moveX: 1, moveZ: 0, yaw: Math.PI / 2, sprint: false });
  await waitFor(() => firstActor.transform.x > startX + .05, 3_000, "authoritative movement patch");
  await waitFor(() => {
    const remote = secondRoom.state.players.get(firstRoom.sessionId);
    return remote && remote.transform.x > startX + .05;
  }, 3_000, "remote movement replication");
  firstRoom.send("input", { sequence: 2, clientTick: 2, moveX: 0, moveZ: 0, yaw: 0, sprint: false });
  firstRoom.send("input", { sequence: 3, clientTick: 3, moveX: 1, moveZ: 0, yaw: Math.PI / 2, sprint: false });
  await waitFor(() => firstActor.transform.x >= 29, 3_000, "approach Maela");
  firstRoom.send("input", { sequence: 4, clientTick: 4, moveX: 0, moveZ: 0, yaw: 0, sprint: false });

  const ack = new Promise((resolveAck, rejectAck) => {
    const timeout = setTimeout(() => rejectAck(new Error("action_ack timed out")), 3_000);
    firstRoom.onMessage("action_ack", (message) => { clearTimeout(timeout); resolveAck(message); });
  });
  firstRoom.send("action", { commandId: "network-smoke-dodge", sequence: 1, clientTick: 2, kind: "dodge" });
  const actionAck = await ack;
  assert.equal(actionAck.accepted, false, "legacy realtime dodge must not bypass turn-combat authority");
  assert.equal(actionAck.commandId, "network-smoke-dodge");
  assert.equal(actionAck.rejection, "encounter_required");

  await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  const interactAckPromise = new Promise((resolveAck, rejectAck) => {
    const timeout = setTimeout(() => rejectAck(new Error("canonical interact action_ack timed out")), 3_000);
    firstRoom.onMessage("action_ack", (message) => {
      if (message.commandId !== "network-smoke-maela") return;
      clearTimeout(timeout); resolveAck(message);
    });
  });
  firstRoom.send("action", { commandId: "network-smoke-maela", sequence: 2, clientTick: 5, kind: "interact", targetId: "npc.maela-voss" });
  const interactAck = await interactAckPromise;
  assert.equal(interactAck.accepted, true, JSON.stringify(interactAck));

  const routeStartZ = firstActor.transform.z;
  firstRoom.send("travel", { sequence: 5, clientTick: 6, destination: { x: firstActor.transform.x, y: 0, z: 20, yaw: 0 } });
  for (let heartbeat = 0; heartbeat < 12; heartbeat += 1) {
    firstRoom.send("input", { sequence: 6 + heartbeat, clientTick: 7 + heartbeat, moveX: 0, moveZ: 0, yaw: 0, sprint: false });
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  assert.ok(firstActor.transform.z > routeStartZ + 1, "periodic zero input frames must not cancel click travel");

  const beforeBlockedTravel = { x: firstActor.transform.x, z: firstActor.transform.z };
  firstRoom.send("travel", { sequence: 18, clientTick: 19, destination: { x: 16, y: 0, z: 28, yaw: 0 } });
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  assert.ok(Math.hypot(firstActor.transform.x - 16, firstActor.transform.z - 28) > 4, "blocked shrine travel must not be accepted");
  assert.ok(Math.hypot(firstActor.transform.x - beforeBlockedTravel.x, firstActor.transform.z - beforeBlockedTravel.z) < 2, "rejected travel must not teleport the actor");

  const authenticated = await createAuthenticatedCharacter(`http://127.0.0.1:${port}`);
  const authenticatedClient = new Client(`ws://127.0.0.1:${port}`);
  authenticatedRoom = await authenticatedClient.joinOrCreate("hearthmere", {
    sessionToken: authenticated.sessionToken,
    characterId: authenticated.characterId,
  });
  assert.equal(authenticatedRoom.roomId, firstRoom.roomId, "authenticated client must join the same Hearthmere shard");

  let authenticatedCharacterSeen = false;
  let encounterProjectionBeforeIdentity = false;
  const authenticatedCharacterMessage = new Promise((resolveMessage, rejectMessage) => {
    const timeout = setTimeout(() => rejectMessage(new Error("authenticated_character timed out after room admission")), 3_000);
    authenticatedRoom.onMessage("authenticated_character", (message) => {
      try {
        validateAuthenticatedCharacterV1(message);
        assert.equal(message.characterId, authenticated.characterId);
        authenticatedCharacterSeen = true;
        clearTimeout(timeout);
        resolveMessage(message);
      } catch (error) {
        clearTimeout(timeout);
        rejectMessage(error);
      }
    });
  });
  const firstEncounterState = new Promise((resolveState, rejectState) => {
    const timeout = setTimeout(() => rejectState(new Error("turn_encounter_state timed out")), 5_000);
    authenticatedRoom.onMessage("turn_encounter_state", (state) => {
      try {
        if (!authenticatedCharacterSeen) encounterProjectionBeforeIdentity = true;
        validateEncounterClientStateV1(state);
        clearTimeout(timeout);
        resolveState(state);
      } catch (error) {
        clearTimeout(timeout);
        rejectState(error);
      }
    });
  });
  void firstEncounterState.catch(() => {});
  await authenticatedCharacterMessage;

  await waitFor(() => authenticatedRoom.state.players.size === 3, 3_000, "authenticated actor replication");
  const authenticatedActor = authenticatedRoom.state.players.get(authenticatedRoom.sessionId);
  assert.ok(authenticatedActor, "authenticated actor must exist in room state");
  let approachSequence = 1;
  const approachDeadline = Date.now() + 3_000;
  while (authenticatedActor.transform.z <= 21 && Date.now() < approachDeadline) {
    authenticatedRoom.send("input", { sequence: approachSequence, clientTick: approachSequence, moveX: 0, moveZ: 1, yaw: 0, sprint: false });
    approachSequence += 1;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  assert.ok(authenticatedActor.transform.z > 21, "sequenced browser-style input heartbeats must move the authenticated actor into encounter range");
  authenticatedRoom.send("input", { sequence: approachSequence, clientTick: approachSequence, moveX: 0, moveZ: 0, yaw: 0, sprint: false });

  const encounterCommandId = "network-smoke-turn-start";
  const encounterAckPromise = new Promise((resolveAck, rejectAck) => {
    const timeout = setTimeout(() => rejectAck(new Error("turn_encounter_ack timed out")), 5_000);
    authenticatedRoom.onMessage("turn_encounter_ack", (message) => {
      if (message.commandId !== encounterCommandId) return;
      try {
        validateTurnEncounterCommandAck(message);
        clearTimeout(timeout);
        resolveAck(message);
      } catch (error) {
        clearTimeout(timeout);
        rejectAck(error);
      }
    });
  });
  authenticatedRoom.send("turn_encounter_start", {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    commandId: encounterCommandId,
    characterId: authenticated.characterId,
    enemyActorIds: ["enemy.ash-husk"],
  });
  const [encounterAck, encounterState] = await Promise.all([encounterAckPromise, firstEncounterState]);
  assert.equal(encounterAck.accepted, true, JSON.stringify(encounterAck));
  assert.equal(encounterAck.kind, "start");
  assert.equal(encounterState.publicState.encounterId, encounterAck.encounterId);
  assert.equal(encounterState.viewerState.characterId, authenticated.characterId);
  assert.equal(encounterState.viewerState.mode, "participant");
  assert.equal(encounterProjectionBeforeIdentity, false, "private identity must arrive before any encounter projection");

  console.log(JSON.stringify({
    roomId: firstRoom.roomId,
    players: firstRoom.state.players.size,
    enemies: firstRoom.state.enemies.size,
    interactables: firstRoom.state.interactables.size,
    appearancesDistinct: firstActor.appearanceSignature !== secondActor.appearanceSignature,
    canonicalSpawn: [28, 0, 16],
    movementReplicated: true,
    legacyDodgeRejectedForEncounter: actionAck.accepted === false && actionAck.rejection === "encounter_required",
    canonicalInteractionAccepted: interactAck.accepted,
    zeroHeartbeatTravelContinued: firstActor.transform.z > routeStartZ + 1,
    accountIdsPrivate: firstActor.accountId === undefined && secondActor.accountId === undefined,
    blockedTravelRejected: true,
    authenticatedIdentityReceived: authenticatedCharacterSeen,
    authenticatedTurnStartAccepted: encounterAck.accepted,
    identityPrecededEncounterProjection: !encounterProjectionBeforeIdentity,
  }, null, 2));
} catch (error) {
  console.error(output.join(""));
  throw error;
} finally {
  await Promise.allSettled([firstRoom, secondRoom, authenticatedRoom].filter(Boolean).map((room) => withTimeout(room.leave(), 1_500, "room leave")));
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([
      new Promise((resolveExit) => server.once("exit", resolveExit)),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2_000)),
    ]);
  }
}

async function createAuthenticatedCharacter(origin) {
  const email = `network-smoke-${Date.now()}@example.invalid`;
  const requestLink = await fetch(`${origin}/auth/request-link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  assert.equal(requestLink.status, 202);
  const linkBody = await requestLink.json();
  assert.equal(typeof linkBody.devMagicLink, "string", "development auth must expose the one-use test link");
  const verification = await fetch(linkBody.devMagicLink, { redirect: "manual" });
  assert.equal(verification.status, 200);
  const setCookie = verification.headers.get("set-cookie");
  assert.ok(setCookie, "verification must establish the HttpOnly session cookie");
  const sessionCookie = setCookie.split(";", 1)[0];
  assert.ok(sessionCookie.startsWith("hm_session="));
  const sessionToken = decodeURIComponent(sessionCookie.slice("hm_session=".length));
  const createCharacter = await fetch(`${origin}/characters`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: sessionCookie },
    body: JSON.stringify({ name: "Network Witness", appearance: DEFAULT_APPEARANCE_V2 }),
  });
  const createCharacterBody = await createCharacter.text();
  assert.equal(createCharacter.status, 201, createCharacterBody);
  const body = JSON.parse(createCharacterBody);
  assert.equal(typeof body.character?.id, "string");
  return { characterId: body.character.id, sessionToken };
}

async function reservePort() {
  const probe = createServer();
  await new Promise((resolveListen, rejectListen) => probe.once("error", rejectListen).listen(0, "127.0.0.1", resolveListen));
  const address = probe.address();
  const selected = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolveClose) => probe.close(resolveClose));
  return selected;
}

async function waitForHealth(url, processHandle) {
  await waitFor(async () => {
    if (processHandle.exitCode !== null) throw new Error(`server exited with ${processHandle.exitCode}`);
    try { return (await fetch(url)).ok; } catch { return false; }
  }, 8_000, "server readiness");
}

async function waitFor(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${timeoutMs}ms`)), timeoutMs); }),
  ]).finally(() => clearTimeout(timer));
}
