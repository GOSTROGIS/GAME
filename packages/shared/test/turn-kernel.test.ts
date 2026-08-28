import assert from "node:assert/strict";
import test from "node:test";
import {
  NETWORK_PROTOCOL_VERSION, TURN_ENCOUNTER_PHASES, TURN_MAX_EVENT_SEQUENCE, TURN_RESOLUTION_BANDS,
  canonicalizeTurnPlanRequest, validateCreatureMechanicContractV4, validateEnemyIntentV1, validateSkillEffectV2,
  validateTurnEncounterV1, validateTurnPlanAck, validateTurnPlanRequest,
  type CanonicalDodgeReactionReservation, type CanonicalGuardReactionReservation, type CanonicalReactionReservation,
  type CanonicalTurnAction, type CanonicalTurnAttackAction, type CanonicalTurnMoveAction,
} from "../src/turn-combat.js";
import {
  canonicalTurnRootActionId,
  MAX_REACTIVE_INSERTIONS_PER_BAND, MAX_REACTIVE_INSERTIONS_PER_ROOT,
  resolveTurnRound, seededTurnRollPermille, validateTurnKernelInput,
  type TurnKernelActorV1, type TurnKernelInputV1,
} from "../src/turn-kernel.js";

const at = (x: number, z = 0) => ({ x, y: 0, z });
const authored = { posthumous: false, reactionTrigger: "none" as const, targetRelation: "self" as const };
const hold = (actionId: string, beat: 0 | 1 = 0): CanonicalTurnAction => ({ actionId, definitionId: "action.hold", kind: "hold", beat, band: "aftermath", apCost: 0, staminaCost: 0, focusCost: 0, ...authored });
const attack = (actionId: string, targetActorId: string, damage: number, overrides: Partial<CanonicalTurnAttackAction> = {}): CanonicalTurnAttackAction => ({
  actionId, targetActorId, damage, kind: "light_attack", beat: 0, band: "standard",
  definitionId: "action.light", apCost: 1, staminaCost: 14, focusCost: 0, rangeMm: 2_500, hitChancePermille: 1_000,
  posthumous: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile", interrupts: false,
  ...overrides,
} as CanonicalTurnAttackAction);
const moveAction = (actionId: string, destinationMm: ReturnType<typeof at>, beat: 0 | 1 = 0, band: "movement" | "standard" = "movement"): CanonicalTurnMoveAction => ({
  actionId, definitionId: "action.move", kind: "move", beat, band, apCost: 1, staminaCost: 8, focusCost: 0,
  posthumous: false, reactionTrigger: "none", targetRelation: "self", destinationMm, destinationYawTenThousandthRadians: 7_854,
});
const dodge = (destinationMm: ReturnType<typeof at>, yaw = 15_708): CanonicalDodgeReactionReservation => ({
  reactionId: "reaction.dodge.selection", definitionId: "reaction.dodge", kind: "dodge", staminaReserved: 24, destinationMm, destinationYawTenThousandthRadians: yaw,
});
const guard = (staminaReserved = 8, mitigationPermille = 500): CanonicalGuardReactionReservation => ({
  reactionId: "reaction.guard.selection", definitionId: "reaction.guard", kind: "guard", staminaReserved, mitigationPermille,
});
const defaultEffect = ({ action, actor }: Parameters<TurnKernelInputV1["authority"]["resolveEffect"]>[0]) => {
  const targetActorId = action.targetActorId ?? actor.actorId;
  if (action.damage) return { resolved: true, operations: [{ kind: "damage" as const, targetActorId, amount: action.damage }] };
  if (action.healing) return { resolved: true, operations: [{ kind: "heal" as const, targetActorId, amount: action.healing }] };
  return { resolved: false, reason: "no_effect", operations: [] };
};
const ALLOW_AUTHORITY = { canTraverse: () => true, hasLineOfSight: () => true, resolveEffect: defaultEffect };
const actor = (actorId: string, team: "players" | "enemies", overrides: Partial<TurnKernelActorV1> = {}): TurnKernelActorV1 => ({
  actorId, team, initiative: 10, positionMm: at(0), yawTenThousandthRadians: 0, health: 100, maxHealth: 100,
  stamina: 100, maxStamina: 100, focus: 20, maxFocus: 20, plan: [hold(`${actorId}:hold`)], reaction: null,
  ...overrides,
});
const encounter = (actors: readonly TurnKernelActorV1[], overrides: Partial<TurnKernelInputV1> = {}): TurnKernelInputV1 => ({
  protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: "encounter.kernel-test", leaseGeneration: 3,
  round: 1, serverSeed: "server-owned-test-seed", actors, authority: ALLOW_AUTHORITY, ...overrides,
});
const resultActor = (result: ReturnType<typeof resolveTurnRound>, actorId: string) => result.actors.find((entry) => entry.actorId === actorId)!;

test("protocol-v2 turn contracts expose the locked state machine and authored resolution bands", () => {
  assert.equal(NETWORK_PROTOCOL_VERSION, 2);
  assert.deepEqual(TURN_ENCOUNTER_PHASES, ["forming", "planning", "locked", "resolving", "settling", "victory", "defeat", "aborted"]);
  assert.deepEqual(TURN_RESOLUTION_BANDS, ["preemptive", "movement", "fast", "standard", "heavy", "aftermath"]);
});

test("plans provide two beats and heavy actions exclusively occupy both AP", () => {
  const twoBeatActor = actor("player", "players", {
    plan: [attack("light:one", "enemy", 2, { beat: 0 }), attack("light:two", "enemy", 2, { beat: 1 })],
  });
  const enemy = actor("enemy", "enemies", { positionMm: at(1_000), health: 20, maxHealth: 20 });
  const twoBeatResult = resolveTurnRound(encounter([twoBeatActor, enemy]));
  assert.equal(twoBeatResult.events.filter((event) => event.type === "action_started" && event.actorId === "player").length, 2);
  const heavy = attack("heavy", "enemy", 18, { kind: "heavy_attack", band: "heavy", apCost: 2, staminaCost: 28, occupiesBothBeats: true });
  assert.doesNotThrow(() => validateTurnKernelInput(encounter([actor("player", "players", { plan: [heavy] }), enemy])));
  assert.throws(() => validateTurnKernelInput(encounter([actor("player", "players", { plan: [heavy, hold("illegal", 1)] }), enemy])), /exclusively occupy both beats/);
});

