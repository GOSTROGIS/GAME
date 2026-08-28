export const WORLD_SIZE_METERS = 96;
export const WORLD_MAX_COORDINATE_METERS = WORLD_SIZE_METERS - 0.001;
export const LEGACY_TILE_SIZE_METERS = 4;
/** Current durable server save schema. Older schema contracts remain exported for migration. */
export const SAVE_SCHEMA_VERSION = 6 as const;

export interface WorldTransform {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export const MORPH_KEYS = [
  "stature",
  "musculature",
  "bodyMass",
  "shoulderWidth",
  "hipWidth",
  "torsoLength",
  "headScale",
  "jawWidth",
  "cheekDepth",
  "browDepth",
  "noseLength",
  "eyeSpacing",
  "eyeSize",
  "earSize",
  "age",
  "scarDepth",
] as const;

export type MorphKey = (typeof MORPH_KEYS)[number];
export type MorphValues = Record<MorphKey, number>;

export interface AppearanceV2 {
  version: 2;
  bodyId: string;
  faceId: string;
  hairId: string;
  originId: string;
  skinPaletteId: string;
  hairPaletteId: string;
  eyePaletteId: string;
  markingId: string;
  markingPaletteId: string;
  morphs: MorphValues;
  plague: {
    pallor: number;
    lesions: number;
    veinDarkening: number;
    eyeClouding: number;
  };
  equippedVisualIds: {
    head: string | null;
    torso: string | null;
    legs: string | null;
    hands: string | null;
    feet: string | null;
    mainHand: string | null;
    offHand: string | null;
    back: string | null;
  };
}

export interface InputFrame {
  sequence: number;
  clientTick: number;
  moveX: number;
  moveZ: number;
  yaw: number;
  sprint: boolean;
}

export interface TravelRequest {
  sequence: number;
  clientTick: number;
  destination: WorldTransform;
}

export interface HearthmereJoinOptions {
  sessionToken?: string;
  characterId?: string;
  appearance?: unknown;
}

export type ActionKind = "light_attack" | "heavy_attack" | "dodge" | "interact" | "gather" | "craft";

export interface ActionCommand {
  commandId: string;
  sequence: number;
  clientTick: number;
  kind: ActionKind;
  targetId?: string;
  recipeId?: string;
  directionYaw?: number;
}

export type ActionRejection =
  | "invalid_command"
  | "stale_sequence"
  | "rate_limited"
  | "cooldown"
  | "target_out_of_range"
  | "invalid_target_type"
  | "target_unavailable"
  | "unknown_target"
  | "not_authorized"
  | "encounter_required"
  | "protocol_upgrade_required";

export interface ActionAck {
  commandId: string;
  sequence: number;
  serverTick: number;
  accepted: boolean;
  rejection?: ActionRejection;
  impactTick?: number;
}

export type EcologyProofActionKind = "light_attack" | "heavy_attack" | "dodge" | "reset";

export interface EcologyProofCommand {
  commandId: string;
  sequence: number;
  clientTick: number;
  encounterId: string;
  kind: EcologyProofActionKind;
}

export interface EcologyProofAuthorityState {
  encounterId: string;
  creatureId: string;
  mechanicHandlerId: string;
  serverTick: number;
  revision: number;
  playerHealth: number;
  enemyHealth: number;
  enemyMaximum: number;
  phase: "idle" | "windup" | "recovery" | "victory" | "defeat";
  impactTick: number | null;
  recoveryEndsTick: number | null;
  dodgeEndsTick: number;
  visualTelegraph: string;
  nonvisualTelegraph: string;
  counterplay: string;
  activeEffects: string[];
  resolvedDropTableIds: string[];
}

export interface EcologyProofAck {
  commandId: string;
  sequence: number;
  serverTick: number;
  accepted: boolean;
  rejection?: "invalid_command" | "stale_sequence" | "cooldown" | "unknown_encounter" | "not_started";
  state?: EcologyProofAuthorityState;
}

export type LocomotionState = "idle" | "walk" | "run" | "dodge" | "stagger" | "dead";

export interface ActorNetState {
  id: string;
  displayName: string;
  transform: WorldTransform;
  vitals: {
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    focus: number;
    maxFocus: number;
  };
  locomotion: LocomotionState;
  combat: {
    targetId: string | null;
    action: ActionKind | null;
    actionStartedTick: number;
    impactTick: number;
    recoveryEndsTick: number;
  };
  appearanceSignature: string;
  appearanceJson: string;
  equipmentVisualIds: string[];
  publicPhaseMask: number;
  personalPhaseMask: number;
  lastProcessedInput: number;
}

export interface AssetManifest {
  id: string;
  path: string;
  sha256: string;
  license: { id: string; author: string; sourceUrl: string; textPath: string };
  source: { authoringPath: string; derivativeOf: string[]; modifications: string[] };
  boundsMeters: { x: number; y: number; z: number };
  pivotMeters: WorldTransform;
  sockets: string[];
  morphs: MorphKey[];
  clips: string[];
  lods: Array<{ level: number; path: string; triangles: number }>;
  materials: Array<{ id: string; textureSize: number; compressed: boolean }>;
  compression: { meshopt: boolean; ktx2: boolean };
  budgets: { triangles: number; textureSize: number };
}

export interface SceneInstance {
  id: string;
  assetId: string;
  transform: WorldTransform;
  phaseMask: number;
}

export interface SceneChunkManifest {
  id: string;
  regionId: string;
  grid: { x: 0 | 1 | 2; z: 0 | 1 | 2 };
  bounds: { min: WorldTransform; max: WorldTransform };
  instances: SceneInstance[];
  colliders: Array<{
    id: string;
    assetId: string;
    transform: WorldTransform;
    shape?: "box" | "cylinder";
    size?: readonly [number, number, number];
    radius?: number;
    height?: number;
    walkable?: boolean;
  }>;
  navigation: { graphPath: string; hash: string; links: Array<{ toChunkId: string; fromAnchor: string; toAnchor: string }> };
  occluders: Array<{ instanceId: string; fadeGroup: string }>;
  lights: Array<{ id: string; kind: "point" | "spot" | "area"; transform: WorldTransform; intensity: number; castsShadow: boolean }>;
  volumes: Array<{ id: string; kind: "audio" | "fog" | "rain" | "phase"; phaseMask: number }>;
  interactionAnchors: Array<{ id: string; transform: WorldTransform; radius: number; phaseMask: number }>;
  spawnAnchors: Array<{ id: string; kind: "player" | "enemy" | "npc"; transform: WorldTransform; phaseMask: number }>;
}

export interface LegacySaveV3 {
  version: 3;
  character?: { name?: string; origin?: string; appearance?: Record<string, unknown> };
  player: { x: number; y: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface ServerSaveV4 {
  version: 4;
  importedFrom: { schemaVersion: 3; importedAt: string; fingerprint: string } | null;
  character: { name: string; appearance: AppearanceV2 };
  transform: WorldTransform;
  legacyPayload: LegacySaveV3 | null;
}

export interface ServerSaveV5 {
  version: 5;
  importedFrom: { schemaVersion: 3; importedAt: string; fingerprint: string } | null;
  character: { name: string; appearance: AppearanceV2 };
  /**
   * Site-local transform retained at the top level so a v4 Hearthmere save can
   * migrate without changing a coordinate, key, or numeric representation.
   */
  transform: WorldTransform;
  spatial: import("./spatial.js").SpatialContext;
  legacyPayload: LegacySaveV3 | null;
}
