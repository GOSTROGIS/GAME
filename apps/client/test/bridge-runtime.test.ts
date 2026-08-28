import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import type { RuntimeAssetDependencyV1, RuntimeAssetPackV1, SceneChunkManifestV2 } from "@hollow-march/shared";
import {
  AssetResidencyManager,
  assertSelfContainedGlb,
  calculateGpuResidencyBytes,
  createGltfDependencyLoader,
  runtimeDependencyUrl,
  selectDeterministicLod,
  type RuntimeDependencyLoader,
} from "../src/world/AssetResidencyManager.js";
import { bridgeRuntimeAssetUrl } from "../src/world/RuntimePackLoader.js";
import { createBridgeSiteScene } from "../src/showcase/BridgeSiteScene.js";

const SHA = "a".repeat(64);
const LIMITS = Object.freeze({ discreteGpuBytes: 268_435_456 as const, integratedGpuBytes: 100_663_296 as const });

function dependency(id: string, gpuBytes = 1024): RuntimeAssetDependencyV1 {
  const slug = id.split(".").at(-1)!;
  return Object.freeze({
    id,
    kind: "glb" as const,
    path: `assets/3d/runtime/bridge/test/${slug}.glb`,
    sha256: SHA,
    encodedBytes: 1,
    gpuBytes: Object.freeze({ vertex: gpuBytes, index: 0, textureMipChain: 0, total: gpuBytes }),
    externalUris: Object.freeze([]) as readonly [],
  });
}

function pack(id: string, dependencies: readonly RuntimeAssetDependencyV1[]): RuntimeAssetPackV1 {
  return Object.freeze({
    schemaVersion: 1 as const,
    id,
    siteId: `site.${id.split(".").at(-1)!}`,
    maturity: "prototype_geometry" as const,
    dependencyIds: Object.freeze(dependencies.map(({ id: dependencyId }) => dependencyId)),
    dependencies: Object.freeze([...dependencies]),
    decodedGpuBytes: dependencies.reduce((sum, item) => sum + item.gpuBytes.total, 0),
    encodedBytes: dependencies.reduce((sum, item) => sum + item.encodedBytes, 0),
    limits: LIMITS,
    lods: Object.freeze([
      Object.freeze({ level: 0 as const, maximumDistanceMeters: 28, triangleBudget: 12_000 }),
      Object.freeze({ level: 1 as const, maximumDistanceMeters: 64, triangleBudget: 4_000 }),
      Object.freeze({ level: 2 as const, maximumDistanceMeters: 160, triangleBudget: 1_200 }),
    ]),
    materialIds: Object.freeze(["material.test"]),
    provenance: Object.freeze({ sourceId: "slipcurve-sitelib" as const, authorizationId: "owner-authorized-cross-project-sitelib" as const, recipeIds: Object.freeze(dependencies.map(({ id: dependencyId }) => dependencyId)) }),
  });
}

function prototypeResource(seed = 1): { scene: THREE.Group } {
  const scene = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1 + seed * 0.001, 1, 1), new THREE.MeshBasicMaterial({ color: seed }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { scene };
}

function lodPrototypeResource(): { scene: THREE.Group } {
  const scene = new THREE.Group();
  for (const level of [0, 1, 2]) {
    const lod = new THREE.Group();
    lod.name = `LOD${level}`;
    lod.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1 + level * .1, 1), new THREE.MeshBasicMaterial({ color: level + 1 })));
    scene.add(lod);
  }
  return { scene };
}

function wait(milliseconds = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

test("canonical bridge paths become deploy-root URLs and reject traversal", () => {
  assert.equal(bridgeRuntimeAssetUrl("hollow-abbey", "rootbound-arch"), "/assets/3d/runtime/bridge/hollow-abbey/rootbound-arch.glb");
  assert.equal(runtimeDependencyUrl("assets/3d/runtime/bridge/hollow-abbey/rootbound-arch.glb"), "/assets/3d/runtime/bridge/hollow-abbey/rootbound-arch.glb");
  assert.throws(() => runtimeDependencyUrl("assets/../private.glb"), /Unsafe runtime dependency path/);
  assert.throws(() => runtimeDependencyUrl("assets/3d/runtime/bridge/%2e%2e/private.glb"), /Unsafe runtime dependency path/);
  assert.throws(() => runtimeDependencyUrl("assets/3d/runtime/bridge/site/asset.glb?steal=1"), /Unsafe runtime dependency path/);
  assert.throws(() => runtimeDependencyUrl("assets/3d/seeds/slipcurve/asset.glb"), /Unsafe runtime dependency path/);
});

function glbDocument(document: Record<string, unknown>): ArrayBuffer {
  const source = new TextEncoder().encode(JSON.stringify(document));
  const paddedLength = Math.ceil(source.length / 4) * 4;
  const buffer = new ArrayBuffer(20 + paddedLength);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20);
  bytes.set(source, 20);
  return buffer;
}

