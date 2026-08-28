import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  NETWORK_PROTOCOL_VERSION,
  validateAuthenticatedCharacterV1,
  validateTurnPlanRequest,
  type CanonicalTurnAction,
  type CombatEventV1,
  type EncounterClientStateV1,
  type TurnKernelActorV1,
} from "@hollow-march/shared";
import { assertOfflineCanvasCannotSettleSharedRewards, resolveOfflineCanvasTurn } from "../src/turn/OfflineCanvasTurnRuntime.js";
import { ACTIVE_TECHNIQUE_BY_ID } from "@hearthmere/content/turn-combat";
import { buildTurnEncounterJoinRequest, buildTurnEncounterStartRequest, buildTurnEncounterWithdrawRequest, turnClientConsumesWorldInput, turnClientInputEnabled } from "../src/turn/TurnClientProtocol.js";
import { EQUIPPED_TECHNIQUE_CHOICES, buildTurnPlanRequest, mergeCombatEvents, moveDestination, turnActionChoices, turnPlanBudget, type TurnEncounterProjection, type TurnPlanDraft } from "../src/turn/TurnCombatModel.js";
import { buildTurnProjectionPrimitives } from "../src/turn/TurnWorldProjection.js";

const playerPublic = Object.freeze({ actorId: "character.player", characterId: "player", team: "players" as const, joinOrder: 0, initiative: 10, connected: true, reconnectDeadlineTick: null, ready: false, withdrawn: false, positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100 });
const enemyPublic = Object.freeze({ actorId: "enemy.ash", characterId: null, team: "enemies" as const, joinOrder: 1, initiative: 8, connected: true, reconnectDeadlineTick: null, ready: true, withdrawn: false, positionMm: { x: 2_000, y: 0, z: 0 }, health: 60, maxHealth: 60 });

function clientState(
  mode: "participant" | "spectator" | "reconnecting" = "participant",
  phase: EncounterClientStateV1["publicState"]["phase"] = "planning",
  activeTechniqueId: string | null = "technique.swordsmanship.severing_riposte",
  quickItemId: string | null = "mending_draught",
): EncounterClientStateV1 {
  const participantState = mode === "spectator" ? null : { ...playerPublic, stamina: 100, maxStamina: 100, focus: 50, maxFocus: 50, itemCharges: { mending_draught: 1 }, activeTechniqueId, quickItemId, plan: null, reaction: null, lastAcknowledgedCommandId: null, eventCursor: 0 };
  return {
    version: 1,
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    publicState: {
      encounterId: "encounter.test", phase, round: 1, revision: 2, leaderActorId: "character.player", leadershipRule: "join_order_then_character_id", participantLimit: 4,
      participants: [playerPublic, enemyPublic], spectatorActorIds: mode === "spectator" ? ["spectator.viewer"] : [],
      enemyIntents: [{ version: 1, actorId: "enemy.ash", actionId: "enemy.intent", target: { kind: "area", centerMm: { x: 0, y: 0, z: 0 }, radiusMm: 2_000 }, band: "standard", damageBand: [12, 16], statusIcons: ["ash_mark"], sensoryCue: "cloth draws inward", interruptRule: "stagger before standard", exactDamageKnown: false }], latestEventSequence: 0,
    },
    viewerState: mode === "spectator"
      ? { mode, actorId: "spectator.viewer", characterId: "viewer", canPlan: false, canWithdraw: false, reconnectDeadlineTick: null }
      : { mode, actorId: "character.player", characterId: "player", canPlan: mode === "participant" && phase === "planning", canWithdraw: mode === "participant" && phase === "planning", reconnectDeadlineTick: mode === "reconnecting" ? 1_800 : null },
    participantState,
  };
}

const projection = (state = clientState(), events: readonly CombatEventV1[] = []): TurnEncounterProjection => ({ state, events });

test("turn plan wire contains selections only and preserves two-beat authority boundary", () => {
  const draft: TurnPlanDraft = { beats: [{ choiceId: "light_attack", targetActorId: "enemy.ash" }, { choiceId: "hold" }], reaction: "guard" };
  const request = buildTurnPlanRequest(projection(), draft, "command.plan");
  validateTurnPlanRequest(request);
  assert.equal(request.protocolVersion, 2);
  assert.deepEqual(request.actions.map(({ beat }) => beat), [0, 1]);
  assert.equal(request.reaction?.reactionDefinitionId, "reaction.guard");
  assert.deepEqual(Object.keys(request.actions[0]!).sort(), ["actionDefinitionId", "beat", "selectionId", "targetActorId"]);
  assert.equal("damage" in request.actions[0]!, false);
  assert.equal("band" in request.actions[0]!, false);
});

