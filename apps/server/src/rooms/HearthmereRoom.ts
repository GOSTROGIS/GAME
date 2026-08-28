import { CloseCode, Room, ServerError, type AuthContext, type Client } from "@colyseus/core";
import {
  DEFAULT_APPEARANCE_V2, NETWORK_PROTOCOL_VERSION, appearanceSignature, MAX_ACTIONS_PER_SECOND, MAX_INPUTS_PER_SECOND, PATCH_HZ, PHASES,
  SIMULATION_HZ, composePhaseMask, normalizeAppearanceV2, validateAppearanceV2, validateTurnEncounterStartRequest, validateTurnEventCursorRequest,
  validateAuthenticatedCharacterV1, ACTIVE_ENCOUNTER_DURABILITY, HEARTHMERE_LOCAL_METERS, HEARTHMERE_SPATIAL_CONTEXT, SERVER_SAVE_V6_DEFAULTS,
  isServerSaveV6,
  projectCombatEventBatchForAudienceV1,
  validatePrivateActorResourcesV1,
  validateTurnEncounterProjectionClearV1,
  type AppearanceV2, type AuthenticatedCharacterV1, type HearthmereJoinOptions, type PrivateActorResourcesV1, type ServerSaveV6, type TurnEncounterCommandAck, type TurnEventCursorAck, type TurnPlanAck,
} from "@hollow-march/shared";
import { parseCookie } from "../auth/service.js";
import { TokenBucket } from "../auth/rate-limit.js";
import type { CharacterRecord } from "../persistence/types.js";
import { metrics } from "../telemetry/metrics.js";
import { canonicalAnchorTransform, canonicalEnemySpawns, canonicalPublicInteractionAnchors } from "../world/hearthmere.js";
import { validateWalkableDestination, validateWalkablePath } from "@hearthmere/content/runtime";
import { ACTIVE_TECHNIQUE_BY_ID } from "@hearthmere/content/turn-combat";
import { AuthorityKernel } from "./authority.js";
import { EcologyProofAuthorityKernel } from "./ecologyProofAuthority.js";
import { TurnEncounterManager, type TurnWorldEnemy, type TurnWorldPlayer } from "./turnEncounterManager.js";
import { TurnEncounterSettlementService } from "./turnSettlement.js";
import { roomDependencies } from "./dependencies.js";
import {
  ActorState, EnemyState, HearthmereState, PublicInteractableState, TransformState,
  TurnEncounterParticipantSummaryState, TurnEncounterSummaryState, equipmentIds,
} from "./schema/HearthmereState.js";

export interface RoomAuth { accountId: string; character: CharacterRecord | null; guest: boolean; appearance: AppearanceV2 }
type HearthmereClient = Client<{ userData: { characterId: string | null }; auth: RoomAuth }>;