test("runtime GLBs are self-contained and redirects are refused before parsing", async () => {
  assert.doesNotThrow(() => assertSelfContainedGlb(glbDocument({ asset: { version: "2.0" }, buffers: [{ byteLength: 0 }] })));
  assert.throws(() => assertSelfContainedGlb(glbDocument({ asset: { version: "2.0" }, buffers: [{ uri: "https://evil.invalid/payload.bin" }] })), /forbidden external URI/);
  assert.throws(() => assertSelfContainedGlb(glbDocument({ asset: { version: "2.0" }, images: [{ uri: "data:image\/png;base64,AAAA" }] })), /forbidden external URI/);
  const redirectedFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(init?.redirect, "error");
    return { ok: true, status: 200, redirected: true, url: "https://evil.invalid/asset.glb", arrayBuffer: async () => new ArrayBuffer(0) } as Response;
  }) as typeof fetch;
  const loader = createGltfDependencyLoader(redirectedFetch);
  await assert.rejects(loader(dependency("bridge.asset.test.redirect"), new AbortController().signal), /redirected response/);
});

test("LOD selection is deterministic and the integrated profile steps down earlier", () => {
  const lods = [
    { level: 2, dependencyId: "asset.test", minDistanceMeters: 64.001 },
    { level: 0, dependencyId: "asset.test", minDistanceMeters: 0 },
    { level: 1, dependencyId: "asset.test", minDistanceMeters: 28.001 },
  ] as const;
  assert.equal(selectDeterministicLod(lods, 27.9999, "discrete").level, 0);
  assert.equal(selectDeterministicLod(lods, 28.0011, "discrete").level, 1);
  assert.equal(selectDeterministicLod(lods, 21, "integrated").level, 1);
  assert.equal(selectDeterministicLod(lods, 21, "integrated").level, 1);
});

test("GPU accounting counts shared decoded buffers and texture storage once", () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2]), 1));
  const texture = new THREE.DataTexture(new Uint8Array(16), 2, 2);
  texture.generateMipmaps = false;
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const left = new THREE.Group(); left.add(new THREE.Mesh(geometry, material));
  const right = new THREE.Group(); right.add(new THREE.Mesh(geometry, material));
  assert.equal(calculateGpuResidencyBytes([left, right]), 36 + 6 + 16);
  geometry.dispose(); material.dispose(); texture.dispose();
});

test("site leases coalesce loads, cap concurrency at four, and reference-count active closures", async () => {
  let active = 0;
  let maximum = 0;
  let calls = 0;
  const loader: RuntimeDependencyLoader = async (_dependency, signal) => {
    calls += 1; active += 1; maximum = Math.max(maximum, active);
    await wait(3);
    active -= 1;
    if (signal.aborted) throw new DOMException("cancelled", "AbortError");
    return prototypeResource(calls);
  };
  const dependencies = Array.from({ length: 10 }, (_, index) => dependency(`bridge.asset.test.asset-${index}`));
  const runtimePack = pack("bridge.pack.test", dependencies);
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: loader });
  const [first, second] = await Promise.all([manager.acquireSite(runtimePack), manager.acquireSite(runtimePack)]);
  assert.equal(calls, 10);
  assert.equal(maximum, 4);
  assert.equal(manager.getStats().maximumObservedConcurrentLoads, 4);
  assert.equal(manager.getStats().siteLeaseCounts["site.test"], 2);
  first.release();
  assert.equal(manager.getStats().activeLeaseCount, 1);
  manager.clearInactive();
  assert.equal(manager.getStats().loadedDependencyCount, 10, "active closure cannot be evicted");
  second.release();
  manager.clearInactive();
  assert.equal(manager.getStats().loadedDependencyCount, 0);
});

