/** Isolated protocol-v2 contracts. Existing real-time wire contracts remain unchanged. */
export const NETWORK_PROTOCOL_VERSION = 2 as const;
export const TURN_ENCOUNTER_VERSION = 1 as const;

export const TURN_ENCOUNTER_PHASES = [
  "forming", "planning", "locked", "resolving", "settling", "victory", "defeat", "aborted",
] as const;
export type TurnEncounterPhase = typeof TURN_ENCOUNTER_PHASES[number];

export const TURN_RESOLUTION_BANDS = [
  "preemptive", "movement", "fast", "standard", "heavy", "aftermath",
] as const;
export type TurnResolutionBand = typeof TURN_RESOLUTION_BANDS[number];
export type TurnBeat = 0 | 1;
export type TurnTeam = "players" | "enemies";
export type CanonicalTurnActionKind = "move" | "light_attack" | "heavy_attack" | "technique" | "item" | "recover" | "hold";
export type SkillEffectScope = "world" | "encounter" | "both";
export type EncounterViewerMode = "participant" | "spectator" | "reconnecting";
export type TurnTargetRelation = "self" | "hostile" | "ally" | "any";
export type TurnReactionTrigger = "none" | "hostile_targeted";

export const TURN_MAX_ID_LENGTH = 160;
export const TURN_MAX_ACTORS = 128;
export const TURN_MAX_COORDINATE_MM = 32_000_000;
export const TURN_MAX_RANGE_MM = 100_000;
export const TURN_MAX_RESOURCE = 1_000_000;
export const TURN_MAX_DAMAGE = 1_000_000;
export const TURN_MAX_EFFECT_OPERATIONS = 128;
export const TURN_MAX_REACTIVE_RULES = 64;
export const TURN_MAX_EVENT_SEQUENCE = Number.MAX_SAFE_INTEGER - 100_000;
export const TURN_MAX_ROUND = 1_000_000_000;
export const TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS = 31_416;

export interface IntegerPositionMm {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const codeUnitCompare = (left: string, right: string): number => left === right ? 0 : left < right ? -1 : 1;

const isPlainRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
);

function assertPlainRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw new Error(`${label} must be a plain object`);
}

function assertAllowedFields(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const fields = new Set(allowed);
  for (const key of Object.keys(record)) if (!fields.has(key)) throw new Error(`${label} forbids field ${key}`);
}

export function assertDenseTurnArray(value: unknown, label: string, maximumLength: number): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  if (value.length > maximumLength) throw new Error(`${label} exceeds maximum length ${maximumLength}`);
  for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index)) throw new Error(`${label} cannot be sparse`);
}

export function assertTurnId(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !value || value.length > TURN_MAX_ID_LENGTH || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${label} is invalid`);
}

export function assertTurnInteger(value: unknown, label: string, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): asserts value is number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) throw new Error(`${label} must be a safe integer in ${minimum}..${maximum}`);
}

export function validateIntegerPositionMm(value: unknown, label: string): asserts value is IntegerPositionMm {
  assertPlainRecord(value, label);
  assertAllowedFields(value, ["x", "y", "z"], label);
  for (const axis of ["x", "y", "z"] as const) assertTurnInteger(value[axis], `${label}.${axis}`, -TURN_MAX_COORDINATE_MM, TURN_MAX_COORDINATE_MM);
}

const positionEquals = (left: IntegerPositionMm | undefined, right: IntegerPositionMm | undefined): boolean => (
  left === undefined ? right === undefined : right !== undefined && left.x === right.x && left.y === right.y && left.z === right.z
);

function assertOptionalBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== "boolean") throw new Error(`${label} must be boolean`);
}

function assertFiniteNumber(value: unknown, label: string, minimum: number, maximum: number): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${label} must be finite in ${minimum}..${maximum}`);
}

function assertStringArray(value: unknown, label: string, maximumLength = 64): asserts value is readonly string[] {
  assertDenseTurnArray(value, label, maximumLength);
  const seen = new Set<string>();
  for (const entry of value) {
    assertTurnId(entry, `${label} entry`);
    if (seen.has(entry)) throw new Error(`${label} entries must be unique`);
    seen.add(entry);
  }
}

export interface TurnActionSelectionV1 {
  readonly selectionId: string;
  readonly actionDefinitionId: string;
  readonly beat: TurnBeat;
  readonly targetActorId?: string;
  readonly destinationMm?: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians?: number;
}

export interface TurnReactionSelectionV1 {
  readonly selectionId: string;
  readonly reactionDefinitionId: string;
  readonly destinationMm?: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians?: number;
}

export interface TurnPlanRequest {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly characterId: string;
  readonly commandId: string;
  readonly round: number;
  readonly revision: number;
  /** Untrusted choices only. Authored mechanics never cross this boundary. */
  readonly actions: readonly TurnActionSelectionV1[];
  readonly reaction: TurnReactionSelectionV1 | null;
  readonly ready: true;
}

export interface TurnEncounterStartRequest {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly commandId: string;
  readonly characterId: string;
  readonly enemyActorIds: readonly string[];
}

export interface TurnEncounterJoinRequest {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly commandId: string;
  readonly characterId: string;
  readonly encounterId: string;
}

export interface TurnEncounterWithdrawRequest {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly commandId: string;
  readonly characterId: string;
  readonly encounterId: string;
}

export type TurnEncounterCommandRequest = TurnEncounterStartRequest | TurnEncounterJoinRequest | TurnEncounterWithdrawRequest;
export type TurnEncounterCommandKind = "start" | "join" | "withdraw";
export type TurnEncounterCommandRejection =
  | "protocol_upgrade_required" | "authentication_required" | "character_mismatch" | "invalid_request" | "rate_limited"
  | "enemy_unavailable" | "encounter_not_found" | "encounter_full" | "join_closed"
  | "not_participant" | "already_withdrawn" | "duplicate_live_character" | "invalid_phase"
  | "idempotency_conflict";

export interface TurnEncounterCommandAck {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly commandId: string;
  readonly characterId: string;
  readonly kind: TurnEncounterCommandKind;
  readonly encounterId: string | null;
  readonly accepted: boolean;
  readonly rejection?: TurnEncounterCommandRejection;
}

export interface TurnEventCursorRequest {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly characterId: string;
  readonly sequence: number;
}

export interface TurnEventCursorAck extends TurnEventCursorRequest {
  readonly accepted: boolean;
  readonly rejection?: "protocol_upgrade_required" | "authentication_required" | "character_mismatch" | "invalid_request" | "rate_limited" | "not_participant" | "stale_revision";
}

/** Private room-bootstrap identity. Never replicated through public actor state. */
export interface AuthenticatedCharacterV1 {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly characterId: string;
}

export function validateAuthenticatedCharacterV1(value: unknown): asserts value is AuthenticatedCharacterV1 {
  assertPlainRecord(value, "AuthenticatedCharacterV1");
  assertAllowedFields(value, ["protocolVersion", "characterId"], "AuthenticatedCharacterV1");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`AuthenticatedCharacterV1.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(value.characterId, "AuthenticatedCharacterV1.characterId");
}

/** Owner-only resources sent outside the globally replicated actor schema. */
export interface PrivateActorResourcesV1 {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly actorId: string;
  readonly characterId: string;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly focus: number;
  readonly maxFocus: number;
}

export function validatePrivateActorResourcesV1(value: unknown): asserts value is PrivateActorResourcesV1 {
  assertPlainRecord(value, "PrivateActorResourcesV1");
  assertAllowedFields(value, ["protocolVersion", "actorId", "characterId", "stamina", "maxStamina", "focus", "maxFocus"], "PrivateActorResourcesV1");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`PrivateActorResourcesV1.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(value.actorId, "PrivateActorResourcesV1.actorId");
  assertTurnId(value.characterId, "PrivateActorResourcesV1.characterId");
  assertTurnInteger(value.maxStamina, "PrivateActorResourcesV1.maxStamina", 1, TURN_MAX_RESOURCE);
  assertTurnInteger(value.stamina, "PrivateActorResourcesV1.stamina", 0, value.maxStamina as number);
  assertTurnInteger(value.maxFocus, "PrivateActorResourcesV1.maxFocus", 1, TURN_MAX_RESOURCE);
  assertTurnInteger(value.focus, "PrivateActorResourcesV1.focus", 0, value.maxFocus as number);
}

