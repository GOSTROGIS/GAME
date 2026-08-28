import { createHash, randomUUID } from "node:crypto";
import {
  NETWORK_PROTOCOL_VERSION,
  codeUnitCompare,
  projectCombatEventBatchForAudienceV1,
  resolveTurnRound,
  seededTurnRollPermille,
  validateTurnEncounterJoinRequest,
  validateEncounterClientStateV1,
  validateTurnEncounterStartRequest,
  validateTurnEncounterV1,
  validateTurnEncounterWithdrawRequest,
  validateTurnPlanRequest,
  type CanonicalReactionReservation,
  type CanonicalTurnAction,
  type CombatEventV1,
  type EncounterParticipantState,
  type EnemyIntentV1,
  type EncounterClientStateV1,
  type IntegerPositionMm,
  type TurnEncounterCommandAck,
  type TurnEncounterCommandRejection,
  type TurnEncounterJoinRequest,
  type TurnEncounterStartRequest,
  type TurnEncounterV1,
  type TurnEncounterWithdrawRequest,
  type TurnKernelActorResultV1,
  type TurnPlanAck,
  type TurnPlanRequest,
  type TurnRoundOutcome,
  type ServerSaveV6,
} from "@hollow-march/shared";
import { BESTIARY_BY_ID } from "@hearthmere/content/bestiary";
import { TURN_DEFEAT_QUEST_OBJECTIVES_BY_CREATURE_ID } from "@hearthmere/content/turn-combat";
import { canonicalTurnBody } from "../persistence/turn-store.js";
import {
  DEFAULT_ACTIVE_TECHNIQUE_ID,
  TURN_CREATURE_REGISTRY,
  TURN_SKILL_REGISTRY,
  canonicalizeServerTurnPlan,
  createEnemyAction,
  resolveRegisteredTurnEffect,
} from "./turnRegistries.js";

export const TURN_TICKS_PER_SECOND = 30;
export const TURN_DISCONNECT_LEASE_TICKS = 60 * TURN_TICKS_PER_SECOND;
export const TURN_PLANNING_LEASE_TICKS = 10 * 60 * TURN_TICKS_PER_SECOND;
export const TURN_SETTLEMENT_RETRY_TICKS = 5 * TURN_TICKS_PER_SECOND;
export const TURN_TERMINAL_RETENTION_TICKS = 60 * TURN_TICKS_PER_SECOND;
export const TURN_PARTICIPANT_LIMIT = 4;
export const TURN_MAX_RETAINED_EVENTS = 1_024;
export const TURN_MAX_RETAINED_TERMINAL_ENCOUNTERS = 64;
export const TURN_MAX_COMMAND_CACHE_ENTRIES = 2_048;
export const TURN_MAX_ENGAGE_DISTANCE_MM = 12_000;

export interface TurnWorldPlayer {
  readonly characterId: string;
  readonly sessionId: string;
  readonly positionMm: IntegerPositionMm;
  readonly yawTenThousandthRadians: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly stamina: number;
  readonly maxStamina: number;
  readonly focus: number;
  readonly maxFocus: number;
  readonly initiative?: number;
  readonly activeTechniqueId?: string | null;
  readonly quickItemId?: string | null;
  readonly itemCharges?: Readonly<Record<string, number>>;
  readonly durableSave?: ServerSaveV6 | null;
}

export interface TurnWorldEnemy {
  readonly actorId: string;
  readonly definitionId: string;
  readonly positionMm: IntegerPositionMm;
  readonly yawTenThousandthRadians: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly stamina?: number;
  readonly maxStamina?: number;
  readonly focus?: number;
  readonly maxFocus?: number;
  readonly initiative?: number;
}

export interface TurnSettlementInput {
  readonly encounterId: string;
  readonly outcome: "victory" | "defeat" | "aborted";
  readonly participantCharacterIds: readonly string[];
  readonly leasedEnemyIds: readonly string[];
  readonly latestEventSequence: number;
  readonly rewardsAllowed: boolean;
  readonly characters: readonly TurnSettlementCharacterInput[];
}

export interface TurnResolvedRewards {
  readonly inventory: Readonly<Record<string, number>>;
  readonly skillXp: Readonly<Record<string, number>>;
  readonly quests: Readonly<Record<string, number>>;
  readonly progression: Readonly<Record<string, number>>;
  readonly worldEvents: {
    readonly enemyDefeats: Readonly<Record<string, number>>;
    readonly uniqueDefeats: readonly string[];
  };
}

export interface TurnSettlementCharacterInput {
  readonly characterId: string;
  readonly baseSave: ServerSaveV6 | null;
  readonly finalVitals: { readonly health: number; readonly maximumHealth: number; readonly stamina: number; readonly maximumStamina: number; readonly focus: number; readonly maximumFocus: number };
  readonly finalTransform: { readonly x: number; readonly y: number; readonly z: number; readonly yaw: number };
  readonly finalItemCharges: Readonly<Record<string, number>>;
  readonly initialItemCharges: Readonly<Record<string, number>>;
  readonly rewardEligible: boolean;
  readonly rewards: TurnResolvedRewards;
}

export interface TurnEncounterManagerOptions {
  readonly shardId: string;
  readonly settle?: (input: TurnSettlementInput) => Promise<void>;
  readonly canTraverse?: (query: {
    actorId: string;
    kind: "move" | "dodge";
    fromMm: IntegerPositionMm;
    toMm: IntegerPositionMm;
  }) => boolean;
  readonly hasLineOfSight?: (query: { sourceActorId: string; targetActorId: string; sourceMm: IntegerPositionMm; targetMm: IntegerPositionMm }) => boolean;
  readonly canEngage?: (player: TurnWorldPlayer, enemy: TurnWorldEnemy) => boolean;
  readonly canJoinBattlefield?: (player: TurnWorldPlayer, participantPositions: readonly IntegerPositionMm[]) => boolean;
  readonly applyEnemyResult?: (enemy: TurnKernelActorResultV1) => void;
  readonly applyPlayerResult?: (characterId: string, player: TurnKernelActorResultV1) => void;
  readonly restoreEnemy?: (enemy: TurnWorldEnemy) => void;
  readonly onState?: (state: TurnEncounterV1) => void;
  readonly onEvents?: (encounterId: string, events: readonly CombatEventV1[]) => void;
  readonly onEncounterDisposed?: (encounterId: string) => void;
  readonly idFactory?: () => string;
}

