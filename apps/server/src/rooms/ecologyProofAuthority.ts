import {
  SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS,
  type EcologyProofEncounterRecord,
} from "@hearthmere/content/showcases";
import {
  NETWORK_PROTOCOL_VERSION,
  resolveTurnRound,
  type CanonicalReactionReservation,
  type CanonicalTurnAction,
  type CombatEventV1,
  type EcologyProofAck,
  type EcologyProofAuthorityState,
  type EcologyProofCommand,
  type TurnKernelActorResultV1,
  type TurnKernelActorV1,
} from "@hollow-march/shared";
import {
  TURN_CREATURE_REGISTRY,
  TURN_REACTION_REGISTRY,
  TURN_SKILL_REGISTRY,
  createEnemyAction,
  resolveRegisteredTurnEffect,
} from "./turnRegistries.js";

const encounters = new Map(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.map((entry) => [entry.id, entry]));
const PLAYER_ACTOR_ID_SUFFIX = ".player";
const ENEMY_ACTOR_ID_SUFFIX = ".enemy";
const MAX_RETAINED_EVENTS = 256;

interface ActiveProof {
  readonly actorId: string;
  readonly encounter: EcologyProofEncounterRecord;
  readonly playerActorId: string;
  readonly enemyActorId: string;
  state: EcologyProofAuthorityState;
  player: TurnKernelActorResultV1;
  enemy: TurnKernelActorResultV1;
  round: number;
  latestEventSequence: number;
  events: CombatEventV1[];
  lastSequence: number;
  cachedAcks: Map<string, EcologyProofAck>;
}

const copyState = (state: EcologyProofAuthorityState): EcologyProofAuthorityState => ({
  ...state,
  activeEffects: [...state.activeEffects],
  resolvedDropTableIds: [...state.resolvedDropTableIds],
});

const initialActor = (
  actorId: string,
  team: "players" | "enemies",
  positionMm: { x: number; y: number; z: number },
): TurnKernelActorResultV1 => ({
  actorId,
  team,
  positionMm,
  yawTenThousandthRadians: team === "players" ? 0 : 31_416,
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  focus: 100,
  maxFocus: 100,
  interrupted: false,
  defeated: false,
  itemCharges: {},
  statuses: {},
  buffs: {},
});

const kernelActor = (
  actor: TurnKernelActorResultV1,
  initiative: number,
  plan: readonly CanonicalTurnAction[],
  reaction: CanonicalReactionReservation | null,
): TurnKernelActorV1 => ({
  actorId: actor.actorId,
  team: actor.team,
  initiative,
  positionMm: { ...actor.positionMm },
  yawTenThousandthRadians: actor.yawTenThousandthRadians,
  health: actor.health,
  maxHealth: actor.maxHealth,
  stamina: actor.stamina,
  maxStamina: actor.maxStamina,
  focus: actor.focus,
  maxFocus: actor.maxFocus,
  plan,
  reaction,
  itemCharges: { ...actor.itemCharges },
  statuses: { ...actor.statuses },
  buffs: { ...actor.buffs },
});

/**
 * Compatibility adapter for the original ecology-proof wire. Every accepted
 * action now resolves one complete WeGo round through the same deterministic
 * kernel, V4 creature contract, and effect handler used by TurnEncounterV1.
 * Presentation seconds remain content metadata and never award damage here.
 */
export class EcologyProofAuthorityKernel {
  tick = 0;
  readonly #active = new Map<string, ActiveProof>();

  static readonly registeredHandlerIds = Object.freeze(
    SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.map((encounter) => encounter.mechanicHandlerId),
  );