test("four v2 client commands bind character identity and canonical ordering", () => {
  const start = buildTurnEncounterStartRequest("player", ["enemy.z", "enemy.a"], "command.start");
  const join = buildTurnEncounterJoinRequest("player", "encounter.test", "command.join");
  const withdraw = buildTurnEncounterWithdrawRequest("player", "encounter.test", "command.withdraw");
  const plan = buildTurnPlanRequest(projection(), { beats: [{ choiceId: "hold" }, { choiceId: "hold" }], reaction: "none" }, "command.plan");
  assert.deepEqual(start.enemyActorIds, ["enemy.a", "enemy.z"]);
  assert.deepEqual([start.protocolVersion, join.protocolVersion, withdraw.protocolVersion, plan.protocolVersion], [2, 2, 2, 2]);
  assert.deepEqual([start.characterId, join.characterId, withdraw.characterId, plan.characterId], ["player", "player", "player", "player"]);
});

test("post-join authenticated character projection is strict and bounded", () => {
  assert.doesNotThrow(() => validateAuthenticatedCharacterV1({ protocolVersion: 2, characterId: "character.1234-abcd" }));
  for (const invalid of [
    { protocolVersion: 1, characterId: "character.1" },
    { protocolVersion: 2, characterId: "" },
    { protocolVersion: 2, characterId: "character.1", accountId: "leak" },
    { protocolVersion: 2, characterId: "x".repeat(161) },
    { protocolVersion: 2, characterId: "bad\u0000character" },
    [],
  ]) assert.throws(() => validateAuthenticatedCharacterV1(invalid));
});

test("equipped technique and item use authenticated aliases with checked costs and target relations", () => {
  for (const [id, choice] of Object.entries(EQUIPPED_TECHNIQUE_CHOICES)) {
    const contract = ACTIVE_TECHNIQUE_BY_ID.get(id)?.effect.encounter;
    assert.ok(contract, `${id} must resolve to canonical content`);
    assert.deepEqual(
      { apCost: choice.apCost, staminaCost: choice.staminaCost, focusCost: choice.focusCost, target: choice.target },
      { apCost: contract.apCost, staminaCost: contract.staminaCost, focusCost: contract.focusCost, target: contract.targetRelation },
      `${id} client presentation must match canonical authored mechanics`,
    );
  }
  const choices = turnActionChoices(clientState().participantState);
  const technique = choices.find(({ id }) => id === "technique")!;
  assert.equal(technique.definitionId, "technique.equipped.primary");
  const techniquePlan = buildTurnPlanRequest(projection(), { beats: [{ choiceId: "technique", targetActorId: "enemy.ash" }, null], reaction: "none" }, "command.technique");
  assert.equal(techniquePlan.actions[0]?.actionDefinitionId, "technique.equipped.primary");
  assert.equal(techniquePlan.actions[0]?.targetActorId, "enemy.ash");
  const item = choices.find(({ id }) => id === "item")!;
  assert.equal(item.definitionId, "item.equipped.quick");
  const itemDraft: TurnPlanDraft = { beats: [{ choiceId: "item" }, null], reaction: "none" };
  assert.equal(turnPlanBudget(itemDraft, clientState().participantState).valid, true);
  const itemPlan = buildTurnPlanRequest(projection(), itemDraft, "command.item");
  assert.equal(itemPlan.actions[0]?.actionDefinitionId, "item.equipped.quick");
  assert.equal(itemPlan.actions[0]?.targetActorId, undefined);

  const shelterState = clientState("participant", "planning", "technique.guard.shelter_step");
  const shelter = turnActionChoices(shelterState.participantState).find(({ id }) => id === "technique")!;
  assert.equal(shelter.target, "ally");
  assert.equal(shelter.description, "Give a threatened ally 25% damage ward for the remaining bands of this round.");
  const shelterPlan = buildTurnPlanRequest(projection(shelterState), { beats: [{ choiceId: "technique", targetActorId: "character.player" }, null], reaction: "none" }, "command.shelter");
  assert.equal(shelterPlan.actions[0]?.actionDefinitionId, "technique.equipped.primary");

  const windState = clientState("participant", "planning", "technique.vitality.second_wind");
  const windPlan = buildTurnPlanRequest(projection(windState), { beats: [{ choiceId: "technique" }, null], reaction: "none" }, "command.wind");
  assert.equal(windPlan.actions[0]?.targetActorId, undefined);
  const unavailable = turnActionChoices(clientState("participant", "planning", null, null).participantState);
  assert.equal(unavailable.find(({ id }) => id === "technique")?.definitionId, null);
  assert.equal(unavailable.find(({ id }) => id === "item")?.definitionId, null);
  const recoverPlan = buildTurnPlanRequest(projection(), { beats: [{ choiceId: "recover", targetActorId: "character.player" }, null], reaction: "none" }, "command.recover");
  assert.equal(recoverPlan.actions[0]?.targetActorId, undefined, "self actions never send an explicit actor target");
});