type MutableParticipant = {
  actorId: string;
  characterId: string | null;
  sessionId: string | null;
  definitionId: string | null;
  team: "players" | "enemies";
  joinOrder: number;
  initiative: number;
  connected: boolean;
  reconnectDeadlineTick: number | null;
  ready: boolean;
  withdrawn: boolean;
  pendingDisconnectRemoval: boolean;
  resolvedRoundCount: number;
  positionMm: IntegerPositionMm;
  yawTenThousandthRadians: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  focus: number;
  maxFocus: number;
  plan: readonly CanonicalTurnAction[] | null;
  reaction: CanonicalReactionReservation | null;
  lastAcknowledgedCommandId: string | null;
  eventCursor: number;
  activeTechniqueId: string | null;
  quickItemId: string | null;
  itemCharges: Record<string, number>;
  initialItemCharges: Record<string, number>;
  durableSave: ServerSaveV6 | null;
  statuses: Record<string, { stacks: number; remainingRounds: number }>;
  buffs: Record<string, { magnitude: number; remainingRounds: number }>;
};

type MutableEncounter = {
  encounterId: string;
  leaseGeneration: number;
  leasedEnemyIds: string[];
  originalEnemies: Map<string, TurnWorldEnemy>;
  originalSnapshotId: string;
  originalSnapshotSha256: string;
  serverSeed: string;
  phase: TurnEncounterV1["phase"];
  round: number;
  revision: number;
  createdAtTick: number;
  planningLeaseExpiresAtTick: number;
  participants: MutableParticipant[];
  spectators: Set<string>;
  enemyIntents: EnemyIntentV1[];
  events: CombatEventV1[];
  latestEventSequence: number;
  nextJoinOrder: number;
  hasLockedOnce: boolean;
  settlementPromise: Promise<void> | null;
  settlementError: unknown;
  settlementOutcome: "victory" | "defeat" | "aborted" | null;
  settlementRetryAtTick: number | null;
  pendingTerminalEvents: CombatEventV1[];
  terminalAtTick: number | null;
};

type CachedCommand = { body: string; ack: TurnEncounterCommandAck };
type CachedPlan = { body: string; ack: TurnPlanAck };

const clonePosition = (position: IntegerPositionMm): IntegerPositionMm => ({ x: position.x, y: position.y, z: position.z });
const stablePlayerActorId = (characterId: string): string => `character.${characterId}`;
const commandKey = (characterId: string, commandId: string): string => `${characterId}\u0000${commandId}`;
const squareDistance = (left: IntegerPositionMm, right: IntegerPositionMm): number => (
  (left.x - right.x) ** 2 + (left.y - right.y) ** 2 + (left.z - right.z) ** 2
);
const sha256 = (value: unknown): string => createHash("sha256").update(canonicalTurnBody(value)).digest("hex");

export class TurnEncounterManager {
  readonly #options: TurnEncounterManagerOptions;
  readonly #encounters = new Map<string, MutableEncounter>();
  readonly #leases = new Map<string, { encounterId: string; generation: number }>();
  readonly #leaseGenerations = new Map<string, number>();
  readonly #commandCache = new Map<string, CachedCommand>();
  readonly #planCache = new Map<string, CachedPlan>();
  #currentTick = 0;

  constructor(options: TurnEncounterManagerOptions) {
    if (!options.shardId) throw new Error("TurnEncounterManager requires shardId");
    this.#options = options;
  }

