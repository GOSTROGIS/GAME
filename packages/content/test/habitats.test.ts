import assert from "node:assert/strict";
import test from "node:test";
import { BESTIARY } from "../src/bestiary.js";
import { CREATURE_HABITAT_PLACEMENTS, validateCreatureHabitatPlacements } from "../src/habitats.js";

test("all 178 creatures resolve to viable route-reachable habitat and unique forms have one anchor", () => {
  assert.deepEqual(validateCreatureHabitatPlacements(), []);
  assert.equal(CREATURE_HABITAT_PLACEMENTS.length, 178);
  const uniqueCreatures = BESTIARY.filter(({ rank }) => rank === "boss" || rank === "miniboss");
  const uniquePlacements = CREATURE_HABITAT_PLACEMENTS.filter(({ uniqueAnchorId }) => uniqueAnchorId !== null);
  assert.equal(uniquePlacements.length, uniqueCreatures.length);
  assert.equal(new Set(uniquePlacements.map(({ uniqueAnchorId }) => uniqueAnchorId)).size, uniqueCreatures.length);
});