function validateEncounterCommandHeader(value: Record<string, unknown>, label: string): void {
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`${label}.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(value.commandId, `${label}.commandId`);
  assertTurnId(value.characterId, `${label}.characterId`);
}

export function validateTurnEncounterStartRequest(value: unknown): asserts value is TurnEncounterStartRequest {
  assertPlainRecord(value, "TurnEncounterStartRequest");
  assertAllowedFields(value, ["protocolVersion", "commandId", "characterId", "enemyActorIds"], "TurnEncounterStartRequest");
  validateEncounterCommandHeader(value, "TurnEncounterStartRequest");
  const enemyActorIds = value.enemyActorIds;
  assertStringArray(enemyActorIds, "TurnEncounterStartRequest.enemyActorIds", TURN_MAX_ACTORS);
  if (enemyActorIds.length === 0) throw new Error("TurnEncounterStartRequest.enemyActorIds cannot be empty");
  if ([...enemyActorIds].sort(codeUnitCompare).some((id, index) => id !== enemyActorIds[index])) throw new Error("TurnEncounterStartRequest.enemyActorIds must be sorted");
}

export function validateTurnEncounterJoinRequest(value: unknown): asserts value is TurnEncounterJoinRequest {
  assertPlainRecord(value, "TurnEncounterJoinRequest");
  assertAllowedFields(value, ["protocolVersion", "commandId", "characterId", "encounterId"], "TurnEncounterJoinRequest");
  validateEncounterCommandHeader(value, "TurnEncounterJoinRequest");
  assertTurnId(value.encounterId, "TurnEncounterJoinRequest.encounterId");
}

export function validateTurnEncounterWithdrawRequest(value: unknown): asserts value is TurnEncounterWithdrawRequest {
  assertPlainRecord(value, "TurnEncounterWithdrawRequest");
  assertAllowedFields(value, ["protocolVersion", "commandId", "characterId", "encounterId"], "TurnEncounterWithdrawRequest");
  validateEncounterCommandHeader(value, "TurnEncounterWithdrawRequest");
  assertTurnId(value.encounterId, "TurnEncounterWithdrawRequest.encounterId");
}

export function validateTurnEncounterCommandAck(value: unknown): asserts value is TurnEncounterCommandAck {
  assertPlainRecord(value, "TurnEncounterCommandAck");
  assertAllowedFields(value, ["protocolVersion", "commandId", "characterId", "kind", "encounterId", "accepted", "rejection"], "TurnEncounterCommandAck");
  validateEncounterCommandHeader(value, "TurnEncounterCommandAck");
  if (value.kind !== "start" && value.kind !== "join" && value.kind !== "withdraw") throw new Error("TurnEncounterCommandAck.kind is invalid");
  if (value.encounterId !== null) assertTurnId(value.encounterId, "TurnEncounterCommandAck.encounterId");
  if (typeof value.accepted !== "boolean") throw new Error("TurnEncounterCommandAck.accepted must be boolean");
  const rejections: readonly TurnEncounterCommandRejection[] = [
    "protocol_upgrade_required", "authentication_required", "character_mismatch", "invalid_request", "rate_limited",
    "enemy_unavailable", "encounter_not_found", "encounter_full", "join_closed", "not_participant",
    "already_withdrawn", "duplicate_live_character", "invalid_phase", "idempotency_conflict",
  ];
  if (value.accepted) {
    if (value.rejection !== undefined || value.encounterId === null) throw new Error("accepted TurnEncounterCommandAck requires encounterId and forbids rejection");
  } else if (!rejections.includes(value.rejection as TurnEncounterCommandRejection)) {
    throw new Error("rejected TurnEncounterCommandAck requires a valid rejection");
  }
}

export function validateTurnEventCursorRequest(value: unknown): asserts value is TurnEventCursorRequest {
  assertPlainRecord(value, "TurnEventCursorRequest");
  assertAllowedFields(value, ["protocolVersion", "encounterId", "characterId", "sequence"], "TurnEventCursorRequest");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`TurnEventCursorRequest.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(value.encounterId, "TurnEventCursorRequest.encounterId");
  assertTurnId(value.characterId, "TurnEventCursorRequest.characterId");
  assertTurnInteger(value.sequence, "TurnEventCursorRequest.sequence", 0, TURN_MAX_EVENT_SEQUENCE);
}

export function validateTurnEventCursorAck(value: unknown): asserts value is TurnEventCursorAck {
  assertPlainRecord(value, "TurnEventCursorAck");
  assertAllowedFields(value, ["protocolVersion", "encounterId", "characterId", "sequence", "accepted", "rejection"], "TurnEventCursorAck");
  const request = { protocolVersion: value.protocolVersion, encounterId: value.encounterId, characterId: value.characterId, sequence: value.sequence };
  validateTurnEventCursorRequest(request);
  if (typeof value.accepted !== "boolean") throw new Error("TurnEventCursorAck.accepted must be boolean");
  const rejections: readonly NonNullable<TurnEventCursorAck["rejection"]>[] = ["protocol_upgrade_required", "authentication_required", "character_mismatch", "invalid_request", "rate_limited", "not_participant", "stale_revision"];
  if (value.accepted ? value.rejection !== undefined : !rejections.includes(value.rejection as NonNullable<TurnEventCursorAck["rejection"]>)) throw new Error("TurnEventCursorAck acceptance/rejection is invalid");
}

export type TurnPlanRejection = "protocol_upgrade_required" | "character_mismatch" | "rate_limited" | "stale_round" | "stale_revision" | "invalid_plan" | "already_ready" | "not_participant" | "idempotency_conflict";

export interface TurnPlanAck {
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly characterId: string;
  readonly commandId: string;
  readonly round: number;
  readonly revision: number;
  readonly accepted: boolean;
  readonly rejection?: TurnPlanRejection;
  readonly planHash?: string;
}

interface CanonicalTurnActionBase {
  readonly actionId: string;
  readonly definitionId: string;
  readonly beat: TurnBeat;
  readonly band: TurnResolutionBand;
  readonly staminaCost: number;
  readonly focusCost: number;
  readonly posthumous: boolean;
  readonly reactionTrigger: TurnReactionTrigger;
  readonly targetRelation: TurnTargetRelation;
}

export interface CanonicalTurnMoveAction extends CanonicalTurnActionBase {
  readonly kind: "move";
  readonly apCost: 1;
  readonly staminaCost: 8;
  readonly focusCost: 0;
  readonly reactionTrigger: "none";
  readonly targetRelation: "self";
  readonly destinationMm: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians: number;
}

export interface CanonicalTurnLightAttackAction extends CanonicalTurnActionBase {
  readonly kind: "light_attack";
  readonly apCost: 1;
  readonly staminaCost: 14;
  readonly focusCost: 0;
  readonly targetActorId: string;
  readonly rangeMm: number;
  readonly damage: number;
  readonly hitChancePermille: number;
  readonly interrupts: boolean;
  readonly reactionTrigger: "hostile_targeted";
  readonly targetRelation: "hostile";
}

export interface CanonicalTurnHeavyAttackAction extends CanonicalTurnActionBase {
  readonly kind: "heavy_attack";
  readonly apCost: 2;
  readonly staminaCost: 28;
  readonly focusCost: 0;
  readonly targetActorId: string;
  readonly rangeMm: number;
  readonly damage: number;
  readonly hitChancePermille: number;
  readonly interrupts: boolean;
  readonly reactionTrigger: "hostile_targeted";
  readonly targetRelation: "hostile";
  readonly occupiesBothBeats: true;
}

export type CanonicalTurnAttackAction = CanonicalTurnLightAttackAction | CanonicalTurnHeavyAttackAction;

interface CanonicalHandledAction extends CanonicalTurnActionBase {
  readonly effectHandlerId: string;
  readonly targetActorId?: string;
  readonly destinationMm?: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians?: number;
  readonly rangeMm?: number;
  readonly damage?: number;
  readonly healing?: number;
  readonly hitChancePermille: number;
  readonly interrupts: boolean;
  readonly occupiesBothBeats?: boolean;
}

export interface CanonicalTurnTechniqueAction extends CanonicalHandledAction {
  readonly kind: "technique";
  readonly apCost: 1 | 2;
}

export interface CanonicalTurnItemAction extends CanonicalHandledAction {
  readonly kind: "item";
  readonly apCost: 1;
  readonly itemId: string;
}

export interface CanonicalTurnRecoverAction extends CanonicalTurnActionBase {
  readonly kind: "recover";
  readonly apCost: 1;
  readonly staminaCost: 0;
  readonly focusCost: 0;
  readonly reactionTrigger: "none";
  readonly targetRelation: "self";
}

export interface CanonicalTurnHoldAction extends CanonicalTurnActionBase {
  readonly kind: "hold";
  readonly apCost: 0;
  readonly staminaCost: 0;
  readonly focusCost: 0;
  readonly reactionTrigger: "none";
  readonly targetRelation: "self";
}

export type CanonicalTurnAction = CanonicalTurnMoveAction | CanonicalTurnAttackAction | CanonicalTurnTechniqueAction | CanonicalTurnItemAction | CanonicalTurnRecoverAction | CanonicalTurnHoldAction;
/** Kernel-only compatibility names; wire plans use TurnActionSelectionV1. */
export type TurnAction = CanonicalTurnAction;
export type TurnAttackAction = CanonicalTurnAttackAction;

export interface CanonicalDodgeReactionReservation {
  readonly reactionId: string;
  readonly definitionId: string;
  readonly kind: "dodge";
  readonly staminaReserved: 24;
  readonly destinationMm: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians: number;
}

export interface CanonicalGuardReactionReservation {
  readonly reactionId: string;
  readonly definitionId: string;
  readonly kind: "guard";
  readonly staminaReserved: number;
  readonly mitigationPermille: number;
}

export type CanonicalReactionReservation = CanonicalDodgeReactionReservation | CanonicalGuardReactionReservation;
/** Kernel-only compatibility name; wire plans use TurnReactionSelectionV1. */
export type ReactionReservation = CanonicalReactionReservation;

export interface CanonicalTurnPlanV1 {
  readonly actions: readonly CanonicalTurnAction[];
  readonly reaction: CanonicalReactionReservation | null;
}

export interface TurnPlanCanonicalizerV1 {
  readonly resolveAction: (selection: TurnActionSelectionV1) => CanonicalTurnAction | null;
  readonly resolveReaction: (selection: TurnReactionSelectionV1) => CanonicalReactionReservation | null;
}

const CANONICAL_COMMON_FIELDS = [
  "actionId", "definitionId", "kind", "beat", "band", "apCost", "staminaCost", "focusCost", "posthumous", "reactionTrigger", "targetRelation",
] as const;
const CANONICAL_ACTION_FIELDS: Readonly<Record<CanonicalTurnActionKind, readonly string[]>> = {
  move: [...CANONICAL_COMMON_FIELDS, "destinationMm", "destinationYawTenThousandthRadians"],
  light_attack: [...CANONICAL_COMMON_FIELDS, "targetActorId", "rangeMm", "damage", "hitChancePermille", "interrupts"],
  heavy_attack: [...CANONICAL_COMMON_FIELDS, "targetActorId", "rangeMm", "damage", "hitChancePermille", "interrupts", "occupiesBothBeats"],
  technique: [...CANONICAL_COMMON_FIELDS, "effectHandlerId", "targetActorId", "destinationMm", "destinationYawTenThousandthRadians", "rangeMm", "damage", "healing", "hitChancePermille", "interrupts", "occupiesBothBeats"],
  item: [...CANONICAL_COMMON_FIELDS, "effectHandlerId", "itemId", "targetActorId", "destinationMm", "destinationYawTenThousandthRadians", "rangeMm", "damage", "healing", "hitChancePermille", "interrupts", "occupiesBothBeats"],
  recover: CANONICAL_COMMON_FIELDS,
  hold: CANONICAL_COMMON_FIELDS,
};

