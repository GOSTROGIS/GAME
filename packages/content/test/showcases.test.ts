import assert from "node:assert/strict";
import test from "node:test";
import { BESTIARY_BY_ID } from "../src/bestiary.js";
import {
  SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS,
  SABLE_REACH_PROOF_NAVIGATION_CELLS,
  SHOWCASE_DROP_TABLES,
  validateEcologyProofContent,
} from "../src/showcases.js";

test("all 21 canonical ecology proofs resolve mechanics, habitat, routes, drops, and honest maturity", () => {
  assert.deepEqual(validateEcologyProofContent(), []);
  assert.equal(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.length, 21);
  assert.equal(SABLE_REACH_PROOF_NAVIGATION_CELLS.length, 7);
  const navigationById = new Map(SABLE_REACH_PROOF_NAVIGATION_CELLS.map((cell) => [cell.id, cell]));
  assert.equal(new Set(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.map(({ familyId }) => familyId)).size, 21);
  const dropIds = new Set(SHOWCASE_DROP_TABLES.map(({ id }) => id));
  for (const encounter of SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters) {
    const creature = BESTIARY_BY_ID.get(encounter.creatureId);
    assert.ok(creature, encounter.creatureId);
    assert.equal(encounter.mechanicHandlerId, creature.mechanicContract.handlerId);
    assert.ok(encounter.telegraphs[0]!.visual.length > 10);
    assert.ok(encounter.telegraphs[0]!.nonvisual.length > 10);
    assert.ok(encounter.dropTableIds.every((id) => dropIds.has(id)));
    assert.equal(encounter.habitat.reachable, true);
    const navigation = navigationById.get(encounter.habitat.navigationCellId);
    assert.ok(navigation, encounter.habitat.navigationCellId);
    assert.equal(navigation.siteId, encounter.siteId);
    assert.ok(navigation.nodes.length >= 4);
    assert.ok(navigation.links.length >= 4);
    assert.ok(navigation.colliders.length > 0);
    assert.equal(encounter.maturity.runtime_integrated, true);
    assert.equal(encounter.maturity.prototype_asset, true);
    assert.equal(encounter.maturity.production_asset, false);
    assert.equal(encounter.maturity.playtested, false);
  }
});
