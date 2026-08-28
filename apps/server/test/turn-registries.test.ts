import assert from "node:assert/strict";
import test from "node:test";
import { COMBAT_SKILL_EFFECT_MIGRATIONS, CREATURE_MECHANIC_CONTRACTS_V4 } from "@hearthmere/content/turn-combat";
import {
  NETWORK_PROTOCOL_VERSION,
  resolveTurnRound,
  type CanonicalTurnAction,
  type TurnPlanRequest,
} from "@hollow-march/shared";
import {
  DEFAULT_ACTIVE_TECHNIQUE_ID,
  TURN_SKILL_REGISTRY,
  canonicalizeServerTurnPlan,
  createEnemyAction,
  resolveRegisteredTurnEffect,
} from "../src/rooms/turnRegistries.js";

const request = (definitionId: string, targetActorId?: string): TurnPlanRequest => ({
  protocolVersion: NETWORK_PROTOCOL_VERSION,
  encounterId: "encounter.registry",
  characterId: "character.registry",
  commandId: `command.${definitionId}`,
  round: 1,
  revision: 1,
  actions: [{ selectionId: `selection.${definitionId}`, actionDefinitionId: definitionId, beat: 0, ...(targetActorId ? { targetActorId } : {}) }],
  reaction: null,
  ready: true,
});

const actor = (actorId: string, team: "players" | "enemies", health: number, plan: readonly CanonicalTurnAction[], itemCharges: Readonly<Record<string, number>> = {}) => ({
  actorId,
  team,
  initiative: team === "players" ? 10 : 5,
  positionMm: { x: team === "players" ? 0 : 2_000, y: 0, z: 0 },
  yawTenThousandthRadians: 0,
  health,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  focus: 100,
  maxFocus: 100,
  plan,
  reaction: null,
  itemCharges,
});

