import assert from "node:assert/strict";
import test from "node:test";
import { AuthorityKernel, type MutableAuthorityActor } from "../src/rooms/authority.js";

const actor = (id: string, x: number): MutableAuthorityActor => ({
  id, transform: { x, y: 0, z: 16, yaw: 0 }, vitals: { health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 },
  locomotion: "idle", combat: { targetId: "", action: "", actionStartedTick: 0, impactTick: 0, recoveryEndsTick: 0 }, lastProcessedInput: 0,
});

test("movement is server-simulated and replayed sequence numbers are rejected", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 8); kernel.addActor(player);
  const input = { sequence: 1, clientTick: 1, moveX: 1, moveZ: 0, yaw: 0, sprint: false };
  assert.equal(kernel.receiveInput("player", input), true); assert.equal(kernel.receiveInput("player", input), false);
  kernel.step(1 / 30); assert.ok(player.transform.x > 8); assert.equal(player.lastProcessedInput, 1);
});

test("continuous movement expires when input frames stop arriving", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 8); kernel.addActor(player);
  kernel.receiveInput("player", { sequence: 1, clientTick: 1, moveX: 1, moveZ: 0, yaw: 0, sprint: false });
  for (let tick = 0; tick < 9; tick += 1) kernel.step(1 / 30);
  const expiredAt = player.transform.x;
  for (let tick = 0; tick < 30; tick += 1) kernel.step(1 / 30);
  assert.equal(player.transform.x, expiredAt);
});

test("protocol v2 rejects old immediate combat even against an unleased enemy", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 8); const enemy = actor("enemy.ash-husk", 10); kernel.addActor(player); kernel.addWorldTarget(enemy, "enemy");
  const command = { commandId: "attack_1", sequence: 1, clientTick: 1, kind: "light_attack" as const, targetId: "enemy.ash-husk" };
  const ack = kernel.receiveAction("player", command); assert.equal(ack.rejection, "encounter_required");
  assert.deepEqual(kernel.receiveAction("player", command), ack);
  assert.equal(kernel.receiveAction("player", { ...command, commandId: "attack_2", sequence: 2, kind: "heavy_attack" }).rejection, "encounter_required");
  assert.equal(kernel.receiveAction("player", { ...command, commandId: "dodge_1", sequence: 3, kind: "dodge", targetId: undefined }).rejection, "encounter_required");
  for (let tick = 0; tick < 12; tick += 1) kernel.step(1 / 30);
  assert.equal(enemy.vitals.health, 100);
});

test("canonical interactables accept interaction but reject combat targeting", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 8); const npc = actor("npc.maela-voss", 10); kernel.addActor(player); kernel.addWorldTarget(npc, "interactable");
  assert.equal(kernel.receiveAction("player", { commandId: "talk_1", sequence: 1, clientTick: 1, kind: "interact", targetId: "npc.maela-voss" }).accepted, true);
  const fresh = new AuthorityKernel(); const freshPlayer = actor("player", 8); fresh.addActor(freshPlayer); fresh.addWorldTarget(npc, "interactable");
  assert.equal(fresh.receiveAction("player", { commandId: "attack_npc", sequence: 1, clientTick: 1, kind: "light_attack", targetId: "npc.maela-voss" }).rejection, "encounter_required");
});

test("player actors are not valid combat targets without an explicit PvP policy", () => {
  const kernel = new AuthorityKernel(); const attacker = actor("attacker", 8); const victim = actor("victim", 9); kernel.addActor(attacker); kernel.addActor(victim);
  const ack = kernel.receiveAction("attacker", { commandId: "pvp_denied", sequence: 1, clientTick: 1, kind: "light_attack", targetId: "victim" });
  assert.equal(ack.rejection, "encounter_required");
  assert.equal(victim.vitals.health, 100);
});

test("click travel rejects blocked destinations and follows validated navigation waypoints", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 28); kernel.addActor(player);
  assert.equal(kernel.receiveTravel("player", { sequence: 1, clientTick: 1, destination: { x: 16, y: 0, z: 28, yaw: 0 } }), false);

  assert.equal(kernel.receiveTravel("player", { sequence: 2, clientTick: 2, destination: { x: 1, y: 0, z: 37, yaw: 1.25 } }), true);
  const before = { ...player.transform }; kernel.step(1 / 30);
  const deltaX = player.transform.x - before.x; const deltaZ = player.transform.z - before.z;
  assert.ok(deltaX < 0 && deltaZ > 0);
  assert.ok(Math.abs(deltaZ) > Math.abs(deltaX), "the first leg must head to the nav portal, not straight through the shrine");

  for (let tick = 0; tick < 450; tick += 1) kernel.step(1 / 30);
  assert.ok(Math.abs(player.transform.x - 1) < 0.01);
  assert.ok(Math.abs(player.transform.z - 37) < 0.01);
  assert.equal(player.transform.yaw, 1.25);
});

test("zero input heartbeats neither cancel nor override an active click route", () => {
  const kernel = new AuthorityKernel(); const player = actor("player", 28); kernel.addActor(player);
  assert.equal(kernel.receiveTravel("player", { sequence: 1, clientTick: 1, destination: { x: 28, y: 0, z: 30, yaw: 0 } }), true);
  for (let tick = 0; tick < 60; tick += 1) {
    assert.equal(kernel.receiveInput("player", { sequence: tick + 2, clientTick: tick + 2, moveX: 0, moveZ: 0, yaw: 0, sprint: false }), true);
    kernel.step(1 / 30);
  }
  assert.ok(player.transform.z > 22, "route movement must continue through periodic zero heartbeats");
});
