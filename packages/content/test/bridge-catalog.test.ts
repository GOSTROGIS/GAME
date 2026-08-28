import assert from "node:assert/strict";
import test from "node:test";
import { records } from "../src/bridgeCatalog.js";

test("developer-only catalog resolves the complete canonical classification vocabulary", () => {
  assert.equal(records.length, 1_087);
  assert.equal(new Set(records.map(({ id }) => id)).size, 1_087);
  assert.deepEqual(
    Object.fromEntries(["accepted_seed", "quarantined", "rejected"].map((classification) => [classification, records.filter((record) => record.classification === classification).length])),
    { accepted_seed: 214, quarantined: 768, rejected: 105 },
  );
});