test("same-band attacks read one snapshot, apply simultaneously, and produce mutual defeat", () => {
  const player = actor("player", "players", { health: 10, maxHealth: 10, plan: [attack("player:strike", "enemy", 10)] });
  const enemy = actor("enemy", "enemies", { positionMm: at(1_000), health: 10, maxHealth: 10, plan: [attack("enemy:strike", "player", 10)] });
  const result = resolveTurnRound(encounter([enemy, player]));
  assert.equal(result.outcome, "mutual_defeat");
  assert.equal(resultActor(result, "player").health, 0);
  assert.equal(resultActor(result, "enemy").health, 0);
  assert.equal(result.events.at(-1)?.data.rewardsAllowed, false);
});

test("dodge moves before hit evaluation; Guard mitigates at most half and unused reservations refund", () => {
  const attacker = actor("attacker", "players", { plan: [attack("attack", "dodger", 40)] });
  const dodger = actor("dodger", "enemies", {
    positionMm: at(2_000), reaction: dodge(at(5_000)),
  });
  const dodgeResult = resolveTurnRound(encounter([attacker, dodger]));
  assert.equal(resultActor(dodgeResult, "dodger").health, 100);
  assert.equal(resultActor(dodgeResult, "dodger").stamina, 76);
  assert.equal(resultActor(dodgeResult, "attacker").stamina, 86, "a movement-caused miss still spends its begun action cost");
  assert.ok(dodgeResult.events.some((event) => event.type === "attack_missed" && event.data.reason === "range_or_movement"));

  const guardTarget = actor("guard", "enemies", { positionMm: at(1_000), reaction: guard(8, 500) });
  const guardResult = resolveTurnRound(encounter([actor("striker", "players", { plan: [attack("guard-hit", "guard", 21)] }), guardTarget]));
  assert.equal(resultActor(guardResult, "guard").health, 89, "guard mitigation is clamped to 50 percent without favorable over-rounding");
  assert.equal(resultActor(guardResult, "guard").stamina, 92);

  const unused = actor("unused", "players", { reaction: guard() });
  const refundResult = resolveTurnRound(encounter([unused, actor("enemy", "enemies", { positionMm: at(5_000) })]));
  assert.equal(resultActor(refundResult, "unused").stamina, 100);
  assert.ok(refundResult.events.some((event) => event.type === "reaction_refunded" && event.actorId === "unused" && event.data.stamina === 8));
});

test("later-band defeated actions cancel without costs while explicitly posthumous actions resolve", () => {
  const execution = attack("execution", "player", 100, { band: "fast", interrupts: true });
  const heavy = attack("late-heavy", "enemy", 100, { kind: "heavy_attack", band: "heavy", apCost: 2, staminaCost: 28, occupiesBothBeats: true });
  const canceled = resolveTurnRound(encounter([
    actor("player", "players", { plan: [heavy] }),
    actor("enemy", "enemies", { positionMm: at(1_000), plan: [execution] }),
  ]));
  assert.equal(resultActor(canceled, "player").stamina, 100);
  assert.ok(canceled.events.some((event) => event.type === "action_canceled"
    && event.rootActionId === canonicalTurnRootActionId("encounter.kernel-test", 1, "player", 0, "heavy", 0)
    && event.data.costsSpent === false));

  const posthumous = resolveTurnRound(encounter([
    actor("player", "players", { plan: [{ ...heavy, posthumous: true }] }),
    actor("enemy", "enemies", { positionMm: at(1_000), plan: [execution] }),
  ]));
  assert.equal(posthumous.outcome, "mutual_defeat");
  assert.equal(resultActor(posthumous, "player").stamina, 72);
});

test("consumables are retained on pre-begin cancellation and consumed only when their effect resolves", () => {
  const execution = attack("execution", "player", 100, { band: "fast" });
  const itemAction: CanonicalTurnAction = {
    actionId: "throw-vial", definitionId: "item.vial.throw", kind: "item", beat: 0, band: "heavy", apCost: 1,
    staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile",
    effectHandlerId: "effect.throw-vial", itemId: "item.vial", targetActorId: "enemy",
    rangeMm: 2_500, damage: 5, hitChancePermille: 1_000, interrupts: false,
  };
  const canceled = resolveTurnRound(encounter([
    actor("player", "players", { plan: [itemAction], itemCharges: { "item.vial": 1 } }),
    actor("enemy", "enemies", { positionMm: at(1_000), plan: [execution] }),
  ]));
  assert.equal(resultActor(canceled, "player").itemCharges["item.vial"], 1);

  const resolved = resolveTurnRound(encounter([
    actor("player", "players", { plan: [itemAction], itemCharges: { "item.vial": 1 } }),
    actor("enemy", "enemies", { positionMm: at(1_000) }),
  ]));
  assert.equal(resultActor(resolved, "player").itemCharges["item.vial"], 0);
  assert.equal(resultActor(resolved, "enemy").health, 95);
});

