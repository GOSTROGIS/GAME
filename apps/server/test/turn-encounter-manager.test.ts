import assert from "node:assert/strict";
import test from "node:test";
import { NETWORK_PROTOCOL_VERSION, validateEncounterClientStateV1, validateTurnEncounterV1, type TurnPlanRequest } from "@hollow-march/shared";
import { selectNearbySpectatorEncounter } from "../src/rooms/HearthmereRoom.js";
import {
  TURN_DISCONNECT_LEASE_TICKS,
  TURN_PLANNING_LEASE_TICKS,
  TURN_TERMINAL_RETENTION_TICKS,
  TURN_SETTLEMENT_RETRY_TICKS,
  TurnEncounterManager,
  type TurnSettlementInput,
  type TurnWorldEnemy,
  type TurnWorldPlayer,
} from "../src/rooms/turnEncounterManager.js";

const player = (number: number, x = number * 200): TurnWorldPlayer => ({
  characterId: `char-${number}`, sessionId: `session-${number}`,
  positionMm: { x, y: 0, z: 0 }, yawTenThousandthRadians: 0,
  health: 100, maxHealth: 100, stamina: 50, maxStamina: 100, focus: 20, maxFocus: 50,
});
const enemy = (id = "enemy.ash", x = 2_000, health = 70): TurnWorldEnemy => ({
  actorId: id, definitionId: "ash_husk", positionMm: { x, y: 0, z: 0 }, yawTenThousandthRadians: 0,
  health, maxHealth: health, stamina: 100, maxStamina: 100, focus: 1, maxFocus: 1,
});
const start = (characterId: string, enemyActorIds = ["enemy.ash"], commandId = "start-1") => ({ protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, enemyActorIds });
const join = (characterId: string, encounterId: string, commandId: string) => ({ protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, encounterId });
const withdraw = (characterId: string, encounterId: string, commandId = "withdraw-1") => ({ protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, encounterId });
const holdPlan = (manager: TurnEncounterManager, encounterId: string, characterId: string, commandId: string): TurnPlanRequest => {
  const state = manager.encounter(encounterId)!;
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId, characterId, commandId, round: state.round, revision: state.revision,
    actions: [{ selectionId: `${commandId}.hold`, actionDefinitionId: "action.hold", beat: 0 }], reaction: null, ready: true,
  };
};

test("four authenticated players share one sorted lease while a fifth remains spectator", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.test", idFactory: () => "one" });
  const leader = player(1, 0);
  const started = manager.start(start(leader.characterId), leader, [enemy()]);
  assert.equal(started.accepted, true); const encounterId = started.encounterId!;
  for (let number = 2; number <= 4; number += 1) assert.equal(manager.join(join(`char-${number}`, encounterId, `join-${number}`), player(number)).accepted, true);
  assert.equal(manager.join(join("char-5", encounterId, "join-5"), player(5)).rejection, "encounter_full");
  assert.equal(manager.start(start("char-6", ["enemy.ash"], "start-other"), player(6), [enemy()]).rejection, "enemy_unavailable");
  assert.equal(manager.spectate(encounterId, "session-spectator"), true);

  const state = manager.encounter(encounterId)!;
  validateTurnEncounterV1(state);
  assert.equal(state.participants.filter(({ team }) => team === "players").length, 4);
  assert.deepEqual(state.leasedEnemyIds, ["enemy.ash"]);
  assert.deepEqual(state.publicState.spectatorActorIds, ["session-spectator"]);
  const spectator = manager.clientState(encounterId, { actorId: "session-spectator", characterId: "char-spectator" })!;
  validateEncounterClientStateV1(spectator); assert.equal(spectator.viewerState.mode, "spectator"); assert.equal(spectator.participantState, null);
  const privateLeader = manager.clientState(encounterId, { actorId: leader.sessionId, characterId: leader.characterId })!;
  assert.equal(privateLeader.participantState?.characterId, leader.characterId);
  assert.equal(privateLeader.publicState.enemyIntents[0]?.exactDamageKnown, false);

  assert.equal(manager.withdraw(withdraw(leader.characterId, encounterId), leader.characterId).accepted, true);
  assert.equal(manager.encounter(encounterId)!.publicState.leaderActorId, "character.char-2");
});