test("integrated capacity refusal protects an active closure without evicting it", async () => {
  const loader: RuntimeDependencyLoader = async () => prototypeResource();
  const firstPack = pack("bridge.pack.first", [dependency("bridge.asset.first.one", 60 * 1024 * 1024)]);
  const secondPack = pack("bridge.pack.second", [dependency("bridge.asset.second.one", 60 * 1024 * 1024)]);
  const manager = new AssetResidencyManager({ profile: "integrated", dependencyLoader: loader });
  const first = await manager.acquireSite(firstPack);
  await assert.rejects(manager.acquireSite(secondPack), /Active dependency closure would exceed integrated GPU budget/);
  assert.equal(manager.getStats().activeLeaseCount, 1);
  assert.ok(first.resolveAsset("bridge.asset.first.one", 0).scene);
  first.release();
  const second = await manager.acquireSite(secondPack);
  second.release();
  manager.clearInactive();
});

test("cancellation and failed site loads remove unpublished dependency resources", async () => {
  const waitingLoader: RuntimeDependencyLoader = (item, signal) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(prototypeResource(item.id.length)), 25);
    signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("cancelled", "AbortError")); }, { once: true });
  });
  const dependencies = Array.from({ length: 6 }, (_, index) => dependency(`bridge.asset.cancel.asset-${index}`));
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: waitingLoader });
  const controller = new AbortController();
  const acquisition = manager.acquireSite(pack("bridge.pack.cancel", dependencies), { signal: controller.signal });
  await wait(1);
  controller.abort();
  await assert.rejects(acquisition, { name: "AbortError" });
  await wait(1);
  assert.equal(manager.getStats().activeLeaseCount, 0);
  assert.equal(manager.getStats().loadedDependencyCount, 0);
  assert.equal(manager.getStats().loadingDependencyCount, 0);

  const failingLoader: RuntimeDependencyLoader = async (item, signal) => {
    if (item.id.endsWith("bad")) throw new Error("fixture failure");
    await wait(2);
    if (signal.aborted) throw new DOMException("cancelled", "AbortError");
    return prototypeResource();
  };
  const failureManager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: failingLoader });
  await assert.rejects(failureManager.acquireSite(pack("bridge.pack.failure", [dependency("bridge.asset.failure.good"), dependency("bridge.asset.failure.bad")])), /fixture failure/);
  await wait(1);
  assert.equal(failureManager.getStats().loadedDependencyCount, 0);
  assert.equal(failureManager.getStats().loadingDependencyCount, 0);
});

function sceneChunk(assetId: string, positions: readonly [number, number][] = [[0, 0], [2, 3], [4, 6]], withCollider = false, withNavigation = false): SceneChunkManifestV2 {
  const transform = (x: number, z: number) => Object.freeze({ x, y: 0, z, yaw: x * 0.1 });
  return Object.freeze({
    schemaVersion: 2 as const,
    id: "bridge.chunk.test.proof",
    siteId: "site.test",
    coordinateSpaceId: "test_local_meters",
    assetPackIds: Object.freeze(["bridge.pack.test"]),
    bounds: Object.freeze({ min: transform(0, 0), max: transform(100, 100) }),
    instances: Object.freeze(positions.map(([x, z], index) => Object.freeze({ id: `bridge.instance.test.${index}`, assetId, sourceAssetId: null, transform: transform(x, z), scale: Object.freeze([1, 1, 1] as const), phaseMask: 1, instanceGroupId: `instance-group.${assetId}` }))),
    colliders: Object.freeze(withCollider ? [Object.freeze({ id: "collider.bridge.instance.test.1", instanceId: "bridge.instance.test.1", transform: transform(2, 3), phaseMask: 1, collisionLayer: "static-world" as const, walkable: false, shape: "box" as const, size: Object.freeze([4, 3, 4] as const), radius: null, height: 3 })] : []),
    navigation: Object.freeze({ graphId: "nav.graph.test", hash: SHA, links: Object.freeze([]), nodes: Object.freeze(withNavigation ? [Object.freeze({ id: "nav.test.0", transform: transform(0, 0), radius: 1 }), Object.freeze({ id: "nav.test.1", transform: transform(10, 0), radius: 1 })] : []), edges: Object.freeze(withNavigation ? [Object.freeze({ id: "nav-edge.test.0", fromNodeId: "nav.test.0", toNodeId: "nav.test.1", bidirectional: true, cost: 10 })] : []) }),
    occluders: Object.freeze([]),
    lights: Object.freeze([]),
    volumes: Object.freeze([]),
    interactionAnchors: Object.freeze([]),
    spawnAnchors: Object.freeze(withNavigation ? [Object.freeze({ id: "spawn.test.player", kind: "player" as const, transform: transform(0, 0), radius: 1, phaseMask: 1 }), Object.freeze({ id: "spawn.test.enemy", kind: "enemy" as const, transform: transform(10, 0), radius: 1, phaseMask: 1 })] : []),
    legacy: null,
    maturity: "prototype_geometry" as const,
  });
}