test("movement conflicts use initiative then stable actor ID and still spend begun action costs", () => {
  const destination = at(1_000, 1_000);
  const move = (id: string): CanonicalTurnAction => moveAction(`${id}:move`, destination);
  const result = resolveTurnRound(encounter([
    actor("lower", "players", { initiative: 5, positionMm: at(0), plan: [move("lower")] }),
    actor("winner", "enemies", { initiative: 20, positionMm: at(2_000), plan: [move("winner")] }),
  ]));
  assert.deepEqual(resultActor(result, "winner").positionMm, destination);
  assert.deepEqual(resultActor(result, "lower").positionMm, at(0));
  assert.equal(resultActor(result, "winner").stamina, 92);
  assert.equal(resultActor(result, "lower").stamina, 92);
  assert.ok(result.events.some((event) => event.type === "movement_conflict" && event.actorId === "lower"));

  const tie = resolveTurnRound(encounter([
    actor("a", "players", { positionMm: at(0), plan: [move("a")] }),
    actor("b", "enemies", { positionMm: at(2_000), plan: [move("b")] }),
  ]));
  assert.deepEqual(resultActor(tie, "a").positionMm, destination, "lexically lower actor ID wins tied initiative");
});

test("server-owned seeded rolls and replay events are deterministic across command ordering", () => {
  const chance = attack("uncertain", "enemy", 7, { hitChancePermille: 500 });
  const player = actor("player", "players", { plan: [chance] });
  const enemy = actor("enemy", "enemies", { positionMm: at(1_000) });
  const forward = resolveTurnRound(encounter([player, enemy], { eventSequenceStart: 40 }));
  const reversed = resolveTurnRound(encounter([enemy, player], { eventSequenceStart: 40 }));
  assert.deepEqual(reversed, forward);
  assert.equal(seededTurnRollPermille("seed", 1, "action"), seededTurnRollPermille("seed", 1, "action"));
  assert.notEqual(seededTurnRollPermille("seed", 1, "action"), seededTurnRollPermille("seed", 2, "action"));
  assert.deepEqual(forward.events.map((event) => event.sequence), forward.events.map((_, index) => 41 + index));
  assert.equal(forward.latestEventSequence, forward.events.at(-1)?.sequence);
});

test("reactive chains stop at eight insertions per root action", () => {
  const retaliate = [{ ruleId: "retaliate", trigger: "damaged" as const, damage: 1, maxUsesPerRound: 64, posthumous: true }];
  const result = resolveTurnRound(encounter([
    actor("a", "players", { health: 1_000, maxHealth: 1_000, plan: [attack("root", "b", 1)], reactiveRules: retaliate }),
    actor("b", "enemies", { positionMm: at(1_000), health: 1_000, maxHealth: 1_000, reactiveRules: retaliate }),
  ]));
  assert.equal(result.events.filter((event) => event.type === "reactive_inserted").length, MAX_REACTIVE_INSERTIONS_PER_ROOT);
  assert.ok(result.events.some((event) => event.type === "reactive_cap_reached" && event.data.rootInsertions === MAX_REACTIVE_INSERTIONS_PER_ROOT));
});

test("reactive work across independent roots stops at the 64-insertion band cap", () => {
  const reactive = [{ ruleId: "echo", trigger: "damaged" as const, damage: 1, maxUsesPerRound: 64, posthumous: true }];
  const actors: TurnKernelActorV1[] = [];
  for (let index = 0; index < 4; index += 1) {
    const playerId = `p${index}`; const enemyId = `e${index}`; const offset = index * 10_000;
    actors.push(actor(playerId, "players", { positionMm: at(offset), health: 10_000, maxHealth: 10_000, plan: [attack(`player-root${index}`, enemyId, 1)], reactiveRules: reactive }));
    actors.push(actor(enemyId, "enemies", { positionMm: at(offset + 1_000), health: 10_000, maxHealth: 10_000, plan: [attack(`enemy-root${index}`, playerId, 1)], reactiveRules: reactive }));
  }
  const result = resolveTurnRound(encounter(actors));
  assert.equal(result.events.filter((event) => event.type === "reactive_inserted").length, MAX_REACTIVE_INSERTIONS_PER_BAND);
  assert.ok(result.events.some((event) => event.type === "reactive_cap_reached" && event.data.bandInsertions === MAX_REACTIVE_INSERTIONS_PER_BAND));
});

test("integer-millimetre contracts reject fractional positions", () => {
  assert.throws(() => validateTurnKernelInput(encounter([actor("player", "players", { positionMm: at(0.5) }), actor("enemy", "enemies")])), /safe integer/);
});

test("runtime validation rejects forged discriminants, beats, AP, teams, damaging holds, and forbidden fields", () => {
  const enemy = actor("enemy", "enemies");
  const forged = (action: Record<string, unknown>) => actor("player", "players", { plan: [action as unknown as CanonicalTurnAction] });
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...hold("bad-kind"), kind: "dance" }), enemy])), /kind is invalid/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...hold("bad-beat"), beat: 2 }), enemy])), /beat is invalid/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...hold("bad-ap"), apCost: 3 }), enemy])), /apCost/);
  assert.throws(() => validateTurnKernelInput(encounter([
    { ...actor("player", "players"), team: "neutral" as unknown as "players" }, enemy,
  ])), /team must be players or enemies/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...hold("damaging-hold"), damage: 99 }), enemy])), /forbids field damage/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...hold("bad-boolean"), posthumous: "yes" }), enemy])), /posthumous must be boolean/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({ ...attack("bad-target", "enemy", 1), targetActorId: 42 }), enemy])), /targetActorId is invalid/);
  assert.throws(() => validateTurnKernelInput(encounter([forged({
    ...moveAction("move-with-target", at(1_000)),
    targetActorId: "enemy",
  }), enemy])), /forbids field targetActorId/);
});