test("participant input is leased only during active phases; spectators and terminal states stay realtime", () => {
  assert.equal(turnClientConsumesWorldInput(clientState("participant", "planning")), true);
  assert.equal(turnClientConsumesWorldInput(clientState("reconnecting", "planning")), true);
  assert.equal(turnClientConsumesWorldInput(clientState("spectator", "planning")), false);
  for (const phase of ["victory", "defeat", "aborted"] as const) assert.equal(turnClientConsumesWorldInput(clientState("participant", phase)), false);
  assert.equal(turnClientInputEnabled(true, clientState("participant", "planning"), true, true), false);
  assert.equal(turnClientInputEnabled(true, clientState("participant", "victory"), true, true), true);
});

test("budget, destination and authoritative event replay remain deterministic", () => {
  const destination = moveDestination({ x: 1_000, y: 25, z: 2_000 }, "west");
  assert.deepEqual(destination, { x: -3_000, y: 25, z: 2_000 });
  const budget = turnPlanBudget({ beats: [{ choiceId: "heavy_attack", targetActorId: "enemy.ash" }, null], reaction: "guard" }, clientState().participantState);
  assert.deepEqual({ ap: budget.apSpent, stamina: budget.staminaCommitted, reaction: budget.reactionStamina, valid: budget.valid }, { ap: 2, stamina: 28, reaction: 8, valid: true });
  const event: CombatEventV1 = { version: 1, sequence: 1, encounterId: "encounter.test", round: 1, beat: 0, band: "standard", type: "damage_applied", actorId: "character.player", targetActorId: "enemy.ash", rootActionId: "root.1", data: { amount: 9 } };
  assert.deepEqual(mergeCombatEvents([], [event], event.encounterId), [event]);
  assert.throws(() => mergeCombatEvents([event], [{ ...event, data: { amount: 10 } }], event.encounterId), /changed during replay/);
});

