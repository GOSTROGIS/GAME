import assert from "node:assert/strict";
import test from "node:test";
import {
  HEARTHMERE_RUNTIME_PROJECTION,
  findNavigationPath,
  resolveActivePhaseIds,
  resolveAssetRuntimeRecipe,
  resolveInstanceRuntimeRecipe,
  selectRuntimeInstances,
  validateWalkableDestination,
  validateWalkablePath,
} from "../src/runtime.js";

test("canonical actor and interactable transforms preserve the four-metre legacy mapping", () => {
  const runtime = HEARTHMERE_RUNTIME_PROJECTION;
  assert.deepEqual(runtime.actors.player.transform.position, [28, 0, 16]);

  const npcs = runtime.actorsBySpawnId;
  assert.deepEqual(npcs["npc.maela-voss"]?.transform.position, [32, 0, 16]);
  assert.deepEqual(npcs["npc.torren-vale"]?.transform.position, [36, 0, 20]);
  assert.deepEqual(npcs["npc.ysra-pell"]?.transform.position, [20, 0, 28]);

  const enemies = runtime.actorsBySpawnId;
  assert.deepEqual(enemies["enemy.ash-husk"]?.transform.position, [24, 0, 32]);
  assert.deepEqual(enemies["enemy.ledger-crawler"]?.transform.position, [20, 0, 32]);

  const interactables = runtime.interactablesBySpawnId;
  assert.deepEqual(interactables["landmark.hearthmere-square"]?.transform.position, [28, 0, 20]);
  assert.deepEqual(interactables["landmark.old-vigil-shrine"]?.transform.position, [16, 0, 28]);
  assert.equal(interactables["landmark.old-vigil-shrine"]?.recipeId, "hm.structure.vigil-shrine-old");
});

test("restored and unrestored personal phases select exactly one ledger presentation", () => {
  const unrestored = selectRuntimeInstances();
  assert.ok(unrestored.some(({ id }) => id === "instance.clay-rack-unrestored"));
  assert.ok(!unrestored.some(({ id }) => id === "instance.clay-rack-restored"));

  const restored = selectRuntimeInstances(["ember-ledger-restored"]);
  assert.ok(restored.some(({ id }) => id === "instance.clay-rack-restored"));
  assert.ok(!restored.some(({ id }) => id === "instance.clay-rack-unrestored"));
  assert.ok(resolveActivePhaseIds(["ember-ledger-restored"]).has("public"));

  assert.throws(
    () => resolveActivePhaseIds(["ember-ledger-restored", "ember-ledger-unrestored"]),
    /Mutually exclusive/,
  );
});

test("navigation spans all nine cells and rejects collider destinations and segments", () => {
  const path = findNavigationPath([28, 0, 16], [80, 0, 80]);
  assert.equal(path.valid, true);
  assert.equal(path.code, "path_found");
  assert.equal(path.cellIds[0], "nav.hm.00");
  assert.equal(path.cellIds.at(-1), "nav.hm.22");
  assert.ok(path.cellIds.length >= 5);
  assert.equal(path.linkIds.length, path.cellIds.length - 1);
  assert.equal(validateWalkablePath(path.waypoints).valid, true, "canonical cross-shard portal corridor must clear declared colliders");

  const shrine = validateWalkableDestination([16, 0, 28]);
  assert.equal(shrine.valid, false);
  assert.equal(shrine.code, "blocked_by_collider");
  assert.equal(shrine.colliderId, "collider.shrine-old");

  const outside = validateWalkableDestination([96, 0, 20]);
  assert.equal(outside.code, "outside_world");

  const crossingHouse = validateWalkablePath([[1, 0, 9], [14, 0, 9]]);
  assert.equal(crossingHouse.valid, false);
  assert.equal(crossingHouse.code, "blocked_segment");
});

test("every runtime instance resolves to an honest stable-ID asset recipe", () => {
  const runtime = HEARTHMERE_RUNTIME_PROJECTION;
  assert.equal(runtime.prototypeContentPresent, true);
  for (const instance of runtime.instances) {
    const recipe = resolveInstanceRuntimeRecipe(instance.id);
    assert.ok(recipe, `No recipe for ${instance.id}`);
    assert.equal(recipe.assetId, instance.assetId);
    assert.equal(recipe.status, instance.status);
    assert.equal(recipe.delivery, "procedural");
    assert.ok(recipe.generatorId);
    assert.match(recipe.productionTarget.runtimePath, /^assets\/3d\/runtime\//);
  }

  const house = resolveAssetRuntimeRecipe("hm.structure.hold-house-small");
  assert.equal(house?.generatorId, "structure.procedural.v1");
  assert.equal(house?.status, "prototype_geometry");
  assert.deepEqual(house?.parameters.footprint, [9, 7]);
  assert.equal(resolveAssetRuntimeRecipe("hm.missing"), null);
  assert.equal(resolveInstanceRuntimeRecipe("instance.missing"), null);
  assert.equal(Object.isFrozen(runtime), true);
  assert.equal(Object.isFrozen(runtime.actors.player.transform.position), true);
});