test("dead initiators, dead joiners, and dead enemies are rejected before leasing", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.dead", idFactory: () => "dead" });
  const deadPlayer = { ...player(1, 0), health: 0 };
  assert.equal(manager.start(start(deadPlayer.characterId), deadPlayer, [enemy()]).rejection, "invalid_request");
  assert.equal(manager.isEnemyLeased("enemy.ash"), false);
  const live = player(2, 0);
  assert.equal(manager.start(start(live.characterId, ["enemy.dead"], "dead-enemy"), live, [enemy("enemy.dead", 2_000, 0)]).rejection, "enemy_unavailable");
  const encounterId = manager.start(start(live.characterId, ["enemy.live"], "live-start"), live, [enemy("enemy.live", 2_000)]).encounterId!;
  const deadJoiner = { ...player(3, 100), health: 0 };
  assert.equal(manager.join(join(deadJoiner.characterId, encounterId, "dead-join"), deadJoiner).rejection, "invalid_request");
});

test("ready plans resolve through the shared kernel with recovery, monotonic events, and exactly-once settlement", async () => {
  const settlements: TurnSettlementInput[] = [];
  let encounterOrdinal = 0;
  const manager = new TurnEncounterManager({ shardId: "shard.test", idFactory: () => encounterOrdinal++ === 0 ? "victory" : "later", settle: async (input) => { settlements.push(structuredClone(input)); } });
  const actor = player(1, 0); const target = enemy("enemy.ash", 2_000, 9);
  const started = manager.start(start(actor.characterId), actor, [target]); const encounterId = started.encounterId!;
  const initial = manager.encounter(encounterId)!;
  const plan: TurnPlanRequest = {
    protocolVersion: 2, encounterId, characterId: actor.characterId, commandId: "winning-plan", round: initial.round, revision: initial.revision,
    actions: [{ selectionId: "winning-light", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true,
  };
  const ack = manager.submitPlan(plan, actor.characterId); assert.equal(ack.accepted, true);
  assert.deepEqual(manager.submitPlan(plan, actor.characterId), ack, "identical retry must replay the stored plan acknowledgement");
  await manager.flushSettlements();
  const terminal = manager.encounter(encounterId)!;
  assert.equal(terminal.phase, "victory");
  assert.equal(settlements.length, 1); assert.equal(settlements[0]?.rewardsAllowed, true);
  const playerResult = terminal.participants.find(({ characterId }) => characterId === actor.characterId)!;
  assert.equal(playerResult.stamina, 51, "round-start recovery and 14-stamina light cost are resolved by the shared kernel");
  const events = manager.eventsSince(encounterId, 0); assert.ok(events.length > 0);
  assert.deepEqual(events.map(({ sequence }) => sequence), [...events.map(({ sequence }) => sequence)].sort((a, b) => a - b));
  assert.equal(new Set(events.map(({ sequence }) => sequence)).size, events.length);
  assert.equal(manager.isEnemyLeased("enemy.ash"), false);
  const laterSession = { ...actor, sessionId: "session-after-terminal" };
  assert.equal(manager.start(start(actor.characterId, ["enemy.later"], "start-after-terminal"), laterSession, [enemy("enemy.later", 2_000)]).accepted, true,
    "a terminal encounter must not leave a stale live-session lock");
});

test("defeating a quest-bound leased creature emits only its stable objective delta", async () => {
  const settlements: TurnSettlementInput[] = [];
  const manager = new TurnEncounterManager({
    shardId: "shard.quest-objective",
    idFactory: () => "quest-objective",
    settle: async (input) => { settlements.push(structuredClone(input)); },
  });
  const hero = player(1, 0);
  const mirebound = { ...enemy("enemy.mirebound", 2_000, 9), definitionId: "mirebound" };
  const encounterId = manager.start(start(hero.characterId, [mirebound.actorId]), hero, [mirebound]).encounterId!;
  const state = manager.encounter(encounterId)!;
  assert.equal(manager.submitPlan({
    protocolVersion: 2,
    encounterId,
    characterId: hero.characterId,
    commandId: "defeat-mirebound",
    round: state.round,
    revision: state.revision,
    actions: [{ selectionId: "defeat-mirebound", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: mirebound.actorId }],
    reaction: null,
    ready: true,
  }, hero.characterId).accepted, true);
  await manager.flushSettlements();
  assert.deepEqual(settlements[0]?.characters[0]?.rewards.quests, { "main_bells_below.objective.0": 1 });
  assert.deepEqual(settlements[0]?.characters[0]?.rewards.worldEvents, { enemyDefeats: { mirebound: 1 }, uniqueDefeats: [] });
});

test("plan authority rejects stale rounds, stale revisions, and command-body conflicts", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.plan", idFactory: () => "plan" });
  const leader = player(1, 0); const ally = player(2, 100);
  const encounterId = manager.start(start(leader.characterId), leader, [enemy()]).encounterId!;
  assert.equal(manager.join(join(ally.characterId, encounterId, "join-plan"), ally).accepted, true);
  const current = manager.encounter(encounterId)!;
  const base = holdPlan(manager, encounterId, leader.characterId, "valid-plan");
  assert.equal(manager.submitPlan({ ...base, commandId: "stale-round", round: current.round - 1 }, leader.characterId).rejection, "stale_round");
  assert.equal(manager.submitPlan({ ...base, commandId: "stale-revision", revision: current.revision - 1 }, leader.characterId).rejection, "stale_revision");
  const accepted = manager.submitPlan(base, leader.characterId);
  assert.equal(accepted.accepted, true);
  const conflict = manager.submitPlan({ ...base, actions: [{ ...base.actions[0]!, selectionId: "different-body" }] }, leader.characterId);
  assert.equal(conflict.rejection, "idempotency_conflict");
});

test("Shelter Step rejects self and untargeted allies but accepts the ally named by a disclosed enemy intent", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.ally-target", idFactory: () => "ally-target" });
  const leader = { ...player(1, 0), activeTechniqueId: "technique.guard.shelter_step" };
  const ally = player(2, 100);
  const unthreatened = player(3, -500);
  const encounterId = manager.start(start(leader.characterId), leader, [enemy()]).encounterId!;
  assert.equal(manager.join(join(ally.characterId, encounterId, "join-ally-target"), ally).accepted, true);
  assert.equal(manager.join(join(unthreatened.characterId, encounterId, "join-unthreatened"), unthreatened).accepted, true);
  const state = manager.encounter(encounterId)!;
  assert.deepEqual(state.publicState.enemyIntents[0]?.target, { kind: "actor", actorIds: [`character.${ally.characterId}`] });
  const shelterPlan = (commandId: string, targetActorId: string) => ({
    protocolVersion: 2,
    encounterId,
    characterId: leader.characterId,
    commandId,
    round: state.round,
    revision: state.revision,
    actions: [{
      selectionId: commandId,
      actionDefinitionId: "technique.equipped.primary",
      beat: 0 as const,
      targetActorId,
    }],
    reaction: null,
    ready: true,
  });
  assert.equal(manager.submitPlan(shelterPlan("shelter-self", `character.${leader.characterId}`), leader.characterId).rejection, "invalid_plan");
  assert.equal(manager.submitPlan(shelterPlan("shelter-unthreatened", `character.${unthreatened.characterId}`), leader.characterId).rejection, "invalid_plan");
  assert.equal(manager.submitPlan(shelterPlan("shelter-threatened", `character.${ally.characterId}`), leader.characterId).accepted, true);
  assert.equal(manager.encounter(encounterId)?.phase, "planning");
});