test("reaction contracts enforce Dodge 24, Guard minimum 8, finite mitigation, and the authoritative cap", () => {
  const enemy = actor("enemy", "enemies");
  for (const staminaReserved of [23, 25]) {
    assert.throws(() => validateTurnKernelInput(encounter([
      actor("player", "players", { reaction: { ...dodge(at(1_000), 0), staminaReserved } as unknown as CanonicalReactionReservation }), enemy,
    ])), /exactly 24/);
  }
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players", { reaction: { ...guard(), staminaReserved: 7 } as unknown as CanonicalReactionReservation }), enemy,
    ])), /safe integer in 8/);
  for (const mitigationPermille of [Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => validateTurnKernelInput(encounter([
      actor("player", "players", { reaction: { ...guard(), mitigationPermille } }), enemy,
    ])), /safe integer/);
  }
  assert.throws(() => validateTurnKernelInput(encounter([actor("player", "players", { reaction: { ...guard(), mitigationPermille: 900 } }), enemy])), /0\.\.500/);
  const capped = resolveTurnRound(encounter([
    actor("player", "players", { reaction: guard() }),
    actor("enemy", "enemies", { positionMm: at(1_000), plan: [attack("hit", "player", 20)] }),
  ]));
  assert.equal(resultActor(capped, "player").health, 90);
  assert.equal(capped.events.find((event) => event.type === "reaction_triggered")?.data.mitigationPermille, 500);
});

test("movement revalidates from each beat position and carries quantized yaw through authoritative navigation", () => {
  const traversals: Array<{ from: number; to: number; fromYaw: number; toYaw: number }> = [];
  const authority = {
    canTraverse: (query: Parameters<TurnKernelInputV1["authority"]["canTraverse"]>[0]) => {
      traversals.push({ from: query.fromMm.x, to: query.toMm.x, fromYaw: query.fromYawTenThousandthRadians, toYaw: query.toYawTenThousandthRadians });
      return true;
    },
    hasLineOfSight: () => true,
    resolveEffect: defaultEffect,
  };
  const first = moveAction("move-one", at(4_000));
  const second: CanonicalTurnMoveAction = { ...moveAction("move-two", at(8_000), 1), destinationYawTenThousandthRadians: 15_708 };
  const result = resolveTurnRound(encounter([
    actor("player", "players", { plan: [first, second] }), actor("enemy", "enemies", { positionMm: at(20_000) }),
  ], { authority }));
  assert.deepEqual(resultActor(result, "player").positionMm, at(8_000));
  assert.equal(resultActor(result, "player").yawTenThousandthRadians, 15_708);
  assert.deepEqual(traversals, [
    { from: 0, to: 4_000, fromYaw: 0, toYaw: 7_854 },
    { from: 4_000, to: 8_000, fromYaw: 7_854, toYaw: 15_708 },
  ]);
  const tooFarSecond = resolveTurnRound(encounter([
    actor("player", "players", { plan: [first, { ...second, destinationMm: at(8_001) }] }),
    actor("enemy", "enemies", { positionMm: at(20_000) }),
  ]));
  assert.deepEqual(resultActor(tooFarSecond, "player").positionMm, at(4_000));
  assert.ok(tooFarSecond.events.some((event) => event.type === "movement_conflict" && event.data.reason === "distance"));
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players", { yawTenThousandthRadians: 0.5 }), actor("enemy", "enemies"),
  ])), /yawTenThousandthRadians must be a safe integer/);
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players", { plan: [{ ...first, destinationYawTenThousandthRadians: 0.5 }] }), actor("enemy", "enemies"),
  ])), /destinationYawTenThousandthRadians must be a safe integer/);
});

test("authoritative traversal rejects move and dodge paths while LOS rejects attacks without weakening spent-cost rules", () => {
  const denied = { canTraverse: () => false, hasLineOfSight: () => false, resolveEffect: defaultEffect };
  const move = { ...moveAction("denied-move", at(1_000)), destinationYawTenThousandthRadians: 1 } as CanonicalTurnAction;
  const moved = resolveTurnRound(encounter([
    actor("player", "players", { plan: [move] }), actor("enemy", "enemies", { positionMm: at(8_000) }),
  ], { authority: denied }));
  assert.deepEqual(resultActor(moved, "player").positionMm, at(0));
  assert.equal(resultActor(moved, "player").stamina, 92);
  assert.ok(moved.events.some((event) => event.type === "movement_conflict" && event.data.reason === "navigation"));

  const dodgeDenied = resolveTurnRound(encounter([
    actor("player", "players", { plan: [attack("strike", "enemy", 20)] }),
    actor("enemy", "enemies", { positionMm: at(1_000), reaction: dodge(at(3_000), 3) }),
  ], { authority: { canTraverse: () => false, hasLineOfSight: () => true, resolveEffect: defaultEffect } }));
  assert.equal(resultActor(dodgeDenied, "enemy").health, 80);
  assert.equal(resultActor(dodgeDenied, "enemy").stamina, 100, "a rejected dodge is untriggered and refunded");

  const noSight = resolveTurnRound(encounter([
    actor("player", "players", { plan: [attack("blind-strike", "enemy", 20)] }), actor("enemy", "enemies", { positionMm: at(1_000) }),
  ], { authority: denied }));
  assert.equal(resultActor(noSight, "enemy").health, 100);
  assert.equal(resultActor(noSight, "player").stamina, 86);
  assert.ok(noSight.events.some((event) => event.type === "attack_missed" && event.data.reason === "line_of_sight"));
});

test("server canonical roots and rolls ignore client action IDs and remain globally unambiguous", () => {
  const run = (actionId: string, encounterId = "encounter.kernel-test") => resolveTurnRound(encounter([
    actor("player", "players", { plan: [attack(actionId, "enemy", 7, { hitChancePermille: 500 })] }),
    actor("enemy", "enemies", { positionMm: at(1_000) }),
  ], { encounterId }));
  const first = run("client-one"); const renamed = run("client-two");
  const firstAttack = first.events.find((event) => event.type === "attack_hit" || event.type === "attack_missed")!;
  const renamedAttack = renamed.events.find((event) => event.type === "attack_hit" || event.type === "attack_missed")!;
  assert.equal(firstAttack.type, renamedAttack.type);
  assert.equal(firstAttack.data.roll, renamedAttack.data.roll);
  assert.equal(firstAttack.rootActionId, renamedAttack.rootActionId);
  assert.notEqual(firstAttack.rootActionId, run("client-one", "encounter.other").events.find((event) => event.type === "attack_hit" || event.type === "attack_missed")?.rootActionId);
  assert.notEqual(
    canonicalTurnRootActionId("ab", 1, "c", 0, "standard", 0),
    canonicalTurnRootActionId("a", 1, "bc", 0, "standard", 0),
    "length-prefixed components prevent concatenation collisions",
  );
});

