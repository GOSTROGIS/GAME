import * as THREE from "three";
import type { SceneChunkManifestV2 } from "@hollow-march/shared";
import {
  type AssetResidencyManager,
  type RuntimeAssetPackLike,
  type SiteAssetLease,
} from "../world/AssetResidencyManager.js";

export interface BridgeSiteSceneOptions {
  readonly viewerPosition?: THREE.Vector3;
  readonly signal?: AbortSignal;
}

export interface BridgeSiteSceneController {
  readonly group: THREE.Group;
  readonly lease: SiteAssetLease;
  readonly instanceCount: number;
  readonly drawObjectCount: number;
  readonly colliderCount: number;
  readonly navigationNodeCount: number;
  readonly navigationEdgeCount: number;
  isWorldPointBlocked(point: THREE.Vector3, margin?: number, phaseMask?: number): boolean;
  isWorldPointNavigable(point: THREE.Vector3, corridorRadius?: number): boolean;
  worldSpawn(kind: "player" | "enemy"): THREE.Vector3 | null;
  destroy(): void;
}

interface InstanceResolution {
  readonly instance: SceneChunkManifestV2["instances"][number];
  readonly root: THREE.Object3D;
  readonly dependencyId: string;
  readonly lodLevel: number;
  readonly lodFallback: boolean;
}

const CANONICAL_ID = /^[a-z0-9][a-z0-9._-]*$/;

function transformMatrix(instance: SceneChunkManifestV2["instances"][number]): THREE.Matrix4 {
  const { transform, scale: scaleTuple } = instance;
  if (![transform.x, transform.y, transform.z, transform.yaw].every(Number.isFinite)) throw new Error("Bridge instance transform must contain finite x, y, z, and yaw values");
  if (scaleTuple.some((component) => !Number.isFinite(component) || component <= 0)) throw new Error("Bridge instance scale must be finite and positive");
  return new THREE.Matrix4().compose(
    new THREE.Vector3(transform.x, transform.y, transform.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), transform.yaw),
    new THREE.Vector3(...scaleTuple),
  );
}

function validateScene(pack: RuntimeAssetPackLike, scene: SceneChunkManifestV2): void {
  if (scene.schemaVersion !== 2 || scene.maturity !== "prototype_geometry") throw new Error("Bridge scene must remain an honest SceneChunkManifestV2 prototype");
  if (!CANONICAL_ID.test(scene.id)) throw new Error(`Bridge scene chunk ID ${scene.id} is not canonical`);
  if (scene.siteId !== pack.siteId) throw new Error(`Scene ${scene.id} and pack ${pack.id} target different sites`);
  if (!scene.assetPackIds.includes(pack.id)) throw new Error(`Scene ${scene.id} does not declare pack ${pack.id}`);
  if (new Set(scene.instances.map(({ id }) => id)).size !== scene.instances.length) throw new Error(`Scene ${scene.id} contains duplicate instance IDs`);
  const assetIds = new Set(pack.dependencyIds);
  for (const instance of scene.instances) {
    if (!CANONICAL_ID.test(instance.id)) throw new Error(`Scene ${scene.id} contains invalid instance ${instance.id}`);
    if (instance.assetId.startsWith("bridge.asset.") && !assetIds.has(instance.assetId)) throw new Error(`Scene ${scene.id} contains unresolved bridge instance ${instance.id}`);
    transformMatrix(instance);
  }
  const navigationNodeIds = new Set(scene.navigation.nodes.map(({ id }) => id));
  if (navigationNodeIds.size !== scene.navigation.nodes.length) throw new Error(`Scene ${scene.id} contains duplicate navigation node IDs`);
  for (const node of scene.navigation.nodes) if (![node.transform.x, node.transform.y, node.transform.z, node.radius].every(Number.isFinite) || node.radius <= 0) throw new Error(`Scene ${scene.id} contains invalid navigation node ${node.id}`);
  for (const edge of scene.navigation.edges) if (!navigationNodeIds.has(edge.fromNodeId) || !navigationNodeIds.has(edge.toNodeId) || !Number.isFinite(edge.cost) || edge.cost <= 0) throw new Error(`Scene ${scene.id} contains unresolved navigation edge ${edge.id}`);
}

