import assert from "node:assert/strict";
import test from "node:test";
import {
  NETWORK_PROTOCOL_VERSION,
  projectCombatEventBatchForAudienceV1,
  validateCombatEventBatchForAudienceV1,
  validateCombatEventBatchV1,
  validateCombatEventV1,
  validateEncounterClientStateV1,
  validateEncounterPublicState,
  validatePrivateActorResourcesV1,
  validateTurnEncounterStartRequest,
  type EncounterClientStateV1,
  type EncounterParticipantState,
  type EncounterPublicState,
} from "../src/index.js";

test("owner-only actor resources reject identity and bounds ambiguity", () => {
  const resources = { protocolVersion: 2, actorId: "session.owner", characterId: "character.owner", stamina: 17, maxStamina: 90, focus: 8, maxFocus: 40 };
  assert.doesNotThrow(() => validatePrivateActorResourcesV1(resources));
  assert.throws(() => validatePrivateActorResourcesV1({ ...resources, stamina: 91 }), /stamina/);
  assert.throws(() => validatePrivateActorResourcesV1({ ...resources, leaked: true }), /forbids field/);
});

const player = (): EncounterParticipantState => ({
  actorId: "character.char-a", characterId: "char-a", team: "players", joinOrder: 0, initiative: 10,
  connected: true, reconnectDeadlineTick: null, ready: false, withdrawn: false,
  positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100,
  stamina: 50, maxStamina: 100, focus: 20, maxFocus: 50, itemCharges: {}, activeTechniqueId: "technique.swordsmanship.severing_riposte", quickItemId: null, plan: null, reaction: null,
  lastAcknowledgedCommandId: null, eventCursor: 0,
});
const enemy = (): EncounterParticipantState => ({
  actorId: "enemy.ash", characterId: null, team: "enemies", joinOrder: 64, initiative: 5,
  connected: true, reconnectDeadlineTick: null, ready: true, withdrawn: false,
  positionMm: { x: 2_000, y: 0, z: 0 }, health: 70, maxHealth: 70,
  stamina: 100, maxStamina: 100, focus: 1, maxFocus: 1,
  plan: [{ actionId: "enemy-action", definitionId: "move.cinder_lunge", kind: "technique", beat: 0, band: "heavy", apCost: 1, staminaCost: 18, focusCost: 0, posthumous: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile", effectHandlerId: "turn.creature.ash_husk.cinder_lunge", targetActorId: "character.char-a", rangeMm: 2_700, damage: 12, hitChancePermille: 760, interrupts: true }],
  reaction: null, itemCharges: {}, activeTechniqueId: null, quickItemId: null, lastAcknowledgedCommandId: null, eventCursor: 0,
});

const publicParticipant = ({ stamina: _s, maxStamina: _ms, focus: _f, maxFocus: _mf, itemCharges: _items, activeTechniqueId: _technique, quickItemId: _quickItem, plan: _p, reaction: _r, lastAcknowledgedCommandId: _a, eventCursor: _e, ...value }: EncounterParticipantState) => value;
const publicState = (): EncounterPublicState => ({
  encounterId: "turn.encounter", phase: "planning", round: 1, revision: 1,
  leaderActorId: "character.char-a", leadershipRule: "join_order_then_character_id", participantLimit: 4,
  participants: [publicParticipant(player()), publicParticipant(enemy())], spectatorActorIds: [],
  enemyIntents: [{ version: 1, actorId: "enemy.ash", actionId: "enemy-action", target: { kind: "actor", actorIds: ["character.char-a"] }, band: "heavy", damageBand: [9, 16], statusIcons: ["bleed"], sensoryCue: "cinder-rattle", interruptRule: "interrupt-before-heavy", exactDamageKnown: false }],
  latestEventSequence: 0,
});
const clientState = (): EncounterClientStateV1 => ({
  version: 1, protocolVersion: NETWORK_PROTOCOL_VERSION, publicState: publicState(),
  viewerState: { mode: "participant", actorId: "character.char-a", characterId: "char-a", canPlan: true, canWithdraw: true, reconnectDeadlineTick: null },
  participantState: player(),
});

test("turn start and client projections reject duplicate IDs and authority escalation", () => {
  assert.throws(() => validateTurnEncounterStartRequest({ protocolVersion: 2, commandId: "cmd", characterId: "char-a", enemyActorIds: ["enemy.ash", "enemy.ash"] }), /unique/);
  assert.doesNotThrow(() => validateEncounterClientStateV1(clientState()));

  const wrongLeader = structuredClone(publicState()) as any; wrongLeader.leaderActorId = null;
  assert.throws(() => validateEncounterPublicState(wrongLeader), /leader/);
  const duplicateSpectator = structuredClone(publicState()) as any; duplicateSpectator.spectatorActorIds = ["spectator", "spectator"];
  assert.throws(() => validateEncounterPublicState(duplicateSpectator), /unique/);
  const unknownIntent = structuredClone(publicState()) as any; unknownIntent.enemyIntents[0]!.actorId = "enemy.outsider";
  assert.throws(() => validateEncounterPublicState(unknownIntent), /known enemy/);
  const outsiderTarget = structuredClone(publicState()) as any;
  if (outsiderTarget.enemyIntents[0]!.target.kind === "actor") outsiderTarget.enemyIntents[0]!.target.actorIds = ["character.outsider"];
  assert.throws(() => validateEncounterPublicState(outsiderTarget), /outsider/);

  const privateDrift = structuredClone(clientState()) as any; privateDrift.participantState!.health = 99;
  assert.throws(() => validateEncounterClientStateV1(privateDrift), /diverge/);
  const escalated = structuredClone(clientState()) as any; escalated.publicState.phase = "resolving"; escalated.viewerState.canPlan = true;
  assert.throws(() => validateEncounterClientStateV1(escalated), /permissions/);
  const falseReconnect = structuredClone(clientState()) as any; falseReconnect.viewerState = { ...falseReconnect.viewerState, mode: "reconnecting", canPlan: false, canWithdraw: false, reconnectDeadlineTick: 10 };
  assert.throws(() => validateEncounterClientStateV1(falseReconnect), /mode diverges/);
});

test("combat events use one canonical bounded trust-boundary validator", () => {
  const event = { version: 1 as const, sequence: 1, encounterId: "turn.encounter", round: 1, beat: 0 as const, band: "standard" as const, type: "damage_applied" as const, actorId: "character.char-a", targetActorId: "enemy.ash", rootActionId: "root", data: { amount: 9 } };
  assert.doesNotThrow(() => validateCombatEventV1(event));
  assert.doesNotThrow(() => validateCombatEventBatchV1([event, { ...event, sequence: 2 }]));
  assert.throws(() => validateCombatEventBatchV1([event, { ...event, encounterId: "turn.other", sequence: 2 }]), /mix encounters/);
  assert.throws(() => validateCombatEventV1({ ...event, data: { bad: { nested: true } } }), /bounded scalar/);
});

test("combat projection exposes exact resource ledgers only to their owning participant", () => {
  const base = { version: 1 as const, encounterId: "turn.encounter", round: 1, beat: 0 as const, band: "standard" as const, actorId: "character.char-a", targetActorId: null, rootActionId: "root" };
  const events = [
    { ...base, sequence: 1, type: "action_started" as const, data: { kind: "item", staminaCost: 8, focusCost: 2, clientActionId: "private-selection" } },
    { ...base, sequence: 2, type: "resource_changed" as const, data: { resource: "item", itemId: "mending_draught", before: 1, after: 0 } },
    { ...base, actorId: "character.char-b", sequence: 3, type: "resource_changed" as const, data: { resource: "stamina", before: 80, after: 66 } },
    { ...base, sequence: 4, type: "damage_applied" as const, targetActorId: "enemy.ash", data: { amount: 9 } },
  ];
  const participantAudience = { mode: "participant" as const, viewerActorId: "character.char-a" };
  const participant = projectCombatEventBatchForAudienceV1(events, participantAudience);
  assert.deepEqual(participant.map(({ sequence }) => sequence), [1, 2, 4]);
  assert.deepEqual(participant[1]?.data, events[1]?.data, "the owning participant retains exact item deltas");
  assert.doesNotThrow(() => validateCombatEventBatchForAudienceV1(participant, participantAudience));
  const otherAudience = { mode: "participant" as const, viewerActorId: "character.char-b" };
  const otherParticipant = projectCombatEventBatchForAudienceV1(events, otherAudience);
  assert.deepEqual(otherParticipant.map(({ sequence }) => sequence), [1, 3, 4]);
  assert.deepEqual(otherParticipant[0]?.data, { kind: "item" }, "party-member action costs are redacted");
  assert.throws(() => validateCombatEventBatchForAudienceV1(events, otherAudience), /another actor|private/);
  const spectatorAudience = { mode: "spectator" as const, viewerActorId: null };
  const spectator = projectCombatEventBatchForAudienceV1(events, spectatorAudience);
  assert.deepEqual(spectator.map(({ type }) => type), ["action_started", "damage_applied"]);
  assert.deepEqual(spectator[0]?.data, { kind: "item" });
  assert.doesNotThrow(() => validateCombatEventBatchForAudienceV1(spectator, spectatorAudience));
  assert.throws(() => validateCombatEventBatchForAudienceV1(events, spectatorAudience), /another actor|private/);
});