test("encounters reject a fifth player and missing authority callbacks", () => {
  const players = Array.from({ length: 5 }, (_, index) => actor(`player-${index}`, "players", { positionMm: at(index * 1_000) }));
  assert.throws(() => validateTurnKernelInput(encounter([...players, actor("enemy", "enemies", { positionMm: at(10_000) })])), /one to four players/);
  assert.throws(() => validateTurnKernelInput({
    ...encounter([actor("player", "players"), actor("enemy-two", "enemies", { positionMm: at(2_000) })]), authority: undefined,
  } as unknown as TurnKernelInputV1), /authority|callbacks/);
});

test("wire plans contain selections only and require server canonicalization", () => {
  const request = {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: "encounter.wire",
    characterId: "character.one",
    commandId: "command.one",
    round: 2,
    revision: 7,
    actions: [{ selectionId: "selection.strike", actionDefinitionId: "action.light", beat: 0, targetActorId: "enemy" }],
    reaction: null,
    ready: true,
  } as const;
  assert.doesNotThrow(() => validateTurnPlanRequest(request));
  assert.throws(() => validateTurnPlanRequest({
    ...request,
    actions: [{ ...request.actions[0], damage: 999_999 }],
  }), /forbids field damage/);
  const sparseActions = new Array(1); sparseActions.length = 1;
  assert.throws(() => validateTurnPlanRequest({ ...request, actions: sparseActions }), /cannot be sparse/);

  const plan = canonicalizeTurnPlanRequest(request, {
    resolveAction: (selection) => attack(selection.selectionId, selection.targetActorId!, 17, {
      beat: selection.beat, definitionId: selection.actionDefinitionId,
    }),
    resolveReaction: () => null,
  });
  assert.equal((plan.actions[0] as CanonicalTurnAttackAction).damage, 17, "damage comes from the server registry");
  assert.throws(() => canonicalizeTurnPlanRequest(request, {
    resolveAction: (selection) => attack(selection.selectionId, "other-enemy", 17, {
      beat: selection.beat, definitionId: selection.actionDefinitionId,
    }),
    resolveReaction: () => null,
  }), /changed an untrusted selection/);

  assert.doesNotThrow(() => validateTurnPlanAck({
    protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: request.encounterId, characterId: request.characterId,
    commandId: request.commandId, round: 2, revision: 8, accepted: true, planHash: "a".repeat(64),
  }));
  assert.throws(() => validateTurnPlanAck({
    protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: request.encounterId, characterId: request.characterId,
    commandId: request.commandId, round: 2, revision: 8, accepted: false, rejection: "stale_round", planHash: "a".repeat(64),
  }), /cannot include planHash/);
});

test("skill, creature, and enemy-intent validators are strict discriminated contracts", () => {
  const encounterEffect = {
    apCost: 1, staminaCost: 9, focusCost: 2, band: "fast", targetRule: "nearest_hostile", priority: 4,
    posthumous: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile", effectHandlerId: "effect.skill",
  } as const;
  assert.doesNotThrow(() => validateSkillEffectV2({
    version: 2, id: "skill.mire-cut", handlerId: "handler.mire-cut", scope: "both",
    world: { presentationSeconds: 0.8, resourceCost: { stamina: 9 } }, encounter: encounterEffect,
  }));
  assert.throws(() => validateSkillEffectV2({
    version: 2, id: "skill.bad", handlerId: "handler.bad", scope: "world",
    world: { presentationSeconds: 1, resourceCost: {} }, encounter: encounterEffect,
  }), /forbids field encounter/);

  const creature = {
    version: 4, handlerId: "creature.ash-husk", moveId: "move.cinder-lunge",
    presentationV3: { startupSeconds: 0.3, activeSeconds: 0.2, recoverySeconds: 0.7, telegraphSeconds: 0.4 },
    turn: {
      band: "fast", apCost: 1, staminaCost: 10, focusCost: 0, targetRule: "nearest_hostile", targetRelation: "hostile",
      reactionTrigger: "hostile_targeted", effectHandlerId: "effect.cinder-lunge", rangeMm: 2_500, hitChancePermille: 900,
      priority: 5, actionInterrupts: false, damageBand: [8, 12], statusIcons: ["status.ash"], sensoryCue: "cue.dry-breath",
      interruptRule: "interrupt.stagger", counterplay: "counter.dodge-side", posthumous: false,
    },
    implementationStatus: "specified",
  } as const;
  assert.doesNotThrow(() => validateCreatureMechanicContractV4(creature));
  assert.throws(() => validateCreatureMechanicContractV4({
    ...creature, turn: { ...creature.turn, damageBand: [13, 12] },
  }), /damageBand is reversed/);
  assert.throws(() => validateCreatureMechanicContractV4({
    ...creature, presentationV3: { ...creature.presentationV3, startupSeconds: Number.NaN },
  }), /must be finite/);

  const intent = {
    version: 1, actorId: "enemy", actionId: "intent.attack", target: { kind: "actor", actorIds: ["player"] },
    band: "standard", damageBand: [4, 8], statusIcons: ["status.ash"], sensoryCue: "cue.inhale",
    interruptRule: "interrupt.before-standard", exactDamageKnown: false,
  } as const;
  assert.doesNotThrow(() => validateEnemyIntentV1(intent));
  assert.throws(() => validateEnemyIntentV1({
    ...intent, target: { kind: "area", centerMm: at(0), radiusMm: Number.POSITIVE_INFINITY },
  }), /safe integer/);
});