function instanceDistance(instance: SceneChunkManifestV2["instances"][number], viewer: THREE.Vector3): number {
  return Math.hypot(instance.transform.x - viewer.x, instance.transform.y - viewer.y, instance.transform.z - viewer.z);
}

/**
 * Builds static environment geometry as InstancedMesh groups. Geometry and
 * materials stay owned by the residency lease; destroy only releases instance
 * buffers before the lease, avoiding duplicate uploads and double disposal.
 */
export async function createBridgeSiteScene(
  manager: AssetResidencyManager,
  pack: RuntimeAssetPackLike,
  scene: SceneChunkManifestV2,
  options: BridgeSiteSceneOptions = {},
): Promise<BridgeSiteSceneController> {
  validateScene(pack, scene);
  const lease = await manager.acquireSite(pack, { ...(options.signal ? { signal: options.signal } : {}) });
  const rootGroup = new THREE.Group();
  rootGroup.name = scene.id;
  rootGroup.userData = {
    contentStatus: "prototype_geometry",
    productionAsset: false,
    disclosure: "Seed-derived bridge geometry; production art and performance approval are not claimed.",
  };
  const instances: InstanceResolution[] = [];
  const viewer = options.viewerPosition ?? new THREE.Vector3();

  try {
    for (const instance of scene.instances.filter(({ assetId }) => pack.dependencyIds.includes(assetId))) {
      const resolved = lease.resolveAsset(instance.assetId, instanceDistance(instance, viewer));
      resolved.scene.updateMatrixWorld(true);
      instances.push({ instance, root: resolved.scene, dependencyId: resolved.lod.dependencyId, lodLevel: resolved.lod.level, lodFallback: resolved.lodFallback });
    }

    const batches = new Map<string, InstanceResolution[]>();
    for (const resolved of instances) {
      const key = `${resolved.instance.assetId}\u0000${resolved.dependencyId}\u0000lod${resolved.lodLevel}`;
      const batch = batches.get(key);
      if (batch) batch.push(resolved); else batches.set(key, [resolved]);
    }

    let drawObjectCount = 0;
    const lodFallbackAssetIds = new Set<string>();
    for (const batch of batches.values()) {
      if (batch.some(({ lodFallback }) => lodFallback)) lodFallbackAssetIds.add(batch[0]!.instance.assetId);
      const template = batch[0]!.root;
      const templateMeshes: THREE.Mesh[] = [];
      template.traverse((object) => { if (object instanceof THREE.Mesh && !(object instanceof THREE.SkinnedMesh)) templateMeshes.push(object); });
      if (templateMeshes.length === 0) throw new Error(`Bridge asset ${batch[0]!.instance.assetId} has no static mesh to instance`);
      for (const [meshIndex, mesh] of templateMeshes.entries()) {
        const instanced = new THREE.InstancedMesh(mesh.geometry, mesh.material, batch.length);
        instanced.name = `${batch[0]!.instance.assetId}.mesh-${meshIndex}`;
        instanced.castShadow = mesh.castShadow;
        instanced.receiveShadow = mesh.receiveShadow;
        instanced.renderOrder = mesh.renderOrder;
        instanced.userData = { assetId: batch[0]!.instance.assetId, dependencyId: batch[0]!.dependencyId, lodLevel: batch[0]!.lodLevel, contentStatus: "prototype_geometry" };
        for (const [index, { instance }] of batch.entries()) {
          const matrix = transformMatrix(instance).multiply(mesh.matrixWorld);
          instanced.setMatrixAt(index, matrix);
        }
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingBox();
        instanced.computeBoundingSphere();
        rootGroup.add(instanced);
        drawObjectCount += 1;
      }
    }
    rootGroup.userData.lodFallbackAssetIds = Object.freeze([...lodFallbackAssetIds].sort());

    const worldDistanceToLocal = (distance: number): number => {
      rootGroup.updateWorldMatrix(true, false);
      const worldScale = rootGroup.getWorldScale(new THREE.Vector3());
      const smallestHorizontalScale = Math.min(Math.abs(worldScale.x), Math.abs(worldScale.z));
      if (!Number.isFinite(distance) || distance < 0 || smallestHorizontalScale <= 1e-9) throw new Error("Bridge collision/navigation query requires a finite distance and nonzero world scale");
      return distance / smallestHorizontalScale;
    };

    const isWorldPointBlocked = (worldPoint: THREE.Vector3, margin = 0, phaseMask = 1): boolean => {
      rootGroup.updateWorldMatrix(true, false);
      const point = rootGroup.worldToLocal(worldPoint.clone());
      const localMargin = worldDistanceToLocal(margin);
      return scene.colliders.some((collider) => {
        if (collider.walkable || (collider.phaseMask & phaseMask) === 0) return false;
        const dx = point.x - collider.transform.x;
        const dz = point.z - collider.transform.z;
        const cosine = Math.cos(collider.transform.yaw);
        const sine = Math.sin(collider.transform.yaw);
        const localX = cosine * dx + sine * dz;
        const localZ = -sine * dx + cosine * dz;
        if (collider.shape === "cylinder") return Math.hypot(localX, localZ) <= collider.radius + localMargin;
        return Math.abs(localX) <= collider.size[0] / 2 + localMargin && Math.abs(localZ) <= collider.size[2] / 2 + localMargin;
      });
    };

    const navigationNodeById = new Map(scene.navigation.nodes.map((node) => [node.id, node] as const));
    const navigationSegments = scene.navigation.edges.map((edge) => ({
      edge,
      from: navigationNodeById.get(edge.fromNodeId)!,
      to: navigationNodeById.get(edge.toNodeId)!,
    }));
    const isWorldPointNavigable = (worldPoint: THREE.Vector3, corridorRadius = 0): boolean => {
      if (scene.navigation.nodes.length === 0) return false;
      rootGroup.updateWorldMatrix(true, false);
      const point = rootGroup.worldToLocal(worldPoint.clone());
      const localCorridor = worldDistanceToLocal(corridorRadius);
      if (scene.navigation.nodes.some((node) => Math.hypot(point.x - node.transform.x, point.z - node.transform.z) <= node.radius + localCorridor)) return true;
      return navigationSegments.some(({ from, to }) => {
        const dx = to.transform.x - from.transform.x;
        const dz = to.transform.z - from.transform.z;
        const lengthSquared = dx * dx + dz * dz;
        const t = lengthSquared <= 1e-9 ? 0 : Math.max(0, Math.min(1, ((point.x - from.transform.x) * dx + (point.z - from.transform.z) * dz) / lengthSquared));
        const x = from.transform.x + dx * t;
        const z = from.transform.z + dz * t;
        const routeRadius = from.radius + (to.radius - from.radius) * t;
        return Math.hypot(point.x - x, point.z - z) <= routeRadius + localCorridor;
      });
    };
    const worldSpawn = (kind: "player" | "enemy"): THREE.Vector3 | null => {
      const anchor = scene.spawnAnchors.find((candidate) => candidate.kind === kind && (candidate.phaseMask & 1) !== 0);
      if (!anchor) return null;
      rootGroup.updateWorldMatrix(true, false);
      return rootGroup.localToWorld(new THREE.Vector3(anchor.transform.x, anchor.transform.y, anchor.transform.z));
    };

    let destroyed = false;
    return {
      group: rootGroup,
      lease,
      instanceCount: instances.length,
      drawObjectCount,
      colliderCount: scene.colliders.length,
      navigationNodeCount: scene.navigation.nodes.length,
      navigationEdgeCount: scene.navigation.edges.length,
      isWorldPointBlocked,
      isWorldPointNavigable,
      worldSpawn,
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        rootGroup.traverse((object) => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
        rootGroup.clear();
        lease.release();
      },
    };
  } catch (error) {
    rootGroup.traverse((object) => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
    rootGroup.clear();
    lease.release();
    throw error;
  }
}
