import assert from "node:assert/strict";
import test from "node:test";
import { SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS } from "@hearthmere/content/showcases";
import {
  CREATURE_MECHANIC_CONTRACTS_V4,
  CREATURE_TURN_EFFECT_HANDLER_BY_ID,
} from "@hearthmere/content/turn-combat";
import { EcologyProofAuthorityKernel } from "../src/rooms/ecologyProofAuthority.js";

const command = (encounterId: string, sequence: number, kind: "light_attack" | "heavy_attack" | "dodge" | "reset") => ({
  commandId: `proof-${sequence}-${kind}`,
  sequence,
  clientTick: sequence,
  encounterId,
  kind,
});

test("all 178 creature handlers resolve and exactly 21 ecology proofs execute the shared turn kernel", () => {
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.length, 178);
  assert.equal(CREATURE_TURN_EFFECT_HANDLER_BY_ID.size, 178);
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.filter(({ prototypePlayable }) => prototypePlayable).length, 21);
  for (const record of CREATURE_MECHANIC_CONTRACTS_V4) {
    const handler = CREATURE_TURN_EFFECT_HANDLER_BY_ID.get(record.contract.turn.effectHandlerId);
    assert.equal(handler?.creatureId, record.creatureId);
    assert.equal(typeof handler?.resolve, "function");
  }

  const encounters = SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters;
  assert.equal(encounters.length, 21);
  assert.equal(new Set(EcologyProofAuthorityKernel.registeredHandlerIds).size, 21);
  for (const encounter of encounters) {
    const kernel = new EcologyProofAuthorityKernel();
    const actorId = `actor.${encounter.familyId}`;
    const state = kernel.start(actorId, encounter.id);
    assert.equal(state?.mechanicHandlerId, encounter.mechanicHandlerId);
    assert.equal(state?.visualTelegraph, encounter.telegraphs[0]?.visual);
    assert.equal(state?.nonvisualTelegraph, encounter.telegraphs[0]?.nonvisual);
    assert.equal(kernel.receive(actorId, command(encounter.id, 1, "light_attack")).accepted, true);
    const events = kernel.combatEvents(actorId);
    assert.equal(events[0]?.type, "round_started");
    assert.equal(events.at(-1)?.type, "round_completed");
    assert.ok(events.some(({ type, actorId: eventActorId }) => type === "action_started" && eventActorId?.endsWith(".enemy")));
    assert.deepEqual(kernel.step(), [], "real-time ticks must not independently resolve proof damage");
  }
});

test("shared-kernel dodge moves before the authored enemy hit and each round resolves once", () => {
  const encounter = SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.find(({ creatureId }) => creatureId === "ash_husk")!;
  const kernel = new EcologyProofAuthorityKernel();
  const actorId = "actor.dodge";
  kernel.start(actorId, encounter.id);
  const before = kernel.snapshot(actorId)!.playerHealth;
  const dodgeAck = kernel.receive(actorId, command(encounter.id, 1, "dodge"));
  assert.equal(dodgeAck.accepted, true);
  assert.equal(kernel.snapshot(actorId)!.playerHealth, before);
  const events = kernel.combatEvents(actorId);
  assert.ok(events.some(({ type, data }) => type === "reaction_triggered" && data.kind === "dodge"));
  assert.ok(events.some(({ type, data }) => type === "attack_missed" && data.reason === "range_or_movement"));
  const afterRound = kernel.snapshot(actorId)!.playerHealth;
  for (let count = 0; count < 30; count += 1) kernel.step();
  assert.equal(kernel.snapshot(actorId)!.playerHealth, afterRound, "room ticks cannot apply a second impact");
});

test("Black Sluice proof replay is idempotent and shared-kernel victory resolves its canonical effect and drops", () => {
  const encounter = SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.find(({ familyId }) => familyId === "black_sluice")!;
  const kernel = new EcologyProofAuthorityKernel();
  const actorId = "winner6";
  kernel.start(actorId, encounter.id);
  const firstCommand = command(encounter.id, 1, "heavy_attack");
  const first = kernel.receive(actorId, firstCommand);
  const eventCount = kernel.combatEvents(actorId).length;
  assert.deepEqual(kernel.receive(actorId, firstCommand), first);
  assert.equal(kernel.combatEvents(actorId).length, eventCount);

  let sequence = 2;
  while (kernel.snapshot(actorId)!.phase !== "victory" && sequence < 10) {
    assert.equal(kernel.receive(actorId, command(encounter.id, sequence, "heavy_attack")).accepted, true);
    sequence += 1;
  }
  const won = kernel.snapshot(actorId)!;
  assert.equal(won.phase, "victory");
  assert.deepEqual(won.resolvedDropTableIds, encounter.dropTableIds);
  const events = kernel.combatEvents(actorId);
  assert.ok(events.some(({ type, data }) => type === "encounter_outcome" && data.outcome === "victory"));
  for (let index = 1; index < events.length; index += 1) assert.ok(events[index]!.sequence > events[index - 1]!.sequence);
});