const encounterContractFixture = () => {
  const common = {
    joinOrder: 0, initiative: 10, connected: true, reconnectDeadlineTick: null,
    ready: false, withdrawn: false, positionMm: at(0), health: 100, maxHealth: 100,
  } as const;
  const player = {
    actorId: "player", characterId: "character.player", team: "players", ...common,
    stamina: 100, maxStamina: 100, focus: 20, maxFocus: 20, itemCharges: {}, activeTechniqueId: "technique.swordsmanship.severing_riposte", quickItemId: null, plan: null, reaction: null,
    lastAcknowledgedCommandId: null, eventCursor: 0,
  } as const;
  const enemy = {
    actorId: "enemy", characterId: null, team: "enemies", ...common, joinOrder: 1, positionMm: at(2_000),
    stamina: 100, maxStamina: 100, focus: 20, maxFocus: 20, itemCharges: {}, activeTechniqueId: null, quickItemId: null, plan: null, reaction: null,
    lastAcknowledgedCommandId: null, eventCursor: 0,
  } as const;
  const publicPlayer = {
    actorId: player.actorId, characterId: player.characterId, team: player.team, joinOrder: player.joinOrder,
    initiative: player.initiative, connected: player.connected, reconnectDeadlineTick: player.reconnectDeadlineTick,
    ready: player.ready, withdrawn: player.withdrawn, positionMm: player.positionMm, health: player.health, maxHealth: player.maxHealth,
  };
  const publicEnemy = {
    actorId: enemy.actorId, characterId: enemy.characterId, team: enemy.team, joinOrder: enemy.joinOrder,
    initiative: enemy.initiative, connected: enemy.connected, reconnectDeadlineTick: enemy.reconnectDeadlineTick,
    ready: enemy.ready, withdrawn: enemy.withdrawn, positionMm: enemy.positionMm, health: enemy.health, maxHealth: enemy.maxHealth,
  };
  return {
    version: 1, protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: "encounter.contract", shardId: "shard.one",
    leaseOwnerEncounterId: "encounter.contract", leaseGeneration: 2, leasedEnemyIds: ["enemy"],
    originalEnemySnapshot: { snapshotId: "snapshot.enemy", sha256: "b".repeat(64), enemyActorIds: ["enemy"] },
    serverSeed: "server.seed", phase: "planning", round: 1, revision: 3, createdAtTick: 100,
    planningLeaseExpiresAtTick: 18_100, disconnectedParticipantLeaseTicks: 1_800,
    participants: [player, enemy],
    publicState: {
      encounterId: "encounter.contract", phase: "planning", round: 1, revision: 3,
      leaderActorId: "player", leadershipRule: "join_order_then_character_id", participantLimit: 4,
      participants: [publicPlayer, publicEnemy], spectatorActorIds: ["spectator"],
      enemyIntents: [{
        version: 1, actorId: "enemy", actionId: "intent.enemy", target: { kind: "actor", actorIds: ["player"] },
        band: "standard", damageBand: [5, 9], statusIcons: [], sensoryCue: "cue.rattle", interruptRule: "interrupt.fast", exactDamageKnown: false,
      }],
      latestEventSequence: 0,
    },
  } as const;
};

test("encounter validation binds leases, original snapshots, public mirrors, leader transfer, reconnects, and spectators", () => {
  const valid = encounterContractFixture();
  assert.doesNotThrow(() => validateTurnEncounterV1(valid));
  assert.throws(() => validateTurnEncounterV1({ ...valid, leaseOwnerEncounterId: "encounter.other" }), /lease owner/);
  assert.throws(() => validateTurnEncounterV1({
    ...valid, originalEnemySnapshot: { ...valid.originalEnemySnapshot, enemyActorIds: ["enemy.other"] },
  }), /snapshot IDs must match/);
  assert.throws(() => validateTurnEncounterV1({
    ...valid, publicState: {
      ...valid.publicState,
      participants: [{ ...valid.publicState.participants[0], health: 99 }, valid.publicState.participants[1]],
    },
  }), /public participant diverges/);
  assert.throws(() => validateTurnEncounterV1({
    ...valid, publicState: { ...valid.publicState, leaderActorId: null },
  }), /leader violates join-order/);
  const disconnected = {
    ...valid,
    participants: [{ ...valid.participants[0], connected: false, reconnectDeadlineTick: 160 }, valid.participants[1]],
    publicState: {
      ...valid.publicState,
      participants: [{ ...valid.publicState.participants[0], connected: false, reconnectDeadlineTick: 160 }, valid.publicState.participants[1]],
    },
  };
  assert.doesNotThrow(() => validateTurnEncounterV1(disconnected));
});

test("move and dodge use one collision transaction with successful-origin vacating", () => {
  const swap = resolveTurnRound(encounter([
    actor("player", "players", { positionMm: at(0), plan: [moveAction("player.move", at(2_000))] }),
    actor("enemy", "enemies", { positionMm: at(2_000), plan: [moveAction("enemy.move", at(0))] }),
  ]));
  assert.deepEqual(resultActor(swap, "player").positionMm, at(2_000));
  assert.deepEqual(resultActor(swap, "enemy").positionMm, at(0));

  const blocked = resolveTurnRound(encounter([
    actor("attacker-a", "players", { positionMm: at(-2_000), plan: [attack("strike-a", "dodger-a", 1)] }),
    actor("dodger-a", "enemies", { positionMm: at(0), reaction: dodge(at(1_000)) }),
    actor("dodger-b", "enemies", { positionMm: at(2_000), reaction: dodge(at(0)) }),
    actor("attacker-b", "players", { positionMm: at(4_000), plan: [attack("strike-b", "dodger-b", 1)] }),
  ], { authority: { ...ALLOW_AUTHORITY, canTraverse: (query) => query.actorId !== "dodger-a" } }));
  assert.deepEqual(resultActor(blocked, "dodger-a").positionMm, at(0));
  assert.deepEqual(resultActor(blocked, "dodger-b").positionMm, at(2_000), "a failed origin-vacating dodge cannot permit overlap");
  assert.equal(new Set(blocked.actors.map((entry) => JSON.stringify(entry.positionMm))).size, blocked.actors.length);
});

