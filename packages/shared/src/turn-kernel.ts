import {
  NETWORK_PROTOCOL_VERSION, TURN_RESOLUTION_BANDS, TURN_MAX_ACTORS, TURN_MAX_DAMAGE,
  TURN_MAX_EFFECT_OPERATIONS, TURN_MAX_EVENT_SEQUENCE, TURN_MAX_REACTIVE_RULES, TURN_MAX_RESOURCE,
  TURN_MAX_ROUND, assertDenseTurnArray, assertTurnId, assertTurnInteger, codeUnitCompare,
  validateCanonicalReactionReservation, validateCanonicalTurnAction, validateCanonicalTurnPlan,
  validateIntegerPositionMm, type CanonicalReactionReservation, type CanonicalTurnAction,
  type CanonicalTurnItemAction, type CanonicalTurnTechniqueAction, type CombatEventV1,
  type IntegerPositionMm, type TurnBeat, type TurnResolutionBand, type TurnTargetRelation, type TurnTeam,
} from "./turn-combat.js";

export const MAX_REACTIVE_INSERTIONS_PER_ROOT = 8;
export const MAX_REACTIVE_INSERTIONS_PER_BAND = 64;
export const TURN_ACTION_POINTS = 2;

export interface TurnReactiveRuleV1 {
  readonly ruleId: string;
  readonly trigger: "damaged";
  readonly damage: number;
  readonly maxUsesPerRound: number;
  readonly interrupts?: boolean;
  readonly posthumous?: boolean;
}

export interface TurnStatusStateV1 { readonly stacks: number; readonly remainingRounds: number }
export interface TurnBuffStateV1 { readonly magnitude: number; readonly remainingRounds: number }

export interface TurnKernelActorV1 {
  readonly actorId: string;
  readonly team: TurnTeam;
  readonly initiative: number;
  readonly positionMm: IntegerPositionMm;
  readonly yawTenThousandthRadians: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly focus: number;
  readonly maxFocus: number;
  readonly plan: readonly CanonicalTurnAction[];
  readonly reaction: CanonicalReactionReservation | null;
  readonly itemCharges?: Readonly<Record<string, number>>;
  readonly reactiveRules?: readonly TurnReactiveRuleV1[];
  readonly statuses?: Readonly<Record<string, TurnStatusStateV1>>;
  readonly buffs?: Readonly<Record<string, TurnBuffStateV1>>;
}

export interface TurnTraversalQueryV1 {
  readonly encounterId: string;
  readonly round: number;
  readonly actorId: string;
  readonly kind: "move" | "dodge";
  readonly beat: TurnBeat;
  readonly band: TurnResolutionBand;
  readonly fromMm: IntegerPositionMm;
  readonly toMm: IntegerPositionMm;
  readonly fromYawTenThousandthRadians: number;
  readonly toYawTenThousandthRadians: number;
}

export interface TurnLineOfSightQueryV1 {
  readonly encounterId: string;
  readonly round: number;
  readonly sourceActorId: string;
  readonly targetActorId: string;
  readonly beat: TurnBeat;
  readonly band: TurnResolutionBand;
  readonly sourceMm: IntegerPositionMm;
  readonly targetMm: IntegerPositionMm;
}

export interface TurnEffectActorSnapshotV1 {
  readonly actorId: string;
  readonly team: TurnTeam;
  readonly positionMm: IntegerPositionMm;
  readonly health: number;
  readonly maxHealth: number;
  readonly stamina: number;
  readonly focus: number;
  readonly statuses: Readonly<Record<string, TurnStatusStateV1>>;
  readonly buffs: Readonly<Record<string, TurnBuffStateV1>>;
}

export type TurnEffectOperationV1 =
  | { readonly kind: "damage"; readonly targetActorId: string; readonly amount: number }
  | { readonly kind: "heal"; readonly targetActorId: string; readonly amount: number }
  | { readonly kind: "status"; readonly targetActorId: string; readonly statusId: string; readonly stacks: number; readonly durationRounds: number }
  | { readonly kind: "buff"; readonly targetActorId: string; readonly buffId: string; readonly magnitude: number; readonly durationRounds: number }
  | { readonly kind: "destination"; readonly actorId: string; readonly destinationMm: IntegerPositionMm; readonly destinationYawTenThousandthRadians: number };

export interface TurnEffectResolutionV1 {
  readonly resolved: boolean;
  readonly reason?: string;
  readonly operations: readonly TurnEffectOperationV1[];
}

export interface TurnEffectQueryV1 {
  readonly encounterId: string;
  readonly leaseGeneration: number;
  readonly round: number;
  readonly beat: TurnBeat;
  readonly band: TurnResolutionBand;
  readonly rootActionId: string;
  readonly actor: TurnEffectActorSnapshotV1;
  readonly action: CanonicalTurnTechniqueAction | CanonicalTurnItemAction;
  readonly actors: readonly TurnEffectActorSnapshotV1[];
}

export interface TurnKernelAuthorityV1 {
  readonly canTraverse: (query: TurnTraversalQueryV1) => boolean;
  readonly hasLineOfSight: (query: TurnLineOfSightQueryV1) => boolean;
  /** Deterministic, registry-owned handler. Client selections never provide effects. */
  readonly resolveEffect: (query: TurnEffectQueryV1) => TurnEffectResolutionV1;
}

export interface TurnKernelInputV1 {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly leaseGeneration: number;
  readonly round: number;
  readonly serverSeed: string;
  readonly eventSequenceStart?: number;
  readonly actors: readonly TurnKernelActorV1[];
  readonly authority: TurnKernelAuthorityV1;
}

export interface TurnKernelActorResultV1 {
  readonly actorId: string;
  readonly team: TurnTeam;
  readonly positionMm: IntegerPositionMm;
  readonly yawTenThousandthRadians: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly focus: number;
  readonly maxFocus: number;
  readonly interrupted: boolean;
  readonly defeated: boolean;
  readonly itemCharges: Readonly<Record<string, number>>;
  readonly statuses: Readonly<Record<string, TurnStatusStateV1>>;
  readonly buffs: Readonly<Record<string, TurnBuffStateV1>>;
}

export type TurnRoundOutcome = "ongoing" | "victory" | "defeat" | "mutual_defeat";

export interface TurnKernelResultV1 {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly round: number;
  readonly outcome: TurnRoundOutcome;
  readonly actors: readonly TurnKernelActorResultV1[];
  readonly events: readonly CombatEventV1[];
  readonly latestEventSequence: number;
}

interface MutableActor {
  actorId: string;
  team: TurnTeam;
  initiative: number;
  positionMm: IntegerPositionMm;
  yawTenThousandthRadians: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  focus: number;
  maxFocus: number;
  plan: readonly CanonicalTurnAction[];
  reaction: CanonicalReactionReservation | null;
  reactionTriggered: boolean;
  heldReactionStamina: number;
  interrupted: boolean;
  itemCharges: Record<string, number>;
  reactiveRules: readonly TurnReactiveRuleV1[];
  statuses: Record<string, TurnStatusStateV1>;
  buffs: Record<string, TurnBuffStateV1>;
}

interface BegunAction {
  actor: MutableActor;
  action: CanonicalTurnAction;
  slot: number;
  rootActionId: string;
}

interface DamageApplication {
  sourceActorId: string;
  targetActorId: string;
  amount: number;
  rootActionId: string;
  actionId: string;
  interrupts: boolean;
  triggersGuard: boolean;
}

interface HealingApplication { sourceActorId: string; targetActorId: string; amount: number; rootActionId: string; actionId: string }
interface StatusApplication { sourceActorId: string; targetActorId: string; statusId: string; stacks: number; durationRounds: number; rootActionId: string }
interface BuffApplication { sourceActorId: string; targetActorId: string; buffId: string; magnitude: number; durationRounds: number; rootActionId: string }

