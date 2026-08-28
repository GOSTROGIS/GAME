import assert from "node:assert/strict";
import test from "node:test";
import { adaptLegacySceneChunkManifest, runtimePackGpuBytes, type RuntimeAssetDependencyV1, type SceneChunkManifest } from "../src/index.js";

const ORIGIN = Object.freeze({ x: 0, y: 0, z: 0, yaw: 0 });

test("legacy chunk adapter is one-way and preserves IDs, transforms, and phase masks", () => {
  const legacy: SceneChunkManifest = {
    id: "legacy.chunk",
    regionId: "legacy.region",
    grid: { x: 0, z: 0 },
    bounds: { min: ORIGIN, max: { x: 32, y: 16, z: 32, yaw: 0 } },
    instances: [{ id: "stable.instance", assetId: "stable.asset", transform: { x: 8, y: 1, z: 12, yaw: 0.5 }, phaseMask: 7 }],
    colliders: [{ id: "stable.collider", assetId: "stable.instance", transform: { x: 8, y: 2, z: 12, yaw: 0.5 }, shape: "box", size: [4, 4, 6], walkable: false }],
    navigation: { graphPath: "nav/legacy.json", hash: "a".repeat(64), links: [] },
    occluders: [],
    lights: [],
    volumes: [],
    interactionAnchors: [{ id: "stable.anchor", transform: { x: 9, y: 0, z: 12, yaw: 0 }, radius: 2, phaseMask: 7 }],
    spawnAnchors: [],
  };
  const adapted = adaptLegacySceneChunkManifest(legacy, "site.test", ["pack.test"]);
  assert.equal(adapted.schemaVersion, 2);
  assert.equal(adapted.instances[0]?.id, legacy.instances[0]?.id);
  assert.deepEqual(adapted.instances[0]?.transform, legacy.instances[0]?.transform);
  assert.equal(adapted.instances[0]?.phaseMask, 7);
  assert.equal(adapted.interactionAnchors[0]?.id, "stable.anchor");
  assert.equal(adapted.interactionAnchors[0]?.instanceId, null);
  assert.deepEqual(adapted.colliders[0], {
    id: "stable.collider",
    instanceId: "stable.instance",
    transform: { x: 8, y: 2, z: 12, yaw: 0.5 },
    phaseMask: 1,
    collisionLayer: "static-world",
    walkable: false,
    shape: "box",
    size: [4, 4, 6],
    radius: null,
    height: 4,
  });
  assert.deepEqual(adapted.navigation.nodes, []);
  assert.deepEqual(adapted.navigation.edges, []);
  assert.equal(adapted.legacy?.preservesCoordinates, true);
});

test("GPU residency counts shared dependency IDs once and uses decoded storage", () => {
  const dependency = (id: string, total: number): RuntimeAssetDependencyV1 => ({
    id, kind: "glb", path: `${id}.glb`, sha256: "b".repeat(64), encodedBytes: 10,
    gpuBytes: { vertex: total - 3, index: 2, textureMipChain: 1, total }, externalUris: [],
  });
  assert.equal(runtimePackGpuBytes([dependency("a", 100), dependency("a", 100), dependency("b", 40)]), 140);
});