  start(actorId: string, encounterId: string): EcologyProofAuthorityState | null {
    const encounter = encounters.get(encounterId);
    if (!encounter) return null;
    const registered = TURN_CREATURE_REGISTRY.get(encounter.creatureId);
    if (!registered || !registered.prototypePlayable || registered.contract.handlerId !== encounter.mechanicHandlerId) return null;
    const playerActorId = `${actorId}${PLAYER_ACTOR_ID_SUFFIX}`;
    const enemyActorId = `${encounter.id}${ENEMY_ACTOR_ID_SUFFIX}`;
    const state: EcologyProofAuthorityState = {
      encounterId,
      creatureId: registered.creatureId,
      mechanicHandlerId: registered.contract.handlerId,
      serverTick: this.tick,
      revision: 1,
      playerHealth: 100,
      enemyHealth: 100,
      enemyMaximum: 100,
      phase: "idle",
      impactTick: null,
      recoveryEndsTick: null,
      dodgeEndsTick: 0,
      visualTelegraph: encounter.telegraphs[0]?.visual ?? "",
      nonvisualTelegraph: encounter.telegraphs[0]?.nonvisual ?? "",
      counterplay: registered.contract.turn.counterplay,
      activeEffects: [],
      resolvedDropTableIds: [],
    };
    this.#active.set(actorId, {
      actorId,
      encounter,
      playerActorId,
      enemyActorId,
      state,
      player: initialActor(playerActorId, "players", { x: 0, y: 0, z: 0 }),
      enemy: initialActor(enemyActorId, "enemies", { x: 0, y: 0, z: 2_000 }),
      round: 1,
      latestEventSequence: 0,
      events: [],
      lastSequence: 0,
      cachedAcks: new Map(),
    });
    return copyState(state);
  }

  stop(actorId: string): void { this.#active.delete(actorId); }

  snapshot(actorId: string): EcologyProofAuthorityState | null {
    const proof = this.#active.get(actorId);
    return proof ? copyState(proof.state) : null;
  }

  combatEvents(actorId: string): readonly CombatEventV1[] {
    return [...(this.#active.get(actorId)?.events ?? [])];
  }

  receive(actorId: string, value: unknown): EcologyProofAck {
    const command = this.#validate(value);
    if (!command) return this.#reject("invalid", 0, "invalid_command");
    const proof = this.#active.get(actorId);
    if (!proof) return this.#reject(command.commandId, command.sequence, "not_started");
    const cached = proof.cachedAcks.get(command.commandId);
    if (cached) return cached.state ? { ...cached, state: copyState(cached.state) } : { ...cached };
    if (command.encounterId !== proof.encounter.id) return this.#remember(proof, command, this.#reject(command.commandId, command.sequence, "unknown_encounter"));
    if (command.sequence <= proof.lastSequence) return this.#remember(proof, command, this.#reject(command.commandId, command.sequence, "stale_sequence"));
    proof.lastSequence = command.sequence;

    if (command.kind === "reset") {
      const state = this.start(actorId, command.encounterId);
      const restarted = this.#active.get(actorId)!;
      restarted.lastSequence = command.sequence;
      return this.#remember(restarted, command, { commandId: command.commandId, sequence: command.sequence, serverTick: this.tick, accepted: true, state: state! });
    }
    if (proof.state.phase === "victory" || proof.state.phase === "defeat") {
      return this.#remember(proof, command, this.#reject(command.commandId, command.sequence, "cooldown"));
    }

    const playerAction = this.#playerAction(proof, command);
    const playerReaction = this.#playerReaction(proof, command);
    if (command.kind !== "dodge" && !playerAction) {
      return this.#remember(proof, command, this.#reject(command.commandId, command.sequence, "invalid_command"));
    }
    if (command.kind === "dodge" && !playerReaction) {
      return this.#remember(proof, command, this.#reject(command.commandId, command.sequence, "invalid_command"));
    }

    const registered = TURN_CREATURE_REGISTRY.get(proof.encounter.creatureId)!;
    const enemyAction = createEnemyAction(proof.encounter.creatureId, proof.enemyActorId, [
      { actorId: proof.player.actorId, team: proof.player.team, positionMm: proof.player.positionMm, health: proof.player.health, maxHealth: proof.player.maxHealth },
      { actorId: proof.enemy.actorId, team: proof.enemy.team, positionMm: proof.enemy.positionMm, health: proof.enemy.health, maxHealth: proof.enemy.maxHealth },
    ], proof.round, { canTraverse: () => true }).action;
    const result = resolveTurnRound({
      protocolVersion: NETWORK_PROTOCOL_VERSION,
      encounterId: proof.encounter.id,
      leaseGeneration: 1,
      round: proof.round,
      serverSeed: `ecology-proof:${proof.encounter.id}:${actorId}`,
      eventSequenceStart: proof.latestEventSequence,
      actors: [
        kernelActor(proof.player, 100, playerAction ? [playerAction] : [], playerReaction),
        kernelActor(proof.enemy, registered.contract.turn.priority, [enemyAction], null),
      ],
      authority: {
        canTraverse: () => true,
        hasLineOfSight: () => true,
        resolveEffect: resolveRegisteredTurnEffect,
      },
    });
    proof.player = result.actors.find(({ actorId: id }) => id === proof.playerActorId)!;
    proof.enemy = result.actors.find(({ actorId: id }) => id === proof.enemyActorId)!;
    proof.round += 1;
    proof.latestEventSequence = result.latestEventSequence;
    proof.events.push(...result.events);
    if (proof.events.length > MAX_RETAINED_EVENTS) proof.events.splice(0, proof.events.length - MAX_RETAINED_EVENTS);
    this.tick += 1;
    this.#projectKernelResult(proof, result.outcome, result.events);

    return this.#remember(proof, command, {
      commandId: command.commandId,
      sequence: command.sequence,
      serverTick: this.tick,
      accepted: true,
      state: copyState(proof.state),
    });
  }

  /** Real-time room ticks advance transport time only; combat cannot resolve here. */
  step(): ReadonlyArray<{ actorId: string; state: EcologyProofAuthorityState }> {
    this.tick += 1;
    return [];
  }

  #playerAction(proof: ActiveProof, command: EcologyProofCommand): CanonicalTurnAction | null {
    if (command.kind === "dodge") return null;
    const definitionId = command.kind === "heavy_attack" ? "action.heavy_attack" : "action.light_attack";
    return TURN_SKILL_REGISTRY.get(definitionId)?.({
      selectionId: `proof.player.${proof.round}.${command.kind}`,
      actionDefinitionId: definitionId,
      beat: 0,
      targetActorId: proof.enemyActorId,
    }) ?? null;
  }

  #playerReaction(proof: ActiveProof, command: EcologyProofCommand): CanonicalReactionReservation | null {
    if (command.kind !== "dodge") return null;
    return TURN_REACTION_REGISTRY.get("reaction.dodge")?.({
      selectionId: `proof.player.${proof.round}.dodge`,
      reactionDefinitionId: "reaction.dodge",
      destinationMm: {
        x: proof.player.positionMm.x,
        y: proof.player.positionMm.y,
        z: proof.player.positionMm.z - 3_000,
      },
      destinationYawTenThousandthRadians: proof.player.yawTenThousandthRadians,
    }) ?? null;
  }

  #projectKernelResult(
    proof: ActiveProof,
    outcome: "ongoing" | "victory" | "defeat" | "mutual_defeat",
    events: readonly CombatEventV1[],
  ): void {
    proof.state.serverTick = this.tick;
    proof.state.revision += 1;
    proof.state.playerHealth = proof.player.health;
    proof.state.enemyHealth = proof.enemy.health;
    proof.state.enemyMaximum = proof.enemy.maxHealth;
    proof.state.phase = outcome === "victory" ? "victory" : outcome === "ongoing" ? "idle" : "defeat";
    proof.state.impactTick = null;
    proof.state.recoveryEndsTick = null;
    proof.state.dodgeEndsTick = events.some((event) => event.type === "reaction_triggered" && event.actorId === proof.playerActorId && event.data.kind === "dodge") ? this.tick : 0;
    proof.state.activeEffects = [...new Set([
      ...Object.keys(proof.player.statuses),
      ...Object.keys(proof.player.buffs),
      ...Object.keys(proof.enemy.statuses),
      ...Object.keys(proof.enemy.buffs),
    ])].sort();
    proof.state.resolvedDropTableIds = outcome === "victory" ? [...proof.encounter.dropTableIds] : [];
  }

  #remember(proof: ActiveProof, command: EcologyProofCommand, ack: EcologyProofAck): EcologyProofAck {
    const finalAck: EcologyProofAck = ack.state ? { ...ack, state: copyState(ack.state) } : { ...ack };
    proof.cachedAcks.set(command.commandId, finalAck);
    if (proof.cachedAcks.size > 64) proof.cachedAcks.delete(proof.cachedAcks.keys().next().value!);
    return finalAck;
  }

  #reject(commandId: string, sequence: number, rejection: NonNullable<EcologyProofAck["rejection"]>): EcologyProofAck {
    return { commandId, sequence, serverTick: this.tick, accepted: false, rejection };
  }

  #validate(value: unknown): EcologyProofCommand | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;
    const kinds = new Set(["light_attack", "heavy_attack", "dodge", "reset"]);
    if (typeof candidate.commandId !== "string" || candidate.commandId.length < 1 || candidate.commandId.length > 64) return null;
    if (!Number.isSafeInteger(candidate.sequence) || Number(candidate.sequence) < 1 || !Number.isFinite(candidate.clientTick)) return null;
    if (typeof candidate.encounterId !== "string" || !kinds.has(String(candidate.kind))) return null;
    return candidate as unknown as EcologyProofCommand;
  }
}