  get currentTick(): number { return this.#currentTick; }
  get encounterCount(): number { return this.#encounters.size; }

  encounter(encounterId: string): TurnEncounterV1 | null {
    const encounter = this.#encounters.get(encounterId);
    return encounter ? this.#snapshot(encounter) : null;
  }

  encounters(): readonly TurnEncounterV1[] {
    return [...this.#encounters.values()].map((encounter) => this.#snapshot(encounter));
  }

  clientState(encounterId: string, viewer: { actorId: string; characterId: string | null }): EncounterClientStateV1 | null {
    const encounter = this.#encounters.get(encounterId);
    if (!encounter) return null;
    const snapshot = this.#snapshot(encounter);
    const participant = viewer.characterId === null ? undefined : snapshot.participants.find((candidate) => candidate.characterId === viewer.characterId && !candidate.withdrawn);
    const state: EncounterClientStateV1 = {
      version: 1,
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      publicState: structuredClone(snapshot.publicState),
      viewerState: participant ? {
        mode: participant.connected ? "participant" : "reconnecting",
        actorId: participant.actorId,
        characterId: participant.characterId,
        canPlan: encounter.phase === "planning" && participant.connected && !participant.ready,
        canWithdraw: encounter.phase === "planning" && participant.connected,
        reconnectDeadlineTick: participant.reconnectDeadlineTick,
      } : {
        mode: "spectator",
        actorId: viewer.actorId,
        characterId: viewer.characterId,
        canPlan: false,
        canWithdraw: false,
        reconnectDeadlineTick: null,
      },
      participantState: participant ? structuredClone(participant) : null,
    };
    validateEncounterClientStateV1(state);
    return state;
  }

  eventsSince(encounterId: string, sequence: number): readonly CombatEventV1[] {
    return this.#encounters.get(encounterId)?.events.filter((event) => event.sequence > sequence).map((event) => structuredClone(event)) ?? [];
  }

  isEnemyLeased(enemyActorId: string): boolean { return this.#leases.has(enemyActorId); }
  leaseOwner(enemyActorId: string): string | null { return this.#leases.get(enemyActorId)?.encounterId ?? null; }

  activeEncounterForCharacter(characterId: string): string | null {
    for (const encounter of this.#encounters.values()) {
      if (this.#isTerminal(encounter.phase)) continue;
      if (encounter.participants.some((participant) => participant.characterId === characterId && !participant.withdrawn)) return encounter.encounterId;
    }
    return null;
  }

  connectedSessionForCharacter(characterId: string): string | null {
    for (const encounter of this.#encounters.values()) {
      if (this.#isTerminal(encounter.phase)) continue;
      const participant = encounter.participants.find((candidate) => candidate.characterId === characterId && !candidate.withdrawn);
      if (participant?.connected) return participant.sessionId;
    }
    return null;
  }

  start(requestValue: unknown, player: TurnWorldPlayer, enemies: readonly TurnWorldEnemy[]): TurnEncounterCommandAck {
    let request: TurnEncounterStartRequest;
    try { validateTurnEncounterStartRequest(requestValue); request = requestValue; }
    catch { return this.#invalidCommandAck("start", requestValue, player.characterId, null); }
    if (request.characterId !== player.characterId) return this.#commandAck(request, "start", null, "character_mismatch", player.characterId);
    const replay = this.#replayCommand(request);
    if (replay) return replay;
    if (player.health <= 0) return this.#cacheCommand(request, this.#commandAck(request, "start", null, "invalid_request"));
    const duplicateSession = this.connectedSessionForCharacter(player.characterId);
    if (duplicateSession && duplicateSession !== player.sessionId) return this.#cacheCommand(request, this.#commandAck(request, "start", null, "duplicate_live_character"));
    if (this.activeEncounterForCharacter(player.characterId)) return this.#cacheCommand(request, this.#commandAck(request, "start", null, "invalid_phase"));
    const suppliedById = new Map(enemies.map((enemy) => [enemy.actorId, enemy]));
    if (request.enemyActorIds.some((id) => this.#leases.has(id) || !suppliedById.has(id) || suppliedById.get(id)!.health <= 0)) {
      return this.#cacheCommand(request, this.#commandAck(request, "start", null, "enemy_unavailable"));
    }
    if (request.enemyActorIds.some((id) => !TURN_CREATURE_REGISTRY.has(suppliedById.get(id)!.definitionId))) {
      return this.#cacheCommand(request, this.#commandAck(request, "start", null, "enemy_unavailable"));
    }
    if (request.enemyActorIds.some((id) => {
      const enemy = suppliedById.get(id)!;
      return squareDistance(player.positionMm, enemy.positionMm) > TURN_MAX_ENGAGE_DISTANCE_MM ** 2
        || !(this.#options.canEngage?.(player, enemy) ?? this.#options.hasLineOfSight?.({ sourceActorId: stablePlayerActorId(player.characterId), targetActorId: enemy.actorId, sourceMm: player.positionMm, targetMm: enemy.positionMm }) ?? true);
    })) return this.#cacheCommand(request, this.#commandAck(request, "start", null, "enemy_unavailable"));

    const encounterId = `turn.${this.#options.idFactory?.() ?? randomUUID()}`;
    const generation = Math.max(...request.enemyActorIds.map((id) => (this.#leaseGenerations.get(id) ?? 0) + 1));
    const originalEnemies = new Map(request.enemyActorIds.map((id) => [id, structuredClone(suppliedById.get(id)!)]));
    const snapshotBody = request.enemyActorIds.map((id) => originalEnemies.get(id)!);
    const encounter: MutableEncounter = {
      encounterId,
      leaseGeneration: generation,
      leasedEnemyIds: [...request.enemyActorIds],
      originalEnemies,
      originalSnapshotId: `${encounterId}.enemy-snapshot.${generation}`,
      originalSnapshotSha256: sha256(snapshotBody),
      serverSeed: randomUUID(),
      phase: "forming",
      round: 1,
      revision: 0,
      createdAtTick: this.#currentTick,
      planningLeaseExpiresAtTick: this.#currentTick + TURN_PLANNING_LEASE_TICKS,
      participants: [this.#playerParticipant(player, 0), ...request.enemyActorIds.map((id, index) => this.#enemyParticipant(originalEnemies.get(id)!, 64 + index))],
      spectators: new Set(),
      enemyIntents: [],
      events: [],
      latestEventSequence: 0,
      nextJoinOrder: 1,
      hasLockedOnce: false,
      settlementPromise: null,
      settlementError: null,
      settlementOutcome: null,
      settlementRetryAtTick: null,
      pendingTerminalEvents: [],
      terminalAtTick: null,
    };
    for (const enemyId of request.enemyActorIds) {
      this.#leaseGenerations.set(enemyId, generation);
      this.#leases.set(enemyId, { encounterId, generation });
    }
    this.#encounters.set(encounterId, encounter);
    this.#publish(encounter);
    encounter.phase = "planning";
    encounter.revision += 1;
    this.#authorEnemyPlans(encounter);
    this.#publish(encounter);
    return this.#cacheCommand(request, this.#commandAck(request, "start", encounterId));
  }

  join(requestValue: unknown, player: TurnWorldPlayer): TurnEncounterCommandAck {
    let request: TurnEncounterJoinRequest;
    try { validateTurnEncounterJoinRequest(requestValue); request = requestValue; }
    catch { return this.#invalidCommandAck("join", requestValue, player.characterId, null); }
    if (request.characterId !== player.characterId) return this.#commandAck(request, "join", request.encounterId, "character_mismatch", player.characterId);
    const replay = this.#replayCommand(request); if (replay) return replay;
    if (player.health <= 0) return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "invalid_request"));
    const encounter = this.#encounters.get(request.encounterId);
    if (!encounter) return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "encounter_not_found"));
    if (encounter.phase !== "planning" || encounter.hasLockedOnce || encounter.round !== 1) return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "join_closed"));
    const existing = encounter.participants.find((participant) => participant.characterId === player.characterId);
    if (existing) {
      const rejection: TurnEncounterCommandRejection = existing.withdrawn ? "join_closed" : existing.sessionId !== player.sessionId && existing.connected ? "duplicate_live_character" : "invalid_phase";
      return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, rejection));
    }
    if (this.connectedSessionForCharacter(player.characterId) && this.connectedSessionForCharacter(player.characterId) !== player.sessionId) {
      return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "duplicate_live_character"));
    }
    const activePlayers = encounter.participants.filter((participant) => participant.team === "players" && !participant.withdrawn);
    if (activePlayers.length >= TURN_PARTICIPANT_LIMIT) return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "encounter_full"));
    const battlefieldPositions = encounter.participants.filter((participant) => !participant.withdrawn).map((participant) => participant.positionMm);
    const nearBattlefield = battlefieldPositions.some((position) => squareDistance(player.positionMm, position) <= TURN_MAX_ENGAGE_DISTANCE_MM ** 2);
    const positionAvailable = battlefieldPositions.every((position) => squareDistance(player.positionMm, position) > 0);
    if (!nearBattlefield || !positionAvailable || !(this.#options.canJoinBattlefield?.(player, battlefieldPositions) ?? true)) {
      return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId, "join_closed"));
    }
    encounter.participants.push(this.#playerParticipant(player, encounter.nextJoinOrder++));
    encounter.spectators.delete(player.sessionId);
    encounter.revision += 1;
    this.#authorEnemyPlans(encounter);
    this.#publish(encounter);
    return this.#cacheCommand(request, this.#commandAck(request, "join", request.encounterId));
  }

  spectate(encounterId: string, actorId: string): boolean {
    const encounter = this.#encounters.get(encounterId);
    if (!encounter || encounter.participants.some((participant) => participant.actorId === actorId)) return false;
    encounter.spectators.add(actorId);
    encounter.revision += 1;
    this.#publish(encounter);
    return true;
  }

  withdraw(requestValue: unknown, authenticatedCharacterId: string): TurnEncounterCommandAck {
    let request: TurnEncounterWithdrawRequest;
    try { validateTurnEncounterWithdrawRequest(requestValue); request = requestValue; }
    catch { return this.#invalidCommandAck("withdraw", requestValue, authenticatedCharacterId, null); }
    if (request.characterId !== authenticatedCharacterId) return this.#commandAck(request, "withdraw", request.encounterId, "character_mismatch", authenticatedCharacterId);
    const replay = this.#replayCommand(request); if (replay) return replay;
    const encounter = this.#encounters.get(request.encounterId);
    if (!encounter) return this.#cacheCommand(request, this.#commandAck(request, "withdraw", request.encounterId, "encounter_not_found"));
    if (encounter.phase !== "planning") return this.#cacheCommand(request, this.#commandAck(request, "withdraw", request.encounterId, "invalid_phase"));
    const participant = encounter.participants.find((candidate) => candidate.characterId === authenticatedCharacterId);
    if (!participant) return this.#cacheCommand(request, this.#commandAck(request, "withdraw", request.encounterId, "not_participant"));
    if (participant.withdrawn) return this.#cacheCommand(request, this.#commandAck(request, "withdraw", request.encounterId, "already_withdrawn"));
    participant.withdrawn = true;
    participant.ready = false;
    participant.plan = null;
    participant.reaction = null;
    participant.reconnectDeadlineTick = null;
    encounter.revision += 1;
    const ack = this.#cacheCommand(request, this.#commandAck(request, "withdraw", request.encounterId));
    if (this.#activePlayers(encounter).length === 0) this.#abort(encounter);
    else { this.#authorEnemyPlans(encounter); this.#publish(encounter); }
    return ack;
  }

  submitPlan(requestValue: unknown, authenticatedCharacterId: string): TurnPlanAck {
    let request: TurnPlanRequest;
    try { validateTurnPlanRequest(requestValue); request = requestValue; }
    catch { return this.#invalidPlanAck(requestValue, authenticatedCharacterId); }
    if (request.characterId !== authenticatedCharacterId) return this.#planRejection(request, "character_mismatch", authenticatedCharacterId);
    const key = commandKey(authenticatedCharacterId, request.commandId);
    const body = canonicalTurnBody(request);
    const cached = this.#planCache.get(key);
    if (cached) return cached.body === body ? structuredClone(cached.ack) : this.#planRejection(request, "idempotency_conflict");
    const encounter = this.#encounters.get(request.encounterId);
    if (!encounter) return this.#cachePlan(key, body, this.#planRejection(request, "not_participant"));
    if (request.round !== encounter.round) return this.#cachePlan(key, body, this.#planRejection(request, "stale_round"));
    if (request.revision !== encounter.revision) return this.#cachePlan(key, body, this.#planRejection(request, "stale_revision"));
    if (encounter.phase !== "planning") return this.#cachePlan(key, body, this.#planRejection(request, "already_ready"));
    const participant = encounter.participants.find((candidate) => candidate.characterId === authenticatedCharacterId && !candidate.withdrawn);
    if (!participant) return this.#cachePlan(key, body, this.#planRejection(request, "not_participant"));
    if (participant.ready) return this.#cachePlan(key, body, this.#planRejection(request, "already_ready"));
    let canonical;
    try {
      canonical = canonicalizeServerTurnPlan(request, {
        activeTechniqueId: participant.activeTechniqueId,
        quickItemId: participant.quickItemId,
        itemCharges: participant.itemCharges,
      });
      this.#validatePlanTargets(encounter, participant, canonical.actions);
    }
    catch { return this.#cachePlan(key, body, this.#planRejection(request, "invalid_plan")); }
    participant.plan = canonical.actions;
    participant.reaction = canonical.reaction;
    participant.ready = true;
    participant.lastAcknowledgedCommandId = request.commandId;
    encounter.revision += 1;
    const ack: TurnPlanAck = {
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      encounterId: request.encounterId,
      characterId: authenticatedCharacterId,
      commandId: request.commandId,
      round: request.round,
      revision: request.revision,
      accepted: true,
      planHash: sha256(canonical),
    };
    this.#cachePlan(key, body, ack);
    this.#publish(encounter);
    if (this.#activePlayers(encounter).every((candidate) => candidate.ready)) this.#resolve(encounter);
    return structuredClone(ack);
  }

  #validatePlanTargets(encounter: MutableEncounter, source: MutableParticipant, actions: readonly CanonicalTurnAction[]): void {
    for (const action of actions) {
      if (action.targetRelation === "self") {
        if ("targetActorId" in action && action.targetActorId !== undefined && action.targetActorId !== source.actorId) throw new Error("self action targets another actor");
        continue;
      }
      if (!("targetActorId" in action) || !action.targetActorId) continue;
      const target = encounter.participants.find((candidate) => candidate.actorId === action.targetActorId && !candidate.withdrawn && candidate.health > 0);
      if (!target) throw new Error("action target is not active in this encounter");
      if (action.targetRelation === "hostile" && target.team === source.team) throw new Error("hostile action targets an ally");
      if (action.targetRelation === "ally" && (target.team !== source.team || target.actorId === source.actorId)) throw new Error("ally action requires a distinct ally");
      if (source.activeTechniqueId === "technique.guard.shelter_step" && action.definitionId === "technique.equipped.primary") {
        const isThreatened = encounter.enemyIntents.some((intent) => intent.target.kind === "actor" && intent.target.actorIds.includes(target.actorId));
        if (!isThreatened) throw new Error("Shelter Step requires an ally targeted by a disclosed enemy intent");
      }
    }
  }

  disconnect(characterId: string, sessionId: string): boolean {
    const encounterId = this.activeEncounterForCharacter(characterId);
    const encounter = encounterId ? this.#encounters.get(encounterId) : undefined;
    const participant = encounter?.participants.find((candidate) => candidate.characterId === characterId && !candidate.withdrawn);
    if (!encounter || !participant || participant.sessionId !== sessionId || !participant.connected) return false;
    participant.connected = false;
    participant.reconnectDeadlineTick = this.#currentTick + TURN_DISCONNECT_LEASE_TICKS;
    encounter.revision += 1;
    this.#publish(encounter);
    return true;
  }

  reconnect(characterId: string, sessionId: string): { accepted: boolean; rejection?: "not_participant" | "duplicate_live_character"; state?: EncounterClientStateV1; events?: readonly CombatEventV1[] } {
    const encounterId = this.activeEncounterForCharacter(characterId);
    const encounter = encounterId ? this.#encounters.get(encounterId) : undefined;
    const participant = encounter?.participants.find((candidate) => candidate.characterId === characterId && !candidate.withdrawn);
    if (!encounter || !participant) return { accepted: false, rejection: "not_participant" };
    if (participant.pendingDisconnectRemoval) return { accepted: false, rejection: "not_participant" };
    if (participant.connected && participant.sessionId !== sessionId) return { accepted: false, rejection: "duplicate_live_character" };
    participant.connected = true;
    participant.sessionId = sessionId;
    participant.reconnectDeadlineTick = null;
    encounter.revision += 1;
    this.#publish(encounter);
    return {
      accepted: true,
      state: this.clientState(encounter.encounterId, { actorId: sessionId, characterId })!,
      events: projectCombatEventBatchForAudienceV1(this.eventsSince(encounter.encounterId, participant.eventCursor), {
        mode: "participant",
        viewerActorId: participant.actorId,
      }),
    };
  }

  updateEventCursor(characterId: string, encounterId: string, sequence: number): boolean {
    const encounter = this.#encounters.get(encounterId);
    const participant = encounter?.participants.find((candidate) => candidate.characterId === characterId);
    if (!encounter || !participant || !Number.isSafeInteger(sequence) || sequence < participant.eventCursor || sequence > encounter.latestEventSequence) return false;
    participant.eventCursor = sequence;
    return true;
  }

  advanceToTick(tick: number): void {
    if (!Number.isSafeInteger(tick) || tick < this.#currentTick) throw new Error("turn encounter tick must be monotonic");
    this.#currentTick = tick;
    for (const encounter of this.#encounters.values()) {
      if (encounter.phase === "settling" && encounter.settlementError && encounter.settlementRetryAtTick !== null && tick >= encounter.settlementRetryAtTick) {
        this.retrySettlement(encounter.encounterId);
        continue;
      }
      if (encounter.phase !== "planning") continue;
      if (tick >= encounter.planningLeaseExpiresAtTick) { this.#abort(encounter); continue; }
      let expired = false;
      for (const participant of this.#activePlayers(encounter)) {
        if (participant.connected || participant.reconnectDeadlineTick === null || tick < participant.reconnectDeadlineTick) continue;
        participant.plan = [this.#fallbackHold(participant)];
        participant.reaction = participant.stamina >= 8 ? {
          reactionId: `server.disconnect.guard.${encounter.round}.${participant.actorId}`,
          definitionId: "reaction.guard",
          kind: "guard",
          staminaReserved: 8,
          mitigationPermille: 500,
        } : null;
        participant.ready = true;
        participant.pendingDisconnectRemoval = true;
        expired = true;
      }
      if (expired) {
        encounter.revision += 1;
        this.#publish(encounter);
        if (this.#activePlayers(encounter).every((participant) => participant.ready)) this.#resolve(encounter);
      }
    }
    this.#pruneTerminalEncounters();
  }

  async flushSettlements(): Promise<void> {
    await Promise.all([...this.#encounters.values()].map((encounter) => encounter.settlementPromise).filter((promise): promise is Promise<void> => Boolean(promise)));
    const failure = [...this.#encounters.values()].find((encounter) => encounter.settlementError)?.settlementError;
    if (failure) throw failure;
  }

  retrySettlement(encounterId: string): boolean {
    const encounter = this.#encounters.get(encounterId);
    if (!encounter || encounter.phase !== "settling" || !encounter.settlementError || !encounter.settlementOutcome) return false;
    encounter.settlementPromise = null;
    encounter.settlementError = null;
    encounter.settlementRetryAtTick = null;
    this.#beginSettlement(encounter, encounter.settlementOutcome);
    return true;
  }

  #resolve(encounter: MutableEncounter): void {
    if (encounter.phase !== "planning") return;
    encounter.hasLockedOnce = true;
    encounter.phase = "locked";
    encounter.revision += 1;
    this.#publish(encounter);
    encounter.phase = "resolving";
    encounter.revision += 1;
    this.#publish(encounter);
    const actors = encounter.participants.filter((participant) => !participant.withdrawn && participant.plan).map((participant) => ({
      actorId: participant.actorId,
      team: participant.team,
      initiative: participant.initiative,
      positionMm: clonePosition(participant.positionMm),
      yawTenThousandthRadians: participant.yawTenThousandthRadians,
      health: participant.health,
      maxHealth: participant.maxHealth,
      stamina: participant.stamina,
      maxStamina: participant.maxStamina,
      focus: participant.focus,
      maxFocus: participant.maxFocus,
      plan: participant.plan!,
      reaction: participant.reaction,
      itemCharges: { ...participant.itemCharges },
      statuses: structuredClone(participant.statuses),
      buffs: structuredClone(participant.buffs),
    }));
    const result = resolveTurnRound({
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      encounterId: encounter.encounterId,
      leaseGeneration: encounter.leaseGeneration,
      round: encounter.round,
      serverSeed: encounter.serverSeed,
      eventSequenceStart: encounter.latestEventSequence,
      actors,
      authority: {
        canTraverse: (query) => {
          const maximum = query.kind === "dodge" ? 3_000 : 4_000;
          return squareDistance(query.fromMm, query.toMm) <= maximum ** 2
            && (this.#options.canTraverse?.({ actorId: query.actorId, kind: query.kind, fromMm: query.fromMm, toMm: query.toMm }) ?? true);
        },
        hasLineOfSight: (query) => this.#options.hasLineOfSight?.(query) ?? true,
        resolveEffect: resolveRegisteredTurnEffect,
      },
    });
    const publishedEvents = result.outcome === "victory" ? result.events.filter(({ type }) => type !== "round_completed" && type !== "encounter_outcome") : result.events;
    encounter.pendingTerminalEvents = result.outcome === "victory" ? structuredClone(result.events.filter(({ type }) => type === "round_completed" || type === "encounter_outcome")) : [];
    encounter.latestEventSequence = publishedEvents.at(-1)?.sequence ?? encounter.latestEventSequence;
    encounter.events.push(...publishedEvents);
    if (encounter.events.length > TURN_MAX_RETAINED_EVENTS) encounter.events.splice(0, encounter.events.length - TURN_MAX_RETAINED_EVENTS);
    if (publishedEvents.length) this.#options.onEvents?.(encounter.encounterId, publishedEvents);
    for (const resolved of result.actors) {
      const participant = encounter.participants.find((candidate) => candidate.actorId === resolved.actorId)!;
      participant.positionMm = clonePosition(resolved.positionMm);
      participant.yawTenThousandthRadians = resolved.yawTenThousandthRadians;
      participant.health = resolved.health;
      participant.stamina = resolved.stamina;
      participant.focus = resolved.focus;
      participant.itemCharges = { ...resolved.itemCharges };
      participant.statuses = structuredClone(resolved.statuses);
      participant.buffs = structuredClone(resolved.buffs);
      if (participant.team === "players") participant.resolvedRoundCount += 1;
      if (resolved.team === "enemies") this.#options.applyEnemyResult?.(resolved);
      else if (participant.characterId) this.#options.applyPlayerResult?.(participant.characterId, resolved);
    }
    for (const participant of encounter.participants) {
      if (!participant.pendingDisconnectRemoval) continue;
      participant.withdrawn = true;
      participant.ready = false;
      participant.plan = null;
      participant.reaction = null;
      participant.pendingDisconnectRemoval = false;
      participant.reconnectDeadlineTick = null;
    }
    if (result.outcome === "ongoing" && this.#activePlayers(encounter).length > 0) {
      encounter.round += 1;
      encounter.phase = "planning";
      encounter.revision += 1;
      for (const participant of this.#activePlayers(encounter)) {
        participant.ready = false;
        participant.plan = null;
        participant.reaction = null;
      }
      this.#authorEnemyPlans(encounter);
      this.#publish(encounter);
      return;
    }
    const outcome: "victory" | "defeat" = result.outcome === "victory" ? "victory" : "defeat";
    this.#beginSettlement(encounter, outcome);
  }

  #beginSettlement(encounter: MutableEncounter, outcome: "victory" | "defeat" | "aborted"): void {
    if (encounter.settlementPromise) return;
    encounter.settlementOutcome = outcome;
    encounter.settlementRetryAtTick = null;
    encounter.phase = "settling";
    encounter.revision += 1;
    if (outcome !== "victory") this.#restoreOriginalEnemies(encounter);
    this.#publish(encounter);
    const rewards = this.#resolvedRewards(encounter, outcome);
    const characters = encounter.participants.filter((participant) => participant.characterId !== null && participant.resolvedRoundCount > 0).map((participant): TurnSettlementCharacterInput => ({
      characterId: participant.characterId!,
      baseSave: participant.durableSave ? structuredClone(participant.durableSave) : null,
      finalVitals: {
        health: participant.health, maximumHealth: participant.maxHealth,
        stamina: participant.stamina, maximumStamina: participant.maxStamina,
        focus: participant.focus, maximumFocus: participant.maxFocus,
      },
      finalTransform: {
        x: participant.positionMm.x / 1_000,
        y: participant.positionMm.y / 1_000,
        z: participant.positionMm.z / 1_000,
        yaw: participant.yawTenThousandthRadians / 10_000,
      },
      finalItemCharges: { ...participant.itemCharges },
      initialItemCharges: { ...participant.initialItemCharges },
      rewardEligible: outcome === "victory" && !participant.withdrawn,
      rewards: outcome === "victory" && !participant.withdrawn ? structuredClone(rewards) : { inventory: {}, skillXp: {}, quests: {}, progression: {}, worldEvents: { enemyDefeats: {}, uniqueDefeats: [] } },
    })).sort((left, right) => codeUnitCompare(left.characterId, right.characterId));
    const settlement: TurnSettlementInput = {
      encounterId: encounter.encounterId,
      outcome,
      participantCharacterIds: characters.filter(({ rewardEligible }) => rewardEligible).map(({ characterId }) => characterId),
      leasedEnemyIds: [...encounter.leasedEnemyIds],
      latestEventSequence: encounter.latestEventSequence,
      rewardsAllowed: outcome === "victory",
      characters,
    };
    encounter.settlementPromise = (this.#options.settle?.(settlement) ?? Promise.resolve()).then(() => {
      encounter.settlementError = null;
      encounter.settlementRetryAtTick = null;
      if (encounter.pendingTerminalEvents.length) {
        encounter.latestEventSequence = encounter.pendingTerminalEvents.at(-1)!.sequence;
        encounter.events.push(...encounter.pendingTerminalEvents);
        this.#options.onEvents?.(encounter.encounterId, encounter.pendingTerminalEvents);
        encounter.pendingTerminalEvents = [];
      }
      encounter.phase = outcome;
      encounter.terminalAtTick = this.#currentTick;
      encounter.revision += 1;
      this.#releaseLeases(encounter);
      this.#publish(encounter);
    }).catch((error) => {
      encounter.settlementError = error;
      encounter.settlementRetryAtTick = this.#currentTick + TURN_SETTLEMENT_RETRY_TICKS;
      this.#publish(encounter);
    });
  }

  #resolvedRewards(encounter: MutableEncounter, outcome: "victory" | "defeat" | "aborted"): TurnResolvedRewards {
    if (outcome !== "victory") return { inventory: {}, skillXp: {}, quests: {}, progression: {}, worldEvents: { enemyDefeats: {}, uniqueDefeats: [] } };
    const inventory: Record<string, number> = {};
    const quests: Record<string, number> = {};
    const enemyDefeats: Record<string, number> = {};
    const uniqueDefeats = new Set<string>();
    let combatXp = 0;
    for (const enemyId of encounter.leasedEnemyIds) {
      const definitionId = encounter.originalEnemies.get(enemyId)?.definitionId;
      const creature = definitionId ? BESTIARY_BY_ID.get(definitionId) : undefined;
      if (!creature) continue;
      enemyDefeats[creature.id] = (enemyDefeats[creature.id] ?? 0) + 1;
      if (creature.rank === "miniboss" || creature.rank === "boss") uniqueDefeats.add(creature.id);
      for (const objective of TURN_DEFEAT_QUEST_OBJECTIVES_BY_CREATURE_ID.get(creature.id) ?? []) {
        const key = `${objective.questId}.objective.${objective.objectiveIndex}`;
        quests[key] = (quests[key] ?? 0) + 1;
      }
      combatXp += Math.max(1, Math.round((creature.levelRange[0] + creature.levelRange[1]) / 2));
      for (const drop of creature.drops) {
        const chancePermille = Math.max(0, Math.min(1_000, Math.round(drop.chance * 1_000)));
        if (seededTurnRollPermille(encounter.serverSeed, encounter.encounterId, enemyId, drop.itemId, "drop") >= chancePermille) continue;
        const [minimum, maximum] = drop.quantity;
        const span = maximum - minimum + 1;
        const quantity = minimum + (seededTurnRollPermille(encounter.serverSeed, encounter.encounterId, enemyId, drop.itemId, "quantity") % span);
        inventory[drop.itemId] = (inventory[drop.itemId] ?? 0) + quantity;
      }
    }
    return {
      inventory,
      skillXp: { vitality: combatXp },
      quests,
      progression: { encountersWon: 1 },
      worldEvents: { enemyDefeats, uniqueDefeats: [...uniqueDefeats].sort(codeUnitCompare) },
    };
  }

  #abort(encounter: MutableEncounter): void {
    if (this.#isTerminal(encounter.phase)) return;
    encounter.revision += 1;
    encounter.latestEventSequence += 1;
    const event: CombatEventV1 = {
      version: 1,
      sequence: encounter.latestEventSequence,
      encounterId: encounter.encounterId,
      round: encounter.round,
      beat: null,
      band: null,
      type: "encounter_outcome",
      actorId: null,
      targetActorId: null,
      rootActionId: null,
      data: { outcome: "aborted", rewardsAllowed: false },
    };
    encounter.events.push(event);
    if (encounter.events.length > TURN_MAX_RETAINED_EVENTS) encounter.events.splice(0, encounter.events.length - TURN_MAX_RETAINED_EVENTS);
    this.#options.onEvents?.(encounter.encounterId, [event]);
    if (encounter.participants.some((participant) => participant.characterId !== null && participant.resolvedRoundCount > 0)) this.#beginSettlement(encounter, "aborted");
    else {
      this.#restoreOriginalEnemies(encounter);
      encounter.phase = "aborted";
      encounter.terminalAtTick = this.#currentTick;
      this.#releaseLeases(encounter);
      this.#publish(encounter);
    }
  }

  #authorEnemyPlans(encounter: MutableEncounter): void {
    const activePlayers = this.#activePlayers(encounter);
    encounter.enemyIntents = [];
    if (activePlayers.length === 0) return;
    const planningActors = encounter.participants.filter((participant) => !participant.withdrawn).map((participant) => ({
      actorId: participant.actorId,
      team: participant.team,
      positionMm: participant.positionMm,
      health: participant.health,
      maxHealth: participant.maxHealth,
    }));
    for (const enemy of encounter.participants.filter((participant) => participant.team === "enemies" && !participant.withdrawn && participant.health > 0)) {
      const contract = TURN_CREATURE_REGISTRY.get(enemy.definitionId!)!.contract.turn;
      const roundStartStamina = Math.min(enemy.maxStamina, enemy.stamina + Math.ceil(enemy.maxStamina * 0.15));
      const cannotAffordStamina = roundStartStamina < contract.staminaCost;
      const cannotAffordFocus = enemy.focus < contract.focusCost;
      const fallbackId = `server.enemy.${enemy.actorId}.round.${encounter.round}.${cannotAffordStamina && enemy.stamina < enemy.maxStamina ? "recover" : "hold"}`;
      const fallbackDefinition = cannotAffordStamina && enemy.stamina < enemy.maxStamina ? "action.recover" : "action.hold";
      const fallback = (cannotAffordStamina || cannotAffordFocus) ? TURN_SKILL_REGISTRY.get(fallbackDefinition)!({
        selectionId: fallbackId, actionDefinitionId: fallbackDefinition, beat: 0,
      }) : null;
      const authored = fallback ? {
        action: fallback,
        intent: {
          version: 1 as const, actorId: enemy.actorId, actionId: fallback.actionId,
          target: { kind: "actor" as const, actorIds: [enemy.actorId] }, band: fallback.band,
          damageBand: [0, 0] as const, statusIcons: [], sensoryCue: fallback.kind === "recover" ? "recover.breath" : "hold.stillness",
          interruptRule: "none", exactDamageKnown: true,
        },
      } : createEnemyAction(enemy.definitionId!, enemy.actorId, planningActors, encounter.round, {
        canTraverse: ({ actorId, fromMm, toMm }) => this.#options.canTraverse?.({ actorId, kind: "move", fromMm, toMm }) ?? true,
      });
      enemy.plan = [authored.action];
      enemy.reaction = null;
      enemy.ready = true;
      encounter.enemyIntents.push(authored.intent);
    }
    encounter.enemyIntents.sort((left, right) => codeUnitCompare(left.actorId, right.actorId));
  }

  #activePlayers(encounter: MutableEncounter): MutableParticipant[] {
    return encounter.participants.filter((participant) => participant.team === "players" && !participant.withdrawn);
  }

  #fallbackHold(participant: MutableParticipant): CanonicalTurnAction {
    return {
      actionId: `server.disconnect.hold.${participant.actorId}`,
      definitionId: "action.hold",
      kind: "hold",
      beat: 0,
      band: "aftermath",
      apCost: 0,
      staminaCost: 0,
      focusCost: 0,
      posthumous: false,
      reactionTrigger: "none",
      targetRelation: "self",
    };
  }

  #playerParticipant(player: TurnWorldPlayer, joinOrder: number): MutableParticipant {
    return {
      actorId: stablePlayerActorId(player.characterId), characterId: player.characterId, sessionId: player.sessionId, definitionId: null,
      team: "players", joinOrder, initiative: player.initiative ?? 10, connected: true, reconnectDeadlineTick: null,
      ready: false, withdrawn: false, pendingDisconnectRemoval: false, resolvedRoundCount: 0, positionMm: clonePosition(player.positionMm),
      yawTenThousandthRadians: player.yawTenThousandthRadians, health: player.health, maxHealth: player.maxHealth,
      stamina: player.stamina, maxStamina: player.maxStamina, focus: player.focus, maxFocus: player.maxFocus,
      plan: null, reaction: null, lastAcknowledgedCommandId: null, eventCursor: 0,
      activeTechniqueId: player.activeTechniqueId ?? DEFAULT_ACTIVE_TECHNIQUE_ID,
      quickItemId: player.quickItemId ?? null,
      itemCharges: { ...(player.itemCharges ?? {}) }, initialItemCharges: { ...(player.itemCharges ?? {}) }, durableSave: player.durableSave ? structuredClone(player.durableSave) : null, statuses: {}, buffs: {},
    };
  }

  #enemyParticipant(enemy: TurnWorldEnemy, joinOrder: number): MutableParticipant {
    return {
      actorId: enemy.actorId, characterId: null, sessionId: null, definitionId: enemy.definitionId,
      team: "enemies", joinOrder, initiative: enemy.initiative ?? 5, connected: true, reconnectDeadlineTick: null,
      ready: false, withdrawn: false, pendingDisconnectRemoval: false, resolvedRoundCount: 0, positionMm: clonePosition(enemy.positionMm),
      yawTenThousandthRadians: enemy.yawTenThousandthRadians, health: enemy.health, maxHealth: enemy.maxHealth,
      stamina: enemy.stamina ?? 1_000, maxStamina: enemy.maxStamina ?? 1_000, focus: enemy.focus ?? 1, maxFocus: enemy.maxFocus ?? 1,
      plan: null, reaction: null, lastAcknowledgedCommandId: null, eventCursor: 0,
      activeTechniqueId: null, quickItemId: null, itemCharges: {}, initialItemCharges: {}, durableSave: null, statuses: {}, buffs: {},
    };
  }

  #snapshot(encounter: MutableEncounter): TurnEncounterV1 {
    const participants: EncounterParticipantState[] = encounter.participants.map((participant) => ({
      actorId: participant.actorId,
      characterId: participant.characterId,
      team: participant.team,
      joinOrder: participant.joinOrder,
      initiative: participant.initiative,
      connected: participant.connected,
      reconnectDeadlineTick: participant.reconnectDeadlineTick,
      ready: participant.ready,
      withdrawn: participant.withdrawn,
      positionMm: clonePosition(participant.positionMm),
      health: participant.health,
      maxHealth: participant.maxHealth,
      stamina: participant.stamina,
      maxStamina: participant.maxStamina,
      focus: participant.focus,
      maxFocus: participant.maxFocus,
      itemCharges: { ...participant.itemCharges },
      activeTechniqueId: participant.activeTechniqueId,
      quickItemId: participant.quickItemId,
      plan: participant.plan ? structuredClone(participant.plan) : null,
      reaction: participant.reaction ? structuredClone(participant.reaction) : null,
      lastAcknowledgedCommandId: participant.lastAcknowledgedCommandId,
      eventCursor: participant.eventCursor,
    }));
    const activePlayers = participants.filter((participant) => participant.team === "players" && !participant.withdrawn)
      .sort((left, right) => left.joinOrder - right.joinOrder || codeUnitCompare(left.characterId!, right.characterId!) || codeUnitCompare(left.actorId, right.actorId));
    const state: TurnEncounterV1 = {
      version: 1,
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      encounterId: encounter.encounterId,
      shardId: this.#options.shardId,
      leaseOwnerEncounterId: encounter.encounterId,
      leaseGeneration: encounter.leaseGeneration,
      leasedEnemyIds: [...encounter.leasedEnemyIds],
      originalEnemySnapshot: { snapshotId: encounter.originalSnapshotId, sha256: encounter.originalSnapshotSha256, enemyActorIds: [...encounter.leasedEnemyIds] },
      serverSeed: encounter.serverSeed,
      phase: encounter.phase,
      round: encounter.round,
      revision: encounter.revision,
      createdAtTick: encounter.createdAtTick,
      planningLeaseExpiresAtTick: encounter.planningLeaseExpiresAtTick,
      disconnectedParticipantLeaseTicks: TURN_DISCONNECT_LEASE_TICKS,
      participants,
      publicState: {
        encounterId: encounter.encounterId,
        phase: encounter.phase,
        round: encounter.round,
        revision: encounter.revision,
        leaderActorId: activePlayers[0]?.actorId ?? null,
        leadershipRule: "join_order_then_character_id",
        participantLimit: TURN_PARTICIPANT_LIMIT,
        participants: participants.map(({ stamina: _stamina, maxStamina: _maxStamina, focus: _focus, maxFocus: _maxFocus, itemCharges: _items, activeTechniqueId: _technique, quickItemId: _quickItem, plan: _plan, reaction: _reaction, lastAcknowledgedCommandId: _ack, eventCursor: _cursor, ...participant }) => participant),
        spectatorActorIds: [...encounter.spectators].sort(codeUnitCompare),
        enemyIntents: structuredClone(encounter.enemyIntents),
        latestEventSequence: encounter.latestEventSequence,
      },
    };
    validateTurnEncounterV1(state);
    return state;
  }

  #publish(encounter: MutableEncounter): void { this.#options.onState?.(this.#snapshot(encounter)); }

  #restoreOriginalEnemies(encounter: MutableEncounter): void {
    for (const enemyId of encounter.leasedEnemyIds) this.#options.restoreEnemy?.(structuredClone(encounter.originalEnemies.get(enemyId)!));
  }

  #releaseLeases(encounter: MutableEncounter): void {
    for (const enemyId of encounter.leasedEnemyIds) if (this.#leases.get(enemyId)?.encounterId === encounter.encounterId) this.#leases.delete(enemyId);
  }

  #isTerminal(phase: TurnEncounterV1["phase"]): boolean { return phase === "victory" || phase === "defeat" || phase === "aborted"; }

  #commandAck(request: { commandId: string; characterId: string }, kind: "start" | "join" | "withdraw", encounterId: string | null, rejection?: TurnEncounterCommandRejection, authoritativeCharacterId = request.characterId): TurnEncounterCommandAck {
    return { protocolVersion: NETWORK_PROTOCOL_VERSION, commandId: request.commandId, characterId: authoritativeCharacterId, kind, encounterId, accepted: !rejection, ...(rejection ? { rejection } : {}) };
  }

  #replayCommand(request: { commandId: string; characterId: string }): TurnEncounterCommandAck | null {
    const cached = this.#commandCache.get(commandKey(request.characterId, request.commandId));
    if (!cached) return null;
    return cached.body === canonicalTurnBody(request) ? structuredClone(cached.ack) : this.#commandAck(request, cached.ack.kind, cached.ack.encounterId, "idempotency_conflict");
  }

  #cacheCommand(request: { commandId: string; characterId: string }, ack: TurnEncounterCommandAck): TurnEncounterCommandAck {
    const key = commandKey(request.characterId, request.commandId);
    this.#commandCache.delete(key);
    this.#commandCache.set(key, { body: canonicalTurnBody(request), ack: structuredClone(ack) });
    this.#trimCache(this.#commandCache);
    return structuredClone(ack);
  }

  #invalidCommandAck(kind: "start" | "join" | "withdraw", value: unknown, characterId: string, encounterId: string | null): TurnEncounterCommandAck {
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const rejection = record.protocolVersion !== NETWORK_PROTOCOL_VERSION ? "protocol_upgrade_required" : "invalid_request";
    return this.#commandAck({ commandId: typeof record.commandId === "string" && record.commandId ? record.commandId.slice(0, 160) : "invalid", characterId }, kind, encounterId, rejection);
  }

  #planRejection(request: TurnPlanRequest, rejection: NonNullable<TurnPlanAck["rejection"]>, authoritativeCharacterId = request.characterId): TurnPlanAck {
    return { protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: request.encounterId, characterId: authoritativeCharacterId, commandId: request.commandId, round: request.round, revision: request.revision, accepted: false, rejection };
  }

