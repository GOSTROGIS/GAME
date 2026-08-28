import {
  canonicalizeTurnPlanRequest,
  type CanonicalReactionReservation,
  type CanonicalTurnAction,
  type EnemyIntentV1,
  type TurnEffectQueryV1,
  type TurnEffectResolutionV1,
  type TurnActionSelectionV1,
  type TurnPlanCanonicalizerV1,
  type TurnPlanRequest,
  type TurnReactionSelectionV1,
} from "@hollow-march/shared";
import {
  ACTIVE_TECHNIQUE_BY_ID,
  COMBAT_SKILL_EFFECT_BY_ID,
  COMBAT_SKILL_EFFECT_HANDLER_REGISTRY,
  CONTENT_TURN_EFFECT_RESOLVER_BY_ID,
  CREATURE_MECHANIC_V4_BY_CREATURE_ID,
  CREATURE_TURN_EFFECT_HANDLER_BY_ID,
  canonicalizeActiveTechnique,
  resolveCanonicalContentTurnEffect,
  type CreatureMechanicV4Record,
} from "@hearthmere/content/turn-combat";

type ActionFactory = (selection: TurnActionSelectionV1) => CanonicalTurnAction | null;
type ReactionFactory = (selection: TurnReactionSelectionV1) => CanonicalReactionReservation | null;

export interface AuthoritativeTurnLoadout {
  readonly activeTechniqueId: string | null;
  readonly quickItemId: string | null;
  readonly itemCharges: Readonly<Record<string, number>>;
}

export const DEFAULT_ACTIVE_TECHNIQUE_ID = "technique.swordsmanship.severing_riposte";
const QUICK_ITEM_HANDLER_ID = "turn.item.mending_draught";
const QUICK_ITEM_HEALING = 42;

const noTargetOrDestination = (selection: TurnActionSelectionV1): boolean => (
  selection.targetActorId === undefined && selection.destinationMm === undefined && selection.destinationYawTenThousandthRadians === undefined
);

export const TURN_SKILL_REGISTRY: ReadonlyMap<string, ActionFactory> = new Map<string, ActionFactory>([
  ["action.move", (selection) => selection.destinationMm && selection.destinationYawTenThousandthRadians !== undefined && selection.targetActorId === undefined ? {
    actionId: selection.selectionId,
    definitionId: selection.actionDefinitionId,
    kind: "move",
    beat: selection.beat,
    band: "movement",
    apCost: 1,
    staminaCost: 8,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "none",
    targetRelation: "self",
    destinationMm: { ...selection.destinationMm },
    destinationYawTenThousandthRadians: selection.destinationYawTenThousandthRadians,
  } : null],
  ["action.light_attack", (selection) => selection.targetActorId && selection.destinationMm === undefined && selection.destinationYawTenThousandthRadians === undefined ? {
    actionId: selection.selectionId,
    definitionId: selection.actionDefinitionId,
    kind: "light_attack",
    beat: selection.beat,
    band: "standard",
    apCost: 1,
    staminaCost: 14,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "hostile_targeted",
    targetRelation: "hostile",
    targetActorId: selection.targetActorId,
    rangeMm: 2_500,
    damage: 9,
    hitChancePermille: 1_000,
    interrupts: false,
  } : null],
  ["action.heavy_attack", (selection) => selection.beat === 0 && selection.targetActorId && selection.destinationMm === undefined && selection.destinationYawTenThousandthRadians === undefined ? {
    actionId: selection.selectionId,
    definitionId: selection.actionDefinitionId,
    kind: "heavy_attack",
    beat: 0,
    band: "heavy",
    apCost: 2,
    staminaCost: 28,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "hostile_targeted",
    targetRelation: "hostile",
    targetActorId: selection.targetActorId,
    rangeMm: 2_700,
    damage: 18,
    hitChancePermille: 900,
    interrupts: true,
    occupiesBothBeats: true,
  } : null],
  ["action.recover", (selection) => noTargetOrDestination(selection) ? {
    actionId: selection.selectionId,
    definitionId: selection.actionDefinitionId,
    kind: "recover",
    beat: selection.beat,
    band: "aftermath",
    apCost: 1,
    staminaCost: 0,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "none",
    targetRelation: "self",
  } : null],
  ["action.hold", (selection) => noTargetOrDestination(selection) ? {
    actionId: selection.selectionId,
    definitionId: selection.actionDefinitionId,
    kind: "hold",
    beat: selection.beat,
    band: "aftermath",
    apCost: 0,
    staminaCost: 0,
    focusCost: 0,
    posthumous: false,
    reactionTrigger: "none",
    targetRelation: "self",
  } : null],
]);

