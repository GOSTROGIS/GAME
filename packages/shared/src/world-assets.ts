import type { SceneChunkManifest, WorldTransform } from "./contracts.js";
import { HEARTHMERE_LOCAL_METERS, HEARTHMERE_SITE_ID, SITE_LOCAL_METERS_V1 } from "./spatial.js";

export type AssetMaturity = "prototype_geometry" | "production_ready";
export type PrimitiveCaptureView = "iso" | "top" | "side";
export type PrimitiveKind = "cuboid" | "cylinder" | "tube" | "wheel" | "disc" | "ring" | "dome" | "mound" | "polygon";

export interface PrimitiveCaptureEventV1 {
  order: number;
  sourcePrimitive: string;
  kind: PrimitiveKind;
  materialIntent: readonly string[];
  readonly [parameter: string]: unknown;
}

/** Normalized model-space evidence. Screen-space SVG is deliberately not representable here. */
export interface PrimitiveSceneV1 {
  schema: "PrimitiveSceneV1";
  identity: string;
  view: PrimitiveCaptureView;
  units: "metres";
  coordinateSpace: "game_y_up";
  sourceToGameAxes: "(x,y,z)->(x,z,y)";
  quantizationMetres: 0.001;
  events: readonly PrimitiveCaptureEventV1[];
  bounds: Readonly<{ min: readonly [number, number, number]; max: readonly [number, number, number] }> | null;
  unsupportedOutputEvidence: readonly Readonly<Record<string, unknown>>[];
  eventHash: string;
  topologySignature: string;
  deterministicHash: string;
}

export type CatalogClassification = "accepted_seed" | "quarantined" | "rejected";

export interface CatalogAssetRecordV1 {
  schema: "CatalogAssetRecordV1";
  id: string;
  generator: string;
  generatorIdentity: string;
  representativeParameters: Readonly<Record<string, unknown>>;
  classification: CatalogClassification;
  reason: string;
  topology?: Readonly<{ signature: string | null; canonicalId: string | null; aliasOf: string | null; aliases: readonly string[] }>;
  lineage: Readonly<{
    sourceIdentity: "slipcurve-sitelib";
    sourceContentCommit: string;
    captureWorkspaceHead: string;
    historicalCrosswalk: string;
    historicalSourcePath: string | null;
  }>;
  primitiveScene: PrimitiveSceneV1;
  evidence: readonly Readonly<Record<string, unknown>>[];
  suitabilityTags: readonly string[];
  maturity: "prototype_geometry";
  productionEligible: false;
}

export interface ReskinRecipeV1 {
  schemaVersion: 1;
  id: string;
  sableAssetId: string;
  siteId: string;
  sourceSeedIds: readonly string[];
  semanticMaterialMapping: Readonly<Record<string, string>>;
  topologyChanges: readonly string[];
  damageAndAsymmetryRules: readonly string[];
  pivot: Readonly<{ mode: "ground_center"; offset: readonly [0, 0, 0] }>;
  colliderProfile: Readonly<{
    shape: "box" | "cylinder";
    size: readonly [number, number, number] | null;
    radius: number | null;
    height: number;
    collisionLayer: "static-world" | "traversal";
    walkable: boolean;
  }>;
  territoryTags: readonly string[];
  lineage: string;
  originalityReview: Readonly<{
    status: "prototype_reviewed";
    recognizableBorrowing: false;
    simpleRecolor: false;
    notes: string;
  }>;
  maturity: "prototype_geometry";
}

export type RuntimeAssetDependencyKind = "glb" | "ktx2";

export interface RuntimeAssetDependencyV1 {
  id: string;
  kind: RuntimeAssetDependencyKind;
  path: string;
  sha256: string;
  encodedBytes: number;
  gpuBytes: Readonly<{ vertex: number; index: number; textureMipChain: number; total: number }>;
  externalUris: readonly [];
}

export interface RuntimeAssetPackV1 {
  schemaVersion: 1;
  id: string;
  siteId: string;
  maturity: "prototype_geometry";
  dependencyIds: readonly string[];
  dependencies: readonly RuntimeAssetDependencyV1[];
  decodedGpuBytes: number;
  encodedBytes: number;
  limits: Readonly<{ discreteGpuBytes: 268435456; integratedGpuBytes: 100663296 }>;
  lods: readonly Readonly<{ level: 0 | 1 | 2; maximumDistanceMeters: number; triangleBudget: number }>[];
  materialIds: readonly string[];
  provenance: Readonly<{ sourceId: "slipcurve-sitelib"; authorizationId: "owner-authorized-cross-project-sitelib"; recipeIds: readonly string[] }>;
}

export interface SceneInstanceV2 {
  id: string;
  assetId: string;
  sourceAssetId: string | null;
  transform: WorldTransform;
  scale: readonly [number, number, number];
  phaseMask: number;
  instanceGroupId: string | null;
}

export type SceneColliderV2 = Readonly<{
  id: string;
  instanceId: string;
  transform: WorldTransform;
  phaseMask: number;
  collisionLayer: "static-world" | "traversal";
  walkable: boolean;
}> & (
  | Readonly<{ shape: "box"; size: readonly [number, number, number]; radius: null; height: number }>
  | Readonly<{ shape: "cylinder"; size: null; radius: number; height: number }>
);

export interface SceneNavigationNodeV2 {
  id: string;
  transform: WorldTransform;
  radius: number;
}

export interface SceneNavigationEdgeV2 {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  bidirectional: boolean;
  cost: number;
}