export function validateCanonicalTurnAction(value: unknown, label = "canonical action"): asserts value is CanonicalTurnAction {
  assertPlainRecord(value, label);
  if (!(["move", "light_attack", "heavy_attack", "technique", "item", "recover", "hold"] as readonly unknown[]).includes(value.kind)) throw new Error(`${label}.kind is invalid`);
  const kind = value.kind as CanonicalTurnActionKind;
  assertAllowedFields(value, CANONICAL_ACTION_FIELDS[kind], label);
  assertTurnId(value.actionId, `${label}.actionId`); assertTurnId(value.definitionId, `${label}.definitionId`);
  if (value.beat !== 0 && value.beat !== 1) throw new Error(`${label}.beat is invalid`);
  if (!TURN_RESOLUTION_BANDS.includes(value.band as TurnResolutionBand)) throw new Error(`${label}.band is invalid`);
  assertTurnInteger(value.apCost, `${label}.apCost`, 0, 2);
  assertTurnInteger(value.staminaCost, `${label}.staminaCost`, 0, TURN_MAX_RESOURCE);
  assertTurnInteger(value.focusCost, `${label}.focusCost`, 0, TURN_MAX_RESOURCE);
  if (typeof value.posthumous !== "boolean") throw new Error(`${label}.posthumous must be boolean`);
  if (value.reactionTrigger !== "none" && value.reactionTrigger !== "hostile_targeted") throw new Error(`${label}.reactionTrigger is invalid`);
  if (value.targetRelation !== "self" && value.targetRelation !== "hostile" && value.targetRelation !== "ally" && value.targetRelation !== "any") throw new Error(`${label}.targetRelation is invalid`);
  const action = value as unknown as CanonicalTurnAction;
  if (kind === "move") {
    if (action.apCost !== 1 || action.staminaCost !== 8 || action.focusCost !== 0 || action.reactionTrigger !== "none" || action.targetRelation !== "self") throw new Error(`${label} move mechanics are not canonical`);
    validateIntegerPositionMm(action.destinationMm, `${label}.destinationMm`);
    assertTurnInteger(action.destinationYawTenThousandthRadians, `${label}.destinationYawTenThousandthRadians`, -TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS, TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS);
    return;
  }
  if (kind === "light_attack" || kind === "heavy_attack") {
    const attack = action as CanonicalTurnAttackAction;
    const expectedAp = kind === "heavy_attack" ? 2 : 1; const expectedStamina = kind === "heavy_attack" ? 28 : 14;
    if (attack.apCost !== expectedAp || attack.staminaCost !== expectedStamina || attack.focusCost !== 0 || attack.targetRelation !== "hostile" || attack.reactionTrigger !== "hostile_targeted") throw new Error(`${label} attack mechanics are not canonical`);
    if (kind === "heavy_attack" && (attack as CanonicalTurnHeavyAttackAction).occupiesBothBeats !== true) throw new Error(`${label} heavy attack must occupy both beats`);
    assertTurnId(attack.targetActorId, `${label}.targetActorId`);
    assertTurnInteger(attack.rangeMm, `${label}.rangeMm`, 0, TURN_MAX_RANGE_MM);
    assertTurnInteger(attack.damage, `${label}.damage`, 1, TURN_MAX_DAMAGE);
    assertTurnInteger(attack.hitChancePermille, `${label}.hitChancePermille`, 0, 1_000);
    if (typeof attack.interrupts !== "boolean") throw new Error(`${label}.interrupts must be boolean`);
    return;
  }
  if (kind === "recover") {
    if (action.apCost !== 1 || action.staminaCost !== 0 || action.focusCost !== 0 || action.reactionTrigger !== "none" || action.targetRelation !== "self") throw new Error(`${label} recover mechanics are not canonical`);
    return;
  }
  if (kind === "hold") {
    if (action.apCost !== 0 || action.staminaCost !== 0 || action.focusCost !== 0 || action.reactionTrigger !== "none" || action.targetRelation !== "self") throw new Error(`${label} hold mechanics are not canonical`);
    return;
  }
  const handled = action as CanonicalTurnTechniqueAction | CanonicalTurnItemAction;
  assertTurnId(handled.effectHandlerId, `${label}.effectHandlerId`);
  if (handled.apCost !== 1 && handled.apCost !== 2) throw new Error(`${label}.apCost must be one or two`);
  if (kind === "item") {
    if (handled.apCost !== 1) throw new Error(`${label} item must cost exactly one AP`);
    assertTurnId((handled as CanonicalTurnItemAction).itemId, `${label}.itemId`);
  }
  if (handled.targetActorId !== undefined) assertTurnId(handled.targetActorId, `${label}.targetActorId`);
  if ((handled.destinationMm === undefined) !== (handled.destinationYawTenThousandthRadians === undefined)) throw new Error(`${label} destination and yaw must be supplied together`);
  if (handled.destinationMm) {
    validateIntegerPositionMm(handled.destinationMm, `${label}.destinationMm`);
    assertTurnInteger(handled.destinationYawTenThousandthRadians, `${label}.destinationYawTenThousandthRadians`, -TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS, TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS);
  }
  if (handled.rangeMm !== undefined) assertTurnInteger(handled.rangeMm, `${label}.rangeMm`, 0, TURN_MAX_RANGE_MM);
  if (handled.damage !== undefined) assertTurnInteger(handled.damage, `${label}.damage`, 1, TURN_MAX_DAMAGE);
  if (handled.healing !== undefined) assertTurnInteger(handled.healing, `${label}.healing`, 1, TURN_MAX_DAMAGE);
  assertTurnInteger(handled.hitChancePermille, `${label}.hitChancePermille`, 0, 1_000);
  if (typeof handled.interrupts !== "boolean") throw new Error(`${label}.interrupts must be boolean`);
  assertOptionalBoolean(handled.occupiesBothBeats, `${label}.occupiesBothBeats`);
  if (handled.targetActorId && handled.targetRelation !== "self" && handled.rangeMm === undefined) throw new Error(`${label} targeted effect requires authored rangeMm`);
  if (handled.reactionTrigger === "hostile_targeted" && (handled.targetRelation !== "hostile" || !handled.targetActorId)) throw new Error(`${label} hostile reaction trigger requires a hostile actor target`);
  if (handled.apCost === 2 && handled.occupiesBothBeats !== true) throw new Error(`${label} two-AP effect must occupy both beats`);
  if (handled.apCost === 1 && handled.occupiesBothBeats === true) throw new Error(`${label} one-AP effect cannot occupy both beats`);
}

export function validateCanonicalReactionReservation(value: unknown, label = "canonical reaction"): asserts value is CanonicalReactionReservation {
  assertPlainRecord(value, label);
  if (value.kind !== "dodge" && value.kind !== "guard") throw new Error(`${label}.kind is invalid`);
  assertAllowedFields(value, value.kind === "dodge"
    ? ["reactionId", "definitionId", "kind", "staminaReserved", "destinationMm", "destinationYawTenThousandthRadians"]
    : ["reactionId", "definitionId", "kind", "staminaReserved", "mitigationPermille"], label);
  assertTurnId(value.reactionId, `${label}.reactionId`); assertTurnId(value.definitionId, `${label}.definitionId`);
  if (value.kind === "dodge") {
    if (value.staminaReserved !== 24) throw new Error(`${label} dodge must reserve exactly 24 stamina`);
    validateIntegerPositionMm(value.destinationMm, `${label}.destinationMm`);
    assertTurnInteger(value.destinationYawTenThousandthRadians, `${label}.destinationYawTenThousandthRadians`, -TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS, TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS);
  } else {
    assertTurnInteger(value.staminaReserved, `${label}.staminaReserved`, 8, TURN_MAX_RESOURCE);
    assertTurnInteger(value.mitigationPermille, `${label}.mitigationPermille`, 0, 500);
  }
}

export function validateCanonicalTurnPlan(actions: unknown, reaction: unknown, label = "canonical plan"): asserts actions is readonly CanonicalTurnAction[] {
  assertDenseTurnArray(actions, `${label}.actions`, 2);
  const beats = new Set<TurnBeat>(); const ids = new Set<string>(); let ap = 0; let recoverCount = 0;
  for (const value of actions) {
    validateCanonicalTurnAction(value, `${label}.action`); const action = value as CanonicalTurnAction;
    if (ids.has(action.actionId)) throw new Error(`${label} action IDs must be unique`);
    if (beats.has(action.beat)) throw new Error(`${label} has multiple actions in beat ${action.beat}`);
    ids.add(action.actionId); beats.add(action.beat); ap += action.apCost;
    if (action.kind === "recover") recoverCount += 1;
    if (action.apCost === 2 && (action.beat !== 0 || actions.length !== 1 || !("occupiesBothBeats" in action) || action.occupiesBothBeats !== true)) throw new Error(`${label} two-AP action must exclusively occupy both beats from beat zero`);
  }
  if (ap > 2) throw new Error(`${label} exceeds two AP`);
  if (recoverCount > 1) throw new Error(`${label} may recover only once`);
  if (reaction !== null) validateCanonicalReactionReservation(reaction, `${label}.reaction`);
}

function validateActionSelection(value: unknown, label: string): asserts value is TurnActionSelectionV1 {
  assertPlainRecord(value, label);
  assertAllowedFields(value, ["selectionId", "actionDefinitionId", "beat", "targetActorId", "destinationMm", "destinationYawTenThousandthRadians"], label);
  assertTurnId(value.selectionId, `${label}.selectionId`); assertTurnId(value.actionDefinitionId, `${label}.actionDefinitionId`);
  if (value.beat !== 0 && value.beat !== 1) throw new Error(`${label}.beat is invalid`);
  if (value.targetActorId !== undefined) assertTurnId(value.targetActorId, `${label}.targetActorId`);
  if ((value.destinationMm === undefined) !== (value.destinationYawTenThousandthRadians === undefined)) throw new Error(`${label} destination and yaw must be supplied together`);
  if (value.destinationMm !== undefined) {
    validateIntegerPositionMm(value.destinationMm, `${label}.destinationMm`);
    assertTurnInteger(value.destinationYawTenThousandthRadians, `${label}.destinationYawTenThousandthRadians`, -TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS, TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS);
  }
}

function validateReactionSelection(value: unknown, label: string): asserts value is TurnReactionSelectionV1 {
  assertPlainRecord(value, label);
  assertAllowedFields(value, ["selectionId", "reactionDefinitionId", "destinationMm", "destinationYawTenThousandthRadians"], label);
  assertTurnId(value.selectionId, `${label}.selectionId`); assertTurnId(value.reactionDefinitionId, `${label}.reactionDefinitionId`);
  if ((value.destinationMm === undefined) !== (value.destinationYawTenThousandthRadians === undefined)) throw new Error(`${label} destination and yaw must be supplied together`);
  if (value.destinationMm !== undefined) {
    validateIntegerPositionMm(value.destinationMm, `${label}.destinationMm`);
    assertTurnInteger(value.destinationYawTenThousandthRadians, `${label}.destinationYawTenThousandthRadians`, -TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS, TURN_MAX_YAW_TEN_THOUSANDTH_RADIANS);
  }
}