  #invalidPlanAck(value: unknown, characterId: string): TurnPlanAck {
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return {
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      encounterId: typeof record.encounterId === "string" && record.encounterId ? record.encounterId.slice(0, 160) : "invalid",
      characterId,
      commandId: typeof record.commandId === "string" && record.commandId ? record.commandId.slice(0, 160) : "invalid",
      round: Number.isSafeInteger(record.round) && Number(record.round) >= 0 ? Number(record.round) : 0,
      revision: Number.isSafeInteger(record.revision) && Number(record.revision) >= 0 ? Number(record.revision) : 0,
      accepted: false,
      rejection: record.protocolVersion !== NETWORK_PROTOCOL_VERSION ? "protocol_upgrade_required" : "invalid_plan",
    };
  }

  #cachePlan(key: string, body: string, ack: TurnPlanAck): TurnPlanAck {
    this.#planCache.delete(key);
    this.#planCache.set(key, { body, ack: structuredClone(ack) });
    this.#trimCache(this.#planCache);
    return structuredClone(ack);
  }

  #pruneTerminalEncounters(): void {
    const terminal = [...this.#encounters.values()]
      .filter((encounter) => encounter.terminalAtTick !== null)
      .sort((left, right) => left.terminalAtTick! - right.terminalAtTick! || codeUnitCompare(left.encounterId, right.encounterId));
    const overLimit = Math.max(0, terminal.length - TURN_MAX_RETAINED_TERMINAL_ENCOUNTERS);
    for (let index = 0; index < terminal.length; index += 1) {
      const encounter = terminal[index]!;
      const expired = this.#currentTick - encounter.terminalAtTick! >= TURN_TERMINAL_RETENTION_TICKS;
      if (!expired && index >= overLimit) continue;
      this.#encounters.delete(encounter.encounterId);
      for (const [key, cached] of this.#commandCache) if (cached.ack.encounterId === encounter.encounterId) this.#commandCache.delete(key);
      for (const [key, cached] of this.#planCache) if (cached.ack.encounterId === encounter.encounterId) this.#planCache.delete(key);
      this.#options.onEncounterDisposed?.(encounter.encounterId);
    }
  }

  #trimCache<T>(cache: Map<string, T>): void {
    while (cache.size > TURN_MAX_COMMAND_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  }
}