export const TURN_REACTION_REGISTRY: ReadonlyMap<string, ReactionFactory> = new Map<string, ReactionFactory>([
  ["reaction.dodge", (selection) => selection.destinationMm && selection.destinationYawTenThousandthRadians !== undefined ? {
    reactionId: selection.selectionId,
    definitionId: selection.reactionDefinitionId,
    kind: "dodge",
    staminaReserved: 24,
    destinationMm: { ...selection.destinationMm },
    destinationYawTenThousandthRadians: selection.destinationYawTenThousandthRadians,
  } : null],
  ["reaction.guard", (selection) => selection.destinationMm === undefined && selection.destinationYawTenThousandthRadians === undefined ? {
    reactionId: selection.selectionId,
    definitionId: selection.reactionDefinitionId,
    kind: "guard",
    staminaReserved: 8,
    mitigationPermille: 500,
  } : null],
]);

export const SERVER_TURN_CANONICALIZER: TurnPlanCanonicalizerV1 = Object.freeze({
  resolveAction(selection: TurnActionSelectionV1) { return TURN_SKILL_REGISTRY.get(selection.actionDefinitionId)?.(selection) ?? null; },
  resolveReaction(selection: TurnReactionSelectionV1) { return TURN_REACTION_REGISTRY.get(selection.reactionDefinitionId)?.(selection) ?? null; },
});

export function createParticipantTurnCanonicalizer(loadout: AuthoritativeTurnLoadout): TurnPlanCanonicalizerV1 {
  return Object.freeze({
    resolveAction(selection: TurnActionSelectionV1): CanonicalTurnAction | null {
      if (selection.actionDefinitionId === "technique.equipped.primary") {
        const activeTechniqueId = loadout.activeTechniqueId;
        if (!activeTechniqueId || !ACTIVE_TECHNIQUE_BY_ID.has(activeTechniqueId)) return null;
        const canonical = canonicalizeActiveTechnique({ ...selection, actionDefinitionId: activeTechniqueId });
        return canonical ? { ...canonical, definitionId: selection.actionDefinitionId } : null;
      }
      if (ACTIVE_TECHNIQUE_BY_ID.has(selection.actionDefinitionId)) {
        if (selection.actionDefinitionId !== loadout.activeTechniqueId) return null;
        return canonicalizeActiveTechnique(selection);
      }
      if (selection.actionDefinitionId === "item.equipped.quick") {
        const itemId = loadout.quickItemId;
        if (itemId !== "mending_draught" || (loadout.itemCharges[itemId] ?? 0) < 1 || !noTargetOrDestination(selection)) return null;
        return {
          actionId: selection.selectionId,
          definitionId: selection.actionDefinitionId,
          kind: "item",
          beat: selection.beat,
          band: "aftermath",
          apCost: 1,
          staminaCost: 0,
          focusCost: 0,
          posthumous: false,
          reactionTrigger: "none",
          targetRelation: "self",
          effectHandlerId: QUICK_ITEM_HANDLER_ID,
          itemId,
          healing: QUICK_ITEM_HEALING,
          hitChancePermille: 1_000,
          interrupts: false,
        };
      }
      return TURN_SKILL_REGISTRY.get(selection.actionDefinitionId)?.(selection) ?? null;
    },
    resolveReaction(selection: TurnReactionSelectionV1): CanonicalReactionReservation | null {
      return TURN_REACTION_REGISTRY.get(selection.reactionDefinitionId)?.(selection) ?? null;
    },
  });
}

export function canonicalizeServerTurnPlan(request: TurnPlanRequest, loadout?: AuthoritativeTurnLoadout) {
  return canonicalizeTurnPlanRequest(request, loadout ? createParticipantTurnCanonicalizer(loadout) : SERVER_TURN_CANONICALIZER);
}