export function validateTurnPlanRequest(value: unknown): asserts value is TurnPlanRequest {
  assertPlainRecord(value, "TurnPlanRequest");
  assertAllowedFields(value, ["protocolVersion", "encounterId", "characterId", "commandId", "round", "revision", "actions", "reaction", "ready"], "TurnPlanRequest");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`TurnPlanRequest.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  assertTurnId(value.encounterId, "TurnPlanRequest.encounterId"); assertTurnId(value.characterId, "TurnPlanRequest.characterId"); assertTurnId(value.commandId, "TurnPlanRequest.commandId");
  assertTurnInteger(value.round, "TurnPlanRequest.round", 0, TURN_MAX_ROUND); assertTurnInteger(value.revision, "TurnPlanRequest.revision", 0, TURN_MAX_ROUND);
  if (value.ready !== true) throw new Error("TurnPlanRequest.ready must be true");
  assertDenseTurnArray(value.actions, "TurnPlanRequest.actions", 2);
  const selectionIds = new Set<string>(); const beats = new Set<TurnBeat>();
  value.actions.forEach((selection, index) => {
    validateActionSelection(selection, `TurnPlanRequest.actions[${index}]`);
    if (selectionIds.has(selection.selectionId)) throw new Error("TurnPlanRequest selection IDs must be unique");
    if (beats.has(selection.beat)) throw new Error("TurnPlanRequest may select at most one action per beat");
    selectionIds.add(selection.selectionId); beats.add(selection.beat);
  });
  if (value.reaction !== null) {
    validateReactionSelection(value.reaction, "TurnPlanRequest.reaction");
    if (selectionIds.has(value.reaction.selectionId)) throw new Error("TurnPlanRequest reaction selection ID must be unique");
  }
}

export function validateTurnPlanAck(value: unknown): asserts value is TurnPlanAck {
  assertPlainRecord(value, "TurnPlanAck");
  assertAllowedFields(value, ["protocolVersion", "encounterId", "characterId", "commandId", "round", "revision", "accepted", "rejection", "planHash"], "TurnPlanAck");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error(`TurnPlanAck.protocolVersion must be ${NETWORK_PROTOCOL_VERSION}`);
  for (const key of ["encounterId", "characterId", "commandId"] as const) assertTurnId(value[key], `TurnPlanAck.${key}`);
  assertTurnInteger(value.round, "TurnPlanAck.round", 0, TURN_MAX_ROUND); assertTurnInteger(value.revision, "TurnPlanAck.revision", 0, TURN_MAX_ROUND);
  if (typeof value.accepted !== "boolean") throw new Error("TurnPlanAck.accepted must be boolean");
  const rejections: readonly TurnPlanRejection[] = ["protocol_upgrade_required", "character_mismatch", "rate_limited", "stale_round", "stale_revision", "invalid_plan", "already_ready", "not_participant", "idempotency_conflict"];
  if (value.accepted) {
    if (value.rejection !== undefined) throw new Error("accepted TurnPlanAck cannot include rejection");
    if (typeof value.planHash !== "string" || !/^[0-9a-f]{64}$/.test(value.planHash)) throw new Error("accepted TurnPlanAck requires a SHA-256 planHash");
  } else {
    if (!rejections.includes(value.rejection as TurnPlanRejection)) throw new Error("rejected TurnPlanAck requires a valid rejection");
    if (value.planHash !== undefined) throw new Error("rejected TurnPlanAck cannot include planHash");
  }
}

export function canonicalizeTurnPlanRequest(value: unknown, canonicalizer: TurnPlanCanonicalizerV1): CanonicalTurnPlanV1 {
  validateTurnPlanRequest(value);
  if (!canonicalizer || typeof canonicalizer.resolveAction !== "function" || typeof canonicalizer.resolveReaction !== "function") throw new Error("server-owned turn canonicalizer is required");
  const actions = value.actions.map((selection) => {
    const selectionCopy: TurnActionSelectionV1 = selection.destinationMm ? { ...selection, destinationMm: { ...selection.destinationMm } } : { ...selection };
    const canonical = canonicalizer.resolveAction(selectionCopy);
    if (!canonical) throw new Error(`unknown action definition ${selection.actionDefinitionId}`);
    validateCanonicalTurnAction(canonical, `canonical action ${selection.actionDefinitionId}`);
    const target = "targetActorId" in canonical ? canonical.targetActorId : undefined;
    const destination = "destinationMm" in canonical ? canonical.destinationMm : undefined;
    const yaw = "destinationYawTenThousandthRadians" in canonical ? canonical.destinationYawTenThousandthRadians : undefined;
    if (canonical.actionId !== selection.selectionId || canonical.definitionId !== selection.actionDefinitionId || canonical.beat !== selection.beat
      || target !== selection.targetActorId || !positionEquals(destination, selection.destinationMm) || yaw !== selection.destinationYawTenThousandthRadians) {
      throw new Error(`canonical action ${selection.actionDefinitionId} changed an untrusted selection`);
    }
    return canonical;
  });
  let reaction: CanonicalReactionReservation | null = null;
  if (value.reaction) {
    const reactionSelection: TurnReactionSelectionV1 = value.reaction.destinationMm ? { ...value.reaction, destinationMm: { ...value.reaction.destinationMm } } : { ...value.reaction };
    reaction = canonicalizer.resolveReaction(reactionSelection);
    if (!reaction) throw new Error(`unknown reaction definition ${value.reaction.reactionDefinitionId}`);
    validateCanonicalReactionReservation(reaction, `canonical reaction ${value.reaction.reactionDefinitionId}`);
    const destination = reaction.kind === "dodge" ? reaction.destinationMm : undefined;
    const yaw = reaction.kind === "dodge" ? reaction.destinationYawTenThousandthRadians : undefined;
    if (reaction.reactionId !== value.reaction.selectionId || reaction.definitionId !== value.reaction.reactionDefinitionId
      || !positionEquals(destination, value.reaction.destinationMm) || yaw !== value.reaction.destinationYawTenThousandthRadians) {
      throw new Error(`canonical reaction ${value.reaction.reactionDefinitionId} changed an untrusted selection`);
    }
  }
  validateCanonicalTurnPlan(actions, reaction);
  return { actions: [...actions], reaction: reaction ? { ...reaction } : null };
}

export interface SkillWorldEffectV2 {
  readonly presentationSeconds: number;
  readonly resourceCost: Readonly<Record<string, number>>;
}

export interface SkillEncounterEffectV2 {
  readonly apCost: 0 | 1 | 2;
  readonly staminaCost: number;
  readonly focusCost: number;
  readonly band: TurnResolutionBand;
  readonly targetRule: string;
  readonly priority: number;
  readonly posthumous: boolean;
  readonly reactionTrigger: TurnReactionTrigger;
  readonly targetRelation: TurnTargetRelation;
  readonly effectHandlerId: string;
}

type SkillEffectBaseV2 = { readonly version: 2; readonly id: string; readonly handlerId: string };
export type SkillEffectV2 =
  | SkillEffectBaseV2 & { readonly scope: "world"; readonly world: SkillWorldEffectV2; readonly encounter?: never }
  | SkillEffectBaseV2 & { readonly scope: "encounter"; readonly world?: never; readonly encounter: SkillEncounterEffectV2 }
  | SkillEffectBaseV2 & { readonly scope: "both"; readonly world: SkillWorldEffectV2; readonly encounter: SkillEncounterEffectV2 };

function validateResourceRecord(value: unknown, label: string): void {
  assertPlainRecord(value, label);
  if (Object.keys(value).length > 64) throw new Error(`${label} has too many resources`);
  for (const [key, amount] of Object.entries(value)) { assertTurnId(key, `${label} key`); assertTurnInteger(amount, `${label}.${key}`, 0, TURN_MAX_RESOURCE); }
}

function validateWorldSkill(value: unknown, label: string): void {
  assertPlainRecord(value, label); assertAllowedFields(value, ["presentationSeconds", "resourceCost"], label);
  assertFiniteNumber(value.presentationSeconds, `${label}.presentationSeconds`, 0, 3_600); validateResourceRecord(value.resourceCost, `${label}.resourceCost`);
}

function validateEncounterSkill(value: unknown, label: string): void {
  assertPlainRecord(value, label);
  assertAllowedFields(value, ["apCost", "staminaCost", "focusCost", "band", "targetRule", "priority", "posthumous", "reactionTrigger", "targetRelation", "effectHandlerId"], label);
  assertTurnInteger(value.apCost, `${label}.apCost`, 0, 2); assertTurnInteger(value.staminaCost, `${label}.staminaCost`, 0, TURN_MAX_RESOURCE); assertTurnInteger(value.focusCost, `${label}.focusCost`, 0, TURN_MAX_RESOURCE);
  if (!TURN_RESOLUTION_BANDS.includes(value.band as TurnResolutionBand)) throw new Error(`${label}.band is invalid`);
  assertTurnId(value.targetRule, `${label}.targetRule`); assertTurnInteger(value.priority, `${label}.priority`, -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE);
  if (typeof value.posthumous !== "boolean") throw new Error(`${label}.posthumous must be boolean`);
  if (value.reactionTrigger !== "none" && value.reactionTrigger !== "hostile_targeted") throw new Error(`${label}.reactionTrigger is invalid`);
  if (value.targetRelation !== "self" && value.targetRelation !== "hostile" && value.targetRelation !== "ally" && value.targetRelation !== "any") throw new Error(`${label}.targetRelation is invalid`);
  assertTurnId(value.effectHandlerId, `${label}.effectHandlerId`);
}

export function validateSkillEffectV2(value: unknown): asserts value is SkillEffectV2 {
  assertPlainRecord(value, "SkillEffectV2");
  if (value.scope !== "world" && value.scope !== "encounter" && value.scope !== "both") throw new Error("SkillEffectV2.scope is invalid");
  assertAllowedFields(value, value.scope === "both" ? ["version", "id", "handlerId", "scope", "world", "encounter"]
    : value.scope === "world" ? ["version", "id", "handlerId", "scope", "world"] : ["version", "id", "handlerId", "scope", "encounter"], "SkillEffectV2");
  if (value.version !== 2) throw new Error("SkillEffectV2.version must be 2");
  assertTurnId(value.id, "SkillEffectV2.id"); assertTurnId(value.handlerId, "SkillEffectV2.handlerId");
  if (value.scope === "world" || value.scope === "both") validateWorldSkill(value.world, "SkillEffectV2.world");
  if (value.scope === "encounter" || value.scope === "both") validateEncounterSkill(value.encounter, "SkillEffectV2.encounter");
}

export interface CreatureMechanicContractV4 {
  readonly version: 4;
  readonly handlerId: string;
  readonly moveId: string;
  readonly presentationV3: { readonly startupSeconds: number; readonly activeSeconds: number; readonly recoverySeconds: number; readonly telegraphSeconds: number };
  readonly turn: {
    readonly band: TurnResolutionBand;
    readonly apCost: 0 | 1 | 2;
    readonly staminaCost: number;
    readonly focusCost: number;
    readonly targetRule: string;
    readonly targetRelation: TurnTargetRelation;
    readonly reactionTrigger: TurnReactionTrigger;
    readonly effectHandlerId: string;
    readonly rangeMm: number;
    readonly hitChancePermille: number;
    readonly priority: number;
    /** Whether this authored action interrupts later-band actions it damages. */
    readonly actionInterrupts: boolean;
    readonly damageBand: readonly [minimum: number, maximum: number];
    readonly statusIcons: readonly string[];
    readonly sensoryCue: string;
    readonly interruptRule: string;
    readonly counterplay: string;
    readonly posthumous: boolean;
  };
  readonly implementationStatus: "specified" | "implemented" | "playtested";
}

export function validateCreatureMechanicContractV4(value: unknown): asserts value is CreatureMechanicContractV4 {
  assertPlainRecord(value, "CreatureMechanicContractV4");
  assertAllowedFields(value, ["version", "handlerId", "moveId", "presentationV3", "turn", "implementationStatus"], "CreatureMechanicContractV4");
  if (value.version !== 4) throw new Error("CreatureMechanicContractV4.version must be 4");
  assertTurnId(value.handlerId, "CreatureMechanicContractV4.handlerId"); assertTurnId(value.moveId, "CreatureMechanicContractV4.moveId");
  assertPlainRecord(value.presentationV3, "CreatureMechanicContractV4.presentationV3");
  assertAllowedFields(value.presentationV3, ["startupSeconds", "activeSeconds", "recoverySeconds", "telegraphSeconds"], "CreatureMechanicContractV4.presentationV3");
  for (const field of ["startupSeconds", "activeSeconds", "recoverySeconds", "telegraphSeconds"] as const) assertFiniteNumber(value.presentationV3[field], `CreatureMechanicContractV4.presentationV3.${field}`, 0, 3_600);
  assertPlainRecord(value.turn, "CreatureMechanicContractV4.turn");
  assertAllowedFields(value.turn, ["band", "apCost", "staminaCost", "focusCost", "targetRule", "targetRelation", "reactionTrigger", "effectHandlerId", "rangeMm", "hitChancePermille", "priority", "actionInterrupts", "damageBand", "statusIcons", "sensoryCue", "interruptRule", "counterplay", "posthumous"], "CreatureMechanicContractV4.turn");
  if (!TURN_RESOLUTION_BANDS.includes(value.turn.band as TurnResolutionBand)) throw new Error("CreatureMechanicContractV4.turn.band is invalid");
  assertTurnInteger(value.turn.apCost, "CreatureMechanicContractV4.turn.apCost", 0, 2); assertTurnInteger(value.turn.staminaCost, "CreatureMechanicContractV4.turn.staminaCost", 0, TURN_MAX_RESOURCE); assertTurnInteger(value.turn.focusCost, "CreatureMechanicContractV4.turn.focusCost", 0, TURN_MAX_RESOURCE);
  assertTurnId(value.turn.targetRule, "CreatureMechanicContractV4.turn.targetRule"); assertTurnId(value.turn.effectHandlerId, "CreatureMechanicContractV4.turn.effectHandlerId");
  if (typeof value.turn.actionInterrupts !== "boolean") throw new Error("CreatureMechanicContractV4.turn.actionInterrupts must be boolean");
  if (value.turn.targetRelation !== "self" && value.turn.targetRelation !== "hostile" && value.turn.targetRelation !== "ally" && value.turn.targetRelation !== "any") throw new Error("CreatureMechanicContractV4.turn.targetRelation is invalid");
  if (value.turn.reactionTrigger !== "none" && value.turn.reactionTrigger !== "hostile_targeted") throw new Error("CreatureMechanicContractV4.turn.reactionTrigger is invalid");
  assertTurnInteger(value.turn.rangeMm, "CreatureMechanicContractV4.turn.rangeMm", 0, TURN_MAX_RANGE_MM); assertTurnInteger(value.turn.hitChancePermille, "CreatureMechanicContractV4.turn.hitChancePermille", 0, 1_000); assertTurnInteger(value.turn.priority, "CreatureMechanicContractV4.turn.priority", -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE);
  assertDenseTurnArray(value.turn.damageBand, "CreatureMechanicContractV4.turn.damageBand", 2);
  if (value.turn.damageBand.length !== 2) throw new Error("CreatureMechanicContractV4.turn.damageBand requires two values");
  assertTurnInteger(value.turn.damageBand[0], "CreatureMechanicContractV4.turn.damageBand.minimum", 0, TURN_MAX_DAMAGE); assertTurnInteger(value.turn.damageBand[1], "CreatureMechanicContractV4.turn.damageBand.maximum", 0, TURN_MAX_DAMAGE);
  if (Number(value.turn.damageBand[0]) > Number(value.turn.damageBand[1])) throw new Error("CreatureMechanicContractV4.turn.damageBand is reversed");
  assertStringArray(value.turn.statusIcons, "CreatureMechanicContractV4.turn.statusIcons");
  for (const field of ["sensoryCue", "interruptRule", "counterplay"] as const) assertTurnId(value.turn[field], `CreatureMechanicContractV4.turn.${field}`);
  if (typeof value.turn.posthumous !== "boolean") throw new Error("CreatureMechanicContractV4.turn.posthumous must be boolean");
  if (value.implementationStatus !== "specified" && value.implementationStatus !== "implemented" && value.implementationStatus !== "playtested") throw new Error("CreatureMechanicContractV4.implementationStatus is invalid");
}

export interface TurnParticipantPublicState {
  readonly actorId: string;
  readonly characterId: string | null;
  readonly team: TurnTeam;
  readonly joinOrder: number;
  readonly initiative: number;
  readonly connected: boolean;
  readonly reconnectDeadlineTick: number | null;
  readonly ready: boolean;
  readonly withdrawn: boolean;
  readonly positionMm: IntegerPositionMm;
  readonly health: number;
  readonly maxHealth: number;
}

export interface EncounterParticipantState extends TurnParticipantPublicState {
  readonly stamina: number;
  readonly maxStamina: number;
  readonly focus: number;
  readonly maxFocus: number;
  /** Local-only consumable charges keyed by canonical item ID. */
  readonly itemCharges: Readonly<Record<string, number>>;
  /** Local-only canonical loadout IDs; clients submit only stable aliases. */
  readonly activeTechniqueId: string | null;
  readonly quickItemId: string | null;
  readonly plan: readonly CanonicalTurnAction[] | null;
  readonly reaction: CanonicalReactionReservation | null;
  readonly lastAcknowledgedCommandId: string | null;
  readonly eventCursor: number;
}

export type EnemyIntentTargetV1 =
  | { readonly kind: "actor"; readonly actorIds: readonly string[] }
  | { readonly kind: "area"; readonly centerMm: IntegerPositionMm; readonly radiusMm: number };

export interface EnemyIntentV1 {
  readonly version: 1;
  readonly actorId: string;
  readonly actionId: string;
  readonly target: EnemyIntentTargetV1;
  readonly band: TurnResolutionBand;
  readonly damageBand: readonly [minimum: number, maximum: number];
  readonly statusIcons: readonly string[];
  readonly sensoryCue: string;
  readonly interruptRule: string;
  readonly exactDamageKnown: boolean;
}

export function validateEnemyIntentV1(value: unknown): asserts value is EnemyIntentV1 {
  assertPlainRecord(value, "EnemyIntentV1");
  assertAllowedFields(value, ["version", "actorId", "actionId", "target", "band", "damageBand", "statusIcons", "sensoryCue", "interruptRule", "exactDamageKnown"], "EnemyIntentV1");
  if (value.version !== 1) throw new Error("EnemyIntentV1.version must be 1");
  assertTurnId(value.actorId, "EnemyIntentV1.actorId"); assertTurnId(value.actionId, "EnemyIntentV1.actionId");
  assertPlainRecord(value.target, "EnemyIntentV1.target");
  if (value.target.kind === "actor") {
    assertAllowedFields(value.target, ["kind", "actorIds"], "EnemyIntentV1.target"); assertStringArray(value.target.actorIds, "EnemyIntentV1.target.actorIds", TURN_MAX_ACTORS);
    if (value.target.actorIds.length === 0) throw new Error("EnemyIntentV1 actor target cannot be empty");
  } else if (value.target.kind === "area") {
    assertAllowedFields(value.target, ["kind", "centerMm", "radiusMm"], "EnemyIntentV1.target"); validateIntegerPositionMm(value.target.centerMm, "EnemyIntentV1.target.centerMm"); assertTurnInteger(value.target.radiusMm, "EnemyIntentV1.target.radiusMm", 1, TURN_MAX_RANGE_MM);
  } else throw new Error("EnemyIntentV1.target.kind is invalid");
  if (!TURN_RESOLUTION_BANDS.includes(value.band as TurnResolutionBand)) throw new Error("EnemyIntentV1.band is invalid");
  assertDenseTurnArray(value.damageBand, "EnemyIntentV1.damageBand", 2); if (value.damageBand.length !== 2) throw new Error("EnemyIntentV1.damageBand requires two values");
  assertTurnInteger(value.damageBand[0], "EnemyIntentV1.damageBand.minimum", 0, TURN_MAX_DAMAGE); assertTurnInteger(value.damageBand[1], "EnemyIntentV1.damageBand.maximum", 0, TURN_MAX_DAMAGE);
  if (Number(value.damageBand[0]) > Number(value.damageBand[1])) throw new Error("EnemyIntentV1.damageBand is reversed");
  assertStringArray(value.statusIcons, "EnemyIntentV1.statusIcons"); assertTurnId(value.sensoryCue, "EnemyIntentV1.sensoryCue"); assertTurnId(value.interruptRule, "EnemyIntentV1.interruptRule");
  if (typeof value.exactDamageKnown !== "boolean") throw new Error("EnemyIntentV1.exactDamageKnown must be boolean");
}

export type CombatEventTypeV1 =
  | "round_started" | "action_started" | "action_canceled" | "movement" | "movement_conflict"
  | "reaction_triggered" | "reaction_refunded" | "attack_hit" | "attack_missed" | "damage_applied"
  | "healing_applied" | "status_applied" | "buff_applied" | "effect_resolved"
  | "actor_interrupted" | "actor_defeated" | "resource_changed" | "reactive_inserted"
  | "reactive_cap_reached" | "round_completed" | "encounter_outcome";

export interface CombatEventV1 {
  readonly version: 1;
  readonly sequence: number;
  readonly encounterId: string;
  readonly round: number;
  readonly beat: TurnBeat | null;
  readonly band: TurnResolutionBand | null;
  readonly type: CombatEventTypeV1;
  readonly actorId: string | null;
  readonly targetActorId: string | null;
  readonly rootActionId: string | null;
  readonly data: Readonly<Record<string, string | number | boolean | null>>;
}

const COMBAT_EVENT_TYPES_V1: readonly CombatEventTypeV1[] = [
  "round_started", "action_started", "action_canceled", "movement", "movement_conflict",
  "reaction_triggered", "reaction_refunded", "attack_hit", "attack_missed", "damage_applied",
  "healing_applied", "status_applied", "buff_applied", "effect_resolved", "actor_interrupted",
  "actor_defeated", "resource_changed", "reactive_inserted", "reactive_cap_reached",
  "round_completed", "encounter_outcome",
];

export function validateCombatEventV1(value: unknown): asserts value is CombatEventV1 {
  assertPlainRecord(value, "CombatEventV1");
  assertAllowedFields(value, ["version", "sequence", "encounterId", "round", "beat", "band", "type", "actorId", "targetActorId", "rootActionId", "data"], "CombatEventV1");
  if (value.version !== 1) throw new Error("CombatEventV1.version must be 1");
  assertTurnInteger(value.sequence, "CombatEventV1.sequence", 1, TURN_MAX_EVENT_SEQUENCE);
  assertTurnId(value.encounterId, "CombatEventV1.encounterId");
  assertTurnInteger(value.round, "CombatEventV1.round", 0, TURN_MAX_ROUND);
  if (value.beat !== null && value.beat !== 0 && value.beat !== 1) throw new Error("CombatEventV1.beat is invalid");
  if (value.band !== null && !TURN_RESOLUTION_BANDS.includes(value.band as TurnResolutionBand)) throw new Error("CombatEventV1.band is invalid");
  if (!COMBAT_EVENT_TYPES_V1.includes(value.type as CombatEventTypeV1)) throw new Error("CombatEventV1.type is invalid");
  for (const field of ["actorId", "targetActorId", "rootActionId"] as const) if (value[field] !== null) assertTurnId(value[field], `CombatEventV1.${field}`);
  assertPlainRecord(value.data, "CombatEventV1.data");
  if (Object.keys(value.data).length > 64) throw new Error("CombatEventV1.data has too many fields");
  for (const [key, entry] of Object.entries(value.data)) {
    assertTurnId(key, "CombatEventV1.data key");
    if (entry === null || typeof entry === "boolean") continue;
    if (typeof entry === "number" && Number.isFinite(entry)) continue;
    if (typeof entry === "string" && entry.length <= 512 && !/[\u0000-\u001f\u007f]/.test(entry)) continue;
    throw new Error(`CombatEventV1.data.${key} is not a bounded scalar`);
  }
}

export function validateCombatEventBatchV1(value: unknown): asserts value is readonly CombatEventV1[] {
  assertDenseTurnArray(value, "CombatEventV1 batch", 1_024);
  let encounterId: string | null = null;
  let previousSequence = 0;
  for (const event of value) {
    validateCombatEventV1(event);
    encounterId ??= event.encounterId;
    if (event.encounterId !== encounterId) throw new Error("CombatEventV1 batch cannot mix encounters");
    if (event.sequence <= previousSequence) throw new Error("CombatEventV1 batch sequences must strictly increase");
    previousSequence = event.sequence;
  }
}

export type CombatEventAudienceV1 = Readonly<
  | { readonly mode: "participant"; readonly viewerActorId: string }
  | { readonly mode: "spectator"; readonly viewerActorId: null }
>;

export interface TurnEncounterProjectionClearV1 {
  readonly protocolVersion: 2;
  readonly encounterId: string;
  readonly reason: "out_of_range" | "retention_expired" | "superseded";
}

export function validateTurnEncounterProjectionClearV1(value: unknown): asserts value is TurnEncounterProjectionClearV1 {
  assertPlainRecord(value, "TurnEncounterProjectionClearV1");
  assertAllowedFields(value, ["protocolVersion", "encounterId", "reason"], "TurnEncounterProjectionClearV1");
  if (value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error("TurnEncounterProjectionClearV1.protocolVersion is unsupported");
  assertTurnId(value.encounterId, "TurnEncounterProjectionClearV1.encounterId");
  if (value.reason !== "out_of_range" && value.reason !== "retention_expired" && value.reason !== "superseded") throw new Error("TurnEncounterProjectionClearV1.reason is invalid");
}

const SPECTATOR_PRIVATE_EVENT_DATA_KEYS = new Set(["before", "after", "stamina", "staminaCost", "focusCost", "itemId", "clientActionId"]);

/**
 * Projects the canonical event stream for a viewer without changing sequence
 * identity. Resource ledger events are private; public animation/result events
 * retain only non-resource scalars.
 */
export function projectCombatEventBatchForAudienceV1(
  events: readonly CombatEventV1[],
  audience: CombatEventAudienceV1,
): readonly CombatEventV1[] {
  validateCombatEventBatchV1(events);
  validateCombatEventAudienceV1(audience);
  const projected = events.filter((event) => event.type !== "resource_changed" || (
    audience.mode === "participant" && event.actorId === audience.viewerActorId
  )).map((event): CombatEventV1 => {
    if (audience.mode === "participant" && event.actorId === audience.viewerActorId) return structuredClone(event);
    return {
      ...structuredClone(event),
      data: Object.fromEntries(Object.entries(event.data).filter(([key]) => !SPECTATOR_PRIVATE_EVENT_DATA_KEYS.has(key))),
    };
  });
  validateCombatEventBatchForAudienceV1(projected, audience);
  return projected;
}

export function validateCombatEventBatchForAudienceV1(value: unknown, audience: CombatEventAudienceV1): asserts value is readonly CombatEventV1[] {
  validateCombatEventAudienceV1(audience);
  validateCombatEventBatchV1(value);
  for (const event of value) {
    const ownParticipantEvent = audience.mode === "participant" && event.actorId === audience.viewerActorId;
    if (event.type === "resource_changed" && !ownParticipantEvent) throw new Error("combat events cannot expose another actor's resource changes");
    if (ownParticipantEvent) continue;
    for (const key of Object.keys(event.data)) if (SPECTATOR_PRIVATE_EVENT_DATA_KEYS.has(key)) throw new Error(`combat event exposes another actor's private ${key}`);
  }
}

