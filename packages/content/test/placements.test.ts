import assert from "node:assert/strict";
import test from "node:test";
import {
  SABLE_REACH_PLACEMENTS,
  SABLE_REACH_PLACEMENT_BY_ID,
  validateSableReachPlacements,
} from "../src/placements.js";

test("stable legacy content uses explicit site placements with preserved Hearthmere coordinates", () => {
  assert.deepEqual(validateSableReachPlacements(), []);
  assert.equal(SABLE_REACH_PLACEMENTS.length, 70);
  assert.deepEqual(SABLE_REACH_PLACEMENT_BY_ID.get("maela_voss")?.localCoordinate, [32, 0, 16]);
  assert.deepEqual(SABLE_REACH_PLACEMENT_BY_ID.get("torren_vale")?.localCoordinate, [36, 0, 20]);
  assert.deepEqual(SABLE_REACH_PLACEMENT_BY_ID.get("ysra_pell")?.localCoordinate, [20, 0, 28]);
  assert.ok(SABLE_REACH_PLACEMENTS.every((item) => item.note.includes("global legacy-grid transform") || item.note.includes("assigned explicitly")));
});
