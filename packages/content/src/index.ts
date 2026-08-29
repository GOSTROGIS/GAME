import assetManifestJson from "../manifests/hearthmere.assets.json" with { type: "json" };
import licenseManifestJson from "../manifests/hearthmere.licenses.json" with { type: "json" };
import sceneManifestJson from "../manifests/hearthmere.scene.json" with { type: "json" };

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export interface WorldTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface PhaseBound {
  phaseIds: readonly string[];
}

export interface SceneInstance extends PhaseBound {
  id: string;
  assetId: string;
  type: "structure" | "prop" | "foliage" | "decal" | "character" | "enemy";
  status: "prototype_geometry" | "production_ready";
  transform: WorldTransform;
}

export interface SceneLight extends PhaseBound {
  id: string;
  type: "directional" | "hemisphere" | "point" | "spot";
  color: string;
  groundColor?: string;
  intensity: number;
  rangeMeters?: number;
  castShadow: boolean;
  shadowPriority?: number;
  transform: WorldTransform;
}

export interface SceneCollider extends PhaseBound {
  id: string;
  instanceId: string;
  shape: "box" | "cylinder" | "capsule";
  center: Vec3;
  size?: Vec3;
  radius?: number;
  height?: number;
  layer: string;
  walkable: boolean;
}

export interface SceneOccluder extends PhaseBound {
  id: string;
  instanceId: string;
  shape: "box" | "cylinder";
  center: Vec3;
  size?: Vec3;
  radius?: number;
  height?: number;
  fadeMode: "dither" | "opacity";
}

export interface NavCell extends PhaseBound {
  id: string;
  polygon: readonly Vec3[];
  cost: number;
  blockedByColliderIds: readonly string[];
}

export interface NavLink extends PhaseBound {
  id: string;
  from: string;
  to: string;
  bidirectional: boolean;
  cost: number;
  portal: readonly [Vec3, Vec3];
}

export interface SemanticAnchor extends PhaseBound {
  id: string;
  kind: string;
  assetId?: string;
  instanceId?: string;
  legacySource?: { id: string; position: Vec2 };
  transform: WorldTransform;
  radiusMeters: number;
}

export interface SpawnAnchor extends SemanticAnchor {
  kind: "player" | "enemy" | "ambient-resident";
  encounterId?: string;
  respawnSeconds?: number;
}

export interface AssetZone extends PhaseBound {
  id: string;
  assetId: string;
  shape: "box" | "sphere";
  center: Vec3;
  size?: Vec3;
  radius?: number;
  gain?: number;
}

export interface SceneVolume extends PhaseBound {
  id: string;
  kind: string;
  shape: "box" | "sphere";
  center: Vec3;
  size?: Vec3;
  radius?: number;
  density?: number;
  direction?: Vec3;
}

export interface HearthmereChunk {
  id: string;
  grid: Vec2;
  bounds: { min: Vec3; max: Vec3 };
  streamingPriority: "hub" | "near" | "far";
  surfaceLayers: (PhaseBound & { assetId: string; weight: number })[];
  instances: SceneInstance[];
  colliders: SceneCollider[];
  occluders: SceneOccluder[];
  navigation: { cells: NavCell[]; links: NavLink[] };
  lights: SceneLight[];
  volumes: SceneVolume[];
  vfxZones: AssetZone[];
  audioZones: AssetZone[];
  interactionAnchors: SemanticAnchor[];
  spawnAnchors: SpawnAnchor[];
}

export interface HearthmereSceneManifest {
  schemaVersion: number;
  id: string;
  name: string;
  units: "meters";
  coordinateSystem: Record<string, string>;
  bounds: { min: Vec3; max: Vec3; playableSize: Vec2 };
  legacyMapping: {
    sourceSchema: number;
    sourceCoordinateSystem: string;
    metersPerTile: number;
    formula: Record<string, string>;
    inverseFormula: Record<string, string>;
  };
  camera: Record<string, unknown>;
  qualityTargets: Record<string, Record<string, unknown>>;
  phaseDefinitions: readonly { id: string; scope: "shard" | "character"; description: string }[];
  phasePolicy: { alwaysActive: readonly string[]; exclusiveGroups: readonly (readonly string[])[]; defaultCharacterPhases: readonly string[] };
  acceptanceProfile: {
    allowPrototypeGeometry: boolean;
    minimumReferencedAssets: Record<string, number>;
    requiredSemanticAnchors: readonly string[];
    requiredChunkCount: number;
    requiredChunkSizeMeters: number;
  };
  terrain: Record<string, unknown> & { surfacePaletteAssetIds: readonly string[] };
  environment: Record<string, unknown> & { globalLights: readonly SceneLight[] };
  chunks: HearthmereChunk[];
}

export interface AssetDefinition {
  id: string;
  name: string;
  category: string;
  subtype?: string;
  targetSlug: string;
  budgetClass: string;
  pipelineStatus: "prototype_geometry" | "production_ready";
  provenance: { sourceId: string; licenseId: string };
  runtime: { delivery: "procedural" | "file"; generatorId?: string; path?: string; sha256?: string; parameters?: Record<string, unknown>; capabilities?: Record<string, readonly string[]> };
  geometry: { lodTriangles: Vec3 };
  materials: { slots: number; maxTextureDimension: number; compressed: boolean } & Record<string, unknown>;
  targetCapabilities?: Record<string, readonly string[]>;
}

export interface HearthmereAssetManifest {
  schemaVersion: number;
  catalogId: string;
  budgets: Record<string, { lodTriangles: Vec3; maxTextureDimension: number; maxMaterialSlots: number }>;
  requiredCharacterMorphs: readonly string[];
  requiredCharacterClips: readonly string[];
  requiredEnemyClips: readonly string[];
  generators: readonly { id: string; kind: string; description: string }[];
  assets: readonly AssetDefinition[];
}

export interface HearthmereLicenseManifest {
  schemaVersion: number;
  licenses: readonly { id: string; name: string; spdx: string | null; redistributableWithProject: boolean; commercialUse: boolean; attributionRequired: boolean; notice: string }[];
  sources: readonly { id: string; originType: string; title: string; creator: string; sourceUri: string; retrievedAt: string | null; createdAt: string; licenseId: string; contentHash: string | null; modifications: string }[];
}

export const HEARTHMERE_SCENE = sceneManifestJson as unknown as HearthmereSceneManifest;
export const HEARTHMERE_ASSETS = assetManifestJson as unknown as HearthmereAssetManifest;
export const HEARTHMERE_LICENSES = licenseManifestJson as unknown as HearthmereLicenseManifest;

export const HEARTHMERE_ASSET_BY_ID: ReadonlyMap<string, AssetDefinition> = new Map(
  HEARTHMERE_ASSETS.assets.map((asset) => [asset.id, asset]),
);

export function legacyTileToWorld(x: number, y: number): WorldTransform {
  return { position: [x * HEARTHMERE_SCENE.legacyMapping.metersPerTile, 0, y * HEARTHMERE_SCENE.legacyMapping.metersPerTile], rotation: [0, 0, 0], scale: [1, 1, 1] };
}

export * from "./runtime.js";
export * from "./turnCombatContent.js";
export * from "./narrative.js";
