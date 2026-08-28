import assert from "node:assert/strict";
import test from "node:test";
import {
  SABLE_REACH_BRIDGE_ASSETS, SABLE_REACH_BRIDGE_PACK_PLANS,
  buildBridgeRuntimeAssetPacks, validateBridgeAssetDefinitions,
  type GeneratedBridgeDependency,
} from "../src/bridgeAssets.js";

test("bridge authors exactly 96 substantial prototype-only derivatives", () => {
  assert.deepEqual(validateBridgeAssetDefinitions(), []);
  assert.equal(SABLE_REACH_BRIDGE_ASSETS.length, 96);
  assert.equal(SABLE_REACH_BRIDGE_ASSETS.filter(({ siteId }) => siteId === "site.hearthmere").length, 24);
  assert.ok(SABLE_REACH_BRIDGE_ASSETS.every((asset) => asset.topologyChanges.length >= 4 && asset.originalityReview.simpleRecolor === false));
  assert.ok(SABLE_REACH_BRIDGE_ASSETS.every((asset) => asset.maturity === "prototype_geometry" && !asset.strictProductionEligible));
  assert.ok(SABLE_REACH_BRIDGE_ASSETS.every((asset) => asset.runtimePath === `assets/3d/runtime/bridge/${asset.siteId.slice(5)}/${asset.slug}.glb`));
  assert.ok(SABLE_REACH_BRIDGE_ASSETS.every((asset) => asset.pivot.mode === "ground_center" && asset.pivot.offset.every((axis) => axis === 0)));
  assert.ok(SABLE_REACH_BRIDGE_ASSETS.every((asset) => asset.colliderProfile.height > 0 && (asset.colliderProfile.shape === "box" ? asset.colliderProfile.size?.every((axis) => axis > 0) : asset.colliderProfile.radius! > 0)));
});

test("non-Hearthmere packs use the locked 3/5/3/1 allocation", () => {
  for (const plan of SABLE_REACH_BRIDGE_PACK_PLANS.filter(({ siteId }) => siteId !== "site.hearthmere")) {
    const assets = SABLE_REACH_BRIDGE_ASSETS.filter(({ siteId }) => siteId === plan.siteId);
    assert.deepEqual(Object.fromEntries(["structure", "prop", "foliage", "landmark_traversal"].map((role) => [role, assets.filter((asset) => asset.role === role).length])), { structure: 3, prop: 5, foliage: 3, landmark_traversal: 1 });
  }
});

test("generated binaries materialize canonical closed packs with measured GPU accounting", () => {
  const dependencies: GeneratedBridgeDependency[] = SABLE_REACH_BRIDGE_ASSETS.map((asset, index) => ({
    id: asset.id, kind: "glb", path: asset.runtimePath, sha256: (index.toString(16).padStart(2, "0")).repeat(32), encodedBytes: 1_000 + index,
    gpuBytes: { vertex: 2_000, index: 500, textureMipChain: 0, total: 2_500 }, externalUris: [],
  }));
  const packs = buildBridgeRuntimeAssetPacks(dependencies);
  assert.equal(packs.length, 7);
  assert.equal(packs.flatMap(({ dependencies: closure }) => closure).length, 96);
  assert.ok(packs.every((pack) => pack.decodedGpuBytes === pack.dependencies.length * 2_500));
  assert.ok(packs.every((pack) => pack.dependencies.every(({ externalUris }) => externalUris.length === 0)));
  assert.throws(() => buildBridgeRuntimeAssetPacks(dependencies.slice(1)), /all 96/);
});