function validateCombatEventAudienceV1(value: unknown): asserts value is CombatEventAudienceV1 {
  assertPlainRecord(value, "CombatEventAudienceV1");
  assertAllowedFields(value, ["mode", "viewerActorId"], "CombatEventAudienceV1");
  if (value.mode === "participant") assertTurnId(value.viewerActorId, "CombatEventAudienceV1.viewerActorId");
  else if (value.mode === "spectator") {
    if (value.viewerActorId !== null) throw new Error("spectator combat event audience cannot identify a participant actor");
  } else throw new Error("CombatEventAudienceV1.mode is invalid");
}

export interface EncounterPublicState {
  readonly encounterId: string;
  readonly phase: TurnEncounterPhase;
  readonly round: number;
  readonly revision: number;
  readonly leaderActorId: string | null;
  readonly leadershipRule: "join_order_then_character_id";
  readonly participantLimit: 4;
  readonly participants: readonly TurnParticipantPublicState[];
  readonly spectatorActorIds: readonly string[];
  readonly enemyIntents: readonly EnemyIntentV1[];
  readonly latestEventSequence: number;
}

export interface EncounterViewerState {
  readonly mode: EncounterViewerMode;
  readonly actorId: string;
  readonly characterId: string | null;
  readonly canPlan: boolean;
  readonly canWithdraw: boolean;
  readonly reconnectDeadlineTick: number | null;
}