test("base registry entries remain structurally distinct and equipped technique is content-authored", () => {
  assert.equal(TURN_SKILL_REGISTRY.get("action.move")?.({ selectionId: "move", actionDefinitionId: "action.move", beat: 0, destinationMm: { x: 1_000, y: 0, z: 0 }, destinationYawTenThousandthRadians: 0 })?.kind, "move");
  assert.equal(TURN_SKILL_REGISTRY.get("action.light_attack")?.({ selectionId: "light", actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy" })?.kind, "light_attack");
  assert.equal(TURN_SKILL_REGISTRY.get("action.heavy_attack")?.({ selectionId: "heavy", actionDefinitionId: "action.heavy_attack", beat: 0, targetActorId: "enemy" })?.kind, "heavy_attack");

  const canonical = canonicalizeServerTurnPlan(request("technique.equipped.primary", "enemy"), {
    activeTechniqueId: DEFAULT_ACTIVE_TECHNIQUE_ID,
    quickItemId: null,
    itemCharges: {},
  });
  assert.equal(canonical.actions[0]?.kind, "technique");
  assert.equal(canonical.actions[0]?.definitionId, "technique.equipped.primary");
  assert.match("effectHandlerId" in canonical.actions[0]! ? canonical.actions[0].effectHandlerId : "", /^turn\.active\./);

  const passiveId = COMBAT_SKILL_EFFECT_MIGRATIONS[0]!.legacyId;
  assert.throws(() => canonicalizeServerTurnPlan(request(passiveId), {
    activeTechniqueId: DEFAULT_ACTIVE_TECHNIQUE_ID,
    quickItemId: null,
    itemCharges: {},
  }), /unknown action definition/);
});

test("quick item requires the authenticated charge and consumes only a resolved effect", () => {
  assert.throws(() => canonicalizeServerTurnPlan(request("item.equipped.quick"), {
    activeTechniqueId: DEFAULT_ACTIVE_TECHNIQUE_ID,
    quickItemId: null,
    itemCharges: {},
  }), /unknown action definition/);
  const itemPlan = canonicalizeServerTurnPlan(request("item.equipped.quick"), {
    activeTechniqueId: DEFAULT_ACTIVE_TECHNIQUE_ID,
    quickItemId: "mending_draught",
    itemCharges: { mending_draught: 1 },
  });
  const hold = TURN_SKILL_REGISTRY.get("action.hold")!({ selectionId: "enemy.hold", actionDefinitionId: "action.hold", beat: 0 })!;
  const resolved = resolveTurnRound({
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: "encounter.item.resolved",
    leaseGeneration: 1,
    round: 1,
    serverSeed: "server-owned-item-seed",
    actors: [actor("player", "players", 50, itemPlan.actions, { mending_draught: 1 }), actor("enemy", "enemies", 100, [hold])],
    authority: { canTraverse: () => true, hasLineOfSight: () => true, resolveEffect: resolveRegisteredTurnEffect },
  });
  const healed = resolved.actors.find(({ actorId }) => actorId === "player")!;
  assert.equal(healed.health, 92);
  assert.equal(healed.itemCharges.mending_draught, 0);
  assert.ok(resolved.events.some(({ type, data }) => type === "resource_changed" && data.resource === "item" && data.reason === "effect_resolved"));

  const canceled = resolveTurnRound({
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: "encounter.item.canceled",
    leaseGeneration: 1,
    round: 1,
    serverSeed: "server-owned-item-seed",
    actors: [actor("player", "players", 0, itemPlan.actions, { mending_draught: 1 }), actor("enemy", "enemies", 100, [hold])],
    authority: { canTraverse: () => true, hasLineOfSight: () => true, resolveEffect: resolveRegisteredTurnEffect },
  });
  assert.equal(canceled.actors.find(({ actorId }) => actorId === "player")!.itemCharges.mending_draught, 1);
  assert.ok(canceled.events.some(({ type, data }) => type === "action_canceled" && data.costsSpent === false));
});

test("enemy authoring targets allies by vitality and supplies nav-validated movement destinations", () => {
  const tideActors = [
    { actorId: "enemy.sacristan", team: "enemies" as const, positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100 },
    { actorId: "enemy.ally", team: "enemies" as const, positionMm: { x: 1_000, y: 0, z: 0 }, health: 20, maxHealth: 100 },
    { actorId: "player", team: "players" as const, positionMm: { x: 2_000, y: 0, z: 0 }, health: 100, maxHealth: 100 },
  ];
  const allyAction = createEnemyAction("tide_sacristan", "enemy.sacristan", tideActors, 1);
  assert.equal("targetActorId" in allyAction.action ? allyAction.action.targetActorId : null, "enemy.ally");
  assert.equal(allyAction.action.targetRelation, "ally");
  assert.deepEqual(allyAction.intent.target, { kind: "actor", actorIds: ["enemy.ally"] });

  for (const definitionId of ["tide_sacristan", "crypt_assembler"]) {
    const singleton = createEnemyAction(definitionId, "enemy.singleton", [
      { actorId: "enemy.singleton", team: "enemies", positionMm: { x: 0, y: 0, z: 0 }, health: 60, maxHealth: 100 },
      { actorId: "player", team: "players", positionMm: { x: 2_000, y: 0, z: 0 }, health: 100, maxHealth: 100 },
    ], 1);
    assert.equal(singleton.action.targetRelation, "self");
    assert.equal("targetActorId" in singleton.action ? singleton.action.targetActorId : null, "enemy.singleton");
    assert.deepEqual(singleton.intent.target, { kind: "actor", actorIds: ["enemy.singleton"] });
  }

  let traversalChecks = 0;
  const moving = createEnemyAction("ledger_crawler", "enemy.crawler", [
    { actorId: "enemy.crawler", team: "enemies", positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100 },
    { actorId: "player", team: "players", positionMm: { x: 4_000, y: 0, z: 0 }, health: 100, maxHealth: 100 },
  ], 1, { canTraverse: () => { traversalChecks += 1; return true; } });
  assert.ok("destinationMm" in moving.action && moving.action.destinationMm);
  assert.ok(traversalChecks > 0);
  assert.deepEqual(moving.intent.target, { kind: "actor", actorIds: ["player"] });
  assert.equal("interrupts" in moving.action && moving.action.interrupts, false, "counterplay interruption metadata cannot grant action interruption");
});

test("all 178 runtime intents disclose only the actor and primary status their resolver can affect", () => {
  const hold = TURN_SKILL_REGISTRY.get("action.hold")!({ selectionId: "hold", actionDefinitionId: "action.hold", beat: 0 })!;
  for (const record of CREATURE_MECHANIC_CONTRACTS_V4) {
    const actors = [
      { actorId: "enemy.source", team: "enemies" as const, positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100 },
      { actorId: "enemy.ally", team: "enemies" as const, positionMm: { x: 500, y: 0, z: 0 }, health: 40, maxHealth: 100 },
      { actorId: "player.target", team: "players" as const, positionMm: { x: 1_000, y: 0, z: 0 }, health: 100, maxHealth: 100 },
    ];
    const authored = createEnemyAction(record.creatureId, "enemy.source", actors, 1, { canTraverse: () => true });
    assert.equal(authored.intent.target.kind, "actor", record.creatureId);
    if (authored.intent.target.kind !== "actor") continue;
    const actionTargetId = "targetActorId" in authored.action && authored.action.targetActorId ? authored.action.targetActorId : "enemy.source";
    assert.deepEqual(authored.intent.target.actorIds, [actionTargetId], record.creatureId);
    assert.deepEqual(authored.intent.statusIcons, record.contract.turn.statusIcons.slice(0, 1), record.creatureId);
    assert.deepEqual(authored.intent.damageBand, authored.action.targetRelation === "hostile" ? record.contract.turn.damageBand : [0, 0], record.creatureId);

    const disclosedStatus = authored.intent.statusIcons[0];
    if (disclosedStatus) {
      let observed = false;
      for (let attempt = 0; attempt < 24 && !observed; attempt += 1) {
        const result = resolveTurnRound({
          protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: `intent.${record.creatureId}.${attempt}`, leaseGeneration: 1, round: 1, serverSeed: `intent-parity-${attempt}`,
          actors: [
            { ...actor("enemy.source", "enemies", 100, [authored.action]), initiative: 5, positionMm: { x: 0, y: 0, z: 0 }, stamina: 1_000, maxStamina: 1_000, focus: 1_000, maxFocus: 1_000 },
            { ...actor("enemy.ally", "enemies", 40, [hold]), initiative: 4, positionMm: { x: 500, y: 0, z: 0 } },
            { ...actor("player.target", "players", 100, [hold]), positionMm: { x: 1_000, y: 0, z: 0 } },
          ],
          authority: { canTraverse: () => true, hasLineOfSight: () => true, resolveEffect: resolveRegisteredTurnEffect },
        });
        observed = result.events.some(({ type, data }) => (type === "status_applied" && data.statusId === disclosedStatus) || (type === "buff_applied" && data.buffId === disclosedStatus));
      }
      assert.equal(observed, true, record.creatureId);
    }
  }
});