test("failed settlement remains nonterminal and retries the same outcome exactly once", async () => {
  let attempts = 0;
  const manager = new TurnEncounterManager({
    shardId: "shard.retry", idFactory: () => "retry",
    settle: async () => { attempts += 1; if (attempts === 1) throw new Error("database unavailable"); },
  });
  const actor = player(1, 0); const encounterId = manager.start(start(actor.characterId), actor, [enemy("enemy.ash", 2_000, 9)]).encounterId!;
  const state = manager.encounter(encounterId)!;
  manager.submitPlan({
    protocolVersion: 2, encounterId, characterId: actor.characterId, commandId: "retry-win", round: state.round, revision: state.revision,
    actions: [{ selectionId: "retry-light", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true,
  }, actor.characterId);
  await assert.rejects(manager.flushSettlements(), /database unavailable/);
  assert.equal(manager.encounter(encounterId)?.phase, "settling");
  assert.equal(manager.isEnemyLeased("enemy.ash"), true);
  assert.equal(manager.eventsSince(encounterId, 0).some(({ type, data }) => (type === "encounter_outcome" || type === "round_completed") && data.outcome === "victory"), false,
    "victory and reward signals must remain withheld before durable settlement");
  manager.advanceToTick(TURN_SETTLEMENT_RETRY_TICKS);
  await manager.flushSettlements();
  assert.equal(attempts, 2);
  assert.equal(manager.encounter(encounterId)?.phase, "victory");
  assert.ok(manager.eventsSince(encounterId, 0).some(({ type, data }) => type === "encounter_outcome" && data.outcome === "victory" && data.rewardsAllowed === true));
  assert.equal(manager.isEnemyLeased("enemy.ash"), false);
  assert.equal(manager.retrySettlement(encounterId), false);
});

test("withdrawn players are excluded from victory settlement and rewards", async () => {
  const settlements: TurnSettlementInput[] = [];
  const manager = new TurnEncounterManager({ shardId: "shard.withdraw", idFactory: () => "withdraw", settle: async (input) => { settlements.push(structuredClone(input)); } });
  const leaver = player(1, 0); const finisher = player(2, 100);
  const encounterId = manager.start(start(leaver.characterId), leaver, [enemy("enemy.ash", 2_000, 9)]).encounterId!;
  assert.equal(manager.join(join(finisher.characterId, encounterId, "join-finisher"), finisher).accepted, true);
  assert.equal(manager.withdraw(withdraw(leaver.characterId, encounterId), leaver.characterId).accepted, true);
  const state = manager.encounter(encounterId)!;
  manager.submitPlan({
    protocolVersion: 2, encounterId, characterId: finisher.characterId, commandId: "finish-after-withdraw", round: state.round, revision: state.revision,
    actions: [{ selectionId: "finish-light", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true,
  }, finisher.characterId);
  await manager.flushSettlements();
  assert.deepEqual(settlements[0]?.participantCharacterIds, [finisher.characterId]);
  assert.deepEqual(settlements[0]?.characters.map(({ characterId }) => characterId), [finisher.characterId]);
});

test("a prior-round item use persists after withdrawal while only the finisher is reward eligible", async () => {
  const settlements: TurnSettlementInput[] = [];
  const manager = new TurnEncounterManager({ shardId: "shard.prior-withdraw", idFactory: () => "prior-withdraw", settle: async (input) => { settlements.push(structuredClone(input)); } });
  const user = { ...player(1, 0), health: 50, quickItemId: "mending_draught", itemCharges: { mending_draught: 1 } };
  const finisher = player(2, 100);
  const encounterId = manager.start(start(user.characterId), user, [enemy("enemy.ash", 2_000, 9)]).encounterId!;
  manager.join(join(finisher.characterId, encounterId, "prior-join"), finisher);
  let state = manager.encounter(encounterId)!;
  manager.submitPlan({ protocolVersion: 2, encounterId, characterId: user.characterId, commandId: "drink", round: state.round, revision: state.revision, actions: [{ selectionId: "drink", actionDefinitionId: "item.equipped.quick", beat: 0 }], reaction: null, ready: true }, user.characterId);
  state = manager.encounter(encounterId)!;
  manager.submitPlan(holdPlan(manager, encounterId, finisher.characterId, "finisher-hold"), finisher.characterId);
  state = manager.encounter(encounterId)!;
  assert.equal(state.round, 2); assert.equal(state.participants.find(({ characterId }) => characterId === user.characterId)?.itemCharges.mending_draught, 0);
  manager.withdraw(withdraw(user.characterId, encounterId, "withdraw-after-use"), user.characterId);
  state = manager.encounter(encounterId)!;
  manager.submitPlan({ protocolVersion: 2, encounterId, characterId: finisher.characterId, commandId: "finish", round: state.round, revision: state.revision, actions: [{ selectionId: "finish", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true }, finisher.characterId);
  await manager.flushSettlements();
  const byId = new Map(settlements[0]!.characters.map((entry) => [entry.characterId, entry]));
  assert.equal(byId.get(user.characterId)?.finalItemCharges.mending_draught, 0);
  assert.equal(byId.get(user.characterId)?.rewardEligible, false);
  assert.deepEqual(byId.get(user.characterId)?.rewards, { inventory: {}, skillXp: {}, quests: {}, progression: {}, worldEvents: { enemyDefeats: {}, uniqueDefeats: [] } });
  assert.equal(byId.get(finisher.characterId)?.rewardEligible, true);
});

test("post-round all-player withdrawal settles abort costs while pre-round withdrawal writes nothing", async () => {
  const settlements: TurnSettlementInput[] = [];
  let ordinal = 0;
  const manager = new TurnEncounterManager({ shardId: "shard.abort-cost", idFactory: () => `abort-${++ordinal}`, settle: async (input) => { settlements.push(structuredClone(input)); } });
  const user = { ...player(1, 0), health: 50, quickItemId: "mending_draught", itemCharges: { mending_draught: 1 } };
  const ally = player(2, 100);
  const encounterId = manager.start(start(user.characterId, ["enemy.abort"]), user, [enemy("enemy.abort", 2_000, 70)]).encounterId!;
  manager.join(join(ally.characterId, encounterId, "abort-join"), ally);
  let state = manager.encounter(encounterId)!;
  manager.submitPlan({ protocolVersion: 2, encounterId, characterId: user.characterId, commandId: "abort-drink", round: state.round, revision: state.revision, actions: [{ selectionId: "abort-drink", actionDefinitionId: "item.equipped.quick", beat: 0 }], reaction: null, ready: true }, user.characterId);
  manager.submitPlan(holdPlan(manager, encounterId, ally.characterId, "abort-hold"), ally.characterId);
  manager.withdraw(withdraw(user.characterId, encounterId, "abort-user-withdraw"), user.characterId);
  manager.withdraw(withdraw(ally.characterId, encounterId, "abort-ally-withdraw"), ally.characterId);
  await manager.flushSettlements();
  assert.equal(settlements[0]?.outcome, "aborted");
  assert.equal(settlements[0]?.characters.find(({ characterId }) => characterId === user.characterId)?.finalItemCharges.mending_draught, 0);
  assert.ok(settlements[0]?.characters.every(({ rewardEligible }) => !rewardEligible));

  const pre = player(3, 0); const preId = manager.start(start(pre.characterId, ["enemy.pre"], "pre-start"), pre, [enemy("enemy.pre", 2_000)]).encounterId!;
  manager.withdraw(withdraw(pre.characterId, preId, "pre-withdraw"), pre.characterId);
  await manager.flushSettlements();
  assert.equal(settlements.length, 1, "pre-first-round withdrawal has no durable combat delta");
});

test("disconnect expiry inserts Hold plus Guard, removes after resolution, and absolute lease abort restores enemies", () => {
  const states: ReturnType<TurnEncounterManager["encounter"]>[] = []; const restored: TurnWorldEnemy[] = [];
  const manager = new TurnEncounterManager({ shardId: "shard.test", idFactory: () => "disconnect", onState: (state) => states.push(structuredClone(state)), restoreEnemy: (value) => restored.push(structuredClone(value)) });
  const first = player(1, 10_000); const second = player(2, 0);
  const started = manager.start(start(first.characterId), first, [enemy("enemy.ash", 2_000)]); const encounterId = started.encounterId!;
  assert.equal(manager.join(join(second.characterId, encounterId, "join-second"), second).accepted, true);
  assert.equal(manager.submitPlan(holdPlan(manager, encounterId, second.characterId, "second-ready"), second.characterId).accepted, true);
  assert.equal(manager.disconnect(first.characterId, first.sessionId), true);
  manager.advanceToTick(TURN_DISCONNECT_LEASE_TICKS);
  const locked = states.find((state) => state?.phase === "locked")!;
  const fallback = locked.participants.find(({ characterId }) => characterId === first.characterId)!;
  assert.equal(fallback.plan?.[0]?.kind, "hold"); assert.equal(fallback.reaction?.kind, "guard"); assert.equal(fallback.reaction?.staminaReserved, 8);
  const after = manager.encounter(encounterId)!;
  assert.equal(after.participants.find(({ characterId }) => characterId === first.characterId)?.withdrawn, true);
  assert.equal(after.publicState.leaderActorId, "character.char-2");

  const aborting = new TurnEncounterManager({ shardId: "shard.abort", idFactory: () => "abort", restoreEnemy: (value) => restored.push(structuredClone(value)) });
  const abortStart = aborting.start(start("char-3"), player(3, 0), [enemy()]);
  aborting.advanceToTick(TURN_PLANNING_LEASE_TICKS);
  assert.equal(aborting.encounter(abortStart.encounterId!)?.phase, "aborted");
  assert.equal(aborting.isEnemyLeased("enemy.ash"), false); assert.ok(restored.length >= 1);
});

test("an exhausted enemy truthfully Recovers, then authors its paid attack after round recovery", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.enemy-resource", idFactory: () => "enemy-resource" });
  const actor = player(1, 0);
  const exhausted = { ...enemy("enemy.ash", 2_000, 70), stamina: 0, maxStamina: 100, focus: 10, maxFocus: 10 };
  const encounterId = manager.start(start(actor.characterId), actor, [exhausted]).encounterId!;
  let state = manager.encounter(encounterId)!;
  assert.deepEqual(state.publicState.enemyIntents[0]?.damageBand, [0, 0]);
  assert.equal(state.publicState.enemyIntents[0]?.sensoryCue, "recover.breath");
  assert.equal(state.participants.find(({ actorId }) => actorId === "enemy.ash")?.plan?.[0]?.kind, "recover");
  manager.submitPlan(holdPlan(manager, encounterId, actor.characterId, "wait-recovery"), actor.characterId);
  state = manager.encounter(encounterId)!;
  assert.equal(state.round, 2);
  assert.notEqual(state.publicState.enemyIntents[0]?.sensoryCue, "recover.breath");
  assert.equal(state.participants.find(({ actorId }) => actorId === "enemy.ash")?.plan?.[0]?.kind, "technique");
});

test("reconnect is character-bound, rejects duplicate tabs, and restores only its private projection and event cursor", () => {
  const manager = new TurnEncounterManager({ shardId: "shard.test", idFactory: () => "reconnect" });
  const actor = player(1, 0); const ally = player(2, 100); const encounterId = manager.start(start(actor.characterId), actor, [enemy()]).encounterId!;
  manager.join(join(ally.characterId, encounterId, "reconnect-ally"), ally);
  let state = manager.encounter(encounterId)!;
  manager.submitPlan({ protocolVersion: 2, encounterId, characterId: actor.characterId, commandId: "reconnect-hit-owner", round: state.round, revision: state.revision, actions: [{ selectionId: "owner-hit", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true }, actor.characterId);
  state = manager.encounter(encounterId)!;
  manager.submitPlan({ protocolVersion: 2, encounterId, characterId: ally.characterId, commandId: "reconnect-hit-ally", round: state.round, revision: state.revision, actions: [{ selectionId: "ally-hit", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }], reaction: null, ready: true }, ally.characterId);
  assert.deepEqual(manager.reconnect(actor.characterId, "other-session"), { accepted: false, rejection: "duplicate_live_character" });
  assert.equal(manager.disconnect(actor.characterId, actor.sessionId), true);
  const reconnected = manager.reconnect(actor.characterId, "new-session");
  assert.equal(reconnected.accepted, true); assert.equal(reconnected.state?.participantState?.characterId, actor.characterId);
  assert.equal("serverSeed" in (reconnected.state as object), false);
  const privateResourceActors = new Set(reconnected.events?.filter(({ type }) => type === "resource_changed").map(({ actorId }) => actorId));
  assert.deepEqual(privateResourceActors, new Set([`character.${actor.characterId}`]), "reconnect replays exact resources only for its owning actor");
  assert.equal(reconnected.events?.some((event) => event.actorId === `character.${ally.characterId}` && "staminaCost" in event.data), false);
  assert.equal(manager.reconnect(actor.characterId, "third-session").rejection, "duplicate_live_character");
  assert.equal(manager.updateEventCursor(actor.characterId, encounterId, manager.encounter(encounterId)!.publicState.latestEventSequence + 1), false, "cursor cannot pass the server event head");

  const expired = new TurnEncounterManager({ shardId: "shard.expired", idFactory: () => "expired" });
  const first = player(10, 0); const second = player(11, 100);
  const expiredId = expired.start(start(first.characterId, ["enemy.expired"], "expired-start"), first, [enemy("enemy.expired", 2_000)]).encounterId!;
  expired.join(join(second.characterId, expiredId, "expired-join"), second);
  expired.disconnect(first.characterId, first.sessionId);
  expired.advanceToTick(TURN_DISCONNECT_LEASE_TICKS);
  assert.deepEqual(expired.reconnect(first.characterId, "late-session"), { accepted: false, rejection: "not_participant" });
});

test("spectator routing chooses one nearby encounter deterministically", () => {
  const left = new TurnEncounterManager({ shardId: "shard", idFactory: () => "left" });
  const right = new TurnEncounterManager({ shardId: "shard", idFactory: () => "right" });
  left.start(start("char-left", ["enemy.left"]), { ...player(1), characterId: "char-left", positionMm: { x: 0, y: 0, z: 0 } }, [enemy("enemy.left", 2_000)]);
  right.start(start("char-right", ["enemy.right"]), { ...player(2), characterId: "char-right", positionMm: { x: 20_000, y: 0, z: 0 } }, [enemy("enemy.right", 22_000)]);
  const encounters = [...left.encounters(), ...right.encounters()];
  assert.equal(selectNearbySpectatorEncounter({ x: 1_000, y: 0, z: 0 }, encounters), "turn.left");
  assert.equal(selectNearbySpectatorEncounter({ x: 21_000, y: 0, z: 0 }, encounters), "turn.right");
  const tied = selectNearbySpectatorEncounter({ x: 10_000, y: 0, z: 0 }, encounters);
  assert.equal(tied, "turn.left", "equal distance uses stable encounter ID ordering");
});

test("a 50-player shard holds twelve isolated four-player encounters plus two spectators", () => {
  let id = 0;
  const manager = new TurnEncounterManager({ shardId: "shard.50", idFactory: () => `group-${++id}` });
  const encounterIds: string[] = [];
  for (let group = 0; group < 12; group += 1) {
    const basePlayer = group * 4 + 1;
    const x = group * 20_000;
    const leader = player(basePlayer, x);
    const enemyId = `enemy.group.${group}`;
    const encounterId = manager.start(start(leader.characterId, [enemyId], `start-${group}`), leader, [enemy(enemyId, x + 2_000)]).encounterId!;
    encounterIds.push(encounterId);
    for (let offset = 1; offset < 4; offset += 1) {
      const member = player(basePlayer + offset, x + offset * 100);
      assert.equal(manager.join(join(member.characterId, encounterId, `join-${group}-${offset}`), member).accepted, true);
    }
  }
  assert.equal(manager.encounterCount, 12);
  assert.equal(new Set(encounterIds).size, 12);
  for (let group = 0; group < 12; group += 1) {
    const encounter = manager.encounter(encounterIds[group]!)!;
    assert.equal(encounter.publicState.participants.filter(({ team }) => team === "players").length, 4);
    assert.deepEqual(encounter.leasedEnemyIds, [`enemy.group.${group}`]);
  }
  assert.equal(manager.spectate(encounterIds[0]!, "spectator.49"), true);
  assert.equal(manager.spectate(encounterIds[11]!, "spectator.50"), true);
  const untouched = structuredClone(manager.encounter(encounterIds[1]!)!);
  const firstLeader = manager.encounter(encounterIds[0]!)!.participants.find(({ team }) => team === "players")!;
  assert.equal(manager.submitPlan(holdPlan(manager, encounterIds[0]!, firstLeader.characterId!, "group-zero-hold"), firstLeader.characterId!).accepted, true);
  assert.deepEqual(manager.encounter(encounterIds[1]!), untouched, "a plan in one encounter cannot mutate another encounter");
  assert.equal(manager.encounters().flatMap(({ publicState }) => publicState.spectatorActorIds).length, 2);
});

test("terminal replay state is retained briefly, then evicted from manager and replicated-room ownership", async () => {
  const disposed: string[] = [];
  let serial = 0;
  const manager = new TurnEncounterManager({
    shardId: "shard.retention",
    idFactory: () => `retained-${++serial}`,
    onEncounterDisposed: (encounterId) => disposed.push(encounterId),
  });
  const actor = player(1, 0);
  const request = start(actor.characterId, ["enemy.ash"], "retained-start");
  const encounterId = manager.start(request, actor, [enemy("enemy.ash", 2_000, 9)]).encounterId!;
  assert.equal(manager.submitPlan({
    ...holdPlan(manager, encounterId, actor.characterId, "retained-plan"),
    actions: [{ selectionId: "retained-light", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.ash" }],
  }, actor.characterId).accepted, true);
  await manager.flushSettlements();
  assert.equal(manager.encounter(encounterId)?.phase, "victory");
  manager.advanceToTick(TURN_TERMINAL_RETENTION_TICKS - 1);
  assert.ok(manager.encounter(encounterId), "terminal replay must remain available during its grace window");
  manager.advanceToTick(TURN_TERMINAL_RETENTION_TICKS);
  assert.equal(manager.encounter(encounterId), null);
  assert.deepEqual(disposed, [encounterId]);
  const restarted = manager.start(request, actor, [enemy("enemy.ash", 2_000, 9)]);
  assert.equal(restarted.accepted, true, "per-encounter command cache must be released with expired terminal state");
  assert.notEqual(restarted.encounterId, encounterId);
});