interface EventWriter {
  emit(
    type: CombatEventV1["type"], beat: TurnBeat | null, band: TurnResolutionBand | null,
    actorId: string | null, targetActorId: string | null, rootActionId: string | null,
    data?: Readonly<Record<string, string | number | boolean | null>>,
  ): void;
  readonly events: readonly CombatEventV1[];
  readonly latest: number;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

const assertAllowedFields = (record: Record<string, unknown>, allowed: readonly string[], label: string): void => {
  const allowedSet = new Set(allowed);
  for (const field of Object.keys(record)) {
    if (!allowedSet.has(field)) throw new Error(`${label} forbids field ${field}`);
  }
};

const clonePosition = (position: IntegerPositionMm): IntegerPositionMm => ({ x: position.x, y: position.y, z: position.z });
const positionKey = (position: IntegerPositionMm): string => `${position.x}:${position.y}:${position.z}`;
const withinDistanceMm = (a: IntegerPositionMm, b: IntegerPositionMm, maximumMm: number): boolean => {
  const x = BigInt(a.x) - BigInt(b.x); const y = BigInt(a.y) - BigInt(b.y); const z = BigInt(a.z) - BigInt(b.z); const maximum = BigInt(maximumMm);
  return x * x + y * y + z * z <= maximum * maximum;
};
const actorOrder = (a: MutableActor, b: MutableActor): number => b.initiative - a.initiative || codeUnitCompare(a.actorId, b.actorId);
const actionOrder = (a: BegunAction, b: BegunAction): number => actorOrder(a.actor, b.actor) || a.slot - b.slot;

const encodeCompositePart = (value: string | number): string => {
  const encoded = String(value);
  return `${encoded.length}:${encoded}`;
};

export function canonicalTurnRootActionId(
  encounterId: string, round: number, actorId: string, beat: TurnBeat, band: TurnResolutionBand, slot: number,
): string {
  return [encounterId, round, actorId, beat, band, slot].map(encodeCompositePart).join("|");
}

const actionTargetActorId = (action: CanonicalTurnAction): string | undefined => (
  "targetActorId" in action ? action.targetActorId : undefined
);
const actionItemId = (action: CanonicalTurnAction): string | undefined => (
  action.kind === "item" ? action.itemId : undefined
);
const actionDamage = (action: CanonicalTurnAction): number | undefined => (
  "damage" in action ? action.damage : undefined
);
const actionRangeMm = (action: CanonicalTurnAction): number => (
  "rangeMm" in action ? (action.rangeMm ?? 0) : 0
);

export function seededTurnRollPermille(...seedParts: readonly (string | number)[]): number {
  let hash = 0x811c9dc5;
  const source = seedParts.map(encodeCompositePart).join("|");
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x7feb352d) >>> 0;
  hash ^= hash >>> 15; hash = Math.imul(hash, 0x846ca68b) >>> 0;
  hash ^= hash >>> 16;
  return hash % 1_000;
}

function validateStateRecord(value: unknown, label: string, kind: "status" | "buff"): void {
  if (value === undefined) return;
  if (!isPlainRecord(value)) throw new Error(`${label} must be a plain object`);
  if (Object.keys(value).length > 128) throw new Error(`${label} has too many entries`);
  for (const [id, state] of Object.entries(value)) {
    assertTurnId(id, `${label} key`); if (!isPlainRecord(state)) throw new Error(`${label}.${id} must be a plain object`);
    assertAllowedFields(state, kind === "status" ? ["stacks", "remainingRounds"] : ["magnitude", "remainingRounds"], `${label}.${id}`);
    if (kind === "status") assertTurnInteger(state.stacks, `${label}.${id}.stacks`, 1, TURN_MAX_RESOURCE);
    else assertTurnInteger(state.magnitude, `${label}.${id}.magnitude`, -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE);
    assertTurnInteger(state.remainingRounds, `${label}.${id}.remainingRounds`, 1, TURN_MAX_ROUND);
  }
}

function relationMatches(source: TurnKernelActorV1 | MutableActor, target: TurnKernelActorV1 | MutableActor, relation: TurnTargetRelation): boolean {
  if (relation === "self") return source.actorId === target.actorId;
  if (relation === "hostile") return source.team !== target.team;
  if (relation === "ally") return source.team === target.team && source.actorId !== target.actorId;
  return true;
}

