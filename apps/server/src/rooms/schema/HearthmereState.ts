import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import type { ActionKind, AppearanceV2, WorldTransform } from "@hollow-march/shared";

export class TransformState extends Schema implements WorldTransform {
  @type("float32") x = 0;
  @type("float32") y = 0;
  @type("float32") z = 0;
  @type("float32") yaw = 0;
  constructor(transform?: WorldTransform) { super(); if (transform) Object.assign(this, transform); }
}

export class VitalsState extends Schema {
  @type("uint16") health = 100;
  @type("uint16") maxHealth = 100;
  // Server-only resources. They intentionally have no @type decorator and are
  // projected solely through the authenticated owner-only wire message.
  stamina = 100;
  maxStamina = 100;
  focus = 50;
  maxFocus = 50;
}

export class CombatState extends Schema {
  @type("string") targetId = "";
  @type("string") action = "";
  @type("uint32") actionStartedTick = 0;
  @type("uint32") impactTick = 0;
  @type("uint32") recoveryEndsTick = 0;
}

export class ActorState extends Schema {
  @type("string") id = "";
  @type("string") displayName = "";
  @type(TransformState) transform = new TransformState();
  @type(VitalsState) vitals = new VitalsState();
  @type("string") locomotion = "idle";
  @type(CombatState) combat = new CombatState();
  @type("string") appearanceSignature = "";
  @type("string") appearanceJson = "";
  @type(["string"]) equipmentVisualIds = new ArraySchema<string>();
  @type("uint32") publicPhaseMask = 1;
  @type("uint32") personalPhaseMask = 1;
  @type("uint32") lastProcessedInput = 0;
}

export class EnemyState extends ActorState {
  @type("string") definitionId = "";
  @type("uint16") level = 1;
  @type("uint32") respawnTick = 0;
}

export class PublicInteractableState extends Schema {
  @type("string") id = "";
  @type("string") kind = "";
  @type(TransformState) transform = new TransformState();
  @type("uint32") publicPhaseMask = 1;
  @type("uint32") revision = 0;
}

export class TurnEncounterParticipantSummaryState extends Schema {
  @type("string") actorId = "";
  @type("string") characterId = "";
  @type("string") team = "players";
  @type("uint8") joinOrder = 0;
  @type("boolean") connected = true;
  @type("boolean") ready = false;
  @type("boolean") withdrawn = false;
  @type("uint32") health = 0;
  @type("uint32") maxHealth = 1;
}

export class TurnEncounterSummaryState extends Schema {
  @type("string") encounterId = "";
  @type("string") phase = "forming";
  @type("uint32") round = 0;
  @type("uint32") revision = 0;
  @type("string") leaderActorId = "";
  @type("uint32") latestEventSequence = 0;
  @type(["string"]) leasedEnemyIds = new ArraySchema<string>();
  @type({ map: TurnEncounterParticipantSummaryState }) participants = new MapSchema<TurnEncounterParticipantSummaryState>();
}

export class HearthmereState extends Schema {
  @type("string") shardId = "";
  @type("uint32") tick = 0;
  @type({ map: ActorState }) players = new MapSchema<ActorState>();
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
  @type({ map: PublicInteractableState }) interactables = new MapSchema<PublicInteractableState>();
  @type({ map: TurnEncounterSummaryState }) turnEncounters = new MapSchema<TurnEncounterSummaryState>();
  @type("uint32") publicEventRevision = 0;
}

export function equipmentIds(appearance: AppearanceV2): string[] {
  return Object.values(appearance.equippedVisualIds).filter((id): id is string => Boolean(id));
}

export function synchronizedAction(value: string): ActionKind | null {
  return value ? value as ActionKind : null;
}
