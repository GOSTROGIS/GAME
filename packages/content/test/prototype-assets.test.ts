import assert from "node:assert/strict";
import test from "node:test";
import { SABLE_REACH_PROTOTYPE_ASSETS, validatePrototypeCreatureAssets } from "../src/prototypeAssets.js";

test("21 family and seven location prototypes are budgeted and do not impersonate production models", () => {
  assert.deepEqual(validatePrototypeCreatureAssets(), []);
  assert.equal(SABLE_REACH_PROTOTYPE_ASSETS.assets.length, 21);
  assert.equal(SABLE_REACH_PROTOTYPE_ASSETS.locationAssets.length, 7);
  assert.equal(SABLE_REACH_PROTOTYPE_ASSETS.budgets.productionAssetEquivalent, false);
  assert.equal(SABLE_REACH_PROTOTYPE_ASSETS.maturity.productionAsset, false);
  assert.equal(SABLE_REACH_PROTOTYPE_ASSETS.maturity.playtested, false);
});