export interface SceneChunkManifestV2 {
  schemaVersion: 2;
  id: string;
  siteId: string;
  coordinateSpaceId: string;
  assetPackIds: readonly string[];
  bounds: Readonly<{ min: WorldTransform; max: WorldTransform }>;
  instances: readonly SceneInstanceV2[];
  colliders: readonly SceneColliderV2[];
  navigation: Readonly<{
    graphId: string;
    hash: string;
    links: readonly Readonly<{ toChunkId: string; fromAnchor: string; toAnchor: string }>[];
    nodes: readonly Readonly<SceneNavigationNodeV2>[];
    edges: readonly Readonly<SceneNavigationEdgeV2>[];
  }>;
  occluders: readonly Readonly<{ instanceId: string; fadeGroup: string }>[];
  lights: readonly Readonly<{ id: string; kind: "point" | "spot" | "area"; transform: WorldTransform; intensity: number; castsShadow: boolean }>[];
  volumes: readonly Readonly<{ id: string; kind: "audio" | "fog" | "rain" | "phase"; phaseMask: number }>[];
  interactionAnchors: readonly Readonly<{ id: string; instanceId: string | null; transform: WorldTransform; radius: number; phaseMask: number }>[];
  spawnAnchors: readonly Readonly<{ id: string; kind: "player" | "enemy" | "npc"; transform: WorldTransform; phaseMask: number }>[];
  legacy: Readonly<{ sourceManifestId: string; preservesInstanceIds: true; preservesCoordinates: true; preservesSemanticAnchors: true }> | null;
  maturity: "prototype_geometry";
}

export interface WorldCellSceneRef {
  worldCellId: string;
  sceneRef: Readonly<{ siteId: string; sceneId: string; packId: string }> | null;
}

/** Canonical dynamic entry for a scene-backed ecology-proof site. */
export interface ProofSiteSceneManifestV1 {
  schemaVersion: 1;
  id: string;
  siteId: string;
  macroCellId: string;
  packId: string;
  chunks: readonly SceneChunkManifestV2[];
  maturity: "prototype_geometry";
  seamlessTraversalApproved: false;
}

/** One-way compatibility adapter. It never mutates or reinterprets V1 coordinates. */
export function adaptLegacySceneChunkManifest(chunk: SceneChunkManifest, siteId: string, assetPackIds: readonly string[]): SceneChunkManifestV2 {
  return Object.freeze({
    schemaVersion: 2 as const,
    id: chunk.id,
    siteId,
    coordinateSpaceId: siteId === HEARTHMERE_SITE_ID ? HEARTHMERE_LOCAL_METERS : SITE_LOCAL_METERS_V1,
    assetPackIds: Object.freeze([...assetPackIds]),
    bounds: Object.freeze({ min: Object.freeze({ ...chunk.bounds.min }), max: Object.freeze({ ...chunk.bounds.max }) }),
    instances: Object.freeze(chunk.instances.map((instance) => Object.freeze({ id: instance.id, assetId: instance.assetId, sourceAssetId: instance.assetId, transform: Object.freeze({ ...instance.transform }), scale: Object.freeze([1, 1, 1] as const), phaseMask: instance.phaseMask, instanceGroupId: null }))),
    colliders: Object.freeze(chunk.colliders.map((collider) => {
      const height = collider.height ?? collider.size?.[1] ?? 1;
      if (collider.shape === "cylinder" && collider.radius !== undefined) return Object.freeze({
        id: collider.id,
        instanceId: collider.assetId,
        transform: Object.freeze({ ...collider.transform }),
        phaseMask: 1,
        collisionLayer: "static-world" as const,
        walkable: collider.walkable ?? false,
        shape: "cylinder" as const,
        size: null,
        radius: collider.radius,
        height,
      });
      return Object.freeze({
        id: collider.id,
        instanceId: collider.assetId,
        transform: Object.freeze({ ...collider.transform }),
        phaseMask: 1,
        collisionLayer: "static-world" as const,
        walkable: collider.walkable ?? false,
        shape: "box" as const,
        size: Object.freeze([...(collider.size ?? [1, height, 1])] as [number, number, number]),
        radius: null,
        height,
      });
    })),
    navigation: Object.freeze({ graphId: chunk.navigation.graphPath, hash: chunk.navigation.hash, links: Object.freeze(chunk.navigation.links.map((link) => Object.freeze({ ...link }))), nodes: Object.freeze([]), edges: Object.freeze([]) }),
    occluders: Object.freeze(chunk.occluders.map((occluder) => Object.freeze({ ...occluder }))),
    lights: Object.freeze(chunk.lights.map((light) => Object.freeze({ id: light.id, kind: light.kind, transform: Object.freeze({ ...light.transform }), intensity: light.intensity, castsShadow: light.castsShadow }))),
    volumes: Object.freeze(chunk.volumes.map((volume) => Object.freeze({ ...volume }))),
    interactionAnchors: Object.freeze(chunk.interactionAnchors.map((anchor) => Object.freeze({ ...anchor, instanceId: null, transform: Object.freeze({ ...anchor.transform }) }))),
    spawnAnchors: Object.freeze(chunk.spawnAnchors.map((anchor) => Object.freeze({ ...anchor, transform: Object.freeze({ ...anchor.transform }) }))),
    legacy: Object.freeze({ sourceManifestId: chunk.id, preservesInstanceIds: true as const, preservesCoordinates: true as const, preservesSemanticAnchors: true as const }),
    maturity: "prototype_geometry" as const,
  });
}

export function runtimePackGpuBytes(dependencies: readonly RuntimeAssetDependencyV1[]): number {
  const unique = new Map(dependencies.map((dependency) => [dependency.id, dependency]));
  return [...unique.values()].reduce((total, dependency) => total + dependency.gpuBytes.total, 0);
}