test("bridge site scene consumes canonical transforms and batches repeated meshes", async () => {
  const assetId = "bridge.asset.test.instanced-stone";
  const runtimePack = pack("bridge.pack.test", [dependency(assetId)]);
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: async () => prototypeResource() });
  const controller = await createBridgeSiteScene(manager, runtimePack, sceneChunk(assetId));
  assert.equal(controller.instanceCount, 3);
  assert.equal(controller.drawObjectCount, 1);
  assert.equal(controller.group.userData.contentStatus, "prototype_geometry");
  const instanced = controller.group.children[0];
  assert.ok(instanced instanceof THREE.InstancedMesh);
  assert.equal(instanced.count, 3);
  assert.equal(manager.getStats().activeLeaseCount, 1);
  controller.destroy();
  assert.equal(manager.getStats().activeLeaseCount, 0);
  assert.equal(controller.group.children.length, 0);
  manager.clearInactive();
});

test("same-asset instances at three distances remain separated by selected LOD", async () => {
  const assetId = "bridge.asset.test.lod-stone";
  const runtimePack = pack("bridge.pack.test", [dependency(assetId)]);
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: async () => lodPrototypeResource() });
  const controller = await createBridgeSiteScene(manager, runtimePack, sceneChunk(assetId, [[5, 0], [40, 0], [100, 0]]));
  assert.equal(controller.drawObjectCount, 3);
  const lodLevels = controller.group.children.map(({ userData }) => userData.lodLevel).sort();
  assert.deepEqual(lodLevels, [0, 1, 2]);
  assert.ok(controller.group.children.every((child) => child instanceof THREE.InstancedMesh && child.count === 1));
  controller.destroy();
  manager.clearInactive();
});

test("dimensioned V2 scene colliders participate in runtime movement queries", async () => {
  const assetId = "bridge.asset.test.collision-stone";
  const runtimePack = pack("bridge.pack.test", [dependency(assetId)]);
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: async () => prototypeResource() });
  const controller = await createBridgeSiteScene(manager, runtimePack, sceneChunk(assetId, [[0, 0], [2, 3], [8, 8]], true));
  assert.equal(controller.colliderCount, 1);
  assert.equal(controller.isWorldPointBlocked(new THREE.Vector3(2, 0, 3), .2), true);
  assert.equal(controller.isWorldPointBlocked(new THREE.Vector3(20, 0, 20), .2), false);
  controller.group.scale.setScalar(.05);
  controller.group.position.set(10, 0, 20);
  controller.group.updateWorldMatrix(true, false);
  assert.equal(controller.isWorldPointBlocked(controller.group.localToWorld(new THREE.Vector3(7, 0, 3)), .2), true, "world-space clearance must survive presentation scaling");
  assert.equal(controller.isWorldPointBlocked(controller.group.localToWorld(new THREE.Vector3(9, 0, 3)), .2), false);
  controller.destroy();
  manager.clearInactive();
});

test("V2 nodes, edges, and spawn anchors constrain runtime travel after site scaling", async () => {
  const assetId = "bridge.asset.test.navigation-stone";
  const runtimePack = pack("bridge.pack.test", [dependency(assetId)]);
  const manager = new AssetResidencyManager({ profile: "discrete", dependencyLoader: async () => prototypeResource() });
  const controller = await createBridgeSiteScene(manager, runtimePack, sceneChunk(assetId, [[0, 0], [2, 3], [8, 8]], false, true));
  controller.group.scale.setScalar(.05);
  controller.group.position.set(10, 0, 20);
  controller.group.updateWorldMatrix(true, false);
  assert.equal(controller.navigationNodeCount, 2);
  assert.equal(controller.navigationEdgeCount, 1);
  assert.equal(controller.isWorldPointNavigable(controller.group.localToWorld(new THREE.Vector3(5, 0, 4.5)), .2), true);
  assert.equal(controller.isWorldPointNavigable(controller.group.localToWorld(new THREE.Vector3(5, 0, 6.5)), .2), false);
  assert.ok(controller.worldSpawn("player")!.distanceTo(controller.group.localToWorld(new THREE.Vector3(0, 0, 0))) < 1e-6);
  assert.ok(controller.worldSpawn("enemy")!.distanceTo(controller.group.localToWorld(new THREE.Vector3(10, 0, 0))) < 1e-6);
  controller.destroy();
  manager.clearInactive();
});