export interface EncounterClientStateV1 {
  readonly version: 1;
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly publicState: EncounterPublicState;
  readonly viewerState: EncounterViewerState;
  readonly participantState: EncounterParticipantState | null;
}

export interface OriginalEnemySnapshotRefV1 {
  readonly snapshotId: string;
  readonly sha256: string;
  readonly enemyActorIds: readonly string[];
}

export interface TurnEncounterV1 {
  readonly version: typeof TURN_ENCOUNTER_VERSION;
  readonly protocolVersion: typeof NETWORK_PROTOCOL_VERSION;
  readonly encounterId: string;
  readonly shardId: string;
  readonly leaseOwnerEncounterId: string;
  readonly leaseGeneration: number;
  readonly leasedEnemyIds: readonly string[];
  readonly originalEnemySnapshot: OriginalEnemySnapshotRefV1;
  readonly serverSeed: string;
  readonly phase: TurnEncounterPhase;
  readonly round: number;
  readonly revision: number;
  readonly createdAtTick: number;
  readonly planningLeaseExpiresAtTick: number;
  readonly disconnectedParticipantLeaseTicks: number;
  readonly publicState: EncounterPublicState;
  readonly participants: readonly EncounterParticipantState[];
}

function validatePublicParticipant(value: unknown, label: string, privateFields = false): asserts value is TurnParticipantPublicState | EncounterParticipantState {
  assertPlainRecord(value, label);
  const base = ["actorId", "characterId", "team", "joinOrder", "initiative", "connected", "reconnectDeadlineTick", "ready", "withdrawn", "positionMm", "health", "maxHealth"];
  assertAllowedFields(value, privateFields ? [...base, "stamina", "maxStamina", "focus", "maxFocus", "itemCharges", "activeTechniqueId", "quickItemId", "plan", "reaction", "lastAcknowledgedCommandId", "eventCursor"] : base, label);
  assertTurnId(value.actorId, `${label}.actorId`);
  if (value.team !== "players" && value.team !== "enemies") throw new Error(`${label}.team is invalid`);
  if (value.team === "players") assertTurnId(value.characterId, `${label}.characterId`); else if (value.characterId !== null) throw new Error(`${label} enemy characterId must be null`);
  assertTurnInteger(value.joinOrder, `${label}.joinOrder`, 0, TURN_MAX_ACTORS); assertTurnInteger(value.initiative, `${label}.initiative`, -TURN_MAX_RESOURCE, TURN_MAX_RESOURCE);
  if (typeof value.connected !== "boolean" || typeof value.ready !== "boolean" || typeof value.withdrawn !== "boolean") throw new Error(`${label} flags are invalid`);
  if (value.reconnectDeadlineTick !== null) assertTurnInteger(value.reconnectDeadlineTick, `${label}.reconnectDeadlineTick`, 0, Number.MAX_SAFE_INTEGER);
  if (!value.connected && value.reconnectDeadlineTick === null && !value.withdrawn) throw new Error(`${label} disconnected participant requires reconnect deadline`);
  validateIntegerPositionMm(value.positionMm, `${label}.positionMm`); assertTurnInteger(value.maxHealth, `${label}.maxHealth`, 1, TURN_MAX_RESOURCE); assertTurnInteger(value.health, `${label}.health`, 0, Number(value.maxHealth));
  if (!privateFields) return;
  assertTurnInteger(value.maxStamina, `${label}.maxStamina`, 1, TURN_MAX_RESOURCE); assertTurnInteger(value.stamina, `${label}.stamina`, 0, Number(value.maxStamina));
  assertTurnInteger(value.maxFocus, `${label}.maxFocus`, 1, TURN_MAX_RESOURCE); assertTurnInteger(value.focus, `${label}.focus`, 0, Number(value.maxFocus));
  validateResourceRecord(value.itemCharges, `${label}.itemCharges`);
  for (const field of ["activeTechniqueId", "quickItemId"] as const) if (value[field] !== null) assertTurnId(value[field], `${label}.${field}`);
  if (value.plan !== null) validateCanonicalTurnPlan(value.plan, value.reaction, `${label}.plan`); else if (value.reaction !== null) throw new Error(`${label} cannot reserve a reaction without a plan`);
  if (value.ready && value.plan === null) throw new Error(`${label} ready participant requires a plan`);
  if (value.withdrawn && value.ready) throw new Error(`${label} withdrawn participant cannot remain ready`);
  if (value.lastAcknowledgedCommandId !== null) assertTurnId(value.lastAcknowledgedCommandId, `${label}.lastAcknowledgedCommandId`);
  assertTurnInteger(value.eventCursor, `${label}.eventCursor`, 0, TURN_MAX_EVENT_SEQUENCE);
}