/** Content owns all 178 authored V4 records; the server only owns execution. */
export const TURN_CREATURE_REGISTRY: ReadonlyMap<string, CreatureMechanicV4Record> = CREATURE_MECHANIC_V4_BY_CREATURE_ID;
export const TURN_COMBAT_SKILL_EFFECT_REGISTRY = COMBAT_SKILL_EFFECT_BY_ID;

export interface EnemyPlanningActor {
  readonly actorId: string;
  readonly team: "players" | "enemies";
  readonly positionMm: { readonly x: number; readonly y: number; readonly z: number };
  readonly health: number;
  readonly maxHealth: number;
}

export interface EnemyPlanningAuthority {
  readonly canTraverse?: (query: { actorId: string; fromMm: EnemyPlanningActor["positionMm"]; toMm: EnemyPlanningActor["positionMm"] }) => boolean;
}

const distanceSquared = (left: EnemyPlanningActor["positionMm"], right: EnemyPlanningActor["positionMm"]): number => (
  (left.x - right.x) ** 2 + (left.y - right.y) ** 2 + (left.z - right.z) ** 2
);

const compareVitality = (left: EnemyPlanningActor, right: EnemyPlanningActor): number => (
  left.health * right.maxHealth - right.health * left.maxHealth || codePointCompare(left.actorId, right.actorId)
);

const codePointCompare = (left: string, right: string): number => left === right ? 0 : left < right ? -1 : 1;

function selectEnemyActionTarget(source: EnemyPlanningActor, actors: readonly EnemyPlanningActor[], relation: CreatureMechanicV4Record["contract"]["turn"]["targetRelation"]): EnemyPlanningActor {
  const living = actors.filter(({ health }) => health > 0);
  if (relation === "self") return source;
  if (relation === "ally") {
    // A true ally excludes the source under the kernel relation contract. A
    // singleton uses a self-buff fallback instead of authoring an invalid plan.
    return living.filter(({ team, actorId }) => team === source.team && actorId !== source.actorId).sort(compareVitality)[0] ?? source;
  }
  const hostiles = living.filter(({ team }) => team !== source.team)
    .sort((left, right) => distanceSquared(source.positionMm, left.positionMm) - distanceSquared(source.positionMm, right.positionMm) || codePointCompare(left.actorId, right.actorId));
  if (hostiles[0]) return hostiles[0];
  if (relation === "any") return source;
  throw new Error(`${source.actorId} has no living hostile target`);
}

function authoredMovementDestination(
  source: EnemyPlanningActor,
  target: EnemyPlanningActor,
  maximumDistanceMm: number,
  authority: EnemyPlanningAuthority,
): { destinationMm: { x: number; y: number; z: number }; yaw: number } {
  const deltaX = target.positionMm.x - source.positionMm.x;
  const deltaZ = target.positionMm.z - source.positionMm.z;
  const distance = Math.hypot(deltaX, deltaZ);
  const fullTravel = Math.min(maximumDistanceMm, Math.max(0, Math.round(distance - 1_000)));
  const yaw = Math.max(-31_416, Math.min(31_416, Math.round(Math.atan2(deltaX, deltaZ) * 10_000)));
  for (const fraction of [1, 0.5, 0.25, 0] as const) {
    const travel = Math.round(fullTravel * fraction);
    const destinationMm = distance > 0 ? {
      x: source.positionMm.x + Math.round(deltaX / distance * travel),
      y: source.positionMm.y,
      z: source.positionMm.z + Math.round(deltaZ / distance * travel),
    } : { ...source.positionMm };
    if (!authority.canTraverse || authority.canTraverse({ actorId: source.actorId, fromMm: source.positionMm, toMm: destinationMm })) return { destinationMm, yaw };
  }
  return { destinationMm: { ...source.positionMm }, yaw };
}