/** Synchronous claim closes the await gap between onAuth and onJoin. */
export class CharacterSessionReservations {
  readonly #byCharacter = new Map<string, string>();
  claim(characterId: string, sessionId: string): boolean {
    const existing = this.#byCharacter.get(characterId);
    if (existing && existing !== sessionId) return false;
    this.#byCharacter.set(characterId, sessionId);
    return true;
  }
  sessionFor(characterId: string): string | null { return this.#byCharacter.get(characterId) ?? null; }
  releaseSession(sessionId: string): void {
    for (const [characterId, reservedSession] of this.#byCharacter) if (reservedSession === sessionId) this.#byCharacter.delete(characterId);
  }
  clear(): void { this.#byCharacter.clear(); }
}

export const MAX_APPEARANCE_JSON_BYTES = 4_096;

export class HearthmereRoom extends Room<{ state: HearthmereState }> {
  override state = new HearthmereState();
  override maxClients = 50;
  readonly authority = new AuthorityKernel();
  readonly ecologyProofAuthority = new EcologyProofAuthorityKernel();
  turnEncounters!: TurnEncounterManager;
  #inputLimits = new Map<string, TokenBucket>();
  #actionLimits = new Map<string, TokenBucket>();
  #characterSessions = new CharacterSessionReservations();
  #spectatorEncounterBySession = new Map<string, string>();

  override onCreate(): void {
    this.state.shardId = this.roomId;
    this.setPatchRate(1000 / PATCH_HZ);
    this.setSimulationInterval((deltaMilliseconds) => this.simulate(deltaMilliseconds), 1000 / SIMULATION_HZ);
    seedHearthmerePublicState(this.state, this.authority);
    const settlement = new TurnEncounterSettlementService(roomDependencies().turnPersistence);
    this.turnEncounters = new TurnEncounterManager({
      shardId: this.roomId,
      settle: async (input) => {
        await settlement.settle(input);
        await this.refreshSettledCharacters(input.characters.map(({ characterId }) => characterId));
      },
      canTraverse: ({ fromMm, toMm }) => turnPathIsClear(fromMm, toMm),
      hasLineOfSight: ({ sourceMm, targetMm }) => turnPathIsClear(sourceMm, targetMm),
      canEngage: (player, enemy) => turnPathIsClear(player.positionMm, enemy.positionMm),
      canJoinBattlefield: (player, positions) => positions.some((position) => turnPathIsClear(player.positionMm, position)),
      applyEnemyResult: (result) => this.applyTurnEnemyResult(result),
      applyPlayerResult: (characterId, result) => this.applyTurnPlayerResult(characterId, result),
      restoreEnemy: (snapshot) => this.restoreTurnEnemy(snapshot),
      onState: (encounter) => queueMicrotask(() => this.publishTurnEncounter(encounter.encounterId)),
      onEvents: (encounterId, events) => this.publishTurnEvents(encounterId, events),
      onEncounterDisposed: (encounterId) => this.state.turnEncounters.delete(encounterId),
    });
    this.onMessage("input", (client: HearthmereClient, payload: unknown) => {
      if (!this.#inputLimits.get(client.sessionId)?.take()) { metrics.increment("hearthmere_rejected_messages_total", { type: "input", reason: "rate_limit" }); return; }
      if (!this.authority.receiveInput(client.sessionId, payload)) metrics.increment("hearthmere_rejected_messages_total", { type: "input", reason: "validation" });
    });
    this.onMessage("travel", (client: HearthmereClient, payload: unknown) => {
      if (!this.#inputLimits.get(client.sessionId)?.take()) { metrics.increment("hearthmere_rejected_messages_total", { type: "travel", reason: "rate_limit" }); return; }
      if (!this.authority.receiveTravel(client.sessionId, payload)) metrics.increment("hearthmere_rejected_messages_total", { type: "travel", reason: "validation" });
    });
    this.onMessage("action", (client: HearthmereClient, payload: unknown) => {
      if (!this.#actionLimits.get(client.sessionId)?.take()) {
        client.send("action_ack", rateLimitAck(payload, this.authority.tick));
        metrics.increment("hearthmere_rejected_messages_total", { type: "action", reason: "rate_limit" }); return;
      }
      const ack = this.authority.receiveAction(client.sessionId, payload);
      client.send("action_ack", ack);
      metrics.increment("hearthmere_actions_total", { kind: safeActionKind(payload), accepted: String(ack.accepted) });
    });
    this.onMessage("turn_encounter_start", (client: HearthmereClient, payload: unknown) => {
      const characterId = client.userData?.characterId;
      if (!characterId) { client.send("turn_encounter_ack", unauthenticatedEncounterAck("start", payload)); return; }
      if (!this.#actionLimits.get(client.sessionId)?.take()) { client.send("turn_encounter_ack", rateLimitedEncounterAck("start", payload, characterId)); return; }
      const actor = this.state.players.get(client.sessionId);
      let enemyIds: readonly string[] = [];
      try { validateTurnEncounterStartRequest(payload); enemyIds = payload.enemyActorIds; } catch { /* manager returns a versioned deterministic rejection */ }
      const enemies = enemyIds.map((id) => this.state.enemies.get(id)).filter((entry): entry is EnemyState => Boolean(entry)).map(turnEnemyFromState);
      const ack = actor ? this.turnEncounters.start(payload, turnPlayerFromState(characterId, client.sessionId, actor, client.auth?.character ?? null), enemies) : unauthenticatedEncounterAck("start", payload);
      if (ack.accepted) {
        this.authority.setActorEncounterLocked(client.sessionId, true);
        for (const enemyId of enemyIds) this.authority.setWorldTargetEncounterLeased(enemyId, true);
      }
      client.send("turn_encounter_ack", ack);
    });
    this.onMessage("turn_encounter_join", (client: HearthmereClient, payload: unknown) => {
      const characterId = client.userData?.characterId;
      if (!characterId) { client.send("turn_encounter_ack", unauthenticatedEncounterAck("join", payload)); return; }
      if (!this.#actionLimits.get(client.sessionId)?.take()) { client.send("turn_encounter_ack", rateLimitedEncounterAck("join", payload, characterId)); return; }
      const actor = this.state.players.get(client.sessionId);
      const ack = actor ? this.turnEncounters.join(payload, turnPlayerFromState(characterId, client.sessionId, actor, client.auth?.character ?? null)) : unauthenticatedEncounterAck("join", payload);
      if (ack.accepted) this.authority.setActorEncounterLocked(client.sessionId, true);
      client.send("turn_encounter_ack", ack);
    });
    this.onMessage("turn_withdraw", (client: HearthmereClient, payload: unknown) => {
      const characterId = client.userData?.characterId;
      if (characterId && !this.#actionLimits.get(client.sessionId)?.take()) { client.send("turn_encounter_ack", rateLimitedEncounterAck("withdraw", payload, characterId)); return; }
      const ack = characterId ? this.turnEncounters.withdraw(payload, characterId) : unauthenticatedEncounterAck("withdraw", payload);
      if (ack.accepted) this.authority.setActorEncounterLocked(client.sessionId, false);
      client.send("turn_encounter_ack", ack);
    });
    this.onMessage("turn_plan", (client: HearthmereClient, payload: unknown) => {
      const characterId = client.userData?.characterId;
      if (characterId && !this.#actionLimits.get(client.sessionId)?.take()) { client.send("turn_plan_ack", rateLimitedPlanAck(payload, characterId)); return; }
      const ack = characterId ? this.turnEncounters.submitPlan(payload, characterId) : unauthenticatedPlanAck(payload);
      client.send("turn_plan_ack", ack);
    });
    this.onMessage("turn_event_cursor", (client: HearthmereClient, payload: unknown) => {
      const characterId = client.userData?.characterId;
      let ack: TurnEventCursorAck;
      if (!characterId) ack = eventCursorRejection(payload, "unauthenticated", "authentication_required");
      else if (!this.#actionLimits.get(client.sessionId)?.take()) ack = eventCursorRejection(payload, characterId, "rate_limited");
      else {
        try {
          validateTurnEventCursorRequest(payload);
          if (payload.characterId !== characterId) ack = eventCursorRejection(payload, characterId, "character_mismatch");
          else {
            const accepted = this.turnEncounters.updateEventCursor(characterId, payload.encounterId, payload.sequence);
            ack = accepted ? { ...payload, accepted: true } : { ...payload, characterId, accepted: false, rejection: "stale_revision" };
          }
        } catch {
          ack = eventCursorRejection(payload, characterId, payload && typeof payload === "object" && "protocolVersion" in payload && payload.protocolVersion !== NETWORK_PROTOCOL_VERSION ? "protocol_upgrade_required" : "invalid_request");
        }
      }
      client.send("turn_event_cursor_ack", ack);
    });
    this.onMessage("ecology_proof_start", (client: HearthmereClient, payload: unknown) => {
      if (!this.#actionLimits.get(client.sessionId)?.take()) return;
      const encounterId = payload && typeof payload === "object" && "encounterId" in payload && typeof payload.encounterId === "string" ? payload.encounterId : "";
      const state = this.ecologyProofAuthority.start(client.sessionId, encounterId);
      client.send("ecology_proof_state", state ?? { encounterId, error: "unknown_encounter", serverTick: this.ecologyProofAuthority.tick });
    });
    this.onMessage("ecology_proof_action", (client: HearthmereClient, payload: unknown) => {
      if (!this.#actionLimits.get(client.sessionId)?.take()) return;
      client.send("ecology_proof_ack", this.ecologyProofAuthority.receive(client.sessionId, payload));
    });
  }

  override async onAuth(_client: HearthmereClient, options: HearthmereJoinOptions, context: AuthContext): Promise<RoomAuth> {
    const dependencies = roomDependencies();
    const cookieSession = parseCookie(context.headers.get("cookie") ?? undefined, "hm_session");
    const signedSession = context.token ?? options.sessionToken ?? cookieSession;
    const session = await dependencies.auth.resolveSession(signedSession);
    if (!session) {
      if (!dependencies.config.allowGuests) throw new ServerError(401, "Authentication required");
      return { accountId: "development_guest", character: null, guest: true, appearance: normalizeGuestAppearance(options.appearance) };
    }
    const characters = await dependencies.repository.listCharacters(session.accountId);
    const character = options.characterId ? characters.find((entry) => entry.id === options.characterId) : characters[0];
    if (!character) throw new ServerError(404, "Character not found");
    if (!validateAppearanceV2(character.appearance).ok) throw new ServerError(500, "Character appearance is invalid");
    if (!this.#characterSessions.claim(character.id, _client.sessionId)) throw new ServerError(409, "Character already has a live room session");
    return { accountId: session.accountId, character, guest: false, appearance: character.appearance };
  }

  override onJoin(client: HearthmereClient, _options: HearthmereJoinOptions, auth: RoomAuth): void {
    const actor = actorFor(client.sessionId, auth);
    this.state.players.set(client.sessionId, actor);
    this.authority.addActor(actor);
    client.userData = { characterId: auth.character?.id ?? null };
    if (auth.character) {
      if (!this.#characterSessions.claim(auth.character.id, client.sessionId)) throw new ServerError(409, "Character already has a live room session");
      client.send("authenticated_character", authenticatedCharacterProjection(auth.character.id));
      client.send("private_actor_resources", privateActorResourcesProjection(client.sessionId, auth.character.id, actor));
    }
    this.#inputLimits.set(client.sessionId, new TokenBucket(MAX_INPUTS_PER_SECOND, MAX_INPUTS_PER_SECOND));
    this.#actionLimits.set(client.sessionId, new TokenBucket(MAX_ACTIONS_PER_SECOND, MAX_ACTIONS_PER_SECOND));
    metrics.increment("hearthmere_joins_total", { guest: String(auth.guest) });
    metrics.set("hearthmere_connected_players", this.clients.length, { shard: this.roomId });
  }

  override async onDrop(client: HearthmereClient): Promise<void> {
    const characterId = client.userData?.characterId;
    const inEncounter = characterId ? Boolean(this.turnEncounters.activeEncounterForCharacter(characterId)) : false;
    if (characterId && inEncounter) this.turnEncounters.disconnect(characterId, client.sessionId);
    try {
      await this.allowReconnection(client, inEncounter ? 60 : 20);
      if (characterId && inEncounter) {
        const reconnected = this.turnEncounters.reconnect(characterId, client.sessionId);
        if (reconnected.accepted && reconnected.state) client.send("turn_encounter_state", reconnected.state);
        if (reconnected.accepted && reconnected.events?.length) client.send("turn_combat_events", reconnected.events);
      }
      const actor = this.state.players.get(client.sessionId);
      if (characterId && actor) client.send("private_actor_resources", privateActorResourcesProjection(client.sessionId, characterId, actor));
    }
    catch { await this.removeClient(client); }
  }

  override async onLeave(client: HearthmereClient, code: number): Promise<void> {
    if (code === CloseCode.CONSENTED) {
      const characterId = client.userData?.characterId;
      if (characterId) this.turnEncounters.disconnect(characterId, client.sessionId);
      await this.removeClient(client);
    }
  }

  override async onDispose(): Promise<void> {
    this.#characterSessions.clear();
    metrics.set("hearthmere_connected_players", 0, { shard: this.roomId });
  }

  private simulate(deltaMilliseconds: number): void {
    this.authority.step(deltaMilliseconds / 1000);
    this.turnEncounters.advanceToTick(this.authority.tick);
    this.refreshSpectatorProjections();
    for (const update of this.ecologyProofAuthority.step()) {
      this.clients.find((client) => client.sessionId === update.actorId)?.send("ecology_proof_state", update.state);
    }
    this.state.tick = this.authority.tick;
  }

  private async removeClient(client: HearthmereClient): Promise<void> {
    const actor = this.state.players.get(client.sessionId);
    if (actor && client.userData?.characterId) await roomDependencies().repository.updateCharacterTransform(client.userData.characterId, actor.transform);
    this.authority.removeActor(client.sessionId);
    this.ecologyProofAuthority.stop(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.#inputLimits.delete(client.sessionId); this.#actionLimits.delete(client.sessionId);
    this.#spectatorEncounterBySession.delete(client.sessionId);
    const characterId = client.userData?.characterId;
    this.#characterSessions.releaseSession(client.sessionId);
    metrics.set("hearthmere_connected_players", Math.max(0, this.clients.length - 1), { shard: this.roomId });
  }

  private publishTurnEncounter(encounterId: string): void {
    const encounter = this.turnEncounters.encounter(encounterId);
    if (!encounter) return;
    let summary = this.state.turnEncounters.get(encounterId);
    if (!summary) { summary = new TurnEncounterSummaryState(); summary.encounterId = encounterId; this.state.turnEncounters.set(encounterId, summary); }
    summary.phase = encounter.phase; summary.round = encounter.round; summary.revision = encounter.revision;
    summary.leaderActorId = encounter.publicState.leaderActorId ?? ""; summary.latestEventSequence = encounter.publicState.latestEventSequence;
    // ArraySchema intentionally forbids splice operations that insert more
    // entries than they remove. Rebuild the small public lease summary using
    // supported mutations so the first encounter can publish from an empty
    // array without crashing the room.
    summary.leasedEnemyIds.splice(0, summary.leasedEnemyIds.length);
    for (const enemyId of encounter.leasedEnemyIds) summary.leasedEnemyIds.push(enemyId);
    const liveParticipantIds = new Set<string>();
    for (const participant of encounter.publicState.participants) {
      liveParticipantIds.add(participant.actorId);
      let target = summary.participants.get(participant.actorId);
      if (!target) { target = new TurnEncounterParticipantSummaryState(); target.actorId = participant.actorId; summary.participants.set(participant.actorId, target); }
      target.characterId = participant.characterId ?? ""; target.team = participant.team; target.joinOrder = participant.joinOrder;
      target.connected = participant.connected; target.ready = participant.ready; target.withdrawn = participant.withdrawn;
      target.health = participant.health; target.maxHealth = participant.maxHealth;
    }
    for (const id of [...summary.participants.keys()]) if (!liveParticipantIds.has(id)) summary.participants.delete(id);
    const terminal = encounter.phase === "victory" || encounter.phase === "defeat" || encounter.phase === "aborted";
    if (terminal) {
      for (const enemyId of encounter.leasedEnemyIds) this.authority.setWorldTargetEncounterLeased(enemyId, false);
      const participantCharacters = new Set(encounter.participants.flatMap((participant) => participant.characterId ? [participant.characterId] : []));
      for (const client of this.clients) if (client.userData?.characterId && participantCharacters.has(client.userData.characterId)) this.authority.setActorEncounterLocked(client.sessionId, false);
    }
    for (const client of this.clients) {
      const characterId = client.userData?.characterId ?? null;
      const isParticipant = characterId !== null && encounter.participants.some((participant) => participant.characterId === characterId && !participant.withdrawn);
      const activeEncounterId = characterId ? this.turnEncounters.activeEncounterForCharacter(characterId) : null;
      if (activeEncounterId && activeEncounterId !== encounterId) continue;
      const worldActor = this.state.players.get(client.sessionId);
      const spectatorEncounterId = !isParticipant && !activeEncounterId && worldActor
        ? selectNearbySpectatorEncounter(
          { x: Math.round(worldActor.transform.x * 1_000), y: Math.round(worldActor.transform.y * 1_000), z: Math.round(worldActor.transform.z * 1_000) },
          this.turnEncounters.encounters(),
        )
        : null;
      if (!isParticipant && activeEncounterId !== encounterId && spectatorEncounterId !== encounterId) continue;
      const state = this.turnEncounters.clientState(encounterId, { actorId: client.sessionId, characterId: client.userData?.characterId ?? null });
      if (state) client.send("turn_encounter_state", state);
    }
  }

  private publishTurnEvents(encounterId: string, events: readonly import("@hollow-march/shared").CombatEventV1[]): void {
    const encounter = this.turnEncounters.encounter(encounterId); if (!encounter) return;
    for (const client of this.clients) {
      const characterId = client.userData?.characterId ?? null;
      const isParticipant = characterId !== null && encounter.participants.some((participant) => participant.characterId === characterId && !participant.withdrawn);
      const activeEncounterId = characterId ? this.turnEncounters.activeEncounterForCharacter(characterId) : null;
      if (activeEncounterId && activeEncounterId !== encounterId) continue;
      const worldActor = this.state.players.get(client.sessionId);
      const spectatorEncounterId = !isParticipant && !activeEncounterId && worldActor
        ? selectNearbySpectatorEncounter(
          { x: Math.round(worldActor.transform.x * 1_000), y: Math.round(worldActor.transform.y * 1_000), z: Math.round(worldActor.transform.z * 1_000) },
          this.turnEncounters.encounters(),
        )
        : null;
      if ((isParticipant || activeEncounterId === encounterId) && characterId) client.send("turn_combat_events", projectCombatEventBatchForAudienceV1(events, {
        mode: "participant",
        viewerActorId: `character.${characterId}`,
      }));
      else if (spectatorEncounterId === encounterId) client.send("turn_combat_events", projectCombatEventBatchForAudienceV1(events, { mode: "spectator", viewerActorId: null }));
    }
  }

  private refreshSpectatorProjections(): void {
    const encounters = this.turnEncounters.encounters();
    for (const client of this.clients as HearthmereClient[]) {
      const characterId = client.userData?.characterId ?? null;
      const activeEncounterId = characterId ? this.turnEncounters.activeEncounterForCharacter(characterId) : null;
      const actor = this.state.players.get(client.sessionId);
      const selected = !activeEncounterId && actor ? selectNearbySpectatorEncounter({
        x: Math.round(actor.transform.x * 1_000), y: Math.round(actor.transform.y * 1_000), z: Math.round(actor.transform.z * 1_000),
      }, encounters) : null;
      const previous = this.#spectatorEncounterBySession.get(client.sessionId) ?? null;
      if (previous === selected) continue;
      if (previous) {
        const clear = {
          protocolVersion: NETWORK_PROTOCOL_VERSION,
          encounterId: previous,
          reason: activeEncounterId ? "superseded" as const : this.turnEncounters.encounter(previous) ? "out_of_range" as const : "retention_expired" as const,
        };
        validateTurnEncounterProjectionClearV1(clear);
        client.send("turn_encounter_clear", clear);
      }
      if (selected) {
        const state = this.turnEncounters.clientState(selected, { actorId: client.sessionId, characterId });
        if (state) client.send("turn_encounter_state", state);
        const events = this.turnEncounters.eventsSince(selected, 0);
        if (events.length) client.send("turn_combat_events", projectCombatEventBatchForAudienceV1(events, { mode: "spectator", viewerActorId: null }));
        this.#spectatorEncounterBySession.set(client.sessionId, selected);
      } else this.#spectatorEncounterBySession.delete(client.sessionId);
    }
  }

  private applyTurnEnemyResult(result: { actorId: string; positionMm: { x: number; y: number; z: number }; yawTenThousandthRadians: number; health: number; defeated: boolean }): void {
    const enemy = this.state.enemies.get(result.actorId); if (!enemy) return;
    enemy.transform.x = result.positionMm.x / 1_000; enemy.transform.y = result.positionMm.y / 1_000; enemy.transform.z = result.positionMm.z / 1_000;
    enemy.transform.yaw = result.yawTenThousandthRadians / 10_000; enemy.vitals.health = result.health; enemy.locomotion = result.defeated ? "dead" : "idle";
  }

  private applyTurnPlayerResult(characterId: string, result: { positionMm: { x: number; y: number; z: number }; yawTenThousandthRadians: number; health: number; stamina: number; focus: number; defeated: boolean }): void {
    const sessionId = this.#characterSessions.sessionFor(characterId); if (!sessionId) return;
    const actor = this.state.players.get(sessionId); if (!actor) return;
    actor.transform.x = result.positionMm.x / 1_000; actor.transform.y = result.positionMm.y / 1_000; actor.transform.z = result.positionMm.z / 1_000;
    actor.transform.yaw = result.yawTenThousandthRadians / 10_000;
    actor.vitals.health = result.health; actor.vitals.stamina = result.stamina; actor.vitals.focus = result.focus;
    actor.locomotion = result.defeated ? "dead" : "idle";
    const client = this.clients.find((candidate) => candidate.sessionId === sessionId) as HearthmereClient | undefined;
    if (client) client.send("private_actor_resources", privateActorResourcesProjection(sessionId, characterId, actor));
  }

  private async refreshSettledCharacters(characterIds: readonly string[]): Promise<void> {
    for (const characterId of characterIds) {
      const character = await roomDependencies().repository.getCharacter(characterId);
      if (!character?.save) throw new Error(`settled character ${characterId} could not be reloaded`);
      const sessionId = this.#characterSessions.sessionFor(characterId);
      const client = sessionId ? this.clients.find((candidate) => candidate.sessionId === sessionId) as HearthmereClient | undefined : undefined;
      if (client?.auth) client.auth.character = character;
      const actor = sessionId ? this.state.players.get(sessionId) : undefined;
      if (actor) {
        hydrateActorVitals(actor, character.save);
        if (client) client.send("private_actor_resources", privateActorResourcesProjection(sessionId!, characterId, actor));
      }
    }
  }

  private restoreTurnEnemy(snapshot: TurnWorldEnemy): void {
    const enemy = this.state.enemies.get(snapshot.actorId); if (!enemy) return;
    enemy.transform.x = snapshot.positionMm.x / 1_000; enemy.transform.y = snapshot.positionMm.y / 1_000; enemy.transform.z = snapshot.positionMm.z / 1_000;
    enemy.transform.yaw = snapshot.yawTenThousandthRadians / 10_000; enemy.vitals.health = snapshot.health; enemy.vitals.maxHealth = snapshot.maxHealth; enemy.locomotion = "idle";
  }

}

export function selectNearbySpectatorEncounter(
  positionMm: { x: number; y: number; z: number },
  encounters: readonly import("@hollow-march/shared").TurnEncounterV1[],
  maximumDistanceMm = 32_000,
): string | null {
  const candidates = encounters.filter((encounter) => encounter.phase !== "victory" && encounter.phase !== "defeat" && encounter.phase !== "aborted").map((encounter) => {
    const distance = Math.min(...encounter.publicState.participants.filter((participant) => !participant.withdrawn).map((participant) => (
      (participant.positionMm.x - positionMm.x) ** 2 + (participant.positionMm.y - positionMm.y) ** 2 + (participant.positionMm.z - positionMm.z) ** 2
    )));
    return { encounterId: encounter.encounterId, distance };
  }).filter((candidate) => candidate.distance <= maximumDistanceMm ** 2)
    .sort((left, right) => left.distance - right.distance || codePointCompare(left.encounterId, right.encounterId));
  return candidates[0]?.encounterId ?? null;
}

const codePointCompare = (left: string, right: string): number => left === right ? 0 : left < right ? -1 : 1;

export function seedHearthmerePublicState(state: HearthmereState, authority: AuthorityKernel): void {
  for (const spawn of canonicalEnemySpawns()) {
    const statistics = ENEMY_STATISTICS[spawn.id] ?? { definitionId: spawn.contentId, name: spawn.contentId, health: 50, level: 1 };
    const entity = enemy(spawn.id, statistics.definitionId, statistics.name, spawn.transform, statistics.health, statistics.level);
    state.enemies.set(entity.id, entity); authority.addWorldTarget(entity, "enemy");
  }
  for (const anchor of canonicalPublicInteractionAnchors()) {
    const target = new PublicInteractableState(); target.id = anchor.id; target.kind = anchor.kind; target.transform = new TransformState(canonicalAnchorTransform(anchor.id)); target.publicPhaseMask = PHASES.PUBLIC;
    state.interactables.set(anchor.id, target);
    authority.addWorldTarget(authorityTargetForInteraction(target), "interactable");
  }
}

export function turnPlayerFromState(characterId: string, sessionId: string, actor: ActorState, character: CharacterRecord | null): TurnWorldPlayer {
  const techniqueRecord = character?.save?.techniques;
  const loadoutRecord = character?.save?.character;
  const requestedTechnique = typeof techniqueRecord?.equippedPrimary === "string" ? techniqueRecord.equippedPrimary
    : typeof techniqueRecord?.activeTechniqueId === "string" ? techniqueRecord.activeTechniqueId
      : typeof loadoutRecord?.activeTechniqueId === "string" ? loadoutRecord.activeTechniqueId : null;
  const activeTechniqueId = requestedTechnique && ACTIVE_TECHNIQUE_BY_ID.has(requestedTechnique) ? requestedTechnique : null;
  const requestedQuickItem = typeof loadoutRecord?.quickItemId === "string" ? loadoutRecord.quickItemId : null;
  const mendingCharges = character?.save?.inventory.mending_draught;
  const mendingCount = typeof mendingCharges === "number" && Number.isSafeInteger(mendingCharges) && mendingCharges > 0 ? mendingCharges : 0;
  const quickItemId = (requestedQuickItem === null || requestedQuickItem === "mending_draught") && mendingCount > 0 ? "mending_draught" : null;
  return {
    characterId,
    sessionId,
    positionMm: { x: Math.round(actor.transform.x * 1_000), y: Math.round(actor.transform.y * 1_000), z: Math.round(actor.transform.z * 1_000) },
    yawTenThousandthRadians: Math.round(actor.transform.yaw * 10_000),
    health: actor.vitals.health,
    maxHealth: actor.vitals.maxHealth,
    stamina: actor.vitals.stamina,
    maxStamina: actor.vitals.maxStamina,
    focus: actor.vitals.focus,
    maxFocus: actor.vitals.maxFocus,
    activeTechniqueId,
    quickItemId,
    itemCharges: quickItemId ? { [quickItemId]: mendingCount } : {},
    durableSave: character ? character.save ?? defaultServerSave(character, actor) : null,
  };
}

function defaultServerSave(character: CharacterRecord, actor: ActorState): ServerSaveV6 {
  const transform = actor.transform.toJSON();
  const location = { coordinateSpaceId: HEARTHMERE_LOCAL_METERS, transform, spatial: structuredClone(HEARTHMERE_SPATIAL_CONTEXT) };
  const save: ServerSaveV6 = {
    version: 6,
    savedAt: character.updatedAt.toISOString(),
    identity: { accountId: character.accountId, characterId: character.id },
    character: { name: character.name },
    appearance: structuredClone(character.appearance),
    location,
    vitals: {
      health: actor.vitals.health, maximumHealth: actor.vitals.maxHealth,
      stamina: actor.vitals.stamina, maximumStamina: actor.vitals.maxStamina,
      focus: actor.vitals.focus, maximumFocus: actor.vitals.maxFocus,
    },
    skillXp: {},
    techniques: Object.fromEntries(SERVER_SAVE_V6_DEFAULTS.techniqueLedgerKeys.map((key) => [key, {}])),
    progression: {}, inventory: {}, quests: {}, worldEvents: {}, discoveries: [],
    respawn: structuredClone(location),
    worldState: { gathered: {}, enemies: [] },
    trackedQuestId: null, playSeconds: 0, legacyImport: null,
    activeEncounterDurability: ACTIVE_ENCOUNTER_DURABILITY,
  };
  if (!isServerSaveV6(save)) throw new Error("new character default save failed ServerSaveV6 validation");
  return save;
}

function turnEnemyFromState(enemy: EnemyState): TurnWorldEnemy {
  return {
    actorId: enemy.id,
    definitionId: enemy.definitionId,
    positionMm: { x: Math.round(enemy.transform.x * 1_000), y: Math.round(enemy.transform.y * 1_000), z: Math.round(enemy.transform.z * 1_000) },
    yawTenThousandthRadians: Math.round(enemy.transform.yaw * 10_000),
    health: enemy.vitals.health,
    maxHealth: enemy.vitals.maxHealth,
    stamina: enemy.vitals.stamina,
    maxStamina: enemy.vitals.maxStamina,
    focus: enemy.vitals.focus,
    maxFocus: enemy.vitals.maxFocus,
  };
}

function turnPathIsClear(
  fromMm: { x: number; y: number; z: number },
  toMm: { x: number; y: number; z: number },
): boolean {
  return validateWalkablePath([
    { x: fromMm.x / 1_000, y: fromMm.y / 1_000, z: fromMm.z / 1_000 },
    { x: toMm.x / 1_000, y: toMm.y / 1_000, z: toMm.z / 1_000 },
  ]).valid;
}

function safeWireId(value: unknown): string {
  return typeof value === "string" && value && value.length <= 160 ? value : "invalid";
}

function unauthenticatedEncounterAck(kind: "start" | "join" | "withdraw", payload: unknown): TurnEncounterCommandAck {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    commandId: safeWireId(value.commandId),
    characterId: "unauthenticated",
    kind,
    encounterId: value.encounterId === undefined ? null : safeWireId(value.encounterId),
    accepted: false,
    rejection: "authentication_required",
  };
}

function rateLimitedEncounterAck(kind: "start" | "join" | "withdraw", payload: unknown, characterId: string): TurnEncounterCommandAck {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    commandId: safeWireId(value.commandId),
    characterId,
    kind,
    encounterId: value.encounterId === undefined ? null : safeWireId(value.encounterId),
    accepted: false,
    rejection: "rate_limited",
  };
}

function unauthenticatedPlanAck(payload: unknown): TurnPlanAck {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: safeWireId(value.encounterId),
    characterId: "unauthenticated",
    commandId: safeWireId(value.commandId),
    round: Number.isSafeInteger(value.round) && Number(value.round) >= 0 ? Number(value.round) : 0,
    revision: Number.isSafeInteger(value.revision) && Number(value.revision) >= 0 ? Number(value.revision) : 0,
    accepted: false,
    rejection: "not_participant",
  };
}

function rateLimitedPlanAck(payload: unknown, characterId: string): TurnPlanAck {
  return { ...unauthenticatedPlanAck(payload), characterId, rejection: "rate_limited" };
}

function eventCursorRejection(payload: unknown, characterId: string, rejection: NonNullable<TurnEventCursorAck["rejection"]>): TurnEventCursorAck {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: safeWireId(value.encounterId),
    characterId,
    sequence: Number.isSafeInteger(value.sequence) && Number(value.sequence) >= 0 ? Number(value.sequence) : 0,
    accepted: false,
    rejection,
  };
}

export function actorFor(sessionId: string, auth: RoomAuth): ActorState {
  const actor = new ActorState(); const character = auth.character;
  actor.id = sessionId; actor.displayName = character?.name ?? `Guest-${sessionId.slice(0, 5)}`;
  const storedTransform = character?.transform;
  actor.transform = new TransformState(storedTransform && validateWalkableDestination(storedTransform).valid ? storedTransform : canonicalAnchorTransform("player.start"));
  actor.publicPhaseMask = character?.publicPhaseMask ?? PHASES.PUBLIC;
  actor.personalPhaseMask = character?.personalPhaseMask ?? composePhaseMask(PHASES.PUBLIC, PHASES.HEARTHMERE_UNRESTORED);
  if (character?.save) hydrateActorVitals(actor, character.save);
  synchronizeActorAppearance(actor, auth.appearance);
  return actor;
}

export function hydrateActorVitals(actor: ActorState, save: ServerSaveV6): void {
  if (!isServerSaveV6(save)) throw new Error("cannot hydrate actor from invalid ServerSaveV6");
  actor.vitals.health = save.vitals.health;
  actor.vitals.maxHealth = save.vitals.maximumHealth;
  actor.vitals.stamina = save.vitals.stamina;
  actor.vitals.maxStamina = save.vitals.maximumStamina;
  actor.vitals.focus = save.vitals.focus;
  actor.vitals.maxFocus = save.vitals.maximumFocus;
}

export function authenticatedCharacterProjection(characterId: string): AuthenticatedCharacterV1 {
  const projection: AuthenticatedCharacterV1 = { protocolVersion: NETWORK_PROTOCOL_VERSION, characterId };
  validateAuthenticatedCharacterV1(projection);
  return projection;
}

export function privateActorResourcesProjection(actorId: string, characterId: string, actor: ActorState): PrivateActorResourcesV1 {
  const projection: PrivateActorResourcesV1 = {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    actorId,
    characterId,
    stamina: actor.vitals.stamina,
    maxStamina: actor.vitals.maxStamina,
    focus: actor.vitals.focus,
    maxFocus: actor.vitals.maxFocus,
  };
  validatePrivateActorResourcesV1(projection);
  return projection;
}

function authorityTargetForInteraction(target: PublicInteractableState) {
  return {
    id: target.id,
    transform: target.transform,
    vitals: { health: 1, maxHealth: 1, stamina: 0, maxStamina: 0 },
    locomotion: "idle",
    combat: { targetId: "", action: "", actionStartedTick: 0, impactTick: 0, recoveryEndsTick: 0 },
    lastProcessedInput: 0,
  };
}

export function normalizeGuestAppearance(input: unknown): AppearanceV2 {
  const normalized = normalizeAppearanceV2(input ?? DEFAULT_APPEARANCE_V2);
  const validation = validateAppearanceV2(normalized);
  if (!validation.ok) throw new ServerError(400, "Guest appearance is invalid");
  return validation.value;
}

export function synchronizeActorAppearance(actor: ActorState, appearance: AppearanceV2): void {
  const validation = validateAppearanceV2(appearance);
  if (!validation.ok) throw new Error(`Cannot synchronize invalid appearance: ${validation.errors.join(", ")}`);
  const serialized = JSON.stringify(validation.value);
  if (new TextEncoder().encode(serialized).byteLength > MAX_APPEARANCE_JSON_BYTES) throw new Error("Appearance payload exceeds the network cache budget");
  actor.appearanceSignature = appearanceSignature(validation.value);
  actor.appearanceJson = serialized;
  while (actor.equipmentVisualIds.length > 0) actor.equipmentVisualIds.pop();
  actor.equipmentVisualIds.push(...equipmentIds(validation.value));
}

function enemy(id: string, definitionId: string, name: string, transform: TransformState | ConstructorParameters<typeof TransformState>[0], health: number, level: number): EnemyState {
  const entity = new EnemyState(); entity.id = id; entity.definitionId = definitionId; entity.displayName = name;
  entity.transform = transform instanceof TransformState ? transform : new TransformState(transform);
  entity.vitals.health = health; entity.vitals.maxHealth = health; entity.level = level; return entity;
}

const ENEMY_STATISTICS: Readonly<Record<string, { definitionId: string; name: string; health: number; level: number }>> = Object.freeze({
  "enemy.ash-husk": { definitionId: "ash_husk", name: "Ash Husk", health: 70, level: 4 },
  "enemy.ledger-crawler": { definitionId: "ledger_crawler", name: "Ledger Crawler", health: 90, level: 6 },
});

function rateLimitAck(payload: unknown, serverTick: number) {
  const value = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  return { commandId: typeof value.commandId === "string" ? value.commandId.slice(0, 64) : "invalid", sequence: typeof value.sequence === "number" && Number.isSafeInteger(value.sequence) ? value.sequence : 0, serverTick, accepted: false, rejection: "rate_limited" as const };
}
const ACTION_METRIC_KINDS = new Set(["light_attack", "heavy_attack", "dodge", "interact", "gather", "craft"]);
export function safeActionKind(payload: unknown): string {
  const kind = payload && typeof payload === "object" && "kind" in payload && typeof payload.kind === "string" ? payload.kind : "";
  return ACTION_METRIC_KINDS.has(kind) ? kind : "invalid";
}
