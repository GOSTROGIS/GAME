import { Callbacks, Client, type Room } from "./colyseus-browser";
import {
  normalizeAppearanceV2,
  validateCombatEventBatchForAudienceV1,
  validateAuthenticatedCharacterV1,
  validatePrivateActorResourcesV1,
  validateEncounterClientStateV1,
  validateTurnEncounterCommandAck,
  validateTurnPlanAck,
  validateTurnPlanRequest,
  validateTurnEncounterProjectionClearV1,
  type AppearanceV2,
  type CombatEventV1,
  type EncounterClientStateV1,
  type EcologyProofActionKind,
  type EcologyProofAuthorityState,
  type EncounterViewerState,
  type TurnEncounterCommandAck,
  type TurnPlanAck,
  type TurnPlanRequest,
  type PrivateActorResourcesV1,
} from "@hollow-march/shared";
import { mergeCombatEvents, type TurnEncounterProjection } from "../turn/TurnCombatModel.js";
import { buildTurnEncounterJoinRequest, buildTurnEncounterStartRequest, buildTurnEncounterWithdrawRequest, turnClientConsumesWorldInput, turnClientInputEnabled } from "../turn/TurnClientProtocol.js";

const SAFE_ENDPOINT_PROTOCOLS = new Set(["http:", "https:", "ws:", "wss:"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

interface EndpointPolicyOptions {
  development?: boolean;
  pageUrl?: string;
}

const isSameOriginEndpoint = (endpoint: URL, page: URL) => {
  const protocolMatches = endpoint.protocol === page.protocol
    || (page.protocol === "http:" && endpoint.protocol === "ws:")
    || (page.protocol === "https:" && endpoint.protocol === "wss:");
  return protocolMatches && endpoint.host === page.host;
};

export function resolveSharedWorldEndpoint(requested?: string | null, options: EndpointPolicyOptions = {}) {
  const development = options.development ?? import.meta.env.DEV;
  const page = new URL(options.pageUrl ?? location.href);
  const productionEndpoint = page.origin;
  const fallback = development ? "http://127.0.0.1:2567" : productionEndpoint;
  if (!requested?.trim()) return fallback;

  const endpoint = new URL(requested, page);
  if (!SAFE_ENDPOINT_PROTOCOLS.has(endpoint.protocol)) throw new Error(`Unsupported shared-world endpoint protocol: ${endpoint.protocol}`);
  if (endpoint.username || endpoint.password) throw new Error("Shared-world endpoints cannot contain credentials");
  const trusted = isSameOriginEndpoint(endpoint, page) || (development && LOOPBACK_HOSTS.has(endpoint.hostname));
  if (!trusted) throw new Error(`Untrusted shared-world endpoint: ${endpoint.origin}`);

  // Production always uses the page origin, even when an equivalent same-origin
  // endpoint was supplied. This prevents query parameters from changing paths.
  return development ? endpoint.href.replace(/\/$/, "") : productionEndpoint;
}

export interface RemoteActor {
  sessionId: string;
  transform: { x: number; y: number; z: number; yaw: number };
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  focus: number;
  maxFocus: number;
  appearanceSignature: string;
  appearanceJson: string;
  appearance: AppearanceV2;
  equipmentVisualIds: string[];
  locomotion: string;
}

interface ActionAckDebug {
  commandId: string;
  sequence: number;
  serverTick: number;
  accepted: boolean;
  rejection: string | null;
  impactTick: number | null;
}

export interface SharedTarget {
  id: string;
  kind: "enemy" | "interactable";
  transform: { x: number; y: number; z: number };
  definitionId: string;
  hp: number;
  maxHp: number;
  locomotion: string;
}

interface NetworkDebugSnapshot {
  phase: "idle" | "connecting" | "connected" | "failed" | "disconnected";
  lastConnectionError: string | null;
  connected: boolean;
  roomId: string | null;
  sessionId: string | null;
  localActor: Readonly<{
    sessionId: string;
    transform: Readonly<RemoteActor["transform"]>;
    vitals: Readonly<Pick<RemoteActor, "hp" | "maxHp" | "stamina" | "maxStamina" | "focus" | "maxFocus">>;
    appearanceSignature: string;
    appearance: Readonly<AppearanceV2>;
    equipmentVisualIds: readonly string[];
  }> | null;
  remoteCount: number;
  remoteActors: readonly Readonly<{ sessionId: string; transform: Readonly<RemoteActor["transform"]>; appearanceSignature: string; appearance: Readonly<AppearanceV2>; equipmentVisualIds: readonly string[] }>[];
  serverEnemiesCount: number;
  serverInteractablesCount: number;
  serverEnemies: readonly Readonly<Pick<SharedTarget, "id" | "definitionId" | "hp" | "maxHp" | "locomotion">>[];
  lastActionAck: Readonly<ActionAckDebug> | null;
  turnEncounterId: string | null;
  turnPhase: EncounterClientStateV1["publicState"]["phase"] | null;
  turnViewerMode: EncounterViewerState["mode"] | null;
  lastTurnPlanAck: Readonly<TurnPlanAck> | null;
  lastTurnCommandAck: Readonly<TurnEncounterCommandAck> | null;
  turnProtocolError: string | null;
  inputsSuppressed: boolean;
  authenticatedCharacterId: string | null;
}

declare global {
  interface Window { __HOLLOW_MARCH_NETWORK__?: Readonly<NetworkDebugSnapshot> }
}

export class SharedWorldClient {
  readonly actors = new Map<string, RemoteActor>();
  private readonly serverEnemyTargets = new Map<string, SharedTarget>();
  private readonly serverInteractableTargets = new Map<string, SharedTarget>();
  private client: InstanceType<typeof Client>;
  private room: Room | null = null;
  private sequence = 0;
  private inputTimer = 0;
  private readonly keys = new Set<string>();
  private connectedAt = 0;
  private inputEnabled = false;
  private inputRequested = false;
  private disposed = false;
  private phase: NetworkDebugSnapshot["phase"] = "idle";
  private lastConnectionError: string | null = null;
  private readonly disconnectListeners = new Set<() => void>();
  private readonly ecologyProofListeners = new Set<(state: EcologyProofAuthorityState) => void>();
  private readonly turnEncounterListeners = new Set<(projection: TurnEncounterProjection | null) => void>();
  private lastActionAck: Readonly<ActionAckDebug> | null = null;
  private turnClientState: EncounterClientStateV1 | null = null;
  private turnEvents: readonly CombatEventV1[] = Object.freeze([]);
  private lastTurnPlanAck: Readonly<TurnPlanAck> | null = null;
  private lastTurnCommandAck: Readonly<TurnEncounterCommandAck> | null = null;
  private turnProtocolError: string | null = null;
  private requestedCharacterId: string | null = null;
  private authenticatedCharacterId: string | null = null;
  private privateResources: PrivateActorResourcesV1 | null = null;
  private debugPublishQueued = false;

  constructor(endpoint = resolveSharedWorldEndpoint()) {
    this.client = new Client(endpoint);
    this.publishDebug();
  }

  async connect(options: { sessionToken?: string; characterId?: string; appearance?: AppearanceV2 } = {}) {
    if (this.disposed) throw new Error("Shared-world client has been disposed");
    this.phase = "connecting";
    this.lastConnectionError = null;
    this.requestedCharacterId = options.characterId ?? null;
    this.authenticatedCharacterId = null;
    this.privateResources = null;
    this.publishDebug();
    let room: Room;
    try {
      room = await this.client.joinOrCreate("hearthmere", options);
    } catch (error) {
      this.phase = "failed";
      this.lastConnectionError = error instanceof Error ? error.message : String(error);
      this.publishDebug();
      throw error;
    }
    if (this.disposed) {
      await room.leave();
      this.phase = "disconnected";
      this.publishDebug();
      return;
    }
    this.room = room;
    this.phase = "connected";
    room.onLeave(() => {
      if (this.room !== room) return;
      this.room = null;
      this.phase = "disconnected";
      this.privateResources = null;
      this.keys.clear();
      this.inputEnabled = false;
      this.detachInputListeners();
      this.actors.clear();
      this.serverEnemyTargets.clear();
      this.serverInteractableTargets.clear();
      this.markTurnReconnecting();
      this.publishDebug();
      this.notifyDisconnected();
    });
    this.connectedAt = performance.now();
    const callbacks = Callbacks.get(room);
    callbacks.onAdd("players", (player: any, key: unknown) => {
      const sessionId = String(key);
      this.captureActor(sessionId, player);
      callbacks.onChange(player, () => this.captureActor(sessionId, player));
      if (player.transform) callbacks.onChange(player.transform, () => this.captureActor(sessionId, player));
      if (player.vitals) callbacks.onChange(player.vitals, () => this.captureActor(sessionId, player));
      if (player.equipmentVisualIds) callbacks.onChange(player.equipmentVisualIds, () => this.captureActor(sessionId, player));
    });
    callbacks.onRemove("players", (_player: any, key: unknown) => {
      this.actors.delete(String(key));
      this.scheduleDebugPublish();
    });
    callbacks.onAdd("enemies", (enemy: any, key: unknown) => {
      const id = String(key); this.captureTarget(this.serverEnemyTargets, id, enemy, "enemy");
      callbacks.onChange(enemy, () => this.captureTarget(this.serverEnemyTargets, id, enemy, "enemy"));
      if (enemy.transform) callbacks.onChange(enemy.transform, () => this.captureTarget(this.serverEnemyTargets, id, enemy, "enemy"));
      if (enemy.vitals) callbacks.onChange(enemy.vitals, () => this.captureTarget(this.serverEnemyTargets, id, enemy, "enemy"));
    });
    callbacks.onRemove("enemies", (_enemy: any, key: unknown) => { this.serverEnemyTargets.delete(String(key)); this.scheduleDebugPublish(); });
    callbacks.onAdd("interactables", (interactable: any, key: unknown) => {
      const id = String(key); this.captureTarget(this.serverInteractableTargets, id, interactable, "interactable");
      callbacks.onChange(interactable, () => this.captureTarget(this.serverInteractableTargets, id, interactable, "interactable"));
      if (interactable.transform) callbacks.onChange(interactable.transform, () => this.captureTarget(this.serverInteractableTargets, id, interactable, "interactable"));
    });
    callbacks.onRemove("interactables", (_interactable: any, key: unknown) => { this.serverInteractableTargets.delete(String(key)); this.scheduleDebugPublish(); });
    room.onMessage("action_ack", (payload: unknown) => {
      const ack = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      this.lastActionAck = Object.freeze({
        commandId: String(ack.commandId ?? ""),
        sequence: Number(ack.sequence) || 0,
        serverTick: Number(ack.serverTick) || 0,
        accepted: ack.accepted === true,
        rejection: typeof ack.rejection === "string" ? ack.rejection : null,
        impactTick: Number.isFinite(ack.impactTick) ? Number(ack.impactTick) : null,
      });
      this.publishDebug();
    });
    room.onMessage("ecology_proof_state", (payload: unknown) => this.captureEcologyProofState(payload));
    room.onMessage("ecology_proof_ack", (payload: unknown) => {
      if (payload && typeof payload === "object" && "state" in payload) this.captureEcologyProofState((payload as { state?: unknown }).state);
    });
    room.onMessage("authenticated_character", (payload: unknown) => this.captureAuthenticatedCharacter(payload));
    room.onMessage("private_actor_resources", (payload: unknown) => this.capturePrivateActorResources(payload));
    room.onMessage("turn_encounter_ack", (payload: unknown) => this.captureTurnEncounterAck(payload));
    room.onMessage("turn_plan_ack", (payload: unknown) => this.captureTurnPlanAck(payload));
    room.onMessage("turn_encounter_state", (payload: unknown) => this.captureTurnEncounterState(payload));
    room.onMessage("turn_encounter_clear", (payload: unknown) => this.captureTurnEncounterClear(payload));
    room.onMessage("turn_combat_events", (payload: unknown) => this.captureTurnCombatEvents(payload));
    addEventListener("keydown", this.keyDown); addEventListener("keyup", this.keyUp); addEventListener("blur", this.suspendInput); document.addEventListener("visibilitychange", this.visibilityChanged);
    this.inputTimer = window.setInterval(() => this.sendInput(), 50);
    this.scheduleDebugPublish();
    dispatchEvent(new CustomEvent("shared-world-connected", { detail: this.debug() }));
  }

  private captureActor(sessionId: string, player: any) {
    const transform = player.transform ?? {};
    const vitals = player.vitals ?? {};
    const appearanceJson = typeof player.appearanceJson === "string" ? player.appearanceJson : "";
    let appearanceSource: unknown;
    try { appearanceSource = appearanceJson ? JSON.parse(appearanceJson) : undefined; } catch { appearanceSource = undefined; }
    const appearance = normalizeAppearanceV2(appearanceSource);
    const equipmentVisualIds = player.equipmentVisualIds && Symbol.iterator in Object(player.equipmentVisualIds)
      ? Array.from(player.equipmentVisualIds as Iterable<unknown>, (id) => String(id)).filter(Boolean)
      : Object.values(appearance.equippedVisualIds).filter((id): id is string => Boolean(id));
    const ownerResources = sessionId === this.room?.sessionId && this.privateResources?.actorId === sessionId ? this.privateResources : null;
    this.actors.set(sessionId, {
      sessionId,
      transform: { x: Number(transform.x) || 0, y: Number(transform.y) || 0, z: Number(transform.z) || 0, yaw: Number(transform.yaw) || 0 },
      hp: Number(vitals.health ?? vitals.hp) || 0,
      maxHp: Number(vitals.maxHealth ?? vitals.maxHp) || 1,
      stamina: ownerResources?.stamina ?? 0,
      maxStamina: ownerResources?.maxStamina ?? 1,
      focus: ownerResources?.focus ?? 0,
      maxFocus: ownerResources?.maxFocus ?? 1,
      appearanceSignature: String(player.appearanceSignature ?? ""),
      appearanceJson,
      appearance,
      equipmentVisualIds,
      locomotion: String(player.locomotion ?? "idle"),
    });
    this.scheduleDebugPublish();
  }

  private captureTarget(targets: Map<string, SharedTarget>, id: string, source: any, kind: SharedTarget["kind"]) {
    const transform = source?.transform ?? {};
    const vitals = source?.vitals ?? {};
    targets.set(id, {
      id, kind,
      transform: { x: Number(transform.x) || 0, y: Number(transform.y) || 0, z: Number(transform.z) || 0 },
      definitionId: String(source?.definitionId ?? ""),
      hp: Number(vitals.health) || 0,
      maxHp: Number(vitals.maxHealth) || 1,
      locomotion: String(source?.locomotion ?? "idle"),
    });
    this.scheduleDebugPublish();
  }

  private keyDown = (event: KeyboardEvent) => {
    if (!this.inputEnabled) return;
    const before = this.keys.size; this.keys.add(event.key.toLowerCase());
    if (this.keys.size !== before) this.sendInput();
  };
  private keyUp = (event: KeyboardEvent) => {
    const removed = this.keys.delete(event.key.toLowerCase());
    if (removed && this.inputEnabled) this.sendInput();
  };
  private suspendInput = () => { this.setInputEnabled(false); };
  private visibilityChanged = () => { if (document.visibilityState !== "visible") this.setInputEnabled(false); };

  setInputEnabled(enabled: boolean) {
    this.inputRequested = enabled;
    this.applyInputEnabled();
  }

  private applyInputEnabled() {
    const next = turnClientInputEnabled(this.inputRequested, this.turnClientState, document.visibilityState === "visible", document.hasFocus());
    if (next === this.inputEnabled) {
      if (!next) this.keys.clear();
      return;
    }
    const shouldSendStop = this.inputEnabled || this.keys.size > 0;
    this.inputEnabled = next;
    if (!next) {
      this.keys.clear();
      if (shouldSendStop) this.sendInputFrame(0, 0, false);
    }
    this.publishDebug();
  }

  private sendInput() {
    if (!this.room || !this.inputEnabled) return;
    const moveX = (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) - (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
    const moveZ = (this.keys.has("s") || this.keys.has("arrowdown") ? 1 : 0) - (this.keys.has("w") || this.keys.has("arrowup") ? 1 : 0);
    this.sendInputFrame(moveX, moveZ, this.keys.has("shift"));
  }

  private sendInputFrame(moveX: number, moveZ: number, sprint: boolean) {
    this.room?.send("input", { sequence: ++this.sequence, clientTick: Math.floor(performance.now()), moveX, moveZ, yaw: 0, sprint });
  }

  requestTravel(x: number, z: number) {
    if (!this.room || !this.inputEnabled || this.turnConsumesWorldInput) return false;
    this.room.send("travel", { sequence: ++this.sequence, clientTick: Math.floor(performance.now()), destination: { x, y: 0, z, yaw: 0 } });
    return true;
  }

  requestAction(kind: "light_attack" | "heavy_attack" | "dodge" | "interact", targetId?: string) {
    if (!this.room || !this.inputEnabled || this.turnConsumesWorldInput) return false;
    this.room.send("action", { commandId: crypto.randomUUID(), sequence: ++this.sequence, clientTick: Math.floor(performance.now()), kind, targetId });
    return true;
  }

  beginEcologyProof(encounterId: string) {
    if (!this.room) return false;
    this.room.send("ecology_proof_start", { encounterId });
    return true;
  }

  requestEcologyProofAction(encounterId: string, kind: EcologyProofActionKind) {
    if (!this.room) return false;
    this.room.send("ecology_proof_action", { commandId: crypto.randomUUID(), sequence: ++this.sequence, clientTick: Math.floor(performance.now()), encounterId, kind });
    return true;
  }

  onEcologyProofState(listener: (state: EcologyProofAuthorityState) => void) {
    this.ecologyProofListeners.add(listener);
    return () => this.ecologyProofListeners.delete(listener);
  }

  onTurnEncounter(listener: (projection: TurnEncounterProjection | null) => void) {
    this.turnEncounterListeners.add(listener);
    listener(this.turnProjection);
    return () => this.turnEncounterListeners.delete(listener);
  }

  submitTurnPlan(request: TurnPlanRequest) {
    if (!this.room || !this.turnClientState || request.encounterId !== this.turnClientState.publicState.encounterId || request.characterId !== this.authenticatedCharacterId) return false;
    try { validateTurnPlanRequest(request); }
    catch (error) { this.captureTurnProtocolError(error); return false; }
    this.room.send("turn_plan", request);
    return true;
  }

  withdrawFromTurnEncounter(commandId = crypto.randomUUID()) {
    const projection = this.turnProjection;
    if (!this.room || !projection || !this.authenticatedCharacterId || projection.state.viewerState.characterId !== this.authenticatedCharacterId || !projection.state.viewerState.canWithdraw) return false;
    const request = buildTurnEncounterWithdrawRequest(this.authenticatedCharacterId, projection.state.publicState.encounterId, commandId);
    this.room.send("turn_withdraw", request);
    return true;
  }

  startTurnEncounter(enemyActorIds: readonly string[], commandId = crypto.randomUUID()) {
    if (!this.room || !this.authenticatedCharacterId || this.turnConsumesWorldInput) return false;
    let request;
    try { request = buildTurnEncounterStartRequest(this.authenticatedCharacterId, enemyActorIds, commandId); }
    catch (error) { this.captureTurnProtocolError(error); return false; }
    this.room.send("turn_encounter_start", request);
    return true;
  }

  joinTurnEncounter(encounterId: string, commandId = crypto.randomUUID()) {
    if (!this.room || !this.authenticatedCharacterId || this.turnConsumesWorldInput) return false;
    let request;
    try { request = buildTurnEncounterJoinRequest(this.authenticatedCharacterId, encounterId, commandId); }
    catch (error) { this.captureTurnProtocolError(error); return false; }
    this.room.send("turn_encounter_join", request);
    return true;
  }

  nearestTargetId(kind: "light_attack" | "heavy_attack" | "dodge" | "interact"): string | undefined {
    const local = this.localActor;
    if (!local || kind === "dodge") return undefined;
    const targets = kind === "interact" ? this.serverInteractableTargets.values() : this.serverEnemyTargets.values();
    let nearest: SharedTarget | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const target of targets) {
      if (target.kind === "enemy" && (target.hp <= 0 || target.locomotion === "dead")) continue;
      const distance = Math.hypot(target.transform.x - local.transform.x, target.transform.y - local.transform.y, target.transform.z - local.transform.z);
      if (distance < nearestDistance) { nearest = target; nearestDistance = distance; }
    }
    return nearest?.id;
  }

  get localActor() { return this.room ? this.actors.get(this.room.sessionId) ?? null : null; }
  get remoteActors() { return this.room ? [...this.actors.values()].filter((actor) => actor.sessionId !== this.room!.sessionId) : []; }
  get serverEnemies() { return [...this.serverEnemyTargets.values()]; }
  get connected() { return Boolean(this.room); }
  get lastTurnError() { return this.turnProtocolError; }
  get lastTurnPlanAcknowledgement() { return this.lastTurnPlanAck; }
  get turnProjection(): TurnEncounterProjection | null {
    return this.turnClientState ? Object.freeze({ state: this.turnClientState, events: this.turnEvents }) : null;
  }
  get turnConsumesWorldInput() {
    return turnClientConsumesWorldInput(this.turnClientState);
  }

  onDisconnect(listener: () => void) {
    this.disconnectListeners.add(listener);
    return () => this.disconnectListeners.delete(listener);
  }

  private notifyDisconnected() {
    for (const listener of this.disconnectListeners) listener();
  }

  private captureEcologyProofState(payload: unknown) {
    if (!payload || typeof payload !== "object") return;
    const candidate = payload as Partial<EcologyProofAuthorityState>;
    if (typeof candidate.encounterId !== "string" || typeof candidate.mechanicHandlerId !== "string" || !Number.isFinite(candidate.revision)) return;
    for (const listener of this.ecologyProofListeners) listener(candidate as EcologyProofAuthorityState);
  }

  private captureAuthenticatedCharacter(payload: unknown) {
    try {
      validateAuthenticatedCharacterV1(payload);
      if (this.requestedCharacterId && this.requestedCharacterId !== payload.characterId) throw new Error("authenticated_character does not match the requested character identity");
      if (this.authenticatedCharacterId && this.authenticatedCharacterId !== payload.characterId) throw new Error("authenticated_character cannot replace the selected character identity");
      this.authenticatedCharacterId = payload.characterId;
      this.turnProtocolError = null;
      this.publishDebug();
      dispatchEvent(new CustomEvent("authenticated-character-ready", { detail: Object.freeze({ characterId: payload.characterId }) }));
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private capturePrivateActorResources(payload: unknown) {
    try {
      validatePrivateActorResourcesV1(payload);
      if (!this.authenticatedCharacterId || payload.characterId !== this.authenticatedCharacterId) throw new Error("private_actor_resources character does not match the authenticated client");
      if (!this.room || payload.actorId !== this.room.sessionId) throw new Error("private_actor_resources actor does not match the local room session");
      this.privateResources = frozenClone(payload);
      const actor = this.actors.get(payload.actorId);
      if (actor) {
        actor.stamina = payload.stamina;
        actor.maxStamina = payload.maxStamina;
        actor.focus = payload.focus;
        actor.maxFocus = payload.maxFocus;
      }
      this.turnProtocolError = null;
      this.publishDebug();
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private captureTurnEncounterAck(payload: unknown) {
    try {
      validateTurnEncounterCommandAck(payload);
      if (this.authenticatedCharacterId && payload.characterId !== this.authenticatedCharacterId) {
        throw new Error("turn_encounter_ack character does not match the authenticated client");
      }
      this.lastTurnCommandAck = frozenClone(payload);
      this.turnProtocolError = payload.accepted ? null : `Encounter ${payload.kind} rejected: ${payload.rejection ?? "unknown rejection"}`;
      this.publishDebug();
      this.notifyTurnEncounter();
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private captureTurnPlanAck(payload: unknown) {
    try {
      validateTurnPlanAck(payload);
      if (!this.turnClientState) throw new Error("turn_plan_ack arrived without an encounter state");
      if (payload.encounterId !== this.turnClientState.publicState.encounterId) throw new Error("turn_plan_ack encounter does not match the active projection");
      if (payload.characterId !== this.turnClientState.viewerState.characterId || (this.authenticatedCharacterId && payload.characterId !== this.authenticatedCharacterId)) {
        throw new Error("turn_plan_ack character does not match the authenticated viewer");
      }
      this.lastTurnPlanAck = frozenClone(payload);
      this.turnProtocolError = payload.accepted ? null : `Plan rejected: ${payload.rejection ?? "unknown rejection"}`;
      this.publishDebug();
      this.notifyTurnEncounter();
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private captureTurnEncounterState(payload: unknown) {
    try {
      validateEncounterClientStateV1(payload);
      const state = frozenClone(payload);
      if (state.viewerState.characterId) {
        if (!this.authenticatedCharacterId) throw new Error("turn_encounter_state arrived before authenticated_character");
        if (state.viewerState.characterId !== this.authenticatedCharacterId) throw new Error("turn_encounter_state character does not match the authenticated client");
      }
      if (this.turnClientState?.publicState.encounterId !== state.publicState.encounterId) {
        this.turnEvents = Object.freeze([]);
        this.lastTurnPlanAck = null;
      }
      this.turnClientState = state;
      this.turnProtocolError = null;
      this.applyInputEnabled();
      this.publishDebug();
      this.notifyTurnEncounter();
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private captureTurnCombatEvents(payload: unknown) {
    try {
      if (!this.turnClientState) throw new Error("turn_combat_events arrived without an encounter state");
      const audience = this.turnClientState.viewerState.mode === "spectator"
        ? { mode: "spectator" as const, viewerActorId: null }
        : { mode: "participant" as const, viewerActorId: this.turnClientState.participantState!.actorId };
      validateCombatEventBatchForAudienceV1(payload, audience);
      const events = frozenClone(payload);
      if (events[0] && events[0].encounterId !== this.turnClientState.publicState.encounterId) throw new Error("turn_combat_events encounter does not match the active projection");
      this.turnEvents = mergeCombatEvents(this.turnEvents, events, this.turnClientState.publicState.encounterId);
      this.turnProtocolError = null;
      this.publishDebug();
      this.notifyTurnEncounter();
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private captureTurnEncounterClear(payload: unknown) {
    try {
      validateTurnEncounterProjectionClearV1(payload);
      if (this.turnClientState?.viewerState.mode === "spectator" && this.turnClientState.publicState.encounterId === payload.encounterId) {
        this.turnClientState = null;
        this.turnEvents = Object.freeze([]);
        this.lastTurnPlanAck = null;
        this.applyInputEnabled();
        this.publishDebug();
        this.notifyTurnEncounter();
      }
    } catch (error) { this.captureTurnProtocolError(error); }
  }

  private markTurnReconnecting() {
    if (!this.turnClientState || this.turnClientState.viewerState.mode === "spectator" || !this.turnClientState.participantState) return;
    this.turnClientState = Object.freeze({
      ...this.turnClientState,
      viewerState: Object.freeze({ ...this.turnClientState.viewerState, mode: "reconnecting", canPlan: false, canWithdraw: false }),
    });
    this.notifyTurnEncounter();
  }

  private captureTurnProtocolError(error: unknown) {
    this.turnProtocolError = error instanceof Error ? error.message : String(error);
    console.warn("Turn protocol projection rejected", error);
    this.publishDebug();
    this.notifyTurnEncounter();
  }

  private notifyTurnEncounter() {
    const projection = this.turnProjection;
    for (const listener of this.turnEncounterListeners) listener(projection);
  }

  private scheduleDebugPublish() {
    if (this.debugPublishQueued) return;
    this.debugPublishQueued = true;
    queueMicrotask(() => {
      this.debugPublishQueued = false;
      this.publishDebug();
    });
  }

  private publishDebug() {
    const actor = this.localActor;
    const freezeAppearance = (appearance: AppearanceV2): Readonly<AppearanceV2> => Object.freeze({
      ...appearance,
      morphs: Object.freeze({ ...appearance.morphs }),
      plague: Object.freeze({ ...appearance.plague }),
      equippedVisualIds: Object.freeze({ ...appearance.equippedVisualIds }),
    });
    const localActor = actor ? Object.freeze({
      sessionId: actor.sessionId,
      transform: Object.freeze({ ...actor.transform }),
      vitals: Object.freeze({ hp: actor.hp, maxHp: actor.maxHp, stamina: actor.stamina, maxStamina: actor.maxStamina, focus: actor.focus, maxFocus: actor.maxFocus }),
      appearanceSignature: actor.appearanceSignature,
      appearance: freezeAppearance(actor.appearance),
      equipmentVisualIds: Object.freeze([...actor.equipmentVisualIds]),
    }) : null;
    const remoteActors = Object.freeze(this.remoteActors.map((remote) => Object.freeze({ sessionId: remote.sessionId, transform: Object.freeze({ ...remote.transform }), appearanceSignature: remote.appearanceSignature, appearance: freezeAppearance(remote.appearance), equipmentVisualIds: Object.freeze([...remote.equipmentVisualIds]) })));
    window.__HOLLOW_MARCH_NETWORK__ = Object.freeze({
      phase: this.phase,
      lastConnectionError: this.lastConnectionError,
      connected: this.connected,
      roomId: this.room?.roomId ?? null,
      sessionId: this.room?.sessionId ?? null,
      localActor,
      remoteCount: this.remoteActors.length,
      remoteActors,
      serverEnemiesCount: this.serverEnemyTargets.size,
      serverInteractablesCount: this.serverInteractableTargets.size,
      serverEnemies: Object.freeze(this.serverEnemies.map(({ id, definitionId, hp, maxHp, locomotion }) => Object.freeze({ id, definitionId, hp, maxHp, locomotion }))),
      lastActionAck: this.lastActionAck,
      turnEncounterId: this.turnClientState?.publicState.encounterId ?? null,
      turnPhase: this.turnClientState?.publicState.phase ?? null,
      turnViewerMode: this.turnClientState?.viewerState.mode ?? null,
      lastTurnPlanAck: this.lastTurnPlanAck,
      lastTurnCommandAck: this.lastTurnCommandAck,
      turnProtocolError: this.turnProtocolError,
      inputsSuppressed: !this.inputEnabled,
      authenticatedCharacterId: this.authenticatedCharacterId,
    });
  }

  private detachInputListeners() {
    clearInterval(this.inputTimer);
    removeEventListener("keydown", this.keyDown);
    removeEventListener("keyup", this.keyUp);
    removeEventListener("blur", this.suspendInput);
    document.removeEventListener("visibilitychange", this.visibilityChanged);
  }

  debug() { return { phase: this.phase, connected: this.connected, roomId: this.room?.roomId ?? null, sessionId: this.room?.sessionId ?? null, actorCount: this.actors.size, connectedForMs: this.connectedAt ? performance.now() - this.connectedAt : 0 }; }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.setInputEnabled(false);
    this.detachInputListeners();
    const room = this.room;
    this.room = null;
    this.phase = "disconnected";
    if (room) await room.leave();
    this.actors.clear();
    this.serverEnemyTargets.clear();
    this.serverInteractableTargets.clear();
    this.requestedCharacterId = null;
    this.authenticatedCharacterId = null;
    this.privateResources = null;
    this.turnClientState = null;
    this.turnEvents = Object.freeze([]);
    this.lastTurnPlanAck = null;
    this.lastTurnCommandAck = null;
    this.notifyTurnEncounter();
    this.publishDebug();
    this.notifyDisconnected();
    this.disconnectListeners.clear();
    this.ecologyProofListeners.clear();
    this.turnEncounterListeners.clear();
  }
}

function frozenClone<T>(value: T): T {
  const clone = structuredClone(value);
  const freeze = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== "object" || Object.isFrozen(candidate)) return;
    for (const nested of Object.values(candidate)) freeze(nested);
    Object.freeze(candidate);
  };
  freeze(clone);
  return clone;
}
