import {
  actionTiming, distanceSquared, PHASES, simulateMovement, validateActionCommand, validateInputFrame, validateTravelRequest,
  type ActionAck, type ActionCommand, type InputFrame, type WorldTransform,
} from "@hollow-march/shared";
import { SequenceGate } from "@hollow-march/shared";
import { findNavigationPath, validateWalkablePath } from "@hearthmere/content/runtime";

export interface MutableAuthorityActor {
  id: string;
  transform: WorldTransform;
  vitals: { health: number; maxHealth: number; stamina: number; maxStamina: number };
  locomotion: string;
  combat: { targetId: string; action: string; actionStartedTick: number; impactTick: number; recoveryEndsTick: number };
  lastProcessedInput: number;
  publicPhaseMask?: number;
  personalPhaseMask?: number;
}

interface ActorControl {
  inputGate: SequenceGate;
  actionGate: SequenceGate;
  latestInput: InputFrame | null;
  latestInputTick: number;
  travelWaypoints: WorldTransform[];
  travelSequence: number;
  acknowledgedCommands: Map<string, ActionAck>;
}

interface PendingImpact { sourceId: string; targetId: string; commandId: string; tick: number; damage: number; resolved: boolean }

export class AuthorityKernel {
  readonly actors = new Map<string, MutableAuthorityActor>();
  readonly worldTargets = new Map<string, MutableAuthorityActor>();
  #worldTargetKinds = new Map<string, "enemy" | "interactable">();
  #control = new Map<string, ActorControl>();
  #impacts: PendingImpact[] = [];
  #encounterActors = new Set<string>();
  #leasedWorldTargets = new Set<string>();
  tick = 0;