test("Canvas ecology proof resolves through shared kernel and can never settle shared rewards", () => {
  const hold = (actorId: string): readonly CanonicalTurnAction[] => [0, 1].map((beat) => ({ actionId: `${actorId}.hold.${beat}`, definitionId: "action.hold", kind: "hold" as const, beat: beat as 0 | 1, band: "aftermath" as const, apCost: 0 as const, staminaCost: 0 as const, focusCost: 0 as const, posthumous: false, reactionTrigger: "none" as const, targetRelation: "self" as const }));
  const attack: CanonicalTurnAction = { actionId: "player.light", definitionId: "action.light_attack", kind: "light_attack", beat: 0, band: "standard", apCost: 1, staminaCost: 14, focusCost: 0, posthumous: false, targetActorId: "enemy", rangeMm: 2_500, damage: 10, hitChancePermille: 1_000, interrupts: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile" };
  const actors: readonly TurnKernelActorV1[] = [
    { actorId: "player", team: "players", initiative: 2, positionMm: { x: 0, y: 0, z: 0 }, yawTenThousandthRadians: 0, health: 100, maxHealth: 100, stamina: 100, maxStamina: 100, focus: 10, maxFocus: 10, plan: [attack, hold("player")[1]!], reaction: null },
    { actorId: "enemy", team: "enemies", initiative: 1, positionMm: { x: 2_000, y: 0, z: 0 }, yawTenThousandthRadians: 0, health: 50, maxHealth: 50, stamina: 100, maxStamina: 100, focus: 1, maxFocus: 1, plan: hold("enemy"), reaction: null },
  ];
  const offline = resolveOfflineCanvasTurn({ protocolVersion: 2, encounterId: "offline.proof", leaseGeneration: 1, round: 1, serverSeed: "offline.seed", actors, authority: { canTraverse: () => true, hasLineOfSight: () => true, resolveEffect: () => ({ resolved: false, reason: "unsupported", operations: [] }) } });
  assertOfflineCanvasCannotSettleSharedRewards(offline);
  assert.equal(offline.result.actors.find(({ actorId }) => actorId === "enemy")!.health, 40);
  assert.equal(offline.sharedRewardsEnabled, false);
  assert.equal(offline.durableSettlementEnabled, false);
});

test("world projection exposes planned path, intent area and latest authoritative event", () => {
  const event: CombatEventV1 = { version: 1, sequence: 1, encounterId: "encounter.test", round: 1, beat: 0, band: "standard", type: "damage_applied", actorId: "character.player", targetActorId: "enemy.ash", rootActionId: "root.1", data: { amount: 9 } };
  const draft: TurnPlanDraft = { beats: [{ choiceId: "move", destinationMm: { x: 4_000, y: 0, z: 0 }, destinationYawTenThousandthRadians: 0 }, null], reaction: "none" };
  assert.deepEqual(buildTurnProjectionPrimitives(projection(clientState(), [event]), draft).map(({ kind }) => kind), ["path", "area", "event"]);
});

test("production shell imports four token sheets and exposes accessible vanilla-DOM states", () => {
  const root = findWorkspaceRoot(fileURLToPath(import.meta.url));
  const css = readFileSync(path.join(root, "styles.css"), "utf8");
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  for (const token of ["colors", "typography", "spacing", "effects"]) assert.match(css, new RegExp(`@import \\\"\\./design-system/tokens/${token}\\.css\\\"`));
  for (const duplicate of ["--ink:", "--display:", "--space-1:", "@keyframes grain", "@media (prefers-reduced-motion: reduce)"]) assert.equal(css.includes(duplicate), false, `production CSS should not redeclare ${duplicate}`);
  for (const required of ["id=\"turn-encounter\"", "role=\"region\"", "aria-labelledby=\"turn-encounter-title\"", "role=\"toolbar\"", "aria-live=\"polite\"", "id=\"turn-resolution-log\"", "id=\"turn-join\"", "tabindex=\"0\""]) assert.ok(html.includes(required), `missing ${required}`);
  const productionSources = collectFiles(path.join(root, "apps", "client", "src"), ".ts").map((file) => readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(productionSources, /from\s+["']react["']|ReactDOM|design-system\/ui_kits|_ds_fallback/);
  const networkSource = readFileSync(path.join(root, "apps", "client", "src", "network", "SharedWorldClient.ts"), "utf8");
  for (const command of ["turn_encounter_start", "turn_encounter_join", "turn_plan", "turn_withdraw"]) assert.ok(networkSource.includes(`send(\"${command}\"`), `network client must send ${command}`);
  assert.ok(networkSource.includes('onMessage("authenticated_character"'), "network client must receive the authenticated character projection before encounter initiation");
  assert.ok(networkSource.includes("turn_encounter_state arrived before authenticated_character"), "private identity must gate every authenticated encounter projection");
  assert.equal(networkSource.includes("this.authenticatedCharacterId = options.characterId"), false, "a requested character ID is not an authoritative authenticated identity");
  for (const state of ["planning", "ready", "resolving", "victory", "defeat", "reconnecting", "spectator"]) assert.ok(readFileSync(path.join(root, "apps", "client", "src", "turn", "TurnCombatUI.ts"), "utf8").includes(state));
});

function collectFiles(root: string, extension: string): string[] {
  return readdirSync(root).flatMap((name) => { const file = path.join(root, name); return statSync(file).isDirectory() ? collectFiles(file, extension) : file.endsWith(extension) ? [file] : []; });
}

function findWorkspaceRoot(startFile: string): string {
  let candidate = path.dirname(startFile);
  for (;;) {
    if (existsSync(path.join(candidate, "styles.css")) && existsSync(path.join(candidate, "apps", "client", "src"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) throw new Error(`Could not locate workspace root from ${startFile}`);
    candidate = parent;
  }
}