export function validateTurnKernelInput(input: unknown): asserts input is TurnKernelInputV1 {
  if (!isPlainRecord(input)) throw new Error("turn kernel input must be a plain object");
  assertAllowedFields(input, ["protocolVersion", "encounterId", "leaseGeneration", "round", "serverSeed", "eventSequenceStart", "actors", "authority"], "turn kernel input");
  if (input.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`turn kernel requires protocol ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(input.encounterId, "encounterId"); assertTurnInteger(input.leaseGeneration, "leaseGeneration", 1, TURN_MAX_ROUND); assertTurnInteger(input.round, "round", 0, TURN_MAX_ROUND); assertTurnId(input.serverSeed, "serverSeed");
  if (input.eventSequenceStart !== undefined) assertTurnInteger(input.eventSequenceStart, "eventSequenceStart", 0, TURN_MAX_EVENT_SEQUENCE);
  assertDenseTurnArray(input.actors, "actors", TURN_MAX_ACTORS);
  if (input.actors.length < 2) throw new Error("turn kernel requires both teams");
  if (!isPlainRecord(input.authority)) throw new Error("turn authority must be a plain object");
  assertAllowedFields(input.authority, ["canTraverse", "hasLineOfSight", "resolveEffect"], "turn authority");
  if (typeof input.authority.canTraverse !== "function" || typeof input.authority.hasLineOfSight !== "function" || typeof input.authority.resolveEffect !== "function") throw new Error("authoritative traversal, line-of-sight, and effect callbacks are required");
  const actorIds = new Set<string>();
  const positions = new Set<string>(); let players = 0; let enemies = 0;
  for (const unknownActor of input.actors) {
    if (!isPlainRecord(unknownActor)) throw new Error("kernel actor must be a plain object");
    assertAllowedFields(unknownActor, ["actorId", "team", "initiative", "positionMm", "yawTenThousandthRadians", "health", "maxHealth", "stamina", "maxStamina", "focus", "maxFocus", "plan", "reaction", "itemCharges", "reactiveRules", "statuses", "buffs"], "kernel actor");
    const actor = unknownActor as unknown as TurnKernelActorV1;
    assertTurnId(actor.actorId, "actorId"); if (actorIds.has(actor.actorId)) throw new Error(`actorId must be unique: ${actor.actorId}`);
    actorIds.add(actor.actorId);
    if (actor.team !== "players" && actor.team !== "enemies") throw new Error(`${actor.actorId}.team must be players or enemies`);
    if (actor.team === "players") players += 1; else enemies += 1;
    assertTurnInteger(actor.initiative, `${actor.actorId}.initiative`, -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE); validateIntegerPositionMm(actor.positionMm, `${actor.actorId}.positionMm`);
    const position = positionKey(actor.positionMm); if (positions.has(position)) throw new Error("actor starting positions must be unique"); positions.add(position);
    assertTurnInteger(actor.yawTenThousandthRadians, `${actor.actorId}.yawTenThousandthRadians`, -31_416, 31_416);
    assertTurnInteger(actor.maxHealth, `${actor.actorId}.maxHealth`, 1, TURN_MAX_RESOURCE); assertTurnInteger(actor.health, `${actor.actorId}.health`, 0, actor.maxHealth);
    assertTurnInteger(actor.maxStamina, `${actor.actorId}.maxStamina`, 1, TURN_MAX_RESOURCE); assertTurnInteger(actor.stamina, `${actor.actorId}.stamina`, 0, actor.maxStamina);
    assertTurnInteger(actor.maxFocus, `${actor.actorId}.maxFocus`, 1, TURN_MAX_RESOURCE); assertTurnInteger(actor.focus, `${actor.actorId}.focus`, 0, actor.maxFocus);
    if (actor.health > actor.maxHealth || actor.stamina > actor.maxStamina || actor.focus > actor.maxFocus) throw new Error(`${actor.actorId} resources exceed maxima`);
    validateCanonicalTurnPlan(actor.plan, actor.reaction, `${actor.actorId}.plan`);
    if (actor.reaction) {
      validateCanonicalReactionReservation(actor.reaction, `${actor.actorId}.reaction`);
      const roundStamina = Math.min(actor.maxStamina, actor.stamina + Math.ceil(actor.maxStamina * 0.15));
      if (actor.reaction.staminaReserved > roundStamina) throw new Error(`${actor.actorId} cannot fund reaction reservation this round`);
    }
    if (actor.itemCharges !== undefined && !isPlainRecord(actor.itemCharges)) throw new Error(`${actor.actorId}.itemCharges must be a plain object`);
    if (Object.keys(actor.itemCharges ?? {}).length > 128) throw new Error(`${actor.actorId}.itemCharges has too many entries`);
    for (const [itemId, count] of Object.entries(actor.itemCharges ?? {})) { assertTurnId(itemId, `${actor.actorId}.itemCharges key`); assertTurnInteger(count, `${actor.actorId}.itemCharges.${itemId}`, 0, TURN_MAX_RESOURCE); }
    assertDenseTurnArray(actor.reactiveRules ?? [], `${actor.actorId}.reactiveRules`, TURN_MAX_REACTIVE_RULES); const ruleIds = new Set<string>();
    for (const unknownRule of actor.reactiveRules ?? []) {
      if (!isPlainRecord(unknownRule)) throw new Error(`${actor.actorId} reactive rule must be a plain object`);
      assertAllowedFields(unknownRule, ["ruleId", "trigger", "damage", "maxUsesPerRound", "interrupts", "posthumous"], `${actor.actorId}.reactiveRule`);
      const rule = unknownRule as unknown as TurnReactiveRuleV1; assertTurnId(rule.ruleId, `${actor.actorId}.reactiveRule.ruleId`); if (ruleIds.has(rule.ruleId)) throw new Error(`${actor.actorId} reactive rule IDs must be unique`); ruleIds.add(rule.ruleId);
      if (rule.trigger !== "damaged") throw new Error(`${actor.actorId}.${rule.ruleId}.trigger is invalid`);
      assertTurnInteger(rule.damage, `${actor.actorId}.${rule.ruleId}.damage`, 0, TURN_MAX_DAMAGE); assertTurnInteger(rule.maxUsesPerRound, `${actor.actorId}.${rule.ruleId}.maxUsesPerRound`, 0, 64);
      if (rule.interrupts !== undefined && typeof rule.interrupts !== "boolean") throw new Error(`${actor.actorId}.${rule.ruleId}.interrupts must be boolean`);
      if (rule.posthumous !== undefined && typeof rule.posthumous !== "boolean") throw new Error(`${actor.actorId}.${rule.ruleId}.posthumous must be boolean`);
    }
    validateStateRecord(actor.statuses, `${actor.actorId}.statuses`, "status"); validateStateRecord(actor.buffs, `${actor.actorId}.buffs`, "buff");
  }
  if (players < 1 || players > 4 || enemies < 1) throw new Error("turn kernel requires one to four players and at least one enemy");
  const byId = new Map((input.actors as readonly TurnKernelActorV1[]).map((actor) => [actor.actorId, actor]));
  for (const actor of byId.values()) for (const action of actor.plan) {
    const targetId = actionTargetActorId(action); if (!targetId) continue;
    const target = byId.get(targetId); if (!target) throw new Error(`${action.actionId} targets an actor outside the encounter`);
    if (!relationMatches(actor, target, action.targetRelation)) throw new Error(`${action.actionId} violates authored target relation ${action.targetRelation}`);
  }
}

function makeEventWriter(input: TurnKernelInputV1): EventWriter {
  let sequence = input.eventSequenceStart ?? 0;
  const events: CombatEventV1[] = [];
  return {
    emit(type, beat, band, actorId, targetActorId, rootActionId, data = {}) {
      if (sequence >= Number.MAX_SAFE_INTEGER) throw new Error("combat event sequence exhausted its safe-integer range");
      events.push({ version: 1, sequence: ++sequence, encounterId: input.encounterId, round: input.round, beat, band, type, actorId, targetActorId, rootActionId, data });
    },
    get events() { return events; },
    get latest() { return sequence; },
  };
}

export function resolveTurnRound(input: TurnKernelInputV1): TurnKernelResultV1 {
  validateTurnKernelInput(input);
  const writer = makeEventWriter(input);
  const states = new Map<string, MutableActor>();
  for (const source of [...input.actors].sort((a, b) => codeUnitCompare(a.actorId, b.actorId))) {
    const roundStamina = Math.min(source.maxStamina, source.stamina + Math.ceil(source.maxStamina * 0.15));
    const actor: MutableActor = {
      actorId: source.actorId, team: source.team, initiative: source.initiative,
      positionMm: clonePosition(source.positionMm), yawTenThousandthRadians: source.yawTenThousandthRadians,
      health: source.health, maxHealth: source.maxHealth,
      stamina: roundStamina, maxStamina: source.maxStamina, focus: source.focus, maxFocus: source.maxFocus,
      plan: [...source.plan], reaction: source.reaction ? { ...source.reaction } : null,
      reactionTriggered: false, heldReactionStamina: source.reaction?.staminaReserved ?? 0,
      interrupted: false, itemCharges: { ...source.itemCharges }, reactiveRules: [...(source.reactiveRules ?? [])],
      statuses: Object.fromEntries(Object.entries(source.statuses ?? {}).map(([id, state]) => [id, { ...state }])),
      buffs: Object.fromEntries(Object.entries(source.buffs ?? {}).map(([id, state]) => [id, { ...state }])),
    };
    states.set(actor.actorId, actor);
  }
  writer.emit("round_started", null, null, null, null, null, { actorCount: states.size });
  for (const actor of [...states.values()].sort((a, b) => codeUnitCompare(a.actorId, b.actorId))) {
    const previous = input.actors.find((candidate) => candidate.actorId === actor.actorId)!.stamina;
    applyOngoingStatusAndBuffEffects(actor, writer);
    if (actor.reaction && actor.heldReactionStamina > actor.stamina) {
      writer.emit("reaction_refunded", null, "aftermath", actor.actorId, null, null, {
        kind: actor.reaction.kind,
        stamina: actor.heldReactionStamina,
        reason: "insufficient_after_round_effects",
      });
      actor.reaction = null;
      actor.heldReactionStamina = 0;
    }
    if (actor.stamina !== previous) writer.emit("resource_changed", null, null, actor.actorId, null, null, { resource: "stamina", before: previous, after: actor.stamina, reason: "round_start" });
  }

  const reactiveUses = new Map<string, number>();
  for (const beat of [0, 1] as const) {
    for (const band of TURN_RESOLUTION_BANDS) resolveBand(input, states, writer, reactiveUses, beat, band);
  }

  for (const actor of [...states.values()].sort((a, b) => codeUnitCompare(a.actorId, b.actorId))) {
    if (actor.reaction && !actor.reactionTriggered) writer.emit("reaction_refunded", null, "aftermath", actor.actorId, null, null, { kind: actor.reaction.kind, stamina: actor.heldReactionStamina });
  }
  const outcome = determineOutcome(states);
  writer.emit("round_completed", null, "aftermath", null, null, null, { outcome });
  if (outcome !== "ongoing") writer.emit("encounter_outcome", null, "aftermath", null, null, null, { outcome, rewardsAllowed: outcome === "victory" });
  const actors: TurnKernelActorResultV1[] = [...states.values()].sort((a, b) => codeUnitCompare(a.actorId, b.actorId)).map((actor) => ({
    actorId: actor.actorId, team: actor.team, positionMm: clonePosition(actor.positionMm),
    yawTenThousandthRadians: actor.yawTenThousandthRadians,
    health: actor.health, maxHealth: actor.maxHealth, stamina: actor.stamina, maxStamina: actor.maxStamina,
    focus: actor.focus, maxFocus: actor.maxFocus, interrupted: actor.interrupted, defeated: actor.health <= 0,
    itemCharges: { ...actor.itemCharges }, statuses: Object.fromEntries(Object.entries(actor.statuses).map(([id, state]) => [id, { ...state }])),
    buffs: Object.fromEntries(Object.entries(actor.buffs).map(([id, state]) => [id, { ...state }])),
  }));
  return { protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: input.encounterId, round: input.round, outcome, actors, events: [...writer.events], latestEventSequence: writer.latest };
}

const DAMAGING_STATUS_IDS = new Set(["bleed", "bleeding", "burning", "poisoned", "wounded", "punctured"]);
export const TURN_SHELTERED_WARD_BUFF_ID = "sheltered";
export const TURN_SHELTERED_WARD_PER_MAGNITUDE_PERMILLE = 125;

function applyOngoingStatusAndBuffEffects(actor: MutableActor, writer: EventWriter): void {
  let staminaDelta = 0;
  let damage = 0;
  for (const [statusId, state] of Object.entries(actor.statuses).sort(([left], [right]) => codeUnitCompare(left, right))) {
    staminaDelta -= state.stacks;
    if (DAMAGING_STATUS_IDS.has(statusId)) damage += state.stacks;
    const remainingRounds = state.remainingRounds - 1;
    if (remainingRounds > 0) actor.statuses[statusId] = { ...state, remainingRounds };
    else delete actor.statuses[statusId];
  }
  for (const [buffId, state] of Object.entries(actor.buffs).sort(([left], [right]) => codeUnitCompare(left, right))) {
    if (buffId !== TURN_SHELTERED_WARD_BUFF_ID) staminaDelta += state.magnitude;
    const remainingRounds = state.remainingRounds - 1;
    if (remainingRounds > 0) actor.buffs[buffId] = { ...state, remainingRounds };
    else delete actor.buffs[buffId];
  }
  actor.stamina = Math.max(0, Math.min(actor.maxStamina, actor.stamina + staminaDelta));
  if (damage > 0 && actor.health > 0) {
    const applied = Math.min(actor.health, damage);
    actor.health -= applied;
    writer.emit("damage_applied", null, null, actor.actorId, actor.actorId, null, { amount: applied, reason: "ongoing_status" });
    if (actor.health <= 0) writer.emit("actor_defeated", null, null, actor.actorId, actor.actorId, null, { reason: "ongoing_status" });
  }
}

function resolveBand(
  input: TurnKernelInputV1, states: Map<string, MutableActor>, writer: EventWriter,
  reactiveUses: Map<string, number>, beat: TurnBeat, band: TurnResolutionBand,
): void {
  const scheduled: BegunAction[] = [...states.values()].flatMap((actor) => actor.plan
    .filter((action) => action.beat === beat && action.band === band)
    .map((action) => ({
      actor, action, slot: 0,
      rootActionId: canonicalTurnRootActionId(input.encounterId, input.round, actor.actorId, beat, band, 0),
    }))).sort(actionOrder);
  if (scheduled.length === 0) return;
  const begun: BegunAction[] = [];
  for (const entry of scheduled) {
    const { actor, action } = entry;
    const targetActorId = actionTargetActorId(action);
    if ((actor.health <= 0 || actor.interrupted) && !action.posthumous) {
      writer.emit("action_canceled", beat, band, actor.actorId, targetActorId ?? null, entry.rootActionId, {
        clientActionId: action.actionId, reason: actor.health <= 0 ? "defeated" : "interrupted", costsSpent: false,
      });
      continue;
    }
    const availableStamina = actor.stamina - (actor.reactionTriggered ? 0 : actor.heldReactionStamina);
    const itemId = actionItemId(action);
    const itemAvailable = !itemId || (actor.itemCharges[itemId] ?? 0) > 0;
    if (availableStamina < action.staminaCost || actor.focus < action.focusCost || !itemAvailable) {
      writer.emit("action_canceled", beat, band, actor.actorId, targetActorId ?? null, entry.rootActionId, {
        clientActionId: action.actionId, reason: !itemAvailable ? "item_unavailable" : "resource_unavailable", costsSpent: false,
      });
      continue;
    }
    const staminaBefore = actor.stamina; const focusBefore = actor.focus;
    actor.stamina -= action.staminaCost; actor.focus -= action.focusCost;
    writer.emit("action_started", beat, band, actor.actorId, targetActorId ?? null, entry.rootActionId, {
      clientActionId: action.actionId, kind: action.kind, staminaCost: action.staminaCost, focusCost: action.focusCost,
    });
    if (staminaBefore !== actor.stamina) writer.emit("resource_changed", beat, band, actor.actorId, null, entry.rootActionId, { resource: "stamina", before: staminaBefore, after: actor.stamina, reason: "action" });
    if (focusBefore !== actor.focus) writer.emit("resource_changed", beat, band, actor.actorId, null, entry.rootActionId, { resource: "focus", before: focusBefore, after: actor.focus, reason: "action" });
    begun.push(entry);
  }
  const preBandPositions = new Map([...states].map(([id, actor]) => [id, clonePosition(actor.positionMm)]));
  const preBandYaws = new Map([...states].map(([id, actor]) => [id, actor.yawTenThousandthRadians]));
  resolveMovementPhase(input, states, begun, preBandPositions, preBandYaws, writer, beat, band);
  for (const { actor, action, rootActionId } of begun.filter(({ action }) => action.kind === "recover")) {
    const before = actor.stamina; actor.stamina = Math.min(actor.maxStamina, actor.stamina + Math.ceil(actor.maxStamina * 0.30));
    writer.emit("resource_changed", beat, band, actor.actorId, null, rootActionId, { resource: "stamina", before, after: actor.stamina, reason: "recover" });
  }
  const damages: DamageApplication[] = [];
  for (const { actor, action, slot, rootActionId } of begun) {
    if (action.kind !== "light_attack" && action.kind !== "heavy_attack") continue;
    const targetActorId = actionTargetActorId(action); const damage = actionDamage(action);
    if (!targetActorId || damage === undefined) continue;
    const target = states.get(targetActorId);
    const sourcePosition = actor.positionMm; const targetPosition = target?.positionMm;
    if (!target || !sourcePosition || !targetPosition || target.health <= 0) {
      writer.emit("attack_missed", beat, band, actor.actorId, targetActorId, rootActionId, { clientActionId: action.actionId, reason: "target_unavailable", costsSpent: true });
      continue;
    }
    const range = actionRangeMm(action);
    if (!withinDistanceMm(sourcePosition, targetPosition, range)) {
      writer.emit("attack_missed", beat, band, actor.actorId, target.actorId, rootActionId, { clientActionId: action.actionId, reason: "range_or_movement", costsSpent: true });
      continue;
    }
    if (!input.authority.hasLineOfSight({
      encounterId: input.encounterId, round: input.round, sourceActorId: actor.actorId, targetActorId: target.actorId,
      beat, band, sourceMm: clonePosition(sourcePosition), targetMm: clonePosition(targetPosition),
    })) {
      writer.emit("attack_missed", beat, band, actor.actorId, target.actorId, rootActionId, { clientActionId: action.actionId, reason: "line_of_sight", costsSpent: true });
      continue;
    }
    const roll = seededTurnRollPermille(
      input.serverSeed, input.encounterId, input.leaseGeneration, input.round, actor.actorId, beat, band, slot,
    );
    const hitChance = "hitChancePermille" in action ? (action.hitChancePermille ?? 1_000) : 1_000;
    if (roll >= hitChance) {
      writer.emit("attack_missed", beat, band, actor.actorId, target.actorId, rootActionId, { clientActionId: action.actionId, reason: "seeded_roll", roll, costsSpent: true });
      continue;
    }
    writer.emit("attack_hit", beat, band, actor.actorId, target.actorId, rootActionId, { clientActionId: action.actionId, damageBand: damage, roll });
    damages.push({ sourceActorId: actor.actorId, targetActorId: target.actorId, amount: damage, rootActionId, actionId: action.actionId, interrupts: "interrupts" in action && action.interrupts === true, triggersGuard: action.reactionTrigger === "hostile_targeted" && relationMatches(actor, target, "hostile") });
  }
  const handled = resolveHandledEffects(input, states, begun, writer, beat, band);
  damages.push(...handled.damages);
  const applied = applyDamageBatch(states, damages, writer, beat, band, handled.healings);
  applyStatusesAndBuffs(states, handled.statuses, handled.buffs, writer, beat, band);
  for (const entry of begun) if (entry.action.kind === "item" && handled.appliedRoots.has(entry.rootActionId)) consumeResolvedItem(entry.actor, entry.action, entry.rootActionId, writer, beat, band);
  resolveReactiveChains(states, applied, writer, reactiveUses, beat, band);
}

function effectSnapshot(actor: MutableActor): TurnEffectActorSnapshotV1 {
  return {
    actorId: actor.actorId, team: actor.team, positionMm: clonePosition(actor.positionMm), health: actor.health, maxHealth: actor.maxHealth,
    stamina: actor.stamina, focus: actor.focus,
    statuses: Object.fromEntries(Object.entries(actor.statuses).map(([id, state]) => [id, { ...state }])),
    buffs: Object.fromEntries(Object.entries(actor.buffs).map(([id, state]) => [id, { ...state }])),
  };
}

function validateEffectResolution(value: unknown, action: CanonicalTurnTechniqueAction | CanonicalTurnItemAction, states: Map<string, MutableActor>): asserts value is TurnEffectResolutionV1 {
  if (!isPlainRecord(value)) throw new Error(`${action.effectHandlerId} returned a non-object effect result`);
  assertAllowedFields(value, ["resolved", "reason", "operations"], `${action.effectHandlerId} result`);
  if (typeof value.resolved !== "boolean") throw new Error(`${action.effectHandlerId}.resolved must be boolean`);
  if (value.reason !== undefined) assertTurnId(value.reason, `${action.effectHandlerId}.reason`);
  assertDenseTurnArray(value.operations, `${action.effectHandlerId}.operations`, TURN_MAX_EFFECT_OPERATIONS);
  if (!value.resolved && value.operations.length > 0) throw new Error(`${action.effectHandlerId} unresolved result cannot contain operations`);
  if (value.resolved && value.operations.length === 0) throw new Error(`${action.effectHandlerId} resolved result requires an operation`);
  let totalDamage = 0; let totalHealing = 0; const uniqueOperations = new Set<string>();
  for (const unknownOperation of value.operations) {
    if (!isPlainRecord(unknownOperation)) throw new Error(`${action.effectHandlerId} operation must be a plain object`);
    const kind = unknownOperation.kind;
    if (kind === "damage" || kind === "heal") {
      assertAllowedFields(unknownOperation, ["kind", "targetActorId", "amount"], `${action.effectHandlerId}.${kind}`);
      assertTurnId(unknownOperation.targetActorId, `${action.effectHandlerId}.${kind}.targetActorId`); assertTurnInteger(unknownOperation.amount, `${action.effectHandlerId}.${kind}.amount`, 1, TURN_MAX_DAMAGE);
      if (!states.has(unknownOperation.targetActorId)) throw new Error(`${action.effectHandlerId} operation targets an outsider`);
      const operationKey = `${kind}|${encodeCompositePart(unknownOperation.targetActorId as string)}`; if (uniqueOperations.has(operationKey)) throw new Error(`${action.effectHandlerId} duplicated a ${kind} target`); uniqueOperations.add(operationKey);
      if (kind === "damage") totalDamage += Number(unknownOperation.amount); else totalHealing += Number(unknownOperation.amount);
    } else if (kind === "status") {
      assertAllowedFields(unknownOperation, ["kind", "targetActorId", "statusId", "stacks", "durationRounds"], `${action.effectHandlerId}.status`);
      assertTurnId(unknownOperation.targetActorId, `${action.effectHandlerId}.status.targetActorId`); assertTurnId(unknownOperation.statusId, `${action.effectHandlerId}.status.statusId`);
      assertTurnInteger(unknownOperation.stacks, `${action.effectHandlerId}.status.stacks`, 1, TURN_MAX_RESOURCE); assertTurnInteger(unknownOperation.durationRounds, `${action.effectHandlerId}.status.durationRounds`, 1, TURN_MAX_ROUND);
      if (!states.has(unknownOperation.targetActorId)) throw new Error(`${action.effectHandlerId} operation targets an outsider`);
    } else if (kind === "buff") {
      assertAllowedFields(unknownOperation, ["kind", "targetActorId", "buffId", "magnitude", "durationRounds"], `${action.effectHandlerId}.buff`);
      assertTurnId(unknownOperation.targetActorId, `${action.effectHandlerId}.buff.targetActorId`); assertTurnId(unknownOperation.buffId, `${action.effectHandlerId}.buff.buffId`);
      assertTurnInteger(unknownOperation.magnitude, `${action.effectHandlerId}.buff.magnitude`, -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE); assertTurnInteger(unknownOperation.durationRounds, `${action.effectHandlerId}.buff.durationRounds`, 1, TURN_MAX_ROUND);
      if (!states.has(unknownOperation.targetActorId)) throw new Error(`${action.effectHandlerId} operation targets an outsider`);
    } else if (kind === "destination") {
      assertAllowedFields(unknownOperation, ["kind", "actorId", "destinationMm", "destinationYawTenThousandthRadians"], `${action.effectHandlerId}.destination`);
      assertTurnId(unknownOperation.actorId, `${action.effectHandlerId}.destination.actorId`); validateIntegerPositionMm(unknownOperation.destinationMm, `${action.effectHandlerId}.destination.destinationMm`);
      assertTurnInteger(unknownOperation.destinationYawTenThousandthRadians, `${action.effectHandlerId}.destination.yaw`, -31_416, 31_416);
    } else throw new Error(`${action.effectHandlerId} returned unknown operation ${String(kind)}`);
  }
  if (totalDamage > (action.damage ?? 0)) throw new Error(`${action.effectHandlerId} exceeded aggregate authored damage`);
  if (totalHealing > (action.healing ?? 0)) throw new Error(`${action.effectHandlerId} exceeded aggregate authored healing`);
}

function resolveHandledEffects(
  input: TurnKernelInputV1, states: Map<string, MutableActor>, begun: readonly BegunAction[], writer: EventWriter,
  beat: TurnBeat, band: TurnResolutionBand,
): { damages: DamageApplication[]; healings: HealingApplication[]; statuses: StatusApplication[]; buffs: BuffApplication[]; appliedRoots: Set<string> } {
  const damages: DamageApplication[] = []; const healings: HealingApplication[] = []; const statuses: StatusApplication[] = []; const buffs: BuffApplication[] = [];
  const appliedRoots = new Set<string>(); const destinationProposals: MovementProposal[] = [];
  const snapshots = [...states.values()].sort((a, b) => codeUnitCompare(a.actorId, b.actorId)).map(effectSnapshot);
  for (const entry of begun.filter(({ action }) => action.kind === "technique" || action.kind === "item").sort(actionOrder)) {
    const action = entry.action as CanonicalTurnTechniqueAction | CanonicalTurnItemAction; const targetId = action.targetActorId; const target = targetId ? states.get(targetId) : undefined;
    if (targetId && (!target || target.health <= 0)) { writer.emit("attack_missed", beat, band, entry.actor.actorId, targetId, entry.rootActionId, { clientActionId: action.actionId, reason: "target_unavailable", costsSpent: true }); continue; }
    if (target && action.rangeMm !== undefined && !withinDistanceMm(entry.actor.positionMm, target.positionMm, action.rangeMm)) { writer.emit("attack_missed", beat, band, entry.actor.actorId, target.actorId, entry.rootActionId, { clientActionId: action.actionId, reason: "range_or_movement", costsSpent: true }); continue; }
    if (target && target.actorId !== entry.actor.actorId && action.rangeMm !== undefined && !input.authority.hasLineOfSight({
      encounterId: input.encounterId, round: input.round, sourceActorId: entry.actor.actorId, targetActorId: target.actorId, beat, band,
      sourceMm: clonePosition(entry.actor.positionMm), targetMm: clonePosition(target.positionMm),
    })) { writer.emit("attack_missed", beat, band, entry.actor.actorId, target.actorId, entry.rootActionId, { clientActionId: action.actionId, reason: "line_of_sight", costsSpent: true }); continue; }
    const roll = seededTurnRollPermille(input.serverSeed, input.encounterId, input.leaseGeneration, input.round, entry.actor.actorId, beat, band, entry.slot, "effect");
    if (roll >= action.hitChancePermille) { writer.emit("attack_missed", beat, band, entry.actor.actorId, targetId ?? null, entry.rootActionId, { clientActionId: action.actionId, reason: "seeded_roll", roll, costsSpent: true }); continue; }
    const resolution = input.authority.resolveEffect({
      encounterId: input.encounterId, leaseGeneration: input.leaseGeneration, round: input.round, beat, band, rootActionId: entry.rootActionId,
      actor: effectSnapshot(entry.actor), action, actors: snapshots.map((snapshot) => ({ ...snapshot, positionMm: clonePosition(snapshot.positionMm) })),
    });
    validateEffectResolution(resolution, action, states);
    if (!resolution.resolved) { writer.emit("attack_missed", beat, band, entry.actor.actorId, targetId ?? null, entry.rootActionId, { clientActionId: action.actionId, reason: resolution.reason ?? "effect_unresolved", costsSpent: true }); continue; }
    for (const operation of resolution.operations) {
      if (operation.kind !== "destination") {
        const operationTarget = states.get(operation.targetActorId)!;
        if (!relationMatches(entry.actor, operationTarget, action.targetRelation)) throw new Error(`${action.effectHandlerId} violated authored target relation`);
      }
      if (operation.kind === "damage") damages.push({ sourceActorId: entry.actor.actorId, targetActorId: operation.targetActorId, amount: operation.amount, rootActionId: entry.rootActionId, actionId: action.actionId, interrupts: action.interrupts, triggersGuard: action.reactionTrigger === "hostile_targeted" && relationMatches(entry.actor, states.get(operation.targetActorId)!, "hostile") });
      else if (operation.kind === "heal") healings.push({ sourceActorId: entry.actor.actorId, targetActorId: operation.targetActorId, amount: operation.amount, rootActionId: entry.rootActionId, actionId: action.actionId });
      else if (operation.kind === "status") statuses.push({ sourceActorId: entry.actor.actorId, targetActorId: operation.targetActorId, statusId: operation.statusId, stacks: operation.stacks, durationRounds: operation.durationRounds, rootActionId: entry.rootActionId });
      else if (operation.kind === "buff") buffs.push({ sourceActorId: entry.actor.actorId, targetActorId: operation.targetActorId, buffId: operation.buffId, magnitude: operation.magnitude, durationRounds: operation.durationRounds, rootActionId: entry.rootActionId });
      else {
        if (operation.actorId !== entry.actor.actorId || !action.destinationMm || operation.destinationMm.x !== action.destinationMm.x || operation.destinationMm.y !== action.destinationMm.y || operation.destinationMm.z !== action.destinationMm.z || operation.destinationYawTenThousandthRadians !== action.destinationYawTenThousandthRadians) throw new Error(`${action.effectHandlerId} destination must match the canonical source selection`);
        destinationProposals.push({ actor: entry.actor, kind: "effect", destination: operation.destinationMm, destinationYaw: operation.destinationYawTenThousandthRadians, rootActionId: entry.rootActionId, actionId: action.actionId, maximumDistanceMm: action.rangeMm ?? 4_000, costsSpent: true });
      }
    }
    if (resolution.operations.some((operation) => operation.kind !== "destination")) appliedRoots.add(entry.rootActionId);
  }
  if (destinationProposals.length > 0) {
    const origins = new Map([...states].map(([id, actor]) => [id, clonePosition(actor.positionMm)])); const yaws = new Map([...states].map(([id, actor]) => [id, actor.yawTenThousandthRadians]));
    for (const root of resolveMovementProposals(input, states, destinationProposals, origins, yaws, writer, beat, band)) appliedRoots.add(root);
  }
  for (const root of [...appliedRoots].sort(codeUnitCompare)) writer.emit("effect_resolved", beat, band, null, null, root, { resolved: true });
  return { damages, healings, statuses, buffs, appliedRoots };
}

function consumeResolvedItem(actor: MutableActor, action: CanonicalTurnAction, rootActionId: string, writer: EventWriter, beat: TurnBeat, band: TurnResolutionBand): void {
  const itemId = actionItemId(action);
  if (!itemId) return;
  const before = actor.itemCharges[itemId] ?? 0;
  actor.itemCharges[itemId] = Math.max(0, before - 1);
  writer.emit("resource_changed", beat, band, actor.actorId, null, rootActionId, { resource: "item", itemId, before, after: actor.itemCharges[itemId]!, reason: "effect_resolved" });
}

interface MovementProposal {
  actor: MutableActor;
  kind: "dodge" | "move" | "effect";
  destination: IntegerPositionMm;
  destinationYaw: number;
  rootActionId: string;
  actionId: string;
  maximumDistanceMm: number;
  costsSpent: boolean;
}

function resolveMovementPhase(
  input: TurnKernelInputV1, states: Map<string, MutableActor>, begun: readonly BegunAction[],
  preBandPositions: Map<string, IntegerPositionMm>, preBandYaws: Map<string, number>, writer: EventWriter,
  beat: TurnBeat, band: TurnResolutionBand,
): Set<string> {
  const triggeringRootByTarget = new Map<string, string>();
  for (const entry of [...begun].sort(actionOrder)) {
    const targetActorId = actionTargetActorId(entry.action);
    const target = targetActorId ? states.get(targetActorId) : undefined;
    if (target && entry.action.reactionTrigger === "hostile_targeted" && relationMatches(entry.actor, target, "hostile") && !triggeringRootByTarget.has(targetActorId!)) triggeringRootByTarget.set(targetActorId!, entry.rootActionId);
  }
  const proposals: MovementProposal[] = [];
  for (const actor of [...states.values()].sort(actorOrder)) {
    const rootActionId = triggeringRootByTarget.get(actor.actorId); const reaction = actor.reaction;
    if (rootActionId && actor.health > 0 && reaction?.kind === "dodge" && !actor.reactionTriggered) proposals.push({
      actor, kind: "dodge", destination: reaction.destinationMm, destinationYaw: reaction.destinationYawTenThousandthRadians,
      rootActionId, actionId: reaction.reactionId, maximumDistanceMm: 3_000, costsSpent: false,
    });
  }
  for (const entry of begun) if (entry.action.kind === "move") proposals.push({
    actor: entry.actor, kind: "move", destination: entry.action.destinationMm, destinationYaw: entry.action.destinationYawTenThousandthRadians,
    rootActionId: entry.rootActionId, actionId: entry.action.actionId, maximumDistanceMm: 4_000, costsSpent: true,
  });
  return resolveMovementProposals(input, states, proposals, preBandPositions, preBandYaws, writer, beat, band);
}

function resolveMovementProposals(
  input: TurnKernelInputV1, states: Map<string, MutableActor>, proposals: readonly MovementProposal[],
  origins: Map<string, IntegerPositionMm>, originYaws: Map<string, number>, writer: EventWriter,
  beat: TurnBeat, band: TurnResolutionBand,
): Set<string> {
  const ordered = [...proposals].sort((left, right) => actorOrder(left.actor, right.actor) || (left.kind === "dodge" ? -1 : right.kind === "dodge" ? 1 : codeUnitCompare(left.actionId, right.actionId)));
  const eligible = new Map<string, MovementProposal>(); const rejected = new Map<MovementProposal, string>();
  for (const proposal of ordered) {
    if (eligible.has(proposal.actor.actorId)) { rejected.set(proposal, "superseded"); continue; }
    const origin = origins.get(proposal.actor.actorId)!;
    if (!withinDistanceMm(origin, proposal.destination, proposal.maximumDistanceMm)) { rejected.set(proposal, "distance"); continue; }
    const traversalKind = proposal.kind === "dodge" ? "dodge" : "move";
    if (!input.authority.canTraverse({
      encounterId: input.encounterId, round: input.round, actorId: proposal.actor.actorId, kind: traversalKind, beat, band,
      fromMm: clonePosition(origin), toMm: clonePosition(proposal.destination), fromYawTenThousandthRadians: originYaws.get(proposal.actor.actorId)!, toYawTenThousandthRadians: proposal.destinationYaw,
    })) { rejected.set(proposal, "navigation"); continue; }
    eligible.set(proposal.actor.actorId, proposal);
  }
  const destinationWinner = new Map<string, MovementProposal>();
  for (const proposal of [...eligible.values()].sort((left, right) => actorOrder(left.actor, right.actor))) {
    const key = positionKey(proposal.destination); if (destinationWinner.has(key)) { eligible.delete(proposal.actor.actorId); rejected.set(proposal, "occupied"); } else destinationWinner.set(key, proposal);
  }
  const occupantByPosition = new Map([...origins].map(([actorId, position]) => [positionKey(position), actorId]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const proposal of [...eligible.values()]) {
      const occupantId = occupantByPosition.get(positionKey(proposal.destination));
      if (!occupantId || occupantId === proposal.actor.actorId) continue;
      const occupantMove = eligible.get(occupantId); const occupantOrigin = origins.get(occupantId)!;
      if (!occupantMove || positionKey(occupantMove.destination) === positionKey(occupantOrigin)) {
        eligible.delete(proposal.actor.actorId); rejected.set(proposal, "occupied"); changed = true;
      }
    }
  }
  const acceptedRoots = new Set<string>();
  for (const proposal of [...eligible.values()].sort((left, right) => actorOrder(left.actor, right.actor))) {
    proposal.actor.positionMm = clonePosition(proposal.destination); proposal.actor.yawTenThousandthRadians = proposal.destinationYaw; acceptedRoots.add(proposal.rootActionId);
    if (proposal.kind === "dodge") {
      const before = proposal.actor.stamina; proposal.actor.stamina -= proposal.actor.heldReactionStamina; proposal.actor.reactionTriggered = true;
      writer.emit("reaction_triggered", beat, band, proposal.actor.actorId, null, proposal.rootActionId, { kind: "dodge", stamina: proposal.actor.heldReactionStamina });
      writer.emit("resource_changed", beat, band, proposal.actor.actorId, null, proposal.rootActionId, { resource: "stamina", before, after: proposal.actor.stamina, reason: "dodge" });
    }
    writer.emit("movement", beat, band, proposal.actor.actorId, null, proposal.rootActionId, { clientActionId: proposal.actionId, kind: proposal.kind, x: proposal.destination.x, y: proposal.destination.y, z: proposal.destination.z, yawTenThousandthRadians: proposal.destinationYaw });
  }
  for (const [proposal, reason] of [...rejected].sort(([left], [right]) => actorOrder(left.actor, right.actor))) writer.emit("movement_conflict", beat, band, proposal.actor.actorId, null, proposal.rootActionId, {
    clientActionId: proposal.actionId, kind: proposal.kind, reason, costsSpent: proposal.costsSpent, x: proposal.destination.x, y: proposal.destination.y, z: proposal.destination.z,
  });
  return acceptedRoots;
}

function triggerGuard(actor: MutableActor, rootActionId: string, writer: EventWriter, beat: TurnBeat, band: TurnResolutionBand): number {
  if (actor.reaction?.kind !== "guard" || actor.reactionTriggered || actor.heldReactionStamina > actor.stamina) return 0;
  const before = actor.stamina; actor.stamina -= actor.heldReactionStamina; actor.reactionTriggered = true;
  const mitigation = Math.max(0, Math.min(500, actor.reaction.mitigationPermille ?? 500));
  writer.emit("reaction_triggered", beat, band, actor.actorId, null, rootActionId, { kind: "guard", stamina: actor.heldReactionStamina, mitigationPermille: mitigation });
  writer.emit("resource_changed", beat, band, actor.actorId, null, rootActionId, { resource: "stamina", before, after: actor.stamina, reason: "guard" });
  return mitigation;
}

function applyDamageBatch(
  states: Map<string, MutableActor>, damages: readonly DamageApplication[], writer: EventWriter,
  beat: TurnBeat, band: TurnResolutionBand, healings: readonly HealingApplication[] = [],
): DamageApplication[] {
  const applicable = damages.filter((damage) => damage.amount > 0 && states.has(damage.sourceActorId) && (states.get(damage.targetActorId)?.health ?? 0) > 0)
    .sort((a, b) => codeUnitCompare(a.targetActorId, b.targetActorId) || codeUnitCompare(a.sourceActorId, b.sourceActorId) || codeUnitCompare(a.rootActionId, b.rootActionId));
  const mitigations = new Map<string, number>();
  for (const targetId of [...new Set(applicable.filter((damage) => damage.triggersGuard).map((damage) => damage.targetActorId))].sort(codeUnitCompare)) {
    const triggeringRoot = applicable.find((damage) => damage.targetActorId === targetId && damage.triggersGuard)!.rootActionId;
    mitigations.set(targetId, triggerGuard(states.get(targetId)!, triggeringRoot, writer, beat, band));
  }
  const adjusted = applicable.map((damage) => {
    const target = states.get(damage.targetActorId)!;
    const guardMitigation = mitigations.get(damage.targetActorId) ?? 0;
    const shelteredMagnitude = target.buffs[TURN_SHELTERED_WARD_BUFF_ID]?.magnitude ?? 0;
    const wardMitigation = Math.max(0, Math.min(500, shelteredMagnitude * TURN_SHELTERED_WARD_PER_MAGNITUDE_PERMILLE));
    const afterGuard = Math.ceil(damage.amount * (1_000 - guardMitigation) / 1_000);
    return { ...damage, amount: Math.max(0, Math.ceil(afterGuard * (1_000 - wardMitigation) / 1_000)) };
  });
  const damageTotals = new Map<string, number>(); const healingTotals = new Map<string, number>();
  for (const damage of adjusted) damageTotals.set(damage.targetActorId, (damageTotals.get(damage.targetActorId) ?? 0) + damage.amount);
  const applicableHealing = healings.filter((healing) => healing.amount > 0 && states.has(healing.sourceActorId) && states.has(healing.targetActorId))
    .sort((a, b) => codeUnitCompare(a.targetActorId, b.targetActorId) || codeUnitCompare(a.sourceActorId, b.sourceActorId) || codeUnitCompare(a.rootActionId, b.rootActionId));
  for (const healing of applicableHealing) healingTotals.set(healing.targetActorId, (healingTotals.get(healing.targetActorId) ?? 0) + healing.amount);
  const affectedIds = [...new Set([...damageTotals.keys(), ...healingTotals.keys()])].sort(codeUnitCompare);
  const healthBefore = new Map(affectedIds.map((targetId) => [targetId, states.get(targetId)!.health]));
  for (const targetId of affectedIds) {
    const actor = states.get(targetId)!; actor.health = Math.max(0, Math.min(actor.maxHealth, actor.health - (damageTotals.get(targetId) ?? 0) + (healingTotals.get(targetId) ?? 0)));
  }
  for (const damage of adjusted) {
    writer.emit("damage_applied", beat, band, damage.sourceActorId, damage.targetActorId, damage.rootActionId, { actionId: damage.actionId, amount: damage.amount });
    if (damage.interrupts && damage.amount > 0) states.get(damage.targetActorId)!.interrupted = true;
  }
  for (const healing of applicableHealing) writer.emit("healing_applied", beat, band, healing.sourceActorId, healing.targetActorId, healing.rootActionId, { actionId: healing.actionId, amount: healing.amount });
  for (const targetId of affectedIds) {
    const actor = states.get(targetId)!;
    if (actor.interrupted) writer.emit("actor_interrupted", beat, band, targetId, null, null, { health: actor.health });
    if ((healthBefore.get(targetId) ?? 0) > 0 && actor.health === 0) writer.emit("actor_defeated", beat, band, targetId, null, null, { simultaneousBand: true });
  }
  return adjusted.filter((damage) => damage.amount > 0);
}

function applyStatusesAndBuffs(
  states: Map<string, MutableActor>, statuses: readonly StatusApplication[], buffs: readonly BuffApplication[], writer: EventWriter,
  beat: TurnBeat, band: TurnResolutionBand,
): void {
  for (const effect of [...statuses].sort((a, b) => codeUnitCompare(a.targetActorId, b.targetActorId) || codeUnitCompare(a.statusId, b.statusId) || codeUnitCompare(a.rootActionId, b.rootActionId))) {
    const actor = states.get(effect.targetActorId)!; const previous = actor.statuses[effect.statusId];
    actor.statuses[effect.statusId] = { stacks: Math.min(TURN_MAX_RESOURCE, (previous?.stacks ?? 0) + effect.stacks), remainingRounds: Math.max(previous?.remainingRounds ?? 0, effect.durationRounds) };
    writer.emit("status_applied", beat, band, effect.sourceActorId, effect.targetActorId, effect.rootActionId, { statusId: effect.statusId, stacks: effect.stacks, durationRounds: effect.durationRounds });
  }
  for (const effect of [...buffs].sort((a, b) => codeUnitCompare(a.targetActorId, b.targetActorId) || codeUnitCompare(a.buffId, b.buffId) || codeUnitCompare(a.rootActionId, b.rootActionId))) {
    const actor = states.get(effect.targetActorId)!; const previous = actor.buffs[effect.buffId];
    actor.buffs[effect.buffId] = { magnitude: Math.max(-TURN_MAX_RESOURCE, Math.min(TURN_MAX_RESOURCE, (previous?.magnitude ?? 0) + effect.magnitude)), remainingRounds: Math.max(previous?.remainingRounds ?? 0, effect.durationRounds) };
    writer.emit("buff_applied", beat, band, effect.sourceActorId, effect.targetActorId, effect.rootActionId, { buffId: effect.buffId, magnitude: effect.magnitude, durationRounds: effect.durationRounds });
  }
}

function resolveReactiveChains(
  states: Map<string, MutableActor>, initialDamage: readonly DamageApplication[], writer: EventWriter,
  uses: Map<string, number>, beat: TurnBeat, band: TurnResolutionBand,
): void {
  let frontier = [...initialDamage]; let insertedInBand = 0;
  const insertedByRoot = new Map<string, number>();
  while (frontier.length > 0) {
    const insertions: DamageApplication[] = [];
    for (const damage of frontier) {
      const owner = states.get(damage.targetActorId); const target = states.get(damage.sourceActorId);
      if (!owner || !target || target.health <= 0) continue;
      for (const rule of [...owner.reactiveRules].sort((a, b) => codeUnitCompare(a.ruleId, b.ruleId))) {
        const useKey = `${encodeCompositePart(owner.actorId)}|${encodeCompositePart(rule.ruleId)}`; const used = uses.get(useKey) ?? 0;
        if (used >= rule.maxUsesPerRound || (owner.health <= 0 && !rule.posthumous)) continue;
        const rootCount = insertedByRoot.get(damage.rootActionId) ?? 0;
        if (rootCount >= MAX_REACTIVE_INSERTIONS_PER_ROOT || insertedInBand >= MAX_REACTIVE_INSERTIONS_PER_BAND) {
          writer.emit("reactive_cap_reached", beat, band, owner.actorId, target.actorId, damage.rootActionId, { rootInsertions: rootCount, bandInsertions: insertedInBand });
          continue;
        }
        uses.set(useKey, used + 1); insertedByRoot.set(damage.rootActionId, rootCount + 1); insertedInBand += 1;
        const actionId = `reactive|${encodeCompositePart(owner.actorId)}|${encodeCompositePart(rule.ruleId)}|${encodeCompositePart(used + 1)}`;
        writer.emit("reactive_inserted", beat, band, owner.actorId, target.actorId, damage.rootActionId, { actionId, ruleId: rule.ruleId, insertion: rootCount + 1 });
        insertions.push({ sourceActorId: owner.actorId, targetActorId: target.actorId, amount: rule.damage, rootActionId: damage.rootActionId, actionId, interrupts: rule.interrupts === true, triggersGuard: owner.team !== target.team });
      }
    }
    if (insertions.length === 0) break;
    frontier = applyDamageBatch(states, insertions, writer, beat, band);
  }
}

function determineOutcome(states: Map<string, MutableActor>): TurnRoundOutcome {
  const playersAlive = [...states.values()].some((actor) => actor.team === "players" && actor.health > 0);
  const enemiesAlive = [...states.values()].some((actor) => actor.team === "enemies" && actor.health > 0);
  if (!playersAlive && !enemiesAlive) return "mutual_defeat";
  if (!playersAlive) return "defeat";
  if (!enemiesAlive) return "victory";
  return "ongoing";
}