  addActor(actor: MutableAuthorityActor): void {
    this.actors.set(actor.id, actor);
    this.#control.set(actor.id, { inputGate: new SequenceGate(), actionGate: new SequenceGate(), latestInput: null, latestInputTick: this.tick, travelWaypoints: [], travelSequence: 0, acknowledgedCommands: new Map() });
  }
  removeActor(actorId: string): void { this.actors.delete(actorId); this.#control.delete(actorId); }
  addWorldTarget(target: MutableAuthorityActor, kind: "enemy" | "interactable" = "enemy"): void { this.worldTargets.set(target.id, target); this.#worldTargetKinds.set(target.id, kind); }
  setActorEncounterLocked(actorId: string, locked: boolean): void {
    if (locked) {
      this.#encounterActors.add(actorId);
      const control = this.#control.get(actorId);
      if (control) { control.latestInput = null; control.travelWaypoints = []; }
      const actor = this.actors.get(actorId);
      if (actor) { actor.locomotion = "idle"; actor.combat.action = ""; actor.combat.targetId = ""; }
      this.#impacts = this.#impacts.filter((impact) => impact.sourceId !== actorId);
    } else this.#encounterActors.delete(actorId);
  }
  setWorldTargetEncounterLeased(targetId: string, leased: boolean): void {
    if (leased) {
      this.#leasedWorldTargets.add(targetId);
      this.#impacts = this.#impacts.filter((impact) => impact.targetId !== targetId);
    } else this.#leasedWorldTargets.delete(targetId);
  }

  receiveInput(actorId: string, payload: unknown): boolean {
    const validation = validateInputFrame(payload); const control = this.#control.get(actorId);
    if (!validation.ok || !control || this.#encounterActors.has(actorId) || !control.inputGate.accept(validation.value.sequence)) return false;
    const directMovement = Math.abs(validation.value.moveX) + Math.abs(validation.value.moveZ) > 0.001;
    if (directMovement) {
      control.latestInput = validation.value; control.latestInputTick = this.tick; control.travelWaypoints = [];
    } else if (control.travelWaypoints.length === 0) {
      control.latestInput = validation.value; control.latestInputTick = this.tick;
    }
    return true;
  }

  receiveTravel(actorId: string, payload: unknown): boolean {
    const validation = validateTravelRequest(payload); const actor = this.actors.get(actorId); const control = this.#control.get(actorId);
    if (!validation.ok || !actor || !control || this.#encounterActors.has(actorId) || !control.inputGate.accept(validation.value.sequence)) return false;
    try {
      const phases = navigationPhaseIds(actor);
      const path = findNavigationPath(actor.transform, validation.value.destination, phases);
      if (!path.valid || !validateWalkablePath(path.waypoints, phases).valid) return false;
      control.travelWaypoints = path.waypoints.slice(1).map((waypoint, index, route) => ({
        x: waypoint[0], y: waypoint[1], z: waypoint[2],
        yaw: index === route.length - 1 ? validation.value.destination.yaw : 0,
      }));
      control.travelSequence = validation.value.sequence; control.latestInput = null;
      return true;
    } catch {
      return false;
    }
  }

  receiveAction(actorId: string, payload: unknown): ActionAck {
    const validation = validateActionCommand(payload);
    if (!validation.ok) return invalidAck(payload, this.tick, "invalid_command");
    const command = validation.value; const actor = this.actors.get(actorId); const control = this.#control.get(actorId);
    if (!actor || !control) return reject(command, this.tick, "not_authorized");
    const cached = control.acknowledgedCommands.get(command.commandId);
    if (cached) return cached;
    if (!control.actionGate.accept(command.sequence)) return this.#cache(control, reject(command, this.tick, "stale_sequence"));
    if (command.kind === "light_attack" || command.kind === "heavy_attack" || command.kind === "dodge") return this.#cache(control, reject(command, this.tick, "encounter_required"));
    if (this.#encounterActors.has(actorId) || (command.targetId && this.#leasedWorldTargets.has(command.targetId))) return this.#cache(control, reject(command, this.tick, "encounter_required"));
    if (actor.combat.recoveryEndsTick > this.tick) return this.#cache(control, reject(command, this.tick, "cooldown"));
    const timing = actionTiming(command, this.tick);
    if (command.targetId) {
      const actorTarget = this.actors.get(command.targetId); const target = actorTarget ?? this.worldTargets.get(command.targetId);
      if (!target) return this.#cache(control, reject(command, this.tick, "unknown_target"));
      const targetKind = actorTarget ? "actor" : this.#worldTargetKinds.get(command.targetId);
      if (["light_attack", "heavy_attack"].includes(command.kind) && targetKind !== "enemy") return this.#cache(control, reject(command, this.tick, "invalid_target_type"));
      if (["interact", "gather"].includes(command.kind) && targetKind !== "interactable") return this.#cache(control, reject(command, this.tick, "invalid_target_type"));
      if (["light_attack", "heavy_attack"].includes(command.kind) && target.vitals.health <= 0) return this.#cache(control, reject(command, this.tick, "target_unavailable"));
      if (distanceSquared(actor.transform, target.transform) > timing.range * timing.range) return this.#cache(control, reject(command, this.tick, "target_out_of_range"));
    }
    actor.combat.targetId = command.targetId ?? "";
    actor.combat.action = command.kind;
    actor.combat.actionStartedTick = this.tick;
    actor.combat.impactTick = timing.impactTick;
    actor.combat.recoveryEndsTick = timing.recoveryEndsTick;
    return this.#cache(control, { commandId: command.commandId, sequence: command.sequence, serverTick: this.tick, accepted: true, impactTick: timing.impactTick });
  }

  step(deltaSeconds: number): void {
    this.tick += 1;
    for (const [actorId, actor] of this.actors) {
      const control = this.#control.get(actorId)!;
      const travelTarget = control.travelWaypoints[0] ?? null;
      const travelInput = travelTarget ? inputToward(actor, travelTarget, control.travelSequence) : null;
      if (control.latestInput && this.tick - control.latestInputTick > 8) control.latestInput = null;
      const input = control.latestInput ?? travelInput;
      if (input && actor.vitals.health > 0) {
        const next = simulateMovement(actor.transform, input, deltaSeconds);
        const phases = navigationPhaseIds(actor);
        const movementIsWalkable = validateWalkablePath([actor.transform, next], phases).valid;
        if (movementIsWalkable) {
          actor.transform.x = next.x; actor.transform.y = next.y; actor.transform.z = next.z; actor.transform.yaw = next.yaw;
        }
        actor.lastProcessedInput = input.sequence;
        const moving = movementIsWalkable && Math.abs(input.moveX) + Math.abs(input.moveZ) > 0.001;
        if (actor.combat.recoveryEndsTick <= this.tick) actor.locomotion = moving ? input.sprint ? "run" : "walk" : "idle";
      }
      if (travelTarget && distanceSquared(actor.transform, travelTarget) < 0.04) {
        actor.transform.x = travelTarget.x; actor.transform.y = travelTarget.y;
        actor.transform.z = travelTarget.z;
        control.travelWaypoints.shift();
        if (control.travelWaypoints.length === 0) actor.transform.yaw = travelTarget.yaw;
      }
      if (actor.combat.recoveryEndsTick <= this.tick && actor.combat.action) { actor.combat.action = ""; actor.combat.targetId = ""; if (actor.vitals.health > 0) actor.locomotion = "idle"; }
    }
    for (const impact of this.#impacts) {
      if (impact.resolved || impact.tick > this.tick) continue;
      impact.resolved = true;
      const source = this.actors.get(impact.sourceId); const target = this.actors.get(impact.targetId) ?? this.worldTargets.get(impact.targetId);
      if (!source || !target || source.vitals.health <= 0 || target.vitals.health <= 0) continue;
      target.vitals.health = Math.max(0, target.vitals.health - impact.damage);
      if (target.vitals.health === 0) target.locomotion = "dead";
    }
    this.#impacts = this.#impacts.filter((impact) => !impact.resolved || impact.tick > this.tick - 90);
  }

  #cache(control: ActorControl, ack: ActionAck): ActionAck {
    control.acknowledgedCommands.set(ack.commandId, ack);
    if (control.acknowledgedCommands.size > 64) control.acknowledgedCommands.delete(control.acknowledgedCommands.keys().next().value!);
    return ack;
  }
}

function navigationPhaseIds(actor: MutableAuthorityActor): string[] {
  const mask = actor.personalPhaseMask ?? PHASES.HEARTHMERE_UNRESTORED;
  if ((mask & PHASES.HEARTHMERE_RESTORED) !== 0) return ["ember-ledger-restored"];
  if ((mask & PHASES.HEARTHMERE_UNRESTORED) !== 0) return ["ember-ledger-unrestored"];
  return [];
}

function inputToward(actor: MutableAuthorityActor, destination: WorldTransform, sequence: number): InputFrame {
  const dx = destination.x - actor.transform.x; const dz = destination.z - actor.transform.z;
  const divisor = Math.max(1, Math.hypot(dx, dz));
  return { sequence, clientTick: 0, moveX: dx / divisor, moveZ: dz / divisor, yaw: Math.atan2(dx, dz), sprint: false };
}

function invalidAck(payload: unknown, tick: number, rejection: NonNullable<ActionAck["rejection"]>): ActionAck {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return { commandId: typeof source.commandId === "string" ? source.commandId.slice(0, 64) : "invalid", sequence: Number.isSafeInteger(source.sequence) ? Number(source.sequence) : 0, serverTick: tick, accepted: false, rejection };
}
function reject(command: ActionCommand, tick: number, rejection: NonNullable<ActionAck["rejection"]>): ActionAck {
  return { commandId: command.commandId, sequence: command.sequence, serverTick: tick, accepted: false, rejection };
}