export function validateTurnParticipantPublicState(value: unknown): asserts value is TurnParticipantPublicState {
  validatePublicParticipant(value, "TurnParticipantPublicState");
}

export function validateEncounterParticipantState(value: unknown): asserts value is EncounterParticipantState {
  validatePublicParticipant(value, "EncounterParticipantState", true);
}

export function validateEncounterPublicState(value: unknown): asserts value is EncounterPublicState {
  assertPlainRecord(value, "EncounterPublicState");
  assertAllowedFields(value, ["encounterId", "phase", "round", "revision", "leaderActorId", "leadershipRule", "participantLimit", "participants", "spectatorActorIds", "enemyIntents", "latestEventSequence"], "EncounterPublicState");
  assertTurnId(value.encounterId, "EncounterPublicState.encounterId");
  if (!TURN_ENCOUNTER_PHASES.includes(value.phase as TurnEncounterPhase)) throw new Error("EncounterPublicState.phase is invalid");
  assertTurnInteger(value.round, "EncounterPublicState.round", 0, TURN_MAX_ROUND);
  assertTurnInteger(value.revision, "EncounterPublicState.revision", 0, TURN_MAX_ROUND);
  if (value.leaderActorId !== null) assertTurnId(value.leaderActorId, "EncounterPublicState.leaderActorId");
  if (value.leadershipRule !== "join_order_then_character_id" || value.participantLimit !== 4) throw new Error("EncounterPublicState leadership/limit contract is invalid");
  assertDenseTurnArray(value.participants, "EncounterPublicState.participants", TURN_MAX_ACTORS);
  const participantIds = new Set<string>(); const characterIds = new Set<string>(); const enemyIds = new Set<string>(); const publicParticipants: TurnParticipantPublicState[] = [];
  value.participants.forEach((participant, index) => {
    validatePublicParticipant(participant, `EncounterPublicState.participants[${index}]`);
    const publicParticipant = participant as TurnParticipantPublicState; const actorId = publicParticipant.actorId;
    if (participantIds.has(actorId)) throw new Error("EncounterPublicState participant IDs must be unique");
    participantIds.add(actorId);
    if (publicParticipant.characterId !== null) {
      if (characterIds.has(publicParticipant.characterId)) throw new Error("EncounterPublicState character IDs must be unique");
      characterIds.add(publicParticipant.characterId);
    }
    if (publicParticipant.team === "enemies") enemyIds.add(actorId);
    publicParticipants.push(publicParticipant);
  });
  const players = publicParticipants.filter((participant) => participant.team === "players");
  if (players.length < 1 || players.length > 4 || enemyIds.size < 1) throw new Error("EncounterPublicState requires one to four players and at least one enemy");
  const expectedLeader = players.filter((participant) => !participant.withdrawn)
    .sort((left, right) => left.joinOrder - right.joinOrder || codeUnitCompare(left.characterId!, right.characterId!) || codeUnitCompare(left.actorId, right.actorId))[0]?.actorId ?? null;
  if (value.leaderActorId !== expectedLeader) throw new Error("EncounterPublicState leader violates join-order transfer rules");
  assertStringArray(value.spectatorActorIds, "EncounterPublicState.spectatorActorIds", TURN_MAX_ACTORS);
  for (const spectatorId of value.spectatorActorIds) if (participantIds.has(spectatorId)) throw new Error("EncounterPublicState spectator cannot be a participant");
  assertDenseTurnArray(value.enemyIntents, "EncounterPublicState.enemyIntents", TURN_MAX_ACTORS * 2);
  value.enemyIntents.forEach((intent) => {
    validateEnemyIntentV1(intent);
    if (!enemyIds.has(intent.actorId)) throw new Error("EncounterPublicState intent actor must be a known enemy");
    if (intent.target.kind === "actor") for (const actorId of intent.target.actorIds) if (!participantIds.has(actorId)) throw new Error("EncounterPublicState intent targets an outsider");
  });
  assertTurnInteger(value.latestEventSequence, "EncounterPublicState.latestEventSequence", 0, TURN_MAX_EVENT_SEQUENCE);
}

export function validateEncounterViewerState(value: unknown): asserts value is EncounterViewerState {
  assertPlainRecord(value, "EncounterViewerState");
  assertAllowedFields(value, ["mode", "actorId", "characterId", "canPlan", "canWithdraw", "reconnectDeadlineTick"], "EncounterViewerState");
  if (value.mode !== "participant" && value.mode !== "spectator" && value.mode !== "reconnecting") throw new Error("EncounterViewerState.mode is invalid");
  assertTurnId(value.actorId, "EncounterViewerState.actorId");
  if (value.characterId !== null) assertTurnId(value.characterId, "EncounterViewerState.characterId");
  if (typeof value.canPlan !== "boolean" || typeof value.canWithdraw !== "boolean") throw new Error("EncounterViewerState permissions are invalid");
  if (value.reconnectDeadlineTick !== null) assertTurnInteger(value.reconnectDeadlineTick, "EncounterViewerState.reconnectDeadlineTick", 0, Number.MAX_SAFE_INTEGER);
  if (value.mode === "spectator" && (value.canPlan || value.canWithdraw || value.reconnectDeadlineTick !== null)) throw new Error("spectator viewer cannot plan, withdraw, or reconnect");
  if (value.mode === "reconnecting" && (value.canPlan || value.canWithdraw || value.reconnectDeadlineTick === null)) throw new Error("reconnecting viewer cannot act and requires a deadline");
  if (value.mode === "participant" && (value.characterId === null || value.reconnectDeadlineTick !== null)) throw new Error("connected participant viewer requires character identity and no reconnect deadline");
}

