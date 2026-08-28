import assert from "node:assert/strict";
import test from "node:test";
import { HEARTHMERE_SCENE } from "../src/index.js";
import { SABLE_REACH_PROOF_SITE_SCENES, SABLE_REACH_WORLD_CELL_SCENE_REFS, validateBridgeSiteScenes } from "../src/siteScenes.js";

test("seven proof scenes coexist with 761 explicitly data-only world cells", () => {
  assert.deepEqual(validateBridgeSiteScenes(), []);
  assert.equal(SABLE_REACH_PROOF_SITE_SCENES.length, 7);
  assert.equal(SABLE_REACH_WORLD_CELL_SCENE_REFS.length, 768);
  assert.equal(SABLE_REACH_WORLD_CELL_SCENE_REFS.filter(({ sceneRef }) => sceneRef === null).length, 761);
});

test("Hearthmere V2 adapter preserves all legacy instance identities and coordinates", () => {
  const source = HEARTHMERE_SCENE.chunks.flatMap(({ instances }) => instances);
  const adapted = SABLE_REACH_PROOF_SITE_SCENES.find(({ siteId }) => siteId === "site.hearthmere")!.chunks.flatMap(({ instances }) => instances);
  assert.equal(source.length, 51);
  assert.equal(adapted.length, source.length);
  for (const instance of source) {
    const result = adapted.find(({ id }) => id === instance.id)!;
    assert.deepEqual(result.transform, { x: instance.transform.position[0], y: instance.transform.position[1], z: instance.transform.position[2], yaw: instance.transform.rotation[1] });
  }
  const sourceColliders = HEARTHMERE_SCENE.chunks.flatMap(({ colliders }) => colliders);
  const adaptedColliders = SABLE_REACH_PROOF_SITE_SCENES.find(({ siteId }) => siteId === "site.hearthmere")!.chunks.flatMap(({ colliders }) => colliders);
  assert.equal(adaptedColliders.length, sourceColliders.length);
  for (const collider of sourceColliders) {
    const result = adaptedColliders.find(({ id }) => id === collider.id)!;
    assert.equal(result.instanceId, collider.instanceId);
    assert.equal(result.shape, collider.shape);
    assert.deepEqual(result.transform, { x: collider.center[0], y: collider.center[1], z: collider.center[2], yaw: 0 });
    if (collider.shape === "box") assert.deepEqual(result.shape === "box" ? result.size : null, collider.size);
    else {
      assert.equal(result.shape === "cylinder" ? result.radius : null, collider.radius);
      assert.equal(result.height, collider.height);
    }
  }
});

test("each new proof site is deterministically instanced through its active pack only", () => {
  for (const scene of SABLE_REACH_PROOF_SITE_SCENES.filter(({ siteId }) => siteId !== "site.hearthmere")) {
    const instances = scene.chunks.flatMap(({ instances }) => instances);
    assert.equal(instances.length, 72);
    assert.equal(new Set(instances.map(({ assetId }) => assetId)).size, 12);
    assert.equal(new Set(instances.map(({ instanceGroupId }) => instanceGroupId)).size, 12);
    assert.deepEqual(scene.chunks[0]?.assetPackIds, [scene.packId]);
    const chunk = scene.chunks[0]!;
    assert.equal(chunk.colliders.length, instances.length);
    assert.deepEqual(new Set(chunk.colliders.map(({ instanceId }) => instanceId)), new Set(instances.map(({ id }) => id)));
    assert.ok(chunk.colliders.every((collider) => collider.height > 0 && (collider.shape === "box" ? collider.size.every((axis) => axis > 0) : collider.radius > 0)));
    assert.equal(chunk.navigation.nodes?.length, 8);
    assert.ok((chunk.navigation.edges?.length ?? 0) >= 7);
    assert.deepEqual(chunk.spawnAnchors.find(({ kind }) => kind === "player")?.transform, chunk.navigation.nodes[0]?.transform);
    assert.deepEqual(chunk.spawnAnchors.find(({ kind }) => kind === "enemy")?.transform, chunk.navigation.nodes.at(-1)?.transform);
    const landmark = chunk.interactionAnchors[0]!;
    assert.ok(landmark.instanceId);
    assert.deepEqual(landmark.transform, instances.find(({ id }) => id === landmark.instanceId)?.transform);
  }
});

test("six proof-site layouts and navigation graphs are spatially distinct", () => {
  const scenes = SABLE_REACH_PROOF_SITE_SCENES.filter(({ siteId }) => siteId !== "site.hearthmere");
  const placementSignatures = scenes.map(({ chunks }) => chunks.flatMap(({ instances }) => instances).map(({ transform }) => [transform.x, transform.y, transform.z]));
  const navigationSignatures = scenes.map(({ chunks }) => chunks.flatMap(({ navigation }) => navigation.nodes ?? []).map(({ transform }) => [transform.x, transform.y, transform.z]));
  assert.equal(new Set(placementSignatures.map((signature) => JSON.stringify(signature))).size, 6);
  assert.equal(new Set(navigationSignatures.map((signature) => JSON.stringify(signature))).size, 6);
});