test("handled effects apply deterministic operations and gate consumable use", () => {
  const item: CanonicalTurnAction = {
    actionId: "item.rite.selection", definitionId: "item.rite", kind: "item", beat: 0, band: "standard", apCost: 1,
    staminaCost: 0, focusCost: 2, posthumous: false, reactionTrigger: "none", targetRelation: "self",
    effectHandlerId: "effect.rite", itemId: "item.rite", targetActorId: "player", destinationMm: at(1_000),
    destinationYawTenThousandthRadians: 10_000, rangeMm: 1_000, healing: 10, hitChancePermille: 1_000, interrupts: false,
  };
  const authority = {
    ...ALLOW_AUTHORITY,
    resolveEffect: () => ({
      resolved: true,
      operations: [
        { kind: "heal" as const, targetActorId: "player", amount: 10 },
        { kind: "status" as const, targetActorId: "player", statusId: "status.veiled", stacks: 1, durationRounds: 2 },
        { kind: "buff" as const, targetActorId: "player", buffId: "buff.watchful", magnitude: 3, durationRounds: 1 },
        { kind: "destination" as const, actorId: "player", destinationMm: at(1_000), destinationYawTenThousandthRadians: 10_000 },
      ],
    }),
  };
  const resolved = resolveTurnRound(encounter([
    actor("player", "players", { health: 50, plan: [item], itemCharges: { "item.rite": 1 } }),
    actor("enemy", "enemies", { positionMm: at(10_000) }),
  ], { authority }));
  const player = resultActor(resolved, "player");
  assert.equal(player.health, 60); assert.deepEqual(player.positionMm, at(1_000)); assert.equal(player.yawTenThousandthRadians, 10_000);
  assert.deepEqual(player.statuses["status.veiled"], { stacks: 1, remainingRounds: 2 });
  assert.deepEqual(player.buffs["buff.watchful"], { magnitude: 3, remainingRounds: 1 });
  assert.equal(player.itemCharges["item.rite"], 0);
  assert.ok(resolved.events.some((event) => event.type === "effect_resolved"));

  const unresolved = resolveTurnRound(encounter([
    actor("player", "players", { health: 50, plan: [item], itemCharges: { "item.rite": 1 } }),
    actor("enemy", "enemies", { positionMm: at(10_000) }),
  ], { authority: { ...ALLOW_AUTHORITY, resolveEffect: () => ({ resolved: false, reason: "no_valid_effect", operations: [] }) } }));
  assert.equal(resultActor(unresolved, "player").itemCharges["item.rite"], 1);
});

test("statuses and buffs apply at round start, expire deterministically, and cannot crash a reserved reaction", () => {
  const first = resolveTurnRound(encounter([
    actor("player", "players", {
      health: 100,
      maxHealth: 100,
      stamina: 50,
      maxStamina: 100,
      statuses: { bleeding: { stacks: 2, remainingRounds: 1 } },
      buffs: { watchful: { magnitude: 5, remainingRounds: 1 } },
    }),
    actor("enemy", "enemies", { positionMm: at(5_000) }),
  ]));
  const afterFirst = resultActor(first, "player");
  assert.equal(afterFirst.health, 98, "damaging status stacks apply once at the next round start");
  assert.equal(afterFirst.stamina, 68, "recovery, status pressure, and buff magnitude compose deterministically");
  assert.deepEqual(afterFirst.statuses, {});
  assert.deepEqual(afterFirst.buffs, {});
  assert.ok(first.events.some((event) => event.type === "damage_applied" && event.actorId === "player" && event.data.reason === "ongoing_status"));

  const second = resolveTurnRound(encounter([
    actor("player", "players", {
      health: afterFirst.health,
      stamina: afterFirst.stamina,
      statuses: afterFirst.statuses,
      buffs: afterFirst.buffs,
    }),
    actor("enemy", "enemies", { positionMm: at(5_000) }),
  ], { round: 2 }));
  assert.equal(resultActor(second, "player").health, 98, "expired effects do not apply again");
  assert.equal(resultActor(second, "player").stamina, 83);

  const reservationCanceled = resolveTurnRound(encounter([
    actor("player", "players", {
      stamina: 20,
      reaction: guard(8),
      statuses: { rattled: { stacks: 30, remainingRounds: 1 } },
    }),
    actor("enemy", "enemies", { positionMm: at(5_000) }),
  ]));
  assert.equal(resultActor(reservationCanceled, "player").stamina, 5);
  assert.ok(reservationCanceled.events.some((event) => event.type === "reaction_refunded"
    && event.actorId === "player" && event.data.reason === "insufficient_after_round_effects"));
});

test("Shelter Step's preemptive ward mitigates later same-round damage and expires before the next round", () => {
  const shelter: CanonicalTurnAction = {
    actionId: "shelter-step",
    definitionId: "technique.equipped.primary",
    kind: "technique",
    beat: 0,
    band: "preemptive",
    apCost: 1,
    staminaCost: 12,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "none",
    targetRelation: "ally",
    effectHandlerId: "turn.active.technique.guard.shelter_step",
    targetActorId: "ally",
    rangeMm: 4_000,
    hitChancePermille: 1_000,
    interrupts: false,
  };
  const authority = {
    ...ALLOW_AUTHORITY,
    resolveEffect: (query: Parameters<TurnKernelInputV1["authority"]["resolveEffect"]>[0]) => query.action.effectHandlerId === shelter.effectHandlerId
      ? { resolved: true, operations: [{ kind: "buff" as const, targetActorId: "ally", buffId: "sheltered", magnitude: 2, durationRounds: 1 }] }
      : defaultEffect(query),
  };
  const first = resolveTurnRound(encounter([
    actor("warder", "players", { positionMm: at(0), plan: [shelter] }),
    actor("ally", "players", { positionMm: at(1_000) }),
    actor("enemy", "enemies", { positionMm: at(2_000), plan: [attack("enemy-hit", "ally", 40)] }),
  ], { authority }));
  const protectedAlly = resultActor(first, "ally");
  assert.equal(protectedAlly.health, 70, "magnitude two provides a truthful 25% current-round ward");
  assert.deepEqual(protectedAlly.buffs.sheltered, { magnitude: 2, remainingRounds: 1 });

  const second = resolveTurnRound(encounter([
    actor("warder", "players", { positionMm: at(0) }),
    actor("ally", "players", { positionMm: at(1_000), health: protectedAlly.health, buffs: protectedAlly.buffs }),
    actor("enemy", "enemies", { positionMm: at(2_000), plan: [attack("enemy-hit-next", "ally", 40)] }),
  ], { round: 2 }));
  assert.equal(resultActor(second, "ally").health, 30, "the one-round ward expires before next-round attacks");
  assert.deepEqual(resultActor(second, "ally").buffs, {});
});