export function validateEncounterClientStateV1(value: unknown): asserts value is EncounterClientStateV1 {
  assertPlainRecord(value, "EncounterClientStateV1");
  assertAllowedFields(value, ["version", "protocolVersion", "publicState", "viewerState", "participantState"], "EncounterClientStateV1");
  if (value.version !== 1 || value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error("EncounterClientStateV1 versions are invalid");
  validateEncounterPublicState(value.publicState);
  validateEncounterViewerState(value.viewerState);
  const state = value as unknown as EncounterClientStateV1;
  if (state.participantState !== null) {
    validateEncounterParticipantState(state.participantState);
    if (state.participantState.actorId !== state.viewerState.actorId || state.participantState.characterId !== state.viewerState.characterId) throw new Error("EncounterClientStateV1 participant/viewer identity diverges");
    if (state.viewerState.mode === "spectator") throw new Error("EncounterClientStateV1 spectator cannot receive participant state");
    const publicParticipant = state.publicState.participants.find((participant) => participant.actorId === state.participantState!.actorId);
    if (!publicParticipant) throw new Error("EncounterClientStateV1 private participant is absent from public state");
    const mirroredFields = ["characterId", "team", "joinOrder", "initiative", "connected", "reconnectDeadlineTick", "ready", "withdrawn", "health", "maxHealth"] as const;
    if (mirroredFields.some((field) => publicParticipant[field] !== state.participantState![field]) || !positionEquals(publicParticipant.positionMm, state.participantState.positionMm)) throw new Error("EncounterClientStateV1 private/public participant diverges");
    const shouldReconnect = !state.participantState.connected;
    if ((state.viewerState.mode === "reconnecting") !== shouldReconnect) throw new Error("EncounterClientStateV1 viewer mode diverges from connection state");
    if (shouldReconnect && state.participantState.reconnectDeadlineTick === null) throw new Error("EncounterClientStateV1 reconnecting participant requires deadline");
    const expectedCanPlan = state.publicState.phase === "planning" && state.participantState.connected && !state.participantState.ready && !state.participantState.withdrawn;
    const expectedCanWithdraw = state.publicState.phase === "planning" && state.participantState.connected && !state.participantState.withdrawn;
    if (state.viewerState.canPlan !== expectedCanPlan || state.viewerState.canWithdraw !== expectedCanWithdraw) throw new Error("EncounterClientStateV1 viewer permissions exceed encounter state");
  } else if (state.viewerState.mode !== "spectator") throw new Error("EncounterClientStateV1 participant viewer requires private participant state");
}

export function validateTurnEncounterV1(value: unknown): asserts value is TurnEncounterV1 {
  assertPlainRecord(value, "TurnEncounterV1");
  assertAllowedFields(value, ["version", "protocolVersion", "encounterId", "shardId", "leaseOwnerEncounterId", "leaseGeneration", "leasedEnemyIds", "originalEnemySnapshot", "serverSeed", "phase", "round", "revision", "createdAtTick", "planningLeaseExpiresAtTick", "disconnectedParticipantLeaseTicks", "publicState", "participants"], "TurnEncounterV1");
  if (value.version !== TURN_ENCOUNTER_VERSION || value.protocolVersion !== NETWORK_PROTOCOL_VERSION) throw new Error("TurnEncounterV1 versions are invalid");
  assertTurnId(value.encounterId, "TurnEncounterV1.encounterId"); assertTurnId(value.shardId, "TurnEncounterV1.shardId"); assertTurnId(value.leaseOwnerEncounterId, "TurnEncounterV1.leaseOwnerEncounterId"); assertTurnId(value.serverSeed, "TurnEncounterV1.serverSeed");
  if (value.leaseOwnerEncounterId !== value.encounterId) throw new Error("TurnEncounterV1 lease owner must be the encounter");
  assertTurnInteger(value.leaseGeneration, "TurnEncounterV1.leaseGeneration", 1, TURN_MAX_ROUND); assertStringArray(value.leasedEnemyIds, "TurnEncounterV1.leasedEnemyIds", TURN_MAX_ACTORS);
  const leasedEnemyIds = value.leasedEnemyIds;
  if (leasedEnemyIds.length === 0 || [...leasedEnemyIds].sort(codeUnitCompare).some((id, index) => id !== leasedEnemyIds[index])) throw new Error("TurnEncounterV1.leasedEnemyIds must be nonempty and sorted");
  assertPlainRecord(value.originalEnemySnapshot, "TurnEncounterV1.originalEnemySnapshot"); assertAllowedFields(value.originalEnemySnapshot, ["snapshotId", "sha256", "enemyActorIds"], "TurnEncounterV1.originalEnemySnapshot");
  assertTurnId(value.originalEnemySnapshot.snapshotId, "TurnEncounterV1.originalEnemySnapshot.snapshotId");
  if (typeof value.originalEnemySnapshot.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(value.originalEnemySnapshot.sha256)) throw new Error("TurnEncounterV1 original snapshot requires SHA-256");
  assertStringArray(value.originalEnemySnapshot.enemyActorIds, "TurnEncounterV1.originalEnemySnapshot.enemyActorIds", TURN_MAX_ACTORS);
  if (value.originalEnemySnapshot.enemyActorIds.length !== leasedEnemyIds.length || value.originalEnemySnapshot.enemyActorIds.some((id, index) => id !== leasedEnemyIds[index])) throw new Error("TurnEncounterV1 original snapshot IDs must match leased IDs");
  if (!TURN_ENCOUNTER_PHASES.includes(value.phase as TurnEncounterPhase)) throw new Error("TurnEncounterV1.phase is invalid");
  assertTurnInteger(value.round, "TurnEncounterV1.round", 0, TURN_MAX_ROUND); assertTurnInteger(value.revision, "TurnEncounterV1.revision", 0, TURN_MAX_ROUND);
  assertTurnInteger(value.createdAtTick, "TurnEncounterV1.createdAtTick", 0, Number.MAX_SAFE_INTEGER); assertTurnInteger(value.planningLeaseExpiresAtTick, "TurnEncounterV1.planningLeaseExpiresAtTick", Number(value.createdAtTick), Number.MAX_SAFE_INTEGER); assertTurnInteger(value.disconnectedParticipantLeaseTicks, "TurnEncounterV1.disconnectedParticipantLeaseTicks", 1, TURN_MAX_ROUND);
  assertDenseTurnArray(value.participants, "TurnEncounterV1.participants", TURN_MAX_ACTORS);
  const privateById = new Map<string, EncounterParticipantState>(); const characterIds = new Set<string>(); const positions = new Set<string>(); let players = 0;
  value.participants.forEach((entry, index) => {
    validatePublicParticipant(entry, `TurnEncounterV1.participants[${index}]`, true); const participant = entry as EncounterParticipantState;
    if (privateById.has(participant.actorId)) throw new Error("TurnEncounterV1 participant actor IDs must be unique");
    const key = `${participant.positionMm.x}:${participant.positionMm.y}:${participant.positionMm.z}`; if (positions.has(key)) throw new Error("TurnEncounterV1 participant positions must be unique"); positions.add(key);
    if (participant.team === "players") { players += 1; if (characterIds.has(participant.characterId!)) throw new Error("TurnEncounterV1 character IDs must be unique"); characterIds.add(participant.characterId!); }
    privateById.set(participant.actorId, participant);
  });
  if (players === 0 || players > 4) throw new Error("TurnEncounterV1 requires one to four players");
  const enemyIds = [...privateById.values()].filter((participant) => participant.team === "enemies").map((participant) => participant.actorId).sort(codeUnitCompare);
  if (enemyIds.length !== leasedEnemyIds.length || enemyIds.some((id, index) => id !== leasedEnemyIds[index])) throw new Error("TurnEncounterV1 enemy participants must match leased IDs");
  assertPlainRecord(value.publicState, "TurnEncounterV1.publicState");
  assertAllowedFields(value.publicState, ["encounterId", "phase", "round", "revision", "leaderActorId", "leadershipRule", "participantLimit", "participants", "spectatorActorIds", "enemyIntents", "latestEventSequence"], "TurnEncounterV1.publicState");
  if (value.publicState.encounterId !== value.encounterId || value.publicState.phase !== value.phase || value.publicState.round !== value.round || value.publicState.revision !== value.revision) throw new Error("TurnEncounterV1 public state header diverges");
  if (value.publicState.leadershipRule !== "join_order_then_character_id" || value.publicState.participantLimit !== 4) throw new Error("TurnEncounterV1 leadership/limit contract is invalid");
  if (value.publicState.leaderActorId !== null) {
    assertTurnId(value.publicState.leaderActorId, "TurnEncounterV1.publicState.leaderActorId"); const leader = privateById.get(value.publicState.leaderActorId);
    if (!leader || leader.team !== "players" || leader.withdrawn) throw new Error("TurnEncounterV1 leader must be an active player");
  }
  assertDenseTurnArray(value.publicState.participants, "TurnEncounterV1.publicState.participants", TURN_MAX_ACTORS);
  if (value.publicState.participants.length !== value.participants.length) throw new Error("TurnEncounterV1 public/private participant counts diverge");
  const publicIds = new Set<string>();
  value.publicState.participants.forEach((entry, index) => {
    validatePublicParticipant(entry, `TurnEncounterV1.publicState.participants[${index}]`);
    const participant = entry as TurnParticipantPublicState; const privateParticipant = privateById.get(participant.actorId);
    if (!privateParticipant) throw new Error("TurnEncounterV1 public participant is unknown");
    if (publicIds.has(participant.actorId)) throw new Error("TurnEncounterV1 public participant IDs must be unique");
    publicIds.add(participant.actorId);
    const mirroredFields = ["characterId", "team", "joinOrder", "initiative", "connected", "reconnectDeadlineTick", "ready", "withdrawn", "health", "maxHealth"] as const;
    if (mirroredFields.some((field) => participant[field] !== privateParticipant[field]) || !positionEquals(participant.positionMm, privateParticipant.positionMm)) {
      throw new Error("TurnEncounterV1 public participant diverges from private state");
    }
  });
  const activePlayers = [...privateById.values()].filter((participant) => participant.team === "players" && !participant.withdrawn)
    .sort((left, right) => left.joinOrder - right.joinOrder || codeUnitCompare(left.characterId!, right.characterId!) || codeUnitCompare(left.actorId, right.actorId));
  const expectedLeaderActorId = activePlayers[0]?.actorId ?? null;
  if (value.publicState.leaderActorId !== expectedLeaderActorId) throw new Error("TurnEncounterV1 leader violates join-order transfer rules");
  assertStringArray(value.publicState.spectatorActorIds, "TurnEncounterV1.publicState.spectatorActorIds", TURN_MAX_ACTORS);
  for (const spectatorId of value.publicState.spectatorActorIds) if (privateById.has(spectatorId)) throw new Error("TurnEncounterV1 spectator cannot also participate");
  assertDenseTurnArray(value.publicState.enemyIntents, "TurnEncounterV1.publicState.enemyIntents", TURN_MAX_ACTORS * 2);
  value.publicState.enemyIntents.forEach((intent) => {
    validateEnemyIntentV1(intent);
    if (!leasedEnemyIds.includes(intent.actorId)) throw new Error("TurnEncounterV1 enemy intent actor must be leased to this encounter");
    if (intent.target.kind === "actor") for (const actorId of intent.target.actorIds) if (!privateById.has(actorId)) throw new Error("TurnEncounterV1 enemy intent targets an outsider");
  });
  assertTurnInteger(value.publicState.latestEventSequence, "TurnEncounterV1.publicState.latestEventSequence", 0, TURN_MAX_EVENT_SEQUENCE);
  for (const participant of privateById.values()) if (participant.eventCursor > value.publicState.latestEventSequence) throw new Error("TurnEncounterV1 participant cursor exceeds latest event");
}

export const turnBandIndex = (band: TurnResolutionBand): number => TURN_RESOLUTION_BANDS.indexOf(band);