export function createEnemyAction(
  definitionId: string,
  enemyActorId: string,
  actors: readonly EnemyPlanningActor[],
  round: number,
  authority: EnemyPlanningAuthority = {},
): { action: CanonicalTurnAction; intent: EnemyIntentV1 } {
  const registered = TURN_CREATURE_REGISTRY.get(definitionId);
  if (!registered) throw new Error(`unregistered creature turn contract ${definitionId}`);
  const { contract } = registered;
  const enemy = actors.find(({ actorId }) => actorId === enemyActorId);
  if (!enemy || enemy.team !== "enemies" || enemy.health <= 0) throw new Error(`enemy actor ${enemyActorId} is unavailable`);
  const target = selectEnemyActionTarget(enemy, actors, contract.turn.targetRelation);
  const actionTargetRelation = contract.turn.targetRelation === "ally" && target.actorId === enemy.actorId ? "self" : contract.turn.targetRelation;
  const actionId = `server.enemy.${enemyActorId}.round.${round}`;
  if (contract.turn.apCost !== 1 && contract.turn.apCost !== 2) throw new Error(`creature ${definitionId} has no executable AP action`);
  const effectHandler = CREATURE_TURN_EFFECT_HANDLER_BY_ID.get(contract.turn.effectHandlerId);
  if (!effectHandler) throw new Error(`creature ${definitionId} effect handler is not registered`);
  const exactDamage = Math.floor((contract.turn.damageBand[0] + contract.turn.damageBand[1]) / 2);
  const isHealing = effectHandler.effectTags.some((tag) => tag === "heal" || tag === "healing");
  const actorTarget = contract.turn.targetRelation === "self" ? undefined : target.actorId;
  const movement = contract.turn.band === "movement" ? authoredMovementDestination(enemy, target, contract.turn.rangeMm, authority) : null;
  const action: CanonicalTurnAction = {
    actionId,
    definitionId: contract.moveId,
    kind: "technique",
    beat: 0,
    band: contract.turn.band,
    apCost: contract.turn.apCost,
    staminaCost: contract.turn.staminaCost,
    focusCost: contract.turn.focusCost,
    posthumous: contract.turn.posthumous,
    reactionTrigger: contract.turn.reactionTrigger,
    targetRelation: actionTargetRelation,
    effectHandlerId: contract.turn.effectHandlerId,
    ...(actorTarget ? { targetActorId: actorTarget, rangeMm: contract.turn.rangeMm } : {}),
    ...(movement ? { destinationMm: movement.destinationMm, destinationYawTenThousandthRadians: movement.yaw } : {}),
    ...(actionTargetRelation === "hostile" && exactDamage > 0 ? { damage: exactDamage } : {}),
    ...(actionTargetRelation !== "hostile" && isHealing && exactDamage > 0 ? { healing: exactDamage } : {}),
    hitChancePermille: contract.turn.hitChancePermille,
    interrupts: contract.turn.actionInterrupts,
    ...(contract.turn.apCost === 2 ? { occupiesBothBeats: true as const } : {}),
  };
  const intent: EnemyIntentV1 = {
    version: 1,
    actorId: enemyActorId,
    actionId,
    // The prototype resolver is single-target. Area-authored future tactics
    // remain canon metadata but cannot advertise unimplemented AoE at runtime.
    target: { kind: "actor", actorIds: [target.actorId] },
    band: contract.turn.band,
    damageBand: actionTargetRelation === "hostile" ? contract.turn.damageBand : [0, 0],
    statusIcons: contract.turn.statusIcons.slice(0, 1),
    sensoryCue: contract.turn.sensoryCue,
    interruptRule: contract.turn.interruptRule,
    exactDamageKnown: false,
  };
  return { action, intent };
}

/** Resolve only handler IDs declared by canonical content registries. */
export function resolveRegisteredTurnEffect(query: TurnEffectQueryV1): TurnEffectResolutionV1 {
  if (query.action.effectHandlerId === QUICK_ITEM_HANDLER_ID) {
    if (query.action.kind !== "item" || query.action.itemId !== "mending_draught") return { resolved: false, reason: "quick_item_mismatch", operations: [] };
    if (query.actor.health >= query.actor.maxHealth) return { resolved: false, reason: "health_full", operations: [] };
    return { resolved: true, operations: [{ kind: "heal", targetActorId: query.actor.actorId, amount: Math.min(QUICK_ITEM_HEALING, query.actor.maxHealth - query.actor.health) }] };
  }
  if (CONTENT_TURN_EFFECT_RESOLVER_BY_ID.has(query.action.effectHandlerId)) {
    return resolveCanonicalContentTurnEffect(query);
  }
  return { resolved: false, reason: "unregistered_effect_handler", operations: [] };
}