test("effect handlers cannot multiply authored budgets or duplicate target operations", () => {
  const action: CanonicalTurnAction = {
    actionId: "technique.selection", definitionId: "technique.split", kind: "technique", beat: 0, band: "standard", apCost: 1,
    staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile",
    effectHandlerId: "effect.split", targetActorId: "enemy-a", rangeMm: 2_500, damage: 10, hitChancePermille: 1_000, interrupts: false,
  };
  const actors = [
    actor("player", "players", { plan: [action] }), actor("enemy-a", "enemies", { positionMm: at(1_000) }),
    actor("enemy-b", "enemies", { positionMm: at(2_000) }),
  ];
  assert.throws(() => resolveTurnRound(encounter(actors, { authority: {
    ...ALLOW_AUTHORITY,
    resolveEffect: () => ({ resolved: true, operations: [
      { kind: "damage", targetActorId: "enemy-a", amount: 6 }, { kind: "damage", targetActorId: "enemy-b", amount: 5 },
    ] }),
  } })), /exceeded aggregate authored damage/);
  assert.throws(() => resolveTurnRound(encounter(actors, { authority: {
    ...ALLOW_AUTHORITY,
    resolveEffect: () => ({ resolved: true, operations: [
      { kind: "damage", targetActorId: "enemy-a", amount: 6 }, { kind: "damage", targetActorId: "enemy-a", amount: 4 },
    ] }),
  } })), /duplicated a damage target/);
});

test("reactions require authored hostile triggers and round-start funding", () => {
  const quietDamage: CanonicalTurnAction = {
    actionId: "quiet.selection", definitionId: "technique.quiet", kind: "technique", beat: 0, band: "standard", apCost: 1,
    staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: "none", targetRelation: "hostile",
    effectHandlerId: "effect.quiet", targetActorId: "enemy", rangeMm: 2_500, damage: 20, hitChancePermille: 1_000, interrupts: false,
  };
  const result = resolveTurnRound(encounter([
    actor("player", "players", { plan: [quietDamage] }),
    actor("enemy", "enemies", { positionMm: at(1_000), reaction: guard() }),
  ]));
  assert.equal(resultActor(result, "enemy").health, 80);
  assert.equal(resultActor(result, "enemy").stamina, 100);
  assert.ok(!result.events.some((event) => event.type === "reaction_triggered"));

  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players", { stamina: 0, reaction: guard(16) }), actor("enemy", "enemies", { positionMm: at(2_000) }),
  ])), /cannot fund reaction reservation/);
  assert.doesNotThrow(() => validateTurnKernelInput(encounter([
    actor("player", "players", { stamina: 0, reaction: guard(15) }), actor("enemy", "enemies", { positionMm: at(2_000) }),
  ])));
});

test("kernel bounds event sequences, sparse arrays, finite state, teams, and starting occupancy", () => {
  const baseActors = [actor("player", "players"), actor("enemy", "enemies", { positionMm: at(2_000) })];
  assert.throws(() => validateTurnKernelInput(encounter(baseActors, { eventSequenceStart: TURN_MAX_EVENT_SEQUENCE + 1 })), /eventSequenceStart/);
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players"), actor("enemy", "enemies"),
  ])), /starting positions must be unique/);
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player-a", "players", { positionMm: at(0) }), actor("player-b", "players", { positionMm: at(1_000) }),
  ])), /at least one enemy/);
  assert.throws(() => validateTurnKernelInput(encounter([
    actor("player", "players", { health: Number.NaN }), actor("enemy", "enemies", { positionMm: at(2_000) }),
  ])), /safe integer/);
  const sparseActors = new Array(2); sparseActors[0] = baseActors[0];
  assert.throws(() => validateTurnKernelInput(encounter(sparseActors as TurnKernelActorV1[])), /cannot be sparse/);
});

test("length-prefixed reactive identities do not collide on delimiter-like IDs", () => {
  const firstRule = [{ ruleId: "z", trigger: "damaged" as const, damage: 1, maxUsesPerRound: 1, posthumous: true }];
  const secondRule = [{ ruleId: "y:z", trigger: "damaged" as const, damage: 1, maxUsesPerRound: 1, posthumous: true }];
  const result = resolveTurnRound(encounter([
    actor("x:y", "players", { positionMm: at(0), reactiveRules: firstRule }),
    actor("s1", "enemies", { positionMm: at(1_000), plan: [attack("root.one", "x:y", 1)] }),
    actor("x", "enemies", { positionMm: at(10_000), reactiveRules: secondRule }),
    actor("s2", "players", { positionMm: at(11_000), plan: [attack("root.two", "x", 1)] }),
  ]));
  const inserted = result.events.filter((event) => event.type === "reactive_inserted");
  assert.equal(inserted.length, 2);
  assert.equal(new Set(inserted.map((event) => event.data.actionId)).size, 2);
  assert.notEqual(
    seededTurnRollPermille("a|b", "c", 1),
    seededTurnRollPermille("a", "b|c", 1),
    "length-prefixing prevents delimiter boundary ambiguity in server-owned seeds",
  );
});
